type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
const DEFAULT_LEVEL: LogLevel = isProduction ? 'warn' : 'debug';

class Logger {
  private level: LogLevel = DEFAULT_LEVEL;
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[${this.prefix}]`, ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[${this.prefix}]`, ...args);
    }
  }
}

export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

export { Logger, LogLevel };
