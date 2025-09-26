"use strict";
/**
 * PowerScript AI - Base interfaces and types for AI providers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderRegistry = void 0;
/**
 * AI Provider Registry for managing multiple providers
 */
class AIProviderRegistry {
    constructor() {
        this._providers = new Map();
    }
    /**
     * Register an AI provider
     */
    register(provider) {
        this._providers.set(provider.name.toLowerCase(), provider);
        if (!this._defaultProvider) {
            this._defaultProvider = provider.name.toLowerCase();
        }
    }
    /**
     * Get a provider by name
     */
    get(name) {
        return this._providers.get(name.toLowerCase());
    }
    /**
     * Get all registered providers
     */
    getAll() {
        return Array.from(this._providers.values());
    }
    /**
     * Get provider names
     */
    getNames() {
        return Array.from(this._providers.keys());
    }
    /**
     * Set default provider
     */
    setDefault(name) {
        if (this._providers.has(name.toLowerCase())) {
            this._defaultProvider = name.toLowerCase();
        }
        else {
            throw new Error(`Provider '${name}' not found`);
        }
    }
    /**
     * Get default provider
     */
    getDefault() {
        return this._defaultProvider ? this._providers.get(this._defaultProvider) : undefined;
    }
    /**
     * Check if provider exists
     */
    has(name) {
        return this._providers.has(name.toLowerCase());
    }
    /**
     * Remove a provider
     */
    remove(name) {
        const removed = this._providers.delete(name.toLowerCase());
        if (this._defaultProvider === name.toLowerCase() && this._providers.size > 0) {
            this._defaultProvider = this._providers.keys().next().value;
        }
        return removed;
    }
    /**
     * Clear all providers
     */
    clear() {
        this._providers.clear();
        this._defaultProvider = undefined;
    }
    /**
     * Get registry info
     */
    getInfo() {
        return {
            total: this._providers.size,
            providers: Array.from(this._providers.keys()),
            default: this._defaultProvider
        };
    }
}
exports.AIProviderRegistry = AIProviderRegistry;
