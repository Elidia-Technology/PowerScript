"use strict";
/**
 * PowerScript Enhanced Logger
 * Advanced logging system with multiple transports and formatters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerFactory = exports.EnhancedLogger = exports.TextFormatter = exports.JsonFormatter = exports.FileTransport = exports.ConsoleTransport = void 0;
const types_1 = require("../types");
/**
 * Console Log Transport
 */
class ConsoleTransport {
    constructor(config = {}) {
        this.config = config;
        this.config = { colors: true, ...config };
    }
    async log(entry) {
        const message = this.formatForConsole(entry);
        switch (entry.level) {
            case types_1.LogLevel.TRACE:
            case types_1.LogLevel.DEBUG:
                console.debug(message);
                break;
            case types_1.LogLevel.INFO:
                console.info(message);
                break;
            case types_1.LogLevel.WARN:
                console.warn(message);
                break;
            case types_1.LogLevel.ERROR:
            case types_1.LogLevel.FATAL:
                console.error(message);
                break;
        }
    }
    formatForConsole(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = types_1.LogLevel[entry.level].padEnd(5);
        let message = `[${timestamp}] ${level} ${entry.message}`;
        if (entry.context && Object.keys(entry.context).length > 0) {
            message += ` | ${JSON.stringify(entry.context)}`;
        }
        if (entry.error) {
            message += `\n${entry.error.stack || entry.error.message}`;
        }
        return this.config.colors ? this.colorize(message, entry.level) : message;
    }
    colorize(message, level) {
        const colors = {
            [types_1.LogLevel.TRACE]: '\x1b[90m', // Gray
            [types_1.LogLevel.DEBUG]: '\x1b[36m', // Cyan
            [types_1.LogLevel.INFO]: '\x1b[32m', // Green
            [types_1.LogLevel.WARN]: '\x1b[33m', // Yellow
            [types_1.LogLevel.ERROR]: '\x1b[31m', // Red
            [types_1.LogLevel.FATAL]: '\x1b[35m' // Magenta
        };
        return `${colors[level]}${message}\x1b[0m`;
    }
}
exports.ConsoleTransport = ConsoleTransport;
/**
 * File Log Transport
 */
class FileTransport {
    constructor(filePath, config = {}) {
        this.filePath = filePath;
        this.config = config;
        this.writeQueue = [];
        this.isWriting = false;
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            rotateDaily: false,
            ...config
        };
    }
    async log(entry) {
        this.writeQueue.push(entry);
        if (!this.isWriting) {
            await this.flushQueue();
        }
    }
    async flushQueue() {
        if (this.isWriting || this.writeQueue.length === 0)
            return;
        this.isWriting = true;
        try {
            const entries = [...this.writeQueue];
            this.writeQueue = [];
            const logText = entries
                .map(entry => this.formatForFile(entry))
                .join('\n') + '\n';
            // In a real implementation, you would use fs.appendFile
            // For this example, we'll simulate file writing
            await this.simulateFileWrite(logText);
        }
        finally {
            this.isWriting = false;
            // Process remaining queue items
            if (this.writeQueue.length > 0) {
                setTimeout(() => this.flushQueue(), 0);
            }
        }
    }
    formatForFile(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = types_1.LogLevel[entry.level];
        const logObj = {
            timestamp,
            level,
            message: entry.message,
            context: entry.context,
            error: entry.error ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack
            } : undefined
        };
        return JSON.stringify(logObj);
    }
    async simulateFileWrite(text) {
        // Simulate async file write
        return new Promise(resolve => setTimeout(resolve, 1));
    }
}
exports.FileTransport = FileTransport;
/**
 * JSON Log Formatter
 */
class JsonFormatter {
    format(entry) {
        return JSON.stringify({
            timestamp: entry.timestamp.toISOString(),
            level: types_1.LogLevel[entry.level],
            message: entry.message,
            context: entry.context,
            error: entry.error ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack
            } : undefined
        });
    }
}
exports.JsonFormatter = JsonFormatter;
/**
 * Text Log Formatter
 */
class TextFormatter {
    format(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = types_1.LogLevel[entry.level].padEnd(5);
        let message = `[${timestamp}] ${level} ${entry.message}`;
        if (entry.context) {
            const contextStr = Object.entries(entry.context)
                .map(([key, value]) => `${key}=${value}`)
                .join(' ');
            message += ` | ${contextStr}`;
        }
        if (entry.error) {
            message += `\nError: ${entry.error.message}`;
            if (entry.error.stack) {
                message += `\n${entry.error.stack}`;
            }
        }
        return message;
    }
}
exports.TextFormatter = TextFormatter;
/**
 * Enhanced Logger Implementation
 */
class EnhancedLogger {
    constructor(config = {}) {
        this.config = config;
        this.transports = [];
        this.level = types_1.LogLevel.INFO;
        this.context = {};
        this.level = config.level ?? types_1.LogLevel.INFO;
        this.context = config.context ?? {};
        if (config.transports) {
            this.transports = [...config.transports];
        }
        else {
            // Default console transport
            this.transports.push(new ConsoleTransport());
        }
    }
    trace(message, context) {
        this.log(types_1.LogLevel.TRACE, message, undefined, context);
    }
    debug(message, context) {
        this.log(types_1.LogLevel.DEBUG, message, undefined, context);
    }
    info(message, context) {
        this.log(types_1.LogLevel.INFO, message, undefined, context);
    }
    warn(message, context) {
        this.log(types_1.LogLevel.WARN, message, undefined, context);
    }
    error(message, error, context) {
        this.log(types_1.LogLevel.ERROR, message, error, context);
    }
    fatal(message, error, context) {
        this.log(types_1.LogLevel.FATAL, message, error, context);
    }
    setLevel(level) {
        this.level = level;
    }
    addTransport(transport) {
        this.transports.push(transport);
    }
    child(context) {
        return new EnhancedLogger({
            level: this.level,
            transports: this.transports,
            context: { ...this.context, ...context }
        });
    }
    /**
     * Get logger statistics
     */
    getStats() {
        return {
            level: types_1.LogLevel[this.level],
            transports: this.transports.length,
            contextKeys: Object.keys(this.context)
        };
    }
    async log(level, message, error, context) {
        // Check if message should be logged
        if (level < this.level)
            return;
        const entry = {
            level,
            message,
            timestamp: new Date(),
            context: { ...this.context, ...context },
            error,
            stack: error?.stack
        };
        // Send to all transports
        const promises = this.transports.map(transport => transport.log(entry).catch(err => console.error('Transport error:', err)));
        await Promise.all(promises);
    }
}
exports.EnhancedLogger = EnhancedLogger;
/**
 * Logger Factory
 */
class LoggerFactory {
    static createLogger(config = {}) {
        const context = config.name ? { logger: config.name, ...config.context } : config.context;
        return new EnhancedLogger({
            level: config.level,
            transports: config.transports,
            context
        });
    }
    static getDefaultLogger() {
        if (!this.defaultLogger) {
            this.defaultLogger = this.createLogger({
                name: 'PowerScript',
                level: types_1.LogLevel.INFO
            });
        }
        return this.defaultLogger;
    }
    static setDefaultLogger(logger) {
        this.defaultLogger = logger;
    }
}
exports.LoggerFactory = LoggerFactory;
LoggerFactory.defaultLogger = null;
