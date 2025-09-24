"use strict";
/**
 * PowerScript DependencyContainer - Dependency Injection Container
 *
 * Provides a lightweight dependency injection system for managing
 * service registration, resolution, and lifecycle management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyContainer = void 0;
/**
 * PowerScript Dependency Injection Container
 */
class DependencyContainer {
    _services = new Map();
    _instances = new Map();
    _scopes = new Map();
    _currentScope;
    _resolving = new Set();
    constructor() {
        // Register self
        this.register('container', this);
    }
    /**
     * Register a service with the container
     */
    register(name, factoryOrInstance, options) {
        const definition = {
            name,
            singleton: options?.singleton ?? true,
            dependencies: options?.dependencies ?? [],
            lifecycle: options?.lifecycle ?? 'singleton',
            tags: options?.tags ?? []
        };
        if (typeof factoryOrInstance === 'function') {
            definition.factory = factoryOrInstance;
        }
        else {
            definition.instance = factoryOrInstance;
        }
        this._services.set(name, definition);
        // If it's a direct instance and singleton, store it
        if (definition.instance && definition.singleton) {
            this._instances.set(name, definition.instance);
        }
    }
    /**
     * Register a singleton service
     */
    registerSingleton(name, factory, dependencies) {
        this.register(name, factory, { singleton: true, dependencies });
    }
    /**
     * Register a transient service (new instance each time)
     */
    registerTransient(name, factory, dependencies) {
        this.register(name, factory, { singleton: false, lifecycle: 'transient', dependencies });
    }
    /**
     * Register a scoped service
     */
    registerScoped(name, factory, dependencies) {
        this.register(name, factory, { lifecycle: 'scoped', dependencies });
    }
    /**
     * Resolve a service by name
     */
    resolve(name) {
        // Check for circular dependencies
        if (this._resolving.has(name)) {
            throw new Error(`Circular dependency detected: ${Array.from(this._resolving).join(' -> ')} -> ${name}`);
        }
        const definition = this._services.get(name);
        if (!definition) {
            throw new Error(`Service '${name}' not registered`);
        }
        // Handle different lifecycles
        switch (definition.lifecycle) {
            case 'singleton':
                return this._resolveSingleton(definition);
            case 'transient':
                return this._resolveTransient(definition);
            case 'scoped':
                return this._resolveScoped(definition);
            default:
                // Fallback to singleton behavior
                return this._resolveSingleton(definition);
        }
    }
    /**
     * Resolve multiple services by tag
     */
    resolveByTag(tag) {
        const services = [];
        for (const definition of this._services.values()) {
            if (definition.tags?.includes(tag)) {
                services.push(this.resolve(definition.name));
            }
        }
        return services;
    }
    /**
     * Check if a service is registered
     */
    has(name) {
        return this._services.has(name);
    }
    /**
     * Unregister a service
     */
    unregister(name) {
        this._services.delete(name);
        this._instances.delete(name);
        // Remove from all scopes
        for (const scope of this._scopes.values()) {
            scope.services.delete(name);
        }
    }
    /**
     * Create a new scope for scoped services
     */
    createScope(id) {
        const scopeId = id || this._generateScopeId();
        const scope = {
            id: scopeId,
            services: new Map(),
            parent: this._currentScope
        };
        this._scopes.set(scopeId, scope);
        return scope;
    }
    /**
     * Enter a service scope
     */
    enterScope(scope) {
        this._currentScope = scope;
    }
    /**
     * Exit the current scope
     */
    exitScope() {
        if (this._currentScope?.parent) {
            this._currentScope = this._currentScope.parent;
        }
        else {
            this._currentScope = undefined;
        }
    }
    /**
     * Dispose a scope and cleanup scoped services
     */
    disposeScope(scopeId) {
        const scope = this._scopes.get(scopeId);
        if (!scope)
            return;
        // Dispose scoped services
        for (const [serviceName, instance] of scope.services) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                }
                catch (error) {
                    console.error(`Error disposing service '${serviceName}':`, error);
                }
            }
        }
        // Remove scope
        this._scopes.delete(scopeId);
        // Update current scope if needed
        if (this._currentScope?.id === scopeId) {
            this._currentScope = scope.parent;
        }
    }
    /**
     * Get all registered service names
     */
    getServiceNames() {
        return Array.from(this._services.keys());
    }
    /**
     * Get service definition
     */
    getServiceDefinition(name) {
        return this._services.get(name);
    }
    /**
     * Clear all services and instances
     */
    clear() {
        // Dispose all instances that have dispose method
        for (const instance of this._instances.values()) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                }
                catch (error) {
                    console.error('Error disposing service:', error);
                }
            }
        }
        // Clear all scopes
        for (const scopeId of this._scopes.keys()) {
            this.disposeScope(scopeId);
        }
        this._services.clear();
        this._instances.clear();
        this._scopes.clear();
        this._currentScope = undefined;
        // Re-register self
        this.register('container', this);
    }
    /**
     * Create a child container that inherits from this one
     */
    createChild() {
        const child = new DependencyContainer();
        // Copy service definitions (not instances)
        for (const [name, definition] of this._services) {
            if (name !== 'container') { // Don't copy the container itself
                child._services.set(name, { ...definition });
            }
        }
        return child;
    }
    _resolveSingleton(definition) {
        // Return existing instance if available
        let instance = this._instances.get(definition.name);
        if (instance) {
            return instance;
        }
        // Create new instance
        this._resolving.add(definition.name);
        try {
            instance = this._createInstance(definition);
            this._instances.set(definition.name, instance);
            return instance;
        }
        finally {
            this._resolving.delete(definition.name);
        }
    }
    _resolveTransient(definition) {
        this._resolving.add(definition.name);
        try {
            return this._createInstance(definition);
        }
        finally {
            this._resolving.delete(definition.name);
        }
    }
    _resolveScoped(definition) {
        if (!this._currentScope) {
            throw new Error(`Service '${definition.name}' is scoped but no scope is active`);
        }
        // Check if instance exists in current scope
        let instance = this._currentScope.services.get(definition.name);
        if (instance) {
            return instance;
        }
        // Create new instance for scope
        this._resolving.add(definition.name);
        try {
            instance = this._createInstance(definition);
            this._currentScope.services.set(definition.name, instance);
            return instance;
        }
        finally {
            this._resolving.delete(definition.name);
        }
    }
    _createInstance(definition) {
        // If we have a direct instance, return it
        if (definition.instance) {
            return definition.instance;
        }
        // If we have a factory, use it
        if (definition.factory) {
            // Resolve dependencies first
            const dependencies = [];
            if (definition.dependencies) {
                for (const depName of definition.dependencies) {
                    dependencies.push(this.resolve(depName));
                }
            }
            return definition.factory(this);
        }
        throw new Error(`Service '${definition.name}' has no factory or instance`);
    }
    _generateScopeId() {
        return `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    toString() {
        return `[DependencyContainer services=${this._services.size} instances=${this._instances.size} scopes=${this._scopes.size}]`;
    }
}
exports.DependencyContainer = DependencyContainer;
//# sourceMappingURL=DependencyContainer.js.map