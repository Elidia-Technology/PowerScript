/**
 * PowerScript Enhanced Networking Module - URLLoader
 * 
 * AS3-compatible URLLoader class for executing HTTP requests
 * Provides familiar PowerScript API with modern async/await support
 */

import { EventEmitter } from 'events';
import { URLRequest, URLRequestOptions } from './URLRequest';

export interface URLLoaderResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  redirected: boolean;
  type: 'text' | 'json' | 'blob' | 'arraybuffer';
}

export interface URLLoaderError extends Error {
  status?: number;
  statusText?: string;
  response?: any;
  code?: string;
}

export type URLLoaderDataFormat = 'text' | 'json' | 'blob' | 'arraybuffer' | 'auto';

export interface URLLoaderEventMap {
  'open': () => void;
  'progress': (loaded: number, total: number) => void;
  'complete': (response: URLLoaderResponse) => void;
  'error': (error: URLLoaderError) => void;
  'timeout': () => void;
  'abort': () => void;
}

/**
 * URLLoader - AS3-compatible HTTP request executor
 * 
 * Familiar PowerScript style API with modern Promise support:
 * ```typescript
 * const loader = new URLLoader();
 * loader.on('complete', (response) => console.log(response.data));
 * loader.on('error', (error) => console.error(error.message));
 * 
 * const request = new URLRequest('https://api.example.com/data');
 * await loader.load(request);
 * 
 * // Or use Promise-style
 * try {
 *   const response = await loader.loadAsync(request);
 *   console.log(response.data);
 * } catch (error) {
 *   console.error(error.message);
 * }
 * ```
 */
export class URLLoader extends EventEmitter {
  private _dataFormat: URLLoaderDataFormat = 'auto';
  private _bytesLoaded: number = 0;
  private _bytesTotal: number = 0;
  private _data: any = null;
  private _abortController: AbortController | null = null;
  private _isLoading: boolean = false;

  /**
   * Create a new URLLoader
   */
  constructor() {
    super();
  }

  /**
   * Get/Set the data format for response parsing
   */
  get dataFormat(): URLLoaderDataFormat {
    return this._dataFormat;
  }

  set dataFormat(value: URLLoaderDataFormat) {
    this._dataFormat = value;
  }

  /**
   * Get the number of bytes loaded
   */
  get bytesLoaded(): number {
    return this._bytesLoaded;
  }

  /**
   * Get the total number of bytes
   */
  get bytesTotal(): number {
    return this._bytesTotal;
  }

  /**
   * Get the loaded data
   */
  get data(): any {
    return this._data;
  }

  /**
   * Check if currently loading
   */
  get isLoading(): boolean {
    return this._isLoading;
  }

  /**
   * Load data from a URLRequest (AS3-style with events)
   * @param request The URLRequest to execute
   */
  load(request: URLRequest): void {
    this.loadAsync(request).catch(error => {
      this.emit('error', this._createError(error));
    });
  }

  /**
   * Load data from a URLRequest (Promise-based)
   * @param request The URLRequest to execute
   * @returns Promise that resolves with the response
   */
  async loadAsync(request: URLRequest): Promise<URLLoaderResponse> {
    if (this._isLoading) {
      throw new Error('URLLoader is already loading. Call close() first.');
    }

    // Validate request
    const validationErrors = request.validate();
    if (validationErrors.length > 0) {
      throw this._createError(new Error(`Invalid request: ${validationErrors.join(', ')}`));
    }

    this._isLoading = true;
    this._bytesLoaded = 0;
    this._bytesTotal = 0;
    this._data = null;
    this._abortController = new AbortController();

    try {
      this.emit('open');

      const response = await this._executeRequest(request);
      
      this._data = response.data;
      this._isLoading = false;
      
      this.emit('complete', response);
      return response;

    } catch (error) {
      this._isLoading = false;
      const loaderError = this._createError(error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        this.emit('abort');
      } else if (loaderError.code === 'TIMEOUT') {
        this.emit('timeout');
      } else {
        this.emit('error', loaderError);
      }
      
      throw loaderError;
    } finally {
      this._abortController = null;
    }
  }

  /**
   * Load data from a URL string (convenience method)
   * @param url The URL to load
   * @param method HTTP method (default: GET)
   * @returns Promise that resolves with the response
   */
  async loadUrl(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<URLLoaderResponse> {
    const request = new URLRequest(url);
    request.method = method;
    return this.loadAsync(request);
  }

  /**
   * Load JSON data from a URL (convenience method)
   * @param url The URL to load
   * @returns Promise that resolves with parsed JSON data
   */
  async loadJSON<T = any>(url: string): Promise<T> {
    const originalFormat = this._dataFormat;
    this._dataFormat = 'json';
    
    try {
      const response = await this.loadUrl(url);
      return response.data as T;
    } finally {
      this._dataFormat = originalFormat;
    }
  }

  /**
   * Post JSON data to a URL (convenience method)
   * @param url The URL to post to
   * @param data The data to post
   * @returns Promise that resolves with the response
   */
  async postJSON<T = any>(url: string, data: any): Promise<T> {
    const request = new URLRequest(url);
    request.method = 'POST';
    request.contentType = 'application/json';
    request.data = JSON.stringify(data);
    
    const originalFormat = this._dataFormat;
    this._dataFormat = 'json';
    
    try {
      const response = await this.loadAsync(request);
      return response.data as T;
    } finally {
      this._dataFormat = originalFormat;
    }
  }

  /**
   * Abort the current request
   */
  close(): void {
    if (this._abortController && this._isLoading) {
      this._abortController.abort();
    }
  }

  /**
   * Execute the HTTP request
   */
  private async _executeRequest(request: URLRequest): Promise<URLLoaderResponse> {
    const options = request.toRequestOptions();
    const headers = request.getHeadersAsObject();
    
    // Use fetch API for browser/Node.js compatibility
    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
      body: this._prepareRequestBody(options.data, request.contentType),
      signal: this._abortController?.signal,
      redirect: options.followRedirects ? 'follow' : 'manual'
    };

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (this._abortController) {
        this._abortController.abort();
      }
    }, options.timeout || 30000);

    try {
      const response = await fetch(request.url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as URLLoaderError;
        error.status = response.status;
        error.statusText = response.statusText;
        try {
          error.response = await response.text();
        } catch {
          // Ignore response body parsing errors
        }
        throw error;
      }

      // Parse response
      const responseData = await this._parseResponse(response);
      const responseHeaders = this._extractHeaders(response.headers);

      // Update progress
      this._bytesTotal = parseInt(response.headers.get('content-length') || '0');
      this._bytesLoaded = this._bytesTotal;
      
      if (this._bytesTotal > 0) {
        this.emit('progress', this._bytesLoaded, this._bytesTotal);
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        url: response.url,
        redirected: response.redirected,
        type: this._getResponseType(response)
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout') as URLLoaderError;
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      
      throw error;
    }
  }

  /**
   * Prepare request body based on data type
   */
  private _prepareRequestBody(data: any, contentType: string | null): BodyInit | null {
    if (data === null || data === undefined) {
      return null;
    }

    // Handle different data types
    if (typeof data === 'string') {
      return data;
    }

    if (data instanceof FormData || data instanceof Blob || data instanceof ArrayBuffer) {
      return data;
    }

    if (Buffer && data instanceof Buffer) {
      return data;
    }

    // Default to JSON string for objects
    if (typeof data === 'object') {
      return JSON.stringify(data);
    }

    return String(data);
  }

  /**
   * Parse response based on data format
   */
  private async _parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';
    let format = this._dataFormat;

    // Auto-detect format if set to 'auto'
    if (format === 'auto') {
      if (contentType.includes('application/json')) {
        format = 'json';
      } else if (contentType.includes('text/')) {
        format = 'text';
      } else {
        format = 'text';
      }
    }

    switch (format) {
      case 'json':
        try {
          return await response.json();
        } catch {
          return await response.text();
        }
      
      case 'blob':
        return await response.blob();
      
      case 'arraybuffer':
        return await response.arrayBuffer();
      
      case 'text':
      default:
        return await response.text();
    }
  }

  /**
   * Extract headers from response
   */
  private _extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Get response type based on content-type
   */
  private _getResponseType(response: Response): 'text' | 'json' | 'blob' | 'arraybuffer' {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return 'json';
    } else if (contentType.includes('text/')) {
      return 'text';
    } else {
      return 'blob';
    }
  }

  /**
   * Create a URLLoaderError from an error
   */
  private _createError(error: any): URLLoaderError {
    if (error && typeof error === 'object' && 'status' in error) {
      return error as URLLoaderError;
    }

    const loaderError = new Error(error?.message || String(error)) as URLLoaderError;
    loaderError.name = 'URLLoaderError';
    
    if (error?.code) {
      loaderError.code = error.code;
    }
    
    return loaderError;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.close();
    this.removeAllListeners();
    this._data = null;
  }
}