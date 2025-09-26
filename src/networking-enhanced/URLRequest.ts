/**
 * PowerScript Enhanced Networking Module - URLRequest
 * 
 * AS3-compatible URLRequest class for HTTP requests
 * Provides familiar PowerScript API while leveraging modern web standards
 */

export interface URLRequestHeader {
  name: string;
  value: string;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface URLRequestOptions {
  method?: HTTPMethod;
  headers?: URLRequestHeader[] | Record<string, string>;
  data?: any;
  contentType?: string;
  timeout?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
  authentication?: {
    type: 'basic' | 'bearer';
    credentials: string;
  };
}

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
export class URLRequest {
  private _url: string;
  private _method: HTTPMethod = 'GET';
  private _data: any = null;
  private _requestHeaders: URLRequestHeader[] = [];
  private _contentType: string | null = null;
  private _timeout: number = 30000; // 30 seconds default
  private _followRedirects: boolean = true;
  private _validateSSL: boolean = true;
  private _authentication: URLRequestOptions['authentication'] = undefined;

  /**
   * Create a new URLRequest
   * @param url The URL to request (optional, can be set later)
   */
  constructor(url?: string) {
    this._url = url || '';
  }

  /**
   * Get/Set the URL to request
   */
  get url(): string {
    return this._url;
  }

  set url(value: string) {
    this._url = value;
  }

  /**
   * Get/Set the HTTP method
   */
  get method(): HTTPMethod {
    return this._method;
  }

  set method(value: HTTPMethod) {
    this._method = value;
  }

  /**
   * Get/Set the request data
   * Can be string, object, FormData, Buffer, etc.
   */
  get data(): any {
    return this._data;
  }

  set data(value: any) {
    this._data = value;
  }

  /**
   * Get the request headers array (AS3-style)
   * Each header is an object with name and value properties
   */
  get requestHeaders(): URLRequestHeader[] {
    return this._requestHeaders;
  }

  set requestHeaders(value: URLRequestHeader[]) {
    this._requestHeaders = value || [];
  }

  /**
   * Get/Set the content type
   */
  get contentType(): string | null {
    return this._contentType;
  }

  set contentType(value: string | null) {
    this._contentType = value;
  }

  /**
   * Get/Set the request timeout in milliseconds
   */
  get timeout(): number {
    return this._timeout;
  }

  set timeout(value: number) {
    this._timeout = Math.max(0, value);
  }

  /**
   * Get/Set whether to follow redirects
   */
  get followRedirects(): boolean {
    return this._followRedirects;
  }

  set followRedirects(value: boolean) {
    this._followRedirects = value;
  }

  /**
   * Get/Set whether to validate SSL certificates
   */
  get validateSSL(): boolean {
    return this._validateSSL;
  }

  set validateSSL(value: boolean) {
    this._validateSSL = value;
  }

  /**
   * Set basic authentication
   * @param username The username
   * @param password The password
   */
  setBasicAuth(username: string, password: string): void {
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
  setBearerAuth(token: string): void {
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
  addRequestHeader(name: string, value: string): void {
    // Remove existing header with same name (case-insensitive)
    this._requestHeaders = this._requestHeaders.filter(
      header => header.name.toLowerCase() !== name.toLowerCase()
    );
    
    this._requestHeaders.push({ name, value });
  }

  /**
   * Remove a request header
   * @param name Header name to remove
   */
  removeRequestHeader(name: string): void {
    this._requestHeaders = this._requestHeaders.filter(
      header => header.name.toLowerCase() !== name.toLowerCase()
    );
  }

  /**
   * Get a request header value
   * @param name Header name
   * @returns Header value or null if not found
   */
  getRequestHeader(name: string): string | null {
    const header = this._requestHeaders.find(
      h => h.name.toLowerCase() === name.toLowerCase()
    );
    return header ? header.value : null;
  }

  /**
   * Clear all request headers
   */
  clearRequestHeaders(): void {
    this._requestHeaders = [];
  }

  /**
   * Convert to options object for HTTP clients
   */
  toRequestOptions(): URLRequestOptions {
    const options: URLRequestOptions = {
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
  getHeadersAsObject(): Record<string, string> {
    const headers: Record<string, string> = {};
    
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
      } else if (this._authentication.type === 'bearer') {
        headers['Authorization'] = `Bearer ${this._authentication.credentials}`;
      }
    }

    return headers;
  }

  /**
   * Clone this URLRequest
   */
  clone(): URLRequest {
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
  validate(): string[] {
    const errors: string[] = [];

    if (!this._url) {
      errors.push('URL is required');
    } else {
      try {
        new URL(this._url);
      } catch {
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
  toString(): string {
    return `URLRequest(${this._method} ${this._url})`;
  }
}