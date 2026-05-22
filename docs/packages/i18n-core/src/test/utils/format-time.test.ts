/**
 * file format-time.test.ts
 * description @yyc3/i18n-core format-time.ts 单元测试
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
 * brief @yyc3/i18n-core format-time.ts 单元测试
 */
import { describe, expect, it, vi } from "vitest";
import { formatRelativeTimestamp, formatTimeAgo } from "../../lib/utils/format-time.js";

describe("Time Formatting Utilities", () => {
  describe("formatTimeAgo", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "just now" for durations < 30s (rounds to <1 min)', () => {
      expect(formatTimeAgo(29000)).toBe("just now");
      expect(formatTimeAgo(1000)).toBe("just now");
      expect(formatTimeAgo(0)).toBe("just now");
    });

    it('should round to minutes (30s+ rounds up to 1 min)', () => {
      expect(formatTimeAgo(30000)).toBe("1m ago");
      expect(formatTimeAgo(59000)).toBe("1m ago");
      expect(formatTimeAgo(60000)).toBe("1m ago");
      expect(formatTimeAgo(90000)).toBe("2m ago");
    });

    it('should format minutes correctly with suffix', () => {
      expect(formatTimeAgo(120000)).toBe("2m ago");
      expect(formatTimeAgo(3540000)).toBe("59m ago");
    });

    it('should format hours correctly (rounded from minutes)', () => {
      expect(formatTimeAgo(3600000)).toBe("1h ago");
      expect(formatTimeAgo(7200000)).toBe("2h ago");
      expect(formatTimeAgo(3599000)).toMatch(/\d+h ago/);
    });

    it('should format days correctly (rounded from hours)', () => {
      expect(formatTimeAgo(86400000)).toBe("1d ago");
      expect(formatTimeAgo(172800000)).toBe("2d ago");
      expect(formatTimeAgo(604800000)).toBe("7d ago");
    });

    it("should support suffix: false (no suffix)", () => {
      expect(formatTimeAgo(60000, { suffix: false })).toBe("1m");
      expect(formatTimeAgo(3600000, { suffix: false })).toBe("1h");
      expect(formatTimeAgo(86400000, { suffix: false })).toBe("1d");
    });

    it("should handle seconds without suffix for short durations (<30s)", () => {
      expect(formatTimeAgo(5000, { suffix: false })).toBe("5s");
      expect(formatTimeAgo(29000, { suffix: false })).toBe("29s");
    });

    it("should use custom fallback for null/undefined/invalid values", () => {
      expect(formatTimeAgo(null)).toBe("unknown");
      expect(formatTimeAgo(undefined)).toBe("unknown");
      expect(formatTimeAgo(-1000)).toBe("unknown");
      expect(formatTimeAgo(NaN)).toBe("unknown");
      expect(formatTimeAgo(Infinity)).toBe("unknown");
      expect(formatTimeAgo(null, { fallback: "never" })).toBe("never");
    });
  });

  describe("formatRelativeTimestamp", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format recent timestamps as "just now"', () => {
      const recent = Date.now() - 30000;
      expect(formatRelativeTimestamp(recent)).toBe("just now");
    });

    it('should format past timestamps with "ago" suffix', () => {
      const minutesAgo = Date.now() - 120000;
      expect(formatRelativeTimestamp(minutesAgo)).toBe("2m ago");

      const hoursAgo = Date.now() - 3600000;
      expect(formatRelativeTimestamp(hoursAgo)).toBe("1h ago");

      const daysAgo = Date.now() - 86400000;
      expect(formatRelativeTimestamp(daysAgo)).toBe("1d ago");
    });

    it('should format future timestamps with "in" prefix', () => {
      const inFuture = Date.now() + 180000;
      expect(formatRelativeTimestamp(inFuture)).toBe("in 3m");

      const inHours = Date.now() + 7200000;
      expect(formatRelativeTimestamp(inHours)).toBe("in 2h");
    });

    it('should format <1 minute future as "in <1m"', () => {
      const inSeconds = Date.now() + 30000;
      expect(formatRelativeTimestamp(inSeconds)).toBe("in <1m");
    });

    it("should use custom fallback for invalid inputs", () => {
      expect(formatRelativeTimestamp(null)).toBe("n/a");
      expect(formatRelativeTimestamp(undefined)).toBe("n/a");
      expect(formatRelativeTimestamp(null, { fallback: "invalid" })).toBe(
        "invalid"
      );
    });

    it("should fall back to date string for old timestamps when dateFallback is true", () => {
      const oldTimestamp = Date.now() - 10 * 86400000;
      const result = formatRelativeTimestamp(oldTimestamp, { dateFallback: true });
      expect(result).match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
    });

    it("should not use date fallback for timestamps within 7 days", () => {
      const weekAgo = Date.now() - 7 * 86400000;
      const result = formatRelativeTimestamp(weekAgo, { dateFallback: true });
      expect(result).toContain("d ago");
    });
  });
});
