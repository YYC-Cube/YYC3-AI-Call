/**
 * file chinese-detector.test.ts
 * description @yyc3/i18n-core chinese-detector.ts 单元测试
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
 * brief @yyc3/i18n-core chinese-detector.ts 单元测试
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ChineseDetector } from "../../lib/cli/chinese-detector.js";

describe("ChineseDetector", () => {
  let detector: ChineseDetector;

  beforeEach(() => {
    detector = new ChineseDetector();
  });

  it("should detect files by extension", () => {
    expect(detector.canDetect("app.ts")).toBe(true);
    expect(detector.canDetect("app.tsx")).toBe(true);
    expect(detector.canDetect("app.js")).toBe(true);
    expect(detector.canDetect("app.jsx")).toBe(true);
    expect(detector.canDetect("app.vue")).toBe(true);
    expect(detector.canDetect("app.svelte")).toBe(true);
    expect(detector.canDetect("app.py")).toBe(false);
    expect(detector.canDetect("app.css")).toBe(false);
  });

  it("should detect Chinese in string literals", () => {
    const code = `const msg = "你好世界";`;
    const results = detector.detect(code, "test.ts");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].text).toContain("你好世界");
    expect(results[0].type).toBe("string-literal");
  });

  it("should detect Chinese in template literals", () => {
    const code = "const msg = `欢迎${name}`;";
    const results = detector.detect(code, "test.ts");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe("template-literal");
  });

  it("should skip lines without Chinese", () => {
    const code = 'const msg = "Hello World";';
    const results = detector.detect(code, "test.ts");
    expect(results).toHaveLength(0);
  });

  it("should report correct line numbers", () => {
    const code = 'const a = "Hello";\nconst b = "你好";\nconst c = "World";';
    const results = detector.detect(code, "test.ts");
    expect(results).toHaveLength(1);
    expect(results[0].line).toBe(2);
  });

  it("should detect multiple Chinese strings", () => {
    const code = 'const a = "你好";\nconst b = "世界";';
    const results = detector.detect(code, "test.ts");
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("should generate report for empty results", () => {
    const report = detector.generateReport([]);
    expect(report).toContain("No hardcoded Chinese");
  });

  it("should generate report for found results", () => {
    const results = [
      {
        file: "test.ts",
        line: 1,
        column: 1,
        text: "你好",
        type: "string-literal" as const,
      },
    ];
    const report = detector.generateReport(results);
    expect(report).toContain("1 hardcoded Chinese");
    expect(report).toContain("test.ts");
  });

  it("should support custom extensions", () => {
    const custom = new ChineseDetector({ extensions: [".py"] });
    expect(custom.canDetect("app.py")).toBe(true);
    expect(custom.canDetect("app.ts")).toBe(false);
  });
});
