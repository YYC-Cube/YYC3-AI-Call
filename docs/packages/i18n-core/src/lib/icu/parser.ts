/**
 * file parser.ts
 * description ICU MessageFormat 解析器
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
 * brief ICU MessageFormat 解析器
 */
import type {
  ICUDate,
  ICUNode,
  ICUNumber,
  ICUParseError,
  ICUParseResult,
  ICUPlural,
  ICUPluralClause,
  ICUSelect,
  ICUSelectClause,
  ICUSelectOrdinal,
  ICUTime
} from "./types.js";

export class ICUParser {
  private pos = 0;
  private input = "";
  private errors: ICUParseError[] = [];

  parse(input: string): ICUParseResult {
    this.pos = 0;
    this.input = input;
    this.errors = [];
    const nodes = this.parseMessage();
    return { nodes, errors: this.errors };
  }

  private parseMessage(): ICUNode[] {
    const nodes: ICUNode[] = [];
    let literal = "";

    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];

      if (ch === "{") {
        if (literal) {
          nodes.push({ type: "literal", value: literal });
          literal = "";
        }
        this.pos++;
        const argNode = this.parseArgument();
        if (argNode) nodes.push(argNode);
      } else if (ch === "'") {
        this.pos++;
        const escaped = this.parseEscaped();
        literal += escaped;
      } else {
        literal += ch;
        this.pos++;
      }
    }

    if (literal) {
      nodes.push({ type: "literal", value: literal });
    }

    return nodes;
  }

  private parseEscaped(): string {
    if (this.pos < this.input.length && this.input[this.pos] === "'") {
      this.pos++;
      return "'";
    }
    let result = "";
    while (this.pos < this.input.length && this.input[this.pos] !== "'") {
      result += this.input[this.pos];
      this.pos++;
    }
    if (this.pos >= this.input.length) {
      return "'" + result;
    }
    if (this.pos < this.input.length) this.pos++;
    return result;
  }

  private parseArgument(): ICUNode | null {
    this.skipWhitespace();
    const name = this.parseIdentifier();
    if (!name) {
      this.errors.push({ message: "Expected argument name", position: this.pos });
      return null;
    }
    this.skipWhitespace();

    if (this.peek() === "}") {
      this.pos++;
      return { type: "argument", name };
    }

    if (this.peek() === ",") {
      this.pos++;
      this.skipWhitespace();
      return this.parseFormat(name);
    }

    this.errors.push({ message: `Unexpected character: ${this.peek()}`, position: this.pos });
    return null;
  }

  private parseFormat(name: string): ICUNode | null {
    const formatType = this.parseIdentifier();
    if (!formatType) {
      this.errors.push({ message: "Expected format type", position: this.pos });
      return null;
    }
    this.skipWhitespace();
    if (this.peek() === ",") {
      this.pos++;
    }
    this.skipWhitespace();

    switch (formatType) {
      case "plural":
        return this.parsePlural(name);
      case "select":
        return this.parseSelect(name);
      case "selectOrdinal":
        return this.parseSelectOrdinal(name);
      case "number":
        return this.parseNumber(name);
      case "date":
        return this.parseDate(name);
      case "time":
        return this.parseTime(name);
      default:
        this.errors.push({ message: `Unknown format type: ${formatType}`, position: this.pos });
        return null;
    }
  }

  private parsePlural(name: string): ICUPlural | null {
    let offset = 0;
    const clauses: ICUPluralClause[] = [];

    this.skipWhitespace();
    if (this.match("offset:")) {
      this.skipWhitespace();
      const offsetStr = this.parseNumberLiteral();
      offset = parseInt(offsetStr, 10) || 0;
      this.skipWhitespace();
    }

    while (this.pos < this.input.length && this.peek() !== "}") {
      const selector = this.parseSelector();
      if (!selector) break;
      this.skipWhitespace();
      if (this.peek() !== "{") {
        this.errors.push({ message: "Expected '{' after selector", position: this.pos });
        break;
      }
      this.pos++;
      const content = this.parseClauseContent();
      if (this.peek() === "}") this.pos++;
      clauses.push({ selector, content });
      this.skipWhitespace();
    }

    if (this.peek() === "}") this.pos++;
    return { type: "plural", name, offset, clauses };
  }

  private parseSelect(name: string): ICUSelect | null {
    return this.parseSelectLike(name, "select");
  }

  private parseSelectOrdinal(name: string): ICUSelectOrdinal | null {
    return this.parseSelectLike(name, "selectOrdinal") as unknown as ICUSelectOrdinal;
  }

  private parseSelectLike(name: string, kind: string): ICUSelect | null {
    const clauses: ICUSelectClause[] = [];

    while (this.pos < this.input.length && this.peek() !== "}") {
      const selector = this.parseSelector();
      if (!selector) break;
      this.skipWhitespace();
      if (this.peek() !== "{") {
        this.errors.push({ message: "Expected '{' after selector", position: this.pos });
        break;
      }
      this.pos++;
      const content = this.parseClauseContent();
      if (this.peek() === "}") this.pos++;
      clauses.push({ selector, content });
      this.skipWhitespace();
    }

    if (this.peek() === "}") this.pos++;
    return { type: kind === "selectOrdinal" ? "selectOrdinal" : "select", name, clauses } as ICUSelect;
  }

  private parseNumber(name: string): ICUNumber {
    this.skipWhitespace();
    let format: string | undefined;
    if (this.peek() !== "}") {
      format = this.parseIdentifier();
    }
    this.skipWhitespace();
    if (this.peek() === "}") this.pos++;
    return { type: "number", name, format };
  }

  private parseDate(name: string): ICUDate {
    this.skipWhitespace();
    let format: "short" | "medium" | "long" | "full" | undefined;
    if (this.peek() !== "}") {
      format = this.parseIdentifier() as ICUDate["format"];
    }
    this.skipWhitespace();
    if (this.peek() === "}") this.pos++;
    return { type: "date", name, format };
  }

  private parseTime(name: string): ICUTime {
    this.skipWhitespace();
    let format: "short" | "medium" | "long" | "full" | undefined;
    if (this.peek() !== "}") {
      format = this.parseIdentifier() as ICUTime["format"];
    }
    this.skipWhitespace();
    if (this.peek() === "}") this.pos++;
    return { type: "time", name, format };
  }

  private parseClauseContent(): ICUNode[] {
    const nodes: ICUNode[] = [];
    let literal = "";

    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];

      if (ch === "'") {
        this.pos++;
        literal += this.parseEscaped();
      } else if (ch === "#") {
        if (literal) {
          nodes.push({ type: "literal", value: literal });
          literal = "";
        }
        this.pos++;
        nodes.push({ type: "argument", name: "#" });
      } else if (ch === "{") {
        if (literal) {
          nodes.push({ type: "literal", value: literal });
          literal = "";
        }
        this.pos++;
        const arg = this.parseArgumentInner();
        if (arg) nodes.push(arg);
      } else if (ch === "}") {
        break;
      } else {
        literal += ch;
        this.pos++;
      }
    }

    if (literal) {
      nodes.push({ type: "literal", value: literal });
    }

    return nodes;
  }

  private parseArgumentInner(): ICUNode | null {
    this.skipWhitespace();
    if (this.peek() === "#") {
      this.pos++;
      if (this.peek() === "}") this.pos++;
      return { type: "argument", name: "#" };
    }
    const name = this.parseIdentifier();
    if (!name) return null;
    this.skipWhitespace();
    if (this.peek() === "}") {
      this.pos++;
      return { type: "argument", name };
    }
    if (this.peek() === ",") {
      this.pos++;
      this.skipWhitespace();
      return this.parseFormat(name);
    }
    return { type: "argument", name };
  }

  private parseSelector(): string {
    this.skipWhitespace();
    if (this.peek() === "=") {
      this.pos++;
      return "=" + this.parseNumberLiteral();
    }
    return this.parseIdentifier();
  }

  private parseNumberLiteral(): string {
    let result = "";
    if (this.peek() === "-") {
      result += "-";
      this.pos++;
    }
    while (this.pos < this.input.length && /\d/.test(this.input[this.pos]!)) {
      result += this.input[this.pos];
      this.pos++;
    }
    return result;
  }

  private parseIdentifier(): string {
    let result = "";
    while (this.pos < this.input.length && /[a-zA-Z0-9_-]/.test(this.input[this.pos]!)) {
      result += this.input[this.pos];
      this.pos++;
    }
    return result;
  }

  private peek(): string {
    return this.input[this.pos] ?? "";
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos]!)) {
      this.pos++;
    }
  }

  private match(s: string): boolean {
    if (this.input.substring(this.pos, this.pos + s.length) === s) {
      this.pos += s.length;
      return true;
    }
    return false;
  }
}
