/**
 * file quality-estimator.test.ts
 * description @yyc3/i18n-core quality-estimator.ts 单元测试
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
 * brief @yyc3/i18n-core quality-estimator.ts 单元测试
 */
import { beforeEach, describe, expect, it } from "vitest";
import { QualityEstimator, type QEContext } from "../../lib/ai/quality-estimator.js";

describe("QualityEstimator", () => {
  let qe: QualityEstimator;

  beforeEach(() => {
    qe = new QualityEstimator({ passThreshold: 85 });
  });

  function makeCtx(overrides: Partial<QEContext> = {}): QEContext {
    return {
      sourceText: "Hello {name}",
      translatedText: "你好 {name}",
      sourceLocale: "en",
      targetLocale: "zh-CN",
      ...overrides,
    };
  }

  describe("empty translation", () => {
    it("should flag empty translation as critical", () => {
      const result = qe.estimate(makeCtx({ translatedText: "" }));
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({ ruleId: "empty-translation", severity: "critical" })
      );
    });
  });

  describe("source leak", () => {
    it("should flag identical source and translation", () => {
      const result = qe.estimate(
        makeCtx({ sourceText: "Hello World", translatedText: "Hello World" })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({ ruleId: "source-leak" })
      );
    });

    it("should not flag when locales are same", () => {
      const result = qe.estimate(
        makeCtx({ sourceLocale: "en", targetLocale: "en", translatedText: "Hello World", sourceText: "Hello World" })
      );
      const leakIssue = result.issues.find((i) => i.ruleId === "source-leak");
      expect(leakIssue).toBeUndefined();
    });
  });

  describe("placeholder mismatch", () => {
    it("should flag missing placeholder", () => {
      const result = qe.estimate(
        makeCtx({ sourceText: "Hello {name}", translatedText: "你好" })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({ ruleId: "placeholder-mismatch", severity: "critical" })
      );
    });

    it("should pass when all placeholders preserved", () => {
      const result = qe.estimate(
        makeCtx({ sourceText: "{count} items", translatedText: "{count} 项" })
      );
      const phIssue = result.issues.find((i) => i.ruleId === "placeholder-mismatch");
      expect(phIssue).toBeUndefined();
    });
  });

  describe("glossary compliance", () => {
    it("should flag glossary violation", () => {
      const result = qe.estimate(
        makeCtx({
          sourceText: "YYC3 Framework",
          translatedText: "YYC3 框架",
          glossary: { Framework: "架构体系" },
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({ ruleId: "glossary-violation" })
      );
    });

    it("should pass when glossary terms are used", () => {
      const result = qe.estimate(
        makeCtx({
          sourceText: "YYC3 Framework",
          translatedText: "YYC3 架构体系",
          glossary: { Framework: "架构体系" },
        })
      );
      const gIssue = result.issues.find((i) => i.ruleId === "glossary-violation");
      expect(gIssue).toBeUndefined();
    });
  });

  describe("length anomaly", () => {
    it("should flag abnormally long translation", () => {
      const result = qe.estimate(
        makeCtx({
          sourceText: "OK",
          translatedText: "这是一个非常非常长的翻译结果完全超出了合理的比例范围",
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({ ruleId: "length-anomaly" })
      );
    });
  });

  describe("HTML tag preservation", () => {
    it("should flag missing HTML tags", () => {
      const result = qe.estimate(
        makeCtx({
          sourceText: '<b>Hello</b> {name}',
          translatedText: '你好 {name}',
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({ ruleId: "html-tag-preservation", severity: "critical" })
      );
    });

    it("should pass when HTML tags preserved", () => {
      const result = qe.estimate(
        makeCtx({
          sourceText: '<b>Hello</b> {name}',
          translatedText: '<b>你好</b> {name}',
        })
      );
      const tagIssue = result.issues.find((i) => i.ruleId === "html-tag-preservation");
      expect(tagIssue).toBeUndefined();
    });
  });

  describe("scoring", () => {
    it("should score 100 for perfect translation", () => {
      const result = qe.estimate(
        makeCtx({ sourceText: "Hello {name}", translatedText: "你好 {name}" })
      );
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });

    it("should fail when score below threshold", () => {
      const qeStrict = new QualityEstimator({ passThreshold: 99 });
      const result = qeStrict.estimate(
        makeCtx({
          sourceText: "Hello",
          translatedText: "",
        })
      );
      expect(result.passed).toBe(false);
    });
  });

  describe("custom rules", () => {
    it("should support adding custom rules", () => {
      qe.addRule({
        id: "no-profanity",
        name: "No Profanity",
        description: "Translation must not contain profanity",
        severity: "critical",
        check: (ctx) => {
          if (ctx.translatedText.includes("badword")) {
            return { ruleId: "no-profanity", message: "Contains profanity", severity: "critical" as const };
          }
          return null;
        },
      });

      const result = qe.estimate(
        makeCtx({ translatedText: "badword translation" })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({ ruleId: "no-profanity" })
      );
    });
  });

  describe("getRules", () => {
    it("should return all registered rules", () => {
      const rules = qe.getRules();
      expect(rules.length).toBeGreaterThanOrEqual(6);
    });
  });
});
