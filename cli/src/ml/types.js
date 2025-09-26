"use strict";
/**
 * PowerScript ML Types
 * Comprehensive type definitions for machine learning integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLOutOfMemoryError = exports.MLInferenceError = exports.MLModelNotFoundError = exports.MLError = void 0;
// Error types
class MLError extends Error {
    constructor(message, code, provider, modelId) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.modelId = modelId;
        this.name = 'MLError';
    }
}
exports.MLError = MLError;
class MLModelNotFoundError extends MLError {
    constructor(modelId, provider) {
        super(`Model not found: ${modelId}`, 'MODEL_NOT_FOUND', provider, modelId);
        this.name = 'MLModelNotFoundError';
    }
}
exports.MLModelNotFoundError = MLModelNotFoundError;
class MLInferenceError extends MLError {
    constructor(message, modelId, provider) {
        super(message, 'INFERENCE_ERROR', provider, modelId);
        this.name = 'MLInferenceError';
    }
}
exports.MLInferenceError = MLInferenceError;
class MLOutOfMemoryError extends MLError {
    constructor(message, provider) {
        super(message, 'OUT_OF_MEMORY', provider);
        this.name = 'MLOutOfMemoryError';
    }
}
exports.MLOutOfMemoryError = MLOutOfMemoryError;
