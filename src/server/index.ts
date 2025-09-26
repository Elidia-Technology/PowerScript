/**
 * PowerScript Server & Microservices Framework
 * Main exports for server functionality
 */

export * from './PowerScriptServer';
export * from './types';
import { PowerScriptServer } from './PowerScriptServer';

// Factory functions for easy server creation
export const server = {
  create: (config?: any) => new PowerScriptServer(config),
  createCluster: (config?: any) => PowerScriptServer.createCluster(config),
  createMicroservice: (config?: any) => PowerScriptServer.createMicroservice(config)
};

// Re-export the main class
export { PowerScriptServer };
export default PowerScriptServer;

// Convenience exports
export { Router } from './Router';
export { Middleware } from './Middleware';
export { LoadBalancer } from './LoadBalancer';
export { ServiceDiscovery } from './ServiceDiscovery';
export { Gateway } from './Gateway';