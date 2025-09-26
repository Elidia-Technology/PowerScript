/**
 * PowerScript Server Service Discovery
 * Service registration, discovery, and health monitoring
 */

import { EventEmitter } from 'events';
import type { Service, ServiceHealth, HealthCheck, ServiceDiscoveryConfig } from './types';
import { Logger, ConsoleLogOutput } from '../core/Logger';

export interface ServiceRegistry {
  services: Map<string, Service>;
  serviceName: Map<string, Set<string>>; // name -> set of service IDs
  tags: Map<string, Set<string>>; // tag -> set of service IDs
}

/**
 * ServiceDiscovery class for service registration and discovery
 */
export class ServiceDiscovery extends EventEmitter {
  private _config: ServiceDiscoveryConfig;
  private _logger: Logger;
  private _registry: ServiceRegistry;
  private _healthCheckInterval?: NodeJS.Timeout;
  private _cleanupInterval?: NodeJS.Timeout;

  constructor(config: ServiceDiscoveryConfig = {}) {
    super();

    this._config = {
      enabled: true,
      provider: 'memory',
      host: 'localhost',
      port: 8500,
      interval: 30000,
      timeout: 5000,
      ...config
    };

    this._logger = new Logger({ level: 'info', outputs: [new ConsoleLogOutput()] });

    this._registry = {
      services: new Map(),
      serviceName: new Map(),
      tags: new Map()
    };

    this._startHealthChecks();
    this._startCleanup();
  }

  /**
   * Register a service
   */
  async register(service: Omit<Service, 'health' | 'lastSeen'>): Promise<void> {
    const fullService: Service = {
      ...service,
      health: {
        status: 'healthy',
        checks: [],
        lastCheck: new Date()
      },
      lastSeen: new Date()
    };

    this._registry.services.set(service.id, fullService);

    // Index by name
    if (!this._registry.serviceName.has(service.name)) {
      this._registry.serviceName.set(service.name, new Set());
    }
    this._registry.serviceName.get(service.name)!.add(service.id);

    // Index by tags
    if (service.tags) {
      service.tags.forEach(tag => {
        if (!this._registry.tags.has(tag)) {
          this._registry.tags.set(tag, new Set());
        }
        this._registry.tags.get(tag)!.add(service.id);
      });
    }

    this._logger.info('Service registered', {
      id: service.id,
      name: service.name,
      host: service.host,
      port: service.port
    });

    this.emit('serviceRegistered', fullService);
  }

  /**
   * Deregister a service
   */
  async deregister(serviceId: string): Promise<void> {
    const service = this._registry.services.get(serviceId);
    if (!service) {
      return;
    }

    // Remove from main registry
    this._registry.services.delete(serviceId);

    // Remove from name index
    const nameServices = this._registry.serviceName.get(service.name);
    if (nameServices) {
      nameServices.delete(serviceId);
      if (nameServices.size === 0) {
        this._registry.serviceName.delete(service.name);
      }
    }

    // Remove from tag indices
    if (service.tags) {
      service.tags.forEach(tag => {
        const tagServices = this._registry.tags.get(tag);
        if (tagServices) {
          tagServices.delete(serviceId);
          if (tagServices.size === 0) {
            this._registry.tags.delete(tag);
          }
        }
      });
    }

    this._logger.info('Service deregistered', { id: serviceId, name: service.name });
    this.emit('serviceDeregistered', service);
  }

  /**
   * Discover services by name
   */
  async discover(serviceName: string): Promise<Service[]> {
    const serviceIds = this._registry.serviceName.get(serviceName);
    if (!serviceIds) {
      return [];
    }

    const services = Array.from(serviceIds)
      .map(id => this._registry.services.get(id))
      .filter((service): service is Service => service !== undefined)
      .filter(service => service.health.status === 'healthy');

    return services;
  }

  /**
   * Discover services by tag
   */
  async discoverByTag(tag: string): Promise<Service[]> {
    const serviceIds = this._registry.tags.get(tag);
    if (!serviceIds) {
      return [];
    }

    const services = Array.from(serviceIds)
      .map(id => this._registry.services.get(id))
      .filter((service): service is Service => service !== undefined)
      .filter(service => service.health.status === 'healthy');

    return services;
  }

  /**
   * Get all services
   */
  async getServices(): Promise<Service[]> {
    return Array.from(this._registry.services.values());
  }

  /**
   * Get healthy services
   */
  async getHealthyServices(): Promise<Service[]> {
    return Array.from(this._registry.services.values())
      .filter(service => service.health.status === 'healthy');
  }

  /**
   * Get service by ID
   */
  async getService(serviceId: string): Promise<Service | null> {
    return this._registry.services.get(serviceId) || null;
  }

  /**
   * Update service health
   */
  async updateHealth(serviceId: string, health: Partial<ServiceHealth>): Promise<void> {
    const service = this._registry.services.get(serviceId);
    if (!service) {
      return;
    }

    const previousStatus = service.health.status;
    service.health = {
      ...service.health,
      ...health,
      lastCheck: new Date()
    };

    if (previousStatus !== service.health.status) {
      this._logger.info('Service health status changed', {
        id: serviceId,
        name: service.name,
        status: service.health.status,
        previousStatus
      });

      this.emit('healthStatusChanged', {
        service,
        previousStatus,
        currentStatus: service.health.status
      });
    }
  }

  /**
   * Update service last seen timestamp
   */
  async heartbeat(serviceId: string): Promise<void> {
    const service = this._registry.services.get(serviceId);
    if (service) {
      service.lastSeen = new Date();
    }
  }

  /**
   * Get service discovery statistics
   */
  getStats(): any {
    const services = Array.from(this._registry.services.values());
    const healthyCount = services.filter(s => s.health.status === 'healthy').length;
    const unhealthyCount = services.filter(s => s.health.status === 'unhealthy').length;
    const criticalCount = services.filter(s => s.health.status === 'critical').length;

    const servicesByName = Array.from(this._registry.serviceName.entries()).map(([name, ids]) => ({
      name,
      count: ids.size
    }));

    const servicesByTag = Array.from(this._registry.tags.entries()).map(([tag, ids]) => ({
      tag,
      count: ids.size
    }));

    return {
      totalServices: services.length,
      healthyServices: healthyCount,
      unhealthyServices: unhealthyCount,
      criticalServices: criticalCount,
      serviceNames: servicesByName,
      tags: servicesByTag,
      config: this._config
    };
  }

  /**
   * Start health checks
   */
  private _startHealthChecks(): void {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
    }

    this._healthCheckInterval = setInterval(async () => {
      await this._performHealthChecks();
    }, this._config.interval!);

    this._logger.info('Service health checks started', { interval: this._config.interval });
  }

  /**
   * Start cleanup process for stale services
   */
  private _startCleanup(): void {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }

    // Run cleanup every 5 minutes
    this._cleanupInterval = setInterval(() => {
      this._cleanupStaleServices();
    }, 5 * 60 * 1000);

    this._logger.info('Service cleanup started');
  }

  /**
   * Perform health checks on all services
   */
  private async _performHealthChecks(): Promise<void> {
    const services = Array.from(this._registry.services.values());
    
    const healthCheckPromises = services.map(service => 
      this._performServiceHealthCheck(service)
    );

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Perform health check on a single service
   */
  private async _performServiceHealthCheck(service: Service): Promise<void> {
    try {
      // In a real implementation, you'd make HTTP requests to the service health endpoints
      // For this mock, we'll simulate health checks
      
      const isHealthy = Math.random() > 0.05; // 95% success rate
      const responseTime = Math.random() * 200 + 50; // 50-250ms
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, responseTime));

      const healthCheck: HealthCheck = {
        name: 'http',
        status: isHealthy ? 'pass' : 'fail',
        message: isHealthy ? 'Service is healthy' : 'Service failed health check',
        duration: responseTime,
        timestamp: new Date()
      };

      const newStatus: 'healthy' | 'unhealthy' | 'critical' = isHealthy ? 'healthy' : 'unhealthy';

      await this.updateHealth(service.id, {
        status: newStatus,
        checks: [healthCheck]
      });

    } catch (error) {
      const healthCheck: HealthCheck = {
        name: 'http',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };

      await this.updateHealth(service.id, {
        status: 'critical',
        checks: [healthCheck]
      });
    }
  }

  /**
   * Clean up stale services that haven't been seen recently
   */
  private _cleanupStaleServices(): void {
    const now = new Date();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    
    const services = Array.from(this._registry.services.values());
    
    for (const service of services) {
      const timeSinceLastSeen = now.getTime() - service.lastSeen.getTime();
      
      if (timeSinceLastSeen > staleThreshold) {
        this._logger.warn('Removing stale service', {
          id: service.id,
          name: service.name,
          lastSeen: service.lastSeen,
          staleFor: `${Math.round(timeSinceLastSeen / 1000)}s`
        });

        this.deregister(service.id);
      }
    }
  }

  /**
   * Watch for service changes
   */
  watch(serviceName: string, callback: (services: Service[]) => void): () => void {
    const handler = async () => {
      const services = await this.discover(serviceName);
      callback(services);
    };

    this.on('serviceRegistered', handler);
    this.on('serviceDeregistered', handler);
    this.on('healthStatusChanged', handler);

    // Initial call
    handler();

    // Return unsubscribe function
    return () => {
      this.off('serviceRegistered', handler);
      this.off('serviceDeregistered', handler);
      this.off('healthStatusChanged', handler);
    };
  }

  /**
   * Export registry for backup/restore
   */
  exportRegistry(): any {
    return {
      services: Array.from(this._registry.services.entries()),
      serviceName: Array.from(this._registry.serviceName.entries()).map(([name, ids]) => [name, Array.from(ids)]),
      tags: Array.from(this._registry.tags.entries()).map(([tag, ids]) => [tag, Array.from(ids)])
    };
  }

  /**
   * Import registry from backup
   */
  importRegistry(data: any): void {
    this._registry.services.clear();
    this._registry.serviceName.clear();
    this._registry.tags.clear();

    // Restore services
    for (const [id, service] of data.services) {
      this._registry.services.set(id, service);
    }

    // Restore name index
    for (const [name, ids] of data.serviceName) {
      this._registry.serviceName.set(name, new Set(ids));
    }

    // Restore tag index
    for (const [tag, ids] of data.tags) {
      this._registry.tags.set(tag, new Set(ids));
    }

    this._logger.info('Registry imported', {
      services: this._registry.services.size,
      names: this._registry.serviceName.size,
      tags: this._registry.tags.size
    });
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
    }

    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }

    this._registry.services.clear();
    this._registry.serviceName.clear();
    this._registry.tags.clear();

    this.removeAllListeners();
    this._logger.info('Service discovery destroyed');
  }
}