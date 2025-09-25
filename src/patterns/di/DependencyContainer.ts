/**
 * PowerScript Dependency Injection Container
 * Advanced IoC container with lifecycle management
 */

import { 
    IDependencyContainer, 
    IServiceDescriptor, 
    ServiceIdentifier, 
    ServiceScope 
} from '../types';

export class DependencyContainer implements IDependencyContainer {
    private services = new Map<ServiceIdentifier, IServiceDescriptor>();
    private instances = new Map<ServiceIdentifier, any>();
    private resolving = new Set<ServiceIdentifier>();
    private disposed = false;

    constructor(private config: {
        autoWireEnabled?: boolean;
        circularDependencyCheck?: boolean;
    } = {}) {
        this.config = {
            autoWireEnabled: true,
            circularDependencyCheck: true,
            ...config
        };
    }

    /**
     * Register a service with the container
     */
    register<T>(descriptor: IServiceDescriptor): void {
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
    resolve<T>(identifier: ServiceIdentifier): T {
        if (this.disposed) {
            throw new Error('Cannot resolve services from disposed container');
        }

        if (!this.hasRegistration(identifier)) {
            throw new Error(`Service not registered: ${String(identifier)}`);
        }

        const descriptor = this.services.get(identifier)!;

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
        } finally {
            this.resolving.delete(identifier);
        }
    }

    /**
     * Check if service is registered
     */
    hasRegistration(identifier: ServiceIdentifier): boolean {
        return this.services.has(identifier);
    }

    /**
     * Register a singleton service
     */
    registerSingleton<T>(
        identifier: ServiceIdentifier, 
        implementation: new (...args: any[]) => T,
        dependencies: ServiceIdentifier[] = []
    ): void {
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
    registerTransient<T>(
        identifier: ServiceIdentifier,
        implementation: new (...args: any[]) => T,
        dependencies: ServiceIdentifier[] = []
    ): void {
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
    registerInstance<T>(identifier: ServiceIdentifier, instance: T): void {
        this.instances.set(identifier, instance);
        this.register({
            identifier,
            implementation: (instance as any).constructor || Object,
            scope: 'singleton'
        });
    }

    /**
     * Register a factory function
     */
    registerFactory<T>(
        identifier: ServiceIdentifier,
        factory: (container: IDependencyContainer) => T,
        scope: ServiceScope = 'transient'
    ): void {
        this.register({
            identifier,
            implementation: factory,
            scope
        });
    }

    /**
     * Get all registered service identifiers
     */
    getRegisteredServices(): ServiceIdentifier[] {
        return Array.from(this.services.keys());
    }

    /**
     * Get container statistics
     */
    getStats(): {
        registeredServices: number;
        singletonInstances: number;
        activeResolutions: number;
    } {
        return {
            registeredServices: this.services.size,
            singletonInstances: this.instances.size,
            activeResolutions: this.resolving.size
        };
    }

    /**
     * Clear all registrations
     */
    clear(): void {
        this.services.clear();
        this.instances.clear();
        this.resolving.clear();
    }

    /**
     * Dispose container and all singleton instances
     */
    async dispose(): Promise<void> {
        if (this.disposed) return;

        // Dispose singleton instances that have dispose method
        for (const [identifier, instance] of this.instances) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    await instance.dispose();
                } catch (error) {
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
    private createInstance(descriptor: IServiceDescriptor): any {
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
    private validateDescriptor(descriptor: IServiceDescriptor): void {
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

/**
 * Service Registration Decorators (Basic Implementation)
 */
export function Injectable(identifier?: ServiceIdentifier) {
    return function <T extends new (...args: any[]) => any>(constructor: T) {
        const serviceId = identifier || constructor.name;
        
        // Store metadata for auto-registration (simplified without reflect-metadata)
        (constructor as any).__injectable = true;
        (constructor as any).__serviceId = serviceId;
        
        return constructor;
    };
}

export function Inject(identifier: ServiceIdentifier) {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existingTokens = (target.__injectTokens = target.__injectTokens || []);
        existingTokens[parameterIndex] = identifier;
    };
}

/**
 * Global Container Instance
 */
let globalContainer: DependencyContainer | null = null;

export function getGlobalContainer(): DependencyContainer {
    if (!globalContainer) {
        globalContainer = new DependencyContainer();
    }
    return globalContainer;
}

export function setGlobalContainer(container: DependencyContainer): void {
    globalContainer = container;
}

export function resetGlobalContainer(): void {
    if (globalContainer) {
        globalContainer.dispose();
        globalContainer = null;
    }
}