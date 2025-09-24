/**
 * PowerScript ML Core
 * Main machine learning coordination system with multi-provider support
 */

import { EventDispatcher, Event } from '../core/EventDispatcher';
import { Logger } from '../core/Logger';
import { ErrorManager } from '../core/ErrorManager';
import { 
    MLProvider, 
    MLModel, 
    MLTensor, 
    MLPredictionResult, 
    MLBatchPredictionResult,
    MLConfig, 
    MLEvent, 
    MLMetrics,
    MLPipeline,
    MLError,
    MLModelNotFoundError,
    MLInferenceError,
    MLOutOfMemoryError
} from './types';

export class PowerScriptML extends EventDispatcher {
    private static instance: PowerScriptML;
    private providers: Map<string, MLProvider> = new Map();
    private models: Map<string, MLModel> = new Map();
    private config: MLConfig;
    private logger: Logger;
    private errorManager: ErrorManager;
    private cache: Map<string, any> = new Map();
    private metrics: MLMetrics;

    private constructor(config: MLConfig) {
        super();
        this.config = config;
        this.logger = new Logger();
        this.errorManager = new ErrorManager(this.logger);
        
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

    public static getInstance(config?: MLConfig): PowerScriptML {
        if (!PowerScriptML.instance) {
            if (!config) {
                throw new Error('ML configuration required for first initialization');
            }
            PowerScriptML.instance = new PowerScriptML(config);
        }
        return PowerScriptML.instance;
    }

    private async initialize(): Promise<void> {
        try {
            this.logger.info('Initializing PowerScript ML system');
            
            // Initialize cache if enabled
            if (this.config.caching.enabled) {
                this.setupCache();
            }

            // Initialize default providers
            await this.initializeProviders();

            this.logger.info('PowerScript ML system initialized successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_INIT_ERROR');
            throw error;
        }
    }

    private async initializeProviders(): Promise<void> {
        const { providers, defaultProvider } = this.config;

        // Initialize TensorFlow.js provider (disabled until TF.js is installed)
        if (providers.tensorflow) {
            try {
                // const { TensorFlowProvider } = await import('./providers/TensorFlowProvider');
                // const tfProvider = new TensorFlowProvider(providers.tensorflow);
                // await tfProvider.initialize();
                // this.providers.set('tensorflow', tfProvider);
                this.logger.info('TensorFlow.js provider initialization skipped (dependency not installed)');
            } catch (error) {
                this.logger.warn('Failed to initialize TensorFlow.js provider:', error);
            }
        }

        // Initialize ONNX provider
        if (providers.onnx) {
            try {
                const { ONNXProvider } = await import('./providers/ONNXProvider');
                const onnxProvider = new ONNXProvider(providers.onnx);
                await onnxProvider.initialize();
                this.providers.set('onnx', onnxProvider);
                this.logger.info('ONNX provider initialized');
            } catch (error) {
                this.logger.warn('Failed to initialize ONNX provider:', error);
            }
        }

        // Initialize PyTorch provider
        if (providers.torch) {
            try {
                const { PyTorchProvider } = await import('./providers/PyTorchProvider');
                const torchProvider = new PyTorchProvider(providers.torch);
                await torchProvider.initialize();
                this.providers.set('pytorch', torchProvider);
                this.logger.info('PyTorch provider initialized');
            } catch (error) {
                this.logger.warn('Failed to initialize PyTorch provider:', error);
            }
        }

        // Verify default provider exists
        if (!this.providers.has(defaultProvider)) {
            throw new MLError(`Default provider '${defaultProvider}' not available`, 'PROVIDER_NOT_FOUND');
        }
    }

    private setupCache(): void {
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
    public async loadModel(modelPath: string, provider?: string, options?: any): Promise<string> {
        const startTime = Date.now();
        
        try {
            const providerName = provider || this.config.defaultProvider;
            const mlProvider = this.providers.get(providerName);
            
            if (!mlProvider) {
                throw new MLError(`Provider '${providerName}' not found`, 'PROVIDER_NOT_FOUND', providerName);
            }

            this.logger.info(`Loading model from ${modelPath} using ${providerName}`);
            
            const model = await mlProvider.loadModel(modelPath, options);
            this.models.set(model.id, model);
            this.metrics.modelCount++;

            const loadTime = Date.now() - startTime;
            this.logger.info(`Model ${model.id} loaded successfully in ${loadTime}ms`);

            const event = new Event('model-loaded');
            (event as any).modelId = model.id;
            (event as any).data = { loadTime, provider: providerName };
            (event as any).timestamp = new Date();
            this.dispatchEvent(event);

            return model.id;
        } catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_LOAD_MODEL_ERROR');
            throw error;
        }
    }

    public async unloadModel(modelId: string): Promise<void> {
        try {
            const model = this.models.get(modelId);
            if (!model) {
                throw new MLModelNotFoundError(modelId);
            }

            // Find provider for this model
            for (const [providerName, provider] of this.providers) {
                try {
                    await provider.unloadModel(modelId);
                    this.models.delete(modelId);
                    this.metrics.modelCount--;
                    
                    this.logger.info(`Model ${modelId} unloaded successfully`);
                    const event = new Event('model-unloaded');
                    (event as any).modelId = modelId;
                    (event as any).timestamp = new Date();
                    this.dispatchEvent(event);
                    return;
                } catch (error) {
                    // Try next provider
                    continue;
                }
            }

            throw new MLError(`Failed to unload model ${modelId}`, 'UNLOAD_ERROR', undefined, modelId);
        } catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_UNLOAD_MODEL_ERROR');
            throw error;
        }
    }

    // Inference
    public async predict(modelId: string, inputs: MLTensor[], useCache: boolean = true): Promise<MLPredictionResult> {
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
                throw new MLModelNotFoundError(modelId);
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

            const event = new Event('prediction-complete');
            (event as any).modelId = modelId;
            (event as any).data = { predictionTime, confidence: result.confidence };
            (event as any).timestamp = new Date();
            this.dispatchEvent(event);

            return result;
        } catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_PREDICTION_ERROR');
            
            if (error instanceof MLError) {
                throw error;
            }
            throw new MLInferenceError(err.message, modelId);
        }
    }

    public async predictBatch(modelId: string, inputBatch: MLTensor[][]): Promise<MLBatchPredictionResult> {
        const startTime = Date.now();
        
        try {
            const model = this.models.get(modelId);
            if (!model) {
                throw new MLModelNotFoundError(modelId);
            }

            const provider = await this.getProviderForModel(model);
            
            this.logger.debug(`Making batch prediction with model ${modelId}, batch size: ${inputBatch.length}`);
            const result = await provider.predictBatch(modelId, inputBatch);
            
            const totalTime = Date.now() - startTime;
            this.updateMetrics(totalTime / inputBatch.length, inputBatch.length);

            return result;
        } catch (error) {
            this.metrics.errorCount++;
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_BATCH_PREDICTION_ERROR');
            throw new MLInferenceError(err.message, modelId);
        }
    }

    // Pipeline Management
    public async executePipeline(pipeline: MLPipeline, inputs: any): Promise<any> {
        try {
            this.logger.info(`Executing ML pipeline: ${pipeline.name}`);
            
            let currentData = inputs;
            
            for (const step of pipeline.steps) {
                currentData = await this.executeStep(step, currentData);
            }
            
            return currentData;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_PIPELINE_ERROR');
            throw error;
        }
    }

    private async executeStep(step: any, data: any): Promise<any> {
        // Pipeline step execution logic would go here
        // This is a simplified implementation
        return data;
    }

    // Utility Methods
    private async getProviderForModel(model: MLModel): Promise<MLProvider> {
        const provider = this.providers.get(model.type);
        if (!provider) {
            throw new MLError(`Provider for model type '${model.type}' not found`, 'PROVIDER_NOT_FOUND', model.type, model.id);
        }
        return provider;
    }

    private generateCacheKey(modelId: string, inputs: MLTensor[]): string {
        const inputHash = inputs.map(tensor => 
            `${tensor.shape.join(',')}:${tensor.dtype}:${tensor.data.length}`
        ).join('|');
        return `${modelId}:${inputHash}`;
    }

    private updateMetrics(predictionTime: number, batchSize: number = 1): void {
        this.metrics.totalPredictions += batchSize;
        this.metrics.avgPredictionTime = (
            (this.metrics.avgPredictionTime * (this.metrics.totalPredictions - batchSize)) + 
            predictionTime
        ) / this.metrics.totalPredictions;
    }

    // Provider Management
    public registerProvider(name: string, provider: MLProvider): void {
        this.providers.set(name, provider);
        this.logger.info(`ML provider '${name}' registered`);
    }

    public getProvider(name: string): MLProvider | undefined {
        return this.providers.get(name);
    }

    public listProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    public listModels(): MLModel[] {
        return Array.from(this.models.values());
    }

    // Resource Management
    public async getMemoryUsage(): Promise<number> {
        let totalMemory = 0;
        
        for (const provider of this.providers.values()) {
            try {
                const memInfo = await provider.getMemoryUsage();
                totalMemory += memInfo.usedMemory;
            } catch (error) {
                this.logger.warn('Failed to get memory usage from provider:', error);
            }
        }
        
        this.metrics.memoryUsage = totalMemory;
        return totalMemory;
    }

    public getMetrics(): MLMetrics {
        return { ...this.metrics };
    }

    public async cleanup(): Promise<void> {
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
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ML_CLEANUP_ERROR');
            throw error;
        }
    }
}

// Export for external use
export * from './types';