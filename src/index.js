"use strict";
/**
 * PowerScript - ActionScript 3 style Node.js development with AI/ML capabilities
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
exports.PowerScript = void 0;
// Core AS3 Classes and Utilities (currently available)
__exportStar(require("./core"), exports);
// Global PowerScript namespace
const PowerScriptCore_1 = require("./core/PowerScriptCore");
/**
 * Main PowerScript class that provides unified access to all modules
 */
class PowerScript {
    static _instance;
    _core;
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
//# sourceMappingURL=index.js.map