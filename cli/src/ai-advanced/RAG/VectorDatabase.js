"use strict";
/**
 * PowerScript Advanced AI Systems - Vector Database Interface
 *
 * Unified interface for vector database operations supporting multiple backends:
 * - In-memory storage (for development/testing)
 * - FAISS (Facebook AI Similarity Search)
 * - Pinecone (cloud vector database)
 * - Weaviate (open-source vector database)
 * - Chroma (embedding database)
 * - Milvus (cloud-native vector database)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorDatabaseFactory = exports.MemoryVectorDatabase = exports.VectorDatabase = void 0;
/**
 * Abstract base class for vector database implementations
 */
class VectorDatabase {
    constructor(config) {
        this.config = config;
        this.stats = {
            totalVectors: 0,
            dimension: config.dimension,
            indexSize: 0,
            queryCount: 0,
            averageQueryTime: 0
        };
    }
    /**
     * Get database statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
exports.VectorDatabase = VectorDatabase;
/**
 * In-memory vector database implementation
 * Useful for development, testing, and small datasets
 */
class MemoryVectorDatabase extends VectorDatabase {
    constructor() {
        super(...arguments);
        this.vectors = new Map();
        this.initialized = false;
    }
    async initialize() {
        this.initialized = true;
    }
    async insert(vector) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        if (vector.values.length !== this.config.dimension) {
            throw new Error(`Vector dimension ${vector.values.length} does not match configured dimension ${this.config.dimension}`);
        }
        this.vectors.set(vector.id, { ...vector });
        this.stats.totalVectors = this.vectors.size;
        this.stats.indexSize = this.vectors.size * this.config.dimension * 4; // Approximate bytes
    }
    async insertBatch(vectors) {
        for (const vector of vectors) {
            await this.insert(vector);
        }
    }
    async search(queryVector, options = {}) {
        const startTime = Date.now();
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        if (queryVector.length !== this.config.dimension) {
            throw new Error(`Query vector dimension ${queryVector.length} does not match configured dimension ${this.config.dimension}`);
        }
        const { topK = 10, scoreThreshold = 0, filter = {}, includeMetadata = true, includeValues = false } = options;
        const results = [];
        const metric = this.config.metric || 'cosine';
        for (const [id, vector] of Array.from(this.vectors)) {
            // Apply filters
            if (Object.keys(filter).length > 0) {
                let passesFilter = true;
                for (const [key, value] of Object.entries(filter)) {
                    if (vector.metadata[key] !== value) {
                        passesFilter = false;
                        break;
                    }
                }
                if (!passesFilter)
                    continue;
            }
            // Calculate similarity score
            const score = this._calculateSimilarity(queryVector, vector.values, metric);
            if (score >= scoreThreshold) {
                const result = {
                    id,
                    score,
                    metadata: includeMetadata ? { ...vector.metadata } : {}
                };
                if (includeValues) {
                    result.vector = [...vector.values];
                }
                results.push(result);
            }
        }
        // Sort by score (descending) and limit to topK
        results.sort((a, b) => b.score - a.score);
        const limitedResults = results.slice(0, topK);
        // Update statistics
        this.stats.queryCount++;
        const queryTime = Date.now() - startTime;
        this.stats.averageQueryTime =
            (this.stats.averageQueryTime * (this.stats.queryCount - 1) + queryTime) / this.stats.queryCount;
        return limitedResults;
    }
    async get(id) {
        const vector = this.vectors.get(id);
        return vector ? { ...vector } : null;
    }
    async delete(id) {
        const deleted = this.vectors.delete(id);
        if (deleted) {
            this.stats.totalVectors = this.vectors.size;
            this.stats.indexSize = this.vectors.size * this.config.dimension * 4;
        }
        return deleted;
    }
    async deleteBatch(ids) {
        let deletedCount = 0;
        for (const id of ids) {
            if (await this.delete(id)) {
                deletedCount++;
            }
        }
        return deletedCount;
    }
    async updateMetadata(id, metadata) {
        const vector = this.vectors.get(id);
        if (vector) {
            vector.metadata = { ...vector.metadata, ...metadata };
            this.vectors.set(id, vector);
            return true;
        }
        return false;
    }
    async clear() {
        this.vectors.clear();
        this.stats.totalVectors = 0;
        this.stats.indexSize = 0;
    }
    async createIndex() {
        // In-memory database doesn't need explicit indexing
    }
    async close() {
        this.vectors.clear();
        this.initialized = false;
    }
    /**
     * Calculate similarity between two vectors
     */
    _calculateSimilarity(a, b, metric) {
        switch (metric) {
            case 'cosine':
                return this._cosineSimilarity(a, b);
            case 'euclidean':
                return 1 / (1 + this._euclideanDistance(a, b));
            case 'dotproduct':
                return this._dotProduct(a, b);
            default:
                return this._cosineSimilarity(a, b);
        }
    }
    /**
     * Calculate cosine similarity
     */
    _cosineSimilarity(a, b) {
        const dotProduct = this._dotProduct(a, b);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        if (magnitudeA === 0 || magnitudeB === 0)
            return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }
    /**
     * Calculate dot product
     */
    _dotProduct(a, b) {
        return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }
    /**
     * Calculate Euclidean distance
     */
    _euclideanDistance(a, b) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }
}
exports.MemoryVectorDatabase = MemoryVectorDatabase;
/**
 * Vector database factory
 */
class VectorDatabaseFactory {
    /**
     * Create a vector database instance
     */
    static create(config) {
        switch (config.type) {
            case 'memory':
                return new MemoryVectorDatabase(config);
            case 'faiss':
                throw new Error('FAISS implementation not yet available');
            case 'pinecone':
                throw new Error('Pinecone implementation not yet available');
            case 'weaviate':
                throw new Error('Weaviate implementation not yet available');
            case 'chroma':
                throw new Error('Chroma implementation not yet available');
            case 'milvus':
                throw new Error('Milvus implementation not yet available');
            default:
                throw new Error(`Unsupported vector database type: ${config.type}`);
        }
    }
}
exports.VectorDatabaseFactory = VectorDatabaseFactory;
// Types are already exported above, no need to re-export
