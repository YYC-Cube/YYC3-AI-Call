/**
 * file dangerous-operations.test.ts
 * description @yyc3/i18n-core dangerous-operations.ts 单元测试
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
 * brief @yyc3/i18n-core dangerous-operations.ts 单元测试
 */
import { describe, expect, it } from "vitest";
import {
  DANGEROUS_OPERATION_NAMES,
  DANGEROUS_OPERATIONS_SET,
  getDangerousOperations,
  isDangerousOperation,
} from "../../lib/security/dangerous-operations.js";

describe("Dangerous Operations Detection", () => {
  describe("isDangerousOperation", () => {
    it("should detect known dangerous operations (lowercase)", () => {
      expect(isDangerousOperation("exec")).toBe(true);
      expect(isDangerousOperation("spawn")).toBe(true);
      expect(isDangerousOperation("shell")).toBe(true);
      expect(isDangerousOperation("fs_write")).toBe(true);
      expect(isDangerousOperation("fs_delete")).toBe(true);
      expect(isDangerousOperation("fs_move")).toBe(true);
      expect(isDangerousOperation("apply_patch")).toBe(true);
      expect(isDangerousOperation("eval")).toBe(true);
      expect(isDangerousOperation("function_constructor")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(isDangerousOperation("EXEC")).toBe(true);
      expect(isDangerousOperation("Exec")).toBe(true);
      expect(isDangerousOperation("Shell")).toBe(true);
      expect(isDangerousOperation("FS_WRITE")).toBe(true);
    });

    it("should return false for safe operations", () => {
      expect(isDangerousOperation("read")).toBe(false);
      expect(isDangerousOperation("write_log")).toBe(false);
      expect(isDangerousOperation("get_data")).toBe(false);
      expect(isDangerousOperation("validate")).toBe(false);
      expect(isDangerousOperation("")).toBe(false);
    });
  });

  describe("DANGEROUS_OPERATIONS_SET", () => {
    it("should contain all dangerous operation names", () => {
      DANGEROUS_OPERATION_NAMES.forEach((name) => {
        expect(DANGEROUS_OPERATIONS_SET.has(name.toLowerCase())).toBe(true);
      });
    });

    it("should be a Set instance", () => {
      expect(DANGEROUS_OPERATIONS_SET).toBeInstanceOf(Set);
    });
  });

  describe("getDangerousOperations", () => {
    it("should return readonly array of dangerous operations", () => {
      const ops = getDangerousOperations();
      expect(Array.isArray(ops)).toBe(true);
      expect(ops.length).toBeGreaterThan(0);

      expect(ops).toContain("exec");
      expect(ops).toContain("eval");
      expect(ops).toContain("fs_delete");
    });

    it("should match DANGEROUS_OPERATION_NAMES", () => {
      const ops = getDangerousOperations();
      expect(ops).toEqual([...DANGEROUS_OPERATION_NAMES]);
    });
  });
});
