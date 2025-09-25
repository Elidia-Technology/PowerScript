/**
 * PowerScript Analytics - Metrics Collector
 * Real-time metrics collection and monitoring
 */

import { Logger } from '../../core/Logger';
import {
    Metric,
    MetricHistory,
    Alert,
    PerformanceMetrics,
    AnalyticsConfig
} from '../types';

/**
 * Metrics collector for PowerScript Analytics
 */
export class MetricsCollector {
    private logger: Logger;
    private config: AnalyticsConfig;
    private metrics: Map<string, Metric[]>;
    private alerts: Map<string, Alert>;
    private initialized: boolean = false;
    private collectionInterval: NodeJS.Timeout | null = null;

    constructor(config: AnalyticsConfig) {
        this.logger = new Logger();
        this.config = config;
        this.metrics = new Map();
        this.alerts = new Map();
    }

    /**
     * Initialize the metrics collector
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        this.logger.info('Initializing Metrics Collector...');
        
        // Start automatic collection if enabled
        if (this.config.enableRealTimeAnalysis) {
            this.startCollection();
        }

        this.initialized = true;
        this.logger.info('Metrics Collector initialized successfully');
    }

    /**
     * Record a metric
     */
    public recordMetric(metric: Metric): void {
        const metricName = metric.name;
        
        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, []);
        }

        const metricHistory = this.metrics.get(metricName)!;
        metricHistory.push(metric);

        // Maintain retention policy
        this.enforceRetention(metricName);

        // Check alerts
        this.checkAlerts(metric);

        this.logger.debug(`Recorded metric: ${metricName} = ${metric.value}`);
    }

    /**
     * Get metric history
     */
    public getMetricHistory(metricName: string, timeRange?: { start: Date; end: Date }): MetricHistory | null {
        const metricData = this.metrics.get(metricName);
        if (!metricData || metricData.length === 0) {
            return null;
        }

        let filteredData = metricData;

        if (timeRange) {
            filteredData = metricData.filter(metric => 
                metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
            );
        }

        return {
            metric: metricName,
            values: filteredData.map(m => ({
                timestamp: m.timestamp,
                value: m.value
            }))
        };
    }

    /**
     * Get aggregated metrics
     */
    public getAggregatedMetrics(
        metricName: string,
        aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
        interval: string = '1m',
        timeRange?: { start: Date; end: Date }
    ): MetricHistory | null {
        const history = this.getMetricHistory(metricName, timeRange);
        if (!history) return null;

        const intervalMs = this.parseInterval(interval);
        const aggregatedValues = [];

        // Group values by interval
        const groups = new Map<number, number[]>();
        
        for (const point of history.values) {
            const intervalKey = Math.floor(point.timestamp.getTime() / intervalMs);
            if (!groups.has(intervalKey)) {
                groups.set(intervalKey, []);
            }
            groups.get(intervalKey)!.push(point.value);
        }

        // Calculate aggregations
        for (const [intervalKey, values] of groups.entries()) {
            let aggregatedValue: number;

            switch (aggregation) {
                case 'sum':
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                    break;
                case 'avg':
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                    break;
                case 'min':
                    aggregatedValue = Math.min(...values);
                    break;
                case 'max':
                    aggregatedValue = Math.max(...values);
                    break;
                case 'count':
                    aggregatedValue = values.length;
                    break;
                default:
                    aggregatedValue = values[0];
            }

            aggregatedValues.push({
                timestamp: new Date(intervalKey * intervalMs),
                value: aggregatedValue
            });
        }

        return {
            metric: metricName,
            values: aggregatedValues.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
            aggregation,
            interval
        };
    }

    /**
     * Create an alert
     */
    public createAlert(alertConfig: Omit<Alert, 'id' | 'createdAt' | 'status'>): string {
        const alertId = this.generateAlertId();
        
        const alert: Alert = {
            id: alertId,
            name: alertConfig.name,
            metric: alertConfig.metric,
            condition: alertConfig.condition,
            threshold: alertConfig.threshold,
            description: alertConfig.description,
            status: 'active',
            createdAt: new Date()
        };

        this.alerts.set(alertId, alert);
        this.logger.info(`Alert '${alert.name}' created for metric '${alert.metric}'`);
        
        return alertId;
    }

    /**
     * Update alert status
     */
    public updateAlertStatus(alertId: string, status: Alert['status']): void {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert '${alertId}' not found`);
        }

        alert.status = status;
        if (status === 'resolved') {
            alert.resolvedAt = new Date();
        }

        this.logger.info(`Alert '${alertId}' status updated to '${status}'`);
    }

    /**
     * Get all alerts
     */
    public getAlerts(status?: Alert['status']): Alert[] {
        const alerts = Array.from(this.alerts.values());
        
        if (status) {
            return alerts.filter(alert => alert.status === status);
        }
        
        return alerts;
    }

    /**
     * Delete alert
     */
    public deleteAlert(alertId: string): boolean {
        const success = this.alerts.delete(alertId);
        if (success) {
            this.logger.info(`Alert '${alertId}' deleted`);
        }
        return success;
    }

    /**
     * Get current performance metrics
     */
    public getCurrentPerformanceMetrics(): PerformanceMetrics {
        const process = globalThis.process || {};
        
        // CPU metrics
        const cpuUsage = this.getCPUUsage();
        const loadAverage = this.getLoadAverage();

        // Memory metrics
        const memoryUsage = process.memoryUsage ? process.memoryUsage() : {
            rss: 0,
            heapUsed: 0,
            heapTotal: 0,
            external: 0
        };

        // System memory (simplified for cross-platform compatibility)
        const totalMemory = this.getTotalSystemMemory();
        const availableMemory = totalMemory - memoryUsage.rss;

        // Network metrics (simplified)
        const networkStats = this.getNetworkStats();

        // Disk metrics (simplified)
        const diskStats = this.getDiskStats();

        return {
            cpu: {
                usage: cpuUsage,
                loadAverage,
                processes: this.getProcessCount()
            },
            memory: {
                used: memoryUsage.rss,
                available: availableMemory,
                total: totalMemory,
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal
            },
            network: networkStats,
            disk: diskStats
        };
    }

    /**
     * Get metric statistics
     */
    public getMetricStatistics(metricName: string, timeRange?: { start: Date; end: Date }): any {
        const history = this.getMetricHistory(metricName, timeRange);
        if (!history || history.values.length === 0) {
            return null;
        }

        const values = history.values.map(v => v.value);
        const sortedValues = [...values].sort((a, b) => a - b);
        const n = values.length;

        return {
            count: n,
            sum: values.reduce((sum, val) => sum + val, 0),
            min: sortedValues[0],
            max: sortedValues[n - 1],
            mean: values.reduce((sum, val) => sum + val, 0) / n,
            median: n % 2 === 0 
                ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
                : sortedValues[Math.floor(n / 2)],
            p95: this.calculatePercentile(sortedValues, 95),
            p99: this.calculatePercentile(sortedValues, 99)
        };
    }

    /**
     * List all metric names
     */
    public listMetrics(): string[] {
        return Array.from(this.metrics.keys());
    }

    /**
     * Clear metric history
     */
    public clearMetricHistory(metricName?: string): void {
        if (metricName) {
            this.metrics.delete(metricName);
            this.logger.info(`Cleared history for metric '${metricName}'`);
        } else {
            this.metrics.clear();
            this.logger.info('Cleared all metric history');
        }
    }

    /**
     * Reset the metrics collector
     */
    public async reset(): Promise<void> {
        this.logger.info('Resetting Metrics Collector...');
        
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }

        this.metrics.clear();
        this.alerts.clear();
        this.initialized = false;
    }

    // === Private Methods ===

    private startCollection(): void {
        this.collectionInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, this.config.flushInterval);
        
        this.logger.info(`Started automatic metrics collection (interval: ${this.config.flushInterval}ms)`);
    }

    private collectSystemMetrics(): void {
        const performance = this.getCurrentPerformanceMetrics();
        
        // Record system metrics
        this.recordMetric({
            name: 'system.cpu.usage',
            value: performance.cpu.usage,
            unit: 'percent',
            timestamp: new Date(),
            type: 'gauge'
        });

        this.recordMetric({
            name: 'system.memory.usage_percent',
            value: (performance.memory.used / performance.memory.total) * 100,
            unit: 'percent',
            timestamp: new Date(),
            type: 'gauge'
        });

        this.recordMetric({
            name: 'system.memory.heap_usage',
            value: performance.memory.heapUsed || 0,
            unit: 'bytes',
            timestamp: new Date(),
            type: 'gauge'
        });
    }

    private enforceRetention(metricName: string): void {
        const metricData = this.metrics.get(metricName)!;
        const retentionMs = this.config.dataRetentionDays * 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - retentionMs);

        const filteredData = metricData.filter(metric => metric.timestamp > cutoff);
        
        if (filteredData.length !== metricData.length) {
            this.metrics.set(metricName, filteredData);
            this.logger.debug(`Enforced retention policy for metric '${metricName}': removed ${metricData.length - filteredData.length} old entries`);
        }
    }

    private checkAlerts(metric: Metric): void {
        for (const alert of this.alerts.values()) {
            if (alert.metric === metric.name && alert.status === 'active') {
                const triggered = this.evaluateAlertCondition(alert, metric.value);
                
                if (triggered) {
                    this.logger.warn(`Alert triggered: ${alert.name} (${metric.name} ${alert.condition} ${alert.threshold})`);
                    // In a real implementation, this would send notifications
                }
            }
        }
    }

    private evaluateAlertCondition(alert: Alert, value: number): boolean {
        switch (alert.condition) {
            case 'greater_than':
                return value > alert.threshold;
            case 'less_than':
                return value < alert.threshold;
            case 'equals':
                return Math.abs(value - alert.threshold) < 0.0001;
            case 'not_equals':
                return Math.abs(value - alert.threshold) >= 0.0001;
            default:
                return false;
        }
    }

    private parseInterval(interval: string): number {
        const match = interval.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid interval format: ${interval}`);
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: throw new Error(`Unknown time unit: ${unit}`);
        }
    }

    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private calculatePercentile(sortedValues: number[], percentile: number): number {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;

        if (lower === upper) {
            return sortedValues[lower];
        }

        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    // System monitoring helper methods
    private getCPUUsage(): number {
        // Simplified CPU usage calculation
        // In a real implementation, this would use OS-specific APIs
        try {
            if (typeof process !== 'undefined' && process.cpuUsage) {
                const usage = process.cpuUsage();
                const total = usage.user + usage.system;
                return (total / 1000000) % 100; // Convert to percentage (simplified)
            }
        } catch (error) {
            // Fallback for environments without process.cpuUsage
        }
        
        return Math.random() * 100; // Mock data for demo
    }

    private getLoadAverage(): number[] {
        try {
            if (typeof process !== 'undefined' && process.platform !== 'win32') {
                // Load average is Unix/Linux specific
                return [0.5, 0.7, 0.8]; // Mock data
            }
        } catch (error) {
            // Handle error
        }
        
        return [0, 0, 0];
    }

    private getTotalSystemMemory(): number {
        try {
            if (typeof process !== 'undefined' && process.memoryUsage !== undefined) {
                // In a real implementation, this would get actual system memory
                return 8 * 1024 * 1024 * 1024; // 8GB mock
            }
        } catch (error) {
            // Handle error
        }
        
        return 4 * 1024 * 1024 * 1024; // 4GB fallback
    }

    private getProcessCount(): number {
        // Simplified process count
        return Math.floor(Math.random() * 100) + 50;
    }

    private getNetworkStats() {
        // Simplified network statistics
        return {
            bytesIn: Math.floor(Math.random() * 1000000),
            bytesOut: Math.floor(Math.random() * 1000000),
            packetsIn: Math.floor(Math.random() * 10000),
            packetsOut: Math.floor(Math.random() * 10000)
        };
    }

    private getDiskStats() {
        // Simplified disk statistics
        const total = 1000 * 1024 * 1024 * 1024; // 1TB
        const used = Math.floor(Math.random() * total * 0.8);
        
        return {
            read: Math.floor(Math.random() * 1000000),
            write: Math.floor(Math.random() * 1000000),
            usage: used,
            available: total - used
        };
    }
}