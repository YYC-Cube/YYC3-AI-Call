/**
 * file parser-compiler.test.ts
 * description @yyc3/i18n-core parser-compiler.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[i18n],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core parser-compiler.ts 单元测试
 */
import { describe, expect, it } from "vitest";
import { ICUCompiler } from "../../lib/icu/compiler.js";
import { ICUParser } from "../../lib/icu/parser.js";

function compile(input: string, params: Record<string, unknown>, locale = "en"): string {
  const parser = new ICUParser();
  const { nodes, errors } = parser.parse(input);
  expect(errors).toHaveLength(0);
  const compiler = new ICUCompiler();
  return compiler.compile(nodes, { locale, params });
}

describe("ICU Parser + Compiler", () => {
  describe("literal text", () => {
    it("should return literal text unchanged", () => {
      expect(compile("Hello World", {})).toBe("Hello World");
    });

    it("should handle empty string", () => {
      expect(compile("", {})).toBe("");
    });
  });

  describe("simple arguments", () => {
    it("should interpolate {name}", () => {
      expect(compile("Hello {name}", { name: "YYC³" })).toBe("Hello YYC³");
    });

    it("should interpolate multiple arguments", () => {
      expect(compile("{greeting} {name}!", { greeting: "Hi", name: "World" })).toBe("Hi World!");
    });

    it("should handle missing params gracefully", () => {
      expect(compile("Hello {name}", {})).toBe("Hello ");
    });
  });

  describe("plural", () => {
    it("should select 'one' for count 1", () => {
      const template = "{count, plural, one {# item} other {# items}}";
      expect(compile(template, { count: 1 })).toBe("1 item");
    });

    it("should select 'other' for count 5", () => {
      const template = "{count, plural, one {# item} other {# items}}";
      expect(compile(template, { count: 5 })).toBe("5 items");
    });

    it("should select 'zero' for count 0", () => {
      const template = "{count, plural, zero {no items} one {# item} other {# items}}";
      expect(compile(template, { count: 0 })).toBe("no items");
    });

    it("should handle exact match with =N", () => {
      const template = "{count, plural, =0 {nothing} =1 {one thing} other {# things}}";
      expect(compile(template, { count: 0 })).toBe("nothing");
      expect(compile(template, { count: 1 })).toBe("one thing");
      expect(compile(template, { count: 5 })).toBe("5 things");
    });
  });

  describe("select", () => {
    it("should select matching clause", () => {
      const template = "{gender, select, male {He said} female {She said} other {They said}}";
      expect(compile(template, { gender: "male" })).toBe("He said");
      expect(compile(template, { gender: "female" })).toBe("She said");
    });

    it("should fallback to 'other'", () => {
      const template = "{gender, select, male {He} other {They}}";
      expect(compile(template, { gender: "unknown" })).toBe("They");
    });
  });

  describe("selectOrdinal", () => {
    it("should work with ordinal patterns", () => {
      const template = "{rank, selectOrdinal, one {#st} two {#nd} few {#rd} other {#th}}";
      const result = compile(template, { rank: 4 }, "en");
      expect(result).toMatch(/4/);
    });
  });

  describe("number format", () => {
    it("should format numbers with Intl", () => {
      const result = compile("{value, number}", { value: 1234.5 }, "en");
      expect(result).toMatch(/1.*234.*5/);
    });
  });

  describe("date format", () => {
    it("should format dates", () => {
      const result = compile("{date, date, short}", { date: new Date(2026, 0, 15) }, "en");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("time format", () => {
    it("should format times", () => {
      const result = compile("{time, time, short}", { time: new Date(2026, 0, 15, 14, 30) }, "en");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Chinese locale plural", () => {
    it("should always use 'other' for Chinese", () => {
      const template = "{count, plural, other {# 个项目}}";
      expect(compile(template, { count: 0 }, "zh-CN")).toBe("0 个项目");
      expect(compile(template, { count: 1 }, "zh-CN")).toBe("1 个项目");
      expect(compile(template, { count: 5 }, "zh-CN")).toBe("5 个项目");
    });
  });

  describe("Arabic locale plural (6 forms)", () => {
    it("should handle Arabic plural rules", () => {
      const template = "{count, plural, zero {صفر} one {واحد} two {اثنان} few {قليل} many {كثير} other {#}}";
      expect(compile(template, { count: 0 }, "ar")).toBe("صفر");
      expect(compile(template, { count: 1 }, "ar")).toBe("واحد");
      expect(compile(template, { count: 2 }, "ar")).toBe("اثنان");
      expect(compile(template, { count: 5 }, "ar")).toBe("قليل");
      expect(compile(template, { count: 50 }, "ar")).toBe("كثير");
      expect(compile(template, { count: 150 }, "ar")).toBe("150");
    });
  });

  describe("nested arguments in clauses", () => {
    it("should interpolate arguments inside plural clauses", () => {
      const template = "{count, plural, one {{name} has # item} other {{name} has # items}}";
      expect(compile(template, { count: 1, name: "Alice" })).toBe("Alice has 1 item");
      expect(compile(template, { count: 3, name: "Bob" })).toBe("Bob has 3 items");
    });
  });

  describe("escaped apostrophes", () => {
    it("should handle escaped text", () => {
      expect(compile("It's a test", {})).toBe("It's a test");
    });
  });
});
