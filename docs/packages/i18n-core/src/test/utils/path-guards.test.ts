/**
 * file path-guards.test.ts
 * description @yyc3/i18n-core path-guards.ts 单元测试
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
 * brief @yyc3/i18n-core path-guards.ts 单元测试
 */
import { describe, expect, it } from "vitest";
import {
  hasNodeErrorCode,
  isNodeError,
  isNotFoundPathError,
  isPathInside,
  isSymlinkOpenError,
  normalizeWindowsPathForComparison,
} from "../../lib/utils/path-guards.js";

describe("Path Guards Utilities", () => {
  describe("isPathInside", () => {
    it("should return true for paths inside root", () => {
      expect(isPathInside("/root", "/root/file.txt")).toBe(true);
      expect(isPathInside("/root", "/root/sub/deep/file.txt")).toBe(true);
      expect(isPathInside("/root", "/root/..//root/./file")).toBe(true);
    });

    it("should return false for paths outside root", () => {
      expect(isPathInside("/root", "/other/file.txt")).toBe(false);
      expect(isPathInside("/root", "/root/../etc/passwd")).toBe(false);
      expect(isPathInside("/root", "/root/../../secret")).toBe(false);
    });

    it("should return true for same directory", () => {
      expect(isPathInside("/root", "/root")).toBe(true);
    });

    it("should handle relative paths", () => {
      expect(isPathInside("./src", "./src/utils.ts")).toBe(true);
      expect(isPathInside("./src", "../other")).toBe(false);
    });

    it("should handle edge cases with dots and slashes", () => {
      expect(isPathInside("/a/b/c", "/a/b/c/./file")).toBe(true);
      expect(isPathInside("/a/b/c", "/a/b/c/d/../file")).toBe(true);
      expect(isPathInside("/a/b", "/a/b/c/../../../x")).toBe(false);
    });

    it("should handle absolute target paths correctly", () => {
      expect(isPathInside("/root", "/absolute/path")).toBe(false);
      expect(isPathInside("/root", "/root/absolute")).toBe(true);
    });

    it("should handle root as current directory", () => {
      expect(isPathInside(".", "./file.txt")).toBe(true);
      expect(isPathInside("../outside", ".")).toBe(false);
    });
  });

  describe("normalizeWindowsPathForComparison", () => {
    it("should normalize backslashes and lowercase", () => {
      const result = normalizeWindowsPathForComparison(`C:\Users\Test\File.txt`);
      expect(result).toBe("c:userstestfile.txt");
    });

    it("should handle UNC paths", () => {
      const result = normalizeWindowsPathForComparison("\\\\?\\C:\\test");
      expect(result.toLowerCase()).toContain("c:\\test");
    });

    it("should handle forward slashes in Windows paths", () => {
      const result = normalizeWindowsPathForComparison("C:/Users/Test");
      expect(result).toBe("c:\\users\\test");
    });

    it("should handle UNC paths with UNC prefix stripping", () => {
      const result = normalizeWindowsPathForComparison("\\\\?\\UNC\\server\\share");
      expect(result).toContain("\\\\server\\share");
    });

    it("should handle empty path", () => {
      const result = normalizeWindowsPathForComparison("");
      expect(result).toBe(".");
    });
  });

  describe("isNodeError", () => {
    it("should identify Node.js errors with code property", () => {
      const error = new Error("test") as NodeJS.ErrnoException;
      error.code = "ENOENT";

      expect(isNodeError(error)).toBe(true);
    });

    it("should return false for non-objects", () => {
      expect(isNodeError(null)).toBe(false);
      expect(isNodeError(undefined)).toBe(false);
      expect(isNodeError("string")).toBe(false);
      expect(isNodeError(123)).toBe(false);
    });

    it("should return false for objects without code property", () => {
      expect(isNodeError({ message: "error" })).toBe(false);
      expect(isNodeError({})).toBe(false);
    });
  });

  describe("hasNodeErrorCode", () => {
    it("should check for specific error code", () => {
      const error = new Error("not found") as NodeJS.ErrnoException;
      error.code = "ENOENT";

      expect(hasNodeErrorCode(error, "ENOENT")).toBe(true);
      expect(hasNodeErrorCode(error, "EACCES")).toBe(false);
    });

    it("should return false for non-Node errors", () => {
      expect(hasNodeErrorCode("not an error", "ENOENT")).toBe(false);
      expect(hasNodeErrorCode(null, "ENOENT")).toBe(false);
    });
  });

  describe("isNotFoundPathError", () => {
    it("should detect ENOENT errors", () => {
      const error = new Error("file not found") as NodeJS.ErrnoException;
      error.code = "ENOENT";

      expect(isNotFoundPathError(error)).toBe(true);
    });

    it("should detect ENOTDIR errors", () => {
      const error = new Error("not a directory") as NodeJS.ErrnoException;
      error.code = "ENOTDIR";

      expect(isNotFoundPathError(error)).toBe(true);
    });

    it("should return false for other error codes", () => {
      const error = new Error("permission denied") as NodeJS.ErrnoException;
      error.code = "EACCES";

      expect(isNotFoundPathError(error)).toBe(false);
    });
  });

  describe("isSymlinkOpenError", () => {
    it("should detect ELOOP errors (symlink loop)", () => {
      const error = new Error("too many symlinks") as NodeJS.ErrnoException;
      error.code = "ELOOP";

      expect(isSymlinkOpenError(error)).toBe(true);
    });

    it("should detect EINVAL errors from symlinks", () => {
      const error = new Error("invalid argument") as NodeJS.ErrnoException;
      error.code = "EINVAL";

      expect(isSymlinkOpenError(error)).toBe(true);
    });

    it("should detect ENOTSUP errors", () => {
      const error = new Error("not supported") as NodeJS.ErrnoException;
      error.code = "ENOTSUP";

      expect(isSymlinkOpenError(error)).toBe(true);
    });

    it("should return false for other error codes", () => {
      const error = new Error("not found") as NodeJS.ErrnoException;
      error.code = "ENOENT";

      expect(isSymlinkOpenError(error)).toBe(false);
    });
  });
});
