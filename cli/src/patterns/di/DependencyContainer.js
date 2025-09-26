"use strict";
/**
 * PowerScript Dependency Injection Container
 * Advanced IoC container with lifecycle management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyContainer = void 0;
exports.Injectable = Injectable;
exports.Inject = Inject;
exports.getGlobalContainer = getGlobalContainer;
exports.setGlobalContainer = setGlobalContainer;
exports.resetGlobalContainer = resetGlobalContainer;
class DependencyContainer {
    constructor(config = {}) {
        this.config = config;
        this.services = new Map();
        this.instances = new Map();
        this.resolving = new Set();
        this.disposed = false;
        this.config = {
            autoWireEnabled: true,
            circularDependencyCheck: true,
            ...config
        };
    }
    /**
     * Register a service with the container
     */
    register(descriptor) {
        if (this.disposed) {
            throw new Error('Cannot register services on disposed container');
        }
        this.validateDescriptor(descriptor);
        this.services.set(descriptor.identifier, descriptor);
        // Clear existing instance if re-registering
        if (this.instances.has(descriptor.identifier)) {
            this.instances.delete(descriptor.identifier);
        }
    }
    /**
     * Resolve a service instance
     */
    resolve(identifier) {
        if (this.disposed) {
            throw new Error('Cannot resolve services from disposed container');
        }
        if (!this.hasRegistration(identifier)) {
            throw new Error(`Service not registered: ${String(identifier)}`);
        }
        const descriptor = this.services.get(identifier);
        // Check for circular dependencies
        if (this.config.circularDependencyCheck && this.resolving.has(identifier)) {
            throw new Error(`Circular dependency detected: ${String(identifier)}`);
        }
        // Return existing singleton instance
        if (descriptor.scope === 'singleton' && this.instances.has(identifier)) {
            return this.instances.get(identifier);
        }
        // Resolve instance
        this.resolving.add(identifier);
        try {
            const instance = this.createInstance(descriptor);
            if (descriptor.scope === 'singleton') {
                this.instances.set(identifier, instance);
            }
            return instance;
        }
        finally {
            this.resolving.delete(identifier);
        }
    }
    /**
     * Check if service is registered
     */
    hasRegistration(identifier) {
        return this.services.has(identifier);
    }
    /**
     * Register a singleton service
     */
    registerSingleton(identifier, implementation, dependencies = []) {
        this.register({
            identifier,
            implementation,
            scope: 'singleton',
            dependencies
        });
    }
    /**
     * Register a transient service
     */
    registerTransient(identifier, implementation, dependencies = []) {
        this.register({
            identifier,
            implementation,
            scope: 'transient',
            dependencies
        });
    }
    /**
     * Register an instance directly
     */
    registerInstance(identifier, instance) {
        this.instances.set(identifier, instance);
        this.register({
            identifier,
            implementation: instance.constructor || Object,
            scope: 'singleton'
        });
    }
    /**
     * Register a factory function
     */
    registerFactory(identifier, factory, scope = 'transient') {
        this.register({
            identifier,
            implementation: factory,
            scope
        });
    }
    /**
     * Get all registered service identifiers
     */
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }
    /**
     * Get container statistics
     */
    getStats() {
        return {
            registeredServices: this.services.size,
            singletonInstances: this.instances.size,
            activeResolutions: this.resolving.size
        };
    }
    /**
     * Clear all registrations
     */
    clear() {
        this.services.clear();
        this.instances.clear();
        this.resolving.clear();
    }
    /**
     * Dispose container and all singleton instances
     */
    async dispose() {
        if (this.disposed)
            return;
        // Dispose singleton instances that have dispose method
        for (const [identifier, instance] of this.instances) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    await instance.dispose();
                }
                catch (error) {
                    console.error(`Error disposing service ${String(identifier)}:`, error);
                }
            }
        }
        this.clear();
        this.disposed = true;
    }
    /**
     * Create service instance with dependency resolution
     */
    createInstance(descriptor) {
        const { implementation, dependencies = [] } = descriptor;
        // Handle factory functions
        if (typeof implementation === 'function' && implementation.length === 1) {
            return implementation(this);
        }
        // Resolve dependencies
        const resolvedDependencies = dependencies.map(dep => this.resolve(dep));
        // Create instance with dependencies
        if (typeof implementation === 'function') {
            return new implementation(...resolvedDependencies);
        }
        // Return direct instance
        return implementation;
    }
    /**
     * Validate service descriptor
     */
    validateDescriptor(descriptor) {
        if (!descriptor.identifier) {
            throw new Error('Service identifier is required');
        }
        if (!descriptor.implementation) {
            throw new Error('Service implementation is required');
        }
        if (!['singleton', 'transient', 'scoped'].includes(descriptor.scope)) {
            throw new Error(`Invalid service scope: ${descriptor.scope}`);
        }
    }
}
exports.DependencyContainer = DependencyContainer;
/**
 * Service Registration Decorators (Basic Implementation)
 */
function Injectable(identifier) {
    return function (constructor) {
        const serviceId = identifier || constructor.name;
        // Store metadata for auto-registration (simplified without reflect-metadata)
        constructor.__injectable = true;
        constructor.__serviceId = serviceId;
        return constructor;
    };
}
function Inject(identifier) {
    return function (target, propertyKey, parameterIndex) {
        const existingTokens = (target.__injectTokens = target.__injectTokens || []);
        existingTokens[parameterIndex] = identifier;
    };
}
/**
 * Global Container Instance
 */
let globalContainer = null;
function getGlobalContainer() {
    if (!globalContainer) {
        globalContainer = new DependencyContainer();
    }
    return globalContainer;
}
function setGlobalContainer(container) {
    globalContainer = container;
}
function resetGlobalContainer() {
    if (globalContainer) {
        globalContainer.dispose();
        globalContainer = null;
    }
}
