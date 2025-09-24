/**
 * PowerScript ML Types
 * Comprehensive type definitions for machine learning integration
 */

export interface MLModel {
    id: string;
    name: string;
    version: string;
    type: 'tensorflow' | 'onnx' | 'pytorch' | 'custom';
    format: 'savedmodel' | 'graphdef' | 'onnx' | 'tflite' | 'torch';
    inputShape: number[];
    outputShape: number[];
    metadata?: Record<string, any>;
}

export interface MLTensor {
    data: Float32Array | Int32Array | Uint8Array;
    shape: number[];
    dtype: 'float32' | 'int32' | 'uint8' | 'bool';
}

export interface MLPredictionResult {
    predictions: MLTensor[];
    confidence?: number;
    processingTime: number;
    modelId: string;
    metadata?: Record<string, any>;
}

export interface MLBatchPredictionResult {
    results: MLPredictionResult[];
    batchSize: number;
    totalProcessingTime: number;
    avgConfidence?: number;
}

export interface MLTrainingConfig {
    epochs: number;
    batchSize: number;
    learningRate: number;
    optimizer: 'adam' | 'sgd' | 'rmsprop';
    lossFunction: string;
    metrics: string[];
    validationSplit?: number;
    callbacks?: MLCallback[];
}

export interface MLCallback {
    name: string;
    config: Record<string, any>;
}

export interface MLDataset {
    inputs: MLTensor[];
    targets?: MLTensor[];
    metadata?: Record<string, any>;
}

export interface MLProvider {
    name: string;
    version: string;
    
    // Model Management
    loadModel(modelPath: string, options?: MLLoadOptions): Promise<MLModel>;
    unloadModel(modelId: string): Promise<void>;
    listModels(): Promise<MLModel[]>;
    
    // Inference
    predict(modelId: string, inputs: MLTensor[]): Promise<MLPredictionResult>;
    predictBatch(modelId: string, inputs: MLTensor[][]): Promise<MLBatchPredictionResult>;
    
    // Training (if supported)
    trainModel?(config: MLTrainingConfig, dataset: MLDataset): Promise<MLModel>;
    
    // Model Operations
    quantizeModel?(modelId: string, options: MLQuantizationOptions): Promise<MLModel>;
    optimizeModel?(modelId: string, options: MLOptimizationOptions): Promise<MLModel>;
    
    // Resource Management
    getMemoryUsage(): Promise<MLMemoryInfo>;
    cleanup(): Promise<void>;
}

export interface MLLoadOptions {
    useGPU?: boolean;
    memoryLimit?: number;
    threads?: number;
    cacheModel?: boolean;
    warmup?: boolean;
}

export interface MLQuantizationOptions {
    method: 'dynamic' | 'static' | 'qat';
    precision: 'int8' | 'int16' | 'float16';
    calibrationData?: MLTensor[];
}

export interface MLOptimizationOptions {
    passes: string[];
    targetDevice?: 'cpu' | 'gpu' | 'tpu';
    batchSize?: number;
}

export interface MLMemoryInfo {
    totalMemory: number;
    usedMemory: number;
    modelMemory: Record<string, number>;
    availableMemory: number;
}

export interface MLConfig {
    providers: {
        tensorflow?: TensorFlowConfig;
        onnx?: ONNXConfig;
        torch?: PyTorchConfig;
    };
    defaultProvider: string;
    memoryLimit?: number;
    useGPU?: boolean;
    caching: {
        enabled: boolean;
        maxSize: number;
        ttl: number;
    };
}

export interface TensorFlowConfig {
    backend: 'cpu' | 'webgl' | 'wasm';
    debug: boolean;
    kernelRegistry?: string[];
}

export interface ONNXConfig {
    executionProviders: string[];
    sessionOptions?: Record<string, any>;
    graphOptimizationLevel?: 'disabled' | 'basic' | 'extended' | 'all';
}

export interface PyTorchConfig {
    backend: 'cpu' | 'cuda' | 'mps';
    torchScript: boolean;
    jitMode?: boolean;
}

export interface MLEvent {
    type: 'model-loaded' | 'model-unloaded' | 'prediction-complete' | 'training-started' | 'training-complete' | 'error';
    modelId?: string;
    data?: any;
    timestamp: Date;
}

export interface MLMetrics {
    totalPredictions: number;
    totalTrainingTime: number;
    avgPredictionTime: number;
    modelCount: number;
    memoryUsage: number;
    errorCount: number;
    cacheHitRate: number;
}

export interface MLPipeline {
    id: string;
    name: string;
    steps: MLPipelineStep[];
    config: Record<string, any>;
}

export interface MLPipelineStep {
    id: string;
    type: 'preprocess' | 'inference' | 'postprocess';
    config: Record<string, any>;
    dependencies?: string[];
}

// Error types
export class MLError extends Error {
    constructor(
        message: string,
        public code: string,
        public provider?: string,
        public modelId?: string
    ) {
        super(message);
        this.name = 'MLError';
    }
}

export class MLModelNotFoundError extends MLError {
    constructor(modelId: string, provider?: string) {
        super(`Model not found: ${modelId}`, 'MODEL_NOT_FOUND', provider, modelId);
        this.name = 'MLModelNotFoundError';
    }
}

export class MLInferenceError extends MLError {
    constructor(message: string, modelId?: string, provider?: string) {
        super(message, 'INFERENCE_ERROR', provider, modelId);
        this.name = 'MLInferenceError';
    }
}

export class MLOutOfMemoryError extends MLError {
    constructor(message: string, provider?: string) {
        super(message, 'OUT_OF_MEMORY', provider);
        this.name = 'MLOutOfMemoryError';
    }
}