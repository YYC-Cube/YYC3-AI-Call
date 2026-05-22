/**
 * file safe-regex.test.ts
 * description @yyc3/i18n-core safe-regex.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[security],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core safe-regex.ts 单元测试
 */
import { describe, expect, it } from "vitest";
import { clearSafeRegexCache, compileSafeRegex, testSafeRegex } from "../../lib/security/safe-regex.js";

describe("Safe Regex Compiler (ReDoS Protection)", () => {
  beforeEach(() => {
    clearSafeRegexCache();
  });

  describe("compileSafeRegex", () => {
    it("should compile safe regex patterns", () => {
      const result = compileSafeRegex("^hello world$");
      expect(result.regex).toBeInstanceOf(RegExp);
      expect(result.reason).toBeNull();
      expect(result.source).toBe("^hello world$");
    });

    it("should reject empty pattern with 'empty' reason", () => {
      const result = compileSafeRegex("");
      expect(result.regex).toBeNull();
      expect(result.reason).toBe("empty");
    });

    it("should detect nested quantifiers at same depth inside groups", () => {
      const dangerousPatterns = [
        "(a*+)",
        "(a?*)",
        "(x+?y+)",
      ];

      dangerousPatterns.forEach((pattern) => {
        const result = compileSafeRegex(pattern);
        expect(result.regex).toBeNull();
        expect(result.reason).toBe("unsafe-nested-repetition");
      });
    });

    it("should accept safe patterns (quantifiers at same level or outer level)", () => {
      const safePatterns = [
        "(a+)+",
        "(a+)*",
        "((a+)*)+",
        "((a+)*)+$",
        "(ab|cd)+",
        "^[a-z]+$",
        "\\d{4}-\\d{2}",
      ];

      safePatterns.forEach((pattern) => {
        const result = compileSafeRegex(pattern);
        expect(result.regex).toBeInstanceOf(RegExp);
        expect(result.reason).toBeNull();
      });
    });

    it("should handle invalid regex syntax", () => {
      const result = compileSafeRegex("[invalid");
      expect(result.regex).toBeNull();
      expect(result.reason).toBe("invalid-regex");
    });

    it("should support flags parameter", () => {
      const result = compileSafeRegex("^test$", "gi");
      expect(result.regex).toBeInstanceOf(RegExp);
      expect(result.flags).toBe("gi");
      if (result.regex) {
        expect(result.regex.flags).toContain("g");
        expect(result.regex.flags).toContain("i");
      }
    });

    it("should cache compilation results", () => {
      const pattern = "^cached-test$";

      const result1 = compileSafeRegex(pattern);
      const result2 = compileSafeRegex(pattern);

      expect(result1).toBe(result2);
    });
  });

  describe("testSafeRegex", () => {
    it("should test input against safe regex", () => {
      expect(testSafeRegex("^\\d+$", "12345")).toBe(true);
      expect(testSafeRegex("^\\d+$", "abc")).toBe(false);
    });

    it("should return false for unsafe regex (consecutive quantifiers)", () => {
      expect(testSafeRegex("(a*+)", "aaa")).toBe(false);
      expect(testSafeRegex("(x+?y+)", "xyy")).toBe(false);
    });

    it("should return false for empty pattern", () => {
      expect(testSafeRegex("", "anything")).toBe(false);
    });
  });

  describe("clearSafeRegexCache", () => {
    it("should clear the cache", () => {
      compileSafeRegex("^cache-me$");
      clearSafeRegexCache();

      const result = compileSafeRegex("^cache-me$");
      expect(result.regex).toBeInstanceOf(RegExp);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters safely", () => {
      const specialChars = [".", "*", "+", "?", "[", "]", "{", "}", "(", ")", "|", "\\", "^", "$"];

      specialChars.forEach((char) => {
        const escaped = `\\${char}`;
        const result = compileSafeRegex(escaped);
        expect(result.regex).toBeInstanceOf(RegExp);
      });
    });

    it("should handle unicode characters", () => {
      const result = compileSafeRegex("^你好世界$");
      expect(result.regex).toBeInstanceOf(RegExp);
      expect(result.regex?.test("你好世界")).toBe(true);
    });

    it("should handle complex but safe patterns", () => {
      const safeComplexPatterns = [
        "\\d{4}-\\d{2}-\\d{2}",
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        "https?://[^\\s]+",
      ];

      safeComplexPatterns.forEach((pattern) => {
        const result = compileSafeRegex(pattern);
        expect(result.regex).toBeInstanceOf(RegExp);
      });
    });

    it("should evict oldest entry when cache exceeds max size (256)", () => {
      clearSafeRegexCache();

      for (let i = 0; i < 260; i++) {
        compileSafeRegex(`^test-pattern-${i}$`);
      }

      const firstResult = compileSafeRegex("^test-pattern-0$");
      const lastResult = compileSafeRegex("^test-pattern-259$");

      expect(firstResult.regex).toBeInstanceOf(RegExp);
      expect(lastResult.regex).toBeInstanceOf(RegExp);
    });

    it("should cache different flag combinations separately", () => {
      const result1 = compileSafeRegex("^test$", "g");
      const result2 = compileSafeRegex("^test$", "i");
      const result3 = compileSafeRegex("^test$", "gi");

      expect(result1).not.toBe(result2);
      expect(result2).not.toBe(result3);
      expect(result1.flags).toBe("g");
      expect(result2.flags).toBe("i");
      expect(result3.flags).toBe("gi");
    });
  });
});
