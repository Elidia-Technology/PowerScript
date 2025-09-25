/**
 * PowerScript Analytics Module - Main Export
 * Comprehensive data analysis, visualization, and monitoring
 */

// Main Analytics Class
export { PowerScriptAnalytics } from './PowerScriptAnalytics';

// Core Components
export { AnalysisEngine } from './engines/AnalysisEngine';
export { ChartBuilder } from './visualization/ChartBuilder';
export { DashboardManager } from './dashboard/DashboardManager';
export { MetricsCollector } from './metrics/MetricsCollector';
export { OpenTelemetryIntegration } from './telemetry/OpenTelemetryIntegration';
export { ExportManager } from './export/ExportManager';

// Type Definitions
export * from './types';

// Convenience exports for common use cases
export const Analytics = {
    // Create analytics instance with default configuration
    create: (config?: any) => new (require('./PowerScriptAnalytics').PowerScriptAnalytics)(config),
    
    // Get singleton instance
    getInstance: (config?: any) => (require('./PowerScriptAnalytics').PowerScriptAnalytics).getInstance(config)
};

// Version information
export const version = '1.0.0';

// Feature flags
export const features = {
    realTimeAnalysis: true,
    telemetryIntegration: true,
    chartGeneration: true,
    dashboardCreation: true,
    dataExport: true,
    metricsCollection: true,
    performanceMonitoring: true
};

// Default configuration
export const defaultConfig = {
    dataRetentionDays: 30,
    enableRealTimeAnalysis: true,
    enableTelemetry: true,
    samplingRate: 1.0,
    batchSize: 1000,
    flushInterval: 10000
};