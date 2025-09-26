"use strict";
/**
 * PowerScript Filesystem & Storage Module - Type Definitions
 * Provides comprehensive filesystem and storage capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageProviderError = exports.FileSystemError = void 0;
// Error types
class FileSystemError extends Error {
    constructor(message, code = 'FILESYSTEM_ERROR', path, cause) {
        super(message);
        this.code = code;
        this.path = path;
        this.cause = cause;
        this.name = 'FileSystemError';
    }
}
exports.FileSystemError = FileSystemError;
class StorageProviderError extends Error {
    constructor(message, provider, operation, cause) {
        super(message);
        this.provider = provider;
        this.operation = operation;
        this.cause = cause;
        this.name = 'StorageProviderError';
    }
}
exports.StorageProviderError = StorageProviderError;
