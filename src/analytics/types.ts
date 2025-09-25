/**
 * PowerScript Analytics & Telemetry Module - Type Definitions
 * Comprehensive types for data analysis, visualization, and monitoring
 */

export interface DataPoint {
    timestamp: Date;
    value: number;
    label?: string;
    metadata?: Record<string, any>;
}

export interface Dataset {
    name: string;
    data: DataPoint[];
    type: 'timeseries' | 'categorical' | 'numerical' | 'geospatial';
    metadata?: Record<string, any>;
}

export interface StatisticalSummary {
    count: number;
    sum: number;
    mean: number;
    median: number;
    mode: number[];
    min: number;
    max: number;
    range: number;
    variance: number;
    standardDeviation: number;
    percentiles: Record<number, number>;
}

export interface CorrelationMatrix {
    variables: string[];
    matrix: number[][];
    method: 'pearson' | 'spearman' | 'kendall';
}

export interface RegressionResult {
    coefficients: number[];
    intercept: number;
    rSquared: number;
    adjustedRSquared: number;
    pValues: number[];
    standardErrors: number[];
    predictions?: number[];
}

// Chart and Visualization Types
export type ChartType = 'line' | 'bar' | 'scatter' | 'pie' | 'histogram' | 'heatmap' | 'box' | 'area';

export interface ChartOptions {
    title?: string;
    width?: number;
    height?: number;
    backgroundColor?: string;
    showLegend?: boolean;
    showGrid?: boolean;
    colors?: string[];
    animation?: boolean;
    responsive?: boolean;
}

export interface ChartAxis {
    label?: string;
    min?: number;
    max?: number;
    type?: 'linear' | 'logarithmic' | 'datetime' | 'category';
    showTicks?: boolean;
    showLabels?: boolean;
}

export interface ChartSeries {
    name: string;
    data: Array<{ x: any; y: any; label?: string }>;
    type?: ChartType;
    color?: string;
    lineWidth?: number;
    markerSize?: number;
}

export interface ChartConfig {
    type: ChartType;
    series: ChartSeries[];
    xAxis?: ChartAxis;
    yAxis?: ChartAxis;
    options?: ChartOptions;
}

// Dashboard Types
export interface Widget {
    id: string;
    type: 'chart' | 'metric' | 'table' | 'text' | 'image';
    title?: string;
    position: { x: number; y: number; width: number; height: number };
    config: any;
    refreshInterval?: number;
}

export interface DashboardLayout {
    id: string;
    name: string;
    description?: string;
    widgets: Widget[];
    columns: number;
    rowHeight?: number;
    margin?: number;
    theme?: 'light' | 'dark' | 'auto';
}

// Metrics and Monitoring Types
export interface Metric {
    name: string;
    value: number;
    unit?: string;
    timestamp: Date;
    labels?: Record<string, string>;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface MetricHistory {
    metric: string;
    values: Array<{ timestamp: Date; value: number }>;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    interval?: string;
}

export interface Alert {
    id: string;
    name: string;
    metric: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    threshold: number;
    status: 'active' | 'resolved' | 'silenced';
    createdAt: Date;
    resolvedAt?: Date;
    description?: string;
}

// Telemetry and Tracing Types
export interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    tags?: Record<string, any>;
    logs?: Array<{ timestamp: Date; message: string; level: string }>;
    status: 'success' | 'error' | 'timeout' | 'cancelled';
}

export interface Trace {
    traceId: string;
    spans: Span[];
    duration: number;
    startTime: Date;
    endTime: Date;
    serviceName: string;
    status: 'success' | 'error' | 'partial';
}

export interface LogEntry {
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    service?: string;
    traceId?: string;
    spanId?: string;
    metadata?: Record<string, any>;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
    cpu: {
        usage: number;
        loadAverage: number[];
        processes: number;
    };
    memory: {
        used: number;
        available: number;
        total: number;
        heapUsed?: number;
        heapTotal?: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
    };
    disk: {
        read: number;
        write: number;
        usage: number;
        available: number;
    };
}

export interface AsyncOperationMetrics {
    operationType: string;
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    errorRate: number;
    throughput: number;
}

// Export Types
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf' | 'png' | 'svg' | 'html';

export interface ExportOptions {
    format: ExportFormat;
    filename?: string;
    compression?: boolean;
    includeMetadata?: boolean;
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
}

export interface ExportResult {
    success: boolean;
    filename: string;
    size: number;
    format: ExportFormat;
    generatedAt: Date;
    error?: string;
}

// Analysis Engine Configuration
export interface AnalysisConfig {
    samplingRate?: number;
    windowSize?: number;
    aggregationInterval?: string;
    retentionPeriod?: string;
    enableRealTime?: boolean;
    enableHistorical?: boolean;
}

// Main Analytics Configuration
export interface AnalyticsConfig {
    dataRetentionDays: number;
    enableRealTimeAnalysis: boolean;
    enableTelemetry: boolean;
    samplingRate: number;
    batchSize: number;
    flushInterval: number;
    exportPath?: string;
    telemetryEndpoint?: string;
    metricsEndpoint?: string;
}

// Event Types for Analytics
export interface AnalyticsEvent {
    type: 'data_updated' | 'analysis_complete' | 'export_complete' | 'alert_triggered' | 'error_occurred';
    timestamp: Date;
    data: any;
    metadata?: Record<string, any>;
}

// Callback Types
export type AnalyticsEventCallback = (event: AnalyticsEvent) => void;
export type DataProcessor = (dataset: Dataset) => Dataset;
export type MetricCalculator = (data: DataPoint[]) => number;

// Provider Interfaces (for extensibility)
export interface AnalyticsProvider {
    name: string;
    version: string;
    initialize(config: any): Promise<void>;
    processData(dataset: Dataset): Promise<Dataset>;
    generateInsights(dataset: Dataset): Promise<any>;
    dispose(): Promise<void>;
}

export interface VisualizationProvider {
    name: string;
    supportedChartTypes: ChartType[];
    renderChart(config: ChartConfig): Promise<string | Buffer>;
    exportChart(config: ChartConfig, format: ExportFormat): Promise<Buffer>;
}

export interface TelemetryProvider {
    name: string;
    startSpan(operationName: string, parentContext?: any): Span;
    finishSpan(span: Span): void;
    recordMetric(metric: Metric): void;
    flush(): Promise<void>;
}