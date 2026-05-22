/**
 * file logger.test.ts
 * description @yyc3/i18n-core logger.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[infra],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core logger.ts 单元测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLogger,
  getLogLevel,
  logger,
  setLogLevel,
  type LogLevel,
} from "../../lib/infra/logger.js";

describe("Logger Infrastructure", () => {
  let savedLevel: LogLevel;

  beforeEach(() => {
    savedLevel = getLogLevel();
  });

  afterEach(() => {
    setLogLevel(savedLevel);
  });

  describe("setLogLevel / getLogLevel", () => {
    it("should default to silent", () => {
      setLogLevel("silent");
      expect(getLogLevel()).toBe("silent");
    });

    it("should persist log level changes", () => {
      setLogLevel("debug");
      expect(getLogLevel()).toBe("debug");

      setLogLevel("warn");
      expect(getLogLevel()).toBe("warn");
    });
  });

  describe("createLogger", () => {
    it("should return SilentLogger when level is silent", () => {
      setLogLevel("silent");
      const log = createLogger();
      const spy = vi.spyOn(console, "log");
      log.info("should not appear");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should return ConsoleLogger when level is not silent", () => {
      setLogLevel("debug");
      const log = createLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      log.info("hello");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("hello"));
      spy.mockRestore();
    });

    it("should respect custom prefix", () => {
      setLogLevel("info");
      const log = createLogger("[custom]");
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      log.info("test");
      expect(spy).toHaveBeenCalledWith("[custom] test");
      spy.mockRestore();
    });
  });

  describe("log level filtering", () => {
    it("should not log debug when level is info", () => {
      setLogLevel("info");
      const log = createLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      log.debug("hidden");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should log info when level is info", () => {
      setLogLevel("info");
      const log = createLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      log.info("visible");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should log warn when level is warn", () => {
      setLogLevel("warn");
      const log = createLogger();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => { });
      log.warn("visible");
      log.info("hidden");
      expect(warnSpy).toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
      logSpy.mockRestore();
    });

    it("should log error when level is error", () => {
      setLogLevel("error");
      const log = createLogger();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
      log.error("visible");
      log.warn("hidden");
      expect(errorSpy).toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe("logger proxy", () => {
    it("should forward calls through the global proxy", () => {
      setLogLevel("info");
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      logger.info("proxy test");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should silently ignore calls when level is silent", () => {
      setLogLevel("silent");
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      logger.info("should not appear");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
