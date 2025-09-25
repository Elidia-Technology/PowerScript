/**
 * PowerScript Patterns Module - Entry Point
 * Best practices and design patterns for PowerScript framework
 */

// Main module exports
export { PowerScriptPatterns, getPowerScriptPatterns, resetPowerScriptPatterns } from './PowerScriptPatterns';

// Type definitions
export * from './types';

// Core patterns
export * from './core/DesignPatterns';

// Services
export * from './di/DependencyContainer';
export * from './logging/EnhancedLogger';
export * from './errors/ErrorManager';
export * from './config/ConfigManager';
export * from './async/AsyncUtils';

// Utility exports for convenience
export {
    // Dependency Injection
    getGlobalContainer,
    setGlobalContainer,
    Injectable,
    Inject,

    // Logging
    LogLevel,
    LoggerFactory,
    ConsoleTransport,
    FileTransport,
    JsonFormatter,
    TextFormatter,

    // Error Management
    EnhancedError,
    ValidationError,
    NetworkError,
    ConfigurationError,
    SecurityError,
    getGlobalErrorManager,
    setGlobalErrorManager,
    isRetryableError,
    getErrorCode,
    getErrorContext,

    // Design Patterns
    Singleton,
    Subject,
    Factory,
    Context,
    CommandInvoker,
    SortStrategy,
    SimpleCommand,
    ValueChangeCommand,

    // Config Management
    JsonConfigProvider,
    EnvConfigProvider,
    YamlConfigProvider,

    // Async Utilities
    RetryUtility,
    CircuitBreaker,
    TimeoutUtility,
    DebounceUtility,
    ThrottleUtility,
    asyncUtils
} from './PowerScriptPatterns';