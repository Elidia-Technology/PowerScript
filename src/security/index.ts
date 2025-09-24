/**
 * PowerScript Security Module
 * Main exports for security functionality
 */

export * from './types';
export * from './PowerScriptSecurity';

// Provider exports
export * from './encryption/NodeCryptoProvider';
export * from './authentication/JWTProvider';
export * from './authorization/RBACProvider';

// Convenience re-exports (the singleton will be created on first use)