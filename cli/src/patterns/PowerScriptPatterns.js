"use strict";
/**
 * PowerScript Patterns Module - Main Orchestrator
 * Comprehensive best practices and design patterns for PowerScript framework
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptPatterns = exports.SecuritySandbox = void 0;
exports.getPowerScriptPatterns = getPowerScriptPatterns;
exports.resetPowerScriptPatterns = resetPowerScriptPatterns;
const types_1 = require("./types");
// Core Pattern Imports
const DesignPatterns_1 = require("./core/DesignPatterns");
// Service Imports
const DependencyContainer_1 = require("./di/DependencyContainer");
const ConfigManager_1 = require("./config/ConfigManager");
const EnhancedLogger_1 = require("./logging/EnhancedLogger");
const ErrorManager_1 = require("./errors/ErrorManager");
const AsyncUtils_1 = require("./async/AsyncUtils");
/**
 * Security Sandbox Implementation (Basic)
 */
class SecuritySandbox {
    constructor(config = {}) {
        this.config = config;
        this.maxExecutionTime = 5000; // 5 seconds
        this.maxMemoryUsage = 100 * 1024 * 1024; // 100MB
        this.executionStartTime = 0;
        this.memoryStartUsage = 0;
        this.maxExecutionTime = config.maxExecutionTime || 5000;
        this.maxMemoryUsage = config.maxMemoryUsage || 100 * 1024 * 1024;
    }
    async execute(code, context = {}) {
        this.executionStartTime = Date.now();
        this.memoryStartUsage = this.getMemoryUsage();
        try {
            // Basic code validation
            if (!await this.validate(code)) {
                throw new Error('Code validation failed');
            }
            // Create isolated context
            const isolatedContext = this.createIsolatedContext(context);
            // Execute code (simplified - in production would use vm or worker_threads)
            const result = await this.executeInSandbox(code, isolatedContext);
            return result;
        }
        catch (error) {
            throw new Error(`Sandbox execution failed: ${error.message}`);
        }
    }
    async validate(code) {
        // Basic validation rules
        const forbiddenPatterns = [
            'require\\s*\\(',
            'import\\s+',
            'process\\.',
            'global\\.',
            'eval\\s*\\(',
            'Function\\s*\\(',
            '__dirname',
            '__filename'
        ];
        for (const pattern of forbiddenPatterns) {
            if (new RegExp(pattern).test(code)) {
                return false;
            }
        }
        return true;
    }
    getExecutionTime() {
        return Date.now() - this.executionStartTime;
    }
    getMemoryUsage() {
        // Simplified memory usage calculation
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return 0;
    }
    createIsolatedContext(userContext) {
        // Create safe context with limited globals
        return {
            ...userContext,
            console: {
                log: (...args) => console.log('[SANDBOX]', ...args),
                error: (...args) => console.error('[SANDBOX]', ...args),
                warn: (...args) => console.warn('[SANDBOX]', ...args),
            },
            setTimeout: (fn, delay) => setTimeout(fn, Math.min(delay, 1000)),
            Math,
            Date,
            JSON,
            Object,
            Array,
            String,
            Number,
            Boolean
        };
    }
    async executeInSandbox(code, context) {
        // Simplified execution - in production would use proper sandboxing
        const wrappedCode = `
            (function(context) {
                with (context) {
                    return (function() {
                        ${code}
                    })();
                }
            })
        `;
        try {
            const executor = eval(wrappedCode);
            const result = await executor(context);
            return result;
        }
        catch (error) {
            throw new Error(`Code execution failed: ${error.message}`);
        }
    }
}
exports.SecuritySandbox = SecuritySandbox;
/**
 * Main PowerScript Patterns Implementation
 */
class PowerScriptPatterns {
    constructor(patternsConfig = {}) {
        this.patternsConfig = patternsConfig;
        // Pattern instances
        this.singleton = new DesignPatterns_1.Singleton();
        this.observer = new DesignPatterns_1.Subject();
        this.factory = new DesignPatterns_1.Factory();
        this.command = new DesignPatterns_1.CommandInvoker();
        this.initialized = false;
        this.initializationTime = 0;
        // Initialize core services
        this.container = new DependencyContainer_1.DependencyContainer(patternsConfig.container);
        this.config = new ConfigManager_1.ConfigManager();
        this.errorManager = (0, ErrorManager_1.getGlobalErrorManager)();
        this.asyncUtils = new AsyncUtils_1.AsyncUtils();
        this.security = new SecuritySandbox(patternsConfig.security);
        // Initialize logger with configuration
        this.logger = this.createLogger();
        // Register core services with DI container
        this.registerCoreServices();
    }
    async initialize() {
        if (this.initialized) {
            this.logger.warn('PowerScriptPatterns already initialized');
            return;
        }
        this.initializationTime = Date.now();
        this.logger.info('Initializing PowerScript Patterns Module...');
        try {
            // Load default configuration
            await this.loadDefaultConfig();
            // Initialize patterns
            await this.initializePatterns();
            // Setup error handling
            await this.setupErrorHandling();
            // Register shutdown handlers
            this.setupShutdownHandlers();
            this.initialized = true;
            this.logger.info('PowerScript Patterns Module initialized successfully', {
                initTime: Date.now() - this.initializationTime,
                patterns: this.getStatus().patterns,
                services: this.getStatus().services
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize PowerScript Patterns', error);
            throw error;
        }
    }
    async dispose() {
        if (!this.initialized)
            return;
        this.logger.info('Disposing PowerScript Patterns Module...');
        try {
            // Dispose services
            await this.container.dispose();
            // Clear patterns
            DesignPatterns_1.Singleton.clear();
            this.observer.clear();
            this.factory.clear();
            this.command.clear();
            this.initialized = false;
            this.logger.info('PowerScript Patterns Module disposed successfully');
        }
        catch (error) {
            this.logger.error('Error during disposal', error);
            throw error;
        }
    }
    getStatus() {
        return {
            initialized: this.initialized,
            patterns: ['singleton', 'observer', 'factory', 'strategy', 'command'],
            services: ['container', 'config', 'logger', 'errorManager', 'asyncUtils', 'security'],
            uptime: this.initialized ? (Date.now() - this.initializationTime) / 1000 : 0
        };
    }
    /**
     * Get comprehensive module statistics
     */
    getStats() {
        return {
            status: this.getStatus(),
            container: this.container.getStats(),
            config: this.config.getStats(),
            logger: this.logger.getStats(),
            errorManager: this.errorManager.getErrorStats(),
            observer: { observerCount: this.observer.getObserverCount() },
            factory: { registeredTypes: this.factory.getRegisteredTypes() },
            command: this.command.getStats()
        };
    }
    createLogger() {
        const loggingConfig = this.patternsConfig.logging || {};
        const transports = [];
        // Add console transport
        if (!loggingConfig.transports || loggingConfig.transports.includes('console')) {
            transports.push(new EnhancedLogger_1.ConsoleTransport());
        }
        return EnhancedLogger_1.LoggerFactory.createLogger({
            name: 'PowerScriptPatterns',
            level: loggingConfig.level || types_1.LogLevel.INFO,
            transports
        });
    }
    registerCoreServices() {
        // Register services with DI container
        this.container.registerInstance('logger', this.logger);
        this.container.registerInstance('config', this.config);
        this.container.registerInstance('errorManager', this.errorManager);
        this.container.registerInstance('asyncUtils', this.asyncUtils);
        this.container.registerInstance('security', this.security);
        // Register pattern instances
        this.container.registerInstance('singleton', this.singleton);
        this.container.registerInstance('observer', this.observer);
        this.container.registerInstance('factory', this.factory);
        this.container.registerInstance('command', this.command);
    }
    async loadDefaultConfig() {
        try {
            // Load environment configuration
            await this.config.loadConfig('app', 'env');
            this.logger.debug('Default configuration loaded', {
                sections: this.config.getStats().configSections
            });
        }
        catch (error) {
            this.logger.warn('Failed to load environment config, using defaults', {
                error: error.message
            });
        }
    }
    async initializePatterns() {
        // Initialize factory with common types
        this.factory.register('logger', EnhancedLogger_1.EnhancedLogger);
        this.factory.register('config', ConfigManager_1.ConfigManager);
        this.factory.register('container', DependencyContainer_1.DependencyContainer);
        this.logger.debug('Design patterns initialized');
    }
    async setupErrorHandling() {
        // Setup global error handlers for unhandled promise rejections
        if (typeof process !== 'undefined') {
            process.on('unhandledRejection', (reason, promise) => {
                this.errorManager.handleError(new Error(`Unhandled Promise Rejection: ${reason}`), {
                    timestamp: new Date(),
                    operation: 'unhandled_promise_rejection',
                    additionalData: { promise: promise.toString() }
                });
            });
            process.on('uncaughtException', (error) => {
                this.errorManager.handleError(error, {
                    timestamp: new Date(),
                    operation: 'uncaught_exception'
                });
            });
        }
        this.logger.debug('Error handling setup complete');
    }
    setupShutdownHandlers() {
        if (typeof process !== 'undefined') {
            const gracefulShutdown = async (signal) => {
                this.logger.info(`Received ${signal}, shutting down gracefully...`);
                try {
                    await this.dispose();
                    process.exit(0);
                }
                catch (error) {
                    this.logger.error('Error during shutdown', error);
                    process.exit(1);
                }
            };
            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        }
    }
}
exports.PowerScriptPatterns = PowerScriptPatterns;
/**
 * Global Patterns Instance
 */
let globalPatterns = null;
function getPowerScriptPatterns(config) {
    if (!globalPatterns) {
        globalPatterns = new PowerScriptPatterns(config);
    }
    return globalPatterns;
}
function resetPowerScriptPatterns() {
    if (globalPatterns) {
        globalPatterns.dispose();
        globalPatterns = null;
    }
}
// Export everything
__exportStar(require("./types"), exports);
__exportStar(require("./di/DependencyContainer"), exports);
__exportStar(require("./logging/EnhancedLogger"), exports);
__exportStar(require("./errors/ErrorManager"), exports);
__exportStar(require("./core/DesignPatterns"), exports);
__exportStar(require("./config/ConfigManager"), exports);
__exportStar(require("./async/AsyncUtils"), exports);
