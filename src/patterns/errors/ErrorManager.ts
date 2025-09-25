/**
 * PowerScript Enhanced Error Management
 * Advanced error handling with context and recovery strategies
 */

import { 
    IEnhancedError, 
    IErrorContext, 
    IErrorHandler, 
    IErrorManager 
} from '../types';
import { LoggerFactory } from '../logging/EnhancedLogger';

/**
 * Enhanced Error Implementation
 */
export class EnhancedError extends Error implements IEnhancedError {
    public readonly code?: string;
    public readonly statusCode?: number;
    public readonly context?: IErrorContext;
    public readonly innerError?: Error;
    public readonly isRetryable?: boolean;

    constructor(
        message: string,
        options: {
            code?: string;
            statusCode?: number;
            context?: IErrorContext;
            innerError?: Error;
            isRetryable?: boolean;
        } = {}
    ) {
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
    toJSON(): any {
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

/**
 * Specific Error Types
 */
export class ValidationError extends EnhancedError {
    constructor(message: string, field?: string, value?: any) {
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

export class NetworkError extends EnhancedError {
    constructor(message: string, url?: string, method?: string) {
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

export class ConfigurationError extends EnhancedError {
    constructor(message: string, configKey?: string) {
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

export class SecurityError extends EnhancedError {
    constructor(message: string, operation?: string) {
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

/**
 * Error Handler Implementations
 */
export class ValidationErrorHandler implements IErrorHandler {
    canHandle(error: Error): boolean {
        return error instanceof ValidationError || 
               (error as any).code === 'VALIDATION_ERROR';
    }

    async handle(error: IEnhancedError): Promise<void> {
        const logger = LoggerFactory.getDefaultLogger();
        
        logger.warn('Validation error occurred', {
            message: error.message,
            code: error.code,
            context: error.context
        });

        // Could implement additional validation error handling
        // e.g., field-specific error collection, form validation feedback
    }
}

export class NetworkErrorHandler implements IErrorHandler {
    canHandle(error: Error): boolean {
        return error instanceof NetworkError || 
               (error as any).code === 'NETWORK_ERROR' ||
               error.name === 'FetchError' ||
               error.message.includes('ECONNREFUSED');
    }

    async handle(error: IEnhancedError): Promise<void> {
        const logger = LoggerFactory.getDefaultLogger();
        
        if (error.isRetryable) {
            logger.warn('Retryable network error', {
                message: error.message,
                context: error.context
            });
        } else {
            logger.error('Network error (not retryable)', error, {
                context: error.context
            });
        }
    }
}

export class DefaultErrorHandler implements IErrorHandler {
    canHandle(error: Error): boolean {
        return true; // Handles all errors
    }

    async handle(error: IEnhancedError): Promise<void> {
        const logger = LoggerFactory.getDefaultLogger();
        
        logger.error('Unhandled error', error, {
            name: error.name,
            code: error.code,
            context: error.context
        });
    }
}

/**
 * Enhanced Error Manager Implementation
 */
export class ErrorManager implements IErrorManager {
    private handlers: IErrorHandler[] = [];
    private errorCounts = new Map<string, number>();
    private lastErrors: IEnhancedError[] = [];
    private maxLastErrors = 100;

    constructor() {
        // Register default handlers
        this.registerHandler(new ValidationErrorHandler());
        this.registerHandler(new NetworkErrorHandler());
        this.registerHandler(new DefaultErrorHandler()); // Must be last
    }

    registerHandler(handler: IErrorHandler): void {
        this.handlers.push(handler);
    }

    async handleError(error: Error, context?: IErrorContext): Promise<void> {
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
                } catch (handlerError) {
                    console.error('Error handler failed:', handlerError);
                    // Continue to next handler
                }
            }
        }
    }

    createError(message: string, code?: string, statusCode?: number): IEnhancedError {
        return new EnhancedError(message, {
            code,
            statusCode,
            context: {
                timestamp: new Date(),
                operation: 'error_creation'
            }
        });
    }

    wrapError(error: Error, context?: IErrorContext): IEnhancedError {
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
    getErrorStats(): {
        totalHandlers: number;
        errorCounts: Record<string, number>;
        recentErrors: number;
        topErrors: Array<{ code: string; count: number }>;
    } {
        const topErrors = Array.from(this.errorCounts.entries())
            .sort(([,a], [,b]) => b - a)
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
    getRecentErrors(limit: number = 10): IEnhancedError[] {
        return this.lastErrors.slice(-limit);
    }

    /**
     * Clear error statistics
     */
    clearStats(): void {
        this.errorCounts.clear();
        this.lastErrors = [];
    }

    private ensureEnhancedError(error: Error, context?: IErrorContext): IEnhancedError {
        if (error instanceof EnhancedError) {
            return context ? this.wrapError(error, context) : error;
        }

        return this.wrapError(error, context);
    }

    private trackError(error: IEnhancedError): void {
        const key = error.code || error.name || 'UNKNOWN_ERROR';
        this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
}

/**
 * Global Error Manager Instance
 */
let globalErrorManager: IErrorManager | null = null;

export function getGlobalErrorManager(): IErrorManager {
    if (!globalErrorManager) {
        globalErrorManager = new ErrorManager();
    }
    return globalErrorManager;
}

export function setGlobalErrorManager(manager: IErrorManager): void {
    globalErrorManager = manager;
}

/**
 * Utility Functions
 */
export function isRetryableError(error: Error): boolean {
    return (error as IEnhancedError).isRetryable === true ||
           error instanceof NetworkError ||
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('timeout');
}

export function getErrorCode(error: Error): string {
    return (error as IEnhancedError).code || error.name || 'UNKNOWN_ERROR';
}

export function getErrorContext(error: Error): IErrorContext | undefined {
    return (error as IEnhancedError).context;
}