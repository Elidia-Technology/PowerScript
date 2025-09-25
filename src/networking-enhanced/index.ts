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

import { EventEmitter } from 'events';
import { URLRequest, URLRequestOptions } from './URLRequest';
import { URLLoader, URLLoaderResponse, URLLoaderDataFormat } from './URLLoader';
import { PowerScriptWebSocket, WebSocketConfig } from './WebSocketProvider';

export interface NetworkingConfig {
  defaultTimeout?: number;
  maxConcurrentRequests?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
  userAgent?: string;
}

export interface NetworkMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
  totalBytesTransferred: number;
}

export interface ConnectionPool {
  http: Map<string, URLLoader>;
  websocket: Map<string, PowerScriptWebSocket>;
}

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
export class PowerScriptNetworkingEnhanced extends EventEmitter {
  public readonly name = 'PowerScriptNetworkingEnhanced';
  public readonly version = '1.0.0';

  private _config: Required<NetworkingConfig>;
  private _metrics: NetworkMetrics;
  private _connectionPool: ConnectionPool;
  private _activeRequests: Set<URLLoader> = new Set();
  private _requestQueue: Array<() => Promise<any>> = [];
  private _isProcessingQueue = false;

  constructor(config: NetworkingConfig = {}) {
    super();

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
  get metrics(): NetworkMetrics {
    return { ...this._metrics };
  }

  /**
   * Get active connections count
   */
  get activeConnections(): number {
    return this._activeRequests.size + this._connectionPool.websocket.size;
  }

  /**
   * Create a new URLRequest (AS3-style)
   * @param url Optional URL to initialize with
   * @returns New URLRequest instance
   */
  createURLRequest(url?: string): URLRequest {
    const request = new URLRequest(url);
    
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
  createURLLoader(dataFormat: URLLoaderDataFormat = 'auto'): URLLoader {
    const loader = new URLLoader();
    loader.dataFormat = dataFormat;
    
    return loader;
  }

  /**
   * Execute HTTP request with automatic retry and metrics
   * @param request The URLRequest to execute
   * @param options Additional options
   * @returns Promise resolving to response
   */
  async request(request: URLRequest, options: { retries?: number } = {}): Promise<URLLoaderResponse> {
    return this._executeWithQueue(async () => {
      const retries = options.retries ?? this._config.retryAttempts;
      let lastError: Error | null = null;
      
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

          } finally {
            this._activeRequests.delete(loader);
            loader.destroy();
          }

        } catch (error) {
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
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
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
  async post<T = any>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
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
  async put<T = any>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
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
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
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
  createWebSocket(config: WebSocketConfig): PowerScriptWebSocket {
    const ws = new PowerScriptWebSocket(config);
    
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
  getWebSocket(config: WebSocketConfig): PowerScriptWebSocket | null {
    const poolKey = `${config.url}:${config.protocols?.join(',') || ''}`;
    return this._connectionPool.websocket.get(poolKey) || null;
  }

  /**
   * Close all WebSocket connections
   */
  closeAllWebSockets(): void {
    for (const ws of this._connectionPool.websocket.values()) {
      ws.disconnect();
    }
    this._connectionPool.websocket.clear();
  }

  /**
   * Reset network metrics
   */
  resetMetrics(): void {
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
  private async _executeWithQueue<T>(requestFn: () => Promise<T>): Promise<T> {
    if (this._activeRequests.size >= this._config.maxConcurrentRequests) {
      return new Promise((resolve, reject) => {
        this._requestQueue.push(async () => {
          try {
            const result = await requestFn();
            resolve(result);
          } catch (error) {
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
  private async _processQueue(): Promise<void> {
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
  private _updateMetrics(startTime: number, response: URLLoaderResponse, success: boolean): void {
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
  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up all resources
   */
  async destroy(): Promise<void> {
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

// Export all types and classes
export {
  URLRequest,
  URLLoader,
  PowerScriptWebSocket,
  URLRequestOptions,
  URLLoaderResponse,
  URLLoaderDataFormat,
  WebSocketConfig
};