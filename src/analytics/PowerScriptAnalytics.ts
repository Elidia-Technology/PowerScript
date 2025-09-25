/**
 * PowerScript Analytics & Telemetry Module - Main Class
 * Comprehensive data analysis, visualization, and monitoring capabilities
 */

import { EventDispatcher, Event } from '../core/EventDispatcher';
import { Logger } from '../core/Logger';
import { AnalysisEngine } from './engines/AnalysisEngine';
import { ChartBuilder } from './visualization/ChartBuilder';
import { DashboardManager } from './dashboard/DashboardManager';
import { MetricsCollector } from './metrics/MetricsCollector';
import { OpenTelemetryIntegration } from './telemetry/OpenTelemetryIntegration';
import { ExportManager } from './export/ExportManager';
import {
    AnalyticsConfig,
    Dataset,
    ChartConfig,
    DashboardLayout,
    Metric,
    Alert,
    ExportOptions,
    ExportResult,
    AnalyticsEvent,
    AnalyticsEventCallback,
    StatisticalSummary,
    PerformanceMetrics,
    AnalyticsProvider
} from './types';

/**
 * Main PowerScript Analytics class providing comprehensive analytics capabilities
 */
export class PowerScriptAnalytics extends EventDispatcher {
    private static instance: PowerScriptAnalytics | null = null;
    private logger: Logger;
    private config: AnalyticsConfig;
    private analysisEngine: AnalysisEngine;
    private chartBuilder: ChartBuilder;
    private dashboardManager: DashboardManager;
    private metricsCollector: MetricsCollector;
    private telemetryIntegration: OpenTelemetryIntegration;
    private exportManager: ExportManager;
    private datasets: Map<string, Dataset>;
    private providers: Map<string, AnalyticsProvider>;
    private eventCallbacks: Map<string, AnalyticsEventCallback[]>;
    private initialized: boolean = false;
    private performanceInterval: NodeJS.Timeout | null = null;

    constructor(config?: Partial<AnalyticsConfig>) {
        super();
        this.logger = new Logger();
        this.config = this.mergeConfig(config);
        this.datasets = new Map();
        this.providers = new Map();
        this.eventCallbacks = new Map();

        // Initialize subsystems
        this.analysisEngine = new AnalysisEngine(this.config);
        this.chartBuilder = new ChartBuilder();
        this.dashboardManager = new DashboardManager();
        this.metricsCollector = new MetricsCollector(this.config);
        this.telemetryIntegration = new OpenTelemetryIntegration(this.config);
        this.exportManager = new ExportManager(this.config);

        this.logger.info('PowerScript Analytics initialized');
    }

    /**
     * Get singleton instance
     */
    public static getInstance(config?: Partial<AnalyticsConfig>): PowerScriptAnalytics {
        if (!PowerScriptAnalytics.instance) {
            PowerScriptAnalytics.instance = new PowerScriptAnalytics(config);
        }
        return PowerScriptAnalytics.instance;
    }

    /**
     * Initialize the analytics system
     */
    public async initialize(): Promise<void> {
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
        } catch (error) {
            this.logger.error('Failed to initialize analytics system:', error);
            throw error;
        }
    }

    // === Data Management ===

    /**
     * Add or update a dataset
     */
    public addDataset(name: string, dataset: Dataset): void {
        this.datasets.set(name, dataset);
        this.emitEvent('data_updated', { dataset: name, size: dataset.data.length });
        this.logger.info(`Dataset '${name}' added with ${dataset.data.length} data points`);
    }

    /**
     * Get a dataset by name
     */
    public getDataset(name: string): Dataset | undefined {
        return this.datasets.get(name);
    }

    /**
     * Remove a dataset
     */
    public removeDataset(name: string): boolean {
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
    public listDatasets(): string[] {
        return Array.from(this.datasets.keys());
    }

    // === Analysis Operations ===

    /**
     * Perform statistical analysis on a dataset
     */
    public async analyzeDataset(datasetName: string): Promise<StatisticalSummary> {
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
    public async calculateCorrelation(dataset1Name: string, dataset2Name: string): Promise<number> {
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
    public async performRegression(independentVar: string, dependentVar: string): Promise<any> {
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
    public async createChart(config: ChartConfig): Promise<string> {
        return await this.chartBuilder.createChart(config);
    }

    /**
     * Create multiple charts from datasets
     */
    public async createMultiChart(configs: ChartConfig[]): Promise<string[]> {
        return await Promise.all(configs.map(config => this.chartBuilder.createChart(config)));
    }

    // === Dashboard Management ===

    /**
     * Create a new dashboard
     */
    public async createDashboard(layout: DashboardLayout): Promise<string> {
        return await this.dashboardManager.createDashboard(layout);
    }

    /**
     * Update an existing dashboard
     */
    public async updateDashboard(dashboardId: string, layout: Partial<DashboardLayout>): Promise<void> {
        await this.dashboardManager.updateDashboard(dashboardId, layout);
    }

    /**
     * Get dashboard by ID
     */
    public getDashboard(dashboardId: string): DashboardLayout | undefined {
        return this.dashboardManager.getDashboard(dashboardId);
    }

    /**
     * List all dashboards
     */
    public listDashboards(): DashboardLayout[] {
        return this.dashboardManager.listDashboards();
    }

    // === Metrics and Monitoring ===

    /**
     * Record a custom metric
     */
    public recordMetric(metric: Metric): void {
        this.metricsCollector.recordMetric(metric);
    }

    /**
     * Get metric history
     */
    public getMetricHistory(metricName: string, timeRange?: { start: Date; end: Date }): any {
        return this.metricsCollector.getMetricHistory(metricName, timeRange);
    }

    /**
     * Create an alert for a metric
     */
    public createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'status'>): string {
        return this.metricsCollector.createAlert(alert);
    }

    /**
     * Get current performance metrics
     */
    public getCurrentPerformanceMetrics(): PerformanceMetrics {
        return this.metricsCollector.getCurrentPerformanceMetrics();
    }

    // === Telemetry ===

    /**
     * Start a new trace span
     */
    public startSpan(operationName: string, parentContext?: any): any {
        return this.telemetryIntegration.startSpan(operationName, parentContext);
    }

    /**
     * Finish a trace span
     */
    public finishSpan(span: any): void {
        this.telemetryIntegration.finishSpan(span);
    }

    /**
     * Record a log entry with trace context
     */
    public recordLog(level: 'debug' | 'info' | 'warn' | 'error' | 'fatal', message: string, metadata?: Record<string, any>): void {
        this.telemetryIntegration.recordLog(level, message, metadata);
    }

    // === Export Functionality ===

    /**
     * Export dataset to various formats
     */
    public async exportDataset(datasetName: string, options: ExportOptions): Promise<ExportResult> {
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
    public async exportChart(config: ChartConfig, options: ExportOptions): Promise<ExportResult> {
        const result = await this.exportManager.exportChart(config, options);
        this.emitEvent('export_complete', { type: 'chart', result });
        return result;
    }

    /**
     * Export dashboard to various formats
     */
    public async exportDashboard(dashboardId: string, options: ExportOptions): Promise<ExportResult> {
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
    public registerProvider(provider: AnalyticsProvider): void {
        this.providers.set(provider.name, provider);
        this.logger.info(`Analytics provider '${provider.name}' registered`);
    }

    /**
     * Get a registered provider
     */
    public getProvider(name: string): AnalyticsProvider | undefined {
        return this.providers.get(name);
    }

    // === Event Management ===

    /**
     * Subscribe to analytics events
     */
    public on(eventType: string, callback: AnalyticsEventCallback): void {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }
        this.eventCallbacks.get(eventType)!.push(callback);
    }

    /**
     * Unsubscribe from analytics events
     */
    public off(eventType: string, callback: AnalyticsEventCallback): void {
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
    public getSystemStatus(): any {
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
    public async reset(): Promise<void> {
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
    public async dispose(): Promise<void> {
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

    private mergeConfig(userConfig?: Partial<AnalyticsConfig>): AnalyticsConfig {
        const defaultConfig: AnalyticsConfig = {
            dataRetentionDays: 30,
            enableRealTimeAnalysis: true,
            enableTelemetry: true,
            samplingRate: 1.0,
            batchSize: 1000,
            flushInterval: 10000
        };

        return { ...defaultConfig, ...userConfig };
    }

    private emitEvent(type: string, data: any): void {
        const event: AnalyticsEvent = {
            type: type as any,
            timestamp: new Date(),
            data,
            metadata: { source: 'PowerScriptAnalytics' }
        };

        // Emit through EventDispatcher
        this.dispatchEvent(new Event(type));

        // Call registered callbacks
        const callbacks = this.eventCallbacks.get(type);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    this.logger.error(`Error in event callback for '${type}':`, error);
                }
            });
        }
    }

    private startPerformanceMonitoring(): void {
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