"use strict";
/**
 * PowerScript Server API Gateway
 * API gateway with routing, rate limiting, authentication, and service proxying
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gateway = void 0;
const events_1 = require("events");
const Logger_1 = require("../core/Logger");
/**
 * Gateway class for API gateway functionality
 */
class Gateway extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this._routes = [];
        this._rateLimitStore = new Map();
        this._config = {
            enabled: true,
            routes: [],
            rateLimit: {
                enabled: false,
                windowMs: 15 * 60 * 1000,
                max: 1000
            },
            cors: {
                enabled: true,
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
            },
            authentication: {
                enabled: false
            },
            ...config
        };
        this._logger = new Logger_1.Logger({ level: 'info', outputs: [new Logger_1.ConsoleLogOutput()] });
        this._stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            routeStats: new Map(),
            serviceStats: new Map()
        };
        // Initialize routes
        if (this._config.routes) {
            this._routes = [...this._config.routes];
        }
        this._logger.info('API Gateway initialized', {
            routes: this._routes.length,
            rateLimit: this._config.rateLimit?.enabled,
            cors: this._config.cors?.enabled,
            auth: this._config.authentication?.enabled
        });
    }
    /**
     * Set service discovery instance
     */
    setServiceDiscovery(serviceDiscovery) {
        this._serviceDiscovery = serviceDiscovery;
        this._logger.info('Service discovery attached to gateway');
    }
    /**
     * Set load balancer instance
     */
    setLoadBalancer(loadBalancer) {
        this._loadBalancer = loadBalancer;
        this._logger.info('Load balancer attached to gateway');
    }
    /**
     * Add a route to the gateway
     */
    addRoute(route) {
        this._routes.push(route);
        this._logger.info('Gateway route added', {
            path: route.path,
            service: route.service,
            method: route.method
        });
        this.emit('routeAdded', route);
    }
    /**
     * Remove a route from the gateway
     */
    removeRoute(path, method) {
        const initialLength = this._routes.length;
        this._routes = this._routes.filter(route => {
            if (route.path !== path)
                return true;
            if (method && route.method !== method)
                return true;
            return false;
        });
        const removedCount = initialLength - this._routes.length;
        if (removedCount > 0) {
            this._logger.info('Gateway route(s) removed', { path, method, count: removedCount });
            this.emit('routeRemoved', { path, method, count: removedCount });
        }
    }
    /**
     * Process an incoming request through the gateway
     */
    async processRequest(req, res, next) {
        const startTime = Date.now();
        this._stats.totalRequests++;
        try {
            // 1. CORS handling
            if (this._config.cors?.enabled) {
                this._handleCORS(req, res);
                if (req.method === 'OPTIONS') {
                    res.status(200).end();
                    return;
                }
            }
            // 2. Rate limiting
            if (this._config.rateLimit?.enabled) {
                const rateLimited = await this._checkRateLimit(req, res);
                if (rateLimited) {
                    this._stats.failedRequests++;
                    return;
                }
            }
            // 3. Authentication
            if (this._config.authentication?.enabled) {
                const authorized = await this._authenticate(req, res);
                if (!authorized) {
                    this._stats.failedRequests++;
                    return;
                }
            }
            // 4. Route matching
            const matchedRoute = this._matchRoute(req);
            if (!matchedRoute) {
                res.status(404).json({
                    error: 'Not Found',
                    message: `No route found for ${req.method} ${req.path}`
                });
                this._stats.failedRequests++;
                return;
            }
            // 5. Service discovery and proxying
            await this._proxyToService(matchedRoute, req, res);
            const responseTime = Date.now() - startTime;
            this._updateStats(matchedRoute, responseTime, true);
            this._stats.successfulRequests++;
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this._handleError(error, req, res);
            this._stats.failedRequests++;
            // Update stats even for errors
            const matchedRoute = this._matchRoute(req);
            if (matchedRoute) {
                this._updateStats(matchedRoute, responseTime, false);
            }
        }
    }
    /**
     * Handle CORS
     */
    _handleCORS(req, res) {
        const corsConfig = this._config.cors;
        if (corsConfig.origin) {
            if (typeof corsConfig.origin === 'string') {
                res.header('Access-Control-Allow-Origin', corsConfig.origin);
            }
            else if (Array.isArray(corsConfig.origin)) {
                const requestOrigin = req.headers.origin;
                if (requestOrigin && corsConfig.origin.includes(requestOrigin)) {
                    res.header('Access-Control-Allow-Origin', requestOrigin);
                }
            }
        }
        if (corsConfig.methods) {
            res.header('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
        }
        if (corsConfig.allowedHeaders) {
            res.header('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
        }
        if (corsConfig.credentials) {
            res.header('Access-Control-Allow-Credentials', 'true');
        }
    }
    /**
     * Check rate limit
     */
    async _checkRateLimit(req, res) {
        const rateLimitConfig = this._config.rateLimit;
        const key = req.ip || 'anonymous';
        const now = Date.now();
        let record = this._rateLimitStore.get(key);
        if (!record || now > record.resetTime) {
            record = {
                count: 1,
                resetTime: now + rateLimitConfig.windowMs
            };
            this._rateLimitStore.set(key, record);
        }
        else {
            record.count++;
        }
        // Set rate limit headers
        res.header('X-RateLimit-Limit', rateLimitConfig.max.toString());
        res.header('X-RateLimit-Remaining', Math.max(0, rateLimitConfig.max - record.count).toString());
        res.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
        if (record.count > rateLimitConfig.max) {
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded',
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
            return true;
        }
        return false;
    }
    /**
     * Authenticate request
     */
    async _authenticate(req, res) {
        const authConfig = this._config.authentication;
        // Simple token-based authentication
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication token required'
            });
            return false;
        }
        // In a real implementation, you'd validate the token properly
        // For this mock, we'll accept any non-empty token
        if (token.length < 10) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid authentication token'
            });
            return false;
        }
        // Add user info to request (mocked)
        req.user = {
            id: 'user123',
            username: 'testuser',
            roles: ['user']
        };
        return true;
    }
    /**
     * Match incoming request to a route
     */
    _matchRoute(req) {
        for (const route of this._routes) {
            // Simple path matching (exact match for now)
            if (route.path === req.path) {
                if (!route.method || route.method === req.method ||
                    (Array.isArray(route.method) && route.method.includes(req.method))) {
                    return route;
                }
            }
        }
        return null;
    }
    /**
     * Proxy request to target service
     */
    async _proxyToService(route, req, res) {
        let targetUrl;
        if (this._serviceDiscovery) {
            // Use service discovery to find service instances
            const services = await this._serviceDiscovery.discover(route.service);
            if (services.length === 0) {
                res.status(503).json({
                    error: 'Service Unavailable',
                    message: `No healthy instances of service '${route.service}' found`
                });
                return;
            }
            // Use load balancer if available, otherwise pick first service
            let targetService;
            if (this._loadBalancer) {
                const target = this._loadBalancer.getNextTarget(req.ip);
                if (!target) {
                    res.status(503).json({
                        error: 'Service Unavailable',
                        message: 'No available service targets'
                    });
                    return;
                }
                targetService = services.find(s => s.id === target.id) || services[0];
            }
            else {
                targetService = services[0];
            }
            targetUrl = `${targetService.protocol}://${targetService.host}:${targetService.port}`;
        }
        else {
            // Fallback: assume service name is a URL
            targetUrl = route.service;
        }
        // Build target path
        let targetPath = route.rewrite || req.path;
        if (req.query && Object.keys(req.query).length > 0) {
            const queryString = new URLSearchParams(req.query).toString();
            targetPath += '?' + queryString;
        }
        const fullTargetUrl = targetUrl + targetPath;
        try {
            // In a real implementation, you'd make an HTTP request to the target service
            // For this mock, we'll simulate a successful proxy response
            const mockResponseData = {
                message: 'Proxied response',
                service: route.service,
                targetUrl: fullTargetUrl,
                originalPath: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            };
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            res.json(mockResponseData);
        }
        catch (error) {
            this._logger.error('Proxy error', {
                service: route.service,
                targetUrl: fullTargetUrl,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Failed to proxy request to service'
            });
        }
    }
    /**
     * Handle errors
     */
    _handleError(error, req, res) {
        this._logger.error('Gateway error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            method: req.method,
            path: req.path,
            ip: req.ip
        });
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occurred while processing the request'
            });
        }
    }
    /**
     * Update statistics
     */
    _updateStats(route, responseTime, success) {
        // Update route stats
        let routeStats = this._stats.routeStats.get(route.path);
        if (!routeStats) {
            routeStats = {
                path: route.path,
                requests: 0,
                errors: 0,
                averageResponseTime: 0,
                lastRequest: new Date()
            };
            this._stats.routeStats.set(route.path, routeStats);
        }
        routeStats.requests++;
        if (!success)
            routeStats.errors++;
        routeStats.averageResponseTime = (routeStats.averageResponseTime * (routeStats.requests - 1) + responseTime) / routeStats.requests;
        routeStats.lastRequest = new Date();
        // Update service stats
        let serviceStats = this._stats.serviceStats.get(route.service);
        if (!serviceStats) {
            serviceStats = {
                serviceName: route.service,
                requests: 0,
                errors: 0,
                averageResponseTime: 0,
                lastRequest: new Date()
            };
            this._stats.serviceStats.set(route.service, serviceStats);
        }
        serviceStats.requests++;
        if (!success)
            serviceStats.errors++;
        serviceStats.averageResponseTime = (serviceStats.averageResponseTime * (serviceStats.requests - 1) + responseTime) / serviceStats.requests;
        serviceStats.lastRequest = new Date();
        // Update overall stats
        this._stats.averageResponseTime = (this._stats.averageResponseTime * (this._stats.totalRequests - 1) + responseTime) / this._stats.totalRequests;
    }
    /**
     * Get gateway statistics
     */
    getStats() {
        return {
            requests: {
                total: this._stats.totalRequests,
                successful: this._stats.successfulRequests,
                failed: this._stats.failedRequests,
                successRate: this._stats.totalRequests > 0 ? (this._stats.successfulRequests / this._stats.totalRequests * 100).toFixed(2) + '%' : '0%'
            },
            performance: {
                averageResponseTime: Math.round(this._stats.averageResponseTime),
            },
            routes: Array.from(this._stats.routeStats.values()).map(stats => ({
                path: stats.path,
                requests: stats.requests,
                errors: stats.errors,
                errorRate: stats.requests > 0 ? (stats.errors / stats.requests * 100).toFixed(2) + '%' : '0%',
                averageResponseTime: Math.round(stats.averageResponseTime),
                lastRequest: stats.lastRequest
            })),
            services: Array.from(this._stats.serviceStats.values()).map(stats => ({
                service: stats.serviceName,
                requests: stats.requests,
                errors: stats.errors,
                errorRate: stats.requests > 0 ? (stats.errors / stats.requests * 100).toFixed(2) + '%' : '0%',
                averageResponseTime: Math.round(stats.averageResponseTime),
                lastRequest: stats.lastRequest
            })),
            rateLimit: {
                enabled: this._config.rateLimit?.enabled,
                activeConnections: this._rateLimitStore.size
            },
            config: {
                totalRoutes: this._routes.length,
                cors: this._config.cors?.enabled,
                authentication: this._config.authentication?.enabled,
                rateLimit: this._config.rateLimit?.enabled
            }
        };
    }
    /**
     * Get all routes
     */
    getRoutes() {
        return [...this._routes];
    }
    /**
     * Clear statistics
     */
    clearStats() {
        this._stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            routeStats: new Map(),
            serviceStats: new Map()
        };
        this._logger.info('Gateway statistics cleared');
    }
    /**
     * Clean up rate limit store
     */
    cleanupRateLimit() {
        const now = Date.now();
        for (const [key, record] of this._rateLimitStore.entries()) {
            if (now > record.resetTime) {
                this._rateLimitStore.delete(key);
            }
        }
    }
    /**
     * Cleanup and shutdown
     */
    destroy() {
        this._routes = [];
        this._rateLimitStore.clear();
        this.removeAllListeners();
        this._logger.info('Gateway destroyed');
    }
}
exports.Gateway = Gateway;
