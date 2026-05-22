interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  error?: Error;
  [key: string]: unknown;
}

enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    const envLevel = (process.env.LOG_LEVEL || 'info').toUpperCase();
    this.logLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context
      ? Object.entries(context)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => {
            if (key === 'error' && value instanceof Error) {
              return `${key}=${value.message}\\n${value.stack}`;
            }
            return `${key}=${JSON.stringify(value)}`;
          })
          .join(' ')
      : '';

    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`.trim();
  }

  private output(level: string, formattedMessage: string): void {
    switch (level) {
      case 'error':
      case 'fatal':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
        break;
    }
  }

  trace(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      const formatted = this.formatMessage('trace', message, context);
      this.output('trace', formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage('debug', message, context);
      this.output('debug', formatted);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage('info', message, context);
      this.output('info', formatted);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage('warn', message, context);
      this.output('warn', formatted);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage('error', message, {
        ...context,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      });
      this.output('error', formatted);
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      const formatted = this.formatMessage('fatal', message, {
        ...context,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      });
      this.output('fatal', formatted);
    }
  }

  createRequestLogger(requestId: string, baseContext: LogContext) {
    return {
      trace: (msg: string, ctx?: LogContext) =>
        this.trace(msg, { ...baseContext, ...ctx, requestId }),

      debug: (msg: string, ctx?: LogContext) =>
        this.debug(msg, { ...baseContext, ...ctx, requestId }),

      info: (msg: string, ctx?: LogContext) =>
        this.info(msg, { ...baseContext, ...ctx, requestId }),

      warn: (msg: string, ctx?: LogContext) =>
        this.warn(msg, { ...baseContext, ...ctx, requestId }),

      error: (msg: string, err?: Error, ctx?: LogContext) =>
        this.error(msg, err, { ...baseContext, ...ctx, requestId }),

      fatal: (msg: string, err?: Error, ctx?: LogContext) =>
        this.fatal(msg, err, { ...baseContext, ...ctx, requestId }),
    };
  }
}

export const logger = Logger.getInstance();
export { Logger, LogLevel };
export type { LogContext };
