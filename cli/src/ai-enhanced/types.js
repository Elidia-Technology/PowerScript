"use strict";
/**
 * PowerScript Enhanced AI/ML Module - Type Definitions
 *
 * Comprehensive type definitions for advanced AI/ML capabilities including:
 * - Text generation, summarization, code generation
 * - Image generation, editing, style transfer
 * - Video generation & animation
 * - Audio: TTS, ASR, music generation
 * - Local model support (LLaMA, Mistral, Stable Diffusion)
 * - Hardware optimization (GPU/CUDA/ROCm/WebGPU)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskTimeoutError = exports.InsufficientMemoryError = exports.DeviceNotSupportedError = exports.ModelNotFoundError = exports.AIEnhancedError = void 0;
// ============================================================================
// ERROR INTERFACES
// ============================================================================
/**
 * AI-specific error types
 */
class AIEnhancedError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AIEnhancedError';
    }
}
exports.AIEnhancedError = AIEnhancedError;
class ModelNotFoundError extends AIEnhancedError {
    constructor(modelId) {
        super(`Model not found: ${modelId}`, 'MODEL_NOT_FOUND', { modelId });
        this.name = 'ModelNotFoundError';
    }
}
exports.ModelNotFoundError = ModelNotFoundError;
class DeviceNotSupportedError extends AIEnhancedError {
    constructor(device, model) {
        super(`Device ${device} not supported for model ${model}`, 'DEVICE_NOT_SUPPORTED', { device, model });
        this.name = 'DeviceNotSupportedError';
    }
}
exports.DeviceNotSupportedError = DeviceNotSupportedError;
class InsufficientMemoryError extends AIEnhancedError {
    constructor(required, available) {
        super(`Insufficient memory: required ${required}MB, available ${available}MB`, 'INSUFFICIENT_MEMORY', { required, available });
        this.name = 'InsufficientMemoryError';
    }
}
exports.InsufficientMemoryError = InsufficientMemoryError;
class TaskTimeoutError extends AIEnhancedError {
    constructor(taskId, timeoutMs) {
        super(`Task ${taskId} timed out after ${timeoutMs}ms`, 'TASK_TIMEOUT', { taskId, timeoutMs });
        this.name = 'TaskTimeoutError';
    }
}
exports.TaskTimeoutError = TaskTimeoutError;
