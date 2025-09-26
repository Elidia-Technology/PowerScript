"use strict";
/**
 * PowerScript NodeJS HTTP Provider
 * Implementation of HTTP client using Node.js built-in modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeHTTPProvider = void 0;
const types_1 = require("../types");
class NodeHTTPProvider {
    constructor() {
        this.name = 'NodeHTTPProvider';
        this.version = '1.0.0';
        this.config = {
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            maxConcurrentRequests: 100
        };
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.activeRequests = 0;
        this.requestQueue = [];
    }
    async request(request) {
        // Apply request interceptors
        let processedRequest = request;
        for (const interceptor of this.requestInterceptors) {
            processedRequest = await interceptor(processedRequest);
        }
        // Merge with defaults
        const finalRequest = {
            ...processedRequest,
            timeout: processedRequest.timeout || this.config.timeout,
            retries: processedRequest.retries || this.config.retries
        };
        return this.executeRequest(finalRequest);
    }
    async get(url, config) {
        return this.request({ method: 'GET', url, ...config });
    }
    async post(url, data, config) {
        return this.request({ method: 'POST', url, body: data, ...config });
    }
    async put(url, data, config) {
        return this.request({ method: 'PUT', url, body: data, ...config });
    }
    async delete(url, config) {
        return this.request({ method: 'DELETE', url, ...config });
    }
    async patch(url, data, config) {
        return this.request({ method: 'PATCH', url, body: data, ...config });
    }
    addRequestInterceptor(handler) {
        this.requestInterceptors.push(handler);
    }
    addResponseInterceptor(handler) {
        this.responseInterceptors.push(handler);
    }
    setDefaults(config) {
        this.config = { ...this.config, ...config };
    }
    getDefaults() {
        return { ...this.config };
    }
    async executeRequest(request, attempt = 1) {
        // Check concurrent request limit
        if (this.config.maxConcurrentRequests && this.activeRequests >= this.config.maxConcurrentRequests) {
            await this.waitForSlot();
        }
        this.activeRequests++;
        const startTime = Date.now();
        try {
            // Parse URL
            const url = new URL(this.buildFullUrl(request.url));
            // Add query parameters
            if (request.params) {
                Object.entries(request.params).forEach(([key, value]) => {
                    url.searchParams.append(key, String(value));
                });
            }
            // Prepare headers
            const headers = {
                'User-Agent': 'PowerScript-HTTP/1.0.0',
                ...request.headers
            };
            // Add content-type for requests with body
            if (request.body && !headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/json';
            }
            // Prepare body
            let body;
            if (request.body) {
                if (typeof request.body === 'string') {
                    body = request.body;
                }
                else {
                    body = JSON.stringify(request.body);
                }
            }
            // Create a mock response (placeholder implementation)
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: {
                    'content-type': 'application/json',
                    'content-length': body ? body.length.toString() : '0'
                },
                data: this.createMockResponseData(request),
                config: request,
                duration: Date.now() - startTime
            };
            // Apply response interceptors
            let processedResponse = mockResponse;
            for (const interceptor of this.responseInterceptors) {
                processedResponse = await interceptor(processedResponse);
            }
            return processedResponse;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Check if we should retry
            const shouldRetry = attempt < (request.retries || 0) && this.isRetryableError(error);
            if (shouldRetry) {
                const delay = this.calculateRetryDelay(attempt);
                await this.sleep(delay);
                return this.executeRequest(request, attempt + 1);
            }
            // Create error response
            const httpError = new types_1.HTTPClientError(error instanceof Error ? error.message : String(error), 'HTTP_REQUEST_ERROR', this.isRetryableError(error));
            httpError.request = request;
            httpError.duration = duration;
            throw httpError;
        }
        finally {
            this.activeRequests--;
            this.processQueue();
        }
    }
    buildFullUrl(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        if (this.config.baseURL) {
            return `${this.config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
        }
        return url;
    }
    createMockResponseData(request) {
        // Create mock response data based on request
        const mockData = {
            message: `Mock response for ${request.method} ${request.url}`,
            timestamp: new Date().toISOString(),
            request: {
                method: request.method,
                url: request.url,
                hasBody: !!request.body
            }
        };
        return mockData;
    }
    isRetryableError(error) {
        if (error instanceof Error) {
            // Network errors, timeouts, and 5xx status codes are typically retryable
            const retryablePatterns = [
                /ECONNRESET/,
                /ENOTFOUND/,
                /ECONNREFUSED/,
                /ETIMEDOUT/,
                /timeout/i
            ];
            return retryablePatterns.some(pattern => pattern.test(error.message));
        }
        return false;
    }
    calculateRetryDelay(attempt) {
        const baseDelay = this.config.retryDelay || 1000;
        return baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async waitForSlot() {
        return new Promise(resolve => {
            this.requestQueue.push(resolve);
        });
    }
    processQueue() {
        if (this.requestQueue.length > 0 && this.activeRequests < (this.config.maxConcurrentRequests || 100)) {
            const next = this.requestQueue.shift();
            if (next) {
                next();
            }
        }
    }
}
exports.NodeHTTPProvider = NodeHTTPProvider;
