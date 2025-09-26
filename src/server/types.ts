/**
 * PowerScript Server & Microservices Framework Types
 */

import { EventEmitter } from 'events';

// Server Configuration Types
export interface ServerConfig {
  port?: number;
  host?: string;
  protocol?: 'http' | 'https' | 'http2';
  cluster?: ClusterConfig;
  middleware?: MiddlewareConfig[];
  routes?: RouteConfig[];
  loadBalancer?: LoadBalancerConfig;
  microservice?: MicroserviceConfig;
  security?: ServerSecurityConfig;
  monitoring?: MonitoringConfig;
  logging?: LoggingConfig;
}

export interface ClusterConfig {
  enabled?: boolean;
  workers?: number | 'auto';
  sticky?: boolean;
  gracefulShutdown?: boolean;
  respawnLimit?: number;
  respawnDelay?: number;
}

export interface MicroserviceConfig {
  name: string;
  version: string;
  discovery?: ServiceDiscoveryConfig;
  gateway?: GatewayConfig;
  health?: HealthCheckConfig;
  metrics?: MetricsConfig;
}

export interface ServiceDiscoveryConfig {
  enabled?: boolean;
  provider?: 'consul' | 'etcd' | 'redis' | 'memory';
  host?: string;
  port?: number;
  interval?: number;
  timeout?: number;
}

export interface GatewayConfig {
  enabled?: boolean;
  routes?: GatewayRoute[];
  rateLimit?: RateLimitConfig;
  cors?: CORSConfig;
  authentication?: AuthConfig;
}

export interface GatewayRoute {
  path: string;
  service: string;
  method?: HttpMethod | HttpMethod[];
  rewrite?: string;
  timeout?: number;
  retries?: number;
}

export interface LoadBalancerConfig {
  algorithm?: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';
  healthCheck?: HealthCheckConfig;
  sticky?: boolean;
  timeout?: number;
}

export interface HealthCheckConfig {
  enabled?: boolean;
  path?: string;
  interval?: number;
  timeout?: number;
  retries?: number;
  statusCodes?: number[];
}

export interface MetricsConfig {
  enabled?: boolean;
  provider?: 'prometheus' | 'statsd' | 'custom';
  endpoint?: string;
  interval?: number;
  labels?: Record<string, string>;
}

export interface ServerSecurityConfig {
  cors?: CORSConfig;
  helmet?: HelmetConfig;
  rateLimit?: RateLimitConfig;
  authentication?: AuthConfig;
  authorization?: AuthzConfig;
}

export interface CORSConfig {
  enabled?: boolean;
  origin?: string | string[] | RegExp | boolean;
  methods?: HttpMethod[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface HelmetConfig {
  enabled?: boolean;
  contentSecurityPolicy?: boolean | Record<string, any>;
  hsts?: boolean | Record<string, any>;
  noSniff?: boolean;
  xssFilter?: boolean;
  referrerPolicy?: string;
}

export interface RateLimitConfig {
  enabled?: boolean;
  windowMs?: number;
  max?: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  store?: 'memory' | 'redis' | 'custom';
}

export interface AuthConfig {
  enabled?: boolean;
  provider?: 'jwt' | 'oauth2' | 'custom';
  secret?: string;
  algorithm?: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
}

export interface AuthzConfig {
  enabled?: boolean;
  provider?: 'rbac' | 'acl' | 'custom';
  roles?: Role[];
  permissions?: Permission[];
}

export interface MonitoringConfig {
  enabled?: boolean;
  metrics?: MetricsConfig;
  tracing?: TracingConfig;
  logging?: LoggingConfig;
}

export interface TracingConfig {
  enabled?: boolean;
  provider?: 'jaeger' | 'zipkin' | 'custom';
  endpoint?: string;
  serviceName?: string;
  sampleRate?: number;
}

export interface LoggingConfig {
  enabled?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  format?: 'json' | 'text' | 'combined';
  destination?: 'console' | 'file' | 'custom';
  filename?: string;
  maxSize?: string;
  maxFiles?: number;
}

// Route and Middleware Types
export interface RouteConfig {
  path: string;
  method: HttpMethod | HttpMethod[];
  handler: RouteHandler;
  middleware?: MiddlewareFunction[];
  name?: string;
  description?: string;
}

export interface MiddlewareConfig {
  name: string;
  handler: MiddlewareFunction;
  order?: number;
  routes?: string[];
  exclude?: string[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type RouteHandler = (req: Request, res: Response) => Promise<void> | void;
export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;
export type ErrorHandlerFunction = (error: any, req: Request, res: Response, next: NextFunction) => Promise<void> | void;
export type NextFunction = (error?: any) => void;

// Request and Response Types
export interface Request extends EventEmitter {
  method: string;
  url: string;
  path: string;
  query: Record<string, any>;
  params: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  cookies: Record<string, string>;
  session?: any;
  user?: any;
  ip: string;
  protocol: string;
  secure: boolean;
  xhr: boolean;
  timestamp: Date;
  id: string;
}

export interface Response extends EventEmitter {
  status(code: number): Response;
  json(data: any): Response;
  send(data: any): Response;
  html(content: string): Response;
  redirect(url: string, status?: number): Response;
  cookie(name: string, value: string, options?: CookieOptions): Response;
  header(name: string, value: string): Response;
  headers(headers: Record<string, string>): Response;
  attachment(filename?: string): Response;
  download(path: string, filename?: string): Response;
  render(template: string, data?: any): Response;
  stream(readable: any): Response;
  end(): void;
  statusCode: number;
  headersSent: boolean;
}

export interface CookieOptions {
  maxAge?: number;
  signed?: boolean;
  expires?: Date;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none' | boolean;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: string;
  health: ServiceHealth;
  metadata?: Record<string, any>;
  tags?: string[];
  lastSeen: Date;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'critical';
  checks: HealthCheck[];
  lastCheck: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  timestamp: Date;
}

// Permission and Role Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  inherit?: string[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: any[];
}

// Event Types
export interface ServerEvent {
  type: ServerEventType;
  timestamp: Date;
  data: any;
  source?: string;
}

export type ServerEventType = 
  | 'server.start'
  | 'server.stop'
  | 'server.error'
  | 'request.start'
  | 'request.end'
  | 'request.error'
  | 'service.register'
  | 'service.deregister'
  | 'service.health'
  | 'cluster.worker.start'
  | 'cluster.worker.stop'
  | 'cluster.worker.error';

// Plugin Types
export interface Plugin {
  name: string;
  version: string;
  install: (server: any) => Promise<void> | void;
  uninstall?: (server: any) => Promise<void> | void;
  config?: any;
}

// Error Types
export class ServerError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
  }
}

export class ValidationError extends ServerError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ServerError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ServerError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ServerError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ServerError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}