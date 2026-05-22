/**
 * file formatter.test.ts
 * description @yyc3/i18n-core formatter.ts 单元测试
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
 * brief @yyc3/i18n-core formatter.ts 单元测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTime, interpolate, pluralize } from "../lib/formatter.js";

describe("Formatter Utilities", () => {
  describe("interpolate", () => {
    it("should return template as-is when no params provided", () => {
      expect(interpolate("Hello World")).toBe("Hello World");
      expect(interpolate("{name}")).toBe("{name}");
      expect(interpolate("")).toBe("");
    });

    it("should replace placeholders with param values", () => {
      const result = interpolate("Hello {name}, you have {count} messages", {
        name: "Alice",
        count: 5,
      });
      expect(result).toBe("Hello Alice, you have 5 messages");
    });

    it("should handle single placeholder", () => {
      expect(interpolate("Value: {value}", { value: 42 })).toBe("Value: 42");
    });

    it("should preserve unmatched placeholders", () => {
      const result = interpolate("{greeting} {unknown}", { greeting: "Hello" });
      expect(result).toBe("Hello {unknown}");
    });

    it("should handle null and undefined values by keeping placeholder", () => {
      const result = interpolate("{a} and {b}", { a: null, b: undefined });
      expect(result).toBe("{a} and {b}");
    });

    it("should convert numbers to strings", () => {
      const result = interpolate("Score: {score}", { score: 100 });
      expect(result).toBe("Score: 100");
    });

    it("should handle boolean values", () => {
      const result = interpolate("Active: {active}", { active: true });
      expect(result).toBe("Active: true");
    });

    it("should handle empty params object", () => {
      expect(interpolate("test", {})).toBe("test");
    });
  });

  describe("pluralize", () => {
    it("should remove (s) for singular count", () => {
      expect(pluralize("item(s)", 1)).toBe("item");
      expect(pluralize("{count} message(s)", 1)).toBe("1 message");
    });

    it("should keep 's' for plural count", () => {
      expect(pluralize("item(s)", 2)).toBe("items");
      expect(pluralize("item(s)", 0)).toBe("items");
      expect(pluralize("item(s)", 10)).toBe("items");
    });

    it("should replace {count} with actual number", () => {
      expect(pluralize("{count} item(s)", 5)).toBe("5 items");
      expect(pluralize("{count} item(s)", 1)).toBe("1 item");
    });

    it("should handle template without placeholders", () => {
      expect(pluralize("items", 5)).toBe("items");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe("Chinese locale (zh)", () => {
      it('should return "刚刚" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "zh-CN")).toBe("刚刚");
      });

      it('should return "X分钟前" for minutes', () => {
        const timestamp = Date.now() - 5 * 60000;
        expect(formatRelativeTime(timestamp, "zh-CN")).toBe("5分钟前");
      });

      it('should return "X小时前" for hours', () => {
        const timestamp = Date.now() - 3 * 3600000;
        expect(formatRelativeTime(timestamp, "zh-CN")).toBe("3小时前");
      });

      it('should return "X天前" for days < 7', () => {
        const timestamp = Date.now() - 3 * 86400000;
        expect(formatRelativeTime(timestamp, "zh-CN")).toBe("3天前");
      });

      it("should return formatted date for older timestamps", () => {
        const timestamp = Date.now() - 10 * 86400000;
        const result = formatRelativeTime(timestamp, "zh-CN");
        expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
      });
    });

    describe("English locale (default)", () => {
      it('should return "just now" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "en-US")).toBe("just now");
      });

      it('should return "Xm ago" for minutes', () => {
        const timestamp = Date.now() - 5 * 60000;
        expect(formatRelativeTime(timestamp, "en-US")).toBe("5m ago");
      });

      it('should return "Xh ago" for hours', () => {
        const timestamp = Date.now() - 3 * 3600000;
        expect(formatRelativeTime(timestamp, "en-US")).toBe("3h ago");
      });

      it('should return "Xd ago" for days < 7', () => {
        const timestamp = Date.now() - 3 * 86400000;
        expect(formatRelativeTime(timestamp, "en-US")).toBe("3d ago");
      });

      it("should return formatted date for older timestamps", () => {
        const timestamp = Date.now() - 10 * 86400000;
        const result = formatRelativeTime(timestamp, "en-US");
        expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      });
    });

    it("should detect Chinese locale from zh prefix", () => {
      const timestamp = Date.now() - 30000;
      expect(formatRelativeTime(timestamp, "zh-TW")).toBe("刚刚");
    });

    describe("Japanese locale (ja)", () => {
      it('should return "たった今" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "ja-JP")).toBe("たった今");
      });

      it('should return minutes in Japanese', () => {
        const timestamp = Date.now() - 5 * 60000;
        expect(formatRelativeTime(timestamp, "ja")).toBe("5分前");
      });
    });

    describe("Korean locale (ko)", () => {
      it('should return "방금" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "ko-KR")).toBe("방금");
      });

      it('should return hours in Korean', () => {
        const timestamp = Date.now() - 3 * 3600000;
        expect(formatRelativeTime(timestamp, "ko")).toBe("3시간 전");
      });
    });

    describe("Portuguese locale (pt)", () => {
      it('should return "agora mesmo" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "pt-BR")).toBe("agora mesmo");
      });

      it('should return days in Portuguese', () => {
        const timestamp = Date.now() - 3 * 86400000;
        expect(formatRelativeTime(timestamp, "pt")).toBe("3d atrás");
      });
    });

    describe("French locale (fr)", () => {
      it('should return "à l\'instant" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "fr-FR")).toBe("à l'instant");
      });
    });

    describe("German locale (de)", () => {
      it('should return "gerade eben" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "de-DE")).toBe("gerade eben");
      });

      it("should pluralize German days correctly", () => {
        const timestamp = Date.now() - 3 * 86400000;
        expect(formatRelativeTime(timestamp, "de")).toBe("vor 3 Tagen");
      });

      it("should use singular German day for 1 day", () => {
        const timestamp = Date.now() - 1 * 86400000;
        expect(formatRelativeTime(timestamp, "de")).toBe("vor 1 Tag");
      });
    });

    describe("Spanish locale (es)", () => {
      it('should return "ahora mismo" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "es-ES")).toBe("ahora mismo");
      });
    });

    describe("Arabic locale (ar)", () => {
      it('should return "الآن" for less than 60 seconds', () => {
        const timestamp = Date.now() - 30000;
        expect(formatRelativeTime(timestamp, "ar-SA")).toBe("الآن");
      });

      it('should return minutes in Arabic', () => {
        const timestamp = Date.now() - 5 * 60000;
        expect(formatRelativeTime(timestamp, "ar")).toBe("منذ 5 دقيقة");
      });
    });

    it("should fallback to English for unknown locales", () => {
      const timestamp = Date.now() - 30000;
      expect(formatRelativeTime(timestamp, "xx-XX")).toBe("just now");
    });
  });
});
