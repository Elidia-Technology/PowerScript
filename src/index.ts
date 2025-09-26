/**
 * PowerScript - PowerScript style Node.js development with AI/ML capabilities
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

// Enhanced AI Module (Phase 17)
export { 
  PowerScriptAIEnhanced,
  LocalModelProvider,
  GenerationProvider,
  HardwareProvider
} from './ai-enhanced';

// Networking Module  
export { PowerScriptNetworking } from './networking';

// Graphics & Multimedia Module (Phase 15)
export { PowerScriptGraphics, createMultimediaProvider } from './multimedia';
export { 
  PowerScriptAudioPlayer,
  PowerScriptVideoPlayer, 
  PowerScriptStreaming,
  PowerScriptMultimediaProcessor
} from './multimedia';

// Database Module
export { PowerScriptDatabase, createDatabaseProvider } from './database';

// Analytics Module
export { PowerScriptAnalytics } from './analytics';

// Graphics Module
export * from './graphics';

// Client-Side Framework (EIPS) - For browser/React/Vue/Angular development
export * as Client from './client';

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

// Cloud & Deployment Module (Module 19)
export { PowerScriptCloud } from './cloud';

// Server & Microservices Framework (Module 26)
export { 
  PowerScriptServer,
  server,
  Router,
  Middleware,
  LoadBalancer,
  ServiceDiscovery,
  Gateway
} from './server';

// Testing & Debugging Module (Module 24)
import PowerScriptTest, { testFramework } from './testing';

// Scaffolding & Code Generation Module (Module 25)
import { PowerScriptScaffolding } from './scaffolding';

// UI & Cross-Platform Support Module (Module 23)
import { PowerScriptUI } from './ui';

// Data Engineering Pipelines Module (Module 27)
export { 
  PowerScriptDataPipeline,
  ETLFramework,
  ETLPipeline,
  PowerScriptStreamProcessor,
  BatchProcessor,
  ConnectorFactory,
  BaseDataConnector,
  KafkaConnector,
  SparkConnector,
  FlinkConnector,
  DatabaseConnector,
  dataPipeline
} from './data-engineering';

// AI Advanced Module (Module 21)
export { 
  RAGSystem,
  VectorDatabase,
  MemoryVectorDatabase,
  EmbeddingService,
  DocumentChunker,
  SemanticSearch,
  createRAGSystem,
  createSemanticSearch,
  RAGUtils,
  RAGPresets
} from './ai-advanced';

// Global PowerScript namespace
import { PowerScriptCore } from './core/PowerScriptCore';
import { PowerScriptCompiler } from './compiler/PowerScriptCompiler';
import { PowerScriptAI } from './ai/PowerScriptAI';
import { PowerScriptML } from './ml/PowerScriptML';
import { PowerScriptSecurity } from './security/PowerScriptSecurity';
import { PowerScriptSecuritySimple } from './security-simple/PowerScriptSecuritySimple';
import { PowerScriptFileSystem } from './filesystem/PowerScriptFileSystem';
import { PowerScriptAIEnhanced } from './ai-enhanced/PowerScriptAIEnhanced';
import { PowerScriptNetworking } from './networking/PowerScriptNetworking';
import { PowerScriptDatabase } from './database/PowerScriptDatabase';
import { PowerScriptAnalytics } from './analytics/PowerScriptAnalytics';
import { PowerScriptPatterns } from './patterns/PowerScriptPatterns';
import { PowerScriptConcurrency } from './concurrency/PowerScriptConcurrency';
// Import AI-Advanced system classes
import { PowerScriptRAG } from './ai-advanced/RAG';
import { PowerScriptMultiAgent } from './ai-advanced/MultiAgent';

// Import standalone PowerScript classes for use in main class
import { PowerScriptCloud } from './cloud';
import { PowerScriptDataPipeline } from './data-engineering';

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
  // Enhanced AI (Phase 17)
  private _aiEnhanced?: PowerScriptAIEnhanced;
  private _patterns?: PowerScriptPatterns;
  private _concurrency?: PowerScriptConcurrency;
  private _cloud?: PowerScriptCloud;
  private _testing?: PowerScriptTest;
  private _scaffolding?: PowerScriptScaffolding;
  private _ui?: PowerScriptUI;
  private _dataPipeline?: PowerScriptDataPipeline;

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

  // Enhanced AI (Phase 17)
  public get aiEnhanced(): PowerScriptAIEnhanced {
    if (!this._aiEnhanced) {
      this._aiEnhanced = new PowerScriptAIEnhanced();
    }
    return this._aiEnhanced;
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
   * Get the cloud instance
   */
  public static get cloud(): PowerScriptCloud {
    const instance = PowerScript.getInstance();
    if (!instance._cloud) {
      instance._cloud = new PowerScriptCloud();
    }
    return instance._cloud;
  }

  /**
   * Get the testing instance
   */
  public static get testing(): PowerScriptTest {
    const instance = PowerScript.getInstance();
    if (!instance._testing) {
      instance._testing = new PowerScriptTest();
    }
    return instance._testing;
  }

  /**
   * Get the scaffolding instance
   */
  public static get scaffolding(): PowerScriptScaffolding {
    const instance = PowerScript.getInstance();
    if (!instance._scaffolding) {
      instance._scaffolding = new PowerScriptScaffolding();
    }
    return instance._scaffolding;
  }

  /**
   * Get the UI instance
   */
  public static get ui(): PowerScriptUI {
    const instance = PowerScript.getInstance();
    if (!instance._ui) {
      instance._ui = new PowerScriptUI();
    }
    return instance._ui;
  }

  /**
   * Get the data pipeline instance
   */
  public static get dataPipeline(): PowerScriptDataPipeline {
    const instance = PowerScript.getInstance();
    if (!instance._dataPipeline) {
      instance._dataPipeline = new PowerScriptDataPipeline();
    }
    return instance._dataPipeline;
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

// Additional exports
export { testFramework };

// Testing Framework exports
export { 
  PowerScriptTest,
  testing,
  describe,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  assertTrue,
  assertFalse,
  assertEquals,
  assertDeepEquals,
  assertThrows,
  createMock,
  captureSnapshot,
  startTimer,
  endTimer
} from './testing';

// UI & Cross-Platform Support Module (Module 23)
export {
  PowerScriptUI,
  CLIApp,
  Text,
  Box,
  List,
  ProgressBar,
  Input,
  VBox,
  HBox,
  CrossPlatform,
  Component
} from './ui';

// Global PowerScript instance (for compatibility)
if (typeof globalThis !== 'undefined') {
  (globalThis as any).PowerScript = PowerScript;
}