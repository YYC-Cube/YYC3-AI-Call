/**
 * file compiler.ts
 * description ICU MessageFormat 编译器
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[i18n]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief ICU MessageFormat 编译器
 */
import type { ICUNode, ICUPlural, ICUSelect, ICUSelectOrdinal } from "./types.js";

export interface ICUCompileContext {
  locale: string;
  params: Record<string, unknown>;
  pluralRule?: (locale: string, count: number) => string;
  formatNumber?: (locale: string, value: number, format?: string) => string;
  formatDate?: (locale: string, value: Date, format?: string) => string;
  formatTime?: (locale: string, value: Date, format?: string) => string;
}

const PLURAL_RULES: Record<string, (n: number) => string> = {
  en: (n) => {
    const abs = Math.abs(n);
    if (abs === 0) return "zero";
    if (abs === 1) return "one";
    if (abs === 2) return "two";
    return "other";
  },
  zh: () => "other",
  ja: () => "other",
  ko: () => "other",
  fr: (n) => {
    if (n === 0 || n === 1) return "one";
    return "other";
  },
  de: (n) => {
    if (n === 1) return "one";
    return "other";
  },
  es: (n) => {
    if (n === 1) return "one";
    return "other";
  },
  pt: (n) => {
    if (n >= 0 && n <= 2) return n === 2 ? "two" : "one";
    return "other";
  },
  ar: (n) => {
    const abs = Math.abs(n);
    if (abs === 0) return "zero";
    if (abs === 1) return "one";
    if (abs === 2) return "two";
    if (abs >= 3 && abs <= 10) return "few";
    if (abs >= 11 && abs <= 99) return "many";
    return "other";
  },
};

function defaultPluralRule(locale: string, count: number): string {
  const prefix = locale.split("-")[0]?.toLowerCase() ?? "en";
  const rule = PLURAL_RULES[prefix];
  if (!rule) {
    const fallback = PLURAL_RULES["en"];
    return fallback ? fallback(count) : "other";
  }
  return rule(count);
}

export class ICUCompiler {
  compile(nodes: ICUNode[], ctx: ICUCompileContext): string {
    return nodes.map((node) => this.compileNode(node, ctx)).join("");
  }

  private compileNode(node: ICUNode, ctx: ICUCompileContext): string {
    switch (node.type) {
      case "literal":
        return node.value;
      case "argument":
        return String(ctx.params[node.name] ?? "");
      case "plural":
        return this.compilePlural(node, ctx);
      case "select":
        return this.compileSelect(node, ctx);
      case "selectOrdinal":
        return this.compileSelectOrdinal(node, ctx);
      case "number":
        return this.compileNumber(node, ctx);
      case "date":
        return this.compileDate(node, ctx);
      case "time":
        return this.compileTime(node, ctx);
      default:
        return "";
    }
  }

  private compilePlural(node: ICUPlural, ctx: ICUCompileContext): string {
    const rawCount = ctx.params[node.name];
    const count = Number(rawCount) || 0;
    const displayCount = count - node.offset;

    for (const clause of node.clauses) {
      if (clause.selector.startsWith("=")) {
        const exactValue = parseInt(clause.selector.substring(1), 10);
        if (displayCount === exactValue) {
          return this.compileWithCount(clause.content, displayCount, ctx);
        }
      }
    }

    const pluralRule = ctx.pluralRule ?? defaultPluralRule;
    const category = pluralRule(ctx.locale, displayCount);

    for (const clause of node.clauses) {
      if (clause.selector === category) {
        return this.compileWithCount(clause.content, displayCount, ctx);
      }
    }

    const otherClause = node.clauses.find((c) => c.selector === "other");
    if (otherClause) {
      return this.compileWithCount(otherClause.content, displayCount, ctx);
    }

    return String(displayCount);
  }

  private compileSelect(node: ICUSelect, ctx: ICUCompileContext): string {
    const value = String(ctx.params[node.name] ?? "");

    for (const clause of node.clauses) {
      if (clause.selector === value) {
        return this.compile(clause.content, ctx);
      }
    }

    const otherClause = node.clauses.find((c) => c.selector === "other");
    if (otherClause) {
      return this.compile(otherClause.content, ctx);
    }

    return value;
  }

  private compileSelectOrdinal(node: ICUSelectOrdinal, ctx: ICUCompileContext): string {
    const rawCount = ctx.params[node.name];
    const count = Number(rawCount) || 0;

    const pluralRule = ctx.pluralRule ?? defaultPluralRule;
    const category = pluralRule(ctx.locale, count);

    for (const clause of node.clauses) {
      if (clause.selector === category || clause.selector === String(count)) {
        return this.compileWithCount(clause.content, count, ctx);
      }
    }

    const otherClause = node.clauses.find((c) => c.selector === "other");
    if (otherClause) {
      return this.compileWithCount(otherClause.content, count, ctx);
    }

    return String(count);
  }

  private compileWithCount(nodes: ICUNode[], count: number, ctx: ICUCompileContext): string {
    return nodes
      .map((node) => {
        if (node.type === "argument" && node.name === "#") {
          return String(count);
        }
        return this.compileNode(node, ctx);
      })
      .join("");
  }

  private compileNumber(node: { name: string; format?: string }, ctx: ICUCompileContext): string {
    const value = Number(ctx.params[node.name]);
    if (isNaN(value)) return String(ctx.params[node.name] ?? "");

    if (ctx.formatNumber) {
      return ctx.formatNumber(ctx.locale, value, node.format);
    }

    try {
      return new Intl.NumberFormat(ctx.locale).format(value);
    } catch {
      return String(value);
    }
  }

  private compileDate(
    node: { name: string; format?: "short" | "medium" | "long" | "full" },
    ctx: ICUCompileContext
  ): string {
    const raw = ctx.params[node.name];
    const value = raw instanceof Date ? raw : new Date(String(raw));
    if (isNaN(value.getTime())) return String(raw ?? "");

    if (ctx.formatDate) {
      return ctx.formatDate(ctx.locale, value, node.format);
    }

    try {
      return new Intl.DateTimeFormat(ctx.locale, { dateStyle: node.format ?? "medium" }).format(value);
    } catch {
      return value.toLocaleDateString(ctx.locale);
    }
  }

  private compileTime(
    node: { name: string; format?: "short" | "medium" | "long" | "full" },
    ctx: ICUCompileContext
  ): string {
    const raw = ctx.params[node.name];
    const value = raw instanceof Date ? raw : new Date(String(raw));
    if (isNaN(value.getTime())) return String(raw ?? "");

    if (ctx.formatTime) {
      return ctx.formatTime(ctx.locale, value, node.format);
    }

    try {
      return new Intl.DateTimeFormat(ctx.locale, { timeStyle: node.format ?? "medium" }).format(value);
    } catch {
      return value.toLocaleTimeString(ctx.locale);
    }
  }
}
