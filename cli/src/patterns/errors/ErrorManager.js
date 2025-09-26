"use strict";
/**
 * PowerScript Enhanced Error Management
 * Advanced error handling with context and recovery strategies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorManager = exports.DefaultErrorHandler = exports.NetworkErrorHandler = exports.ValidationErrorHandler = exports.SecurityError = exports.ConfigurationError = exports.NetworkError = exports.ValidationError = exports.EnhancedError = void 0;
exports.getGlobalErrorManager = getGlobalErrorManager;
exports.setGlobalErrorManager = setGlobalErrorManager;
exports.isRetryableError = isRetryableError;
exports.getErrorCode = getErrorCode;
exports.getErrorContext = getErrorContext;
const EnhancedLogger_1 = require("../logging/EnhancedLogger");
/**
 * Enhanced Error Implementation
 */
class EnhancedError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = options.code;
        this.statusCode = options.statusCode;
        this.context = options.context;
        this.innerError = options.innerError;
        this.isRetryable = options.isRetryable ?? false;
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Get full error details as object
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            context: this.context,
            isRetryable: this.isRetryable,
            stack: this.stack,
            innerError: this.innerError ? {
                name: this.innerError.name,
                message: this.innerError.message,
                stack: this.innerError.stack
            } : undefined
        };
    }
}
exports.EnhancedError = EnhancedError;
/**
 * Specific Error Types
 */
class ValidationError extends EnhancedError {
    constructor(message, field, value) {
        super(message, {
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            context: {
                timestamp: new Date(),
                operation: 'validation',
                additionalData: { field, value }
            }
        });
    }
}
exports.ValidationError = ValidationError;
class NetworkError extends EnhancedError {
    constructor(message, url, method) {
        super(message, {
            code: 'NETWORK_ERROR',
            statusCode: 500,
            isRetryable: true,
            context: {
                timestamp: new Date(),
                operation: 'network_request',
                additionalData: { url, method }
            }
        });
    }
}
exports.NetworkError = NetworkError;
class ConfigurationError extends EnhancedError {
    constructor(message, configKey) {
        super(message, {
            code: 'CONFIGURATION_ERROR',
            statusCode: 500,
            context: {
                timestamp: new Date(),
                operation: 'configuration',
                additionalData: { configKey }
            }
        });
    }
}
exports.ConfigurationError = ConfigurationError;
class SecurityError extends EnhancedError {
    constructor(message, operation) {
        super(message, {
            code: 'SECURITY_ERROR',
            statusCode: 403,
            context: {
                timestamp: new Date(),
                operation: operation || 'security_check',
                additionalData: { severity: 'high' }
            }
        });
    }
}
exports.SecurityError = SecurityError;
/**
 * Error Handler Implementations
 */
class ValidationErrorHandler {
    canHandle(error) {
        return error instanceof ValidationError ||
            error.code === 'VALIDATION_ERROR';
    }
    async handle(error) {
        const logger = EnhancedLogger_1.LoggerFactory.getDefaultLogger();
        logger.warn('Validation error occurred', {
            message: error.message,
            code: error.code,
            context: error.context
        });
        // Could implement additional validation error handling
        // e.g., field-specific error collection, form validation feedback
    }
}
exports.ValidationErrorHandler = ValidationErrorHandler;
class NetworkErrorHandler {
    canHandle(error) {
        return error instanceof NetworkError ||
            error.code === 'NETWORK_ERROR' ||
            error.name === 'FetchError' ||
            error.message.includes('ECONNREFUSED');
    }
    async handle(error) {
        const logger = EnhancedLogger_1.LoggerFactory.getDefaultLogger();
        if (error.isRetryable) {
            logger.warn('Retryable network error', {
                message: error.message,
                context: error.context
            });
        }
        else {
            logger.error('Network error (not retryable)', error, {
                context: error.context
            });
        }
    }
}
exports.NetworkErrorHandler = NetworkErrorHandler;
class DefaultErrorHandler {
    canHandle(error) {
        return true; // Handles all errors
    }
    async handle(error) {
        const logger = EnhancedLogger_1.LoggerFactory.getDefaultLogger();
        logger.error('Unhandled error', error, {
            name: error.name,
            code: error.code,
            context: error.context
        });
    }
}
exports.DefaultErrorHandler = DefaultErrorHandler;
/**
 * Enhanced Error Manager Implementation
 */
class ErrorManager {
    constructor() {
        this.handlers = [];
        this.errorCounts = new Map();
        this.lastErrors = [];
        this.maxLastErrors = 100;
        // Register default handlers
        this.registerHandler(new ValidationErrorHandler());
        this.registerHandler(new NetworkErrorHandler());
        this.registerHandler(new DefaultErrorHandler()); // Must be last
    }
    registerHandler(handler) {
        this.handlers.push(handler);
    }
    async handleError(error, context) {
        const enhancedError = this.ensureEnhancedError(error, context);
        // Track error statistics
        this.trackError(enhancedError);
        // Store in recent errors
        this.lastErrors.push(enhancedError);
        if (this.lastErrors.length > this.maxLastErrors) {
            this.lastErrors.shift();
        }
        // Find and execute appropriate handler
        for (const handler of this.handlers) {
            if (handler.canHandle(enhancedError)) {
                try {
                    await handler.handle(enhancedError);
                    break; // Only first matching handler executes
                }
                catch (handlerError) {
                    console.error('Error handler failed:', handlerError);
                    // Continue to next handler
                }
            }
        }
    }
    createError(message, code, statusCode) {
        return new EnhancedError(message, {
            code,
            statusCode,
            context: {
                timestamp: new Date(),
                operation: 'error_creation'
            }
        });
    }
    wrapError(error, context) {
        if (error instanceof EnhancedError) {
            // Update context if provided
            if (context) {
                return new EnhancedError(error.message, {
                    code: error.code,
                    statusCode: error.statusCode,
                    context: { ...error.context, ...context },
                    innerError: error.innerError,
                    isRetryable: error.isRetryable
                });
            }
            return error;
        }
        return new EnhancedError(error.message, {
            code: 'WRAPPED_ERROR',
            context: {
                timestamp: new Date(),
                operation: 'error_wrapping',
                ...context
            },
            innerError: error
        });
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        const topErrors = Array.from(this.errorCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([code, count]) => ({ code, count }));
        return {
            totalHandlers: this.handlers.length,
            errorCounts: Object.fromEntries(this.errorCounts),
            recentErrors: this.lastErrors.length,
            topErrors
        };
    }
    /**
     * Get recent errors
     */
    getRecentErrors(limit = 10) {
        return this.lastErrors.slice(-limit);
    }
    /**
     * Clear error statistics
     */
    clearStats() {
        this.errorCounts.clear();
        this.lastErrors = [];
    }
    ensureEnhancedError(error, context) {
        if (error instanceof EnhancedError) {
            return context ? this.wrapError(error, context) : error;
        }
        return this.wrapError(error, context);
    }
    trackError(error) {
        const key = error.code || error.name || 'UNKNOWN_ERROR';
        this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
}
exports.ErrorManager = ErrorManager;
/**
 * Global Error Manager Instance
 */
let globalErrorManager = null;
function getGlobalErrorManager() {
    if (!globalErrorManager) {
        globalErrorManager = new ErrorManager();
    }
    return globalErrorManager;
}
function setGlobalErrorManager(manager) {
    globalErrorManager = manager;
}
/**
 * Utility Functions
 */
function isRetryableError(error) {
    return error.isRetryable === true ||
        error instanceof NetworkError ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout');
}
function getErrorCode(error) {
    return error.code || error.name || 'UNKNOWN_ERROR';
}
function getErrorContext(error) {
    return error.context;
}
