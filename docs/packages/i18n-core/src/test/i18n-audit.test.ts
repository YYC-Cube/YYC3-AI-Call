/**
 * file i18n-audit.test.ts
 * description @yyc3/i18n-core i18n-audit.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[i18n],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core i18n-audit.ts 单元测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuditedT, i18nAudit } from "../lib/i18n-audit.js";
import { setLogLevel, type LogLevel } from "../lib/infra/logger.js";

describe("I18nAuditLogger", () => {
  let savedLevel: LogLevel;

  beforeEach(() => {
    savedLevel = (globalThis as Record<string, unknown>).__test_log_level__ as LogLevel ?? "silent";
    setLogLevel("debug");
    i18nAudit.disable();
    i18nAudit.clear();
  });

  afterEach(() => {
    setLogLevel(savedLevel);
  });

  describe("enable / disable", () => {
    it("should enable audit logging", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      i18nAudit.enable();
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Translation audit ENABLED"));
      spy.mockRestore();
    });

    it("should disable audit logging", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      i18nAudit.enable();
      i18nAudit.disable();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("Translation audit DISABLED")
      );
      spy.mockRestore();
    });
  });

  describe("log", () => {
    it("should not log when disabled", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
      i18nAudit.log("test.key", "fallback", "Component.ts");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should log entry when enabled", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
      i18nAudit.enable();

      i18nAudit.log("missing.key", "fallback", "TestComponent.tsx");

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing translation")
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("missing.key"));
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("TestComponent.tsx")
      );
      warnSpy.mockRestore();
    });
  });

  describe("getReport", () => {
    it("should return empty report when no entries", () => {
      const report = i18nAudit.getReport();
      expect(report.total).toBe(0);
      expect(report.uniqueKeys.size).toBe(0);
      expect(report.entries).toEqual([]);
    });

    it("should count entries correctly", () => {
      i18nAudit.enable();
      i18nAudit.log("key1", "fb1", "loc1");
      i18nAudit.log("key2", "fb2", "loc2");
      i18nAudit.log("key1", "fb1", "loc3");

      const report = i18nAudit.getReport();
      expect(report.total).toBe(3);
      expect(report.uniqueKeys.size).toBe(2);
      expect(report.uniqueKeys.has("key1")).toBe(true);
      expect(report.uniqueKeys.has("key2")).toBe(true);
    });
  });

  describe("exportReport", () => {
    it("should generate formatted report string", () => {
      i18nAudit.enable();
      i18nAudit.log("app.title", "App Title", "Header.tsx");

      const report = i18nAudit.exportReport();
      expect(report).toContain("I18N AUDIT REPORT");
      expect(report).toContain("Total missing translations: 1");
      expect(report).toContain("Unique keys missing: 1");
      expect(report).toContain("app.title");
    });

    it("should handle empty entries gracefully", () => {
      const report = i18nAudit.exportReport();
      expect(report).toContain("I18N AUDIT REPORT");
      expect(report).toContain("Total missing translations: 0");
    });
  });

  describe("clear", () => {
    it("should clear all entries", () => {
      i18nAudit.enable();
      i18nAudit.log("key1", "fb", "loc");

      i18nAudit.clear();
      const report = i18nAudit.getReport();
      expect(report.total).toBe(0);
    });
  });
});

describe("createAuditedT", () => {
  let savedLevel: LogLevel;

  beforeEach(() => {
    savedLevel = (globalThis as Record<string, unknown>).__test_log_level__ as LogLevel ?? "silent";
    setLogLevel("debug");
    i18nAudit.disable();
    i18nAudit.clear();
  });

  afterEach(() => {
    setLogLevel(savedLevel);
  });

  it("should return a function", () => {
    const auditedT = createAuditedT("TestLocation");
    expect(typeof auditedT).toBe("function");
  });

  it("should call t() and return result for valid translations", () => {
    const auditedT = createAuditedT("TestComponent");
    const result = auditedT("common.cancel");
    expect(result).toBeTruthy();
  });

  it("should log to audit when key equals fallback (missing)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    i18nAudit.enable();

    const auditedT = createAuditedT("MyComponent");
    auditedT("nonexistent.key");

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should not log for config.* keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    i18nAudit.enable();

    const auditedT = createAuditedT("Config");
    auditedT("config.someSetting");

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should not log for template literal starting keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    i18nAudit.enable();

    const auditedT = createAuditedT("Template");
    auditedT("{dynamicKey}");

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
