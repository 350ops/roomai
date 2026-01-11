/**
 * Structured Logging Utility
 *
 * Replaces console.log with structured logging that can be:
 * - Filtered by log level (debug, info, warn, error)
 * - Disabled in production builds
 * - Integrated with error tracking services (Sentry, etc.)
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableInProduction: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private isProduction: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';

    this.config = {
      minLevel: this.isProduction ? LogLevel.WARN : LogLevel.DEBUG,
      enableInProduction: false,
      prefix: '',
      ...config,
    };
  }

  /**
   * Check if logging is enabled for the given level
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction && !this.config.enableInProduction) {
      // In production, only log warnings and errors unless explicitly enabled
      return level >= LogLevel.WARN;
    }
    return level >= this.config.minLevel;
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} ${prefix}${ctx} [${level}] ${message}`;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formatted = this.formatMessage('DEBUG', message, context);
    console.log(formatted, data || '');
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formatted = this.formatMessage('INFO', message, context);
    console.log(formatted, data || '');
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formatted = this.formatMessage('WARN', message, context);
    console.warn(formatted, data || '');
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, error?: Error | any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formatted = this.formatMessage('ERROR', message, context);
    console.error(formatted, error || '');

    // In production, send to error tracking service
    if (this.isProduction) {
      this.reportError(message, context, error);
    }
  }

  /**
   * Report error to tracking service (Sentry, etc.)
   * TODO: Integrate with Sentry or similar service
   */
  private reportError(message: string, context?: string, error?: Error | any): void {
    // Placeholder for error reporting integration
    // Example Sentry integration:
    // if (Sentry) {
    //   Sentry.captureException(error, {
    //     tags: { context },
    //     extra: { message }
    //   });
    // }
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/**
 * Context-specific logger
 * Automatically adds context to all log messages
 */
class ContextLogger {
  constructor(private parent: Logger, private context: string) {}

  debug(message: string, data?: any): void {
    this.parent.debug(message, this.context, data);
  }

  info(message: string, data?: any): void {
    this.parent.info(message, this.context, data);
  }

  warn(message: string, data?: any): void {
    this.parent.warn(message, this.context, data);
  }

  error(message: string, error?: Error | any): void {
    this.parent.error(message, this.context, error);
  }
}

// Global logger instance
export const logger = new Logger({ prefix: 'BiancoAI' });

// Convenience exports for common contexts
export const authLogger = logger.child('Auth');
export const apiLogger = logger.child('API');
export const storageLogger = logger.child('Storage');
export const uiLogger = logger.child('UI');

// Default export
export default logger;
