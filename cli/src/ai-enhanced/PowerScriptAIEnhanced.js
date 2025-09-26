"use strict";
/**
 * PowerScript Enhanced AI/ML Module - Main Class
 *
 * Advanced AI/ML capabilities including:
 * - Text generation, summarization, code generation
 * - Image generation, editing, style transfer
 * - Video generation & animation
 * - Audio: TTS, ASR, music generation
 * - Local model support (LLaMA, Mistral, Stable Diffusion)
 * - Hardware optimization (GPU/CUDA/ROCm/WebGPU)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptAIEnhanced = void 0;
const events_1 = require("events");
const path = require("path");
const fs = require("fs");
const types_1 = require("./types");
const LocalModelProvider_1 = require("./providers/LocalModelProvider");
const GenerationProvider_1 = require("./providers/GenerationProvider");
const HardwareProvider_1 = require("./providers/HardwareProvider");
/**
 * PowerScript Enhanced AI/ML - Main orchestration class
 */
class PowerScriptAIEnhanced extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.modelProviders = new Map();
        this.hardwareProviders = new Map();
        this.loadedModels = new Map();
        this.taskQueue = [];
        this.runningTasks = new Map();
        this.taskCounter = 0;
        this.isInitialized = false;
        // Cache for model weights and outputs
        this.modelCache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        // Apply default configuration
        this.config = {
            preferredDevice: config.preferredDevice || 'auto',
            enableGPU: config.enableGPU !== false,
            cudaPath: config.cudaPath || process.env.CUDA_PATH || '',
            rocmPath: config.rocmPath || process.env.ROCM_PATH || '',
            defaultTextModel: config.defaultTextModel || 'llama-3.2-1b',
            defaultImageModel: config.defaultImageModel || 'stable-diffusion-v1.5',
            defaultAudioModel: config.defaultAudioModel || 'whisper-base',
            defaultVideoModel: config.defaultVideoModel || 'stable-video-diffusion',
            maxConcurrentTasks: config.maxConcurrentTasks || 3,
            memoryLimit: config.memoryLimit || 8192, // 8GB default
            timeoutMs: config.timeoutMs || 300000, // 5 minutes
            enableModelCache: config.enableModelCache !== false,
            cacheDirectory: config.cacheDirectory || path.join(process.cwd(), '.powerscript-cache'),
            maxCacheSize: config.maxCacheSize || 4096, // 4GB cache
            sandboxEnabled: config.sandboxEnabled !== false,
            allowRemoteModels: config.allowRemoteModels !== false
        };
        this.initializeEventHandlers();
    }
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    /**
     * Initialize the Enhanced AI system
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Create cache directory
            if (!fs.existsSync(this.config.cacheDirectory)) {
                fs.mkdirSync(this.config.cacheDirectory, { recursive: true });
            }
            // Initialize hardware providers
            await this.initializeHardware();
            // Initialize model providers
            await this.initializeModelProviders();
            // Detect and select optimal device
            await this.detectOptimalDevice();
            this.isInitialized = true;
            this.emit('ready');
            console.log('✅ PowerScript Enhanced AI initialized successfully');
        }
        catch (error) {
            this.emit('error', error);
            throw new types_1.AIEnhancedError('Failed to initialize Enhanced AI', 'INIT_FAILED', { error: error instanceof Error ? error.message : String(error) });
        }
    }
    /**
     * Initialize hardware providers
     */
    async initializeHardware() {
        // CPU is always available
        const cpuProvider = new HardwareProvider_1.HardwareProvider('cpu');
        this.hardwareProviders.set('cpu', cpuProvider);
        // Try to initialize GPU providers
        if (this.config.enableGPU) {
            try {
                // CUDA provider
                if (this.config.cudaPath && fs.existsSync(this.config.cudaPath)) {
                    const cudaProvider = new HardwareProvider_1.HardwareProvider('cuda');
                    if (await cudaProvider.isAvailable()) {
                        this.hardwareProviders.set('cuda', cudaProvider);
                    }
                }
                // ROCm provider
                if (this.config.rocmPath && fs.existsSync(this.config.rocmPath)) {
                    const rocmProvider = new HardwareProvider_1.HardwareProvider('rocm');
                    if (await rocmProvider.isAvailable()) {
                        this.hardwareProviders.set('rocm', rocmProvider);
                    }
                }
                // WebGPU provider (for browser compatibility)
                const webgpuProvider = new HardwareProvider_1.HardwareProvider('webgpu');
                if (await webgpuProvider.isAvailable()) {
                    this.hardwareProviders.set('webgpu', webgpuProvider);
                }
            }
            catch (error) {
                console.warn('⚠️ GPU initialization failed, falling back to CPU:', error instanceof Error ? error.message : String(error));
            }
        }
    }
    /**
     * Initialize model providers
     */
    async initializeModelProviders() {
        // Local model provider (for downloaded models)
        const localProvider = new LocalModelProvider_1.LocalModelProvider(this.config.cacheDirectory);
        this.modelProviders.set('local', localProvider);
        // Generation provider (for various AI tasks)
        const generationProvider = new GenerationProvider_1.GenerationProvider();
        this.modelProviders.set('generation', generationProvider);
        // Set up event forwarding
        for (const [name, provider] of this.modelProviders) {
            provider.on('model:loaded', (model) => this.emit('model:loaded', model.id, model));
            provider.on('model:error', (error) => this.emit('model:error', error));
        }
    }
    /**
     * Detect optimal device for AI tasks
     */
    async detectOptimalDevice() {
        if (this.config.preferredDevice !== 'auto') {
            return this.config.preferredDevice;
        }
        // Benchmark available devices
        const devices = Array.from(this.hardwareProviders.keys());
        let bestDevice = 'cpu';
        let bestScore = 0;
        for (const device of devices) {
            try {
                const provider = this.hardwareProviders.get(device);
                const result = await provider?.benchmark();
                if (result && result.score > bestScore) {
                    bestScore = result.score;
                    bestDevice = device;
                }
            }
            catch (error) {
                console.warn(`⚠️ Benchmark failed for ${device}:`, error instanceof Error ? error.message : String(error));
            }
        }
        console.log(`🚀 Selected optimal device: ${bestDevice} (score: ${bestScore})`);
        return bestDevice;
    }
    // ============================================================================
    // MODEL MANAGEMENT
    // ============================================================================
    /**
     * List available models
     */
    async listModels() {
        const allModels = [];
        for (const [name, provider] of this.modelProviders) {
            try {
                const models = await provider.listModels();
                allModels.push(...models);
            }
            catch (error) {
                console.warn(`⚠️ Failed to list models from provider ${name}:`, error instanceof Error ? error.message : String(error));
            }
        }
        return allModels;
    }
    /**
     * Download a model
     */
    async downloadModel(modelId, onProgress) {
        for (const [name, provider] of this.modelProviders) {
            try {
                const models = await provider.listModels();
                const model = models.find(m => m.id === modelId);
                if (model) {
                    console.log(`📥 Downloading model ${modelId} from ${name}...`);
                    await provider.downloadModel(modelId, onProgress);
                    console.log(`✅ Model ${modelId} downloaded successfully`);
                    return;
                }
            }
            catch (error) {
                console.warn(`⚠️ Failed to download ${modelId} from ${name}:`, error instanceof Error ? error.message : String(error));
            }
        }
        throw new types_1.ModelNotFoundError(modelId);
    }
    /**
     * Load a model for inference
     */
    async loadModel(modelId, device) {
        // Check if already loaded
        if (this.loadedModels.has(modelId)) {
            return this.loadedModels.get(modelId);
        }
        // Determine device
        const targetDevice = device || await this.detectOptimalDevice();
        // Verify device support
        if (!this.hardwareProviders.has(targetDevice)) {
            throw new types_1.DeviceNotSupportedError(targetDevice, modelId);
        }
        // Check memory requirements
        await this.checkMemoryRequirements(modelId, targetDevice);
        // Load model from appropriate provider
        for (const [name, provider] of this.modelProviders) {
            try {
                const models = await provider.listModels();
                const modelInfo = models.find(m => m.id === modelId);
                if (modelInfo) {
                    console.log(`🔄 Loading model ${modelId} on ${targetDevice}...`);
                    this.emit('model:loading', modelId);
                    const loadedModel = await provider.loadModel(modelId, targetDevice);
                    this.loadedModels.set(modelId, loadedModel);
                    console.log(`✅ Model ${modelId} loaded successfully`);
                    this.emit('model:loaded', modelId, loadedModel);
                    return loadedModel;
                }
            }
            catch (error) {
                console.warn(`⚠️ Failed to load ${modelId} from ${name}:`, error instanceof Error ? error.message : String(error));
                this.emit('model:error', modelId, error);
            }
        }
        throw new types_1.ModelNotFoundError(modelId);
    }
    /**
     * Unload a model from memory
     */
    async unloadModel(modelId) {
        const model = this.loadedModels.get(modelId);
        if (!model) {
            throw new types_1.ModelNotFoundError(modelId);
        }
        try {
            await model.unload();
            this.loadedModels.delete(modelId);
            this.emit('model:unloaded', modelId);
            console.log(`♻️ Model ${modelId} unloaded successfully`);
        }
        catch (error) {
            this.emit('model:error', modelId, error);
            throw error;
        }
    }
    /**
     * Check memory requirements for model loading
     */
    async checkMemoryRequirements(modelId, device) {
        const provider = this.hardwareProviders.get(device);
        if (!provider)
            return;
        const memoryInfo = await provider.getMemoryUsage();
        const modelProvider = Array.from(this.modelProviders.values())
            .find(async (p) => (await p.listModels()).some(m => m.id === modelId));
        if (modelProvider) {
            const models = await modelProvider.listModels();
            const modelInfo = models.find(m => m.id === modelId);
            if (modelInfo?.memoryRequirement && modelInfo.memoryRequirement > memoryInfo.total - memoryInfo.used) {
                throw new types_1.InsufficientMemoryError(modelInfo.memoryRequirement, memoryInfo.total - memoryInfo.used);
            }
        }
    }
    // ============================================================================
    // TEXT AI OPERATIONS
    // ============================================================================
    /**
     * Generate text using AI
     */
    async generateText(request) {
        const modelId = request.config?.model || this.config.defaultTextModel;
        const task = await this.createTask('text_generation', { request, modelId });
        try {
            const model = await this.loadModel(modelId);
            if (!model.generateText) {
                throw new types_1.AIEnhancedError('Model does not support text generation', 'OPERATION_NOT_SUPPORTED');
            }
            task.status = 'running';
            task.startedAt = new Date();
            this.emit('task:started', task);
            const response = await model.generateText(request);
            task.status = 'completed';
            task.completedAt = new Date();
            task.output = response;
            task.metadata.timeMs = Date.now() - task.startedAt.getTime();
            task.metadata.tokensProcessed = response.tokensGenerated;
            this.emit('task:completed', task);
            return response;
        }
        catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error : new Error(String(error));
            this.emit('task:failed', task, error);
            throw error;
        }
        finally {
            this.runningTasks.delete(task.id);
        }
    }
    /**
     * Summarize text
     */
    async summarizeText(text, config) {
        const modelId = config?.model || this.config.defaultTextModel;
        const model = await this.loadModel(modelId);
        if (!model.summarizeText) {
            throw new types_1.AIEnhancedError('Model does not support text summarization', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.summarizeText(text, config);
    }
    /**
     * Generate code
     */
    async generateCode(prompt, config) {
        const modelId = config.model || this.config.defaultTextModel;
        const model = await this.loadModel(modelId);
        if (!model.generateCode) {
            throw new types_1.AIEnhancedError('Model does not support code generation', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.generateCode(prompt, config);
    }
    // ============================================================================
    // IMAGE AI OPERATIONS
    // ============================================================================
    /**
     * Generate images using AI
     */
    async generateImage(request) {
        const modelId = request.config?.model || this.config.defaultImageModel;
        const task = await this.createTask('image_generation', { request, modelId });
        try {
            // Check for GPU availability for image generation
            const hasGPU = this.hardwareProviders.has('cuda') ||
                this.hardwareProviders.has('rocm') ||
                this.hardwareProviders.has('webgpu');
            if (!hasGPU) {
                console.warn('⚠️ No GPU detected. Image generation will use CPU (slower performance expected)');
                // Reduce image size for CPU processing
                if (request.config) {
                    request.config.width = Math.min(request.config.width || 512, 256);
                    request.config.height = Math.min(request.config.height || 512, 256);
                    request.config.steps = Math.min(request.config.steps || 20, 10);
                }
            }
            const model = await this.loadModel(modelId, hasGPU ? 'auto' : 'cpu');
            if (!model.generateImage) {
                throw new types_1.AIEnhancedError('Model does not support image generation', 'OPERATION_NOT_SUPPORTED');
            }
            task.status = 'running';
            task.startedAt = new Date();
            this.emit('task:started', task);
            const response = await model.generateImage(request);
            task.status = 'completed';
            task.completedAt = new Date();
            task.output = response;
            task.metadata.timeMs = Date.now() - task.startedAt.getTime();
            this.emit('task:completed', task);
            return response;
        }
        catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error : new Error(String(error));
            this.emit('task:failed', task, error);
            throw error;
        }
        finally {
            this.runningTasks.delete(task.id);
        }
    }
    /**
     * Edit images using AI
     */
    async editImage(image, config) {
        const modelId = config.model || this.config.defaultImageModel;
        const model = await this.loadModel(modelId);
        if (!model.editImage) {
            throw new types_1.AIEnhancedError('Model does not support image editing', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.editImage(image, config);
    }
    // ============================================================================
    // AUDIO AI OPERATIONS
    // ============================================================================
    /**
     * Convert text to speech
     */
    async textToSpeech(text, config) {
        const modelId = config?.model || this.config.defaultAudioModel;
        const model = await this.loadModel(modelId);
        if (!model.textToSpeech) {
            throw new types_1.AIEnhancedError('Model does not support text-to-speech', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.textToSpeech(text, config);
    }
    /**
     * Convert speech to text
     */
    async speechToText(audio, config) {
        const modelId = config?.model || this.config.defaultAudioModel;
        const model = await this.loadModel(modelId);
        if (!model.speechToText) {
            throw new types_1.AIEnhancedError('Model does not support speech-to-text', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.speechToText(audio, config);
    }
    /**
     * Generate audio/music
     */
    async generateAudio(prompt, config) {
        const modelId = config?.model || this.config.defaultAudioModel;
        const model = await this.loadModel(modelId);
        if (!model.generateAudio) {
            throw new types_1.AIEnhancedError('Model does not support audio generation', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.generateAudio(prompt, config);
    }
    // ============================================================================
    // VIDEO AI OPERATIONS
    // ============================================================================
    /**
     * Generate videos using AI
     */
    async generateVideo(request) {
        const modelId = request.config?.model || this.config.defaultVideoModel;
        const task = await this.createTask('video_generation', { request, modelId });
        try {
            // Check for GPU availability for video generation
            const hasGPU = this.hardwareProviders.has('cuda') ||
                this.hardwareProviders.has('rocm') ||
                this.hardwareProviders.has('webgpu');
            if (!hasGPU) {
                console.warn('⚠️ No GPU detected. Video generation will use CPU (significantly slower, reduced quality)');
                // Reduce video parameters for CPU processing
                if (request.config) {
                    request.config.duration = Math.min(request.config.duration || 5, 2);
                    request.config.fps = Math.min(request.config.fps || 24, 12);
                    request.config.width = Math.min(request.config.width || 512, 256);
                    request.config.height = Math.min(request.config.height || 512, 256);
                }
            }
            const model = await this.loadModel(modelId, hasGPU ? 'auto' : 'cpu');
            if (!model.generateVideo) {
                throw new types_1.AIEnhancedError('Model does not support video generation', 'OPERATION_NOT_SUPPORTED');
            }
            task.status = 'running';
            task.startedAt = new Date();
            this.emit('task:started', task);
            const video = await model.generateVideo(request);
            task.status = 'completed';
            task.completedAt = new Date();
            task.output = video;
            task.metadata.timeMs = Date.now() - task.startedAt.getTime();
            this.emit('task:completed', task);
            return video;
        }
        catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error : new Error(String(error));
            this.emit('task:failed', task, error);
            throw error;
        }
        finally {
            this.runningTasks.delete(task.id);
        }
    }
    // ============================================================================
    // UTILITY OPERATIONS
    // ============================================================================
    /**
     * Generate text embeddings
     */
    async generateEmbedding(text, modelId) {
        const model = await this.loadModel(modelId || this.config.defaultTextModel);
        if (!model.generateEmbedding) {
            throw new types_1.AIEnhancedError('Model does not support embedding generation', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.generateEmbedding(text);
    }
    /**
     * Classify input
     */
    async classify(input, classes, modelId) {
        const model = await this.loadModel(modelId || this.config.defaultTextModel);
        if (!model.classify) {
            throw new types_1.AIEnhancedError('Model does not support classification', 'OPERATION_NOT_SUPPORTED');
        }
        return await model.classify(input, classes);
    }
    /**
     * Benchmark AI performance
     */
    async benchmark() {
        const results = [];
        const models = await this.listModels();
        for (const device of this.hardwareProviders.keys()) {
            for (const model of models.slice(0, 3)) { // Test first 3 models
                try {
                    const startTime = Date.now();
                    const loadedModel = await this.loadModel(model.id, device);
                    if (loadedModel.generateText) {
                        const response = await loadedModel.generateText({
                            prompt: 'Hello, world! This is a benchmark test.',
                            config: { maxTokens: 50 }
                        });
                        const endTime = Date.now();
                        const timeMs = endTime - startTime;
                        const tokensPerSecond = response.tokensGenerated / (timeMs / 1000);
                        results.push({
                            device,
                            model: model.id,
                            task: 'text_generation',
                            tokensPerSecond,
                            latencyMs: timeMs,
                            memoryUsage: loadedModel.memoryUsage,
                            score: tokensPerSecond * 1000 / timeMs
                        });
                    }
                    await this.unloadModel(model.id);
                }
                catch (error) {
                    console.warn(`⚠️ Benchmark failed for ${model.id} on ${device}:`, error instanceof Error ? error.message : String(error));
                }
            }
        }
        return results;
    }
    // ============================================================================
    // TASK MANAGEMENT
    // ============================================================================
    /**
     * Create a new AI task
     */
    async createTask(type, input) {
        const task = {
            id: `task_${++this.taskCounter}`,
            type,
            status: 'pending',
            createdAt: new Date(),
            progress: 0,
            priority: 5,
            model: input.modelId || 'unknown',
            device: await this.detectOptimalDevice(),
            input,
            metadata: {}
        };
        this.taskQueue.push(task);
        this.runningTasks.set(task.id, task);
        this.emit('task:created', task);
        return task;
    }
    /**
     * Get task status
     */
    getTask(taskId) {
        return this.runningTasks.get(taskId) ||
            this.taskQueue.find(t => t.id === taskId);
    }
    /**
     * List all tasks
     */
    getTasks(status) {
        const allTasks = [...this.taskQueue, ...Array.from(this.runningTasks.values())];
        return status ? allTasks.filter(t => t.status === status) : allTasks;
    }
    /**
     * Cancel a task
     */
    async cancelTask(taskId) {
        const task = this.getTask(taskId);
        if (!task) {
            throw new types_1.AIEnhancedError(`Task not found: ${taskId}`, 'TASK_NOT_FOUND');
        }
        task.status = 'cancelled';
        this.runningTasks.delete(taskId);
        const queueIndex = this.taskQueue.findIndex(t => t.id === taskId);
        if (queueIndex !== -1) {
            this.taskQueue.splice(queueIndex, 1);
        }
    }
    // ============================================================================
    // SYSTEM INFORMATION
    // ============================================================================
    /**
     * Get system information
     */
    async getSystemInfo() {
        const hardware = [];
        for (const provider of this.hardwareProviders.values()) {
            const devices = await provider.getDeviceInfo();
            hardware.push(...devices);
        }
        const availableModels = await this.listModels();
        const loadedModels = Array.from(this.loadedModels.values()).map(m => m.info);
        const tasks = this.getTasks();
        const taskStats = {
            running: tasks.filter(t => t.status === 'running').length,
            pending: tasks.filter(t => t.status === 'pending').length,
            completed: tasks.filter(t => t.status === 'completed').length
        };
        return {
            hardware,
            models: { loaded: loadedModels, available: availableModels },
            cache: this.getCacheStats(),
            tasks: taskStats
        };
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        const totalSize = Array.from(this.modelCache.values())
            .reduce((sum, buffer) => sum + buffer.length, 0);
        return {
            totalEntries: this.modelCache.size,
            totalSize,
            hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
            missRate: this.cacheStats.misses / (this.cacheStats.hits + this.cacheStats.misses) || 0,
            evictions: this.cacheStats.evictions
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.modelCache.clear();
        this.cacheStats = { hits: 0, misses: 0, evictions: 0 };
        this.emit('cache:cleared');
    }
    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        // Handle uncaught errors
        this.on('error', (error) => {
            console.error('🚨 PowerScript Enhanced AI Error:', error);
        });
        // Handle task timeouts
        setInterval(() => {
            const now = Date.now();
            for (const [id, task] of this.runningTasks) {
                if (task.status === 'running' &&
                    task.startedAt &&
                    (now - task.startedAt.getTime()) > this.config.timeoutMs) {
                    task.status = 'failed';
                    task.error = new types_1.TaskTimeoutError(id, this.config.timeoutMs);
                    this.emit('task:failed', task, task.error);
                    this.runningTasks.delete(id);
                }
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up PowerScript Enhanced AI...');
        // Unload all models
        for (const modelId of this.loadedModels.keys()) {
            try {
                await this.unloadModel(modelId);
            }
            catch (error) {
                console.warn(`⚠️ Failed to unload model ${modelId}:`, error instanceof Error ? error.message : String(error));
            }
        }
        // Clear cache
        this.clearCache();
        // Remove all listeners
        this.removeAllListeners();
        this.isInitialized = false;
        console.log('✅ PowerScript Enhanced AI cleanup complete');
    }
}
exports.PowerScriptAIEnhanced = PowerScriptAIEnhanced;
exports.default = PowerScriptAIEnhanced;
