/**
 * file secure-random.test.ts
 * description @yyc3/i18n-core secure-random.ts 单元测试
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
 * brief @yyc3/i18n-core secure-random.ts 单元测试
 */
import { describe, expect, it } from "vitest";
import {
  generateSecureFraction,
  generateSecureHex,
  generateSecureInt,
  generateSecureToken,
  generateSecureUuid,
} from "../../lib/infra/secure-random.js";

describe("Secure Random Generators", () => {
  describe("generateSecureUuid", () => {
    it("should generate valid UUID v4 format", () => {
      const uuid = generateSecureUuid();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it("should generate unique UUIDs", () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateSecureUuid()));
      expect(uuids.size).toBe(100);
    });
  });

  describe("generateSecureToken", () => {
    it("should generate base64url-encoded token of correct length", () => {
      const token = generateSecureToken(16);
      expect(token.length).toBe(22);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should support custom byte length", () => {
      const short = generateSecureToken(8);
      const long = generateSecureToken(32);

      expect(short.length).toBe(11);
      expect(long.length).toBe(43);
    });

    it("should generate unique tokens", () => {
      const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()));
      expect(tokens.size).toBe(100);
    });
  });

  describe("generateSecureHex", () => {
    it("should generate hex string of correct length", () => {
      const hex = generateSecureHex(16);
      expect(hex.length).toBe(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should support custom byte length", () => {
      const hex = generateSecureHex(8);
      expect(hex.length).toBe(16);
    });
  });

  describe("generateSecureFraction", () => {
    it("should return number between 0 (inclusive) and 1 (exclusive)", () => {
      for (let i = 0; i < 100; i++) {
        const fraction = generateSecureFraction();
        expect(fraction).toBeGreaterThanOrEqual(0);
        expect(fraction).toBeLessThan(1);
      }
    });
  });

  describe("generateSecureInt", () => {
    it("should return integer in range [0, maxExclusive)", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureInt(10);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(10);
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    it("should support range [minInclusive, maxExclusive)", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureInt(5, 15);
        expect(num).toBeGreaterThanOrEqual(5);
        expect(num).toBeLessThan(15);
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    it("should handle single argument form", () => {
      const num = generateSecureInt(100);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(100);
    });
  });
});
