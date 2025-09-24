"use strict";
/**
 * PowerScript ErrorManager - Comprehensive error handling and management
 *
 * Provides structured error handling, reporting, and recovery mechanisms.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemError = exports.SecurityError = exports.NetworkError = exports.ValidationError = exports.RecoverableError = exports.ErrorManager = exports.ConsoleErrorReporter = exports.ErrorCategory = exports.ErrorSeverity = void 0;
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["SECURITY"] = "security";
    ErrorCategory["BUSINESS"] = "business";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
/**
 * Console error reporter for development
 */
class ConsoleErrorReporter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async report(errorReport) {
        const { id, error, context, severity, category, handled, recoverable } = errorReport;
        this.logger.error(`Error Report [${id}]`, {
            message: error.message,
            name: error.name,
            severity,
            category,
            handled,
            recoverable,
            context: {
                operation: context.operation,
                timestamp: context.timestamp,
                metadata: context.metadata
            },
            stack: error.stack
        });
    }
}
exports.ConsoleErrorReporter = ConsoleErrorReporter;
/**
 * PowerScript Error Manager
 */
class ErrorManager {
    logger;
    _handlers = [];
    _reporters = [];
    _errorCount = 0;
    _errors = new Map();
    constructor(logger) {
        this.logger = logger;
        // Add default console reporter
        this._reporters.push(new ConsoleErrorReporter(logger));
        // Register default handlers
        this._registerDefaultHandlers();
    }
    /**
     * Handle an error with optional context
     */
    async handleError(error, context) {
        const errorId = this._generateErrorId();
        const errorContext = this._normalizeContext(context);
        const errorReport = this._createErrorReport(errorId, error, errorContext);
        // Store error report
        this._errors.set(errorId, errorReport);
        this._errorCount++;
        // Try to handle with registered handlers
        let handled = false;
        const sortedHandlers = [...this._handlers].sort((a, b) => b.priority - a.priority);
        for (const handler of sortedHandlers) {
            try {
                if (handler.canHandle(error, errorContext)) {
                    handled = await handler.handle(error, errorContext);
                    if (handled) {
                        errorReport.handled = true;
                        break;
                    }
                }
            }
            catch (handlerError) {
                this.logger.error('Error in error handler', handlerError);
            }
        }
        if (!handled) {
            this.logger.error('Unhandled error', error, errorContext.operation);
        }
        // Report to all reporters
        await this._reportError(errorReport);
        return errorReport;
    }
    /**
     * Register an error handler
     */
    registerHandler(handler) {
        this._handlers.push(handler);
        // Sort by priority (highest first)
        this._handlers.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Unregister an error handler
     */
    unregisterHandler(handler) {
        const index = this._handlers.indexOf(handler);
        if (index !== -1) {
            this._handlers.splice(index, 1);
        }
    }
    /**
     * Register an error reporter
     */
    registerReporter(reporter) {
        this._reporters.push(reporter);
    }
    /**
     * Unregister an error reporter
     */
    unregisterReporter(reporter) {
        const index = this._reporters.indexOf(reporter);
        if (index !== -1) {
            this._reporters.splice(index, 1);
        }
    }
    /**
     * Get error statistics
     */
    getStats() {
        const stats = {
            totalErrors: this._errorCount,
            handledErrors: 0,
            unhandledErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {}
        };
        // Initialize counters
        for (const category of Object.values(ErrorCategory)) {
            stats.errorsByCategory[category] = 0;
        }
        for (const severity of Object.values(ErrorSeverity)) {
            stats.errorsBySeverity[severity] = 0;
        }
        // Count errors
        for (const errorReport of this._errors.values()) {
            if (errorReport.handled) {
                stats.handledErrors++;
            }
            else {
                stats.unhandledErrors++;
            }
            stats.errorsByCategory[errorReport.category]++;
            stats.errorsBySeverity[errorReport.severity]++;
        }
        return stats;
    }
    /**
     * Get recent errors
     */
    getRecentErrors(limit = 10) {
        const errors = Array.from(this._errors.values());
        return errors
            .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Clear error history
     */
    clearErrors() {
        this._errors.clear();
        this._errorCount = 0;
    }
    /**
     * Create a recoverable error
     */
    createRecoverableError(message, operation) {
        return new RecoverableError(message, operation);
    }
    /**
     * Create a validation error
     */
    createValidationError(message, field, value) {
        return new ValidationError(message, field, value);
    }
    /**
     * Create a network error
     */
    createNetworkError(message, statusCode, endpoint) {
        return new NetworkError(message, statusCode, endpoint);
    }
    _generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    _normalizeContext(context) {
        if (typeof context === 'string') {
            return {
                timestamp: new Date(),
                operation: context
            };
        }
        return {
            timestamp: new Date(),
            ...context
        };
    }
    _createErrorReport(id, error, context) {
        return {
            id,
            error,
            context: {
                ...context,
                stack: error.stack
            },
            severity: this._determineSeverity(error),
            category: this._determineCategory(error),
            handled: false,
            recoverable: this._isRecoverable(error)
        };
    }
    _determineSeverity(error) {
        if (error instanceof SecurityError)
            return ErrorSeverity.CRITICAL;
        if (error instanceof SystemError)
            return ErrorSeverity.HIGH;
        if (error instanceof NetworkError)
            return ErrorSeverity.MEDIUM;
        if (error instanceof ValidationError)
            return ErrorSeverity.LOW;
        // Check error message for keywords
        const message = error.message.toLowerCase();
        if (message.includes('critical') || message.includes('fatal'))
            return ErrorSeverity.CRITICAL;
        if (message.includes('security') || message.includes('unauthorized'))
            return ErrorSeverity.CRITICAL;
        if (message.includes('system') || message.includes('crash'))
            return ErrorSeverity.HIGH;
        if (message.includes('network') || message.includes('timeout'))
            return ErrorSeverity.MEDIUM;
        return ErrorSeverity.LOW;
    }
    _determineCategory(error) {
        if (error instanceof SecurityError)
            return ErrorCategory.SECURITY;
        if (error instanceof NetworkError)
            return ErrorCategory.NETWORK;
        if (error instanceof ValidationError)
            return ErrorCategory.VALIDATION;
        if (error instanceof SystemError)
            return ErrorCategory.SYSTEM;
        // Check error message for keywords
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('connection'))
            return ErrorCategory.NETWORK;
        if (message.includes('validation') || message.includes('invalid'))
            return ErrorCategory.VALIDATION;
        if (message.includes('security') || message.includes('auth'))
            return ErrorCategory.SECURITY;
        if (message.includes('system') || message.includes('os'))
            return ErrorCategory.SYSTEM;
        return ErrorCategory.UNKNOWN;
    }
    _isRecoverable(error) {
        return error instanceof RecoverableError ||
            error instanceof NetworkError ||
            error instanceof ValidationError;
    }
    async _reportError(errorReport) {
        const reportPromises = this._reporters.map(async (reporter) => {
            try {
                await reporter.report(errorReport);
            }
            catch (reportError) {
                this.logger.error('Failed to report error', reportError);
            }
        });
        await Promise.all(reportPromises);
    }
    _registerDefaultHandlers() {
        // Validation error handler
        this.registerHandler({
            canHandle: (error) => error instanceof ValidationError,
            handle: async (error) => {
                this.logger.warn('Validation error handled', error.message);
                return true;
            },
            priority: 100
        });
        // Network error handler with retry logic
        this.registerHandler({
            canHandle: (error) => error instanceof NetworkError,
            handle: async (error) => {
                const networkError = error;
                if (networkError.statusCode && networkError.statusCode >= 500) {
                    this.logger.warn('Network error - server issue, may retry', error.message);
                    return false; // Don't mark as handled to allow retry
                }
                return true;
            },
            priority: 80
        });
        // Recoverable error handler
        this.registerHandler({
            canHandle: (error) => error instanceof RecoverableError,
            handle: async (error) => {
                const recoverableError = error;
                this.logger.info('Recoverable error handled', {
                    message: error.message,
                    operation: recoverableError.operation
                });
                return true;
            },
            priority: 60
        });
    }
}
exports.ErrorManager = ErrorManager;
/**
 * Custom error classes
 */
class RecoverableError extends Error {
    operation;
    constructor(message, operation) {
        super(message);
        this.operation = operation;
        this.name = 'RecoverableError';
    }
}
exports.RecoverableError = RecoverableError;
class ValidationError extends Error {
    field;
    value;
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NetworkError extends Error {
    statusCode;
    endpoint;
    constructor(message, statusCode, endpoint) {
        super(message);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class SecurityError extends Error {
    securityContext;
    constructor(message, securityContext) {
        super(message);
        this.securityContext = securityContext;
        this.name = 'SecurityError';
    }
}
exports.SecurityError = SecurityError;
class SystemError extends Error {
    systemContext;
    constructor(message, systemContext) {
        super(message);
        this.systemContext = systemContext;
        this.name = 'SystemError';
    }
}
exports.SystemError = SystemError;
//# sourceMappingURL=ErrorManager.js.map