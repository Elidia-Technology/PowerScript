/**
 * PowerScript ErrorManager - Comprehensive error handling and management
 * 
 * Provides structured error handling, reporting, and recovery mechanisms.
 */

import { Logger } from './Logger';

export interface ErrorContext {
  timestamp: Date;
  context?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: ErrorSeverity;
  category: ErrorCategory;
  handled: boolean;
  recoverable: boolean;
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  SYSTEM = 'system',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SECURITY = 'security',
  BUSINESS = 'business',
  UNKNOWN = 'unknown'
}

export interface ErrorHandler {
  canHandle(error: Error, context?: ErrorContext): boolean;
  handle(error: Error, context?: ErrorContext): Promise<boolean>;
  priority: number;
}

export interface ErrorReporter {
  report(errorReport: ErrorReport): Promise<void>;
}

/**
 * Console error reporter for development
 */
export class ConsoleErrorReporter implements ErrorReporter {
  constructor(private logger: Logger) {}

  async report(errorReport: ErrorReport): Promise<void> {
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

/**
 * PowerScript Error Manager
 */
export class ErrorManager {
  private _handlers: ErrorHandler[] = [];
  private _reporters: ErrorReporter[] = [];
  private _errorCount: number = 0;
  private _errors: Map<string, ErrorReport> = new Map();

  constructor(private logger: Logger) {
    // Add default console reporter
    this._reporters.push(new ConsoleErrorReporter(logger));
    
    // Register default handlers
    this._registerDefaultHandlers();
  }

  /**
   * Handle an error with optional context
   */
  public async handleError(error: Error, context?: string | ErrorContext): Promise<ErrorReport> {
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
      } catch (handlerError) {
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
  public registerHandler(handler: ErrorHandler): void {
    this._handlers.push(handler);
    // Sort by priority (highest first)
    this._handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Unregister an error handler
   */
  public unregisterHandler(handler: ErrorHandler): void {
    const index = this._handlers.indexOf(handler);
    if (index !== -1) {
      this._handlers.splice(index, 1);
    }
  }

  /**
   * Register an error reporter
   */
  public registerReporter(reporter: ErrorReporter): void {
    this._reporters.push(reporter);
  }

  /**
   * Unregister an error reporter
   */
  public unregisterReporter(reporter: ErrorReporter): void {
    const index = this._reporters.indexOf(reporter);
    if (index !== -1) {
      this._reporters.splice(index, 1);
    }
  }

  /**
   * Get error statistics
   */
  public getStats(): {
    totalErrors: number;
    handledErrors: number;
    unhandledErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      totalErrors: this._errorCount,
      handledErrors: 0,
      unhandledErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>
    };

    // Initialize counters
    for (const category of Object.values(ErrorCategory)) {
      stats.errorsByCategory[category] = 0;
    }
    for (const severity of Object.values(ErrorSeverity)) {
      stats.errorsBySeverity[severity] = 0;
    }

    // Count errors
    for (const errorReport of Array.from(this._errors.values())) {
      if (errorReport.handled) {
        stats.handledErrors++;
      } else {
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
  public getRecentErrors(limit: number = 10): ErrorReport[] {
    const errors = Array.from(this._errors.values());
    return errors
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear error history
   */
  public clearErrors(): void {
    this._errors.clear();
    this._errorCount = 0;
  }

  /**
   * Create a recoverable error
   */
  public createRecoverableError(message: string, operation?: string): RecoverableError {
    return new RecoverableError(message, operation);
  }

  /**
   * Create a validation error
   */
  public createValidationError(message: string, field?: string, value?: any): ValidationError {
    return new ValidationError(message, field, value);
  }

  /**
   * Create a network error
   */
  public createNetworkError(message: string, statusCode?: number, endpoint?: string): NetworkError {
    return new NetworkError(message, statusCode, endpoint);
  }

  private _generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private _normalizeContext(context?: string | ErrorContext): ErrorContext {
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

  private _createErrorReport(id: string, error: Error, context: ErrorContext): ErrorReport {
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

  private _determineSeverity(error: Error): ErrorSeverity {
    if (error instanceof SecurityError) return ErrorSeverity.CRITICAL;
    if (error instanceof SystemError) return ErrorSeverity.HIGH;
    if (error instanceof NetworkError) return ErrorSeverity.MEDIUM;
    if (error instanceof ValidationError) return ErrorSeverity.LOW;
    
    // Check error message for keywords
    const message = error.message.toLowerCase();
    if (message.includes('critical') || message.includes('fatal')) return ErrorSeverity.CRITICAL;
    if (message.includes('security') || message.includes('unauthorized')) return ErrorSeverity.CRITICAL;
    if (message.includes('system') || message.includes('crash')) return ErrorSeverity.HIGH;
    if (message.includes('network') || message.includes('timeout')) return ErrorSeverity.MEDIUM;
    
    return ErrorSeverity.LOW;
  }

  private _determineCategory(error: Error): ErrorCategory {
    if (error instanceof SecurityError) return ErrorCategory.SECURITY;
    if (error instanceof NetworkError) return ErrorCategory.NETWORK;
    if (error instanceof ValidationError) return ErrorCategory.VALIDATION;
    if (error instanceof SystemError) return ErrorCategory.SYSTEM;
    
    // Check error message for keywords
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('connection')) return ErrorCategory.NETWORK;
    if (message.includes('validation') || message.includes('invalid')) return ErrorCategory.VALIDATION;
    if (message.includes('security') || message.includes('auth')) return ErrorCategory.SECURITY;
    if (message.includes('system') || message.includes('os')) return ErrorCategory.SYSTEM;
    
    return ErrorCategory.UNKNOWN;
  }

  private _isRecoverable(error: Error): boolean {
    return error instanceof RecoverableError || 
           error instanceof NetworkError ||
           error instanceof ValidationError;
  }

  private async _reportError(errorReport: ErrorReport): Promise<void> {
    const reportPromises = this._reporters.map(async (reporter) => {
      try {
        await reporter.report(errorReport);
      } catch (reportError) {
        this.logger.error('Failed to report error', reportError);
      }
    });

    await Promise.all(reportPromises);
  }

  private _registerDefaultHandlers(): void {
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
        const networkError = error as NetworkError;
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
        const recoverableError = error as RecoverableError;
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

/**
 * Custom error classes
 */
export class RecoverableError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'RecoverableError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number, public endpoint?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class SecurityError extends Error {
  constructor(message: string, public securityContext?: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class SystemError extends Error {
  constructor(message: string, public systemContext?: string) {
    super(message);
    this.name = 'SystemError';
  }
}