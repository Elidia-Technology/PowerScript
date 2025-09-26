"use strict";
/**
 * PowerScript Enhanced Networking Module
 *
 * Comprehensive networking solution combining AS3-style APIs with modern web standards
 *
 * Features:
 * - AS3-compatible URLRequest/URLLoader for familiar API
 * - Enhanced WebSocket with reconnection and heartbeat
 * - REST API client with automatic serialization
 * - Network monitoring and performance tracking
 * - Cross-platform compatibility (Node.js + Browser)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptWebSocket = exports.URLLoader = exports.URLRequest = exports.PowerScriptNetworkingEnhanced = void 0;
const events_1 = require("events");
const URLRequest_1 = require("./URLRequest");
Object.defineProperty(exports, "URLRequest", { enumerable: true, get: function () { return URLRequest_1.URLRequest; } });
const URLLoader_1 = require("./URLLoader");
Object.defineProperty(exports, "URLLoader", { enumerable: true, get: function () { return URLLoader_1.URLLoader; } });
const WebSocketProvider_1 = require("./WebSocketProvider");
Object.defineProperty(exports, "PowerScriptWebSocket", { enumerable: true, get: function () { return WebSocketProvider_1.PowerScriptWebSocket; } });
/**
 * PowerScript Enhanced Networking Module
 *
 * Main networking class that provides unified access to all networking features:
 * - AS3-style HTTP requests (URLRequest/URLLoader)
 * - Enhanced WebSocket connections
 * - Connection pooling and management
 * - Network performance monitoring
 * - Request/response caching
 */
class PowerScriptNetworkingEnhanced extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.name = 'PowerScriptNetworkingEnhanced';
        this.version = '1.0.0';
        this._activeRequests = new Set();
        this._requestQueue = [];
        this._isProcessingQueue = false;
        this._config = {
            defaultTimeout: config.defaultTimeout ?? 30000,
            maxConcurrentRequests: config.maxConcurrentRequests ?? 10,
            retryAttempts: config.retryAttempts ?? 3,
            retryDelay: config.retryDelay ?? 1000,
            enableMetrics: config.enableMetrics ?? true,
            userAgent: config.userAgent ?? 'PowerScript-Networking/1.0'
        };
        this._metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            activeConnections: 0,
            totalBytesTransferred: 0
        };
        this._connectionPool = {
            http: new Map(),
            websocket: new Map()
        };
    }
    /**
     * Get current network metrics
     */
    get metrics() {
        return { ...this._metrics };
    }
    /**
     * Get active connections count
     */
    get activeConnections() {
        return this._activeRequests.size + this._connectionPool.websocket.size;
    }
    /**
     * Create a new URLRequest (AS3-style)
     * @param url Optional URL to initialize with
     * @returns New URLRequest instance
     */
    createURLRequest(url) {
        const request = new URLRequest_1.URLRequest(url);
        // Set default headers
        request.addRequestHeader('User-Agent', this._config.userAgent);
        request.timeout = this._config.defaultTimeout;
        return request;
    }
    /**
     * Create a new URLLoader (AS3-style)
     * @param dataFormat Optional data format
     * @returns New URLLoader instance
     */
    createURLLoader(dataFormat = 'auto') {
        const loader = new URLLoader_1.URLLoader();
        loader.dataFormat = dataFormat;
        return loader;
    }
    /**
     * Execute HTTP request with automatic retry and metrics
     * @param request The URLRequest to execute
     * @param options Additional options
     * @returns Promise resolving to response
     */
    async request(request, options = {}) {
        return this._executeWithQueue(async () => {
            const retries = options.retries ?? this._config.retryAttempts;
            let lastError = null;
            const startTime = Date.now();
            this._metrics.totalRequests++;
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const loader = this.createURLLoader();
                    this._activeRequests.add(loader);
                    try {
                        const response = await loader.loadAsync(request);
                        // Update metrics
                        if (this._config.enableMetrics) {
                            this._updateMetrics(startTime, response, true);
                        }
                        this._metrics.successfulRequests++;
                        this.emit('requestSuccess', { request, response, attempt });
                        return response;
                    }
                    finally {
                        this._activeRequests.delete(loader);
                        loader.destroy();
                    }
                }
                catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    if (attempt < retries) {
                        this.emit('requestRetry', { request, error: lastError, attempt });
                        await this._delay(this._config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
                    }
                }
            }
            // All retries failed
            this._metrics.failedRequests++;
            this.emit('requestFailure', { request, error: lastError });
            throw lastError || new Error('Request failed after all retry attempts');
        });
    }
    /**
     * GET request convenience method
     * @param url URL to request
     * @param headers Optional headers
     * @returns Promise resolving to response
     */
    async get(url, headers) {
        const request = this.createURLRequest(url);
        request.method = 'GET';
        if (headers) {
            Object.entries(headers).forEach(([name, value]) => {
                request.addRequestHeader(name, value);
            });
        }
        const response = await this.request(request);
        return response.data;
    }
    /**
     * POST request convenience method
     * @param url URL to post to
     * @param data Data to post
     * @param headers Optional headers
     * @returns Promise resolving to response data
     */
    async post(url, data, headers) {
        const request = this.createURLRequest(url);
        request.method = 'POST';
        request.contentType = 'application/json';
        request.data = typeof data === 'string' ? data : JSON.stringify(data);
        if (headers) {
            Object.entries(headers).forEach(([name, value]) => {
                request.addRequestHeader(name, value);
            });
        }
        const response = await this.request(request);
        return response.data;
    }
    /**
     * PUT request convenience method
     * @param url URL to put to
     * @param data Data to put
     * @param headers Optional headers
     * @returns Promise resolving to response data
     */
    async put(url, data, headers) {
        const request = this.createURLRequest(url);
        request.method = 'PUT';
        request.contentType = 'application/json';
        request.data = typeof data === 'string' ? data : JSON.stringify(data);
        if (headers) {
            Object.entries(headers).forEach(([name, value]) => {
                request.addRequestHeader(name, value);
            });
        }
        const response = await this.request(request);
        return response.data;
    }
    /**
     * DELETE request convenience method
     * @param url URL to delete
     * @param headers Optional headers
     * @returns Promise resolving to response data
     */
    async delete(url, headers) {
        const request = this.createURLRequest(url);
        request.method = 'DELETE';
        if (headers) {
            Object.entries(headers).forEach(([name, value]) => {
                request.addRequestHeader(name, value);
            });
        }
        const response = await this.request(request);
        return response.data;
    }
    /**
     * Create WebSocket connection
     * @param config WebSocket configuration
     * @returns PowerScriptWebSocket instance
     */
    createWebSocket(config) {
        const ws = new WebSocketProvider_1.PowerScriptWebSocket(config);
        // Store in connection pool
        const poolKey = `${config.url}:${config.protocols?.join(',') || ''}`;
        this._connectionPool.websocket.set(poolKey, ws);
        // Handle connection events
        ws.on('open', () => {
            this._metrics.activeConnections++;
            this.emit('websocketConnected', { config, connection: ws });
        });
        ws.on('close', () => {
            this._metrics.activeConnections = Math.max(0, this._metrics.activeConnections - 1);
            this._connectionPool.websocket.delete(poolKey);
            this.emit('websocketDisconnected', { config, connection: ws });
        });
        ws.on('error', (error) => {
            this.emit('websocketError', { config, connection: ws, error });
        });
        return ws;
    }
    /**
     * Get existing WebSocket connection from pool
     * @param config WebSocket configuration
     * @returns Existing connection or null
     */
    getWebSocket(config) {
        const poolKey = `${config.url}:${config.protocols?.join(',') || ''}`;
        return this._connectionPool.websocket.get(poolKey) || null;
    }
    /**
     * Close all WebSocket connections
     */
    closeAllWebSockets() {
        for (const ws of this._connectionPool.websocket.values()) {
            ws.disconnect();
        }
        this._connectionPool.websocket.clear();
    }
    /**
     * Reset network metrics
     */
    resetMetrics() {
        this._metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            activeConnections: this.activeConnections,
            totalBytesTransferred: 0
        };
    }
    /**
     * Execute request with queue management
     */
    async _executeWithQueue(requestFn) {
        if (this._activeRequests.size >= this._config.maxConcurrentRequests) {
            return new Promise((resolve, reject) => {
                this._requestQueue.push(async () => {
                    try {
                        const result = await requestFn();
                        resolve(result);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                this._processQueue();
            });
        }
        return requestFn();
    }
    /**
     * Process request queue
     */
    async _processQueue() {
        if (this._isProcessingQueue || this._requestQueue.length === 0) {
            return;
        }
        this._isProcessingQueue = true;
        while (this._requestQueue.length > 0 && this._activeRequests.size < this._config.maxConcurrentRequests) {
            const requestFn = this._requestQueue.shift();
            if (requestFn) {
                requestFn().finally(() => {
                    this._processQueue();
                });
            }
        }
        this._isProcessingQueue = false;
    }
    /**
     * Update network metrics
     */
    _updateMetrics(startTime, response, success) {
        const responseTime = Date.now() - startTime;
        // Update average response time
        const totalSuccessful = this._metrics.successfulRequests + (success ? 1 : 0);
        this._metrics.averageResponseTime =
            (this._metrics.averageResponseTime * (totalSuccessful - 1) + responseTime) / totalSuccessful;
        // Estimate bytes transferred
        if (response.headers['content-length']) {
            this._metrics.totalBytesTransferred += parseInt(response.headers['content-length']);
        }
    }
    /**
     * Delay utility for retry logic
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Clean up all resources
     */
    async destroy() {
        // Close all WebSocket connections
        this.closeAllWebSockets();
        // Cancel all active requests
        for (const loader of this._activeRequests) {
            loader.close();
        }
        this._activeRequests.clear();
        // Clear request queue
        this._requestQueue = [];
        // Clear connection pools
        this._connectionPool.http.clear();
        this._connectionPool.websocket.clear();
        this.removeAllListeners();
    }
}
exports.PowerScriptNetworkingEnhanced = PowerScriptNetworkingEnhanced;
