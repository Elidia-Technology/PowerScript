/**
 * PowerScript DependencyContainer - Dependency Injection Container
 * 
 * Provides a lightweight dependency injection system for managing
 * service registration, resolution, and lifecycle management.
 */

export type ServiceFactory<T = any> = (container: DependencyContainer) => T;
export type ServiceInstance<T = any> = T;

export interface ServiceDefinition<T = any> {
  name: string;
  factory?: ServiceFactory<T>;
  instance?: ServiceInstance<T>;
  singleton?: boolean;
  dependencies?: string[];
  lifecycle?: 'singleton' | 'transient' | 'scoped';
  tags?: string[];
}

export interface ServiceScope {
  id: string;
  services: Map<string, any>;
  parent?: ServiceScope;
}

/**
 * PowerScript Dependency Injection Container
 */
export class DependencyContainer {
  private _services: Map<string, ServiceDefinition> = new Map();
  private _instances: Map<string, any> = new Map();
  private _scopes: Map<string, ServiceScope> = new Map();
  private _currentScope?: ServiceScope;
  private _resolving: Set<string> = new Set();

  constructor() {
    // Register self
    this.register('container', this);
  }

  /**
   * Register a service with the container
   */
  public register<T>(
    name: string,
    factoryOrInstance: ServiceFactory<T> | ServiceInstance<T>,
    options?: {
      singleton?: boolean;
      dependencies?: string[];
      lifecycle?: 'singleton' | 'transient' | 'scoped';
      tags?: string[];
    }
  ): void {
    const definition: ServiceDefinition<T> = {
      name,
      singleton: options?.singleton ?? true,
      dependencies: options?.dependencies ?? [],
      lifecycle: options?.lifecycle ?? 'singleton',
      tags: options?.tags ?? []
    };

    if (typeof factoryOrInstance === 'function') {
      definition.factory = factoryOrInstance as ServiceFactory<T>;
    } else {
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
  public registerSingleton<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies?: string[]
  ): void {
    this.register(name, factory, { singleton: true, dependencies });
  }

  /**
   * Register a transient service (new instance each time)
   */
  public registerTransient<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies?: string[]
  ): void {
    this.register(name, factory, { singleton: false, lifecycle: 'transient', dependencies });
  }

  /**
   * Register a scoped service
   */
  public registerScoped<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies?: string[]
  ): void {
    this.register(name, factory, { lifecycle: 'scoped', dependencies });
  }

  /**
   * Resolve a service by name
   */
  public resolve<T>(name: string): T {
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
  public resolveByTag<T>(tag: string): T[] {
    const services: T[] = [];
    
    for (const definition of this._services.values()) {
      if (definition.tags?.includes(tag)) {
        services.push(this.resolve<T>(definition.name));
      }
    }
    
    return services;
  }

  /**
   * Check if a service is registered
   */
  public has(name: string): boolean {
    return this._services.has(name);
  }

  /**
   * Unregister a service
   */
  public unregister(name: string): void {
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
  public createScope(id?: string): ServiceScope {
    const scopeId = id || this._generateScopeId();
    const scope: ServiceScope = {
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
  public enterScope(scope: ServiceScope): void {
    this._currentScope = scope;
  }

  /**
   * Exit the current scope
   */
  public exitScope(): void {
    if (this._currentScope?.parent) {
      this._currentScope = this._currentScope.parent;
    } else {
      this._currentScope = undefined;
    }
  }

  /**
   * Dispose a scope and cleanup scoped services
   */
  public disposeScope(scopeId: string): void {
    const scope = this._scopes.get(scopeId);
    if (!scope) return;

    // Dispose scoped services
    for (const [serviceName, instance] of scope.services) {
      if (instance && typeof instance.dispose === 'function') {
        try {
          instance.dispose();
        } catch (error) {
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
  public getServiceNames(): string[] {
    return Array.from(this._services.keys());
  }

  /**
   * Get service definition
   */
  public getServiceDefinition(name: string): ServiceDefinition | undefined {
    return this._services.get(name);
  }

  /**
   * Clear all services and instances
   */
  public clear(): void {
    // Dispose all instances that have dispose method
    for (const instance of this._instances.values()) {
      if (instance && typeof instance.dispose === 'function') {
        try {
          instance.dispose();
        } catch (error) {
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
  public createChild(): DependencyContainer {
    const child = new DependencyContainer();
    
    // Copy service definitions (not instances)
    for (const [name, definition] of this._services) {
      if (name !== 'container') { // Don't copy the container itself
        child._services.set(name, { ...definition });
      }
    }
    
    return child;
  }

  private _resolveSingleton<T>(definition: ServiceDefinition<T>): T {
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
    } finally {
      this._resolving.delete(definition.name);
    }
  }

  private _resolveTransient<T>(definition: ServiceDefinition<T>): T {
    this._resolving.add(definition.name);
    try {
      return this._createInstance(definition);
    } finally {
      this._resolving.delete(definition.name);
    }
  }

  private _resolveScoped<T>(definition: ServiceDefinition<T>): T {
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
    } finally {
      this._resolving.delete(definition.name);
    }
  }

  private _createInstance<T>(definition: ServiceDefinition<T>): T {
    // If we have a direct instance, return it
    if (definition.instance) {
      return definition.instance;
    }

    // If we have a factory, use it
    if (definition.factory) {
      // Resolve dependencies first
      const dependencies: any[] = [];
      if (definition.dependencies) {
        for (const depName of definition.dependencies) {
          dependencies.push(this.resolve(depName));
        }
      }

      return definition.factory(this);
    }

    throw new Error(`Service '${definition.name}' has no factory or instance`);
  }

  private _generateScopeId(): string {
    return `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public toString(): string {
    return `[DependencyContainer services=${this._services.size} instances=${this._instances.size} scopes=${this._scopes.size}]`;
  }
}