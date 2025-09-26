"use strict";
/**
 * PowerScript ConfigLoader - Configuration management and loading
 *
 * Provides flexible configuration loading from multiple sources with
 * environment variable support, validation, and hot reloading.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = exports.JSONConfigSource = exports.DefaultConfigSource = exports.EnvironmentConfigSource = void 0;
class EnvironmentConfigSource {
    constructor() {
        this.name = 'environment';
        this.priority = 100;
    }
    load() {
        const config = {};
        // Map environment variables to configuration
        const envMappings = {
            'PS_LOG_LEVEL': 'runtime.logLevel',
            'PS_DEBUG_MODE': 'runtime.debugMode',
            'PS_SANDBOX': 'runtime.sandbox',
            'PS_AI_PROVIDER': 'ai.defaultProvider',
            'PS_ML_BACKEND': 'ml.backend',
            'PS_ML_DEVICE': 'ml.device',
            'PS_COMPILER_TARGET': 'compiler.target',
            'PS_COMPILER_MODULE': 'compiler.module',
            'PS_SECURITY_SANDBOX': 'security.sandbox.enabled',
            'PS_NETWORK_TIMEOUT': 'networking.timeout',
            'PS_STORAGE_PROVIDER': 'storage.defaultProvider'
        };
        for (const [envVar, configPath] of Object.entries(envMappings)) {
            const value = this._getEnvVar(envVar);
            if (value !== undefined) {
                this._setNestedValue(config, configPath, value);
            }
        }
        // Load API keys from environment
        const apiKeys = {};
        const envVars = this._getAllEnvVars();
        for (const [key, value] of Object.entries(envVars)) {
            if (key.startsWith('PS_API_KEY_')) {
                const provider = key.replace('PS_API_KEY_', '').toLowerCase();
                apiKeys[provider] = value;
            }
        }
        if (Object.keys(apiKeys).length > 0) {
            this._setNestedValue(config, 'ai.apiKeys', apiKeys);
        }
        return config;
    }
    _getEnvVar(name) {
        if (typeof process !== 'undefined' && process.env) {
            const value = process.env[name];
            if (value === undefined)
                return undefined;
            // Try to parse as JSON, number, or boolean
            if (value === 'true')
                return true;
            if (value === 'false')
                return false;
            if (/^\d+$/.test(value))
                return parseInt(value, 10);
            if (/^\d+\.\d+$/.test(value))
                return parseFloat(value);
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return undefined;
    }
    _getAllEnvVars() {
        if (typeof process !== 'undefined' && process.env) {
            return process.env;
        }
        return {};
    }
    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    }
}
exports.EnvironmentConfigSource = EnvironmentConfigSource;
class DefaultConfigSource {
    constructor() {
        this.name = 'defaults';
        this.priority = 0;
    }
    load() {
        return {
            runtime: {
                sandbox: false,
                strictMode: true,
                debugMode: false,
                logLevel: 'info'
            },
            ai: {
                providers: ['openai', 'anthropic'],
                defaultProvider: 'openai',
                apiKeys: {}
            },
            ml: {
                backend: 'tensorflow',
                device: 'auto'
            },
            compiler: {
                target: 'es2020',
                module: 'commonjs',
                sourceMaps: true,
                minify: false
            },
            security: {
                encryption: {
                    algorithm: 'AES',
                    keySize: 256
                },
                sandbox: {
                    enabled: false,
                    allowedModules: [],
                    restrictedAPIs: []
                }
            },
            networking: {
                timeout: 30000,
                retries: 3,
                maxConnections: 100
            },
            storage: {
                defaultProvider: 'local',
                cacheSize: 100,
                compression: true
            }
        };
    }
}
exports.DefaultConfigSource = DefaultConfigSource;
class JSONConfigSource {
    constructor(filePath) {
        this.filePath = filePath;
        this.priority = 50;
        this.name = `json:${filePath}`;
    }
    async load() {
        try {
            // In a real implementation, this would use fs.readFile
            // For now, return empty config
            return {};
        }
        catch (error) {
            console.warn(`Failed to load config from ${this.filePath}:`, error);
            return {};
        }
    }
}
exports.JSONConfigSource = JSONConfigSource;
/**
 * PowerScript Configuration Loader
 */
class ConfigLoader {
    constructor() {
        this._sources = [];
        // Register default sources
        this.addSource(new DefaultConfigSource());
        this.addSource(new EnvironmentConfigSource());
    }
    /**
     * Add a configuration source
     */
    addSource(source) {
        this._sources.push(source);
        this._sources.sort((a, b) => a.priority - b.priority);
        this._clearCache();
    }
    /**
     * Remove a configuration source
     */
    removeSource(sourceName) {
        this._sources = this._sources.filter(source => source.name !== sourceName);
        this._clearCache();
    }
    /**
     * Set configuration schema for validation
     */
    setSchema(schema) {
        this._schema = schema;
        this._clearCache();
    }
    /**
     * Load configuration from all sources
     */
    async load(overrides) {
        if (this._cache && !overrides) {
            return this._cache;
        }
        let config = {};
        // Load from all sources in priority order
        for (const source of this._sources) {
            try {
                const sourceConfig = await source.load();
                config = this._mergeConfig(config, sourceConfig);
            }
            catch (error) {
                console.warn(`Failed to load config from source '${source.name}':`, error);
            }
        }
        // Apply overrides
        if (overrides) {
            config = this._mergeConfig(config, overrides);
        }
        // Validate against schema
        if (this._schema) {
            config = this._validateAndApplyDefaults(config, this._schema);
        }
        // Cache the result
        this._cache = config;
        return config;
    }
    /**
     * Get a specific configuration value
     */
    async get(path, defaultValue) {
        const config = await this.load();
        return this._getNestedValue(config, path, defaultValue);
    }
    /**
     * Set a configuration value (runtime only, not persisted)
     */
    set(path, value) {
        if (!this._cache) {
            throw new Error('Configuration not loaded. Call load() first.');
        }
        this._setNestedValue(this._cache, path, value);
    }
    /**
     * Check if a configuration value exists
     */
    async has(path) {
        const config = await this.load();
        return this._getNestedValue(config, path) !== undefined;
    }
    /**
     * Clear the configuration cache
     */
    clearCache() {
        this._clearCache();
    }
    /**
     * Get all configuration as a flattened object
     */
    async flatten(separator = '.') {
        const config = await this.load();
        return this._flattenObject(config, separator);
    }
    _mergeConfig(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this._isObject(source[key]) && this._isObject(result[key])) {
                    result[key] = this._mergeConfig(result[key], source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }
    _validateAndApplyDefaults(config, schema) {
        const result = { ...config };
        for (const [key, schemaItem] of Object.entries(schema)) {
            const value = this._getNestedValue(result, key);
            // Apply default if value is missing
            if (value === undefined && schemaItem.default !== undefined) {
                this._setNestedValue(result, key, schemaItem.default);
            }
            // Check required fields
            if (schemaItem.required && value === undefined) {
                throw new Error(`Required configuration '${key}' is missing`);
            }
            // Validate type
            if (value !== undefined && !this._validateType(value, schemaItem.type)) {
                throw new Error(`Configuration '${key}' must be of type ${schemaItem.type}`);
            }
            // Custom validation
            if (value !== undefined && schemaItem.validate) {
                const validation = schemaItem.validate(value);
                if (validation !== true) {
                    const message = typeof validation === 'string' ? validation : `Invalid value for '${key}'`;
                    throw new Error(message);
                }
            }
        }
        return result;
    }
    _validateType(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number';
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return this._isObject(value);
            case 'array':
                return Array.isArray(value);
            default:
                return true;
        }
    }
    _getNestedValue(obj, path, defaultValue) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined || !(key in current)) {
                return defaultValue;
            }
            current = current[key];
        }
        return current;
    }
    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || !this._isObject(current[key])) {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    }
    _flattenObject(obj, separator, prefix = '') {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}${separator}${key}` : key;
                if (this._isObject(obj[key])) {
                    Object.assign(result, this._flattenObject(obj[key], separator, newKey));
                }
                else {
                    result[newKey] = obj[key];
                }
            }
        }
        return result;
    }
    _isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }
    _clearCache() {
        this._cache = undefined;
    }
}
exports.ConfigLoader = ConfigLoader;
