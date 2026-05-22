/**
 * file safe-regex.ts
 * description ReDoS 防护安全正则
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[security]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief ReDoS 防护安全正则
 */
export type SafeRegexRejectReason = "empty" | "unsafe-nested-repetition" | "invalid-regex";

export type SafeRegexCompileResult =
  | {
      regex: RegExp;
      source: string;
      flags: string;
      reason: null;
    }
  | {
      regex: null;
      source: string;
      flags: string;
      reason: SafeRegexRejectReason;
    };

const SAFE_REGEX_CACHE_MAX = 256;
const safeRegexCache = new Map<string, SafeRegexCompileResult>();

function hasUnsafeNestedRepetition(source: string): boolean {
  let depth = 0;
  let lastWasQuantifier = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === undefined) continue;

    if (char === "(") {
      depth++;
      lastWasQuantifier = false;
    } else if (char === ")") {
      depth--;
      lastWasQuantifier = false;
    } else if ("*+?{".includes(char)) {
      if (lastWasQuantifier && depth > 0) {
        return true;
      }
      lastWasQuantifier = true;

      if (char === "{") {
        const closeIndex = source.indexOf("}", i);
        if (closeIndex === -1) continue;
        i = closeIndex;
      }
    } else if (char === "\\") {
      i++;
      lastWasQuantifier = false;
    } else {
      lastWasQuantifier = false;
    }
  }

  return false;
}

export function compileSafeRegex(source: string, flags?: string): SafeRegexCompileResult {
  const key = `${source}::${flags ?? ""}`;

  if (safeRegexCache.has(key)) {
    return safeRegexCache.get(key)!;
  }

  if (!source) {
    const result: SafeRegexCompileResult = { regex: null, source, flags: flags ?? "", reason: "empty" };
    cacheResult(key, result);
    return result;
  }

  if (hasUnsafeNestedRepetition(source)) {
    const result: SafeRegexCompileResult = { regex: null, source, flags: flags ?? "", reason: "unsafe-nested-repetition" };
    cacheResult(key, result);
    return result;
  }

  try {
    const regex = new RegExp(source, flags);
    const result: SafeRegexCompileResult = { regex, source, flags: flags ?? "", reason: null };
    cacheResult(key, result);
    return result;
  } catch {
    const result: SafeRegexCompileResult = { regex: null, source, flags: flags ?? "", reason: "invalid-regex" };
    cacheResult(key, result);
    return result;
  }
}

export function testSafeRegex(source: string, input: string, flags?: string): boolean {
  const result = compileSafeRegex(source, flags);
  if (!result.regex) {
    return false;
  }
  return result.regex.test(input);
}

export function clearSafeRegexCache(): void {
  safeRegexCache.clear();
}

function cacheResult(key: string, result: SafeRegexCompileResult): void {
  if (safeRegexCache.size >= SAFE_REGEX_CACHE_MAX) {
    const firstKey = safeRegexCache.keys().next().value;
    if (firstKey !== undefined) {
      safeRegexCache.delete(firstKey);
    }
  }
  safeRegexCache.set(key, result);
}
