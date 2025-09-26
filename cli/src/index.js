"use strict";
/**
 * PowerScript - PowerScript style Node.js development with AI/ML capabilities
 *
 * Main entry point that exports all PowerScript modules and provides
 * a unified API for developers to access AS3-style classes and modern
 * Node.js features with built-in AI/ML, distributed systems, and cloud capabilities.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testFramework = exports.PowerScript = exports.RAGPresets = exports.RAGUtils = exports.createSemanticSearch = exports.createRAGSystem = exports.SemanticSearch = exports.DocumentChunker = exports.EmbeddingService = exports.MemoryVectorDatabase = exports.VectorDatabase = exports.RAGSystem = exports.Gateway = exports.ServiceDiscovery = exports.LoadBalancer = exports.Middleware = exports.Router = exports.server = exports.PowerScriptServer = exports.PowerScriptCloud = exports.TaskScheduler = exports.WorkerPool = exports.TaskQueue = exports.PowerScriptConcurrency = exports.AsyncUtils = exports.ConfigManager = exports.PowerScriptPatterns = exports.Client = exports.PowerScriptAnalytics = exports.createDatabaseProvider = exports.PowerScriptDatabase = exports.PowerScriptMultimediaProcessor = exports.PowerScriptStreaming = exports.PowerScriptVideoPlayer = exports.PowerScriptAudioPlayer = exports.createMultimediaProvider = exports.PowerScriptGraphics = exports.PowerScriptNetworking = exports.HardwareProvider = exports.GenerationProvider = exports.LocalModelProvider = exports.PowerScriptAIEnhanced = exports.PowerScriptSecurity = exports.PowerScriptML = exports.PowerScriptAI = exports.PowerScriptCompiler = void 0;
// Core AS3 Classes and Utilities
__exportStar(require("./core"), exports);
// Compiler Module
var compiler_1 = require("./compiler");
Object.defineProperty(exports, "PowerScriptCompiler", { enumerable: true, get: function () { return compiler_1.PowerScriptCompiler; } });
// AI Module
var ai_1 = require("./ai");
Object.defineProperty(exports, "PowerScriptAI", { enumerable: true, get: function () { return ai_1.PowerScriptAI; } });
// ML Module
var ml_1 = require("./ml");
Object.defineProperty(exports, "PowerScriptML", { enumerable: true, get: function () { return ml_1.PowerScriptML; } });
// Security Module
var security_1 = require("./security");
Object.defineProperty(exports, "PowerScriptSecurity", { enumerable: true, get: function () { return security_1.PowerScriptSecurity; } });
// Simple Security Module (Phase 15)
__exportStar(require("./security-simple"), exports);
// Filesystem & Storage Module (Phase 16)
__exportStar(require("./filesystem"), exports);
// Enhanced AI Module (Phase 17)
var ai_enhanced_1 = require("./ai-enhanced");
Object.defineProperty(exports, "PowerScriptAIEnhanced", { enumerable: true, get: function () { return ai_enhanced_1.PowerScriptAIEnhanced; } });
Object.defineProperty(exports, "LocalModelProvider", { enumerable: true, get: function () { return ai_enhanced_1.LocalModelProvider; } });
Object.defineProperty(exports, "GenerationProvider", { enumerable: true, get: function () { return ai_enhanced_1.GenerationProvider; } });
Object.defineProperty(exports, "HardwareProvider", { enumerable: true, get: function () { return ai_enhanced_1.HardwareProvider; } });
// Networking Module  
var networking_1 = require("./networking");
Object.defineProperty(exports, "PowerScriptNetworking", { enumerable: true, get: function () { return networking_1.PowerScriptNetworking; } });
// Graphics & Multimedia Module (Phase 15)
var multimedia_1 = require("./multimedia");
Object.defineProperty(exports, "PowerScriptGraphics", { enumerable: true, get: function () { return multimedia_1.PowerScriptGraphics; } });
Object.defineProperty(exports, "createMultimediaProvider", { enumerable: true, get: function () { return multimedia_1.createMultimediaProvider; } });
var multimedia_2 = require("./multimedia");
Object.defineProperty(exports, "PowerScriptAudioPlayer", { enumerable: true, get: function () { return multimedia_2.PowerScriptAudioPlayer; } });
Object.defineProperty(exports, "PowerScriptVideoPlayer", { enumerable: true, get: function () { return multimedia_2.PowerScriptVideoPlayer; } });
Object.defineProperty(exports, "PowerScriptStreaming", { enumerable: true, get: function () { return multimedia_2.PowerScriptStreaming; } });
Object.defineProperty(exports, "PowerScriptMultimediaProcessor", { enumerable: true, get: function () { return multimedia_2.PowerScriptMultimediaProcessor; } });
// Database Module
var database_1 = require("./database");
Object.defineProperty(exports, "PowerScriptDatabase", { enumerable: true, get: function () { return database_1.PowerScriptDatabase; } });
Object.defineProperty(exports, "createDatabaseProvider", { enumerable: true, get: function () { return database_1.createDatabaseProvider; } });
// Analytics Module
var analytics_1 = require("./analytics");
Object.defineProperty(exports, "PowerScriptAnalytics", { enumerable: true, get: function () { return analytics_1.PowerScriptAnalytics; } });
// Graphics Module
__exportStar(require("./graphics"), exports);
// Client-Side Framework (EIPS) - For browser/React/Vue/Angular development
exports.Client = require("./client");
// Patterns Module
var patterns_1 = require("./patterns");
Object.defineProperty(exports, "PowerScriptPatterns", { enumerable: true, get: function () { return patterns_1.PowerScriptPatterns; } });
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return patterns_1.ConfigManager; } });
Object.defineProperty(exports, "AsyncUtils", { enumerable: true, get: function () { return patterns_1.AsyncUtils; } });
// Concurrency Module
var concurrency_1 = require("./concurrency");
Object.defineProperty(exports, "PowerScriptConcurrency", { enumerable: true, get: function () { return concurrency_1.PowerScriptConcurrency; } });
Object.defineProperty(exports, "TaskQueue", { enumerable: true, get: function () { return concurrency_1.TaskQueue; } });
Object.defineProperty(exports, "WorkerPool", { enumerable: true, get: function () { return concurrency_1.WorkerPool; } });
Object.defineProperty(exports, "TaskScheduler", { enumerable: true, get: function () { return concurrency_1.TaskScheduler; } });
// Cloud & Deployment Module (Module 19)
var cloud_1 = require("./cloud");
Object.defineProperty(exports, "PowerScriptCloud", { enumerable: true, get: function () { return cloud_1.PowerScriptCloud; } });
// Server & Microservices Framework (Module 26)
var server_1 = require("./server");
Object.defineProperty(exports, "PowerScriptServer", { enumerable: true, get: function () { return server_1.PowerScriptServer; } });
Object.defineProperty(exports, "server", { enumerable: true, get: function () { return server_1.server; } });
Object.defineProperty(exports, "Router", { enumerable: true, get: function () { return server_1.Router; } });
Object.defineProperty(exports, "Middleware", { enumerable: true, get: function () { return server_1.Middleware; } });
Object.defineProperty(exports, "LoadBalancer", { enumerable: true, get: function () { return server_1.LoadBalancer; } });
Object.defineProperty(exports, "ServiceDiscovery", { enumerable: true, get: function () { return server_1.ServiceDiscovery; } });
Object.defineProperty(exports, "Gateway", { enumerable: true, get: function () { return server_1.Gateway; } });
// Testing & Debugging Module (Module 24)
const testing_1 = require("./testing");
Object.defineProperty(exports, "testFramework", { enumerable: true, get: function () { return testing_1.testFramework; } });
// Scaffolding & Code Generation Module (Module 25)
const scaffolding_1 = require("./scaffolding");
// AI Advanced Module (Module 21)
var ai_advanced_1 = require("./ai-advanced");
Object.defineProperty(exports, "RAGSystem", { enumerable: true, get: function () { return ai_advanced_1.RAGSystem; } });
Object.defineProperty(exports, "VectorDatabase", { enumerable: true, get: function () { return ai_advanced_1.VectorDatabase; } });
Object.defineProperty(exports, "MemoryVectorDatabase", { enumerable: true, get: function () { return ai_advanced_1.MemoryVectorDatabase; } });
Object.defineProperty(exports, "EmbeddingService", { enumerable: true, get: function () { return ai_advanced_1.EmbeddingService; } });
Object.defineProperty(exports, "DocumentChunker", { enumerable: true, get: function () { return ai_advanced_1.DocumentChunker; } });
Object.defineProperty(exports, "SemanticSearch", { enumerable: true, get: function () { return ai_advanced_1.SemanticSearch; } });
Object.defineProperty(exports, "createRAGSystem", { enumerable: true, get: function () { return ai_advanced_1.createRAGSystem; } });
Object.defineProperty(exports, "createSemanticSearch", { enumerable: true, get: function () { return ai_advanced_1.createSemanticSearch; } });
Object.defineProperty(exports, "RAGUtils", { enumerable: true, get: function () { return ai_advanced_1.RAGUtils; } });
Object.defineProperty(exports, "RAGPresets", { enumerable: true, get: function () { return ai_advanced_1.RAGPresets; } });
// Global PowerScript namespace
const PowerScriptCore_1 = require("./core/PowerScriptCore");
const PowerScriptCompiler_1 = require("./compiler/PowerScriptCompiler");
const PowerScriptAI_1 = require("./ai/PowerScriptAI");
const PowerScriptSecuritySimple_1 = require("./security-simple/PowerScriptSecuritySimple");
const PowerScriptFileSystem_1 = require("./filesystem/PowerScriptFileSystem");
const PowerScriptAIEnhanced_1 = require("./ai-enhanced/PowerScriptAIEnhanced");
const PowerScriptDatabase_1 = require("./database/PowerScriptDatabase");
const PowerScriptAnalytics_1 = require("./analytics/PowerScriptAnalytics");
const PowerScriptPatterns_1 = require("./patterns/PowerScriptPatterns");
const PowerScriptConcurrency_1 = require("./concurrency/PowerScriptConcurrency");
// Import standalone PowerScript classes for use in main class
const cloud_2 = require("./cloud");
/**
 * Main PowerScript class that provides unified access to all modules
 */
class PowerScript {
    constructor() {
        this._core = new PowerScriptCore_1.PowerScriptCore();
    }
    /**
     * Get the singleton PowerScript instance
     */
    static getInstance() {
        if (!PowerScript._instance) {
            PowerScript._instance = new PowerScript();
        }
        return PowerScript._instance;
    }
    /**
     * Initialize PowerScript with configuration
     */
    static async initialize(config) {
        const instance = PowerScript.getInstance();
        await instance._core.initialize(config);
        return instance;
    }
    /**
     * Get the core runtime instance
     */
    static get runtime() {
        return PowerScript.getInstance()._core;
    }
    /**
     * Get the compiler instance
     */
    static get compiler() {
        const instance = PowerScript.getInstance();
        if (!instance._compiler) {
            instance._compiler = new PowerScriptCompiler_1.PowerScriptCompiler();
        }
        return instance._compiler;
    }
    /**
     * Get the AI instance
     */
    static get ai() {
        const instance = PowerScript.getInstance();
        if (!instance._ai) {
            instance._ai = new PowerScriptAI_1.PowerScriptAI();
        }
        return instance._ai;
    }
    /**
     * Get the database instance
     */
    static get database() {
        const instance = PowerScript.getInstance();
        if (!instance._database) {
            instance._database = PowerScriptDatabase_1.PowerScriptDatabase.getInstance();
        }
        return instance._database;
    }
    /**
     * Get the analytics instance
     */
    static get analytics() {
        const instance = PowerScript.getInstance();
        if (!instance._analytics) {
            instance._analytics = PowerScriptAnalytics_1.PowerScriptAnalytics.getInstance();
        }
        return instance._analytics;
    }
    /**
     * Get the enhanced security instance
     */
    // Simple Security (Phase 15)
    get securitySimple() {
        if (!this._securitySimple) {
            this._securitySimple = new PowerScriptSecuritySimple_1.PowerScriptSecuritySimple();
        }
        return this._securitySimple;
    }
    // Filesystem & Storage (Phase 16)
    get filesystem() {
        if (!this._filesystem) {
            this._filesystem = new PowerScriptFileSystem_1.PowerScriptFileSystem();
        }
        return this._filesystem;
    }
    // Enhanced AI (Phase 17)
    get aiEnhanced() {
        if (!this._aiEnhanced) {
            this._aiEnhanced = new PowerScriptAIEnhanced_1.PowerScriptAIEnhanced();
        }
        return this._aiEnhanced;
    }
    /**
     * Get the patterns instance
     */
    static get patterns() {
        const instance = PowerScript.getInstance();
        if (!instance._patterns) {
            instance._patterns = new PowerScriptPatterns_1.PowerScriptPatterns();
        }
        return instance._patterns;
    }
    /**
     * Get the concurrency instance
     */
    static get concurrency() {
        const instance = PowerScript.getInstance();
        if (!instance._concurrency) {
            instance._concurrency = new PowerScriptConcurrency_1.PowerScriptConcurrency();
        }
        return instance._concurrency;
    }
    /**
     * Get the cloud instance
     */
    static get cloud() {
        const instance = PowerScript.getInstance();
        if (!instance._cloud) {
            instance._cloud = new cloud_2.PowerScriptCloud();
        }
        return instance._cloud;
    }
    /**
     * Get the testing instance
     */
    static get testing() {
        const instance = PowerScript.getInstance();
        if (!instance._testing) {
            instance._testing = new testing_1.default();
        }
        return instance._testing;
    }
    /**
     * Get the scaffolding instance
     */
    static get scaffolding() {
        const instance = PowerScript.getInstance();
        if (!instance._scaffolding) {
            instance._scaffolding = new scaffolding_1.PowerScriptScaffolding();
        }
        return instance._scaffolding;
    }
    /**
     * Get PowerScript version
     */
    static get version() {
        return '1.0.0';
    }
    /**
     * Get platform information
     */
    static get platform() {
        const instance = PowerScript.getInstance();
        return instance._core.getRuntime();
    }
}
exports.PowerScript = PowerScript;
// Default export
exports.default = PowerScript;
// Global PowerScript instance (for compatibility)
if (typeof globalThis !== 'undefined') {
    globalThis.PowerScript = PowerScript;
}
