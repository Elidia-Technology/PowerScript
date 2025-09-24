/**
 * PowerScript Core - Main runtime and coordination class
 * 
 * Provides the core functionality for PowerScript runtime environment,
 * configuration management, and module coordination.
 */

import { EventDispatcher, Event } from './EventDispatcher';
import { Logger } from './Logger';
import { ErrorManager } from './ErrorManager';
import { ConfigLoader } from './ConfigLoader';
import { DependencyContainer } from './DependencyContainer';

export interface PowerScriptConfig {
  runtime?: {
    sandbox?: boolean;
    strictMode?: boolean;
    debugMode?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  };
  ai?: {
    providers?: string[];
    defaultProvider?: string;
    apiKeys?: Record<string, string>;
  };
  ml?: {
    backend?: 'tensorflow' | 'pytorch' | 'onnx';
    device?: 'cpu' | 'gpu' | 'auto';
  };
  compiler?: {
    target?: 'es5' | 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext';
    module?: 'commonjs' | 'es6' | 'amd' | 'umd';
    sourceMaps?: boolean;
    minify?: boolean;
  };
  security?: {
    encryption?: {
      algorithm?: 'AES' | 'RSA' | 'ECC';
      keySize?: number;
    };
    sandbox?: {
      enabled?: boolean;
      allowedModules?: string[];
      restrictedAPIs?: string[];
    };
  };
  networking?: {
    timeout?: number;
    retries?: number;
    maxConnections?: number;
  };
  storage?: {
    defaultProvider?: 'local' | 's3' | 'gcs' | 'azure';
    cacheSize?: number;
    compression?: boolean;
  };
}

export interface PowerScriptRuntime {
  node: string;
  platform: string;
  arch: string;
  powerscript: string;
  features: {
    ai: boolean;
    ml: boolean;
    blockchain: boolean;
    iot: boolean;
    cloud: boolean;
    quantum: boolean;
    graphics: boolean;
    audio: boolean;
    video: boolean;
  };
  memory: {
    used: number;
    available: number;
    total: number;
  };
  performance: {
    uptime: number;
    cpuUsage: number;
    eventLoopLag: number;
  };
}

export class PowerScriptCoreEvent extends Event {
  public static readonly INITIALIZED = 'initialized';
  public static readonly SHUTDOWN = 'shutdown';
  public static readonly ERROR = 'error';
  public static readonly CONFIG_CHANGED = 'configChanged';
  public static readonly MODULE_LOADED = 'moduleLoaded';
  public static readonly MODULE_UNLOADED = 'moduleUnloaded';

  constructor(type: string, data?: any, bubbles: boolean = false, cancelable: boolean = false) {
    super(type, bubbles, cancelable);
    this.data = data;
  }

  public data: any;
}

/**
 * Main PowerScript Core class that manages the runtime environment
 */
export class PowerScriptCore extends EventDispatcher {
  private _initialized: boolean = false;
  private _config: PowerScriptConfig = {};
  private _logger: Logger;
  private _errorManager: ErrorManager;
  private _configLoader: ConfigLoader;
  private _container: DependencyContainer;
  private _modules: Map<string, any> = new Map();
  private _startTime: number = Date.now();

  constructor() {
    super();
    
    // Initialize core services
    this._logger = new Logger();
    this._errorManager = new ErrorManager(this._logger);
    this._configLoader = new ConfigLoader();
    this._container = new DependencyContainer();
    
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
  public async initialize(config?: PowerScriptConfig): Promise<void> {
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
      
      this.dispatchEvent(new PowerScriptCoreEvent(
        PowerScriptCoreEvent.INITIALIZED,
        { config: this._config, runtime: this.getRuntime() }
      ));
      
    } catch (error) {
      this._errorManager.handleError(error as Error, 'PowerScriptCore.initialize');
      throw error;
    }
  }

  /**
   * Shutdown PowerScript Core gracefully
   */
  public async shutdown(): Promise<void> {
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
      
    } catch (error) {
      this._errorManager.handleError(error as Error, 'PowerScriptCore.shutdown');
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): PowerScriptConfig {
    return { ...this._config };
  }

  /**
   * Update configuration
   */
  public async updateConfig(newConfig: Partial<PowerScriptConfig>): Promise<void> {
    const oldConfig = { ...this._config };
    this._config = { ...this._config, ...newConfig };
    
    this._logger.info('Configuration updated');
    
    this.dispatchEvent(new PowerScriptCoreEvent(
      PowerScriptCoreEvent.CONFIG_CHANGED,
      { oldConfig, newConfig: this._config }
    ));
  }

  /**
   * Get runtime information
   */
  public getRuntime(): PowerScriptRuntime {
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
  public getVersion(): string {
    return '1.0.0'; // This would be loaded from package.json in real implementation
  }

  /**
   * Check if a feature is available
   */
  public hasFeature(feature: string): boolean {
    return this._modules.has(feature) || this._isFeatureBuiltin(feature);
  }

  /**
   * Load a module
   */
  public async loadModule(name: string, module: any): Promise<void> {
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
      
      this.dispatchEvent(new PowerScriptCoreEvent(
        PowerScriptCoreEvent.MODULE_LOADED,
        { name, module }
      ));
      
    } catch (error) {
      this._errorManager.handleError(error as Error, `PowerScriptCore.loadModule(${name})`);
      throw error;
    }
  }

  /**
   * Unload a module
   */
  public async unloadModule(name: string): Promise<void> {
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
  public getModule<T = any>(name: string): T | undefined {
    return this._modules.get(name);
  }

  /**
   * Get all loaded modules
   */
  public getModules(): string[] {
    return Array.from(this._modules.keys());
  }

  /**
   * Get the dependency injection container
   */
  public getContainer(): DependencyContainer {
    return this._container;
  }

  /**
   * Get the logger instance
   */
  public getLogger(): Logger {
    return this._logger;
  }

  /**
   * Get the error manager instance
   */
  public getErrorManager(): ErrorManager {
    return this._errorManager;
  }

  /**
   * Check if PowerScript is initialized
   */
  public get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Get uptime in milliseconds
   */
  public get uptime(): number {
    return Date.now() - this._startTime;
  }

  private async _initializeModules(): Promise<void> {
    // Initialize built-in modules based on configuration
    const modulesToLoad: string[] = [];
    
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
      } catch (error) {
        this._logger.error(`Failed to load module '${moduleName}':`, error);
      }
    });
    
    await Promise.all(loadPromises);
  }

  private async _unloadModule(name: string, module: any): Promise<void> {
    try {
      // Cleanup module if it has a cleanup method
      if (module.cleanup && typeof module.cleanup === 'function') {
        await module.cleanup();
      }

      this._modules.delete(name);
      this._logger.info(`Module '${name}' unloaded successfully`);
      
      this.dispatchEvent(new PowerScriptCoreEvent(
        PowerScriptCoreEvent.MODULE_UNLOADED,
        { name, module }
      ));
      
    } catch (error) {
      this._errorManager.handleError(error as Error, `PowerScriptCore._unloadModule(${name})`);
    }
  }

  private _setupErrorHandling(): void {
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

  private _isFeatureBuiltin(feature: string): boolean {
    const builtinFeatures = ['core', 'events', 'timer', 'vector', 'bytearray'];
    return builtinFeatures.includes(feature.toLowerCase());
  }

  private _getCPUUsage(): number {
    // Simplified CPU usage calculation
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const usage = process.cpuUsage();
      return (usage.user + usage.system) / 1000000; // Convert to seconds
    }
    return 0;
  }

  private _getEventLoopLag(): number {
    // Simplified event loop lag measurement
    let start = Date.now();
    return new Promise<number>((resolve) => {
      setImmediate(() => {
        resolve(Date.now() - start);
      });
    }) as any; // Type assertion for synchronous return
  }

  public toString(): string {
    return `[PowerScriptCore initialized=${this._initialized} modules=${this._modules.size} uptime=${this.uptime}ms]`;
  }
}