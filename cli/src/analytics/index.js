"use strict";
/**
 * PowerScript Analytics Module - Main Export
 * Comprehensive data analysis, visualization, and monitoring
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
exports.defaultConfig = exports.features = exports.version = exports.Analytics = exports.ExportManager = exports.OpenTelemetryIntegration = exports.MetricsCollector = exports.DashboardManager = exports.ChartBuilder = exports.AnalysisEngine = exports.PowerScriptAnalytics = void 0;
// Main Analytics Class
var PowerScriptAnalytics_1 = require("./PowerScriptAnalytics");
Object.defineProperty(exports, "PowerScriptAnalytics", { enumerable: true, get: function () { return PowerScriptAnalytics_1.PowerScriptAnalytics; } });
// Core Components
var AnalysisEngine_1 = require("./engines/AnalysisEngine");
Object.defineProperty(exports, "AnalysisEngine", { enumerable: true, get: function () { return AnalysisEngine_1.AnalysisEngine; } });
var ChartBuilder_1 = require("./visualization/ChartBuilder");
Object.defineProperty(exports, "ChartBuilder", { enumerable: true, get: function () { return ChartBuilder_1.ChartBuilder; } });
var DashboardManager_1 = require("./dashboard/DashboardManager");
Object.defineProperty(exports, "DashboardManager", { enumerable: true, get: function () { return DashboardManager_1.DashboardManager; } });
var MetricsCollector_1 = require("./metrics/MetricsCollector");
Object.defineProperty(exports, "MetricsCollector", { enumerable: true, get: function () { return MetricsCollector_1.MetricsCollector; } });
var OpenTelemetryIntegration_1 = require("./telemetry/OpenTelemetryIntegration");
Object.defineProperty(exports, "OpenTelemetryIntegration", { enumerable: true, get: function () { return OpenTelemetryIntegration_1.OpenTelemetryIntegration; } });
var ExportManager_1 = require("./export/ExportManager");
Object.defineProperty(exports, "ExportManager", { enumerable: true, get: function () { return ExportManager_1.ExportManager; } });
// Type Definitions
__exportStar(require("./types"), exports);
// Convenience exports for common use cases
exports.Analytics = {
    // Create analytics instance with default configuration
    create: (config) => new (require('./PowerScriptAnalytics').PowerScriptAnalytics)(config),
    // Get singleton instance
    getInstance: (config) => (require('./PowerScriptAnalytics').PowerScriptAnalytics).getInstance(config)
};
// Version information
exports.version = '1.0.0';
// Feature flags
exports.features = {
    realTimeAnalysis: true,
    telemetryIntegration: true,
    chartGeneration: true,
    dashboardCreation: true,
    dataExport: true,
    metricsCollection: true,
    performanceMonitoring: true
};
// Default configuration
exports.defaultConfig = {
    dataRetentionDays: 30,
    enableRealTimeAnalysis: true,
    enableTelemetry: true,
    samplingRate: 1.0,
    batchSize: 1000,
    flushInterval: 10000
};
