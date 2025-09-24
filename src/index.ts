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
export * from './compiler';

// AI Module
export * from './ai';

// ML Module
export * from './ml';

// Global PowerScript namespace
import { PowerScriptCore } from './core/PowerScriptCore';
import { PowerScriptCompiler } from './compiler/PowerScriptCompiler';
import { PowerScriptAI } from './ai/PowerScriptAI';
import { PowerScriptML } from './ml/PowerScriptML';

/**
 * Main PowerScript class that provides unified access to all modules
 */
export class PowerScript {
  private static _instance: PowerScript;
  private _core: PowerScriptCore;
  private _compiler?: PowerScriptCompiler;
  private _ai?: PowerScriptAI;
  private _ml?: PowerScriptML;

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