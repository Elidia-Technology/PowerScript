"use strict";
/**
 * PowerScript Server & Microservices Framework
 * Express-like server with PowerScript enhancements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptServer = void 0;
const events_1 = require("events");
const cluster_1 = require("cluster");
const os = require("os");
const Logger_1 = require("../core/Logger");
const PowerScriptSecurity_1 = require("../security/PowerScriptSecurity");
/**
 * PowerScriptServer - Express-like server with enhanced features
 */
class PowerScriptServer extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.name = 'PowerScriptServer';
        this.version = '1.0.0';
        this._routes = new Map();
        this._middleware = [];
        this._plugins = new Map();
        this._services = new Map();
        this._isRunning = false;
        this._requestCount = 0;
        this._errorCount = 0;
        this._config = {
            port: 3000,
            host: '0.0.0.0',
            protocol: 'http',
            cluster: {
                enabled: false,
                workers: 'auto',
                sticky: false,
                gracefulShutdown: true,
                respawnLimit: 10,
                respawnDelay: 1000
            },
            middleware: [],
            routes: [],
            security: {
                cors: { enabled: true },
                helmet: { enabled: true },
                rateLimit: { enabled: false }
            },
            monitoring: {
                enabled: true,
                metrics: { enabled: true },
                logging: { enabled: true, level: 'info' }
            },
            ...config
        };
        this._logger = new Logger_1.Logger({
            level: this._config.monitoring?.logging?.level || 'info',
            format: 'json',
            outputs: [new Logger_1.ConsoleLogOutput()]
        });
        if (this._config.security) {
            try {
                this._security = PowerScriptSecurity_1.PowerScriptSecurity.getInstance();
            }
            catch (error) {
                this._logger.warn('Security module not available, running without security features');
            }
        }
        this._initializeServer();
    }
    /**
     * Create a clustered server instance
     */
    static createCluster(config = {}) {
        return new PowerScriptServer({
            ...config,
            cluster: {
                enabled: true,
                workers: 'auto',
                ...config.cluster
            }
        });
    }
    /**
     * Create a microservice instance
     */
    static createMicroservice(config = {}) {
        return new PowerScriptServer({
            ...config,
            microservice: {
                name: config.name || 'unnamed-service',
                version: config.version || '1.0.0',
                discovery: {
                    enabled: true,
                    provider: 'memory',
                    ...config.discovery
                },
                health: {
                    enabled: true,
                    path: '/health',
                    ...config.health
                },
                metrics: {
                    enabled: true,
                    ...config.metrics
                },
                ...config.microservice
            }
        });
    }
    /**
     * Initialize the server
     */
    _initializeServer() {
        // Set up basic middleware
        this._setupDefaultMiddleware();
        // Set up default routes
        this._setupDefaultRoutes();
        // Set up error handling
        this._setupErrorHandling();
        this._logger.info('PowerScript Server initialized', {
            config: {
                port: this._config.port,
                host: this._config.host,
                protocol: this._config.protocol,
                cluster: this._config.cluster?.enabled
            }
        });
    }
    /**
     * Set up default middleware
     */
    _setupDefaultMiddleware() {
        // Request logging middleware
        this.use((req, res, next) => {
            this._requestCount++;
            const startTime = Date.now();
            req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.timestamp = new Date();
            this._logger.debug('Request started', {
                id: req.id,
                method: req.method,
                url: req.url,
                ip: req.ip
            });
            const originalEnd = res.end;
            const self = this;
            res.end = function (...args) {
                const duration = Date.now() - startTime;
                self._logger.info('Request completed', {
                    id: req.id,
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration,
                    ip: req.ip
                });
                self._emitEvent('request.end', {
                    request: req,
                    response: res,
                    duration
                });
                originalEnd.apply(this, args);
            };
            this._emitEvent('request.start', { request: req });
            next();
        });
        // CORS middleware
        if (this._config.security?.cors?.enabled) {
            this.use((req, res, next) => {
                const corsConfig = this._config.security.cors;
                if (corsConfig.origin) {
                    if (typeof corsConfig.origin === 'string') {
                        res.header('Access-Control-Allow-Origin', corsConfig.origin);
                    }
                    else if (Array.isArray(corsConfig.origin)) {
                        res.header('Access-Control-Allow-Origin', corsConfig.origin.join(', '));
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
                if (req.method === 'OPTIONS') {
                    res.status(200).end();
                    return;
                }
                next();
            });
        }
        // Security headers middleware (Helmet-like)
        if (this._config.security?.helmet?.enabled) {
            this.use((req, res, next) => {
                res.header('X-Content-Type-Options', 'nosniff');
                res.header('X-Frame-Options', 'DENY');
                res.header('X-XSS-Protection', '1; mode=block');
                res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
                next();
            });
        }
    }
    /**
     * Set up default routes
     */
    _setupDefaultRoutes() {
        // Health check endpoint
        this.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0,
                version: this.version,
                requests: this._requestCount,
                errors: this._errorCount,
                services: this._services.size
            };
            res.json(health);
        });
        // Metrics endpoint
        this.get('/metrics', (req, res) => {
            const metrics = {
                timestamp: new Date().toISOString(),
                uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0,
                requests: {
                    total: this._requestCount,
                    errors: this._errorCount,
                    rate: this._startTime ? this._requestCount / ((Date.now() - this._startTime.getTime()) / 1000) : 0
                },
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                services: Array.from(this._services.values()).map(service => ({
                    id: service.id,
                    name: service.name,
                    status: service.health.status,
                    lastSeen: service.lastSeen
                }))
            };
            res.json(metrics);
        });
        // Info endpoint
        this.get('/info', (req, res) => {
            res.json({
                name: this.name,
                version: this.version,
                config: {
                    port: this._config.port,
                    protocol: this._config.protocol,
                    cluster: this._config.cluster?.enabled,
                    microservice: !!this._config.microservice
                },
                startTime: this._startTime,
                uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0
            });
        });
    }
    /**
     * Set up error handling
     */
    _setupErrorHandling() {
        process.on('uncaughtException', (error) => {
            this._logger.error('Uncaught exception', { error: error.message, stack: error.stack });
            this._errorCount++;
            this._emitEvent('server.error', { error, type: 'uncaughtException' });
        });
        process.on('unhandledRejection', (reason, promise) => {
            this._logger.error('Unhandled rejection', { reason, promise });
            this._errorCount++;
            this._emitEvent('server.error', { error: reason, type: 'unhandledRejection' });
        });
    }
    use(middlewareOrPlugin) {
        if (typeof middlewareOrPlugin === 'function') {
            this._middleware.push(middlewareOrPlugin);
            return this;
        }
        else {
            return this.installPluginAsync(middlewareOrPlugin);
        }
    }
    /**
     * Add GET route
     */
    get(path, handler) {
        return this.route('GET', path, handler);
    }
    /**
     * Add POST route
     */
    post(path, handler) {
        return this.route('POST', path, handler);
    }
    /**
     * Add PUT route
     */
    put(path, handler) {
        return this.route('PUT', path, handler);
    }
    /**
     * Add DELETE route
     */
    delete(path, handler) {
        return this.route('DELETE', path, handler);
    }
    /**
     * Add PATCH route
     */
    patch(path, handler) {
        return this.route('PATCH', path, handler);
    }
    /**
     * Add route for any method
     */
    route(method, path, handler) {
        if (!this._routes.has(path)) {
            this._routes.set(path, new Map());
        }
        this._routes.get(path).set(method, handler);
        this._logger.debug('Route registered', { method, path });
        return this;
    }
    /**
     * Install plugin
     */
    async installPluginAsync(plugin) {
        if (this._plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} is already installed`);
        }
        await plugin.install(this);
        this._plugins.set(plugin.name, plugin);
        this._logger.info('Plugin installed', { name: plugin.name, version: plugin.version });
        return this;
    }
    /**
     * Uninstall plugin
     */
    async uninstall(pluginName) {
        const plugin = this._plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin ${pluginName} is not installed`);
        }
        if (plugin.uninstall) {
            await plugin.uninstall(this);
        }
        this._plugins.delete(pluginName);
        this._logger.info('Plugin uninstalled', { name: pluginName });
        return this;
    }
    /**
     * Start the server
     */
    async start() {
        if (this._isRunning) {
            throw new Error('Server is already running');
        }
        if (this._config.cluster?.enabled && cluster_1.default.isPrimary) {
            await this._startCluster();
        }
        else {
            await this._startWorker();
        }
    }
    /**
     * Start cluster mode
     */
    async _startCluster() {
        const numWorkers = this._config.cluster.workers === 'auto'
            ? os.cpus().length
            : this._config.cluster.workers;
        this._logger.info('Starting cluster', { workers: numWorkers });
        for (let i = 0; i < numWorkers; i++) {
            const worker = cluster_1.default.fork();
            worker.on('message', (message) => {
                this._logger.debug('Worker message', { workerId: worker.id, message });
            });
            worker.on('exit', (code, signal) => {
                this._logger.warn('Worker died', { workerId: worker.id, code, signal });
                if (!worker.exitedAfterDisconnect) {
                    this._logger.info('Restarting worker', { workerId: worker.id });
                    cluster_1.default.fork();
                }
            });
        }
        cluster_1.default.on('exit', (worker, code, signal) => {
            this._emitEvent('cluster.worker.stop', { workerId: worker.id, code, signal });
        });
        this._isRunning = true;
        this._startTime = new Date();
        this._emitEvent('server.start', { mode: 'cluster', workers: numWorkers });
    }
    /**
     * Start single worker
     */
    async _startWorker() {
        return new Promise((resolve, reject) => {
            try {
                // Create a simple HTTP server implementation
                const server = this._createHttpServer();
                server.listen(this._config.port, this._config.host, () => {
                    this._isRunning = true;
                    this._startTime = new Date();
                    this._logger.info('Server started', {
                        port: this._config.port,
                        host: this._config.host,
                        protocol: this._config.protocol,
                        pid: process.pid
                    });
                    this._emitEvent('server.start', {
                        port: this._config.port,
                        host: this._config.host,
                        protocol: this._config.protocol
                    });
                    resolve();
                });
                server.on('error', (error) => {
                    this._logger.error('Server error', { error: error.message });
                    this._errorCount++;
                    this._emitEvent('server.error', { error });
                    reject(error);
                });
                this._server = server;
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Create HTTP server (simplified implementation)
     */
    _createHttpServer() {
        const http = require('http');
        return http.createServer(async (nodeReq, nodeRes) => {
            try {
                // Create PowerScript Request object
                const req = this._createRequest(nodeReq);
                const res = this._createResponse(nodeRes);
                // Run middleware chain
                await this._runMiddleware(req, res);
                // Find and execute route handler
                await this._handleRoute(req, res);
            }
            catch (error) {
                this._handleError(error, nodeRes);
            }
        });
    }
    /**
     * Create PowerScript Request object
     */
    _createRequest(nodeReq) {
        const url = new URL(nodeReq.url, `http://${nodeReq.headers.host}`);
        const req = Object.create(events_1.EventEmitter.prototype);
        Object.assign(req, {
            method: nodeReq.method,
            url: nodeReq.url,
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            params: {},
            headers: nodeReq.headers,
            body: {},
            cookies: {},
            ip: nodeReq.connection.remoteAddress,
            protocol: nodeReq.connection.encrypted ? 'https' : 'http',
            secure: !!nodeReq.connection.encrypted,
            xhr: nodeReq.headers['x-requested-with'] === 'XMLHttpRequest',
            timestamp: new Date(),
            id: ''
        });
        return req;
    }
    /**
     * Create PowerScript Response object
     */
    _createResponse(nodeRes) {
        const res = Object.create(events_1.EventEmitter.prototype);
        Object.assign(res, {
            statusCode: 200,
            headersSent: false,
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.header('Content-Type', 'application/json');
                nodeRes.statusCode = this.statusCode;
                nodeRes.end(JSON.stringify(data));
                return this;
            },
            send: function (data) {
                if (typeof data === 'object') {
                    return this.json(data);
                }
                nodeRes.statusCode = this.statusCode;
                nodeRes.end(data);
                return this;
            },
            html: function (content) {
                this.header('Content-Type', 'text/html');
                nodeRes.statusCode = this.statusCode;
                nodeRes.end(content);
                return this;
            },
            redirect: function (url, status = 302) {
                this.status(status);
                this.header('Location', url);
                nodeRes.end();
                return this;
            },
            header: function (name, value) {
                nodeRes.setHeader(name, value);
                return this;
            },
            headers: function (headers) {
                Object.entries(headers).forEach(([name, value]) => {
                    nodeRes.setHeader(name, value);
                });
                return this;
            },
            cookie: function (name, value, options = {}) {
                // Simple cookie implementation
                let cookieString = `${name}=${value}`;
                if (options.maxAge)
                    cookieString += `; Max-Age=${options.maxAge}`;
                if (options.path)
                    cookieString += `; Path=${options.path}`;
                if (options.domain)
                    cookieString += `; Domain=${options.domain}`;
                if (options.secure)
                    cookieString += `; Secure`;
                if (options.httpOnly)
                    cookieString += `; HttpOnly`;
                nodeRes.setHeader('Set-Cookie', cookieString);
                return this;
            },
            end: function () {
                nodeRes.end();
            }
        });
        return res;
    }
    /**
     * Run middleware chain
     */
    async _runMiddleware(req, res) {
        let index = 0;
        const next = async (error) => {
            if (error) {
                throw error;
            }
            if (index >= this._middleware.length) {
                return;
            }
            const middleware = this._middleware[index++];
            await middleware(req, res, next);
        };
        await next();
    }
    /**
     * Handle route execution
     */
    async _handleRoute(req, res) {
        // Simple route matching (exact path match)
        const pathRoutes = this._routes.get(req.path);
        if (pathRoutes && pathRoutes.has(req.method)) {
            const handler = pathRoutes.get(req.method);
            await handler(req, res);
        }
        else {
            // 404 Not Found
            res.status(404).json({
                error: 'Not Found',
                message: `Cannot ${req.method} ${req.path}`,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Handle errors
     */
    _handleError(error, nodeRes) {
        this._errorCount++;
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        this._logger.error('Request error', {
            error: message,
            statusCode,
            stack: error.stack
        });
        if (!nodeRes.headersSent) {
            nodeRes.statusCode = statusCode;
            nodeRes.setHeader('Content-Type', 'application/json');
            nodeRes.end(JSON.stringify({
                error: statusCode >= 500 ? 'Internal Server Error' : message,
                statusCode,
                timestamp: new Date().toISOString()
            }));
        }
    }
    /**
     * Stop the server
     */
    async stop() {
        if (!this._isRunning) {
            return;
        }
        if (this._server) {
            return new Promise((resolve) => {
                this._server.close(() => {
                    this._isRunning = false;
                    this._logger.info('Server stopped');
                    this._emitEvent('server.stop', {});
                    resolve();
                });
            });
        }
        this._isRunning = false;
        this._emitEvent('server.stop', {});
    }
    /**
     * Register a service (for microservices)
     */
    registerService(service) {
        this._services.set(service.id, service);
        this._logger.info('Service registered', { id: service.id, name: service.name });
        this._emitEvent('service.register', { service });
    }
    /**
     * Deregister a service
     */
    deregisterService(serviceId) {
        const service = this._services.get(serviceId);
        if (service) {
            this._services.delete(serviceId);
            this._logger.info('Service deregistered', { id: serviceId });
            this._emitEvent('service.deregister', { service });
        }
    }
    /**
     * Get server status
     */
    getStatus() {
        return {
            running: this._isRunning,
            startTime: this._startTime,
            uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0,
            requests: this._requestCount,
            errors: this._errorCount,
            routes: this._routes.size,
            middleware: this._middleware.length,
            plugins: this._plugins.size,
            services: this._services.size,
            config: this._config
        };
    }
    /**
     * Emit server event
     */
    _emitEvent(type, data) {
        const event = {
            type,
            timestamp: new Date(),
            data,
            source: this.name
        };
        this.emit(type, event);
        this.emit('event', event);
    }
    // Getters
    get isRunning() { return this._isRunning; }
    get config() { return this._config; }
    get logger() { return this._logger; }
    get requestCount() { return this._requestCount; }
    get errorCount() { return this._errorCount; }
    get routes() { return this._routes; }
    get services() { return this._services; }
    get plugins() { return this._plugins; }
}
exports.PowerScriptServer = PowerScriptServer;
