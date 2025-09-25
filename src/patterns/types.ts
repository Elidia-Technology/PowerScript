/**
 * PowerScript Patterns Module - Type Definitions
 * Comprehensive type system for design patterns and best practices
 */

// Core Pattern Interfaces
export interface IPattern {
    readonly name: string;
    readonly description: string;
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}

// Singleton Pattern Types
export interface ISingleton {
    getInstance(): any;
}

export type SingletonConfig = {
    lazy?: boolean;
    threadSafe?: boolean;
};

// Observer Pattern Types
export interface IObserver<T = any> {
    update(data: T): void | Promise<void>;
}

export interface ISubject<T = any> {
    attach(observer: IObserver<T>): void;
    detach(observer: IObserver<T>): void;
    notify(data: T): Promise<void>;
}

export type ObserverConfig = {
    async?: boolean;
    errorHandling?: 'continue' | 'stop' | 'collect';
};

// Factory Pattern Types
export interface IFactory<T = any> {
    create(type: string, config?: any): T;
    register(type: string, constructor: new (...args: any[]) => T): void;
}

export type FactoryConfig = {
    allowOverride?: boolean;
    validateTypes?: boolean;
};

// Strategy Pattern Types
export interface IStrategy<TInput = any, TOutput = any> {
    execute(input: TInput): TOutput | Promise<TOutput>;
}

export interface IContext<TInput = any, TOutput = any> {
    setStrategy(strategy: IStrategy<TInput, TOutput>): void;
    executeStrategy(input: TInput): TOutput | Promise<TOutput>;
}

// Command Pattern Types
export interface ICommand {
    execute(): void | Promise<void>;
    undo?(): void | Promise<void>;
    canUndo?(): boolean;
}

export interface ICommandInvoker {
    execute(command: ICommand): Promise<void>;
    undo(): Promise<void>;
    getHistory(): ICommand[];
}

// Dependency Injection Types
export type ServiceIdentifier = string | symbol;
export type ServiceScope = 'singleton' | 'transient' | 'scoped';

export interface IServiceDescriptor {
    identifier: ServiceIdentifier;
    implementation: any;
    scope: ServiceScope;
    dependencies?: ServiceIdentifier[];
}

export interface IDependencyContainer {
    register<T>(descriptor: IServiceDescriptor): void;
    resolve<T>(identifier: ServiceIdentifier): T;
    hasRegistration(identifier: ServiceIdentifier): boolean;
    dispose(): Promise<void>;
}

// Configuration Management Types
export type ConfigFormat = 'json' | 'yaml' | 'env' | 'ini';

export interface IConfigProvider {
    load(source: string): Promise<Record<string, any>>;
    save(config: Record<string, any>, destination: string): Promise<void>;
    watch?(source: string, callback: (config: Record<string, any>) => void): void;
}

export interface IConfigManager {
    loadConfig(source: string, format?: ConfigFormat): Promise<void>;
    get<T = any>(key: string, defaultValue?: T): T;
    set(key: string, value: any): void;
    has(key: string): boolean;
    merge(config: Record<string, any>): void;
}

// Enhanced Logging Types
export enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}

export interface ILogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, any>;
    error?: Error;
    stack?: string;
}

export interface ILogFormatter {
    format(entry: ILogEntry): string;
}

export interface ILogTransport {
    log(entry: ILogEntry): Promise<void>;
}

export interface IEnhancedLogger {
    trace(message: string, context?: Record<string, any>): void;
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
    fatal(message: string, error?: Error, context?: Record<string, any>): void;
    
    setLevel(level: LogLevel): void;
    addTransport(transport: ILogTransport): void;
    child(context: Record<string, any>): IEnhancedLogger;
}

// Enhanced Error Management Types
export interface IErrorContext {
    timestamp: Date;
    operation?: string;
    userId?: string;
    sessionId?: string;
    additionalData?: Record<string, any>;
}

export interface IEnhancedError extends Error {
    code?: string;
    statusCode?: number;
    context?: IErrorContext;
    innerError?: Error;
    isRetryable?: boolean;
}

export interface IErrorHandler {
    handle(error: IEnhancedError): Promise<void>;
    canHandle(error: Error): boolean;
}

export interface IErrorManager {
    registerHandler(handler: IErrorHandler): void;
    handleError(error: Error, context?: IErrorContext): Promise<void>;
    createError(message: string, code?: string, statusCode?: number): IEnhancedError;
    wrapError(error: Error, context?: IErrorContext): IEnhancedError;
}

// Async Enhancement Types
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

export interface IRetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: Error) => boolean;
}

export interface ICircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
}

export interface IAsyncUtils {
    retry<T>(fn: AsyncFunction<T>, config: IRetryConfig): Promise<T>;
    timeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>;
    circuitBreaker<T>(fn: AsyncFunction<T>, config: ICircuitBreakerConfig): AsyncFunction<T>;
    debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T;
    throttle<T extends (...args: any[]) => any>(fn: T, interval: number): T;
}

// Security Enhancement Types
export interface ISecurityPolicy {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    maxRequestSize?: number;
    rateLimit?: {
        requests: number;
        windowMs: number;
    };
}

export interface ISecuritySandbox {
    execute<T>(code: string, context?: Record<string, any>): Promise<T>;
    validate(code: string): Promise<boolean>;
    getExecutionTime(): number;
    getMemoryUsage(): number;
}

// Main Module Types
export interface IPowerScriptPatterns {
    // Pattern Management
    readonly singleton: ISingleton;
    readonly observer: ISubject<any>;
    readonly factory: IFactory<any>;
    readonly command: ICommandInvoker;
    
    // Core Services
    readonly container: IDependencyContainer;
    readonly config: IConfigManager;
    readonly logger: IEnhancedLogger;
    readonly errorManager: IErrorManager;
    readonly asyncUtils: IAsyncUtils;
    readonly security: ISecuritySandbox;
    
    // Lifecycle
    initialize(): Promise<void>;
    dispose(): Promise<void>;
    getStatus(): {
        initialized: boolean;
        patterns: string[];
        services: string[];
        uptime: number;
    };
}

export interface IPatternsConfig {
    // Logging Configuration
    logging?: {
        level?: LogLevel;
        transports?: ('console' | 'file' | 'remote')[];
        format?: 'json' | 'text' | 'structured';
    };
    
    // DI Container Configuration
    container?: {
        autoWireEnabled?: boolean;
        circularDependencyCheck?: boolean;
    };
    
    // Security Configuration
    security?: ISecurityPolicy & {
        sandboxEnabled?: boolean;
        trustedModules?: string[];
    };
    
    // Performance Configuration
    performance?: {
        enableMetrics?: boolean;
        enableTracing?: boolean;
        metricsInterval?: number;
    };
}