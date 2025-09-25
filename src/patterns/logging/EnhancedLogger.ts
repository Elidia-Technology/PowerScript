/**
 * PowerScript Enhanced Logger
 * Advanced logging system with multiple transports and formatters
 */

import { 
    IEnhancedLogger, 
    ILogEntry, 
    ILogFormatter, 
    ILogTransport, 
    LogLevel 
} from '../types';

/**
 * Console Log Transport
 */
export class ConsoleTransport implements ILogTransport {
    constructor(private config: { colors?: boolean } = {}) {
        this.config = { colors: true, ...config };
    }

    async log(entry: ILogEntry): Promise<void> {
        const message = this.formatForConsole(entry);
        
        switch (entry.level) {
            case LogLevel.TRACE:
            case LogLevel.DEBUG:
                console.debug(message);
                break;
            case LogLevel.INFO:
                console.info(message);
                break;
            case LogLevel.WARN:
                console.warn(message);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(message);
                break;
        }
    }

    private formatForConsole(entry: ILogEntry): string {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level].padEnd(5);
        
        let message = `[${timestamp}] ${level} ${entry.message}`;
        
        if (entry.context && Object.keys(entry.context).length > 0) {
            message += ` | ${JSON.stringify(entry.context)}`;
        }
        
        if (entry.error) {
            message += `\n${entry.error.stack || entry.error.message}`;
        }
        
        return this.config.colors ? this.colorize(message, entry.level) : message;
    }

    private colorize(message: string, level: LogLevel): string {
        const colors = {
            [LogLevel.TRACE]: '\x1b[90m', // Gray
            [LogLevel.DEBUG]: '\x1b[36m', // Cyan
            [LogLevel.INFO]: '\x1b[32m',  // Green
            [LogLevel.WARN]: '\x1b[33m',  // Yellow
            [LogLevel.ERROR]: '\x1b[31m', // Red
            [LogLevel.FATAL]: '\x1b[35m'  // Magenta
        };
        
        return `${colors[level]}${message}\x1b[0m`;
    }
}

/**
 * File Log Transport
 */
export class FileTransport implements ILogTransport {
    private writeQueue: ILogEntry[] = [];
    private isWriting = false;

    constructor(
        private filePath: string,
        private config: {
            maxFileSize?: number;
            maxFiles?: number;
            rotateDaily?: boolean;
        } = {}
    ) {
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            rotateDaily: false,
            ...config
        };
    }

    async log(entry: ILogEntry): Promise<void> {
        this.writeQueue.push(entry);
        
        if (!this.isWriting) {
            await this.flushQueue();
        }
    }

    private async flushQueue(): Promise<void> {
        if (this.isWriting || this.writeQueue.length === 0) return;
        
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
            
        } finally {
            this.isWriting = false;
            
            // Process remaining queue items
            if (this.writeQueue.length > 0) {
                setTimeout(() => this.flushQueue(), 0);
            }
        }
    }

    private formatForFile(entry: ILogEntry): string {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level];
        
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

    private async simulateFileWrite(text: string): Promise<void> {
        // Simulate async file write
        return new Promise(resolve => setTimeout(resolve, 1));
    }
}

/**
 * JSON Log Formatter
 */
export class JsonFormatter implements ILogFormatter {
    format(entry: ILogEntry): string {
        return JSON.stringify({
            timestamp: entry.timestamp.toISOString(),
            level: LogLevel[entry.level],
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

/**
 * Text Log Formatter
 */
export class TextFormatter implements ILogFormatter {
    format(entry: ILogEntry): string {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level].padEnd(5);
        
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

/**
 * Enhanced Logger Implementation
 */
export class EnhancedLogger implements IEnhancedLogger {
    private transports: ILogTransport[] = [];
    private level: LogLevel = LogLevel.INFO;
    private context: Record<string, any> = {};

    constructor(
        private config: {
            level?: LogLevel;
            transports?: ILogTransport[];
            context?: Record<string, any>;
        } = {}
    ) {
        this.level = config.level ?? LogLevel.INFO;
        this.context = config.context ?? {};
        
        if (config.transports) {
            this.transports = [...config.transports];
        } else {
            // Default console transport
            this.transports.push(new ConsoleTransport());
        }
    }

    trace(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.TRACE, message, undefined, context);
    }

    debug(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, message, undefined, context);
    }

    info(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.INFO, message, undefined, context);
    }

    warn(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.WARN, message, undefined, context);
    }

    error(message: string, error?: Error, context?: Record<string, any>): void {
        this.log(LogLevel.ERROR, message, error, context);
    }

    fatal(message: string, error?: Error, context?: Record<string, any>): void {
        this.log(LogLevel.FATAL, message, error, context);
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    addTransport(transport: ILogTransport): void {
        this.transports.push(transport);
    }

    child(context: Record<string, any>): IEnhancedLogger {
        return new EnhancedLogger({
            level: this.level,
            transports: this.transports,
            context: { ...this.context, ...context }
        });
    }

    /**
     * Get logger statistics
     */
    getStats(): {
        level: string;
        transports: number;
        contextKeys: string[];
    } {
        return {
            level: LogLevel[this.level],
            transports: this.transports.length,
            contextKeys: Object.keys(this.context)
        };
    }

    private async log(
        level: LogLevel, 
        message: string, 
        error?: Error, 
        context?: Record<string, any>
    ): Promise<void> {
        // Check if message should be logged
        if (level < this.level) return;

        const entry: ILogEntry = {
            level,
            message,
            timestamp: new Date(),
            context: { ...this.context, ...context },
            error,
            stack: error?.stack
        };

        // Send to all transports
        const promises = this.transports.map(transport => 
            transport.log(entry).catch(err => 
                console.error('Transport error:', err)
            )
        );

        await Promise.all(promises);
    }
}

/**
 * Logger Factory
 */
export class LoggerFactory {
    private static defaultLogger: IEnhancedLogger | null = null;

    static createLogger(config: {
        name?: string;
        level?: LogLevel;
        transports?: ILogTransport[];
        context?: Record<string, any>;
    } = {}): IEnhancedLogger {
        const context = config.name ? { logger: config.name, ...config.context } : config.context;
        
        return new EnhancedLogger({
            level: config.level,
            transports: config.transports,
            context
        });
    }

    static getDefaultLogger(): IEnhancedLogger {
        if (!this.defaultLogger) {
            this.defaultLogger = this.createLogger({
                name: 'PowerScript',
                level: LogLevel.INFO
            });
        }
        return this.defaultLogger;
    }

    static setDefaultLogger(logger: IEnhancedLogger): void {
        this.defaultLogger = logger;
    }
}