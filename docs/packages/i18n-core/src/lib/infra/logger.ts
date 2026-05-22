/**
 * file logger.ts
 * description 日志系统
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[infra]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 日志系统
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

class ConsoleLogger implements Logger {
  constructor(private prefix = "[i18n]", private minLevel: LogLevel = "silent") {}

  debug(message: string, ...args: unknown[]): void {
    if (this.isLevelEnabled("debug")) {
      console.log(`${this.prefix} ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.isLevelEnabled("info")) {
      console.log(`${this.prefix} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.isLevelEnabled("warn")) {
      console.warn(`${this.prefix} ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.isLevelEnabled("error")) {
      console.error(`${this.prefix} ${message}`, ...args);
    }
  }

  private isLevelEnabled(level: Exclude<LogLevel, "silent">): boolean {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.minLevel];
  }
}

class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

let globalLogLevel: LogLevel = "silent";

export function createLogger(prefix?: string): Logger {
  if (globalLogLevel === "silent") {
    return new SilentLogger();
  }
  return new ConsoleLogger(prefix ?? "[i18n]", globalLogLevel);
}

export function setLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

export function getLogLevel(): LogLevel {
  return globalLogLevel;
}

export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop: string) {
    const current = createLogger();
    const fn = (current as unknown as Record<string, unknown>)[prop];
    if (typeof fn === "function") {
      return fn.bind(current);
    }
    return undefined;
  },
});
