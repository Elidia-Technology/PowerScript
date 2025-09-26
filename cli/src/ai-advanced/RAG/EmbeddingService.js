"use strict";
/**
 * PowerScript Advanced AI Systems - Embedding Service
 *
 * Service for generating text embeddings using various embedding models:
 * - OpenAI embeddings (text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large)
 * - Hugging Face transformers (sentence-transformers)
 * - Local embedding models (all-MiniLM-L6-v2, etc.)
 * - Custom embedding models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = exports.MemoryEmbeddingCache = void 0;
const events_1 = require("events");
const index_1 = require("../../networking-enhanced/index");
/**
 * Simple in-memory embedding cache
 */
class MemoryEmbeddingCache {
    constructor() {
        this.cache = new Map();
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check if expired
        if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.embedding;
    }
    async set(key, embedding, ttl) {
        this.cache.set(key, {
            embedding: [...embedding],
            timestamp: Date.now(),
            ttl
        });
    }
    async delete(key) {
        return this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
}
exports.MemoryEmbeddingCache = MemoryEmbeddingCache;
/**
 * Embedding service for generating text embeddings
 */
class EmbeddingService extends events_1.EventEmitter {
    constructor(config, networking) {
        super();
        this.models = new Map();
        this.config = {
            requestTimeout: 30000,
            maxRetries: 3,
            batchSize: 100,
            enableCaching: true,
            ...config
        };
        this.networking = networking || new index_1.PowerScriptNetworkingEnhanced({
            defaultTimeout: this.config.requestTimeout
        });
        if (this.config.enableCaching) {
            this.cache = new MemoryEmbeddingCache();
        }
        this._initializeDefaultModels();
    }
    /**
     * Initialize default embedding models
     */
    _initializeDefaultModels() {
        // OpenAI models
        this.models.set('text-embedding-ada-002', {
            name: 'text-embedding-ada-002',
            dimension: 1536,
            maxTokens: 8192,
            provider: 'openai',
            endpoint: this.config.endpoints?.openai || 'https://api.openai.com/v1/embeddings',
            apiKey: this.config.apiKeys?.openai
        });
        this.models.set('text-embedding-3-small', {
            name: 'text-embedding-3-small',
            dimension: 1536,
            maxTokens: 8192,
            provider: 'openai',
            endpoint: this.config.endpoints?.openai || 'https://api.openai.com/v1/embeddings',
            apiKey: this.config.apiKeys?.openai
        });
        this.models.set('text-embedding-3-large', {
            name: 'text-embedding-3-large',
            dimension: 3072,
            maxTokens: 8192,
            provider: 'openai',
            endpoint: this.config.endpoints?.openai || 'https://api.openai.com/v1/embeddings',
            apiKey: this.config.apiKeys?.openai
        });
        // Local/HuggingFace models (mock dimensions for now)
        this.models.set('all-MiniLM-L6-v2', {
            name: 'all-MiniLM-L6-v2',
            dimension: 384,
            maxTokens: 512,
            provider: 'local'
        });
        this.models.set('all-mpnet-base-v2', {
            name: 'all-mpnet-base-v2',
            dimension: 768,
            maxTokens: 514,
            provider: 'local'
        });
    }
    /**
     * Get available embedding models
     */
    getAvailableModels() {
        return Array.from(this.models.values());
    }
    /**
     * Get model information
     */
    getModel(name) {
        return this.models.get(name) || null;
    }
    /**
     * Add custom embedding model
     */
    addModel(model) {
        this.models.set(model.name, model);
        this.emit('modelAdded', model);
    }
    /**
     * Generate embedding for a single text
     */
    async embed(request) {
        const modelName = request.model || this.config.defaultModel;
        const model = this.models.get(modelName);
        if (!model) {
            throw new Error(`Model ${modelName} not found`);
        }
        // Check cache first
        if (this.cache) {
            const cacheKey = this._getCacheKey(request.text, modelName);
            const cachedEmbedding = await this.cache.get(cacheKey);
            if (cachedEmbedding) {
                this.emit('embeddingCacheHit', { text: request.text, model: modelName });
                return {
                    embedding: cachedEmbedding,
                    text: request.text,
                    model: modelName,
                    dimension: model.dimension
                };
            }
        }
        // Generate embedding
        const startTime = Date.now();
        let embedding;
        let tokensUsed;
        try {
            switch (model.provider) {
                case 'openai':
                    ({ embedding, tokensUsed } = await this._generateOpenAIEmbedding(request.text, model));
                    break;
                case 'huggingface':
                    embedding = await this._generateHuggingFaceEmbedding(request.text, model);
                    break;
                case 'local':
                    embedding = await this._generateLocalEmbedding(request.text, model);
                    break;
                case 'custom':
                    embedding = await this._generateCustomEmbedding(request.text, model);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${model.provider}`);
            }
            // Normalize if requested
            if (request.normalize) {
                embedding = this._normalizeVector(embedding);
            }
            // Cache the result
            if (this.cache) {
                const cacheKey = this._getCacheKey(request.text, modelName);
                await this.cache.set(cacheKey, embedding);
            }
            const response = {
                embedding,
                text: request.text,
                model: modelName,
                dimension: model.dimension,
                tokensUsed
            };
            this.emit('embeddingGenerated', {
                ...response,
                processingTime: Date.now() - startTime
            });
            return response;
        }
        catch (error) {
            this.emit('embeddingError', {
                text: request.text,
                model: modelName,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Generate embeddings for multiple texts in batch
     */
    async embedBatch(request) {
        const startTime = Date.now();
        const batchSize = request.batchSize || this.config.batchSize || 100;
        const embeddings = [];
        let totalTokensUsed = 0;
        // Process in batches to avoid overwhelming the API
        for (let i = 0; i < request.texts.length; i += batchSize) {
            const batch = request.texts.slice(i, i + batchSize);
            const batchPromises = batch.map(text => this.embed({
                text,
                model: request.model,
                normalize: request.normalize
            }));
            try {
                const batchResults = await Promise.all(batchPromises);
                embeddings.push(...batchResults);
                // Sum up tokens used
                for (const result of batchResults) {
                    if (result.tokensUsed) {
                        totalTokensUsed += result.tokensUsed;
                    }
                }
                this.emit('batchProgress', {
                    processed: embeddings.length,
                    total: request.texts.length,
                    batchIndex: Math.floor(i / batchSize) + 1
                });
            }
            catch (error) {
                this.emit('batchError', {
                    batchIndex: Math.floor(i / batchSize) + 1,
                    error: error instanceof Error ? error.message : String(error)
                });
                throw error;
            }
        }
        const response = {
            embeddings,
            totalTokensUsed: totalTokensUsed > 0 ? totalTokensUsed : undefined,
            processingTime: Date.now() - startTime
        };
        this.emit('batchCompleted', response);
        return response;
    }
    /**
     * Generate OpenAI embedding
     */
    async _generateOpenAIEmbedding(text, model) {
        if (!model.apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const response = await this.networking.post(model.endpoint, {
            input: text,
            model: model.name
        }, {
            'Authorization': `Bearer ${model.apiKey}`,
            'Content-Type': 'application/json'
        });
        if (!response.data || !response.data[0] || !response.data[0].embedding) {
            throw new Error('Invalid OpenAI embedding response');
        }
        return {
            embedding: response.data[0].embedding,
            tokensUsed: response.usage?.total_tokens || 0
        };
    }
    /**
     * Generate HuggingFace embedding (placeholder)
     */
    async _generateHuggingFaceEmbedding(text, model) {
        // This would integrate with HuggingFace inference API
        throw new Error('HuggingFace embedding generation not yet implemented');
    }
    /**
     * Generate local embedding (placeholder)
     */
    async _generateLocalEmbedding(text, model) {
        // This would use local sentence-transformers or similar
        // For now, return a mock embedding for testing
        return Array.from({ length: model.dimension }, () => Math.random() - 0.5);
    }
    /**
     * Generate custom embedding (placeholder)
     */
    async _generateCustomEmbedding(text, model) {
        if (!model.endpoint) {
            throw new Error('Custom model endpoint not configured');
        }
        const response = await this.networking.post(model.endpoint, { text, model: model.name });
        if (!response.embedding) {
            throw new Error('Invalid custom embedding response');
        }
        return response.embedding;
    }
    /**
     * Normalize vector to unit length
     */
    _normalizeVector(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0)
            return vector;
        return vector.map(val => val / magnitude);
    }
    /**
     * Generate cache key for text and model
     */
    _getCacheKey(text, model) {
        // Simple hash function for cache key
        let hash = 0;
        const input = `${text}:${model}`;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `embedding:${hash}`;
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        if (this.cache instanceof MemoryEmbeddingCache) {
            return { size: this.cache.size };
        }
        return { size: 0 };
    }
    /**
     * Clear embedding cache
     */
    async clearCache() {
        if (this.cache) {
            await this.cache.clear();
            this.emit('cacheCleared');
        }
    }
    /**
     * Clean up resources
     */
    async destroy() {
        if (this.cache) {
            await this.cache.clear();
        }
        if (this.networking) {
            await this.networking.destroy();
        }
        this.removeAllListeners();
    }
}
exports.EmbeddingService = EmbeddingService;
