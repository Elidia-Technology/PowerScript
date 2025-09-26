"use strict";
/**
 * PowerScript Patterns Module - Entry Point
 * Best practices and design patterns for PowerScript framework
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
exports.asyncUtils = exports.ThrottleUtility = exports.DebounceUtility = exports.TimeoutUtility = exports.CircuitBreaker = exports.RetryUtility = exports.YamlConfigProvider = exports.EnvConfigProvider = exports.JsonConfigProvider = exports.ValueChangeCommand = exports.SimpleCommand = exports.SortStrategy = exports.CommandInvoker = exports.Context = exports.Factory = exports.Subject = exports.Singleton = exports.getErrorContext = exports.getErrorCode = exports.isRetryableError = exports.setGlobalErrorManager = exports.getGlobalErrorManager = exports.SecurityError = exports.ConfigurationError = exports.NetworkError = exports.ValidationError = exports.EnhancedError = exports.TextFormatter = exports.JsonFormatter = exports.FileTransport = exports.ConsoleTransport = exports.LoggerFactory = exports.LogLevel = exports.Inject = exports.Injectable = exports.setGlobalContainer = exports.getGlobalContainer = exports.resetPowerScriptPatterns = exports.getPowerScriptPatterns = exports.PowerScriptPatterns = void 0;
// Main module exports
var PowerScriptPatterns_1 = require("./PowerScriptPatterns");
Object.defineProperty(exports, "PowerScriptPatterns", { enumerable: true, get: function () { return PowerScriptPatterns_1.PowerScriptPatterns; } });
Object.defineProperty(exports, "getPowerScriptPatterns", { enumerable: true, get: function () { return PowerScriptPatterns_1.getPowerScriptPatterns; } });
Object.defineProperty(exports, "resetPowerScriptPatterns", { enumerable: true, get: function () { return PowerScriptPatterns_1.resetPowerScriptPatterns; } });
// Type definitions
__exportStar(require("./types"), exports);
// Core patterns
__exportStar(require("./core/DesignPatterns"), exports);
// Services
__exportStar(require("./di/DependencyContainer"), exports);
__exportStar(require("./logging/EnhancedLogger"), exports);
__exportStar(require("./errors/ErrorManager"), exports);
__exportStar(require("./config/ConfigManager"), exports);
__exportStar(require("./async/AsyncUtils"), exports);
// Utility exports for convenience
var PowerScriptPatterns_2 = require("./PowerScriptPatterns");
// Dependency Injection
Object.defineProperty(exports, "getGlobalContainer", { enumerable: true, get: function () { return PowerScriptPatterns_2.getGlobalContainer; } });
Object.defineProperty(exports, "setGlobalContainer", { enumerable: true, get: function () { return PowerScriptPatterns_2.setGlobalContainer; } });
Object.defineProperty(exports, "Injectable", { enumerable: true, get: function () { return PowerScriptPatterns_2.Injectable; } });
Object.defineProperty(exports, "Inject", { enumerable: true, get: function () { return PowerScriptPatterns_2.Inject; } });
// Logging
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return PowerScriptPatterns_2.LogLevel; } });
Object.defineProperty(exports, "LoggerFactory", { enumerable: true, get: function () { return PowerScriptPatterns_2.LoggerFactory; } });
Object.defineProperty(exports, "ConsoleTransport", { enumerable: true, get: function () { return PowerScriptPatterns_2.ConsoleTransport; } });
Object.defineProperty(exports, "FileTransport", { enumerable: true, get: function () { return PowerScriptPatterns_2.FileTransport; } });
Object.defineProperty(exports, "JsonFormatter", { enumerable: true, get: function () { return PowerScriptPatterns_2.JsonFormatter; } });
Object.defineProperty(exports, "TextFormatter", { enumerable: true, get: function () { return PowerScriptPatterns_2.TextFormatter; } });
// Error Management
Object.defineProperty(exports, "EnhancedError", { enumerable: true, get: function () { return PowerScriptPatterns_2.EnhancedError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return PowerScriptPatterns_2.ValidationError; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return PowerScriptPatterns_2.NetworkError; } });
Object.defineProperty(exports, "ConfigurationError", { enumerable: true, get: function () { return PowerScriptPatterns_2.ConfigurationError; } });
Object.defineProperty(exports, "SecurityError", { enumerable: true, get: function () { return PowerScriptPatterns_2.SecurityError; } });
Object.defineProperty(exports, "getGlobalErrorManager", { enumerable: true, get: function () { return PowerScriptPatterns_2.getGlobalErrorManager; } });
Object.defineProperty(exports, "setGlobalErrorManager", { enumerable: true, get: function () { return PowerScriptPatterns_2.setGlobalErrorManager; } });
Object.defineProperty(exports, "isRetryableError", { enumerable: true, get: function () { return PowerScriptPatterns_2.isRetryableError; } });
Object.defineProperty(exports, "getErrorCode", { enumerable: true, get: function () { return PowerScriptPatterns_2.getErrorCode; } });
Object.defineProperty(exports, "getErrorContext", { enumerable: true, get: function () { return PowerScriptPatterns_2.getErrorContext; } });
// Design Patterns
Object.defineProperty(exports, "Singleton", { enumerable: true, get: function () { return PowerScriptPatterns_2.Singleton; } });
Object.defineProperty(exports, "Subject", { enumerable: true, get: function () { return PowerScriptPatterns_2.Subject; } });
Object.defineProperty(exports, "Factory", { enumerable: true, get: function () { return PowerScriptPatterns_2.Factory; } });
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return PowerScriptPatterns_2.Context; } });
Object.defineProperty(exports, "CommandInvoker", { enumerable: true, get: function () { return PowerScriptPatterns_2.CommandInvoker; } });
Object.defineProperty(exports, "SortStrategy", { enumerable: true, get: function () { return PowerScriptPatterns_2.SortStrategy; } });
Object.defineProperty(exports, "SimpleCommand", { enumerable: true, get: function () { return PowerScriptPatterns_2.SimpleCommand; } });
Object.defineProperty(exports, "ValueChangeCommand", { enumerable: true, get: function () { return PowerScriptPatterns_2.ValueChangeCommand; } });
// Config Management
Object.defineProperty(exports, "JsonConfigProvider", { enumerable: true, get: function () { return PowerScriptPatterns_2.JsonConfigProvider; } });
Object.defineProperty(exports, "EnvConfigProvider", { enumerable: true, get: function () { return PowerScriptPatterns_2.EnvConfigProvider; } });
Object.defineProperty(exports, "YamlConfigProvider", { enumerable: true, get: function () { return PowerScriptPatterns_2.YamlConfigProvider; } });
// Async Utilities
Object.defineProperty(exports, "RetryUtility", { enumerable: true, get: function () { return PowerScriptPatterns_2.RetryUtility; } });
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return PowerScriptPatterns_2.CircuitBreaker; } });
Object.defineProperty(exports, "TimeoutUtility", { enumerable: true, get: function () { return PowerScriptPatterns_2.TimeoutUtility; } });
Object.defineProperty(exports, "DebounceUtility", { enumerable: true, get: function () { return PowerScriptPatterns_2.DebounceUtility; } });
Object.defineProperty(exports, "ThrottleUtility", { enumerable: true, get: function () { return PowerScriptPatterns_2.ThrottleUtility; } });
Object.defineProperty(exports, "asyncUtils", { enumerable: true, get: function () { return PowerScriptPatterns_2.asyncUtils; } });
