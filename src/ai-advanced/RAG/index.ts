/**
 * PowerScript Advanced AI Systems - RAG Module Index
 * 
 * Main entry point for Retrieval-Augmented Generation (RAG) system
 * Exports all RAG-related classes and interfaces
 */

// Vector Database
export {
  VectorDatabase,
  Vector,
  VectorMetadata,
  VectorSearchResult,
  VectorSearchOptions,
  VectorDatabaseConfig,
  VectorDatabaseStats,
  MemoryVectorDatabase
} from './VectorDatabase';

// Embedding Service
export {
  EmbeddingService,
  EmbeddingModel,
  EmbeddingRequest,
  EmbeddingBatchRequest,
  EmbeddingResponse,
  EmbeddingBatchResponse,
  EmbeddingServiceConfig,
  EmbeddingCache,
  MemoryEmbeddingCache
} from './EmbeddingService';

// Document Chunker
export {
  DocumentChunker,
  Document,
  DocumentChunk,
  ChunkingStrategy,
  ChunkingOptions,
  ChunkingStats
} from './DocumentChunker';

// RAG System
export {
  RAGSystem,
  RAGConfig,
  RetrievalOptions,
  GenerationOptions,
  RAGQuery,
  RAGResponse,
  IndexingProgress
} from './RAGSystem';

// Semantic Search
export {
  SemanticSearch,
  SearchQuery,
  SearchOptions,
  SearchResult,
  SearchResponse,
  QueryExpansion
} from './SemanticSearch';

// Import types for internal use
import { RAGSystem } from './RAGSystem';
import { MemoryVectorDatabase } from './VectorDatabase';
import { EmbeddingService } from './EmbeddingService';
import { DocumentChunker, Document, DocumentChunk } from './DocumentChunker';
import { SemanticSearch } from './SemanticSearch';
import { VectorDatabase } from './VectorDatabase';

/**
 * Create a complete RAG system with default configurations
 */
export async function createRAGSystem(config: {
  dimension?: number;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}): Promise<RAGSystem> {
  const {
    dimension = 1536,
    embeddingModel = 'text-embedding-ada-002',
    chunkSize = 1000,
    chunkOverlap = 200
  } = config;

  // Initialize vector database
  const vectorDatabase = new MemoryVectorDatabase({
    type: 'memory',
    dimension,
    metric: 'cosine'
  });

  // Initialize embedding service
  const embeddingService = new EmbeddingService({
    defaultModel: embeddingModel,
    enableCaching: true,
    batchSize: 50
  });

  // Initialize document chunker
  const documentChunker = new DocumentChunker();
  const chunkingOptions = DocumentChunker.createDefaultOptions(chunkSize, chunkOverlap);

  // Create RAG system
  const ragSystem = new RAGSystem({
    vectorDatabase,
    embeddingService,
    documentChunker,
    chunkingOptions,
    retrievalOptions: {
      topK: 5,
      minSimilarity: 0.7,
      diversityThreshold: 0.8,
      rerankingEnabled: false
    },
    generationOptions: {
      maxTokens: 1000,
      temperature: 0.7,
      includeContext: true,
      contextLength: 4000
    }
  });

  // Initialize the system
  await ragSystem.initialize();

  return ragSystem;
}

/**
 * Create a semantic search system
 */
export function createSemanticSearch(
  embeddingService: EmbeddingService,
  vectorDatabase: VectorDatabase
): SemanticSearch {
  return new SemanticSearch(embeddingService, vectorDatabase);
}

/**
 * Utility functions for RAG operations
 */
export class RAGUtils {
  /**
   * Split text into sentences
   */
  static splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  /**
   * Split text into paragraphs
   */
  static splitIntoParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }

  /**
   * Clean and normalize text
   */
  static normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[^\w\s.,!?;:()-]/g, '');
  }

  /**
   * Calculate text statistics
   */
  static getTextStats(text: string): {
    characters: number;
    words: number;
    sentences: number;
    paragraphs: number;
  } {
    return {
      characters: text.length,
      words: text.split(/\s+/).filter(w => w.length > 0).length,
      sentences: this.splitIntoSentences(text).length,
      paragraphs: this.splitIntoParagraphs(text).length
    };
  }

  /**
   * Generate document ID from content
   */
  static generateDocumentId(content: string, source?: string): string {
    const hash = this._simpleHash(content);
    const timestamp = Date.now();
    return `doc_${hash}_${timestamp}${source ? `_${this._simpleHash(source)}` : ''}`;
  }

  /**
   * Simple hash function for generating IDs
   */
  private static _simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate document format
   */
  static validateDocument(doc: any): doc is Document {
    return (
      typeof doc === 'object' &&
      typeof doc.id === 'string' &&
      typeof doc.text === 'string' &&
      typeof doc.metadata === 'object'
    );
  }

  /**
   * Validate chunk format
   */
  static validateChunk(chunk: any): chunk is DocumentChunk {
    return (
      typeof chunk === 'object' &&
      typeof chunk.id === 'string' &&
      typeof chunk.text === 'string' &&
      typeof chunk.metadata === 'object' &&
      typeof chunk.metadata.source === 'string' &&
      typeof chunk.metadata.chunkIndex === 'number'
    );
  }
}

/**
 * Default configurations for various use cases
 */
export const RAGPresets = {
  /**
   * Fast retrieval with lower accuracy
   */
  FAST: {
    dimension: 768,
    embeddingModel: 'text-embedding-ada-002',
    chunkSize: 500,
    chunkOverlap: 50,
    topK: 3,
    minSimilarity: 0.6
  },

  /**
   * Balanced performance and accuracy
   */
  BALANCED: {
    dimension: 1536,
    embeddingModel: 'text-embedding-ada-002',
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 5,
    minSimilarity: 0.7
  },

  /**
   * High accuracy with more comprehensive retrieval
   */
  ACCURATE: {
    dimension: 1536,
    embeddingModel: 'text-embedding-3-large',
    chunkSize: 1500,
    chunkOverlap: 300,
    topK: 10,
    minSimilarity: 0.75
  },

  /**
   * Research-focused with extensive context
   */
  RESEARCH: {
    dimension: 3072,
    embeddingModel: 'text-embedding-3-large',
    chunkSize: 2000,
    chunkOverlap: 400,
    topK: 15,
    minSimilarity: 0.7
  }
} as const;