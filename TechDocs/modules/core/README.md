/**
 * # Core Module Documentation
 * 
 * ## Overview
 * 
 * **Module Name:** Core Runtime  
 * **Package:** eips  
 * **Phase:** 1  
 * **Description:** Provides the foundational runtime environment, configuration management, and module coordination for PowerScript applications.
 *
 * ## Purpose
 * 
 * The Core module serves as the central nervous system of PowerScript, handling:
 * - Runtime environment initialization and management
 * - Configuration loading and validation
 * - Module lifecycle management
 * - Event dispatching and error handling
 * - Dependency injection container
 * - Performance monitoring and system information
 *
 * ## Dependencies
 * 
 * - Node.js >= 18.0.0
 * - Built-in Node.js modules (process, events)
 * - No external dependencies (self-contained)
 *
 * ## Main Classes
 */

/**
 * ## PowerScriptCore Class
 * 
 * Main runtime and coordination class that provides the core functionality
 * for PowerScript runtime environment, configuration management, and module coordination.
 * 
 * ### Constructor
 * ```typescript
 * const core = new PowerScriptCore();
 * ```
 * 
 * ### Configuration Interface
 * ```typescript
 * interface PowerScriptConfig {
 *   runtime?: {
 *     sandbox?: boolean;
 *     strictMode?: boolean;
 *     debugMode?: boolean;
 *     logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
 *   };
 *   ai?: {
 *     providers?: string[];
 *     defaultProvider?: string;
 *     apiKeys?: Record<string, string>;
 *   };
 *   ml?: {
 *     backend?: 'tensorflow' | 'pytorch' | 'onnx';
 *     device?: 'cpu' | 'gpu' | 'auto';
 *   };
 *   // ... additional configuration options
 * }
 * ```
 * 
 * ### Methods
 */

/**
 * Initialize PowerScript Core with configuration
 * 
 * @param {PowerScriptConfig} config - Optional configuration object
 * @return {Promise<void>} Promise that resolves when initialization is complete
 * 
 * Example:
 * <pre>
 * import { PowerScriptCore } from "eips";
 * 
 * const core = new PowerScriptCore();
 * await core.initialize({
 *   runtime: {
 *     debugMode: true,
 *     logLevel: 'info'
 *   },
 *   ai: {
 *     providers: ['openai', 'local'],
 *     defaultProvider: 'openai'
 *   }
 * });
 * </pre>
 */
async initialize(config?: PowerScriptConfig): Promise<void>

/**
 * Shutdown PowerScript Core gracefully
 * 
 * @return {Promise<void>} Promise that resolves when shutdown is complete
 * 
 * Example:
 * <pre>
 * await core.shutdown();
 * </pre>
 */
async shutdown(): Promise<void>

/**
 * Get current configuration
 * 
 * @return {PowerScriptConfig} Current configuration object
 * 
 * Example:
 * <pre>
 * const config = core.getConfig();
 * console.log('Debug mode:', config.runtime?.debugMode);
 * </pre>
 */
getConfig(): PowerScriptConfig

/**
 * Update configuration dynamically
 * 
 * @param {Partial<PowerScriptConfig>} newConfig - Partial configuration to merge
 * @return {Promise<void>} Promise that resolves when configuration is updated
 * 
 * Example:
 * <pre>
 * await core.updateConfig({
 *   runtime: { logLevel: 'debug' }
 * });
 * </pre>
 */
async updateConfig(newConfig: Partial<PowerScriptConfig>): Promise<void>

/**
 * Get runtime information including system metrics
 * 
 * @return {PowerScriptRuntime} Runtime information object
 * 
 * Example:
 * <pre>
 * const runtime = core.getRuntime();
 * console.log('Platform:', runtime.platform);
 * console.log('Memory used:', runtime.memory.used);
 * console.log('Uptime:', runtime.performance.uptime);
 * </pre>
 */
getRuntime(): PowerScriptRuntime

/**
 * Get PowerScript version
 * 
 * @return {String} Version string
 * 
 * Example:
 * <pre>
 * console.log('PowerScript version:', core.getVersion());
 * </pre>
 */
getVersion(): string

/**
 * Check if a feature is available
 * 
 * @param {String} feature - Feature name to check
 * @return {Boolean} true if feature is available
 * 
 * Example:
 * <pre>
 * if (core.hasFeature('ai')) {
 *   console.log('AI features are available');
 * }
 * </pre>
 */
hasFeature(feature: string): boolean

/**
 * Load a module into the runtime
 * 
 * @param {String} name - Module name
 * @param {Object} module - Module instance or class
 * @return {Promise<void>} Promise that resolves when module is loaded
 * 
 * Example:
 * <pre>
 * import { CustomModule } from './custom-module';
 * 
 * const customModule = new CustomModule();
 * await core.loadModule('custom', customModule);
 * </pre>
 */
async loadModule(name: string, module: any): Promise<void>

/**
 * Unload a module from the runtime
 * 
 * @param {String} name - Module name to unload
 * @return {Promise<void>} Promise that resolves when module is unloaded
 * 
 * Example:
 * <pre>
 * await core.unloadModule('custom');
 * </pre>
 */
async unloadModule(name: string): Promise<void>

/**
 * Get a loaded module by name
 * 
 * @param {String} name - Module name
 * @return {Object} Module instance or undefined if not found
 * 
 * Example:
 * <pre>
 * const aiModule = core.getModule('ai');
 * if (aiModule) {
 *   aiModule.generateText('Hello world');
 * }
 * </pre>
 */
getModule<T = any>(name: string): T | undefined

/**
 * Get all loaded module names
 * 
 * @return {String[]} Array of loaded module names
 * 
 * Example:
 * <pre>
 * const modules = core.getModules();
 * console.log('Loaded modules:', modules);
 * </pre>
 */
getModules(): string[]

/**
 * Get the dependency injection container
 * 
 * @return {DependencyContainer} Container instance
 * 
 * Example:
 * <pre>
 * const container = core.getContainer();
 * container.register('myService', new MyService());
 * </pre>
 */
getContainer(): DependencyContainer

/**
 * Get the logger instance
 * 
 * @return {Logger} Logger instance
 * 
 * Example:
 * <pre>
 * const logger = core.getLogger();
 * logger.info('Application started');
 * </pre>
 */
getLogger(): Logger

/**
 * Get the error manager instance
 * 
 * @return {ErrorManager} Error manager instance
 * 
 * Example:
 * <pre>
 * const errorManager = core.getErrorManager();
 * errorManager.handleError(new Error('Something went wrong'), 'myContext');
 * </pre>
 */
getErrorManager(): ErrorManager

/**
 * ## PowerScriptCoreEvent Class
 * 
 * Event class for core runtime events
 * 
 * ### Event Types
 * - `INITIALIZED` - Fired when core is initialized
 * - `SHUTDOWN` - Fired when core is shutting down
 * - `ERROR` - Fired when an error occurs
 * - `CONFIG_CHANGED` - Fired when configuration changes
 * - `MODULE_LOADED` - Fired when a module is loaded
 * - `MODULE_UNLOADED` - Fired when a module is unloaded
 * 
 * ### Constructor
 * ```typescript
 * const event = new PowerScriptCoreEvent(type, data?, bubbles?, cancelable?);
 * ```
 * 
 * ### Properties
 * - `data: any` - Event data payload
 * 
 * Example:
 * <pre>
 * core.addEventListener(PowerScriptCoreEvent.INITIALIZED, (event) => {
 *   console.log('Core initialized with config:', event.data.config);
 * });
 * </pre>
 */

/**
 * ## Usage Examples
 * 
 * ### Basic Initialization
 * ```typescript
 * import { PowerScriptCore } from "eips";
 * 
 * const core = new PowerScriptCore();
 * 
 * // Initialize with default configuration
 * await core.initialize();
 * 
 * // Check if AI features are available
 * if (core.hasFeature('ai')) {
 *   console.log('AI module is available');
 * }
 * 
 * // Get runtime information
 * const runtime = core.getRuntime();
 * console.log(`Running on ${runtime.platform} with ${runtime.memory.used} bytes used`);
 * ```
 * 
 * ### Advanced Configuration
 * ```typescript
 * import { PowerScriptCore, PowerScriptConfig } from "eips";
 * 
 * const config: PowerScriptConfig = {
 *   runtime: {
 *     debugMode: true,
 *     logLevel: 'debug',
 *     strictMode: true
 *   },
 *   ai: {
 *     providers: ['openai', 'huggingface'],
 *     defaultProvider: 'openai',
 *     apiKeys: {
 *       openai: process.env.OPENAI_API_KEY
 *     }
 *   },
 *   ml: {
 *     backend: 'tensorflow',
 *     device: 'auto'
 *   }
 * };
 * 
 * const core = new PowerScriptCore();
 * await core.initialize(config);
 * ```
 * 
 * ### Event Handling
 * ```typescript
 * import { PowerScriptCore, PowerScriptCoreEvent } from "eips";
 * 
 * const core = new PowerScriptCore();
 * 
 * // Listen for initialization
 * core.addEventListener(PowerScriptCoreEvent.INITIALIZED, (event) => {
 *   console.log('PowerScript initialized successfully!');
 *   console.log('Runtime info:', event.data.runtime);
 * });
 * 
 * // Listen for errors
 * core.addEventListener(PowerScriptCoreEvent.ERROR, (event) => {
 *   console.error('Core error:', event.data.error);
 * });
 * 
 * // Listen for module loading
 * core.addEventListener(PowerScriptCoreEvent.MODULE_LOADED, (event) => {
 *   console.log(`Module '${event.data.name}' loaded successfully`);
 * });
 * 
 * await core.initialize();
 * ```
 * 
 * ### Module Management
 * ```typescript
 * import { PowerScriptCore } from "eips";
 * import { CustomAIModule } from "./custom-ai-module";
 * 
 * const core = new PowerScriptCore();
 * await core.initialize();
 * 
 * // Load a custom module
 * const customAI = new CustomAIModule();
 * await core.loadModule('customAI', customAI);
 * 
 * // Use the loaded module
 * const aiModule = core.getModule('customAI');
 * if (aiModule) {
 *   const result = await aiModule.processText('Hello world');
 *   console.log('AI result:', result);
 * }
 * 
 * // Unload when done
 * await core.unloadModule('customAI');
 * ```
 * 
 * ### Graceful Shutdown
 * ```typescript
 * import { PowerScriptCore } from "eips";
 * 
 * const core = new PowerScriptCore();
 * await core.initialize();
 * 
 * // Setup graceful shutdown
 * process.on('SIGINT', async () => {
 *   console.log('Shutting down PowerScript...');
 *   await core.shutdown();
 *   process.exit(0);
 * });
 * 
 * process.on('SIGTERM', async () => {
 *   console.log('Shutting down PowerScript...');
 *   await core.shutdown();
 *   process.exit(0);
 * });
 * ```
 * 
 * ## Performance Monitoring
 * 
 * The Core module provides built-in performance monitoring:
 * 
 * ```typescript
 * const runtime = core.getRuntime();
 * 
 * console.log('Performance Metrics:');
 * console.log('- Uptime:', runtime.performance.uptime, 'ms');
 * console.log('- CPU Usage:', runtime.performance.cpuUsage, 'seconds');
 * console.log('- Event Loop Lag:', runtime.performance.eventLoopLag, 'ms');
 * console.log('- Memory Used:', runtime.memory.used, 'bytes');
 * console.log('- Memory Available:', runtime.memory.available, 'bytes');
 * ```
 * 
 * ## Error Handling
 * 
 * The Core module includes comprehensive error handling:
 * 
 * ```typescript
 * const errorManager = core.getErrorManager();
 * 
 * try {
 *   // Some risky operation
 *   await riskyOperation();
 * } catch (error) {
 *   // Handle error through error manager
 *   errorManager.handleError(error, 'myOperation');
 * }
 * ```
 * 
 * ## Dependency Injection
 * 
 * Use the built-in dependency container:
 * 
 * ```typescript
 * const container = core.getContainer();
 * 
 * // Register services
 * container.register('database', new DatabaseService());
 * container.register('cache', new CacheService());
 * 
 * // Resolve dependencies
 * const database = container.resolve('database');
 * const cache = container.resolve('cache');
 * ```
 */