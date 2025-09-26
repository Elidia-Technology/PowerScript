"use strict";
/**
 * PowerScript Enhanced Networking Module - URLRequest
 *
 * AS3-compatible URLRequest class for HTTP requests
 * Provides familiar PowerScript API while leveraging modern web standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLRequest = void 0;
/**
 * URLRequest - AS3-compatible HTTP request builder
 *
 * Familiar PowerScript style API:
 * ```typescript
 * const request = new URLRequest('https://api.example.com/data');
 * request.method = 'POST';
 * request.data = JSON.stringify({ key: 'value' });
 * request.requestHeaders.push({ name: 'Content-Type', value: 'application/json' });
 * ```
 */
class URLRequest {
    /**
     * Create a new URLRequest
     * @param url The URL to request (optional, can be set later)
     */
    constructor(url) {
        this._method = 'GET';
        this._data = null;
        this._requestHeaders = [];
        this._contentType = null;
        this._timeout = 30000; // 30 seconds default
        this._followRedirects = true;
        this._validateSSL = true;
        this._authentication = undefined;
        this._url = url || '';
    }
    /**
     * Get/Set the URL to request
     */
    get url() {
        return this._url;
    }
    set url(value) {
        this._url = value;
    }
    /**
     * Get/Set the HTTP method
     */
    get method() {
        return this._method;
    }
    set method(value) {
        this._method = value;
    }
    /**
     * Get/Set the request data
     * Can be string, object, FormData, Buffer, etc.
     */
    get data() {
        return this._data;
    }
    set data(value) {
        this._data = value;
    }
    /**
     * Get the request headers array (AS3-style)
     * Each header is an object with name and value properties
     */
    get requestHeaders() {
        return this._requestHeaders;
    }
    set requestHeaders(value) {
        this._requestHeaders = value || [];
    }
    /**
     * Get/Set the content type
     */
    get contentType() {
        return this._contentType;
    }
    set contentType(value) {
        this._contentType = value;
    }
    /**
     * Get/Set the request timeout in milliseconds
     */
    get timeout() {
        return this._timeout;
    }
    set timeout(value) {
        this._timeout = Math.max(0, value);
    }
    /**
     * Get/Set whether to follow redirects
     */
    get followRedirects() {
        return this._followRedirects;
    }
    set followRedirects(value) {
        this._followRedirects = value;
    }
    /**
     * Get/Set whether to validate SSL certificates
     */
    get validateSSL() {
        return this._validateSSL;
    }
    set validateSSL(value) {
        this._validateSSL = value;
    }
    /**
     * Set basic authentication
     * @param username The username
     * @param password The password
     */
    setBasicAuth(username, password) {
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        this._authentication = {
            type: 'basic',
            credentials
        };
    }
    /**
     * Set bearer token authentication
     * @param token The bearer token
     */
    setBearerAuth(token) {
        this._authentication = {
            type: 'bearer',
            credentials: token
        };
    }
    /**
     * Add a request header
     * @param name Header name
     * @param value Header value
     */
    addRequestHeader(name, value) {
        // Remove existing header with same name (case-insensitive)
        this._requestHeaders = this._requestHeaders.filter(header => header.name.toLowerCase() !== name.toLowerCase());
        this._requestHeaders.push({ name, value });
    }
    /**
     * Remove a request header
     * @param name Header name to remove
     */
    removeRequestHeader(name) {
        this._requestHeaders = this._requestHeaders.filter(header => header.name.toLowerCase() !== name.toLowerCase());
    }
    /**
     * Get a request header value
     * @param name Header name
     * @returns Header value or null if not found
     */
    getRequestHeader(name) {
        const header = this._requestHeaders.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : null;
    }
    /**
     * Clear all request headers
     */
    clearRequestHeaders() {
        this._requestHeaders = [];
    }
    /**
     * Convert to options object for HTTP clients
     */
    toRequestOptions() {
        const options = {
            method: this._method,
            headers: this._requestHeaders,
            data: this._data,
            timeout: this._timeout,
            followRedirects: this._followRedirects,
            validateSSL: this._validateSSL
        };
        if (this._contentType) {
            options.contentType = this._contentType;
        }
        if (this._authentication) {
            options.authentication = this._authentication;
        }
        return options;
    }
    /**
     * Convert headers array to object format
     */
    getHeadersAsObject() {
        const headers = {};
        for (const header of this._requestHeaders) {
            headers[header.name] = header.value;
        }
        // Add content type if set
        if (this._contentType) {
            headers['Content-Type'] = this._contentType;
        }
        // Add authentication header
        if (this._authentication) {
            if (this._authentication.type === 'basic') {
                headers['Authorization'] = `Basic ${this._authentication.credentials}`;
            }
            else if (this._authentication.type === 'bearer') {
                headers['Authorization'] = `Bearer ${this._authentication.credentials}`;
            }
        }
        return headers;
    }
    /**
     * Clone this URLRequest
     */
    clone() {
        const clone = new URLRequest(this._url);
        clone._method = this._method;
        clone._data = this._data;
        clone._requestHeaders = [...this._requestHeaders];
        clone._contentType = this._contentType;
        clone._timeout = this._timeout;
        clone._followRedirects = this._followRedirects;
        clone._validateSSL = this._validateSSL;
        clone._authentication = this._authentication ? { ...this._authentication } : undefined;
        return clone;
    }
    /**
     * Validate the request
     */
    validate() {
        const errors = [];
        if (!this._url) {
            errors.push('URL is required');
        }
        else {
            try {
                new URL(this._url);
            }
            catch {
                errors.push('Invalid URL format');
            }
        }
        if (this._timeout <= 0) {
            errors.push('Timeout must be greater than 0');
        }
        // Validate data for certain methods
        if (['POST', 'PUT', 'PATCH'].includes(this._method) && this._data === null) {
            // Warning, not error - sometimes empty body is valid
        }
        return errors;
    }
    /**
     * String representation of the request
     */
    toString() {
        return `URLRequest(${this._method} ${this._url})`;
    }
}
exports.URLRequest = URLRequest;
