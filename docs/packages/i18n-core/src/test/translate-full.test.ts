/**
 * file translate-full.test.ts
 * description @yyc3/i18n-core translate-full.ts 单元测试
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
 * brief @yyc3/i18n-core translate-full.ts 单元测试
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { i18n, t } from "../lib/translate.js";
import type { Locale, TranslationMap } from "../lib/types.js";

describe("I18nManager (translate)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("t() - translation function", () => {
    it("should translate existing keys", () => {
      expect(t("common.cancel")).toBe("Cancel");
      expect(t("common.save")).toBe("Save");
      expect(t("nav.home")).toBe("Home");
    });

    it("should return key for missing translations", () => {
      const result = t("nonexistent.key");
      expect(result).toBe("nonexistent.key");
    });

    it("should replace parameters in translation", () => {
      const result = t("welcome.message", { name: "World" });
      expect(result).toBe("Hello World");
    });

    it("should replace time parameter in overview stats", () => {
      const result = t("overview.stats.cronNext", { time: "12:00" });
      expect(result).toContain("12:00");
    });

    it("should handle nested keys correctly", () => {
      expect(typeof t("common.error")).toBe("string");
      expect(typeof t("nav.about")).toBe("string");
    });

    it("should keep unreplaced params in braces", () => {
      const result = t("welcome.message");
      if (result !== "welcome.message") {
        expect(result).toContain("{name}");
      }
    });
  });

  describe("getLocale / setLocale", () => {
    it("should return current locale", () => {
      const locale = i18n.getLocale();
      expect(locale).toBeTruthy();
      expect(typeof locale).toBe("string");
    });

    it("should be a supported locale", () => {
      const locale = i18n.getLocale();
      expect(["en", "zh-CN", "zh-TW", "pt-BR", "ja", "ko", "fr", "de", "es", "ar"]).toContain(locale);
    });
  });

  describe("registerTranslation", () => {
    it("should register custom translations", () => {
      const customMap: Record<string, unknown> = {
        custom: {
          greeting: "Hello Custom",
        },
      };
      i18n.registerTranslation("en" as Locale, customMap as TranslationMap);
      expect(t("custom.greeting")).toBe("Hello Custom");
    });

    it("should override existing translations", () => {
      const overrideMap: Record<string, unknown> = {
        common: {
          cancel: "Abort",
        },
      };
      i18n.registerTranslation("en" as Locale, overrideMap as TranslationMap);
      expect(t("common.cancel")).toBe("Abort");

      i18n.registerTranslation("en" as Locale, { common: { cancel: "Cancel" } } as TranslationMap);
    });
  });

  describe("subscribe", () => {
    it("should return unsubscribe function", () => {
      const subscriber = vi.fn();
      const unsubscribe = i18n.subscribe(subscriber);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });

    it("should support multiple subscribers without errors", () => {
      const sub1 = vi.fn();
      const sub2 = vi.fn();

      const unsub1 = i18n.subscribe(sub1);
      const unsub2 = i18n.subscribe(sub2);

      unsub1();
      unsub2();
    });
  });

  describe("edge cases", () => {
    it("should handle empty key", () => {
      const result = t("");
      expect(typeof result).toBe("string");
    });

    it("should handle key with only dots", () => {
      const result = t("...");
      expect(result).toBe("...");
    });
  });
});
