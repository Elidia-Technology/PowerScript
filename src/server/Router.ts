/**
 * PowerScript Server Router
 * Express-like routing with pattern matching and parameter extraction
 */

import type { Request, Response, RouteHandler, HttpMethod, MiddlewareFunction, NextFunction } from './types';

export interface RoutePattern {
  pattern: RegExp;
  paramNames: string[];
}

export interface Route {
  method: HttpMethod;
  path: string;
  pattern: RoutePattern;
  handler: RouteHandler;
  middleware: MiddlewareFunction[];
  name?: string;
}

/**
 * Router class for handling route registration and matching
 */
export class Router {
  private _routes: Route[] = [];
  private _middleware: MiddlewareFunction[] = [];
  private _prefix = '';

  constructor(prefix = '') {
    this._prefix = prefix;
  }

  /**
   * Add middleware to all routes in this router
   */
  use(middleware: MiddlewareFunction): Router {
    this._middleware.push(middleware);
    return this;
  }

  /**
   * Add GET route
   */
  get(path: string, ...handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    return this._addRoute('GET', path, handlers);
  }

  /**
   * Add POST route
   */
  post(path: string, ...handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    return this._addRoute('POST', path, handlers);
  }

  /**
   * Add PUT route
   */
  put(path: string, ...handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    return this._addRoute('PUT', path, handlers);
  }

  /**
   * Add DELETE route
   */
  delete(path: string, ...handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    return this._addRoute('DELETE', path, handlers);
  }

  /**
   * Add PATCH route
   */
  patch(path: string, ...handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    return this._addRoute('PATCH', path, handlers);
  }

  /**
   * Add route for all HTTP methods
   */
  all(path: string, ...handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    methods.forEach(method => {
      this._addRoute(method, path, handlers);
    });
    return this;
  }

  /**
   * Add route with specific method
   */
  route(method: HttpMethod, path: string, ...handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    return this._addRoute(method, path, handlers);
  }

  /**
   * Create a named route
   */
  name(routeName: string): Router {
    if (this._routes.length > 0) {
      const lastRoute = this._routes[this._routes.length - 1];
      lastRoute.name = routeName;
    }
    return this;
  }

  /**
   * Add a group of routes with common prefix and middleware
   */
  group(options: { prefix?: string; middleware?: MiddlewareFunction[] }, callback: (router: Router) => void): Router {
    const groupRouter = new Router(this._prefix + (options.prefix || ''));
    
    if (options.middleware) {
      options.middleware.forEach(middleware => groupRouter.use(middleware));
    }

    callback(groupRouter);
    
    // Merge group routes into this router
    this._routes.push(...groupRouter._routes);
    
    return this;
  }

  /**
   * Mount another router
   */
  mount(path: string, router: Router): Router {
    const mountedRoutes = router._routes.map(route => ({
      ...route,
      path: this._prefix + path + route.path,
      pattern: this._createPattern(this._prefix + path + route.path)
    }));

    this._routes.push(...mountedRoutes);
    return this;
  }

  /**
   * Match a request to a route
   */
  match(method: HttpMethod, path: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this._routes) {
      if (route.method === method) {
        const match = path.match(route.pattern.pattern);
        if (match) {
          const params: Record<string, string> = {};
          
          route.pattern.paramNames.forEach((paramName, index) => {
            params[paramName] = match[index + 1];
          });

          return { route, params };
        }
      }
    }

    return null;
  }

  /**
   * Execute route with middleware chain
   */
  async execute(route: Route, req: Request, res: Response, params: Record<string, string>): Promise<void> {
    // Set route parameters
    req.params = params;

    // Build middleware chain
    const middlewareChain = [
      ...this._middleware,
      ...route.middleware,
      route.handler
    ];

    let index = 0;

    const next: NextFunction = async (error?: any) => {
      if (error) {
        throw error;
      }

      if (index >= middlewareChain.length) {
        return;
      }

      const handler = middlewareChain[index++];
      await handler(req, res, next);
    };

    await next();
  }

  /**
   * Generate URL for named route
   */
  url(routeName: string, params: Record<string, string> = {}): string {
    const route = this._routes.find(r => r.name === routeName);
    if (!route) {
      throw new Error(`Route "${routeName}" not found`);
    }

    let url = route.path;
    
    // Replace parameters
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });

    return url;
  }

  /**
   * Get all routes
   */
  getRoutes(): Route[] {
    return [...this._routes];
  }

  /**
   * Add route to the router
   */
  private _addRoute(method: HttpMethod, path: string, handlers: (RouteHandler | MiddlewareFunction)[]): Router {
    if (handlers.length === 0) {
      throw new Error('Route must have at least one handler');
    }

    const fullPath = this._prefix + path;
    const pattern = this._createPattern(fullPath);
    const handler = handlers[handlers.length - 1] as RouteHandler;
    const middleware = handlers.slice(0, -1) as MiddlewareFunction[];

    const route: Route = {
      method,
      path: fullPath,
      pattern,
      handler,
      middleware
    };

    this._routes.push(route);
    return this;
  }

  /**
   * Create pattern for path matching
   */
  private _createPattern(path: string): RoutePattern {
    const paramNames: string[] = [];
    
    // First, extract parameters before escaping
    let pattern = path.replace(/:([^/]+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return '___PARAM___';  // Temporary placeholder
    });
    
    // Escape special regex characters
    pattern = pattern.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');
    
    // Replace placeholders with capture groups
    pattern = pattern.replace(/___PARAM___/g, '([^/]+)');

    // Add anchors for exact matching
    pattern = `^${pattern}$`;

    return {
      pattern: new RegExp(pattern),
      paramNames
    };
  }

  /**
   * Get router statistics
   */
  getStats(): any {
    const methodCounts = this._routes.reduce((acc, route) => {
      acc[route.method] = (acc[route.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRoutes: this._routes.length,
      methodCounts,
      middleware: this._middleware.length,
      namedRoutes: this._routes.filter(r => r.name).length,
      prefix: this._prefix
    };
  }
}