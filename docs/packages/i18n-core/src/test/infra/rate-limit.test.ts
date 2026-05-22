/**
 * file rate-limit.test.ts
 * description @yyc3/i18n-core rate-limit.ts 单元测试
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
 * brief @yyc3/i18n-core rate-limit.ts 单元测试
 */
import { describe, expect, it, vi } from "vitest";
import { createFixedWindowRateLimiter } from "../../lib/infra/rate-limit.js";

describe("Rate Limiter", () => {
  describe("createFixedWindowRateLimiter", () => {
    it("should allow requests within limit", () => {
      const limiter = createFixedWindowRateLimiter({ maxRequests: 5, windowMs: 1000 });

      for (let i = 0; i < 5; i++) {
        const result = limiter.consume();
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
        expect(result.retryAfterMs).toBe(0);
      }
    });

    it("should reject requests exceeding limit", () => {
      const limiter = createFixedWindowRateLimiter({ maxRequests: 2, windowMs: 1000 });

      limiter.consume();
      limiter.consume();

      const result = limiter.consume();
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("should reset window after expiration", () => {
      const now = vi.fn(() => 0);
      const limiter = createFixedWindowRateLimiter({ maxRequests: 2, windowMs: 1000, now });

      limiter.consume();
      limiter.consume();
      expect(limiter.consume().allowed).toBe(false);

      now.mockReturnValue(1500);
      const result = limiter.consume();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should reset state manually", () => {
      const limiter = createFixedWindowRateLimiter({ maxRequests: 1, windowMs: 60000 });

      limiter.consume();
      expect(limiter.consume().allowed).toBe(false);

      limiter.reset();
      const result = limiter.consume();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("should handle edge case: maxRequests = 1", () => {
      const limiter = createFixedWindowRateLimiter({ maxRequests: 1, windowMs: 1000 });

      expect(limiter.consume().allowed).toBe(true);
      expect(limiter.consume().allowed).toBe(false);
    });

    it("should clamp invalid parameters to safe values", () => {
      const limiterZero = createFixedWindowRateLimiter({
        maxRequests: 0,
        windowMs: 0,
      });

      expect(limiterZero.consume().allowed).toBe(true);

      const limiterNegative = createFixedWindowRateLimiter({
        maxRequests: -5,
        windowMs: -100,
      });

      expect(limiterNegative.consume().allowed).toBe(true);
    });

    it("should provide accurate retryAfterMs", () => {
      const now = vi.fn(() => 0);
      const limiter = createFixedWindowRateLimiter({ maxRequests: 1, windowMs: 1000, now });

      limiter.consume();
      limiter.consume();

      const blocked = limiter.consume();
      expect(blocked.retryAfterMs).toBe(1000);

      now.mockReturnValue(700);
      const stillBlocked = limiter.consume();
      expect(stillBlocked.retryAfterMs).toBe(300);
    });
  });
});
