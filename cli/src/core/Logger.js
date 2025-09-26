"use strict";
/**
 * PowerScript Logger - Comprehensive logging system
 *
 * Provides structured logging with multiple levels, outputs, and formatting options.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.ConsoleLogOutput = void 0;
class ConsoleLogOutput {
    write(entry) {
        const timestamp = entry.includeTimestamp !== false ?
            `[${entry.timestamp.toISOString()}] ` : '';
        const level = `[${entry.level.toUpperCase()}]`;
        const context = entry.context ? ` (${entry.context})` : '';
        const tags = entry.tags?.length ? ` #${entry.tags.join(' #')}` : '';
        const message = `${timestamp}${level}${context}: ${entry.message}${tags}`;
        switch (entry.level) {
            case 'error':
                console.error(message, entry.data || '');
                break;
            case 'warn':
                console.warn(message, entry.data || '');
                break;
            case 'info':
                console.info(message, entry.data || '');
                break;
            case 'debug':
                console.debug(message, entry.data || '');
                break;
            case 'trace':
                console.trace(message, entry.data || '');
                break;
        }
    }
}
exports.ConsoleLogOutput = ConsoleLogOutput;
/**
 * PowerScript Logger implementation
 */
class Logger {
    constructor(config) {
        this._level = 'info';
        this._outputs = [new ConsoleLogOutput()];
        this._config = {};
        if (config) {
            this.configure(config);
        }
    }
    /**
     * Configure the logger
     */
    configure(config) {
        this._config = { ...this._config, ...config };
        if (config.level) {
            this._level = config.level;
        }
        if (config.outputs) {
            this._outputs = config.outputs;
        }
    }
    /**
     * Set the log level
     */
    setLevel(level) {
        this._level = level;
    }
    /**
     * Get the current log level
     */
    getLevel() {
        return this._level;
    }
    /**
     * Add a log output
     */
    addOutput(output) {
        this._outputs.push(output);
    }
    /**
     * Remove a log output
     */
    removeOutput(output) {
        const index = this._outputs.indexOf(output);
        if (index !== -1) {
            this._outputs.splice(index, 1);
        }
    }
    /**
     * Log an error message
     */
    error(message, data, context, tags) {
        this._log('error', message, data, context, tags);
    }
    /**
     * Log a warning message
     */
    warn(message, data, context, tags) {
        this._log('warn', message, data, context, tags);
    }
    /**
     * Log an info message
     */
    info(message, data, context, tags) {
        this._log('info', message, data, context, tags);
    }
    /**
     * Log a debug message
     */
    debug(message, data, context, tags) {
        this._log('debug', message, data, context, tags);
    }
    /**
     * Log a trace message
     */
    trace(message, data, context, tags) {
        this._log('trace', message, data, context, tags);
    }
    /**
     * Check if a log level is enabled
     */
    isLevelEnabled(level) {
        return Logger.LEVEL_VALUES[level] <= Logger.LEVEL_VALUES[this._level];
    }
    /**
     * Create a child logger with additional context
     */
    child(context, tags) {
        return new ChildLogger(this, context, tags);
    }
    /**
     * Log with performance timing
     */
    time(label) {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.debug(`${label} completed in ${duration}ms`);
        };
    }
    /**
     * Log with memory usage
     */
    memory(message, context) {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memory = process.memoryUsage();
            this.debug(message, {
                heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
                rss: Math.round(memory.rss / 1024 / 1024) + 'MB'
            }, context, ['memory']);
        }
        else {
            this.debug(message, { memory: 'unavailable' }, context, ['memory']);
        }
    }
    _log(level, message, data, context, tags) {
        if (!this.isLevelEnabled(level)) {
            return;
        }
        const entry = {
            timestamp: new Date(),
            level,
            message,
            data,
            context,
            tags
        };
        // Write to all outputs
        for (const output of this._outputs) {
            try {
                const result = output.write(entry);
                if (result instanceof Promise) {
                    result.catch(error => {
                        console.error('Logger output error:', error);
                    });
                }
            }
            catch (error) {
                console.error('Logger output error:', error);
            }
        }
    }
}
exports.Logger = Logger;
Logger.LEVEL_VALUES = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
};
/**
 * Child logger that inherits from parent but adds context/tags
 */
class ChildLogger extends Logger {
    constructor(parent, context, tags) {
        super();
        this.parent = parent;
        this.context = context;
        this.tags = tags;
    }
    getLevel() {
        return this.parent.getLevel();
    }
    isLevelEnabled(level) {
        return this.parent.isLevelEnabled(level);
    }
    error(message, data, context, tags) {
        this.parent.error(message, data, context || this.context, this._mergeTags(tags));
    }
    warn(message, data, context, tags) {
        this.parent.warn(message, data, context || this.context, this._mergeTags(tags));
    }
    info(message, data, context, tags) {
        this.parent.info(message, data, context || this.context, this._mergeTags(tags));
    }
    debug(message, data, context, tags) {
        this.parent.debug(message, data, context || this.context, this._mergeTags(tags));
    }
    trace(message, data, context, tags) {
        this.parent.trace(message, data, context || this.context, this._mergeTags(tags));
    }
    _mergeTags(tags) {
        if (!this.tags && !tags)
            return undefined;
        if (!this.tags)
            return tags;
        if (!tags)
            return this.tags;
        return [...this.tags, ...tags];
    }
}
// Global logger instance
exports.logger = new Logger();
