"use strict";
/**
 * PowerScript Advanced AI Systems - Main Index
 *
 * Complete AI module with RAG capabilities, embeddings, and semantic search
 * This is Module 21 of the PowerScript platform
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_ADVANCED_INFO = exports.AI_ADVANCED_VERSION = exports.RAGPresets = exports.RAGUtils = exports.createSemanticSearch = exports.createRAGSystem = exports.SemanticSearch = exports.DocumentChunker = exports.EmbeddingService = exports.MemoryVectorDatabase = exports.VectorDatabase = exports.RAGSystem = void 0;
// Export RAG system components
__exportStar(require("./RAG"), exports);
// Re-export key classes for convenience
var RAG_1 = require("./RAG");
Object.defineProperty(exports, "RAGSystem", { enumerable: true, get: function () { return RAG_1.RAGSystem; } });
Object.defineProperty(exports, "VectorDatabase", { enumerable: true, get: function () { return RAG_1.VectorDatabase; } });
Object.defineProperty(exports, "MemoryVectorDatabase", { enumerable: true, get: function () { return RAG_1.MemoryVectorDatabase; } });
Object.defineProperty(exports, "EmbeddingService", { enumerable: true, get: function () { return RAG_1.EmbeddingService; } });
Object.defineProperty(exports, "DocumentChunker", { enumerable: true, get: function () { return RAG_1.DocumentChunker; } });
Object.defineProperty(exports, "SemanticSearch", { enumerable: true, get: function () { return RAG_1.SemanticSearch; } });
Object.defineProperty(exports, "createRAGSystem", { enumerable: true, get: function () { return RAG_1.createRAGSystem; } });
Object.defineProperty(exports, "createSemanticSearch", { enumerable: true, get: function () { return RAG_1.createSemanticSearch; } });
Object.defineProperty(exports, "RAGUtils", { enumerable: true, get: function () { return RAG_1.RAGUtils; } });
Object.defineProperty(exports, "RAGPresets", { enumerable: true, get: function () { return RAG_1.RAGPresets; } });
/**
 * PowerScript Advanced AI Systems version
 */
exports.AI_ADVANCED_VERSION = '1.0.0';
/**
 * Module information
 */
exports.AI_ADVANCED_INFO = {
    name: 'PowerScript Advanced AI Systems',
    version: exports.AI_ADVANCED_VERSION,
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
};
// Import for default export
const RAG_2 = require("./RAG");
/**
 * Default export for convenience
 */
exports.default = {
    createRAGSystem: RAG_2.createRAGSystem,
    createSemanticSearch: RAG_2.createSemanticSearch,
    RAGUtils: RAG_2.RAGUtils,
    RAGPresets: RAG_2.RAGPresets,
    AI_ADVANCED_VERSION: exports.AI_ADVANCED_VERSION,
    AI_ADVANCED_INFO: exports.AI_ADVANCED_INFO
};
