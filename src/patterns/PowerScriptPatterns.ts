/**
 * PowerScript Patterns Module - Main Orchestrator
 * Comprehensive best practices and design patterns for PowerScript framework
 */

import { 
    IPowerScriptPatterns, 
    IPatternsConfig, 
    LogLevel 
} from './types';

// Core Pattern Imports
import { 
    Singleton, 
    Subject, 
    Factory, 
    Context, 
    CommandInvoker 
} from './core/DesignPatterns';

// Service Imports
import { DependencyContainer } from './di/DependencyContainer';
import { ConfigManager } from './config/ConfigManager';
import { EnhancedLogger, LoggerFactory, ConsoleTransport } from './logging/EnhancedLogger';
import { ErrorManager, getGlobalErrorManager } from './errors/ErrorManager';
import { AsyncUtils } from './async/AsyncUtils';

/**
 * Security Sandbox Implementation (Basic)
 */
export class SecuritySandbox {
    private maxExecutionTime: number = 5000; // 5 seconds
    private maxMemoryUsage: number = 100 * 1024 * 1024; // 100MB
    private executionStartTime: number = 0;
    private memoryStartUsage: number = 0;

    constructor(private config: {
        maxExecutionTime?: number;
        maxMemoryUsage?: number;
        trustedModules?: string[];
    } = {}) {
        this.maxExecutionTime = config.maxExecutionTime || 5000;
        this.maxMemoryUsage = config.maxMemoryUsage || 100 * 1024 * 1024;
    }

    async execute<T>(code: string, context: Record<string, any> = {}): Promise<T> {
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
        } catch (error) {
            throw new Error(`Sandbox execution failed: ${(error as Error).message}`);
        }
    }

    async validate(code: string): Promise<boolean> {
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

    getExecutionTime(): number {
        return Date.now() - this.executionStartTime;
    }

    getMemoryUsage(): number {
        // Simplified memory usage calculation
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return 0;
    }

    private createIsolatedContext(userContext: Record<string, any>): Record<string, any> {
        // Create safe context with limited globals
        return {
            ...userContext,
            console: {
                log: (...args: any[]) => console.log('[SANDBOX]', ...args),
                error: (...args: any[]) => console.error('[SANDBOX]', ...args),
                warn: (...args: any[]) => console.warn('[SANDBOX]', ...args),
            },
            setTimeout: (fn: Function, delay: number) => setTimeout(fn, Math.min(delay, 1000)),
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

    private async executeInSandbox<T>(code: string, context: Record<string, any>): Promise<T> {
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
        } catch (error) {
            throw new Error(`Code execution failed: ${(error as Error).message}`);
        }
    }
}

/**
 * Main PowerScript Patterns Implementation
 */
export class PowerScriptPatterns implements IPowerScriptPatterns {
    // Pattern instances
    public readonly singleton = Singleton;
    public readonly observer = new Subject();
    public readonly factory = new Factory();
    public readonly command = new CommandInvoker();

    // Service instances
    public readonly container: DependencyContainer;
    public readonly config: ConfigManager;
    public readonly logger: EnhancedLogger;
    public readonly errorManager: ErrorManager;
    public readonly asyncUtils: AsyncUtils;
    public readonly security: SecuritySandbox;

    private initialized = false;
    private initializationTime: number = 0;

    constructor(private patternsConfig: IPatternsConfig = {}) {
        // Initialize core services
        this.container = new DependencyContainer(patternsConfig.container);
        this.config = new ConfigManager();
        this.errorManager = getGlobalErrorManager() as ErrorManager;
        this.asyncUtils = new AsyncUtils();
        this.security = new SecuritySandbox(patternsConfig.security);

        // Initialize logger with configuration
        this.logger = this.createLogger();

        // Register core services with DI container
        this.registerCoreServices();
    }

    async initialize(): Promise<void> {
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

        } catch (error) {
            this.logger.error('Failed to initialize PowerScript Patterns', error as Error);
            throw error;
        }
    }

    async dispose(): Promise<void> {
        if (!this.initialized) return;

        this.logger.info('Disposing PowerScript Patterns Module...');

        try {
            // Dispose services
            await this.container.dispose();
            
            // Clear patterns
            Singleton.clear();
            this.observer.clear();
            this.factory.clear();
            this.command.clear();

            this.initialized = false;
            this.logger.info('PowerScript Patterns Module disposed successfully');

        } catch (error) {
            this.logger.error('Error during disposal', error as Error);
            throw error;
        }
    }

    getStatus(): {
        initialized: boolean;
        patterns: string[];
        services: string[];
        uptime: number;
    } {
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
    getStats(): {
        status: ReturnType<typeof this.getStatus>;
        container: ReturnType<DependencyContainer['getStats']>;
        config: ReturnType<ConfigManager['getStats']>;
        logger: ReturnType<EnhancedLogger['getStats']>;
        errorManager: ReturnType<ErrorManager['getErrorStats']>;
        observer: { observerCount: number };
        factory: { registeredTypes: string[] };
        command: ReturnType<CommandInvoker['getStats']>;
    } {
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

    private createLogger(): EnhancedLogger {
        const loggingConfig = this.patternsConfig.logging || {};
        const transports = [];

        // Add console transport
        if (!loggingConfig.transports || loggingConfig.transports.includes('console')) {
            transports.push(new ConsoleTransport());
        }

        return LoggerFactory.createLogger({
            name: 'PowerScriptPatterns',
            level: loggingConfig.level || LogLevel.INFO,
            transports
        });
    }

    private registerCoreServices(): void {
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

    private async loadDefaultConfig(): Promise<void> {
        try {
            // Load environment configuration
            await this.config.loadConfig('app', 'env');
            
            this.logger.debug('Default configuration loaded', {
                sections: this.config.getStats().configSections
            });
        } catch (error) {
            this.logger.warn('Failed to load environment config, using defaults', {
                error: (error as Error).message
            });
        }
    }

    private async initializePatterns(): Promise<void> {
        // Initialize factory with common types
        this.factory.register('logger', EnhancedLogger as any);
        this.factory.register('config', ConfigManager as any);
        this.factory.register('container', DependencyContainer as any);

        this.logger.debug('Design patterns initialized');
    }

    private async setupErrorHandling(): Promise<void> {
        // Setup global error handlers for unhandled promise rejections
        if (typeof process !== 'undefined') {
            process.on('unhandledRejection', (reason, promise) => {
                this.errorManager.handleError(
                    new Error(`Unhandled Promise Rejection: ${reason}`),
                    {
                        timestamp: new Date(),
                        operation: 'unhandled_promise_rejection',
                        additionalData: { promise: promise.toString() }
                    }
                );
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

    private setupShutdownHandlers(): void {
        if (typeof process !== 'undefined') {
            const gracefulShutdown = async (signal: string) => {
                this.logger.info(`Received ${signal}, shutting down gracefully...`);
                try {
                    await this.dispose();
                    process.exit(0);
                } catch (error) {
                    this.logger.error('Error during shutdown', error as Error);
                    process.exit(1);
                }
            };

            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        }
    }
}

/**
 * Global Patterns Instance
 */
let globalPatterns: PowerScriptPatterns | null = null;

export function getPowerScriptPatterns(config?: IPatternsConfig): PowerScriptPatterns {
    if (!globalPatterns) {
        globalPatterns = new PowerScriptPatterns(config);
    }
    return globalPatterns;
}

export function resetPowerScriptPatterns(): void {
    if (globalPatterns) {
        globalPatterns.dispose();
        globalPatterns = null;
    }
}

// Export everything
export * from './types';
export * from './di/DependencyContainer';
export * from './logging/EnhancedLogger';
export * from './errors/ErrorManager';
export * from './core/DesignPatterns';
export * from './config/ConfigManager';
export * from './async/AsyncUtils';