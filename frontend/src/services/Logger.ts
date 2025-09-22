/**
 * Centralized logging service for development and debugging
 * Only logs in development environment to prevent information leakage in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class LoggerService {
  private isDevelopment = import.meta.env.DEV;
  private logPrefix = '[Source]';

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors
    if (!this.isDevelopment && level !== 'error') {
      return false;
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.logPrefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message);
    if (context) {
      console.log(formattedMessage, context);
    } else {
      console.log(formattedMessage);
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message);
    if (context) {
      console.info(formattedMessage, context);
    } else {
      console.info(formattedMessage);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message);
    if (context) {
      console.warn(formattedMessage, context);
    } else {
      console.warn(formattedMessage);
    }
  }

  error(message: string, error?: Error | LogContext): void {
    // Always log errors, even in production
    const formattedMessage = this.formatMessage('error', message);
    
    if (error instanceof Error) {
      console.error(formattedMessage, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else if (error) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }

    // In production, you might want to send errors to a monitoring service
    // Example: Sentry.captureException(error);
  }

  // Group related logs together
  group(label: string): void {
    if (!this.isDevelopment) return;
    console.group(`${this.logPrefix} ${label}`);
  }

  groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }

  // Performance timing helpers
  time(label: string): void {
    if (!this.isDevelopment) return;
    console.time(`${this.logPrefix} ${label}`);
  }

  timeEnd(label: string): void {
    if (!this.isDevelopment) return;
    console.timeEnd(`${this.logPrefix} ${label}`);
  }

  // Table display for structured data
  table(data: any): void {
    if (!this.isDevelopment) return;
    console.table(data);
  }
}

// Export singleton instance
export const Logger = new LoggerService();

// Export type for use in other files
export type { LogContext };