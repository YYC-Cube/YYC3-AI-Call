/**
 * file quality-estimator.ts
 * description AI 翻译质量评估
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief AI 翻译质量评估
 */
import { logger } from "../infra/logger.js";

export type QESeverity = "critical" | "warning" | "info";

export interface QEIssue {
  ruleId: string;
  message: string;
  severity: QESeverity;
  position?: { start: number; end: number };
}

export interface QEResult {
  score: number;
  issues: QEIssue[];
  passed: boolean;
  details: {
    completeness: number;
    accuracy: number;
    fluency: number;
    consistency: number;
    glossaryCompliance: number;
  };
}

export interface QERule {
  id: string;
  name: string;
  description: string;
  severity: QESeverity;
  check(ctx: QEContext): QEIssue | null;
}

export interface QEContext {
  sourceText: string;
  translatedText: string;
  sourceLocale: string;
  targetLocale: string;
  glossary?: Record<string, string>;
  previousTranslations?: Map<string, string>;
}

export class QualityEstimator {
  private rules: QERule[] = [];
  private passThreshold: number;

  constructor(config?: { passThreshold?: number }) {
    this.passThreshold = config?.passThreshold ?? 85;
    this.registerBuiltinRules();
  }

  private registerBuiltinRules(): void {
    this.rules.push(
      {
        id: "empty-translation",
        name: "Empty Translation",
        description: "Translation must not be empty",
        severity: "critical",
        check: (ctx) => {
          if (!ctx.translatedText || ctx.translatedText.trim().length === 0) {
            return { ruleId: "empty-translation", message: "Translation is empty", severity: "critical" };
          }
          return null;
        },
      },
      {
        id: "source-leak",
        name: "Source Language Leak",
        description: "Translation should not contain untranslated source text",
        severity: "warning",
        check: (ctx) => {
          if (ctx.sourceText === ctx.translatedText && ctx.sourceLocale !== ctx.targetLocale) {
            return { ruleId: "source-leak", message: "Translation identical to source", severity: "warning" };
          }
          return null;
        },
      },
      {
        id: "placeholder-mismatch",
        name: "Placeholder Mismatch",
        description: "All placeholders in source must appear in translation",
        severity: "critical",
        check: (ctx) => {
          const sourcePlaceholders = ctx.sourceText.match(/\{[^}]+\}/g) ?? [];
          for (const ph of sourcePlaceholders) {
            if (!ctx.translatedText.includes(ph)) {
              return {
                ruleId: "placeholder-mismatch",
                message: `Missing placeholder: ${ph}`,
                severity: "critical",
              };
            }
          }
          return null;
        },
      },
      {
        id: "glossary-violation",
        name: "Glossary Violation",
        description: "Translation must comply with glossary terms",
        severity: "warning",
        check: (ctx) => {
          if (!ctx.glossary) return null;
          for (const [term, required] of Object.entries(ctx.glossary)) {
            if (ctx.sourceText.toLowerCase().includes(term.toLowerCase())) {
              if (!ctx.translatedText.includes(required)) {
                return {
                  ruleId: "glossary-violation",
                  message: `Glossary term "${term}" should be translated as "${required}"`,
                  severity: "warning",
                };
              }
            }
          }
          return null;
        },
      },
      {
        id: "length-anomaly",
        name: "Length Anomaly",
        description: "Translation length should be reasonably proportional to source",
        severity: "info",
        check: (ctx) => {
          const ratio = ctx.translatedText.length / Math.max(ctx.sourceText.length, 1);
          if (ratio > 3 || ratio < 0.2) {
            return {
              ruleId: "length-anomaly",
              message: `Translation length ratio ${ratio.toFixed(2)} is unusual`,
              severity: "info",
            };
          }
          return null;
        },
      },
      {
        id: "html-tag-preservation",
        name: "HTML Tag Preservation",
        description: "HTML tags in source must be preserved in translation",
        severity: "critical",
        check: (ctx) => {
          const sourceTags = ctx.sourceText.match(/<[^>]+>/g) ?? [];
          for (const tag of sourceTags) {
            if (!ctx.translatedText.includes(tag)) {
              return {
                ruleId: "html-tag-preservation",
                message: `Missing HTML tag: ${tag}`,
                severity: "critical",
              };
            }
          }
          return null;
        },
      }
    );
  }

  addRule(rule: QERule): void {
    this.rules.push(rule);
  }

  estimate(ctx: QEContext): QEResult {
    const issues: QEIssue[] = [];
    let penalty = 0;

    for (const rule of this.rules) {
      const issue = rule.check(ctx);
      if (issue) {
        issues.push(issue);
        switch (issue.severity) {
          case "critical": penalty += 25; break;
          case "warning": penalty += 10; break;
          case "info": penalty += 2; break;
        }
      }
    }

    const score = Math.max(0, 100 - penalty);
    const passed = score >= this.passThreshold;

    if (!passed) {
      logger.warn(`QE failed: score=${score}, threshold=${this.passThreshold}`);
    }

    return {
      score,
      issues,
      passed,
      details: {
        completeness: issues.some((i) => i.ruleId === "empty-translation") ? 0 : 100,
        accuracy: issues.some((i) => i.ruleId === "source-leak") ? 40 : 90,
        fluency: issues.some((i) => i.ruleId === "length-anomaly") ? 60 : 90,
        consistency: issues.some((i) => i.ruleId === "glossary-violation") ? 50 : 95,
        glossaryCompliance: issues.some((i) => i.ruleId === "glossary-violation") ? 0 : 100,
      },
    };
  }

  getRules(): QERule[] {
    return [...this.rules];
  }
}
