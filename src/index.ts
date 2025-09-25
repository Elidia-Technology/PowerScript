/**
 * PowerScript - ActionScript 3 style Node.js development with AI/ML capabilities
 * 
 * Main entry point that exports all PowerScript modules and provides
 * a unified API for developers to access AS3-style classes and modern
 * Node.js features with built-in AI/ML, distributed systems, and cloud capabilities.
 */

// Core AS3 Classes and Utilities
export * from './core';

// Compiler Module
export { PowerScriptCompiler } from './compiler';

// AI Module
export { PowerScriptAI } from './ai';

// ML Module
export { PowerScriptML } from './ml';

// Security Module
export { PowerScriptSecurity } from './security';

// Simple Security Module (Phase 15)
export * from './security-simple';

// Filesystem & Storage Module (Phase 16)
export * from './filesystem';

// Networking Module  
export { PowerScriptNetworking } from './networking';

// Database Module
export { PowerScriptDatabase, createDatabaseProvider } from './database';

// Analytics Module
export { PowerScriptAnalytics } from './analytics';

// Graphics Module
export * from './graphics';

// Patterns Module
export { 
  PowerScriptPatterns,
  ConfigManager,
  AsyncUtils
} from './patterns';

// Concurrency Module
export { 
  PowerScriptConcurrency,
  TaskQueue,
  WorkerPool,
  TaskScheduler
} from './concurrency';

// Global PowerScript namespace
import { PowerScriptCore } from './core/PowerScriptCore';
import { PowerScriptCompiler } from './compiler/PowerScriptCompiler';
import { PowerScriptAI } from './ai/PowerScriptAI';
import { PowerScriptML } from './ml/PowerScriptML';
import { PowerScriptSecurity } from './security/PowerScriptSecurity';
import { PowerScriptSecuritySimple } from './security-simple/PowerScriptSecuritySimple';
import { PowerScriptFileSystem } from './filesystem/PowerScriptFileSystem';
import { PowerScriptNetworking } from './networking/PowerScriptNetworking';
import { PowerScriptDatabase } from './database/PowerScriptDatabase';
import { PowerScriptAnalytics } from './analytics/PowerScriptAnalytics';
import { PowerScriptPatterns } from './patterns/PowerScriptPatterns';
import { PowerScriptConcurrency } from './concurrency/PowerScriptConcurrency';

/**
 * Main PowerScript class that provides unified access to all modules
 */
export class PowerScript {
  private static _instance: PowerScript;
  private _core: PowerScriptCore;
  private _compiler?: PowerScriptCompiler;
  private _ai?: PowerScriptAI;
  private _ml?: PowerScriptML;
  private _database?: PowerScriptDatabase;
  private _analytics?: PowerScriptAnalytics;
  private _security?: PowerScriptSecurity;
  // Simple Security (Phase 15)
    private _securitySimple?: PowerScriptSecuritySimple;
  // Filesystem & Storage (Phase 16)
  private _filesystem?: PowerScriptFileSystem;
  private _patterns?: PowerScriptPatterns;
  private _concurrency?: PowerScriptConcurrency;

  private constructor() {
    this._core = new PowerScriptCore();
  }

  /**
   * Get the singleton PowerScript instance
   */
  public static getInstance(): PowerScript {
    if (!PowerScript._instance) {
      PowerScript._instance = new PowerScript();
    }
    return PowerScript._instance;
  }

  /**
   * Initialize PowerScript with configuration
   */
  public static async initialize(config?: any): Promise<PowerScript> {
    const instance = PowerScript.getInstance();
    await instance._core.initialize(config);
    return instance;
  }

  /**
   * Get the core runtime instance
   */
  public static get runtime(): PowerScriptCore {
    return PowerScript.getInstance()._core;
  }

  /**
   * Get the compiler instance
   */
  public static get compiler(): PowerScriptCompiler {
    const instance = PowerScript.getInstance();
    if (!instance._compiler) {
      instance._compiler = new PowerScriptCompiler();
    }
    return instance._compiler;
  }

  /**
   * Get the AI instance
   */
  public static get ai(): PowerScriptAI {
    const instance = PowerScript.getInstance();
    if (!instance._ai) {
      instance._ai = new PowerScriptAI();
    }
    return instance._ai;
  }

  /**
   * Get the database instance
   */
  public static get database(): PowerScriptDatabase {
    const instance = PowerScript.getInstance();
    if (!instance._database) {
      instance._database = PowerScriptDatabase.getInstance();
    }
    return instance._database;
  }

  /**
   * Get the analytics instance
   */
  public static get analytics(): PowerScriptAnalytics {
    const instance = PowerScript.getInstance();
    if (!instance._analytics) {
      instance._analytics = PowerScriptAnalytics.getInstance();
    }
    return instance._analytics;
  }

  /**
   * Get the enhanced security instance
   */
  // Simple Security (Phase 15)
  public get securitySimple(): PowerScriptSecuritySimple {
    if (!this._securitySimple) {
      this._securitySimple = new PowerScriptSecuritySimple();
    }
    return this._securitySimple;
  }

  // Filesystem & Storage (Phase 16)
  public get filesystem(): PowerScriptFileSystem {
    if (!this._filesystem) {
      this._filesystem = new PowerScriptFileSystem();
    }
    return this._filesystem;
  }

  /**
   * Get the patterns instance
   */
  public static get patterns(): PowerScriptPatterns {
    const instance = PowerScript.getInstance();
    if (!instance._patterns) {
      instance._patterns = new PowerScriptPatterns();
    }
    return instance._patterns;
  }

  /**
   * Get the concurrency instance
   */
  public static get concurrency(): PowerScriptConcurrency {
    const instance = PowerScript.getInstance();
    if (!instance._concurrency) {
      instance._concurrency = new PowerScriptConcurrency();
    }
    return instance._concurrency;
  }

  /**
   * Get PowerScript version
   */
  public static get version(): string {
    return '1.0.0';
  }

  /**
   * Get platform information
   */
  public static get platform(): any {
    const instance = PowerScript.getInstance();
    return instance._core.getRuntime();
  }
}

// Default export
export default PowerScript;

// Global PowerScript instance (for compatibility)
if (typeof globalThis !== 'undefined') {
  (globalThis as any).PowerScript = PowerScript;
}