/**
 * Core PowerScript module - Provides ActionScript 3 style classes and utilities
 * This is the foundation that enables AS3-style development in Node.js
 */

// Event System
export * from './EventDispatcher';

// Core AS3 Classes
export * from './Timer';
export * from './Vector';
export * from './ByteArray';

// Infrastructure
export * from './Logger';
export * from './ErrorManager';
export * from './ConfigLoader';
export * from './DependencyContainer';
export * from './PowerScriptCore';

// Re-export specific types to avoid conflicts
export type { PowerScriptEventListener } from '../types';