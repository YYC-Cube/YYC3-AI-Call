/**
 * file secret-equal.test.ts
 * description @yyc3/i18n-core secret-equal.ts 单元测试
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
 * brief @yyc3/i18n-core secret-equal.ts 单元测试
 */
import { describe, expect, it } from "vitest";
import { safeEqualSecret } from "../../lib/security/secret-equal.js";

describe("Safe Secret Comparison (Timing Attack Protection)", () => {
  describe("safeEqualSecret", () => {
    it("should return true for matching secrets", () => {
      expect(safeEqualSecret("my-secret-password", "my-secret-password")).toBe(
        true
      );
    });

    it("should return false for non-matching secrets", () => {
      expect(safeEqualSecret("password1", "password2")).toBe(false);
      expect(safeEqualSecret("abc", "abcd")).toBe(false);
      expect(safeEqualSecret("", "value")).toBe(false);
    });

    it("should return false when either value is not a string", () => {
      expect(safeEqualSecret(undefined, "secret")).toBe(false);
      expect(safeEqualSecret(null, "secret")).toBe(false);
      expect(safeEqualSecret("secret", undefined)).toBe(false);
      expect(safeEqualSecret("secret", null)).toBe(false);
      expect(safeEqualSecret(undefined, null)).toBe(false);
      expect(safeEqualSecret(123 as unknown as string, "123")).toBe(false);
      expect(safeEqualSecret({} as unknown as string, "{}")).toBe(false);
    });

    it("should return true for matching empty strings", () => {
      expect(safeEqualSecret("", "")).toBe(true);
    });

    it("should handle long secrets correctly", () => {
      const longSecret = "a".repeat(1000);
      expect(safeEqualSecret(longSecret, longSecret)).toBe(true);
      expect(safeEqualSecret(longSecret, "b".repeat(1000))).toBe(false);
    });

    it("should handle unicode/secrets with special characters", () => {
      expect(safeEqualSecret("密码🔑", "密码🔑")).toBe(true);
      expect(safeEqualSecret("password!@#$%", "password!@#$%")).toBe(true);
      expect(safeEqualSecret("line1\nline2", "line1\nline2")).toBe(true);
    });

    it("should have consistent timing (basic check)", () => {
      const startMatch = Date.now();
      for (let i = 0; i < 1000; i++) {
        safeEqualSecret("match-secret", "match-secret");
      }
      const elapsedMatch = Date.now() - startMatch;

      const startMismatch = Date.now();
      for (let i = 0; i < 1000; i++) {
        safeEqualSecret("match-secret", "wrong-secret");
      }
      const elapsedMismatch = Date.now() - startMismatch;

      const ratio = Math.max(elapsedMatch, elapsedMismatch) / Math.min(elapsedMatch, elapsedMismatch);
      expect(ratio).toBeLessThan(10);
    });
  });
});
