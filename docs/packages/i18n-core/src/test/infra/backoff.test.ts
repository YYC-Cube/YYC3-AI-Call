/**
 * file backoff.test.ts
 * description @yyc3/i18n-core backoff.ts 单元测试
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
 * brief @yyc3/i18n-core backoff.ts 单元测试
 */
import { describe, expect, it, vi } from "vitest";
import {
  computeBackoff,
  createRetryRunner,
  DEFAULT_BACKOFF_POLICY,
  sleepWithAbort,
} from "../../lib/infra/backoff.js";

describe("Backoff & Retry Utilities", () => {
  describe("computeBackoff", () => {
    it("should compute backoff with default policy", () => {
      const result = computeBackoff(DEFAULT_BACKOFF_POLICY, 1);
      expect(result).toBeGreaterThanOrEqual(DEFAULT_BACKOFF_POLICY.initialMs * 0.9);
      expect(result).toBeLessThanOrEqual(DEFAULT_BACKOFF_POLICY.initialMs * 1.1);
    });

    it("should increase delay exponentially", () => {
      const policy = { initialMs: 1000, maxMs: 30000, factor: 2, jitter: 0 };
      const attempt1 = computeBackoff(policy, 1);
      const attempt2 = computeBackoff(policy, 2);
      const attempt3 = computeBackoff(policy, 3);

      expect(attempt1).toBe(1000);
      expect(attempt2).toBe(2000);
      expect(attempt3).toBe(4000);
    });

    it("should respect maxMs limit", () => {
      const policy = { initialMs: 1000, maxMs: 5000, factor: 10, jitter: 0 };
      const result = computeBackoff(policy, 5);
      expect(result).toBeLessThanOrEqual(5000);
    });

    it("should apply jitter when configured", () => {
      const policy = { initialMs: 1000, maxMs: 30000, factor: 2, jitter: 0.1 };
      const results = Array.from({ length: 10 }, (_, i) =>
        computeBackoff(policy, i + 1)
      );

      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it("should handle attempt 0 correctly (use initial value)", () => {
      const policy = { initialMs: 1000, maxMs: 30000, factor: 2, jitter: 0 };
      const result = computeBackoff(policy, 0);
      expect(result).toBe(1000);
    });

    it("should return positive integer", () => {
      const result = computeBackoff(DEFAULT_BACKOFF_POLICY, 3);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("sleepWithAbort", () => {
    it("should resolve after specified time", async () => {
      const start = Date.now();
      await sleepWithAbort(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("should resolve immediately for non-positive ms", async () => {
      const start = Date.now();
      await sleepWithAbort(0);
      await sleepWithAbort(-10);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });

    it("should throw error when aborted", async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10);

      await expect(sleepWithAbort(5000, controller.signal)).rejects.toThrow(
        "aborted"
      );
    });
  });

  describe("createRetryRunner", () => {
    it("should succeed on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const retry = createRetryRunner({ maxAttempts: 3 });

      const result = await retry(fn);
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) throw new Error("temporary failure");
        return "success";
      });

      const retry = createRetryRunner({ maxAttempts: 5 });
      const result = await retry(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw after max attempts exhausted", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));
      const retry = createRetryRunner({ maxAttempts: 3 });

      await expect(retry(fn)).rejects.toThrow("persistent failure");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use custom shouldRetry function", async () => {
      const customError = new Error("custom");
      const fn = vi.fn().mockRejectedValue(customError);

      const retry = createRetryRunner({
        maxAttempts: 5,
        shouldRetry: (error) => error.message !== "custom",
      });

      await expect(retry(fn)).rejects.toThrow("custom");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should accept custom backoff policy", async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) throw new Error("retry");
        return "ok";
      });

      const start = Date.now();
      const retry = createRetryRunner({
        maxAttempts: 3,
        backoffPolicy: { initialMs: 20, maxMs: 100, factor: 1, jitter: 0 },
      });

      await retry(fn);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(15);
    });

    it("should re-throw non-abort errors from sleepWithAbort", async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error("test error");
      });

      const retry = createRetryRunner({ maxAttempts: 2 });
      await expect(retry(fn)).rejects.toThrow("test error");
    });

    it("should handle non-Error thrown values", async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw "string error";
      });

      const retry = createRetryRunner({ maxAttempts: 1 });
      await expect(retry(fn)).rejects.toThrow("string error");
    });

    it("should not retry when shouldRetry returns false on first attempt", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("stop"));

      const retry = createRetryRunner({
        maxAttempts: 5,
        shouldRetry: () => false,
      });

      await expect(retry(fn)).rejects.toThrow("stop");
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
