"use strict";
/**
 * RAG (Retrieval-Augmented Generation) System
 * Core RAG implementation with vector database integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGPresets = exports.RAGUtils = exports.SemanticSearch = exports.RAGSystem = exports.DocumentChunker = exports.MemoryEmbeddingCache = exports.EmbeddingService = exports.MemoryVectorDatabase = exports.VectorDatabase = exports.PowerScriptRAG = void 0;
exports.createRAGSystem = createRAGSystem;
exports.createSemanticSearch = createSemanticSearch;
var RAGSystem_1 = require("./RAGSystem");
Object.defineProperty(exports, "PowerScriptRAG", { enumerable: true, get: function () { return RAGSystem_1.RAGSystem; } });
// Vector Database
var VectorDatabase_1 = require("./VectorDatabase");
Object.defineProperty(exports, "VectorDatabase", { enumerable: true, get: function () { return VectorDatabase_1.VectorDatabase; } });
Object.defineProperty(exports, "MemoryVectorDatabase", { enumerable: true, get: function () { return VectorDatabase_1.MemoryVectorDatabase; } });
// Embedding Service
var EmbeddingService_1 = require("./EmbeddingService");
Object.defineProperty(exports, "EmbeddingService", { enumerable: true, get: function () { return EmbeddingService_1.EmbeddingService; } });
Object.defineProperty(exports, "MemoryEmbeddingCache", { enumerable: true, get: function () { return EmbeddingService_1.MemoryEmbeddingCache; } });
// Document Chunker
var DocumentChunker_1 = require("./DocumentChunker");
Object.defineProperty(exports, "DocumentChunker", { enumerable: true, get: function () { return DocumentChunker_1.DocumentChunker; } });
// RAG System
var RAGSystem_2 = require("./RAGSystem");
Object.defineProperty(exports, "RAGSystem", { enumerable: true, get: function () { return RAGSystem_2.RAGSystem; } });
// Semantic Search
var SemanticSearch_1 = require("./SemanticSearch");
Object.defineProperty(exports, "SemanticSearch", { enumerable: true, get: function () { return SemanticSearch_1.SemanticSearch; } });
// Import types for internal use
const RAGSystem_3 = require("./RAGSystem");
const VectorDatabase_2 = require("./VectorDatabase");
const EmbeddingService_2 = require("./EmbeddingService");
const DocumentChunker_2 = require("./DocumentChunker");
const SemanticSearch_2 = require("./SemanticSearch");
/**
 * Create a complete RAG system with default configurations
 */
async function createRAGSystem(config) {
    const { dimension = 1536, embeddingModel = 'text-embedding-ada-002', chunkSize = 1000, chunkOverlap = 200 } = config;
    // Initialize vector database
    const vectorDatabase = new VectorDatabase_2.MemoryVectorDatabase({
        type: 'memory',
        dimension,
        metric: 'cosine'
    });
    // Initialize embedding service
    const embeddingService = new EmbeddingService_2.EmbeddingService({
        defaultModel: embeddingModel,
        enableCaching: true,
        batchSize: 50
    });
    // Initialize document chunker
    const documentChunker = new DocumentChunker_2.DocumentChunker();
    const chunkingOptions = DocumentChunker_2.DocumentChunker.createDefaultOptions(chunkSize, chunkOverlap);
    // Create RAG system
    const ragSystem = new RAGSystem_3.RAGSystem({
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
function createSemanticSearch(embeddingService, vectorDatabase) {
    return new SemanticSearch_2.SemanticSearch(embeddingService, vectorDatabase);
}
/**
 * Utility functions for RAG operations
 */
class RAGUtils {
    /**
     * Split text into sentences
     */
    static splitIntoSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }
    /**
     * Split text into paragraphs
     */
    static splitIntoParagraphs(text) {
        return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    }
    /**
     * Clean and normalize text
     */
    static normalizeText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/^\s+|\s+$/g, '')
            .replace(/[^\w\s.,!?;:()-]/g, '');
    }
    /**
     * Calculate text statistics
     */
    static getTextStats(text) {
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
    static generateDocumentId(content, source) {
        const hash = this._simpleHash(content);
        const timestamp = Date.now();
        return `doc_${hash}_${timestamp}${source ? `_${this._simpleHash(source)}` : ''}`;
    }
    /**
     * Simple hash function for generating IDs
     */
    static _simpleHash(str) {
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
    static validateDocument(doc) {
        return (typeof doc === 'object' &&
            typeof doc.id === 'string' &&
            typeof doc.text === 'string' &&
            typeof doc.metadata === 'object');
    }
    /**
     * Validate chunk format
     */
    static validateChunk(chunk) {
        return (typeof chunk === 'object' &&
            typeof chunk.id === 'string' &&
            typeof chunk.text === 'string' &&
            typeof chunk.metadata === 'object' &&
            typeof chunk.metadata.source === 'string' &&
            typeof chunk.metadata.chunkIndex === 'number');
    }
}
exports.RAGUtils = RAGUtils;
/**
 * Default configurations for various use cases
 */
exports.RAGPresets = {
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
};
