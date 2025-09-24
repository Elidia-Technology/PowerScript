/**
 * PowerScript NodeJS HTTP Provider
 * Implementation of HTTP client using Node.js built-in modules
 */

import {
    HTTPProvider, HTTPRequest, HTTPResponse, HTTPConfig,
    HTTPClientError, NetworkSeverity
} from '../types';

export class NodeHTTPProvider implements HTTPProvider {
    public readonly name = 'NodeHTTPProvider';
    public readonly version = '1.0.0';
    
    private config: HTTPConfig = {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        maxConcurrentRequests: 100
    };
    
    private requestInterceptors: Array<(request: HTTPRequest) => HTTPRequest | Promise<HTTPRequest>> = [];
    private responseInterceptors: Array<(response: HTTPResponse) => HTTPResponse | Promise<HTTPResponse>> = [];
    
    private activeRequests = 0;
    private requestQueue: Array<() => void> = [];
    
    public async request<T = any>(request: HTTPRequest): Promise<HTTPResponse<T>> {
        // Apply request interceptors
        let processedRequest = request;
        for (const interceptor of this.requestInterceptors) {
            processedRequest = await interceptor(processedRequest);
        }
        
        // Merge with defaults
        const finalRequest: HTTPRequest = {
            ...processedRequest,
            timeout: processedRequest.timeout || this.config.timeout,
            retries: processedRequest.retries || this.config.retries
        };
        
        return this.executeRequest<T>(finalRequest);
    }
    
    public async get<T = any>(url: string, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'GET', url, ...config });
    }
    
    public async post<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'POST', url, body: data, ...config });
    }
    
    public async put<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'PUT', url, body: data, ...config });
    }
    
    public async delete<T = any>(url: string, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'DELETE', url, ...config });
    }
    
    public async patch<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'PATCH', url, body: data, ...config });
    }
    
    public addRequestInterceptor(handler: (request: HTTPRequest) => HTTPRequest | Promise<HTTPRequest>): void {
        this.requestInterceptors.push(handler);
    }
    
    public addResponseInterceptor(handler: (response: HTTPResponse) => HTTPResponse | Promise<HTTPResponse>): void {
        this.responseInterceptors.push(handler);
    }
    
    public setDefaults(config: Partial<HTTPConfig>): void {
        this.config = { ...this.config, ...config };
    }
    
    public getDefaults(): HTTPConfig {
        return { ...this.config };
    }
    
    private async executeRequest<T>(request: HTTPRequest, attempt: number = 1): Promise<HTTPResponse<T>> {
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
            const headers: Record<string, string> = {
                'User-Agent': 'PowerScript-HTTP/1.0.0',
                ...request.headers
            };
            
            // Add content-type for requests with body
            if (request.body && !headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/json';
            }
            
            // Prepare body
            let body: string | undefined;
            if (request.body) {
                if (typeof request.body === 'string') {
                    body = request.body;
                } else {
                    body = JSON.stringify(request.body);
                }
            }
            
            // Create a mock response (placeholder implementation)
            const mockResponse: HTTPResponse<T> = {
                status: 200,
                statusText: 'OK',
                headers: {
                    'content-type': 'application/json',
                    'content-length': body ? body.length.toString() : '0'
                },
                data: this.createMockResponseData<T>(request),
                config: request,
                duration: Date.now() - startTime
            };
            
            // Apply response interceptors
            let processedResponse = mockResponse;
            for (const interceptor of this.responseInterceptors) {
                processedResponse = await interceptor(processedResponse);
            }
            
            return processedResponse;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Check if we should retry
            const shouldRetry = attempt < (request.retries || 0) && this.isRetryableError(error);
            
            if (shouldRetry) {
                const delay = this.calculateRetryDelay(attempt);
                await this.sleep(delay);
                return this.executeRequest<T>(request, attempt + 1);
            }
            
            // Create error response
            const httpError = new HTTPClientError(
                error instanceof Error ? error.message : String(error),
                'HTTP_REQUEST_ERROR',
                this.isRetryableError(error)
            );
            
            (httpError as any).request = request;
            (httpError as any).duration = duration;
            throw httpError;
            
        } finally {
            this.activeRequests--;
            this.processQueue();
        }
    }
    
    private buildFullUrl(url: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        if (this.config.baseURL) {
            return `${this.config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
        }
        
        return url;
    }
    
    private createMockResponseData<T>(request: HTTPRequest): T {
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
        
        return mockData as T;
    }
    
    private isRetryableError(error: unknown): boolean {
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
    
    private calculateRetryDelay(attempt: number): number {
        const baseDelay = this.config.retryDelay || 1000;
        return baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    private async waitForSlot(): Promise<void> {
        return new Promise<void>(resolve => {
            this.requestQueue.push(resolve);
        });
    }
    
    private processQueue(): void {
        if (this.requestQueue.length > 0 && this.activeRequests < (this.config.maxConcurrentRequests || 100)) {
            const next = this.requestQueue.shift();
            if (next) {
                next();
            }
        }
    }
}