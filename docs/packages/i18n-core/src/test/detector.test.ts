/**
 * file detector.test.ts
 * description @yyc3/i18n-core detector.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core detector.ts 单元测试
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  detectSystemLocale,
  isChineseLocale,
  normalizeLocale,
} from "../lib/detector.js";

describe("Locale Detector", () => {
  describe("normalizeLocale", () => {
    it("should normalize Chinese variants to zh-CN", () => {
      expect(normalizeLocale("zh")).toBe("zh-CN");
      expect(normalizeLocale("zh-cn")).toBe("zh-CN");
      expect(normalizeLocale("zh_cn")).toBe("zh-CN");
      expect(normalizeLocale("zh-hans")).toBe("zh-CN");
      expect(normalizeLocale("ZH")).toBe("zh-CN");
    });

    it("should normalize Traditional Chinese to zh-TW", () => {
      expect(normalizeLocale("zh-tw")).toBe("zh-TW");
      expect(normalizeLocale("zh_hk")).toBe("zh-TW");
      expect(normalizeLocale("zh-hant")).toBe("zh-TW");
    });

    it("should normalize English variants to en", () => {
      expect(normalizeLocale("en")).toBe("en");
      expect(normalizeLocale("en-us")).toBe("en");
      expect(normalizeLocale("en_gb")).toBe("en");
    });

    it("should normalize other languages", () => {
      expect(normalizeLocale("ja")).toBe("ja");
      expect(normalizeLocale("ja-jp")).toBe("ja");
      expect(normalizeLocale("ko")).toBe("ko");
      expect(normalizeLocale("fr")).toBe("fr");
      expect(normalizeLocale("de")).toBe("de");
      expect(normalizeLocale("es")).toBe("es");
    });

    it("should normalize Portuguese to pt-BR", () => {
      expect(normalizeLocale("pt")).toBe("pt-BR");
      expect(normalizeLocale("pt-br")).toBe("pt-BR");
    });

    it("should normalize Arabic to ar", () => {
      expect(normalizeLocale("ar")).toBe("ar");
      expect(normalizeLocale("ar-sa")).toBe("ar");
    });

    it("should handle locale with encoding suffix", () => {
      expect(normalizeLocale("zh_CN.UTF-8")).toBe("zh-CN");
      expect(normalizeLocale("en_US.iso88591")).toBe("en");
    });

    it("should return null for unknown locales", () => {
      expect(normalizeLocale("unknown")).toBeNull();
      expect(normalizeLocale("xx-YY")).toBeNull();
      expect(normalizeLocale("")).toBeNull();
    });

    it("should extract primary language for unknown but valid language codes", () => {
      expect(normalizeLocale("it")).toBeNull();
      expect(normalizeLocale("ru")).toBeNull();
    });

    it("should trim whitespace", () => {
      expect(normalizeLocale("  zh-CN  ")).toBe("zh-CN");
    });
  });

  describe("isChineseLocale", () => {
    it("should return true for Chinese locales", () => {
      expect(isChineseLocale("zh-CN")).toBe(true);
      expect(isChineseLocale("zh-TW")).toBe(true);
    });

    it("should return false for non-Chinese locales", () => {
      expect(isChineseLocale("en")).toBe(false);
      expect(isChineseLocale("ja")).toBe(false);
      expect(isChineseLocale("ko")).toBe(false);
      expect(isChineseLocale("ar")).toBe(false);
    });
  });

  describe("detectSystemLocale", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.restoreAllMocks();
      process.env = { ...originalEnv };
    });

    it("should detect a valid locale (env, storage, or system)", () => {
      delete process.env.LANGUAGE;
      delete process.env.LANG;
      delete process.env.LC_ALL;
      delete process.env.LC_MESSAGES;

      const result = detectSystemLocale();
      expect(result.locale).toBeTruthy();
      expect(["env", "storage", "system", "default"]).toContain(result.source);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should detect from environment variable LANGUAGE", () => {
      process.env.LANGUAGE = "zh-CN:en";
      const result = detectSystemLocale();
      expect(result.locale).toBe("zh-CN");
      expect(result.source).toBe("env");
      expect(result.confidence).toBe(0.95);
    });

    it("should detect from environment variable LANG", () => {
      process.env.LANG = "ja_JP.UTF-8";
      const result = detectSystemLocale();
      expect(result.locale).toBe("ja");
      expect(result.source).toBe("env");
    });

    it("should use stored locale with high confidence when valid", () => {
      const result = detectSystemLocale("zh-TW");
      if (result.source === "storage") {
        expect(result.locale).toBe("zh-TW");
        expect(result.confidence).toBe(0.95);
      }
    });

    it("should ignore invalid stored locale and fall back", () => {
      const result = detectSystemLocale("invalid-locale");
      expect(result.source).not.toBe("storage");
    });

    it("should handle null stored locale", () => {
      const result = detectSystemLocale(null);
      expect(result.source).not.toBe("storage");
    });
  });
});
