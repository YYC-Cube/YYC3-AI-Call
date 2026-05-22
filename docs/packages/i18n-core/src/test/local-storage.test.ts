/**
 * file local-storage.test.ts
 * description @yyc3/i18n-core local-storage.ts 单元测试
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
 * brief @yyc3/i18n-core local-storage.ts 单元测试
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { getSafeLocalStorage } from "../lib/local-storage.js";

describe("Safe localStorage Utility", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as Record<string, unknown>).window = originalWindow;
  });

  it("should return null when window is undefined (SSR)", () => {
    delete (globalThis as Record<string, unknown>).window;
    const result = getSafeLocalStorage();
    expect(result).toBeNull();
  });

  it("should return Storage when localStorage is accessible", () => {
    const mockStorage = {
      setItem: vi.fn(),
      removeItem: vi.fn(),
      getItem: vi.fn(),
    };
    (globalThis as Record<string, unknown>).window = {
      localStorage: mockStorage,
    };

    const result = getSafeLocalStorage();
    expect(result).toBe(mockStorage);
    expect(mockStorage.setItem).toHaveBeenCalledWith("__yyc3_test__", "test");
    expect(mockStorage.removeItem).toHaveBeenCalledWith("__yyc3_test__");
  });

  it("should return null when localStorage throws (private browsing)", () => {
    (globalThis as Record<string, unknown>).window = {
      localStorage: {
        setItem: vi.fn(() => {
          throw new Error("SecurityError");
        }),
        removeItem: vi.fn(),
        getItem: vi.fn(),
      },
    };

    const result = getSafeLocalStorage();
    expect(result).toBeNull();
  });

  it("should clean up test key after checking", () => {
    let storedKey: string | null = null;
    (globalThis as Record<string, unknown>).window = {
      localStorage: {
        setItem: vi.fn((_key: string) => {
          storedKey = _key;
        }),
        removeItem: vi.fn(() => {
          storedKey = null;
        }),
        getItem: vi.fn(),
      },
    };

    getSafeLocalStorage();
    expect(storedKey).toBeNull();
  });
});
