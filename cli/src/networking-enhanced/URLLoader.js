"use strict";
/**
 * PowerScript Enhanced Networking Module - URLLoader
 *
 * AS3-compatible URLLoader class for executing HTTP requests
 * Provides familiar PowerScript API with modern async/await support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLLoader = void 0;
const events_1 = require("events");
const URLRequest_1 = require("./URLRequest");
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
class URLLoader extends events_1.EventEmitter {
    /**
     * Create a new URLLoader
     */
    constructor() {
        super();
        this._dataFormat = 'auto';
        this._bytesLoaded = 0;
        this._bytesTotal = 0;
        this._data = null;
        this._abortController = null;
        this._isLoading = false;
    }
    /**
     * Get/Set the data format for response parsing
     */
    get dataFormat() {
        return this._dataFormat;
    }
    set dataFormat(value) {
        this._dataFormat = value;
    }
    /**
     * Get the number of bytes loaded
     */
    get bytesLoaded() {
        return this._bytesLoaded;
    }
    /**
     * Get the total number of bytes
     */
    get bytesTotal() {
        return this._bytesTotal;
    }
    /**
     * Get the loaded data
     */
    get data() {
        return this._data;
    }
    /**
     * Check if currently loading
     */
    get isLoading() {
        return this._isLoading;
    }
    /**
     * Load data from a URLRequest (AS3-style with events)
     * @param request The URLRequest to execute
     */
    load(request) {
        this.loadAsync(request).catch(error => {
            this.emit('error', this._createError(error));
        });
    }
    /**
     * Load data from a URLRequest (Promise-based)
     * @param request The URLRequest to execute
     * @returns Promise that resolves with the response
     */
    async loadAsync(request) {
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
        }
        catch (error) {
            this._isLoading = false;
            const loaderError = this._createError(error);
            if (error instanceof Error && error.name === 'AbortError') {
                this.emit('abort');
            }
            else if (loaderError.code === 'TIMEOUT') {
                this.emit('timeout');
            }
            else {
                this.emit('error', loaderError);
            }
            throw loaderError;
        }
        finally {
            this._abortController = null;
        }
    }
    /**
     * Load data from a URL string (convenience method)
     * @param url The URL to load
     * @param method HTTP method (default: GET)
     * @returns Promise that resolves with the response
     */
    async loadUrl(url, method = 'GET') {
        const request = new URLRequest_1.URLRequest(url);
        request.method = method;
        return this.loadAsync(request);
    }
    /**
     * Load JSON data from a URL (convenience method)
     * @param url The URL to load
     * @returns Promise that resolves with parsed JSON data
     */
    async loadJSON(url) {
        const originalFormat = this._dataFormat;
        this._dataFormat = 'json';
        try {
            const response = await this.loadUrl(url);
            return response.data;
        }
        finally {
            this._dataFormat = originalFormat;
        }
    }
    /**
     * Post JSON data to a URL (convenience method)
     * @param url The URL to post to
     * @param data The data to post
     * @returns Promise that resolves with the response
     */
    async postJSON(url, data) {
        const request = new URLRequest_1.URLRequest(url);
        request.method = 'POST';
        request.contentType = 'application/json';
        request.data = JSON.stringify(data);
        const originalFormat = this._dataFormat;
        this._dataFormat = 'json';
        try {
            const response = await this.loadAsync(request);
            return response.data;
        }
        finally {
            this._dataFormat = originalFormat;
        }
    }
    /**
     * Abort the current request
     */
    close() {
        if (this._abortController && this._isLoading) {
            this._abortController.abort();
        }
    }
    /**
     * Execute the HTTP request
     */
    async _executeRequest(request) {
        const options = request.toRequestOptions();
        const headers = request.getHeadersAsObject();
        // Use fetch API for browser/Node.js compatibility
        const fetchOptions = {
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
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.statusText = response.statusText;
                try {
                    error.response = await response.text();
                }
                catch {
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
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                const timeoutError = new Error('Request timeout');
                timeoutError.code = 'TIMEOUT';
                throw timeoutError;
            }
            throw error;
        }
    }
    /**
     * Prepare request body based on data type
     */
    _prepareRequestBody(data, contentType) {
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
    async _parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        let format = this._dataFormat;
        // Auto-detect format if set to 'auto'
        if (format === 'auto') {
            if (contentType.includes('application/json')) {
                format = 'json';
            }
            else if (contentType.includes('text/')) {
                format = 'text';
            }
            else {
                format = 'text';
            }
        }
        switch (format) {
            case 'json':
                try {
                    return await response.json();
                }
                catch {
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
    _extractHeaders(headers) {
        const result = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    /**
     * Get response type based on content-type
     */
    _getResponseType(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return 'json';
        }
        else if (contentType.includes('text/')) {
            return 'text';
        }
        else {
            return 'blob';
        }
    }
    /**
     * Create a URLLoaderError from an error
     */
    _createError(error) {
        if (error && typeof error === 'object' && 'status' in error) {
            return error;
        }
        const loaderError = new Error(error?.message || String(error));
        loaderError.name = 'URLLoaderError';
        if (error?.code) {
            loaderError.code = error.code;
        }
        return loaderError;
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.close();
        this.removeAllListeners();
        this._data = null;
    }
}
exports.URLLoader = URLLoader;
