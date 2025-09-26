"use strict";
/**
 * PowerScript Patterns Module - Type Definitions
 * Comprehensive type system for design patterns and best practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
// Enhanced Logging Types
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["TRACE"] = 0] = "TRACE";
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 5] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
