"use strict";
/**
 * PowerScript Core - Main runtime and coordination class
 *
 * Provides the core functionality for PowerScript runtime environment,
 * configuration management, and module coordination.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptCore = exports.PowerScriptCoreEvent = void 0;
const EventDispatcher_1 = require("./EventDispatcher");
const Logger_1 = require("./Logger");
const ErrorManager_1 = require("./ErrorManager");
const ConfigLoader_1 = require("./ConfigLoader");
const DependencyContainer_1 = require("./DependencyContainer");
class PowerScriptCoreEvent extends EventDispatcher_1.Event {
    constructor(type, data, bubbles = false, cancelable = false) {
        super(type, bubbles, cancelable);
        this.data = data;
    }
}
exports.PowerScriptCoreEvent = PowerScriptCoreEvent;
PowerScriptCoreEvent.INITIALIZED = 'initialized';
PowerScriptCoreEvent.SHUTDOWN = 'shutdown';
PowerScriptCoreEvent.ERROR = 'error';
PowerScriptCoreEvent.CONFIG_CHANGED = 'configChanged';
PowerScriptCoreEvent.MODULE_LOADED = 'moduleLoaded';
PowerScriptCoreEvent.MODULE_UNLOADED = 'moduleUnloaded';
/**
 * Main PowerScript Core class that manages the runtime environment
 */
class PowerScriptCore extends EventDispatcher_1.EventDispatcher {
    constructor() {
        super();
        this._initialized = false;
        this._config = {};
        this._modules = new Map();
        this._startTime = Date.now();
        // Initialize core services
        this._logger = new Logger_1.Logger();
        this._errorManager = new ErrorManager_1.ErrorManager(this._logger);
        this._configLoader = new ConfigLoader_1.ConfigLoader();
        this._container = new DependencyContainer_1.DependencyContainer();
        // Register core services in container
        this._container.register('logger', this._logger);
        this._container.register('errorManager', this._errorManager);
        this._container.register('configLoader', this._configLoader);
        this._container.register('container', this._container);
        // Handle uncaught errors
        this._setupErrorHandling();
    }
    /**
     * Initialize PowerScript Core with configuration
     */
    async initialize(config) {
        if (this._initialized) {
            this._logger.warn('PowerScript Core already initialized');
            return;
        }
        try {
            // Load configuration
            this._config = await this._configLoader.load(config);
            // Configure logger
            if (this._config.runtime?.logLevel) {
                this._logger.setLevel(this._config.runtime.logLevel);
            }
            this._logger.info('Initializing PowerScript Core...');
            // Initialize core modules
            await this._initializeModules();
            this._initialized = true;
            this._logger.info('PowerScript Core initialized successfully');
            this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.INITIALIZED, { config: this._config, runtime: this.getRuntime() }));
        }
        catch (error) {
            this._errorManager.handleError(error, 'PowerScriptCore.initialize');
            throw error;
        }
    }
    /**
     * Shutdown PowerScript Core gracefully
     */
    async shutdown() {
        if (!this._initialized) {
            return;
        }
        this._logger.info('Shutting down PowerScript Core...');
        try {
            // Unload all modules
            for (const [name, module] of this._modules) {
                await this._unloadModule(name, module);
            }
            this._initialized = false;
            this._logger.info('PowerScript Core shutdown complete');
            this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.SHUTDOWN));
        }
        catch (error) {
            this._errorManager.handleError(error, 'PowerScriptCore.shutdown');
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this._config };
    }
    /**
     * Update configuration
     */
    async updateConfig(newConfig) {
        const oldConfig = { ...this._config };
        this._config = { ...this._config, ...newConfig };
        this._logger.info('Configuration updated');
        this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.CONFIG_CHANGED, { oldConfig, newConfig: this._config }));
    }
    /**
     * Get runtime information
     */
    getRuntime() {
        const memoryUsage = (typeof process !== 'undefined' && process.memoryUsage)
            ? process.memoryUsage()
            : { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };
        return {
            node: (typeof process !== 'undefined') ? process.version : 'unknown',
            platform: (typeof process !== 'undefined') ? process.platform : 'browser',
            arch: (typeof process !== 'undefined') ? process.arch : 'unknown',
            powerscript: this.getVersion(),
            features: {
                ai: this.hasFeature('ai'),
                ml: this.hasFeature('ml'),
                blockchain: this.hasFeature('blockchain'),
                iot: this.hasFeature('iot'),
                cloud: this.hasFeature('cloud'),
                quantum: this.hasFeature('quantum'),
                graphics: this.hasFeature('graphics'),
                audio: this.hasFeature('audio'),
                video: this.hasFeature('video')
            },
            memory: {
                used: memoryUsage.heapUsed || 0,
                available: memoryUsage.heapTotal - memoryUsage.heapUsed || 0,
                total: memoryUsage.heapTotal || 0
            },
            performance: {
                uptime: Date.now() - this._startTime,
                cpuUsage: this._getCPUUsage(),
                eventLoopLag: this._getEventLoopLag()
            }
        };
    }
    /**
     * Get PowerScript version
     */
    getVersion() {
        return '1.0.0'; // This would be loaded from package.json in real implementation
    }
    /**
     * Check if a feature is available
     */
    hasFeature(feature) {
        return this._modules.has(feature) || this._isFeatureBuiltin(feature);
    }
    /**
     * Load a module
     */
    async loadModule(name, module) {
        try {
            if (this._modules.has(name)) {
                this._logger.warn(`Module '${name}' already loaded`);
                return;
            }
            // Initialize module if it has an init method
            if (module.init && typeof module.init === 'function') {
                await module.init(this._config);
            }
            this._modules.set(name, module);
            this._logger.info(`Module '${name}' loaded successfully`);
            this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.MODULE_LOADED, { name, module }));
        }
        catch (error) {
            this._errorManager.handleError(error, `PowerScriptCore.loadModule(${name})`);
            throw error;
        }
    }
    /**
     * Unload a module
     */
    async unloadModule(name) {
        const module = this._modules.get(name);
        if (!module) {
            this._logger.warn(`Module '${name}' not found`);
            return;
        }
        await this._unloadModule(name, module);
    }
    /**
     * Get a loaded module
     */
    getModule(name) {
        return this._modules.get(name);
    }
    /**
     * Get all loaded modules
     */
    getModules() {
        return Array.from(this._modules.keys());
    }
    /**
     * Get the dependency injection container
     */
    getContainer() {
        return this._container;
    }
    /**
     * Get the logger instance
     */
    getLogger() {
        return this._logger;
    }
    /**
     * Get the error manager instance
     */
    getErrorManager() {
        return this._errorManager;
    }
    /**
     * Check if PowerScript is initialized
     */
    get initialized() {
        return this._initialized;
    }
    /**
     * Get uptime in milliseconds
     */
    get uptime() {
        return Date.now() - this._startTime;
    }
    async _initializeModules() {
        // Initialize built-in modules based on configuration
        const modulesToLoad = [];
        if (this._config.ai?.providers?.length) {
            modulesToLoad.push('ai');
        }
        if (this._config.ml?.backend) {
            modulesToLoad.push('ml');
        }
        // Load modules asynchronously
        const loadPromises = modulesToLoad.map(async (moduleName) => {
            try {
                // In a real implementation, this would dynamically load modules
                this._logger.debug(`Loading module: ${moduleName}`);
            }
            catch (error) {
                this._logger.error(`Failed to load module '${moduleName}':`, error);
            }
        });
        await Promise.all(loadPromises);
    }
    async _unloadModule(name, module) {
        try {
            // Cleanup module if it has a cleanup method
            if (module.cleanup && typeof module.cleanup === 'function') {
                await module.cleanup();
            }
            this._modules.delete(name);
            this._logger.info(`Module '${name}' unloaded successfully`);
            this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.MODULE_UNLOADED, { name, module }));
        }
        catch (error) {
            this._errorManager.handleError(error, `PowerScriptCore._unloadModule(${name})`);
        }
    }
    _setupErrorHandling() {
        // Global error handlers (Node.js specific)
        if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                this._errorManager.handleError(error, 'uncaughtException');
                this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.ERROR, { error, type: 'uncaughtException' }));
            });
            process.on('unhandledRejection', (reason, promise) => {
                const error = reason instanceof Error ? reason : new Error(String(reason));
                this._errorManager.handleError(error, 'unhandledRejection');
                this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.ERROR, { error, type: 'unhandledRejection', promise }));
            });
        }
        // Browser error handlers
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this._errorManager.handleError(event.error || new Error(event.message), 'window.error');
                this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.ERROR, { error: event.error, type: 'window.error' }));
            });
            window.addEventListener('unhandledrejection', (event) => {
                const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
                this._errorManager.handleError(error, 'window.unhandledrejection');
                this.dispatchEvent(new PowerScriptCoreEvent(PowerScriptCoreEvent.ERROR, { error, type: 'window.unhandledrejection' }));
            });
        }
    }
    _isFeatureBuiltin(feature) {
        const builtinFeatures = ['core', 'events', 'timer', 'vector', 'bytearray'];
        return builtinFeatures.includes(feature.toLowerCase());
    }
    _getCPUUsage() {
        // Simplified CPU usage calculation
        if (typeof process !== 'undefined' && process.cpuUsage) {
            const usage = process.cpuUsage();
            return (usage.user + usage.system) / 1000000; // Convert to seconds
        }
        return 0;
    }
    _getEventLoopLag() {
        // Simplified event loop lag measurement
        let start = Date.now();
        return new Promise((resolve) => {
            setImmediate(() => {
                resolve(Date.now() - start);
            });
        }); // Type assertion for synchronous return
    }
    toString() {
        return `[PowerScriptCore initialized=${this._initialized} modules=${this._modules.size} uptime=${this.uptime}ms]`;
    }
}
exports.PowerScriptCore = PowerScriptCore;
