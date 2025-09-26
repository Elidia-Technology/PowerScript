/**
 * PowerScript Server & Microservices Framework - Basic Tests
 */

import { PowerScriptServer, server, Router, Middleware, LoadBalancer, ServiceDiscovery, Gateway } from '../src/server';
import type { Request, Response, NextFunction, RouteHandler } from '../src/server/types';

describe('PowerScript Server & Microservices Framework', () => {
  describe('PowerScriptServer', () => {
    it('should create a server instance', () => {
      const app = new PowerScriptServer();
      expect(app).toBeInstanceOf(PowerScriptServer);
      expect(app.name).toBe('PowerScriptServer');
      expect(app.version).toBe('1.0.0');
    });

    it('should create server with factory function', () => {
      const app = server.create({ port: 3001 });
      expect(app).toBeInstanceOf(PowerScriptServer);
      expect(app.config.port).toBe(3001);
    });

    it('should create cluster server', () => {
      const app = PowerScriptServer.createCluster({ port: 3002 });
      expect(app).toBeInstanceOf(PowerScriptServer);
      expect(app.config.cluster?.enabled).toBe(true);
    });

    it('should create microservice', () => {
      const app = PowerScriptServer.createMicroservice({
        name: 'test-service',
        version: '1.0.0',
        port: 3003
      });
      expect(app).toBeInstanceOf(PowerScriptServer);
      expect(app.config.microservice?.name).toBe('test-service');
    });

    it('should add routes', () => {
      const app = new PowerScriptServer();
      
      const handler: RouteHandler = (req: Request, res: Response) => {
        res.json({ message: 'Hello World' });
      };

      // Check initial routes count (includes built-in middleware routes)
      const initialRoutesCount = app.routes.size;

      app.get('/test', handler);
      app.post('/api/data', handler);
      
      // Should have added 2 more routes
      expect(app.routes.size).toBe(initialRoutesCount + 2);
      expect(app.routes.get('/test')?.has('GET')).toBe(true);
      expect(app.routes.get('/api/data')?.has('POST')).toBe(true);
    });

    it('should add middleware', () => {
      const app = new PowerScriptServer();
      
      const middleware = (req: Request, res: Response, next: NextFunction) => {
        next();
      };

      app.use(middleware);
      expect(app.routes).toBeDefined();
    });

    it('should get server status', () => {
      const app = new PowerScriptServer({ port: 3004 });
      const status = app.getStatus();
      
      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('requests');
      expect(status).toHaveProperty('errors');
      expect(status.config.port).toBe(3004);
    });
  });

  describe('Router', () => {
    it('should create a router', () => {
      const router = new Router();
      expect(router).toBeInstanceOf(Router);
    });

    it('should create router with prefix', () => {
      const router = new Router('/api');
      const stats = router.getStats();
      expect(stats.prefix).toBe('/api');
    });

    it('should add routes to router', () => {
      const router = new Router();
      
      router.get('/users', (req: Request, res: Response) => {
        res.json([]);
      });
      router.post('/users', (req: Request, res: Response) => {
        res.json({ created: true });
      });
      
      const routes = router.getRoutes();
      expect(routes).toHaveLength(2);
      expect(routes[0].method).toBe('GET');
      expect(routes[1].method).toBe('POST');
    });

    it('should match routes', () => {
      const router = new Router();
      router.get('/users/:id', (req: Request, res: Response) => {
        res.json({});
      });
      
      const match = router.match('GET', '/users/123');
      expect(match).toBeTruthy();
      expect(match!.params.id).toBe('123');
    });

    it('should generate URLs for named routes', () => {
      const router = new Router();
      router.get('/users/:id', (req: Request, res: Response) => {
        res.json({});
      }).name('user.show');
      
      const url = router.url('user.show', { id: '123' });
      expect(url).toBe('/users/123');
    });
  });

  describe('Middleware', () => {
    it('should create JSON middleware', () => {
      const middleware = Middleware.json();
      expect(typeof middleware).toBe('function');
    });

    it('should create CORS middleware', () => {
      const middleware = Middleware.cors({
        origin: 'https://example.com',
        methods: ['GET', 'POST']
      });
      expect(typeof middleware).toBe('function');
    });

    it('should create rate limit middleware', () => {
      const middleware = Middleware.rateLimit({
        windowMs: 60000,
        max: 100
      });
      expect(typeof middleware).toBe('function');
    });

    it('should create helmet middleware', () => {
      const middleware = Middleware.helmet();
      expect(typeof middleware).toBe('function');
    });

    it('should get middleware stats', () => {
      const stats = Middleware.getStats();
      expect(stats).toHaveProperty('rateLimitEntries');
    });
  });

  describe('LoadBalancer', () => {
    it('should create a load balancer', () => {
      const lb = new LoadBalancer();
      expect(lb).toBeInstanceOf(LoadBalancer);
    });

    it('should add targets', () => {
      const lb = new LoadBalancer();
      
      lb.addTarget({
        id: 'server1',
        url: 'http://localhost:3001',
        weight: 1
      });

      const targets = lb.getTargets();
      expect(targets).toHaveLength(1);
      expect(targets[0].id).toBe('server1');
    });

    it('should get next target with round-robin', () => {
      const lb = new LoadBalancer({ algorithm: 'round-robin' });
      
      lb.addTarget({ id: 'server1', url: 'http://localhost:3001', weight: 1 });
      lb.addTarget({ id: 'server2', url: 'http://localhost:3002', weight: 1 });

      const target1 = lb.getNextTarget();
      const target2 = lb.getNextTarget();
      
      expect(target1?.id).toBe('server1');
      expect(target2?.id).toBe('server2');
    });

    it('should get load balancer stats', () => {
      const lb = new LoadBalancer();
      lb.addTarget({ id: 'server1', url: 'http://localhost:3001', weight: 1 });
      
      const stats = lb.getStats();
      expect(stats.totalTargets).toBe(1);
      expect(stats.healthyTargets).toBe(1);
      expect(stats.algorithm).toBe('round-robin');
    });

    it('should change algorithms', () => {
      const lb = new LoadBalancer();
      lb.setAlgorithm('least-connections');
      
      const stats = lb.getStats();
      expect(stats.algorithm).toBe('least-connections');
    });
  });

  describe('ServiceDiscovery', () => {
    it('should create service discovery', () => {
      const sd = new ServiceDiscovery();
      expect(sd).toBeInstanceOf(ServiceDiscovery);
    });

    it('should register and discover services', async () => {
      const sd = new ServiceDiscovery();
      
      await sd.register({
        id: 'service1',
        name: 'api-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http'
      });

      const services = await sd.discover('api-service');
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('service1');
    });

    it('should discover services by tag', async () => {
      const sd = new ServiceDiscovery();
      
      await sd.register({
        id: 'service1',
        name: 'api-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        tags: ['api', 'web']
      });

      const services = await sd.discoverByTag('api');
      expect(services).toHaveLength(1);
    });

    it('should get service discovery stats', () => {
      const sd = new ServiceDiscovery();
      const stats = sd.getStats();
      
      expect(stats).toHaveProperty('totalServices');
      expect(stats).toHaveProperty('healthyServices');
      expect(stats.totalServices).toBe(0);
    });

    it('should export and import registry', async () => {
      const sd = new ServiceDiscovery();
      
      await sd.register({
        id: 'service1',
        name: 'test-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http'
      });

      const exported = sd.exportRegistry();
      expect(exported.services).toHaveLength(1);
      
      const sd2 = new ServiceDiscovery();
      sd2.importRegistry(exported);
      
      const services = await sd2.getServices();
      expect(services).toHaveLength(1);
    });
  });

  describe('Gateway', () => {
    it('should create a gateway', () => {
      const gateway = new Gateway();
      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should add routes', () => {
      const gateway = new Gateway();
      
      gateway.addRoute({
        path: '/api/users',
        service: 'user-service',
        method: 'GET'
      });

      const routes = gateway.getRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe('/api/users');
    });

    it('should remove routes', () => {
      const gateway = new Gateway();
      
      gateway.addRoute({
        path: '/api/users',
        service: 'user-service',
        method: 'GET'
      });

      gateway.removeRoute('/api/users');
      const routes = gateway.getRoutes();
      expect(routes).toHaveLength(0);
    });

    it('should get gateway stats', () => {
      const gateway = new Gateway();
      const stats = gateway.getStats();
      
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('performance');
      expect(stats).toHaveProperty('routes');
      expect(stats).toHaveProperty('services');
    });

    it('should clear stats', () => {
      const gateway = new Gateway();
      gateway.clearStats();
      
      const stats = gateway.getStats();
      expect(stats.requests.total).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should create a complete microservice setup', () => {
      const app = PowerScriptServer.createMicroservice({
        name: 'test-microservice',
        version: '1.0.0',
        port: 3005
      });

      const router = new Router('/api');
      router.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok' });
      });

      const serviceDiscovery = new ServiceDiscovery();
      const loadBalancer = new LoadBalancer();
      const gateway = new Gateway();

      expect(app).toBeInstanceOf(PowerScriptServer);
      expect(router).toBeInstanceOf(Router);
      expect(serviceDiscovery).toBeInstanceOf(ServiceDiscovery);
      expect(loadBalancer).toBeInstanceOf(LoadBalancer);
      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should work with all components together', async () => {
      // Create service discovery
      const sd = new ServiceDiscovery();
      
      // Register a service
      await sd.register({
        id: 'api1',
        name: 'api-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http'
      });

      // Create load balancer
      const lb = new LoadBalancer();
      lb.addTarget({
        id: 'api1',
        url: 'http://localhost:3001',
        weight: 1
      });

      // Create gateway
      const gateway = new Gateway();
      gateway.setServiceDiscovery(sd);
      gateway.setLoadBalancer(lb);
      
      gateway.addRoute({
        path: '/api/data',
        service: 'api-service'
      });

      // Verify setup
      const services = await sd.discover('api-service');
      const target = lb.getNextTarget();
      const routes = gateway.getRoutes();

      expect(services).toHaveLength(1);
      expect(target?.id).toBe('api1');
      expect(routes).toHaveLength(1);
    });
  });
});