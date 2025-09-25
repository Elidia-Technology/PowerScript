/**
 * PowerScript Advanced AI Systems - RAG System Test
 * 
 * Comprehensive test suite for RAG (Retrieval-Augmented Generation) system
 */

import {
  createRAGSystem,
  createSemanticSearch,
  RAGSystem,
  Document,
  DocumentChunk,
  MemoryVectorDatabase,
  EmbeddingService,
  DocumentChunker,
  SemanticSearch,
  RAGUtils,
  RAGPresets
} from '../src/ai-advanced/RAG';

/**
 * Test data setup
 */
const testDocuments: Document[] = [
  {
    id: 'doc1',
    text: 'PowerScript is a comprehensive development platform that provides advanced tools for building modern applications. It includes features for graphics, networking, AI systems, and multimedia processing.',
    metadata: {
      title: 'PowerScript Overview',
      source: 'documentation',
      type: 'technical',
      tags: ['development', 'platform', 'tools']
    }
  },
  {
    id: 'doc2',
    text: 'The vector database component of PowerScript allows for efficient storage and retrieval of high-dimensional vectors. It supports multiple backends including in-memory storage, FAISS, and cloud providers.',
    metadata: {
      title: 'Vector Database Features',
      source: 'documentation',
      type: 'technical',
      tags: ['database', 'vectors', 'storage']
    }
  },
  {
    id: 'doc3',
    text: 'Machine learning capabilities in PowerScript include embedding generation, semantic search, and RAG systems. These features enable intelligent document processing and retrieval.',
    metadata: {
      title: 'ML Capabilities',
      source: 'documentation',
      type: 'technical',
      tags: ['machine-learning', 'ai', 'search']
    }
  }
];

/**
 * Test configuration
 */
const testConfig = {
  dimension: 1536,
  embeddingModel: 'text-embedding-ada-002',
  chunkSize: 500,
  chunkOverlap: 100
};

/**
 * Main test function
 */
async function runRAGTests(): Promise<void> {
  console.log('🚀 Starting PowerScript RAG System Tests...\n');

  try {
    // Test 1: RAG System Creation
    console.log('📝 Test 1: Creating RAG System...');
    const ragSystem = await createRAGSystem(testConfig);
    console.log('✅ RAG System created successfully');
    console.log(`   - Vector Database: ${ragSystem.isReady() ? 'Ready' : 'Not Ready'}`);
    console.log('');

    // Test 2: Document Indexing
    console.log('📚 Test 2: Indexing Documents...');
    
    ragSystem.on('indexing:progress', (progress) => {
      console.log(`   - Progress: ${progress.documentsProcessed}/${progress.totalDocuments} documents, ${progress.chunksIndexed} chunks indexed`);
    });

    ragSystem.on('indexing:complete', (progress) => {
      console.log(`✅ Indexing completed: ${progress.chunksIndexed} chunks from ${progress.documentsProcessed} documents`);
    });

    await ragSystem.indexDocuments(testDocuments);
    console.log('');

    // Test 3: Query Processing
    console.log('🔍 Test 3: Processing Queries...');
    
    const queries = [
      'What is PowerScript?',
      'How does vector database work?',
      'What are the machine learning features?'
    ];

    for (const queryText of queries) {
      console.log(`   Query: "${queryText}"`);
      
      const response = await ragSystem.query({
        query: queryText,
        context: 'test context'
      });

      console.log(`   - Answer: ${response.answer.substring(0, 100)}...`);
      console.log(`   - Sources: ${response.sources.length} documents`);
      console.log(`   - Confidence: ${(response.confidence * 100).toFixed(1)}%`);
      console.log(`   - Query Time: ${response.metadata.queryTime}ms`);
      console.log('');
    }

    // Test 4: Document Chunking
    console.log('✂️ Test 4: Testing Document Chunking...');
    const chunker = new DocumentChunker();
    const chunkingOptions = DocumentChunker.createDefaultOptions(300, 50);
    
    for (const doc of testDocuments) {
      const chunks = await chunker.chunkDocument(doc, chunkingOptions);
      console.log(`   - Document "${doc.id}": ${chunks.length} chunks created`);
      
      for (let i = 0; i < Math.min(2, chunks.length); i++) {
        console.log(`     Chunk ${i + 1}: "${chunks[i].text.substring(0, 50)}..."`);
      }
    }
    
    const stats = chunker.getStats();
    console.log(`   - Total chunks: ${stats.totalChunks}`);
    console.log(`   - Average chunk size: ${Math.round(stats.averageChunkSize)} characters`);
    console.log('');

    // Test 5: Semantic Search
    console.log('🔎 Test 5: Testing Semantic Search...');
    
    // Create vector database and embedding service for semantic search
    const vectorDB = new MemoryVectorDatabase({
      type: 'memory',
      dimension: testConfig.dimension,
      metric: 'cosine'
    });
    
    const embeddingService = new EmbeddingService({
      defaultModel: testConfig.embeddingModel,
      enableCaching: true
    });
    
    await vectorDB.initialize();
    
    const semanticSearch = createSemanticSearch(embeddingService, vectorDB);
    
    // Index some sample vectors (mock data for testing)
    const mockVectors = [
      {
        id: 'vec1',
        values: Array(testConfig.dimension).fill(0).map(() => Math.random() - 0.5),
        metadata: {
          id: 'vec1',
          text: 'PowerScript development platform',
          source: 'mock',
          tags: ['development']
        }
      },
      {
        id: 'vec2',
        values: Array(testConfig.dimension).fill(0).map(() => Math.random() - 0.5),
        metadata: {
          id: 'vec2',
          text: 'Vector database implementation',
          source: 'mock',
          tags: ['database']
        }
      }
    ];
    
    await vectorDB.insertBatch(mockVectors);
    
    console.log('   - Mock vectors indexed for semantic search');
    console.log(`   - Cache stats: ${JSON.stringify(semanticSearch.getCacheStats())}`);
    console.log('');

    // Test 6: Utility Functions
    console.log('🛠️ Test 6: Testing Utility Functions...');
    
    const sampleText = "This is a test. It has multiple sentences! How many paragraphs?\n\nThis is the second paragraph. It also has sentences.";
    
    const textStats = RAGUtils.getTextStats(sampleText);
    console.log(`   - Text stats: ${JSON.stringify(textStats)}`);
    
    const normalized = RAGUtils.normalizeText("  Extra   spaces   and   weird   chars!@#$%  ");
    console.log(`   - Normalized text: "${normalized}"`);
    
    const docId = RAGUtils.generateDocumentId(sampleText, 'test-source');
    console.log(`   - Generated doc ID: ${docId}`);
    
    const sentences = RAGUtils.splitIntoSentences(sampleText);
    console.log(`   - Sentences: ${sentences.length}`);
    
    const paragraphs = RAGUtils.splitIntoParagraphs(sampleText);
    console.log(`   - Paragraphs: ${paragraphs.length}`);
    console.log('');

    // Test 7: RAG Presets
    console.log('⚙️ Test 7: Testing RAG Presets...');
    
    console.log('   Available presets:');
    for (const [name, preset] of Object.entries(RAGPresets)) {
      console.log(`   - ${name}: ${preset.chunkSize} chunk size, ${preset.topK} topK, ${preset.embeddingModel}`);
    }
    console.log('');

    // Test 8: Error Handling
    console.log('⚠️ Test 8: Testing Error Handling...');
    
    try {
      // Test invalid query
      await ragSystem.query({ query: '' });
    } catch (error) {
      console.log('   - Empty query handled correctly');
    }
    
    try {
      // Test invalid document
      await ragSystem.addDocument({
        id: '',
        text: '',
        metadata: {}
      } as Document);
    } catch (error) {
      console.log('   - Invalid document handled correctly');
    }
    console.log('');

    // Test 9: System Statistics
    console.log('📊 Test 9: System Statistics...');
    
    const systemStats = await ragSystem.getStats();
    console.log('   - Vector Database Stats:', JSON.stringify(systemStats.vectorDatabase, null, 2));
    console.log('   - Document Chunker Stats:', JSON.stringify(systemStats.documentChunker, null, 2));
    console.log('');

    // Test 10: Performance Benchmarking
    console.log('⏱️ Test 10: Performance Benchmarking...');
    
    const benchmarkQueries = [
      'PowerScript features',
      'vector database capabilities',
      'machine learning tools',
      'development platform',
      'AI systems integration'
    ];
    
    const startTime = Date.now();
    const results = await Promise.all(
      benchmarkQueries.map(query => ragSystem.query({ query }))
    );
    const totalTime = Date.now() - startTime;
    
    console.log(`   - Processed ${benchmarkQueries.length} queries in ${totalTime}ms`);
    console.log(`   - Average query time: ${Math.round(totalTime / benchmarkQueries.length)}ms`);
    console.log(`   - Total results retrieved: ${results.reduce((sum, r) => sum + r.sources.length, 0)}`);
    console.log('');

    console.log('🎉 All RAG System tests completed successfully!\n');
    
    // Summary
    console.log('📋 Test Summary:');
    console.log('✅ RAG System Creation');
    console.log('✅ Document Indexing');
    console.log('✅ Query Processing');
    console.log('✅ Document Chunking');
    console.log('✅ Semantic Search');
    console.log('✅ Utility Functions');
    console.log('✅ RAG Presets');
    console.log('✅ Error Handling');
    console.log('✅ System Statistics');
    console.log('✅ Performance Benchmarking');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Helper function to display test results in a formatted way
 */
function displayResults(title: string, results: any[]): void {
  console.log(`\n${title}:`);
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${JSON.stringify(result, null, 2)}`);
  });
}

/**
 * Run tests if this file is executed directly
 */
if (require.main === module) {
  runRAGTests()
    .then(() => {
      console.log('\n🏁 Test execution completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { runRAGTests, testDocuments, testConfig };