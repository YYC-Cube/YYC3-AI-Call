/**
 * file rate-limit.ts
 * description 速率限制器
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[infra]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 速率限制器
 */
export type FixedWindowRateLimiter = {
  consume: () => {
    allowed: boolean;
    retryAfterMs: number;
    remaining: number;
  };
  reset: () => void;
};

export function createFixedWindowRateLimiter(params: {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}): FixedWindowRateLimiter {
  const maxRequests = Math.max(1, Math.floor(params.maxRequests));
  const windowMs = Math.max(1, Math.floor(params.windowMs));
  const now = params.now ?? Date.now;

  let count = 0;
  let windowStartMs = 0;

  return {
    consume() {
      const nowMs = now();
      if (nowMs - windowStartMs >= windowMs) {
        windowStartMs = nowMs;
        count = 0;
      }
      if (count >= maxRequests) {
        return {
          allowed: false,
          retryAfterMs: Math.max(0, windowStartMs + windowMs - nowMs),
          remaining: 0,
        };
      }
      count += 1;
      return {
        allowed: true,
        retryAfterMs: 0,
        remaining: Math.max(0, maxRequests - count),
      };
    },
    reset() {
      count = 0;
      windowStartMs = 0;
    },
  };
}
