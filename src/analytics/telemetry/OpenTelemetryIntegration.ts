/**
 * PowerScript Analytics - OpenTelemetry Integration
 * Distributed tracing and telemetry capabilities
 */

import { Logger } from '../../core/Logger';
import {
    Span,
    Trace,
    LogEntry,
    AnalyticsConfig
} from '../types';

/**
 * OpenTelemetry integration for PowerScript Analytics
 */
export class OpenTelemetryIntegration {
    private logger: Logger;
    private config: AnalyticsConfig;
    private spans: Map<string, Span>;
    private traces: Map<string, Trace>;
    private logs: LogEntry[];
    private initialized: boolean = false;

    constructor(config: AnalyticsConfig) {
        this.logger = new Logger();
        this.config = config;
        this.spans = new Map();
        this.traces = new Map();
        this.logs = [];
    }

    /**
     * Initialize the telemetry integration
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        this.logger.info('Initializing OpenTelemetry Integration...');
        
        // In a real implementation, this would initialize OpenTelemetry SDK
        // For now, we'll use a mock implementation
        
        this.initialized = true;
        this.logger.info('OpenTelemetry Integration initialized successfully');
    }

    /**
     * Start a new span
     */
    public startSpan(operationName: string, parentContext?: any): Span {
        const spanId = this.generateSpanId();
        const traceId = parentContext?.traceId || this.generateTraceId();
        
        const span: Span = {
            traceId,
            spanId,
            parentSpanId: parentContext?.spanId,
            operationName,
            startTime: new Date(),
            status: 'success',
            tags: {},
            logs: []
        };

        this.spans.set(spanId, span);
        
        this.logger.debug(`Started span '${operationName}' (${spanId}) in trace ${traceId}`);
        return span;
    }

    /**
     * Finish a span
     */
    public finishSpan(span: Span): void {
        const storedSpan = this.spans.get(span.spanId);
        if (!storedSpan) {
            this.logger.warn(`Span ${span.spanId} not found`);
            return;
        }

        storedSpan.endTime = new Date();
        storedSpan.duration = storedSpan.endTime.getTime() - storedSpan.startTime.getTime();

        // Update the trace
        this.updateTrace(storedSpan);

        this.logger.debug(`Finished span '${storedSpan.operationName}' (${storedSpan.spanId}) - Duration: ${storedSpan.duration}ms`);
    }

    /**
     * Add tags to a span
     */
    public setSpanTags(span: Span, tags: Record<string, any>): void {
        const storedSpan = this.spans.get(span.spanId);
        if (storedSpan) {
            storedSpan.tags = { ...storedSpan.tags, ...tags };
        }
    }

    /**
     * Set span status
     */
    public setSpanStatus(span: Span, status: Span['status'], error?: Error): void {
        const storedSpan = this.spans.get(span.spanId);
        if (storedSpan) {
            storedSpan.status = status;
            if (error) {
                this.addSpanLog(span, 'error', error.message, { error: error.name, stack: error.stack });
            }
        }
    }

    /**
     * Add log to span
     */
    public addSpanLog(span: Span, level: string, message: string, metadata?: Record<string, any>): void {
        const storedSpan = this.spans.get(span.spanId);
        if (storedSpan) {
            storedSpan.logs!.push({
                timestamp: new Date(),
                message,
                level,
                ...metadata
            });
        }
    }

    /**
     * Record a log entry with trace context
     */
    public recordLog(level: LogEntry['level'], message: string, metadata?: Record<string, any>): void {
        const logEntry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            metadata
        };

        this.logs.push(logEntry);

        // Maintain log retention
        if (this.logs.length > 10000) {
            this.logs.splice(0, 1000); // Remove oldest 1000 entries
        }

        this.logger.debug(`Recorded log entry: [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Get trace by ID
     */
    public getTrace(traceId: string): Trace | undefined {
        return this.traces.get(traceId);
    }

    /**
     * Get all traces
     */
    public getTraces(limit?: number): Trace[] {
        const traces = Array.from(this.traces.values());
        return limit ? traces.slice(0, limit) : traces;
    }

    /**
     * Get spans for a trace
     */
    public getTraceSpans(traceId: string): Span[] {
        return Array.from(this.spans.values()).filter(span => span.traceId === traceId);
    }

    /**
     * Get recent logs
     */
    public getLogs(limit: number = 100, level?: LogEntry['level']): LogEntry[] {
        let filteredLogs = this.logs;
        
        if (level) {
            filteredLogs = this.logs.filter(log => log.level === level);
        }

        return filteredLogs.slice(-limit).reverse(); // Most recent first
    }

    /**
     * Create a tracer for automatic instrumentation
     */
    public createTracer(name: string): any {
        return {
            startSpan: (operationName: string, options?: any) => {
                return this.startSpan(operationName, options?.parent);
            },
            
            withSpan: (span: Span, fn: () => any) => {
                try {
                    const result = fn();
                    if (result && typeof result.then === 'function') {
                        // Handle promises
                        return result
                            .then((res: any) => {
                                this.finishSpan(span);
                                return res;
                            })
                            .catch((error: Error) => {
                                this.setSpanStatus(span, 'error', error);
                                this.finishSpan(span);
                                throw error;
                            });
                    } else {
                        this.finishSpan(span);
                        return result;
                    }
                } catch (error) {
                    this.setSpanStatus(span, 'error', error as Error);
                    this.finishSpan(span);
                    throw error;
                }
            }
        };
    }

    /**
     * Instrument a function with automatic tracing
     */
    public instrument<T extends (...args: any[]) => any>(
        operationName: string,
        fn: T
    ): T {
        return ((...args: any[]) => {
            const span = this.startSpan(operationName);
            
            try {
                const result = fn(...args);
                
                if (result && typeof result.then === 'function') {
                    // Handle async functions
                    return result
                        .then((res: any) => {
                            this.finishSpan(span);
                            return res;
                        })
                        .catch((error: Error) => {
                            this.setSpanStatus(span, 'error', error);
                            this.finishSpan(span);
                            throw error;
                        });
                } else {
                    this.finishSpan(span);
                    return result;
                }
            } catch (error) {
                this.setSpanStatus(span, 'error', error as Error);
                this.finishSpan(span);
                throw error;
            }
        }) as T;
    }

    /**
     * Get telemetry statistics
     */
    public getTelemetryStats(): any {
        const traces = Array.from(this.traces.values());
        const spans = Array.from(this.spans.values());
        
        return {
            traceCount: traces.length,
            spanCount: spans.length,
            logCount: this.logs.length,
            averageTraceDuration: traces.length > 0 
                ? traces.reduce((sum, trace) => sum + trace.duration, 0) / traces.length
                : 0,
            errorRate: spans.length > 0
                ? spans.filter(span => span.status === 'error').length / spans.length
                : 0,
            topOperations: this.getTopOperations(10),
            slowestOperations: this.getSlowestOperations(10)
        };
    }

    /**
     * Export telemetry data
     */
    public exportTelemetryData(format: 'json' | 'jaeger' | 'zipkin' = 'json'): any {
        switch (format) {
            case 'json':
                return {
                    traces: Array.from(this.traces.values()),
                    spans: Array.from(this.spans.values()),
                    logs: this.logs,
                    exportedAt: new Date().toISOString()
                };
                
            case 'jaeger':
                return this.exportJaegerFormat();
                
            case 'zipkin':
                return this.exportZipkinFormat();
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Reset the telemetry integration
     */
    public async reset(): Promise<void> {
        this.logger.info('Resetting OpenTelemetry Integration...');
        
        this.spans.clear();
        this.traces.clear();
        this.logs = [];
        this.initialized = false;
    }

    // === Private Methods ===

    private generateTraceId(): string {
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    private generateSpanId(): string {
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    private updateTrace(span: Span): void {
        let trace = this.traces.get(span.traceId);
        
        if (!trace) {
            trace = {
                traceId: span.traceId,
                spans: [],
                duration: 0,
                startTime: span.startTime,
                endTime: span.endTime || span.startTime,
                serviceName: 'PowerScript',
                status: 'success'
            };
            this.traces.set(span.traceId, trace);
        }

        // Add or update span in trace
        const existingSpanIndex = trace.spans.findIndex(s => s.spanId === span.spanId);
        if (existingSpanIndex >= 0) {
            trace.spans[existingSpanIndex] = span;
        } else {
            trace.spans.push(span);
        }

        // Update trace metadata
        if (span.startTime < trace.startTime) {
            trace.startTime = span.startTime;
        }
        
        if (span.endTime && span.endTime > trace.endTime) {
            trace.endTime = span.endTime;
        }

        trace.duration = trace.endTime.getTime() - trace.startTime.getTime();

        // Update trace status
        if (trace.spans.some(s => s.status === 'error')) {
            trace.status = 'error';
        } else if (trace.spans.some(s => s.status === 'timeout')) {
            trace.status = 'partial';
        }
    }

    private getTopOperations(limit: number): Array<{ operation: string; count: number }> {
        const operationCounts = new Map<string, number>();
        
        for (const span of this.spans.values()) {
            const current = operationCounts.get(span.operationName) || 0;
            operationCounts.set(span.operationName, current + 1);
        }

        return Array.from(operationCounts.entries())
            .map(([operation, count]) => ({ operation, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    private getSlowestOperations(limit: number): Array<{ operation: string; avgDuration: number }> {
        const operationDurations = new Map<string, number[]>();
        
        for (const span of this.spans.values()) {
            if (span.duration) {
                if (!operationDurations.has(span.operationName)) {
                    operationDurations.set(span.operationName, []);
                }
                operationDurations.get(span.operationName)!.push(span.duration);
            }
        }

        return Array.from(operationDurations.entries())
            .map(([operation, durations]) => ({
                operation,
                avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length
            }))
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, limit);
    }

    private exportJaegerFormat(): any {
        // Simplified Jaeger format export
        const traces = Array.from(this.traces.values());
        
        return {
            data: traces.map(trace => ({
                traceID: trace.traceId,
                spans: trace.spans.map(span => ({
                    traceID: span.traceId,
                    spanID: span.spanId,
                    parentSpanID: span.parentSpanId,
                    operationName: span.operationName,
                    startTime: span.startTime.getTime() * 1000, // microseconds
                    duration: (span.duration || 0) * 1000, // microseconds
                    tags: Object.entries(span.tags || {}).map(([key, value]) => ({
                        key,
                        type: typeof value === 'string' ? 'string' : 'number',
                        value: String(value)
                    })),
                    logs: span.logs || [],
                    process: {
                        serviceName: 'PowerScript',
                        tags: []
                    }
                }))
            }))
        };
    }

    private exportZipkinFormat(): any {
        // Simplified Zipkin format export
        const spans = Array.from(this.spans.values());
        
        return spans.map(span => ({
            traceId: span.traceId,
            id: span.spanId,
            parentId: span.parentSpanId,
            name: span.operationName,
            timestamp: span.startTime.getTime() * 1000, // microseconds
            duration: (span.duration || 0) * 1000, // microseconds
            localEndpoint: {
                serviceName: 'PowerScript'
            },
            tags: span.tags || {}
        }));
    }
}