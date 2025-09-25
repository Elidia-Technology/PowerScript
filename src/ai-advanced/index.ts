/**
 * PowerScript Advanced AI Systems - Main Index
 * 
 * Complete AI module with RAG capabilities, embeddings, and semantic search
 * This is Module 21 of the PowerScript platform
 */

// Export RAG system components
export * from './RAG';

// Re-export key classes for convenience
export {
  RAGSystem,
  VectorDatabase,
  MemoryVectorDatabase,
  EmbeddingService,
  DocumentChunker,
  SemanticSearch,
  createRAGSystem,
  createSemanticSearch,
  RAGUtils,
  RAGPresets
} from './RAG';

/**
 * PowerScript Advanced AI Systems version
 */
export const AI_ADVANCED_VERSION = '1.0.0';

/**
 * Module information
 */
export const AI_ADVANCED_INFO = {
  name: 'PowerScript Advanced AI Systems',
  version: AI_ADVANCED_VERSION,
  moduleNumber: 21,
  description: 'Comprehensive AI capabilities including RAG, vector databases, embeddings, and semantic search',
  features: [
    'Retrieval-Augmented Generation (RAG)',
    'Vector Database Support (Memory, FAISS, Pinecone, etc.)',
    'Text Embedding Services (OpenAI, HuggingFace)',
    'Intelligent Document Chunking',
    'Semantic Search with Query Expansion',
    'Multi-provider Support',
    'Caching and Performance Optimization',
    'Event-driven Architecture'
  ],
  compatibility: {
    node: '>=16.0.0',
    typescript: '>=4.5.0',
    browsers: ['Chrome >= 90', 'Firefox >= 88', 'Safari >= 14']
  },
  dependencies: {
    core: ['EventEmitter', 'networking-enhanced'],
    optional: ['openai', 'faiss-node', 'chromadb']
  }
} as const;

// Import for default export
import {
  createRAGSystem,
  createSemanticSearch,
  RAGUtils,
  RAGPresets
} from './RAG';

/**
 * Default export for convenience
 */
export default {
  createRAGSystem,
  createSemanticSearch,
  RAGUtils,
  RAGPresets,
  AI_ADVANCED_VERSION,
  AI_ADVANCED_INFO
};