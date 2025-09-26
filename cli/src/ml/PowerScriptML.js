"use strict";
/**
 * PowerScript ML Core
 * Main machine learning coordination system with multi-provider support
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
exports.PowerScriptML = void 0;
const EventDispatcher_1 = require("../core/EventDispatcher");
const Logger_1 = require("../core/Logger");
const ErrorManager_1 = require("../core/ErrorManager");
const types_1 = require("./types");
class PowerScriptML extends EventDispatcher_1.EventDispatcher {
    constructor(config) {
        super();
        this.providers = new Map();
        this.models = new Map();
        this.cache = new Map();
        this.config = config;
        this.logger = new Logger_1.Logger();
        this.errorManager = new ErrorManager_1.ErrorManager(this.logger);
        this.metrics = {
            totalPredictions: 0,
            totalTrainingTime: 0,
            avgPredictionTime: 0,
            modelCount: 0,
            memoryUsage: 0,
            errorCount: 0,
            cacheHitRate: 0
        };
        this.initialize();
    }
    static getInstance(config) {
        if (!PowerScriptML.instance) {
            if (!config) {
                throw new Error('ML configuration required for first initialization');
            }
            PowerScriptML.instance = new PowerScriptML(config);
        }
        return PowerScriptML.instance;
    }
    async initialize() {
        try {
            this.logger.info('Initializing PowerScript ML system');
            // Initialize cache if enabled
            if (this.config.caching.enabled) {
                this.setupCache();
            }
            // Initialize default providers
            await this.initializeProviders();
            this.logger.info('PowerScript ML system initialized successfully');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_INIT_ERROR');
            throw error;
        }
    }
    async initializeProviders() {
        const { providers, defaultProvider } = this.config;
        // Initialize TensorFlow.js provider (disabled until TF.js is installed)
        if (providers.tensorflow) {
            try {
                // const { TensorFlowProvider } = await import('./providers/TensorFlowProvider');
                // const tfProvider = new TensorFlowProvider(providers.tensorflow);
                // await tfProvider.initialize();
                // this.providers.set('tensorflow', tfProvider);
                this.logger.info('TensorFlow.js provider initialization skipped (dependency not installed)');
            }
            catch (error) {
                this.logger.warn('Failed to initialize TensorFlow.js provider:', error);
            }
        }
        // Initialize ONNX provider
        if (providers.onnx) {
            try {
                const { ONNXProvider } = await Promise.resolve().then(() => require('./providers/ONNXProvider'));
                const onnxProvider = new ONNXProvider(providers.onnx);
                await onnxProvider.initialize();
                this.providers.set('onnx', onnxProvider);
                this.logger.info('ONNX provider initialized');
            }
            catch (error) {
                this.logger.warn('Failed to initialize ONNX provider:', error);
            }
        }
        // Initialize PyTorch provider
        if (providers.torch) {
            try {
                const { PyTorchProvider } = await Promise.resolve().then(() => require('./providers/PyTorchProvider'));
                const torchProvider = new PyTorchProvider(providers.torch);
                await torchProvider.initialize();
                this.providers.set('pytorch', torchProvider);
                this.logger.info('PyTorch provider initialized');
            }
            catch (error) {
                this.logger.warn('Failed to initialize PyTorch provider:', error);
            }
        }
        // Verify default provider exists
        if (!this.providers.has(defaultProvider)) {
            throw new types_1.MLError(`Default provider '${defaultProvider}' not available`, 'PROVIDER_NOT_FOUND');
        }
    }
    setupCache() {
        const { maxSize, ttl } = this.config.caching;
        // Implement LRU cache with TTL
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (value.timestamp + ttl < now) {
                    this.cache.delete(key);
                }
            }
        }, ttl / 2);
    }
    // Model Management
    async loadModel(modelPath, provider, options) {
        const startTime = Date.now();
        try {
            const providerName = provider || this.config.defaultProvider;
            const mlProvider = this.providers.get(providerName);
            if (!mlProvider) {
                throw new types_1.MLError(`Provider '${providerName}' not found`, 'PROVIDER_NOT_FOUND', providerName);
            }
            this.logger.info(`Loading model from ${modelPath} using ${providerName}`);
            const model = await mlProvider.loadModel(modelPath, options);
            this.models.set(model.id, model);
            this.metrics.modelCount++;
            const loadTime = Date.now() - startTime;
            this.logger.info(`Model ${model.id} loaded successfully in ${loadTime}ms`);
            const event = new EventDispatcher_1.Event('model-loaded');
            event.modelId = model.id;
            event.data = { loadTime, provider: providerName };
            event.timestamp = new Date();
            this.dispatchEvent(event);
            return model.id;
        }
        catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_LOAD_MODEL_ERROR');
            throw error;
        }
    }
    async unloadModel(modelId) {
        try {
            const model = this.models.get(modelId);
            if (!model) {
                throw new types_1.MLModelNotFoundError(modelId);
            }
            // Find provider for this model
            for (const [providerName, provider] of this.providers) {
                try {
                    await provider.unloadModel(modelId);
                    this.models.delete(modelId);
                    this.metrics.modelCount--;
                    this.logger.info(`Model ${modelId} unloaded successfully`);
                    const event = new EventDispatcher_1.Event('model-unloaded');
                    event.modelId = modelId;
                    event.timestamp = new Date();
                    this.dispatchEvent(event);
                    return;
                }
                catch (error) {
                    // Try next provider
                    continue;
                }
            }
            throw new types_1.MLError(`Failed to unload model ${modelId}`, 'UNLOAD_ERROR', undefined, modelId);
        }
        catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_UNLOAD_MODEL_ERROR');
            throw error;
        }
    }
    // Inference
    async predict(modelId, inputs, useCache = true) {
        const startTime = Date.now();
        try {
            // Check cache first
            if (useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey(modelId, inputs);
                const cachedResult = this.cache.get(cacheKey);
                if (cachedResult && Date.now() - cachedResult.timestamp < this.config.caching.ttl) {
                    this.metrics.cacheHitRate = (this.metrics.cacheHitRate * this.metrics.totalPredictions + 1) / (this.metrics.totalPredictions + 1);
                    this.metrics.totalPredictions++;
                    return cachedResult.data;
                }
            }
            const model = this.models.get(modelId);
            if (!model) {
                throw new types_1.MLModelNotFoundError(modelId);
            }
            // Find provider for this model
            const provider = await this.getProviderForModel(model);
            this.logger.debug(`Making prediction with model ${modelId}`);
            const result = await provider.predict(modelId, inputs);
            const predictionTime = Date.now() - startTime;
            this.updateMetrics(predictionTime);
            // Cache result if enabled
            if (useCache && this.config.caching.enabled) {
                const cacheKey = this.generateCacheKey(modelId, inputs);
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }
            const event = new EventDispatcher_1.Event('prediction-complete');
            event.modelId = modelId;
            event.data = { predictionTime, confidence: result.confidence };
            event.timestamp = new Date();
            this.dispatchEvent(event);
            return result;
        }
        catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_PREDICTION_ERROR');
            if (error instanceof types_1.MLError) {
                throw error;
            }
            throw new types_1.MLInferenceError(err.message, modelId);
        }
    }
    async predictBatch(modelId, inputBatch) {
        const startTime = Date.now();
        try {
            const model = this.models.get(modelId);
            if (!model) {
                throw new types_1.MLModelNotFoundError(modelId);
            }
            const provider = await this.getProviderForModel(model);
            this.logger.debug(`Making batch prediction with model ${modelId}, batch size: ${inputBatch.length}`);
            const result = await provider.predictBatch(modelId, inputBatch);
            const totalTime = Date.now() - startTime;
            this.updateMetrics(totalTime / inputBatch.length, inputBatch.length);
            return result;
        }
        catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_BATCH_PREDICTION_ERROR');
            throw new types_1.MLInferenceError(err.message, modelId);
        }
    }
    // Pipeline Management
    async executePipeline(pipeline, inputs) {
        try {
            this.logger.info(`Executing ML pipeline: ${pipeline.name}`);
            let currentData = inputs;
            for (const step of pipeline.steps) {
                currentData = await this.executeStep(step, currentData);
            }
            return currentData;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_PIPELINE_ERROR');
            throw error;
        }
    }
    async executeStep(step, data) {
        // Pipeline step execution logic would go here
        // This is a simplified implementation
        return data;
    }
    // Utility Methods
    async getProviderForModel(model) {
        const provider = this.providers.get(model.type);
        if (!provider) {
            throw new types_1.MLError(`Provider for model type '${model.type}' not found`, 'PROVIDER_NOT_FOUND', model.type, model.id);
        }
        return provider;
    }
    generateCacheKey(modelId, inputs) {
        const inputHash = inputs.map(tensor => `${tensor.shape.join(',')}:${tensor.dtype}:${tensor.data.length}`).join('|');
        return `${modelId}:${inputHash}`;
    }
    updateMetrics(predictionTime, batchSize = 1) {
        this.metrics.totalPredictions += batchSize;
        this.metrics.avgPredictionTime = ((this.metrics.avgPredictionTime * (this.metrics.totalPredictions - batchSize)) +
            predictionTime) / this.metrics.totalPredictions;
    }
    // Provider Management
    registerProvider(name, provider) {
        this.providers.set(name, provider);
        this.logger.info(`ML provider '${name}' registered`);
    }
    getProvider(name) {
        return this.providers.get(name);
    }
    listProviders() {
        return Array.from(this.providers.keys());
    }
    listModels() {
        return Array.from(this.models.values());
    }
    // Resource Management
    async getMemoryUsage() {
        let totalMemory = 0;
        for (const provider of this.providers.values()) {
            try {
                const memInfo = await provider.getMemoryUsage();
                totalMemory += memInfo.usedMemory;
            }
            catch (error) {
                this.logger.warn('Failed to get memory usage from provider:', error);
            }
        }
        this.metrics.memoryUsage = totalMemory;
        return totalMemory;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    async cleanup() {
        try {
            this.logger.info('Cleaning up ML system');
            // Unload all models
            const modelIds = Array.from(this.models.keys());
            for (const modelId of modelIds) {
                await this.unloadModel(modelId);
            }
            // Cleanup providers
            for (const provider of this.providers.values()) {
                await provider.cleanup();
            }
            // Clear cache
            this.cache.clear();
            this.logger.info('ML system cleanup completed');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_CLEANUP_ERROR');
            throw error;
        }
    }
}
exports.PowerScriptML = PowerScriptML;
// Export for external use
__exportStar(require("./types"), exports);
