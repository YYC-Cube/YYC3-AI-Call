/**
 * file json-file.test.ts
 * description @yyc3/i18n-core json-file.ts 单元测试
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
 * brief @yyc3/i18n-core json-file.ts 单元测试
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteJsonFile, jsonFileExists, loadJsonFile, saveJsonFile } from "../../lib/utils/json-file.js";

describe("JSON File Operations", () => {
  let testDir: string;

  beforeAll(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "yyc3-i18n-test-"));
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("saveJsonFile", () => {
    it("should create JSON file with proper formatting", () => {
      const filepath = path.join(testDir, "test.json");
      const data = { name: "test", value: 123 };

      saveJsonFile(filepath, data);

      const content = fs.readFileSync(filepath, "utf8");
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(data);
      expect(content.endsWith("\n")).toBe(true);
    });

    it("should create parent directories if they don't exist", () => {
      const filepath = path.join(testDir, "nested", "deep", "config.json");

      saveJsonFile(filepath, { created: true });

      expect(fs.existsSync(filepath)).toBe(true);
    });

    it("should set restrictive file permissions (0o600)", () => {
      const filepath = path.join(testDir, "secret.json");

      saveJsonFile(filepath, { secret: "value" });

      const stats = fs.statSync(filepath);
      expect(stats.mode & 0o777).toBe(0o600);
    });

    it("should overwrite existing files", () => {
      const filepath = path.join(testDir, "overwrite.json");

      saveJsonFile(filepath, { v: 1 });
      saveJsonFile(filepath, { v: 2 });

      const loaded = loadJsonFile<{ v: number }>(filepath);
      expect(loaded?.v).toBe(2);
    });
  });

  describe("loadJsonFile", () => {
    it("should load and parse existing JSON file", () => {
      const filepath = path.join(testDir, "load-test.json");
      const data = { items: [1, 2, 3], active: true };

      saveJsonFile(filepath, data);
      const loaded = loadJsonFile<typeof data>(filepath);

      expect(loaded).toEqual(data);
    });

    it("should return undefined for non-existent file", () => {
      const result = loadJsonFile("/nonexistent/path/file.json");
      expect(result).toBeUndefined();
    });

    it("should return undefined for malformed JSON", () => {
      const filepath = path.join(testDir, "malformed.json");
      fs.writeFileSync(filepath, "{ invalid json }", "utf8");

      const result = loadJsonFile(filepath);
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty file", () => {
      const filepath = path.join(testDir, "empty.json");
      fs.writeFileSync(filepath, "", "utf8");

      const result = loadJsonFile(filepath);
      expect(result).toBeUndefined();
    });

    it("should support generic type parameter", () => {
      interface Config {
        port: number;
        host: string;
        debug?: boolean;
      }

      const filepath = path.join(testDir, "typed.json");
      const config: Config = { port: 3000, host: "localhost" };

      saveJsonFile(filepath, config);
      const loaded = loadJsonFile<Config>(filepath);

      expect(loaded?.port).toBe(3000);
      expect(loaded?.host).toBe("localhost");
    });
  });

  describe("jsonFileExists", () => {
    it("should return true for existing files", () => {
      const filepath = path.join(testDir, "exists.json");
      saveJsonFile(filepath, {});

      expect(jsonFileExists(filepath)).toBe(true);
    });

    it("should return false for non-existent files", () => {
      expect(jsonFileExists("/nonexistent/file.json")).toBe(false);
    });
  });

  describe("deleteJsonFile", () => {
    it("should delete existing file and return true", () => {
      const filepath = path.join(testDir, "delete-me.json");
      saveJsonFile(filepath, {});

      const result = deleteJsonFile(filepath);

      expect(result).toBe(true);
      expect(fs.existsSync(filepath)).toBe(false);
    });

    it("should return false for non-existent file", () => {
      const result = deleteJsonFile("/nonexistent/file.json");
      expect(result).toBe(false);
    });
  });

  describe("Integration: Full CRUD Workflow", () => {
    it("should support create-read-update-delete cycle", () => {
      const filepath = path.join(testDir, "crud.json");

      expect(jsonFileExists(filepath)).toBe(false);

      saveJsonFile(filepath, { step: 1 });
      expect(jsonFileExists(filepath)).toBe(true);

      const loaded1 = loadJsonFile<{ step: number }>(filepath);
      expect(loaded1?.step).toBe(1);

      saveJsonFile(filepath, { step: 2, updated: true });
      const loaded2 = loadJsonFile(filepath);
      expect(loaded2).toEqual({ step: 2, updated: true });

      expect(deleteJsonFile(filepath)).toBe(true);
      expect(jsonFileExists(filepath)).toBe(false);
      expect(loadJsonFile(filepath)).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in data", () => {
      const filepath = path.join(testDir, "special-chars.json");
      const data = {
        unicode: "你好世界",
        emoji: "🎉",
        special: "line\nbreak\ttab\rreturn",
        nullValue: null,
        nested: { arr: [1, "two", null] },
      };

      saveJsonFile(filepath, data);
      const loaded = loadJsonFile<typeof data>(filepath);
      expect(loaded).toEqual(data);
    });

    it("should handle large nested objects", () => {
      const filepath = path.join(testDir, "large.json");
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` })),
        metadata: { created: new Date().toISOString(), version: "1.0.0" },
      };

      saveJsonFile(filepath, largeData);
      const loaded = loadJsonFile<typeof largeData>(filepath);
      expect(loaded?.items.length).toBe(100);
    });

    it("should handle arrays as root data", () => {
      const filepath = path.join(testDir, "array-root.json");
      const data = [1, 2, 3, "four", null];

      saveJsonFile(filepath, data);
      const loaded = loadJsonFile<typeof data>(filepath);
      expect(loaded).toEqual(data);
    });

    it("should handle primitive values", () => {
      const filepath = path.join(testDir, "primitive.json");

      saveJsonFile(filepath, "simple string");
      expect(loadJsonFile<string>(filepath)).toBe("simple string");

      saveJsonFile(filepath, 42);
      expect(loadJsonFile<number>(filepath)).toBe(42);

      saveJsonFile(filepath, true);
      expect(loadJsonFile<boolean>(filepath)).toBe(true);
    });

    it("should return undefined for file with only whitespace", () => {
      const filepath = path.join(testDir, "whitespace.json");
      fs.writeFileSync(filepath, "   \n   \t   ", "utf8");

      expect(loadJsonFile(filepath)).toBeUndefined();
    });

    it("should handle deeply nested directory creation", () => {
      const filepath = path.join(testDir, "a", "b", "c", "d", "e", "deep.json");
      saveJsonFile(filepath, { deep: true });

      expect(fs.existsSync(filepath)).toBe(true);
      expect(loadJsonFile(filepath)).toEqual({ deep: true });
    });
  });
});
