/**
 * PowerScript Server Middleware
 * Built-in middleware functions and middleware utilities
 */

import type { 
  Request, 
  Response, 
  NextFunction, 
  MiddlewareFunction,
  ErrorHandlerFunction,
  MiddlewareConfig,
  CORSConfig,
  RateLimitConfig,
  LoggingConfig
} from './types';
import { Logger, ConsoleLogOutput } from '../core/Logger';

/**
 * Middleware utility class with common middleware functions
 */
export class Middleware {
  private static _logger = new Logger({ level: 'info', outputs: [new ConsoleLogOutput()] });
  private static _rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  /**
   * JSON body parser middleware
   */
  static json(options: { limit?: string; strict?: boolean } = {}): MiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.headers['content-type']?.includes('application/json')) {
        try {
          let body = '';
          // In a real implementation, you'd read from the request stream
          // For this mock, we'll simulate having the body
          req.body = JSON.parse(body || '{}');
        } catch (error) {
          res.status(400).json({ error: 'Invalid JSON' });
          return;
        }
      }
      next();
    };
  }

  /**
   * URL-encoded body parser middleware
   */
  static urlEncoded(options: { extended?: boolean; limit?: string } = {}): MiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        try {
          // Simulate parsing URL-encoded data
          req.body = {};
        } catch (error) {
          res.status(400).json({ error: 'Invalid form data' });
          return;
        }
      }
      next();
    };
  }

  /**
   * Static file serving middleware
   */
  static static(root: string, options: { maxAge?: number; index?: string[] } = {}): MiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }

      // In a real implementation, you'd serve files from the filesystem
      // For this mock, we'll just pass through
      next();
    };
  }

  /**
   * CORS middleware
   */
  static cors(options: {
    origin?: string | string[] | RegExp | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  } = {}): MiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      const {
        origin = '*',
        methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders = ['Content-Type', 'Authorization'],
        credentials = false,
        maxAge = 86400
      } = options;

      // Set CORS headers
      if (typeof origin === 'string') {
        res.header('Access-Control-Allow-Origin', origin);
      } else if (Array.isArray(origin)) {
        const requestOrigin = req.headers.origin;
        if (requestOrigin && origin.includes(requestOrigin)) {
          res.header('Access-Control-Allow-Origin', requestOrigin);
        }
      }

      res.header('Access-Control-Allow-Methods', methods.join(', '));
      res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));

      if (credentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', maxAge.toString());
        res.status(204).end();
        return;
      }

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  static rateLimit(config: RateLimitConfig): MiddlewareFunction {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100,
      message = 'Too many requests, please try again later',
      standardHeaders = true,
      legacyHeaders = false
    } = config;

    return async (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'anonymous';
      const now = Date.now();
      
      let record = this._rateLimitStore.get(key);
      
      if (!record || now > record.resetTime) {
        // Reset or create new record
        record = {
          count: 1,
          resetTime: now + windowMs
        };
        this._rateLimitStore.set(key, record);
      } else {
        record.count++;
      }

      // Set headers
      if (standardHeaders) {
        res.header('RateLimit-Limit', max.toString());
        res.header('RateLimit-Remaining', Math.max(0, max - record.count).toString());
        res.header('RateLimit-Reset', new Date(record.resetTime).toISOString());
      }

      if (legacyHeaders) {
        res.header('X-RateLimit-Limit', max.toString());
        res.header('X-RateLimit-Remaining', Math.max(0, max - record.count).toString());
        res.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
      }

      if (record.count > max) {
        res.status(429).json({
          error: 'Too Many Requests',
          message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
        return;
      }

      next();
    };
  }

  /**
   * Security headers middleware (Helmet-like)
   */
  static helmet(options: {
    contentSecurityPolicy?: boolean | any;
    crossOriginEmbedderPolicy?: boolean;
    crossOriginOpenerPolicy?: boolean;
    crossOriginResourcePolicy?: boolean;
    dnsPrefetchControl?: boolean;
    frameguard?: boolean | { action: string };
    hidePoweredBy?: boolean;
    hsts?: boolean | any;
    ieNoOpen?: boolean;
    noSniff?: boolean;
    originAgentCluster?: boolean;
    permittedCrossDomainPolicies?: boolean;
    referrerPolicy?: boolean | any;
    xssFilter?: boolean;
  } = {}): MiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      const {
        contentSecurityPolicy = true,
        crossOriginEmbedderPolicy = true,
        crossOriginOpenerPolicy = true,
        crossOriginResourcePolicy = true,
        dnsPrefetchControl = true,
        frameguard = { action: 'sameorigin' },
        hidePoweredBy = true,
        hsts = true,
        ieNoOpen = true,
        noSniff = true,
        originAgentCluster = true,
        permittedCrossDomainPolicies = false,
        referrerPolicy = { policy: 'no-referrer' },
        xssFilter = true
      } = options;

      // Remove X-Powered-By header
      if (hidePoweredBy) {
        res.header('X-Powered-By', '');
      }

      // X-Content-Type-Options
      if (noSniff) {
        res.header('X-Content-Type-Options', 'nosniff');
      }

      // X-Frame-Options
      if (frameguard) {
        const action = typeof frameguard === 'object' ? frameguard.action : 'sameorigin';
        res.header('X-Frame-Options', action.toUpperCase());
      }

      // X-XSS-Protection
      if (xssFilter) {
        res.header('X-XSS-Protection', '1; mode=block');
      }

      // Strict-Transport-Security
      if (hsts && req.secure) {
        const maxAge = typeof hsts === 'object' ? hsts.maxAge || 31536000 : 31536000;
        const includeSubDomains = typeof hsts === 'object' ? hsts.includeSubDomains : true;
        let hstsValue = `max-age=${maxAge}`;
        if (includeSubDomains) hstsValue += '; includeSubDomains';
        res.header('Strict-Transport-Security', hstsValue);
      }

      // Referrer-Policy
      if (referrerPolicy) {
        const policy = typeof referrerPolicy === 'object' 
          ? referrerPolicy.policy || 'no-referrer'
          : 'no-referrer';
        res.header('Referrer-Policy', policy);
      }

      // Content-Security-Policy
      if (contentSecurityPolicy) {
        const csp = typeof contentSecurityPolicy === 'object'
          ? this._buildCSP(contentSecurityPolicy)
          : "default-src 'self'";
        res.header('Content-Security-Policy', csp);
      }

      // Cross-Origin policies
      if (crossOriginEmbedderPolicy) {
        res.header('Cross-Origin-Embedder-Policy', 'require-corp');
      }

      if (crossOriginOpenerPolicy) {
        res.header('Cross-Origin-Opener-Policy', 'same-origin');
      }

      if (crossOriginResourcePolicy) {
        res.header('Cross-Origin-Resource-Policy', 'same-origin');
      }

      // DNS Prefetch Control
      if (dnsPrefetchControl) {
        res.header('X-DNS-Prefetch-Control', 'off');
      }

      // IE No Open
      if (ieNoOpen) {
        res.header('X-Download-Options', 'noopen');
      }

      // Origin Agent Cluster
      if (originAgentCluster) {
        res.header('Origin-Agent-Cluster', '?1');
      }

      // Permitted Cross Domain Policies
      if (permittedCrossDomainPolicies === false) {
        res.header('X-Permitted-Cross-Domain-Policies', 'none');
      }

      next();
    };
  }

  /**
   * Request logging middleware
   */
  static logger(options: {
    format?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
    skip?: (req: Request, res: Response) => boolean;
  } = {}): MiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Override res.end to log after response
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        
        if (!options.skip || !options.skip(req, res)) {
          Middleware._logger.info('Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
        }

        originalEnd.apply(this, args as any);
      };

      next();
    };
  }

  /**
   * Error handling middleware
   */
  static errorHandler(options: {
    showStack?: boolean;
    logErrors?: boolean;
  } = {}): ErrorHandlerFunction {
    return async (error: any, req: Request, res: Response, next: NextFunction) => {
      const { showStack = false, logErrors = true } = options;

      if (logErrors) {
        this._logger.error('Request error', {
          error: error.message,
          stack: error.stack,
          method: req.method,
          url: req.url,
          ip: req.ip
        });
      }

      const statusCode = error.statusCode || error.status || 500;
      const message = statusCode < 500 ? error.message : 'Internal Server Error';

      const errorResponse: any = {
        error: message,
        statusCode,
        timestamp: new Date().toISOString()
      };

      if (showStack && statusCode >= 500) {
        errorResponse.stack = error.stack;
      }

      res.status(statusCode).json(errorResponse);
    };
  }

  /**
   * Request timeout middleware
   */
  static timeout(ms: number): MiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({
            error: 'Request Timeout',
            message: `Request timed out after ${ms}ms`
          });
        }
      }, ms);

      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        clearTimeout(timeoutId);
        originalEnd.apply(this, args as any);
      };

      next();
    };
  }

  /**
   * Build Content Security Policy string
   */
  private static _buildCSP(policy: any): string {
    const directives: string[] = [];
    
    Object.entries(policy).forEach(([directive, value]) => {
      if (Array.isArray(value)) {
        directives.push(`${directive} ${value.join(' ')}`);
      } else if (typeof value === 'string') {
        directives.push(`${directive} ${value}`);
      }
    });

    return directives.join('; ');
  }

  /**
   * Clean up rate limit store (should be called periodically)
   */
  static cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, record] of this._rateLimitStore.entries()) {
      if (now > record.resetTime) {
        this._rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Get middleware statistics
   */
  static getStats(): any {
    return {
      rateLimitEntries: this._rateLimitStore.size,
      rateLimitData: Array.from(this._rateLimitStore.entries()).map(([key, data]) => ({
        key,
        count: data.count,
        resetTime: new Date(data.resetTime)
      }))
    };
  }
}