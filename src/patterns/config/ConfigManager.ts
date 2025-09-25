/**
 * PowerScript Configuration Manager
 * Advanced configuration system with multiple format support
 */

import { 
    IConfigProvider, 
    IConfigManager, 
    ConfigFormat 
} from '../types';

/**
 * JSON Configuration Provider
 */
export class JsonConfigProvider implements IConfigProvider {
    async load(source: string): Promise<Record<string, any>> {
        try {
            // In a real implementation, this would read from file system
            // For this example, we'll simulate JSON parsing
            const jsonContent = await this.readFile(source);
            return JSON.parse(jsonContent);
        } catch (error) {
            throw new Error(`Failed to load JSON config from ${source}: ${(error as Error).message}`);
        }
    }

    async save(config: Record<string, any>, destination: string): Promise<void> {
        try {
            const jsonContent = JSON.stringify(config, null, 2);
            await this.writeFile(destination, jsonContent);
        } catch (error) {
            throw new Error(`Failed to save JSON config to ${destination}: ${(error as Error).message}`);
        }
    }

    private async readFile(path: string): Promise<string> {
        // Simulate file reading - in real implementation would use fs.readFile
        return new Promise((resolve, reject) => {
            // Mock JSON content for demonstration
            if (path.endsWith('.json')) {
                resolve(`{
                    "app": {
                        "name": "PowerScript",
                        "version": "1.0.0",
                        "debug": false
                    },
                    "database": {
                        "host": "localhost",
                        "port": 5432,
                        "name": "powerscript_db"
                    },
                    "logging": {
                        "level": "info",
                        "file": "app.log"
                    }
                }`);
            } else {
                reject(new Error('File not found'));
            }
        });
    }

    private async writeFile(path: string, content: string): Promise<void> {
        // Simulate file writing - in real implementation would use fs.writeFile
        return new Promise(resolve => {
            setTimeout(resolve, 10); // Simulate async write
        });
    }
}

/**
 * Environment Variable Provider
 */
export class EnvConfigProvider implements IConfigProvider {
    async load(source: string): Promise<Record<string, any>> {
        // Parse environment variables into nested config object
        const config: Record<string, any> = {};
        
        // Get environment variables (in Node.js this would be process.env)
        const env = this.getEnvironmentVariables();
        
        for (const [key, value] of Object.entries(env)) {
            if (key.startsWith(source.toUpperCase())) {
                const configKey = key.substring(source.length + 1).toLowerCase();
                const keys = configKey.split('_');
                
                let current = config;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                
                current[keys[keys.length - 1]] = this.parseValue(value);
            }
        }
        
        return config;
    }

    async save(config: Record<string, any>, destination: string): Promise<void> {
        // Environment variables are typically not saved back
        throw new Error('Environment variables cannot be saved');
    }

    private getEnvironmentVariables(): Record<string, string> {
        // Mock environment variables for demonstration
        return {
            'APP_NAME': 'PowerScript',
            'APP_VERSION': '1.0.0',
            'APP_DEBUG': 'false',
            'DATABASE_HOST': 'localhost',
            'DATABASE_PORT': '5432',
            'DATABASE_NAME': 'powerscript_db',
            'LOGGING_LEVEL': 'info',
            'LOGGING_FILE': 'app.log'
        };
    }

    private parseValue(value: string): any {
        // Try to parse as boolean
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // Try to parse as number
        const num = Number(value);
        if (!isNaN(num)) return num;
        
        // Return as string
        return value;
    }
}

/**
 * YAML Configuration Provider (Basic Implementation)
 */
export class YamlConfigProvider implements IConfigProvider {
    async load(source: string): Promise<Record<string, any>> {
        try {
            const yamlContent = await this.readFile(source);
            return this.parseYaml(yamlContent);
        } catch (error) {
            throw new Error(`Failed to load YAML config from ${source}: ${(error as Error).message}`);
        }
    }

    async save(config: Record<string, any>, destination: string): Promise<void> {
        try {
            const yamlContent = this.stringifyYaml(config);
            await this.writeFile(destination, yamlContent);
        } catch (error) {
            throw new Error(`Failed to save YAML config to ${destination}: ${(error as Error).message}`);
        }
    }

    private async readFile(path: string): Promise<string> {
        // Simulate YAML file content
        return Promise.resolve(`
app:
  name: PowerScript
  version: 1.0.0
  debug: false

database:
  host: localhost
  port: 5432
  name: powerscript_db

logging:
  level: info
  file: app.log
        `.trim());
    }

    private async writeFile(path: string, content: string): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 10));
    }

    private parseYaml(content: string): Record<string, any> {
        // Basic YAML parser (for production, use a proper YAML library)
        const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
        const result: Record<string, any> = {};
        const stack: any[] = [result];
        let currentIndent = 0;

        for (const line of lines) {
            const indent = line.match(/^ */)?.[0].length || 0;
            const trimmed = line.trim();
            
            if (trimmed.includes(':')) {
                const [key, value] = trimmed.split(':').map(s => s.trim());
                
                // Adjust stack based on indentation
                while (stack.length > 1 && indent <= currentIndent) {
                    stack.pop();
                    currentIndent -= 2;
                }
                
                const current = stack[stack.length - 1];
                
                if (value) {
                    // Parse value
                    current[key] = this.parseYamlValue(value);
                } else {
                    // Object
                    current[key] = {};
                    stack.push(current[key]);
                    currentIndent = indent;
                }
            }
        }

        return result;
    }

    private parseYamlValue(value: string): any {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        
        const num = Number(value);
        if (!isNaN(num)) return num;
        
        return value.replace(/['"]/g, ''); // Remove quotes
    }

    private stringifyYaml(obj: Record<string, any>, indent = 0): string {
        const spaces = ' '.repeat(indent);
        let result = '';
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                result += `${spaces}${key}:\n`;
                result += this.stringifyYaml(value, indent + 2);
            } else {
                result += `${spaces}${key}: ${value}\n`;
            }
        }
        
        return result;
    }
}

/**
 * Configuration Manager Implementation
 */
export class ConfigManager implements IConfigManager {
    private config: Record<string, any> = {};
    private providers = new Map<ConfigFormat, IConfigProvider>();
    private watchers = new Map<string, (config: Record<string, any>) => void>();

    constructor() {
        // Register default providers
        this.providers.set('json', new JsonConfigProvider());
        this.providers.set('env', new EnvConfigProvider());
        this.providers.set('yaml', new YamlConfigProvider());
    }

    async loadConfig(source: string, format?: ConfigFormat): Promise<void> {
        const detectedFormat = format || this.detectFormat(source);
        const provider = this.providers.get(detectedFormat);
        
        if (!provider) {
            throw new Error(`No provider available for format: ${detectedFormat}`);
        }

        try {
            const loadedConfig = await provider.load(source);
            this.merge(loadedConfig);
            
            // Notify watchers
            const watcher = this.watchers.get(source);
            if (watcher) {
                watcher(this.config);
            }
        } catch (error) {
            throw new Error(`Failed to load config from ${source}: ${(error as Error).message}`);
        }
    }

    get<T = any>(key: string, defaultValue?: T): T {
        const keys = key.split('.');
        let current: any = this.config;
        
        for (const k of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue as T;
            }
            current = current[k];
        }
        
        return current !== undefined ? current : defaultValue as T;
    }

    set(key: string, value: any): void {
        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    merge(config: Record<string, any>): void {
        this.config = this.deepMerge(this.config, config);
    }

    /**
     * Watch for configuration changes
     */
    watch(source: string, callback: (config: Record<string, any>) => void): void {
        this.watchers.set(source, callback);
    }

    /**
     * Get entire configuration
     */
    getAll(): Record<string, any> {
        return { ...this.config };
    }

    /**
     * Clear configuration
     */
    clear(): void {
        this.config = {};
    }

    /**
     * Register custom provider
     */
    registerProvider(format: ConfigFormat, provider: IConfigProvider): void {
        this.providers.set(format, provider);
    }

    /**
     * Get configuration statistics
     */
    getStats(): {
        totalKeys: number;
        providers: string[];
        watchers: number;
        configSections: string[];
    } {
        return {
            totalKeys: this.countKeys(this.config),
            providers: Array.from(this.providers.keys()),
            watchers: this.watchers.size,
            configSections: Object.keys(this.config)
        };
    }

    private detectFormat(source: string): ConfigFormat {
        if (source.endsWith('.json')) return 'json';
        if (source.endsWith('.yaml') || source.endsWith('.yml')) return 'yaml';
        if (source === 'env' || source.startsWith('ENV_')) return 'env';
        
        // Default to JSON
        return 'json';
    }

    private deepMerge(target: any, source: any): any {
        if (typeof target !== 'object' || target === null) return source;
        if (typeof source !== 'object' || source === null) return target;

        const result = { ...target };
        
        for (const [key, value] of Object.entries(source)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result[key] = this.deepMerge(result[key], value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }

    private countKeys(obj: any): number {
        let count = 0;
        
        function traverse(current: any): void {
            if (typeof current === 'object' && current !== null) {
                for (const key of Object.keys(current)) {
                    count++;
                    traverse(current[key]);
                }
            }
        }
        
        traverse(obj);
        return count;
    }
}