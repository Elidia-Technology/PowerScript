"use strict";
/**
 * PowerScript Server Load Balancer
 * Load balancing strategies and health checking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadBalancer = void 0;
const events_1 = require("events");
const Logger_1 = require("../core/Logger");
/**
 * LoadBalancer class for distributing requests across multiple targets
 */
class LoadBalancer extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this._targets = new Map();
        this._currentIndex = 0;
        this._config = {
            algorithm: 'round-robin',
            healthCheck: {
                enabled: true,
                path: '/health',
                interval: 30000,
                timeout: 5000,
                retries: 3,
                statusCodes: [200, 201, 204]
            },
            sticky: false,
            timeout: 30000,
            ...config
        };
        this._algorithm = this._config.algorithm || 'round-robin';
        this._logger = new Logger_1.Logger({ level: 'info', outputs: [new Logger_1.ConsoleLogOutput()] });
        if (this._config.healthCheck?.enabled) {
            this._startHealthChecks();
        }
    }
    /**
     * Add a target to the load balancer
     */
    addTarget(target) {
        const fullTarget = {
            ...target,
            healthy: true,
            connections: 0,
            responseTime: 0,
            lastHealthCheck: new Date()
        };
        this._targets.set(target.id, fullTarget);
        this._logger.info('Target added to load balancer', {
            id: target.id,
            url: target.url,
            weight: target.weight
        });
        this.emit('targetAdded', fullTarget);
    }
    /**
     * Remove a target from the load balancer
     */
    removeTarget(targetId) {
        const target = this._targets.get(targetId);
        if (target) {
            this._targets.delete(targetId);
            this._logger.info('Target removed from load balancer', { id: targetId });
            this.emit('targetRemoved', target);
        }
    }
    /**
     * Get the next target based on the load balancing algorithm
     */
    getNextTarget(clientIp) {
        const healthyTargets = Array.from(this._targets.values()).filter(t => t.healthy);
        if (healthyTargets.length === 0) {
            this._logger.warn('No healthy targets available');
            return null;
        }
        switch (this._algorithm) {
            case 'round-robin':
                return this._roundRobin(healthyTargets);
            case 'least-connections':
                return this._leastConnections(healthyTargets);
            case 'weighted':
                return this._weighted(healthyTargets);
            case 'ip-hash':
                return this._ipHash(healthyTargets, clientIp);
            case 'random':
                return this._random(healthyTargets);
            default:
                return this._roundRobin(healthyTargets);
        }
    }
    /**
     * Mark a connection as started for a target
     */
    incrementConnections(targetId) {
        const target = this._targets.get(targetId);
        if (target) {
            target.connections++;
        }
    }
    /**
     * Mark a connection as ended for a target
     */
    decrementConnections(targetId) {
        const target = this._targets.get(targetId);
        if (target) {
            target.connections = Math.max(0, target.connections - 1);
        }
    }
    /**
     * Update response time for a target
     */
    updateResponseTime(targetId, responseTime) {
        const target = this._targets.get(targetId);
        if (target) {
            // Use exponential moving average
            target.responseTime = target.responseTime * 0.8 + responseTime * 0.2;
        }
    }
    /**
     * Get all targets
     */
    getTargets() {
        return Array.from(this._targets.values());
    }
    /**
     * Get healthy targets
     */
    getHealthyTargets() {
        return Array.from(this._targets.values()).filter(t => t.healthy);
    }
    /**
     * Get load balancer statistics
     */
    getStats() {
        const targets = Array.from(this._targets.values());
        const healthyCount = targets.filter(t => t.healthy).length;
        const totalConnections = targets.reduce((sum, t) => sum + t.connections, 0);
        const avgResponseTime = targets.length > 0
            ? targets.reduce((sum, t) => sum + t.responseTime, 0) / targets.length
            : 0;
        return {
            algorithm: this._algorithm,
            totalTargets: targets.length,
            healthyTargets: healthyCount,
            unhealthyTargets: targets.length - healthyCount,
            totalConnections,
            averageResponseTime: Math.round(avgResponseTime),
            targets: targets.map(t => ({
                id: t.id,
                url: t.url,
                healthy: t.healthy,
                connections: t.connections,
                responseTime: Math.round(t.responseTime),
                weight: t.weight,
                lastHealthCheck: t.lastHealthCheck
            }))
        };
    }
    /**
     * Set the load balancing algorithm
     */
    setAlgorithm(algorithm) {
        this._algorithm = algorithm;
        this._logger.info('Load balancing algorithm changed', { algorithm });
    }
    /**
     * Start health checks
     */
    _startHealthChecks() {
        if (this._healthCheckInterval) {
            clearInterval(this._healthCheckInterval);
        }
        const interval = this._config.healthCheck.interval;
        this._healthCheckInterval = setInterval(async () => {
            await this._performHealthChecks();
        }, interval);
        this._logger.info('Health checks started', { interval });
    }
    /**
     * Stop health checks
     */
    stopHealthChecks() {
        if (this._healthCheckInterval) {
            clearInterval(this._healthCheckInterval);
            this._healthCheckInterval = undefined;
            this._logger.info('Health checks stopped');
        }
    }
    /**
     * Perform health checks on all targets
     */
    async _performHealthChecks() {
        const promises = Array.from(this._targets.values()).map(target => this._performHealthCheck(target));
        await Promise.allSettled(promises);
    }
    /**
     * Perform health check on a single target
     */
    async _performHealthCheck(target) {
        const config = this._config.healthCheck;
        const startTime = Date.now();
        try {
            // In a real implementation, you'd make an HTTP request to target.url + config.path
            // For this mock, we'll simulate a health check
            const mockHealthy = Math.random() > 0.1; // 90% success rate
            const responseTime = Math.random() * 100 + 50; // 50-150ms
            await new Promise(resolve => setTimeout(resolve, responseTime));
            const wasHealthy = target.healthy;
            target.healthy = mockHealthy;
            target.lastHealthCheck = new Date();
            this.updateResponseTime(target.id, responseTime);
            if (wasHealthy !== mockHealthy) {
                this._logger.info('Target health status changed', {
                    id: target.id,
                    url: target.url,
                    healthy: mockHealthy
                });
                this.emit('healthStatusChanged', {
                    target,
                    previousStatus: wasHealthy,
                    currentStatus: mockHealthy
                });
            }
        }
        catch (error) {
            const wasHealthy = target.healthy;
            target.healthy = false;
            target.lastHealthCheck = new Date();
            if (wasHealthy) {
                this._logger.warn('Target health check failed', {
                    id: target.id,
                    url: target.url,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                this.emit('healthStatusChanged', {
                    target,
                    previousStatus: true,
                    currentStatus: false,
                    error
                });
            }
        }
    }
    /**
     * Round-robin algorithm
     */
    _roundRobin(targets) {
        const target = targets[this._currentIndex % targets.length];
        this._currentIndex = (this._currentIndex + 1) % targets.length;
        return target;
    }
    /**
     * Least connections algorithm
     */
    _leastConnections(targets) {
        return targets.reduce((min, target) => target.connections < min.connections ? target : min);
    }
    /**
     * Weighted algorithm
     */
    _weighted(targets) {
        const totalWeight = targets.reduce((sum, target) => sum + target.weight, 0);
        const random = Math.random() * totalWeight;
        let weightSum = 0;
        for (const target of targets) {
            weightSum += target.weight;
            if (random <= weightSum) {
                return target;
            }
        }
        return targets[targets.length - 1];
    }
    /**
     * IP hash algorithm
     */
    _ipHash(targets, clientIp = '127.0.0.1') {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < clientIp.length; i++) {
            const char = clientIp.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        const index = Math.abs(hash) % targets.length;
        return targets[index];
    }
    /**
     * Random algorithm
     */
    _random(targets) {
        const index = Math.floor(Math.random() * targets.length);
        return targets[index];
    }
    /**
     * Cleanup
     */
    destroy() {
        this.stopHealthChecks();
        this._targets.clear();
        this.removeAllListeners();
    }
}
exports.LoadBalancer = LoadBalancer;
