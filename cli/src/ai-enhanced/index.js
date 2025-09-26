"use strict";
/**
 * PowerScript Enhanced AI/ML Module - Main Entry Point
 *
 * Advanced AI/ML capabilities including:
 * - Text generation, summarization, code generation
 * - Image generation, editing, style transfer
 * - Video generation & animation
 * - Audio: TTS, ASR, music generation
 * - Local model support (LLaMA, Mistral, Stable Diffusion)
 * - Hardware optimization (GPU/CUDA/ROCm/WebGPU)
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
exports.HardwareProvider = exports.GenerationProvider = exports.LocalModelProvider = exports.PowerScriptAIEnhanced = exports.default = void 0;
// Main class
var PowerScriptAIEnhanced_1 = require("./PowerScriptAIEnhanced");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return PowerScriptAIEnhanced_1.PowerScriptAIEnhanced; } });
var PowerScriptAIEnhanced_2 = require("./PowerScriptAIEnhanced");
Object.defineProperty(exports, "PowerScriptAIEnhanced", { enumerable: true, get: function () { return PowerScriptAIEnhanced_2.PowerScriptAIEnhanced; } });
// Type definitions
__exportStar(require("./types"), exports);
// Providers
var LocalModelProvider_1 = require("./providers/LocalModelProvider");
Object.defineProperty(exports, "LocalModelProvider", { enumerable: true, get: function () { return LocalModelProvider_1.LocalModelProvider; } });
var GenerationProvider_1 = require("./providers/GenerationProvider");
Object.defineProperty(exports, "GenerationProvider", { enumerable: true, get: function () { return GenerationProvider_1.GenerationProvider; } });
var HardwareProvider_1 = require("./providers/HardwareProvider");
Object.defineProperty(exports, "HardwareProvider", { enumerable: true, get: function () { return HardwareProvider_1.HardwareProvider; } });
