/**
 * PowerScript Logger - Comprehensive logging system
 * 
 * Provides structured logging with multiple levels, outputs, and formatting options.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
  tags?: string[];
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeContext?: boolean;
}

export interface LoggerConfig {
  level?: LogLevel;
  outputs?: LogOutput[];
  format?: 'json' | 'text' | 'structured';
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeContext?: boolean;
}

export interface LogOutput {
  write(entry: LogEntry): void | Promise<void>;
}

export class ConsoleLogOutput implements LogOutput {
  write(entry: LogEntry): void {
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

/**
 * PowerScript Logger implementation
 */
export class Logger {
  private _level: LogLevel = 'info';
  private _outputs: LogOutput[] = [new ConsoleLogOutput()];
  private _config: LoggerConfig = {};

  private static readonly LEVEL_VALUES: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  };

  constructor(config?: LoggerConfig) {
    if (config) {
      this.configure(config);
    }
  }

  /**
   * Configure the logger
   */
  public configure(config: LoggerConfig): void {
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
  public setLevel(level: LogLevel): void {
    this._level = level;
  }

  /**
   * Get the current log level
   */
  public getLevel(): LogLevel {
    return this._level;
  }

  /**
   * Add a log output
   */
  public addOutput(output: LogOutput): void {
    this._outputs.push(output);
  }

  /**
   * Remove a log output
   */
  public removeOutput(output: LogOutput): void {
    const index = this._outputs.indexOf(output);
    if (index !== -1) {
      this._outputs.splice(index, 1);
    }
  }

  /**
   * Log an error message
   */
  public error(message: string, data?: any, context?: string, tags?: string[]): void {
    this._log('error', message, data, context, tags);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, data?: any, context?: string, tags?: string[]): void {
    this._log('warn', message, data, context, tags);
  }

  /**
   * Log an info message
   */
  public info(message: string, data?: any, context?: string, tags?: string[]): void {
    this._log('info', message, data, context, tags);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, data?: any, context?: string, tags?: string[]): void {
    this._log('debug', message, data, context, tags);
  }

  /**
   * Log a trace message
   */
  public trace(message: string, data?: any, context?: string, tags?: string[]): void {
    this._log('trace', message, data, context, tags);
  }

  /**
   * Check if a log level is enabled
   */
  public isLevelEnabled(level: LogLevel): boolean {
    return Logger.LEVEL_VALUES[level] <= Logger.LEVEL_VALUES[this._level];
  }

  /**
   * Create a child logger with additional context
   */
  public child(context: string, tags?: string[]): Logger {
    return new ChildLogger(this, context, tags);
  }

  /**
   * Log with performance timing
   */
  public time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed in ${duration}ms`);
    };
  }

  /**
   * Log with memory usage
   */
  public memory(message: string, context?: string): void {
    if (typeof process !== 'undefined' && (process as any).memoryUsage) {
      const memory = (process as any).memoryUsage();
      this.debug(message, {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memory.rss / 1024 / 1024) + 'MB'
      }, context, ['memory']);
    } else {
      this.debug(message, { memory: 'unavailable' }, context, ['memory']);
    }
  }

  private _log(level: LogLevel, message: string, data?: any, context?: string, tags?: string[]): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
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
      } catch (error) {
        console.error('Logger output error:', error);
      }
    }
  }
}

/**
 * Child logger that inherits from parent but adds context/tags
 */
class ChildLogger extends Logger {
  constructor(
    private parent: Logger,
    private context: string,
    private tags?: string[]
  ) {
    super();
  }

  public getLevel(): LogLevel {
    return this.parent.getLevel();
  }

  public isLevelEnabled(level: LogLevel): boolean {
    return this.parent.isLevelEnabled(level);
  }

  public error(message: string, data?: any, context?: string, tags?: string[]): void {
    this.parent.error(message, data, context || this.context, this._mergeTags(tags));
  }

  public warn(message: string, data?: any, context?: string, tags?: string[]): void {
    this.parent.warn(message, data, context || this.context, this._mergeTags(tags));
  }

  public info(message: string, data?: any, context?: string, tags?: string[]): void {
    this.parent.info(message, data, context || this.context, this._mergeTags(tags));
  }

  public debug(message: string, data?: any, context?: string, tags?: string[]): void {
    this.parent.debug(message, data, context || this.context, this._mergeTags(tags));
  }

  public trace(message: string, data?: any, context?: string, tags?: string[]): void {
    this.parent.trace(message, data, context || this.context, this._mergeTags(tags));
  }

  private _mergeTags(tags?: string[]): string[] | undefined {
    if (!this.tags && !tags) return undefined;
    if (!this.tags) return tags;
    if (!tags) return this.tags;
    return [...this.tags, ...tags];
  }
}

// Global logger instance
export const logger = new Logger();