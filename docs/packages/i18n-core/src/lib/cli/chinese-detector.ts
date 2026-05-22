/**
 * file chinese-detector.ts
 * description 中文检测器
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
 * brief 中文检测器
 */
export interface DetectionResult {
  file: string;
  line: number;
  column: number;
  text: string;
  type: "string-literal" | "template-literal" | "jsx-text" | "comment";
}

const CJK_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

const STRING_LITERAL_PATTERNS = [
  /(['"`])([^'"`]*[\u4e00-\u9fff][^'"`]*)\1/g,
  /`([^`]*[\u4e00-\u9fff][^`]*)`/g,
];

const IGNORE_PATTERNS = [
  /^[\s]*\/\/.*$/,
  /^[\s]*\*.*$/,
  /^[\s]*<!--.*-->$/,
  /console\.(log|warn|error|info|debug)\s*\(/,
  /import\s+/,
  /export\s+/,
  /\/\/\s*@/,
  /\/\//,
];

export class ChineseDetector {
  private ignorePatterns: RegExp[];
  private fileExtensions: Set<string>;

  constructor(config?: {
    ignorePatterns?: RegExp[];
    extensions?: string[];
  }) {
    this.ignorePatterns = config?.ignorePatterns ?? IGNORE_PATTERNS;
    this.fileExtensions = new Set(
      config?.extensions ?? [".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"]
    );
  }

  canDetect(filePath: string): boolean {
    const ext = filePath.substring(filePath.lastIndexOf("."));
    return this.fileExtensions.has(ext);
  }

  detect(content: string, filePath: string): DetectionResult[] {
    const results: DetectionResult[] = [];
    const lines = content.split("\n");

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]!;
      if (!line) continue;

      if (!CJK_PATTERN.test(line)) continue;

      const shouldIgnore = this.ignorePatterns.some((p) => p.test(line));
      if (shouldIgnore) continue;

      for (const pattern of STRING_LITERAL_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          const text = match[2] ?? match[1] ?? match[0] ?? "";
          if (!CJK_PATTERN.test(text)) continue;

          results.push({
            file: filePath,
            line: lineIdx + 1,
            column: match.index + 1,
            text: text.trim(),
            type: match[0].startsWith("`") ? "template-literal" : "string-literal",
          });
        }
      }
    }

    return results;
  }

  generateReport(results: DetectionResult[]): string {
    if (results.length === 0) {
      return "✅ No hardcoded Chinese strings detected.";
    }

    const grouped = new Map<string, DetectionResult[]>();
    for (const r of results) {
      const existing = grouped.get(r.file) ?? [];
      existing.push(r);
      grouped.set(r.file, existing);
    }

    let report = `🔍 Found ${results.length} hardcoded Chinese string(s) in ${grouped.size} file(s):\n\n`;

    for (const [file, detections] of grouped) {
      report += `📄 ${file}\n`;
      for (const d of detections) {
        report += `   Line ${d.line}:${d.column} — "${d.text}" (${d.type})\n`;
      }
      report += "\n";
    }

    report += `\n💡 Tip: Extract these to translation keys using t('key')`;

    return report;
  }
}
