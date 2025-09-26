"use strict";
/**
 * PowerScript Analytics & Telemetry Module - Main Class
 * Comprehensive data analysis, visualization, and monitoring capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptAnalytics = void 0;
const EventDispatcher_1 = require("../core/EventDispatcher");
const Logger_1 = require("../core/Logger");
const AnalysisEngine_1 = require("./engines/AnalysisEngine");
const ChartBuilder_1 = require("./visualization/ChartBuilder");
const DashboardManager_1 = require("./dashboard/DashboardManager");
const MetricsCollector_1 = require("./metrics/MetricsCollector");
const OpenTelemetryIntegration_1 = require("./telemetry/OpenTelemetryIntegration");
const ExportManager_1 = require("./export/ExportManager");
/**
 * Main PowerScript Analytics class providing comprehensive analytics capabilities
 */
class PowerScriptAnalytics extends EventDispatcher_1.EventDispatcher {
    constructor(config) {
        super();
        this.initialized = false;
        this.performanceInterval = null;
        this.logger = new Logger_1.Logger();
        this.config = this.mergeConfig(config);
        this.datasets = new Map();
        this.providers = new Map();
        this.eventCallbacks = new Map();
        // Initialize subsystems
        this.analysisEngine = new AnalysisEngine_1.AnalysisEngine(this.config);
        this.chartBuilder = new ChartBuilder_1.ChartBuilder();
        this.dashboardManager = new DashboardManager_1.DashboardManager();
        this.metricsCollector = new MetricsCollector_1.MetricsCollector(this.config);
        this.telemetryIntegration = new OpenTelemetryIntegration_1.OpenTelemetryIntegration(this.config);
        this.exportManager = new ExportManager_1.ExportManager(this.config);
        this.logger.info('PowerScript Analytics initialized');
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        if (!PowerScriptAnalytics.instance) {
            PowerScriptAnalytics.instance = new PowerScriptAnalytics(config);
        }
        return PowerScriptAnalytics.instance;
    }
    /**
     * Initialize the analytics system
     */
    async initialize() {
        if (this.initialized) {
            this.logger.warn('Analytics system already initialized');
            return;
        }
        try {
            this.logger.info('Initializing PowerScript Analytics system...');
            // Initialize all subsystems
            await Promise.all([
                this.analysisEngine.initialize(),
                this.chartBuilder.initialize(),
                this.dashboardManager.initialize(),
                this.metricsCollector.initialize(),
                this.telemetryIntegration.initialize(),
                this.exportManager.initialize()
            ]);
            // Start performance monitoring if enabled
            if (this.config.enableRealTimeAnalysis) {
                this.startPerformanceMonitoring();
            }
            this.initialized = true;
            this.emitEvent('system_initialized', { timestamp: new Date() });
            this.logger.info('PowerScript Analytics system initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize analytics system:', error);
            throw error;
        }
    }
    // === Data Management ===
    /**
     * Add or update a dataset
     */
    addDataset(name, dataset) {
        this.datasets.set(name, dataset);
        this.emitEvent('data_updated', { dataset: name, size: dataset.data.length });
        this.logger.info(`Dataset '${name}' added with ${dataset.data.length} data points`);
    }
    /**
     * Get a dataset by name
     */
    getDataset(name) {
        return this.datasets.get(name);
    }
    /**
     * Remove a dataset
     */
    removeDataset(name) {
        const success = this.datasets.delete(name);
        if (success) {
            this.emitEvent('data_removed', { dataset: name });
            this.logger.info(`Dataset '${name}' removed`);
        }
        return success;
    }
    /**
     * List all dataset names
     */
    listDatasets() {
        return Array.from(this.datasets.keys());
    }
    // === Analysis Operations ===
    /**
     * Perform statistical analysis on a dataset
     */
    async analyzeDataset(datasetName) {
        const dataset = this.datasets.get(datasetName);
        if (!dataset) {
            throw new Error(`Dataset '${datasetName}' not found`);
        }
        const summary = await this.analysisEngine.calculateStatistics(dataset);
        this.emitEvent('analysis_complete', { dataset: datasetName, summary });
        return summary;
    }
    /**
     * Perform correlation analysis between datasets
     */
    async calculateCorrelation(dataset1Name, dataset2Name) {
        const dataset1 = this.datasets.get(dataset1Name);
        const dataset2 = this.datasets.get(dataset2Name);
        if (!dataset1 || !dataset2) {
            throw new Error('One or both datasets not found');
        }
        return await this.analysisEngine.calculateCorrelation(dataset1, dataset2);
    }
    /**
     * Perform regression analysis
     */
    async performRegression(independentVar, dependentVar) {
        const xDataset = this.datasets.get(independentVar);
        const yDataset = this.datasets.get(dependentVar);
        if (!xDataset || !yDataset) {
            throw new Error('Required datasets not found for regression');
        }
        return await this.analysisEngine.performRegression(xDataset, yDataset);
    }
    // === Visualization ===
    /**
     * Create a chart from a dataset
     */
    async createChart(config) {
        return await this.chartBuilder.createChart(config);
    }
    /**
     * Create multiple charts from datasets
     */
    async createMultiChart(configs) {
        return await Promise.all(configs.map(config => this.chartBuilder.createChart(config)));
    }
    // === Dashboard Management ===
    /**
     * Create a new dashboard
     */
    async createDashboard(layout) {
        return await this.dashboardManager.createDashboard(layout);
    }
    /**
     * Update an existing dashboard
     */
    async updateDashboard(dashboardId, layout) {
        await this.dashboardManager.updateDashboard(dashboardId, layout);
    }
    /**
     * Get dashboard by ID
     */
    getDashboard(dashboardId) {
        return this.dashboardManager.getDashboard(dashboardId);
    }
    /**
     * List all dashboards
     */
    listDashboards() {
        return this.dashboardManager.listDashboards();
    }
    // === Metrics and Monitoring ===
    /**
     * Record a custom metric
     */
    recordMetric(metric) {
        this.metricsCollector.recordMetric(metric);
    }
    /**
     * Get metric history
     */
    getMetricHistory(metricName, timeRange) {
        return this.metricsCollector.getMetricHistory(metricName, timeRange);
    }
    /**
     * Create an alert for a metric
     */
    createAlert(alert) {
        return this.metricsCollector.createAlert(alert);
    }
    /**
     * Get current performance metrics
     */
    getCurrentPerformanceMetrics() {
        return this.metricsCollector.getCurrentPerformanceMetrics();
    }
    // === Telemetry ===
    /**
     * Start a new trace span
     */
    startSpan(operationName, parentContext) {
        return this.telemetryIntegration.startSpan(operationName, parentContext);
    }
    /**
     * Finish a trace span
     */
    finishSpan(span) {
        this.telemetryIntegration.finishSpan(span);
    }
    /**
     * Record a log entry with trace context
     */
    recordLog(level, message, metadata) {
        this.telemetryIntegration.recordLog(level, message, metadata);
    }
    // === Export Functionality ===
    /**
     * Export dataset to various formats
     */
    async exportDataset(datasetName, options) {
        const dataset = this.datasets.get(datasetName);
        if (!dataset) {
            throw new Error(`Dataset '${datasetName}' not found`);
        }
        const result = await this.exportManager.exportDataset(dataset, options);
        this.emitEvent('export_complete', { dataset: datasetName, result });
        return result;
    }
    /**
     * Export chart to various formats
     */
    async exportChart(config, options) {
        const result = await this.exportManager.exportChart(config, options);
        this.emitEvent('export_complete', { type: 'chart', result });
        return result;
    }
    /**
     * Export dashboard to various formats
     */
    async exportDashboard(dashboardId, options) {
        const dashboard = this.dashboardManager.getDashboard(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }
        const result = await this.exportManager.exportDashboard(dashboard, options);
        this.emitEvent('export_complete', { dashboard: dashboardId, result });
        return result;
    }
    // === Provider Management ===
    /**
     * Register an analytics provider
     */
    registerProvider(provider) {
        this.providers.set(provider.name, provider);
        this.logger.info(`Analytics provider '${provider.name}' registered`);
    }
    /**
     * Get a registered provider
     */
    getProvider(name) {
        return this.providers.get(name);
    }
    // === Event Management ===
    /**
     * Subscribe to analytics events
     */
    on(eventType, callback) {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }
        this.eventCallbacks.get(eventType).push(callback);
    }
    /**
     * Unsubscribe from analytics events
     */
    off(eventType, callback) {
        const callbacks = this.eventCallbacks.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    // === Utility Methods ===
    /**
     * Get system status and health
     */
    getSystemStatus() {
        return {
            initialized: this.initialized,
            datasets: this.datasets.size,
            providers: this.providers.size,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            performance: this.getCurrentPerformanceMetrics(),
            version: '1.0.0'
        };
    }
    /**
     * Clear all data and reset system
     */
    async reset() {
        this.logger.info('Resetting analytics system...');
        // Stop performance monitoring
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = null;
        }
        // Clear all data
        this.datasets.clear();
        this.eventCallbacks.clear();
        // Reset all subsystems
        await Promise.all([
            this.analysisEngine.reset(),
            this.chartBuilder.reset(),
            this.dashboardManager.reset(),
            this.metricsCollector.reset(),
            this.telemetryIntegration.reset(),
            this.exportManager.reset()
        ]);
        this.initialized = false;
        this.logger.info('Analytics system reset complete');
    }
    /**
     * Dispose of the analytics system
     */
    async dispose() {
        this.logger.info('Disposing analytics system...');
        await this.reset();
        // Dispose all providers
        for (const provider of this.providers.values()) {
            await provider.dispose();
        }
        this.providers.clear();
        PowerScriptAnalytics.instance = null;
        this.logger.info('Analytics system disposed');
    }
    // === Private Methods ===
    mergeConfig(userConfig) {
        const defaultConfig = {
            dataRetentionDays: 30,
            enableRealTimeAnalysis: true,
            enableTelemetry: true,
            samplingRate: 1.0,
            batchSize: 1000,
            flushInterval: 10000
        };
        return { ...defaultConfig, ...userConfig };
    }
    emitEvent(type, data) {
        const event = {
            type: type,
            timestamp: new Date(),
            data,
            metadata: { source: 'PowerScriptAnalytics' }
        };
        // Emit through EventDispatcher
        this.dispatchEvent(new EventDispatcher_1.Event(type));
        // Call registered callbacks
        const callbacks = this.eventCallbacks.get(type);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(event);
                }
                catch (error) {
                    this.logger.error(`Error in event callback for '${type}':`, error);
                }
            });
        }
    }
    startPerformanceMonitoring() {
        this.performanceInterval = setInterval(() => {
            const metrics = this.getCurrentPerformanceMetrics();
            this.recordMetric({
                name: 'system.cpu.usage',
                value: metrics.cpu.usage,
                unit: 'percent',
                timestamp: new Date(),
                type: 'gauge'
            });
            this.recordMetric({
                name: 'system.memory.usage',
                value: metrics.memory.used / metrics.memory.total * 100,
                unit: 'percent',
                timestamp: new Date(),
                type: 'gauge'
            });
        }, 5000); // Every 5 seconds
    }
}
exports.PowerScriptAnalytics = PowerScriptAnalytics;
PowerScriptAnalytics.instance = null;
