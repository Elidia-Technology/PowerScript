"use strict";
/**
 * PowerScript AI - Main AI coordination and management class
 *
 * Provides unified access to multiple AI providers including OpenAI, Anthropic,
 * Cohere, HuggingFace, and local models with advanced features like function calling,
 * embeddings, multi-agent orchestration, and RAG systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptAI = exports.AIEvent = void 0;
const EventDispatcher_1 = require("../core/EventDispatcher");
const Logger_1 = require("../core/Logger");
const ErrorManager_1 = require("../core/ErrorManager");
const DependencyContainer_1 = require("../core/DependencyContainer");
const types_1 = require("./types");
class AIEvent extends EventDispatcher_1.Event {
    constructor(type, data, bubbles = false, cancelable = false) {
        super(type, bubbles, cancelable);
        this.data = data;
    }
}
exports.AIEvent = AIEvent;
AIEvent.PROVIDER_REGISTERED = 'providerRegistered';
AIEvent.PROVIDER_INITIALIZED = 'providerInitialized';
AIEvent.REQUEST_START = 'requestStart';
AIEvent.REQUEST_COMPLETE = 'requestComplete';
AIEvent.REQUEST_ERROR = 'requestError';
AIEvent.STREAM_START = 'streamStart';
AIEvent.STREAM_CHUNK = 'streamChunk';
AIEvent.STREAM_END = 'streamEnd';
/**
 * Main PowerScript AI class providing unified AI capabilities
 */
class PowerScriptAI extends EventDispatcher_1.EventDispatcher {
    constructor(config) {
        super();
        this._initialized = false;
        this._requestCount = 0;
        this._cache = new Map();
        this._config = {
            providers: {},
            defaultProvider: 'openai',
            features: {
                multiAgent: true,
                rag: true,
                functionCalling: true,
                streaming: true,
                caching: true
            },
            limits: {
                maxTokens: 4096,
                maxRequests: 1000,
                timeout: 30000
            },
            monitoring: {
                enabled: true,
                logLevel: 'info'
            },
            ...config
        };
        this._logger = new Logger_1.Logger();
        this._errorManager = new ErrorManager_1.ErrorManager(this._logger);
        this._container = new DependencyContainer_1.DependencyContainer();
        this._registry = new types_1.AIProviderRegistry();
    }
    /**
     * Initialize PowerScript AI with providers
     */
    async initialize(config) {
        if (this._initialized) {
            this._logger.warn('PowerScript AI already initialized');
            return;
        }
        if (config) {
            this._config = { ...this._config, ...config };
        }
        this._logger.info('Initializing PowerScript AI', {
            providers: Object.keys(this._config.providers || {}),
            defaultProvider: this._config.defaultProvider,
            features: this._config.features
        });
        // Initialize configured providers
        await this._initializeProviders();
        this._initialized = true;
        this._logger.info('PowerScript AI initialized successfully');
    }
    /**
     * Register an AI provider
     */
    registerProvider(provider, config) {
        this._registry.register(provider);
        if (config) {
            this._config.providers = this._config.providers || {};
            this._config.providers[provider.name.toLowerCase()] = config;
        }
        this.dispatchEvent(new AIEvent(AIEvent.PROVIDER_REGISTERED, {
            provider: provider.name,
            features: provider.supportedFeatures
        }));
        this._logger.info(`AI Provider registered: ${provider.name}`, {
            version: provider.version,
            models: provider.supportedModels.length,
            features: provider.supportedFeatures
        });
    }
    /**
     * Get available providers
     */
    getProviders() {
        return this._registry.getNames();
    }
    /**
     * Get provider info
     */
    getProviderInfo(name) {
        if (name) {
            const provider = this._registry.get(name);
            return provider ? {
                name: provider.name,
                version: provider.version,
                models: provider.supportedModels,
                features: provider.supportedFeatures,
                initialized: provider.isInitialized()
            } : null;
        }
        return this._registry.getInfo();
    }
    /**
     * Set default provider
     */
    setDefaultProvider(name) {
        this._registry.setDefault(name);
        this._config.defaultProvider = name;
        this._logger.info(`Default AI provider set to: ${name}`);
    }
    // Core AI Operations
    /**
     * Generate text completion using specified or default provider
     */
    async complete(messages, options) {
        this._ensureInitialized();
        this._checkLimits();
        const providerName = options?.provider || this._config.defaultProvider || 'openai';
        const provider = this._getProvider(providerName);
        // Convert string to messages array
        const messagesArray = typeof messages === 'string'
            ? [{ role: 'user', content: messages }]
            : messages;
        const request = {
            messages: messagesArray,
            model: options?.model || provider.supportedModels[0],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens || this._config.limits?.maxTokens,
            stream: options?.stream || false
        };
        const cacheKey = this._getCacheKey('complete', request);
        if (this._config.features?.caching && this._cache.has(cacheKey)) {
            this._logger.debug('Returning cached completion result');
            return this._cache.get(cacheKey);
        }
        this.dispatchEvent(new AIEvent(AIEvent.REQUEST_START, {
            provider: providerName,
            type: 'completion',
            request
        }));
        try {
            const startTime = Date.now();
            const response = await provider.complete(request);
            const duration = Date.now() - startTime;
            this._requestCount++;
            if (this._config.features?.caching) {
                this._cache.set(cacheKey, response);
            }
            this.dispatchEvent(new AIEvent(AIEvent.REQUEST_COMPLETE, {
                provider: providerName,
                type: 'completion',
                duration,
                tokens: response.usage
            }));
            this._logger.debug('Completion request completed', {
                provider: providerName,
                model: response.model,
                tokens: response.usage.total_tokens,
                duration
            });
            return response;
        }
        catch (error) {
            this.dispatchEvent(new AIEvent(AIEvent.REQUEST_ERROR, {
                provider: providerName,
                type: 'completion',
                error: error instanceof Error ? error.message : String(error)
            }));
            this._errorManager.handleError(error, 'AI_COMPLETION_ERROR');
            throw error;
        }
    }
    /**
     * Generate streaming text completion
     */
    async *completeStream(messages, options) {
        this._ensureInitialized();
        this._checkLimits();
        const providerName = options?.provider || this._config.defaultProvider || 'openai';
        const provider = this._getProvider(providerName);
        if (!provider.supportedFeatures.streaming) {
            throw new Error(`Provider '${providerName}' does not support streaming`);
        }
        const messagesArray = typeof messages === 'string'
            ? [{ role: 'user', content: messages }]
            : messages;
        const request = {
            messages: messagesArray,
            model: options?.model || provider.supportedModels[0],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens || this._config.limits?.maxTokens,
            stream: true
        };
        this.dispatchEvent(new AIEvent(AIEvent.STREAM_START, {
            provider: providerName,
            request
        }));
        try {
            for await (const chunk of provider.completeStream(request)) {
                this.dispatchEvent(new AIEvent(AIEvent.STREAM_CHUNK, {
                    provider: providerName,
                    chunk
                }));
                yield chunk;
            }
            this.dispatchEvent(new AIEvent(AIEvent.STREAM_END, {
                provider: providerName
            }));
        }
        catch (error) {
            this.dispatchEvent(new AIEvent(AIEvent.REQUEST_ERROR, {
                provider: providerName,
                type: 'streaming',
                error: error instanceof Error ? error.message : String(error)
            }));
            this._errorManager.handleError(error, 'AI_STREAMING_ERROR');
            throw error;
        }
    }
    /**
     * Generate embeddings for text
     */
    async embed(input, options) {
        this._ensureInitialized();
        const providerName = options?.provider || this._config.defaultProvider || 'openai';
        const provider = this._getProvider(providerName);
        if (!provider.supportedFeatures.embeddings) {
            throw new Error(`Provider '${providerName}' does not support embeddings`);
        }
        const request = {
            input,
            model: options?.model,
            dimensions: options?.dimensions
        };
        const cacheKey = this._getCacheKey('embed', request);
        if (this._config.features?.caching && this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }
        try {
            const response = await provider.embed(request);
            if (this._config.features?.caching) {
                this._cache.set(cacheKey, response);
            }
            return response;
        }
        catch (error) {
            this._errorManager.handleError(error, 'AI_EMBEDDING_ERROR');
            throw error;
        }
    }
    /**
     * Generate images (if provider supports it)
     */
    async generateImage(prompt, options) {
        this._ensureInitialized();
        const providerName = options?.provider || this._config.defaultProvider || 'openai';
        const provider = this._getProvider(providerName);
        if (!provider.supportedFeatures.imageGeneration || !provider.generateImage) {
            throw new Error(`Provider '${providerName}' does not support image generation`);
        }
        const request = {
            prompt,
            model: options?.model,
            size: options?.size || '1024x1024',
            quality: options?.quality || 'standard',
            n: options?.n || 1
        };
        try {
            return await provider.generateImage(request);
        }
        catch (error) {
            this._errorManager.handleError(error, 'AI_IMAGE_ERROR');
            throw error;
        }
    }
    // Utility Methods
    /**
     * Estimate tokens for text
     */
    estimateTokens(text, provider) {
        const providerName = provider || this._config.defaultProvider || 'openai';
        const providerInstance = this._getProvider(providerName);
        return providerInstance.estimateTokens(text);
    }
    /**
     * Get usage statistics
     */
    getUsage() {
        return {
            requests: this._requestCount,
            cacheSize: this._cache.size,
            providers: this._registry.getAll().length
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this._cache.clear();
        this._logger.debug('AI cache cleared');
    }
    /**
     * Health check for all providers
     */
    async healthCheck() {
        const results = {};
        for (const provider of this._registry.getAll()) {
            try {
                results[provider.name] = await provider.healthCheck();
            }
            catch (error) {
                results[provider.name] = false;
            }
        }
        return results;
    }
    // Private methods
    async _initializeProviders() {
        const configs = this._config.providers || {};
        for (const [name, config] of Object.entries(configs)) {
            const provider = this._registry.get(name);
            if (provider && config) {
                try {
                    await provider.initialize(config);
                    this.dispatchEvent(new AIEvent(AIEvent.PROVIDER_INITIALIZED, {
                        provider: name
                    }));
                    this._logger.info(`AI Provider initialized: ${name}`);
                }
                catch (error) {
                    this._logger.error(`Failed to initialize AI provider ${name}:`, error);
                }
            }
        }
    }
    _getProvider(name) {
        const provider = this._registry.get(name);
        if (!provider) {
            throw new Error(`AI provider '${name}' not found`);
        }
        if (!provider.isInitialized()) {
            throw new Error(`AI provider '${name}' not initialized`);
        }
        return provider;
    }
    _ensureInitialized() {
        if (!this._initialized) {
            throw new Error('PowerScript AI not initialized. Call initialize() first.');
        }
    }
    _checkLimits() {
        if (this._config.limits?.maxRequests && this._requestCount >= this._config.limits.maxRequests) {
            throw new Error('Maximum request limit reached');
        }
    }
    _getCacheKey(operation, request) {
        return `${operation}:${JSON.stringify(request)}`;
    }
    toString() {
        return `[PowerScriptAI providers=${this._registry.getAll().length} requests=${this._requestCount}]`;
    }
}
exports.PowerScriptAI = PowerScriptAI;
