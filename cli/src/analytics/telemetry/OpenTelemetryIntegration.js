"use strict";
/**
 * PowerScript Analytics - OpenTelemetry Integration
 * Distributed tracing and telemetry capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetryIntegration = void 0;
const Logger_1 = require("../../core/Logger");
/**
 * OpenTelemetry integration for PowerScript Analytics
 */
class OpenTelemetryIntegration {
    constructor(config) {
        this.initialized = false;
        this.logger = new Logger_1.Logger();
        this.config = config;
        this.spans = new Map();
        this.traces = new Map();
        this.logs = [];
    }
    /**
     * Initialize the telemetry integration
     */
    async initialize() {
        if (this.initialized)
            return;
        this.logger.info('Initializing OpenTelemetry Integration...');
        // In a real implementation, this would initialize OpenTelemetry SDK
        // For now, we'll use a mock implementation
        this.initialized = true;
        this.logger.info('OpenTelemetry Integration initialized successfully');
    }
    /**
     * Start a new span
     */
    startSpan(operationName, parentContext) {
        const spanId = this.generateSpanId();
        const traceId = parentContext?.traceId || this.generateTraceId();
        const span = {
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
    finishSpan(span) {
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
    setSpanTags(span, tags) {
        const storedSpan = this.spans.get(span.spanId);
        if (storedSpan) {
            storedSpan.tags = { ...storedSpan.tags, ...tags };
        }
    }
    /**
     * Set span status
     */
    setSpanStatus(span, status, error) {
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
    addSpanLog(span, level, message, metadata) {
        const storedSpan = this.spans.get(span.spanId);
        if (storedSpan) {
            storedSpan.logs.push({
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
    recordLog(level, message, metadata) {
        const logEntry = {
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
    getTrace(traceId) {
        return this.traces.get(traceId);
    }
    /**
     * Get all traces
     */
    getTraces(limit) {
        const traces = Array.from(this.traces.values());
        return limit ? traces.slice(0, limit) : traces;
    }
    /**
     * Get spans for a trace
     */
    getTraceSpans(traceId) {
        return Array.from(this.spans.values()).filter(span => span.traceId === traceId);
    }
    /**
     * Get recent logs
     */
    getLogs(limit = 100, level) {
        let filteredLogs = this.logs;
        if (level) {
            filteredLogs = this.logs.filter(log => log.level === level);
        }
        return filteredLogs.slice(-limit).reverse(); // Most recent first
    }
    /**
     * Create a tracer for automatic instrumentation
     */
    createTracer(name) {
        return {
            startSpan: (operationName, options) => {
                return this.startSpan(operationName, options?.parent);
            },
            withSpan: (span, fn) => {
                try {
                    const result = fn();
                    if (result && typeof result.then === 'function') {
                        // Handle promises
                        return result
                            .then((res) => {
                            this.finishSpan(span);
                            return res;
                        })
                            .catch((error) => {
                            this.setSpanStatus(span, 'error', error);
                            this.finishSpan(span);
                            throw error;
                        });
                    }
                    else {
                        this.finishSpan(span);
                        return result;
                    }
                }
                catch (error) {
                    this.setSpanStatus(span, 'error', error);
                    this.finishSpan(span);
                    throw error;
                }
            }
        };
    }
    /**
     * Instrument a function with automatic tracing
     */
    instrument(operationName, fn) {
        return ((...args) => {
            const span = this.startSpan(operationName);
            try {
                const result = fn(...args);
                if (result && typeof result.then === 'function') {
                    // Handle async functions
                    return result
                        .then((res) => {
                        this.finishSpan(span);
                        return res;
                    })
                        .catch((error) => {
                        this.setSpanStatus(span, 'error', error);
                        this.finishSpan(span);
                        throw error;
                    });
                }
                else {
                    this.finishSpan(span);
                    return result;
                }
            }
            catch (error) {
                this.setSpanStatus(span, 'error', error);
                this.finishSpan(span);
                throw error;
            }
        });
    }
    /**
     * Get telemetry statistics
     */
    getTelemetryStats() {
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
    exportTelemetryData(format = 'json') {
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
    async reset() {
        this.logger.info('Resetting OpenTelemetry Integration...');
        this.spans.clear();
        this.traces.clear();
        this.logs = [];
        this.initialized = false;
    }
    // === Private Methods ===
    generateTraceId() {
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    generateSpanId() {
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    updateTrace(span) {
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
        }
        else {
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
        }
        else if (trace.spans.some(s => s.status === 'timeout')) {
            trace.status = 'partial';
        }
    }
    getTopOperations(limit) {
        const operationCounts = new Map();
        for (const span of this.spans.values()) {
            const current = operationCounts.get(span.operationName) || 0;
            operationCounts.set(span.operationName, current + 1);
        }
        return Array.from(operationCounts.entries())
            .map(([operation, count]) => ({ operation, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    getSlowestOperations(limit) {
        const operationDurations = new Map();
        for (const span of this.spans.values()) {
            if (span.duration) {
                if (!operationDurations.has(span.operationName)) {
                    operationDurations.set(span.operationName, []);
                }
                operationDurations.get(span.operationName).push(span.duration);
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
    exportJaegerFormat() {
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
    exportZipkinFormat() {
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
exports.OpenTelemetryIntegration = OpenTelemetryIntegration;
