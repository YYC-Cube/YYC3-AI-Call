/**
 * @file ai/ErrorAnalyzer.ts
 * @description 静态错误分析引擎，对 FileStore 中的文件执行 25+ 条规则检测，
 *              支持 TypeScript / React / Tailwind / 可访问性 / 性能反模式，
 *              每条规则可产出 severity + message + autoFix
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,error-analysis,diagnostics,static-analysis,autofix
 */

// ===================================================================
//  ErrorAnalyzer — 静态错误分析引擎
//  对 FileStore 中的文件执行 25+ 条规则检测, 支持:
//    TypeScript / React / Tailwind / 可访问性 / 性能反模式
//  每条规则可产出: severity + message + autoFix (可选代码变换)
// ===================================================================

// ── 诊断类型 ──

export type DiagnosticSeverity = "error" | "warning" | "info" | "hint";

export type DiagnosticCategory =
  | "typescript"
  | "react"
  | "hooks"
  | "imports"
  | "performance"
  | "accessibility"
  | "style"
  | "security"
  | "best-practice";

export interface Diagnostic {
  id: string;
  ruleId: string;
  filepath: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  message: string;
  suggestion?: string; // 人类可读的修复建议
  autoFix?: AutoFix; // 可自动应用的修复
}

export interface AutoFix {
  description: string;
  /** 替换的行范围 (1-based, inclusive) */
  range: { startLine: number; endLine: number };
  /** 替换后的文本 */
  replacement: string;
}

export interface AnalysisResult {
  filepath: string;
  diagnostics: Diagnostic[];
  analyzedAt: number;
}

export interface ProjectAnalysisResult {
  files: AnalysisResult[];
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  totalHints: number;
  analyzedAt: number;
}

// ── 规则定义 ──

interface AnalysisRule {
  id: string;
  name: string;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  /** 仅对指定扩展名的文件运行 (null = 所有) */
  fileExtensions: string[] | null;
  /** 运行规则, 返回诊断列表 */
  check: (
    filepath: string,
    content: string,
    lines: string[],
  ) => Omit<
    Diagnostic,
    "id" | "ruleId" | "filepath" | "severity" | "category"
  >[];
}

// ── ID 生成器 ──

let _diagId = 0;
function nextDiagId(): string {
  return `diag-${++_diagId}-${Date.now().toString(36)}`;
}

// ===================================================================
//  规则注册表 — 25+ 条静态分析规则
// ===================================================================

const RULES: AnalysisRule[] = [
  // ─── TypeScript Rules ───

  {
    id: "ts-any-usage",
    name: "避免使用 any 类型",
    category: "typescript",
    severity: "warning",
    fileExtensions: [".ts", ".tsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        // Match `: any`, `as any`, `<any>` but not in comments
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        const matches = [...line.matchAll(/(?::|\bas\b|<)\s*any\b/g)];
        for (const m of matches) {
          results.push({
            line: i + 1,
            column: (m.index ?? 0) + 1,
            message: "避免使用 `any` 类型，请使用更精确的类型定义",
            suggestion:
              "将 `any` 替换为具体类型，如 `unknown`、`Record<string, unknown>` 或定义接口",
          });
        }
      });
      return results;
    },
  },

  {
    id: "ts-non-null-assertion",
    name: "避免非空断言操作符",
    category: "typescript",
    severity: "info",
    fileExtensions: [".ts", ".tsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        // Match foo! but not !== or !=
        const matches = [...line.matchAll(/\w+!(?!\s*=)/g)];
        for (const m of matches) {
          const text = m[0];
          // Exclude common false positives
          if (text === "if!" || text === "while!") continue;
          results.push({
            line: i + 1,
            column: (m.index ?? 0) + 1,
            message: `非空断言 \`${text}\` 可能隐藏运行时错误`,
            suggestion: "使用可选链 `?.` 或条件判断替代非空断言",
          });
        }
      });
      return results;
    },
  },

  {
    id: "ts-console-log",
    name: "生产代码中的 console.log",
    category: "best-practice",
    severity: "info",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//")) return;
        if (/console\.(log|debug|info)\s*\(/.test(line)) {
          results.push({
            line: i + 1,
            column: line.indexOf("console") + 1,
            message: "生产代码中不应保留 `console.log` 调用",
            suggestion: "移除 console.log 或使用项目日志系统",
            autoFix: {
              description: "删除此行",
              range: { startLine: i + 1, endLine: i + 1 },
              replacement: "",
            },
          });
        }
      });
      return results;
    },
  },

  {
    id: "ts-todo-fixme",
    name: "未解决的 TODO/FIXME 注释",
    category: "best-practice",
    severity: "hint",
    fileExtensions: null,
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        const match = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[\s:]/i);
        if (match) {
          results.push({
            line: i + 1,
            column: (match.index ?? 0) + 1,
            message: `未解决的 ${match[1].toUpperCase()} 注释`,
            suggestion: `处理此 ${match[1].toUpperCase()} 或创建对应的工作项跟踪`,
          });
        }
      });
      return results;
    },
  },

  // ─── React Rules ───

  {
    id: "react-missing-key",
    name: "列表渲染缺少 key 属性",
    category: "react",
    severity: "error",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      // Detect .map() calls that return JSX without key
      const mapBlocks = [
        ...content.matchAll(
          /\.map\s*\(\s*(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>\s*(?:\{[\s\S]*?\}|\([\s\S]*?\)|<[\s\S]*?>)/g,
        ),
      ];
      for (const m of mapBlocks) {
        const block = m[0];
        // Check if block contains JSX opening tag without key
        if (
          /<\w/.test(block) &&
          !block.includes("key=") &&
          !block.includes("key:")
        ) {
          const offset = m.index ?? 0;
          const lineNum = content.slice(0, offset).split("\n").length;
          results.push({
            line: lineNum,
            column: 1,
            message: "列表渲染中的元素缺少 `key` 属性",
            suggestion: "为 .map() 返回的每个元素添加唯一的 `key` 属性",
          });
        }
      }
      return results;
    },
  },

  {
    id: "react-direct-state-mutation",
    name: "直接修改 state",
    category: "react",
    severity: "error",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        // Detect patterns like `state.foo = ...` or `this.state.foo = ...`
        if (
          /(?:this\.)?state\.\w+\s*=\s*(?!==)/.test(line) &&
          !line.trimStart().startsWith("//")
        ) {
          results.push({
            line: i + 1,
            column: line.indexOf("state") + 1,
            message: "不要直接修改 state，请使用 setState 或 Zustand set()",
            suggestion: "使用 setState 函数或 Zustand 的 set() 更新状态",
          });
        }
      });
      return results;
    },
  },

  {
    id: "react-missing-deps",
    name: "useEffect/useMemo/useCallback 可能缺少依赖",
    category: "hooks",
    severity: "warning",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      // Find hooks with empty dependency arrays that reference external variables
      const hookPattern =
        /\b(useEffect|useMemo|useCallback)\s*\(\s*(?:\(\)\s*=>|function)/g;
      let match;
      while ((match = hookPattern.exec(content)) !== null) {
        const hookName = match[1];
        const startOffset = match.index;
        const lineNum = content.slice(0, startOffset).split("\n").length;

        // Look ahead for the dependency array
        const afterHook = content.slice(startOffset, startOffset + 500);
        if (/,\s*\[\s*\]\s*\)/.test(afterHook)) {
          // Empty dependency array found — check if hook body uses variables
          const bodyMatch = afterHook.match(/=>\s*\{([\s\S]*?)\}/);
          if (bodyMatch) {
            const body = bodyMatch[1];
            // Simple heuristic: if body contains variable names that look like state/props
            const suspects = body.match(
              /\b(props|state|dispatch|navigate|set\w+)\b/g,
            );
            if (suspects && suspects.length > 0) {
              results.push({
                line: lineNum,
                column: 1,
                message: `\`${hookName}(fn, [])\` 依赖数组为空，但函数体引用了外部变量: ${[...new Set(suspects)].join(", ")}`,
                suggestion: `将引用的外部变量添加到 ${hookName} 的依赖数组中`,
              });
            }
          }
        }
      }
      return results;
    },
  },

  {
    id: "react-hooks-conditional",
    name: "条件语句中调用 Hook",
    category: "hooks",
    severity: "error",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      let insideIf = 0;
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        if (/^if\s*\(/.test(trimmed) || /^else\s*\{/.test(trimmed)) insideIf++;
        if (trimmed === "}") insideIf = Math.max(0, insideIf - 1);

        if (
          insideIf > 0 &&
          /\buse[A-Z]\w*\s*\(/.test(trimmed) &&
          !trimmed.startsWith("//")
        ) {
          results.push({
            line: i + 1,
            column: 1,
            message: "Hook 不能在条件语句内调用（违反 Rules of Hooks）",
            suggestion: "将 Hook 移到组件顶层，使用条件逻辑包裹其返回值",
          });
        }
      });
      return results;
    },
  },

  {
    id: "react-inline-style-object",
    name: "JSX 中的内联 style 对象",
    category: "performance",
    severity: "info",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        if (/style=\{\{/.test(line) && !line.trimStart().startsWith("//")) {
          results.push({
            line: i + 1,
            column: line.indexOf("style={{") + 1,
            message: "内联 style 对象会导致每次渲染创建新对象，影响性能",
            suggestion: "将 style 对象提取到组件外部或使用 useMemo 缓存",
          });
        }
      });
      return results;
    },
  },

  {
    id: "react-fragment-unnecessary",
    name: "不必要的 Fragment 嵌套",
    category: "react",
    severity: "hint",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, _lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      // Detect <React.Fragment> or <> with single child
      const fragPattern =
        /(<>|<React\.Fragment>)\s*\n\s*(<\w[^]*?\/?>)\s*\n\s*(<\/>|<\/React\.Fragment>)/g;
      let match;
      while ((match = fragPattern.exec(content)) !== null) {
        const inner = match[2].trim();
        // Single child — fragment is unnecessary
        if (!inner.includes("\n") || (inner.match(/<\w/g) || []).length <= 1) {
          const lineNum = content.slice(0, match.index).split("\n").length;
          results.push({
            line: lineNum,
            column: 1,
            message: "Fragment 只包含一个子元素，可以直接返回该元素",
            suggestion: "移除不必要的 <> 或 <React.Fragment> 包裹",
          });
        }
      }
      return results;
    },
  },

  // ─── Import Rules ───

  {
    id: "import-duplicate",
    name: "重复导入",
    category: "imports",
    severity: "warning",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      const importSources = new Map<string, number>();

      lines.forEach((line, i) => {
        const match = line.match(
          /^import\s+.*\s+from\s+['"](.+?)['"]\s*;?\s*$/,
        );
        if (match) {
          const source = match[1];
          if (importSources.has(source)) {
            results.push({
              line: i + 1,
              column: 1,
              message: `从 '${source}' 的重复导入，首次出现在第 ${importSources.get(source)! + 1} 行`,
              suggestion: "合并来自相同模块的导入语句",
            });
          } else {
            importSources.set(source, i);
          }
        }
      });
      return results;
    },
  },

  {
    id: "import-no-default-react",
    name: "React 17+ 不需要默认导入 React",
    category: "imports",
    severity: "hint",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        if (/^import\s+React\s+from\s+['"]react['"]/.test(line.trim())) {
          results.push({
            line: i + 1,
            column: 1,
            message:
              "React 17+ 自动注入 JSX 转换，无需 `import React from 'react'`",
            suggestion: "改为 `import { ... } from 'react'` 仅导入需要的 API",
          });
        }
      });
      return results;
    },
  },

  // ─── Performance Rules ───

  {
    id: "perf-large-inline-array",
    name: "渲染中创建大型内联数组/对象",
    category: "performance",
    severity: "warning",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, _lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      // Detect large array literals inside return/JSX
      const returnIdx = content.indexOf("return (");
      if (returnIdx === -1) return results;

      const jsxPart = content.slice(returnIdx);
      const arrayMatches = [
        ...jsxPart.matchAll(/\{[\s\n]*\[[\s\S]{200,}?\][\s\n]*\}/g),
      ];
      for (const m of arrayMatches) {
        const lineNum = content
          .slice(0, returnIdx + (m.index ?? 0))
          .split("\n").length;
        results.push({
          line: lineNum,
          column: 1,
          message: "在 JSX 中内联大型数组/对象会导致每次渲染重新创建",
          suggestion: "将数据提取到组件外部常量或使用 useMemo 缓存",
        });
      }
      return results;
    },
  },

  {
    id: "perf-anonymous-component",
    name: "匿名组件在 JSX 中直接定义",
    category: "performance",
    severity: "warning",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        // Detect patterns like <Component render={() => <div>...} />
        if (
          /=\{\s*\(\)\s*=>\s*</.test(line) &&
          !line.trimStart().startsWith("//")
        ) {
          results.push({
            line: i + 1,
            column: 1,
            message: "在 JSX 属性中定义匿名渲染函数会导致子组件不必要的重渲染",
            suggestion: "将渲染函数提取为独立组件或使用 useCallback 包裹",
          });
        }
      });
      return results;
    },
  },

  {
    id: "perf-index-as-key",
    name: "使用数组索引作为 key",
    category: "performance",
    severity: "warning",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        // Detect key={index} or key={i} patterns in .map context
        if (
          /key=\{(?:index|i|idx|j)\}/.test(line) &&
          !line.trimStart().startsWith("//")
        ) {
          results.push({
            line: i + 1,
            column: line.search(/key=\{/) + 1,
            message: "使用数组索引作为 key 在列表变动时会导致不正确的渲染",
            suggestion: "使用数据项的唯一 ID 作为 key",
          });
        }
      });
      return results;
    },
  },

  // ─── Accessibility Rules ───

  {
    id: "a11y-img-alt",
    name: "图片缺少 alt 属性",
    category: "accessibility",
    severity: "warning",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        // <img without alt
        if (
          /<img\b/.test(line) &&
          !/alt=/.test(line) &&
          !line.trimStart().startsWith("//")
        ) {
          results.push({
            line: i + 1,
            column: line.indexOf("<img") + 1,
            message: "`<img>` 元素缺少 `alt` 属性，影响无障碍访问",
            suggestion:
              '添加描述性的 `alt` 属性，或使用 `alt=""` 标记装饰性图片',
          });
        }
      });
      return results;
    },
  },

  {
    id: "a11y-button-type",
    name: "button 缺少 type 属性",
    category: "accessibility",
    severity: "hint",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        if (
          /<button\b/.test(line) &&
          !/type=/.test(line) &&
          !line.trimStart().startsWith("//")
        ) {
          results.push({
            line: i + 1,
            column: line.indexOf("<button") + 1,
            message:
              "`<button>` 缺少 `type` 属性，默认为 `submit` 可能导致意外表单提交",
            suggestion: '显式添加 `type="button"` 或 `type="submit"`',
          });
        }
      });
      return results;
    },
  },

  {
    id: "a11y-click-handler-no-keyboard",
    name: "onClick 无键盘事件处理",
    category: "accessibility",
    severity: "info",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        // div/span with onClick but no onKeyDown/onKeyPress/role
        if (/<(?:div|span)\b/.test(line) && /onClick=/.test(line)) {
          // Check this line and nearby lines for keyboard handling
          const nearby = lines.slice(Math.max(0, i - 1), i + 3).join(" ");
          if (
            !/onKey(?:Down|Press|Up)=/.test(nearby) &&
            !/role=/.test(nearby) &&
            !/tabIndex=/.test(nearby)
          ) {
            results.push({
              line: i + 1,
              column: 1,
              message:
                "交互式 `<div>`/`<span>` 使用 onClick 但缺少键盘事件处理",
              suggestion:
                '添加 `role="button"` + `tabIndex={0}` + `onKeyDown` 处理，或改用 `<button>`',
            });
          }
        }
      });
      return results;
    },
  },

  // ─── Style Rules ───

  {
    id: "style-hardcoded-color",
    name: "硬编码颜色值",
    category: "style",
    severity: "info",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        // Detect hardcoded hex colors in className or style, but not in CSS variable declarations
        const hexMatch = line.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
        if (
          hexMatch &&
          /(?:className|style|color|background|border)/.test(line) &&
          !line.includes("var(--")
        ) {
          results.push({
            line: i + 1,
            column: (hexMatch.index ?? 0) + 1,
            message: `硬编码颜色值 \`${hexMatch[0]}\`，应使用 CSS 变量或 Tailwind 主题色`,
            suggestion:
              "使用 `var(--ide-xxx)` CSS 变量或 Tailwind 颜色类替代硬编码色值",
          });
        }
      });
      return results;
    },
  },

  {
    id: "style-important",
    name: "使用 !important",
    category: "style",
    severity: "warning",
    fileExtensions: [".css", ".scss", ".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        if (
          /!important/.test(line) &&
          !line.trimStart().startsWith("//") &&
          !line.trimStart().startsWith("*")
        ) {
          results.push({
            line: i + 1,
            column: line.indexOf("!important") + 1,
            message:
              "避免使用 `!important`，它会破坏 CSS 优先级链并增加维护成本",
            suggestion: "通过增加选择器特异性或调整样式顺序来解决优先级问题",
          });
        }
      });
      return results;
    },
  },

  // ─── Security Rules ───

  {
    id: "sec-dangerouslySetInnerHTML",
    name: "使用 dangerouslySetInnerHTML",
    category: "security",
    severity: "warning",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        if (/dangerouslySetInnerHTML/.test(line)) {
          results.push({
            line: i + 1,
            column: line.indexOf("dangerouslySetInnerHTML") + 1,
            message: "`dangerouslySetInnerHTML` 存在 XSS 风险",
            suggestion:
              "确保输入已经过 sanitize 处理，或使用 DOMPurify 等库清理 HTML",
          });
        }
      });
      return results;
    },
  },

  {
    id: "sec-eval-usage",
    name: "使用 eval() 或 new Function()",
    category: "security",
    severity: "error",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        if (/\beval\s*\(/.test(line)) {
          results.push({
            line: i + 1,
            column: line.indexOf("eval") + 1,
            message: "`eval()` 存在严重安全风险和性能问题",
            suggestion: "使用安全的替代方案，如 JSON.parse()、Map 查找表等",
          });
        }
        if (/new\s+Function\s*\(/.test(line)) {
          results.push({
            line: i + 1,
            column: line.indexOf("new Function") + 1,
            message: "`new Function()` 等同于 eval，存在安全风险",
            suggestion: "使用安全的替代方案",
          });
        }
      });
      return results;
    },
  },

  {
    id: "sec-hardcoded-secret",
    name: "硬编码密钥/Token",
    category: "security",
    severity: "error",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        // Detect potential API keys / tokens
        if (
          /(?:api[_-]?key|secret|token|password|auth)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i.test(
            line,
          )
        ) {
          results.push({
            line: i + 1,
            column: 1,
            message: "检测到可能的硬编码密钥/Token",
            suggestion:
              "使用环境变量存储敏感信息，如 import.meta.env.VITE_API_KEY",
          });
        }
      });
      return results;
    },
  },

  // ─── Best Practice Rules ───

  {
    id: "bp-empty-catch",
    name: "空的 catch 块",
    category: "best-practice",
    severity: "warning",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, content, _lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      const matches = [
        ...content.matchAll(/catch\s*(?:\([^)]*\))?\s*\{\s*\}/g),
      ];
      for (const m of matches) {
        const lineNum = content.slice(0, m.index ?? 0).split("\n").length;
        results.push({
          line: lineNum,
          column: 1,
          message: "空的 catch 块会吞没错误，使调试困难",
          suggestion: "至少添加 console.error(err) 或错误上报逻辑",
        });
      }
      return results;
    },
  },

  {
    id: "bp-magic-number",
    name: "魔法数字",
    category: "best-practice",
    severity: "hint",
    fileExtensions: [".ts", ".tsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      const ALLOWED = new Set([0, 1, -1, 2, 100]);
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("import")
        )
          return;
        // Detect standalone numbers in logic (not in JSX size props, not in array access)
        const matches = [
          ...line.matchAll(/(?<!\w)(\d{3,})(?!\w|px|rem|em|%|vh|vw|ms|s\b)/g),
        ];
        for (const m of matches) {
          const num = parseInt(m[1]);
          if (
            !ALLOWED.has(num) &&
            !line.includes("z-index") &&
            !line.includes("className")
          ) {
            results.push({
              line: i + 1,
              column: (m.index ?? 0) + 1,
              message: `魔法数字 \`${m[1]}\`，缺少语义化命名`,
              suggestion:
                `将数字提取为命名常量，如 \`const MAX_RETRIES = ${  m[1]  }\``,
            });
          }
        }
      });
      return results;
    },
  },

  {
    id: "bp-nested-ternary",
    name: "嵌套三元表达式",
    category: "best-practice",
    severity: "warning",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      lines.forEach((line, i) => {
        // Count ? occurrences (rough heuristic for nested ternaries)
        const qCount = (line.match(/\?(?!=)/g) || []).length;
        if (qCount >= 2 && !line.trimStart().startsWith("//")) {
          results.push({
            line: i + 1,
            column: 1,
            message: "嵌套三元表达式难以阅读和维护",
            suggestion: "使用 if/else、switch 语句或提取为辅助函数",
          });
        }
      });
      return results;
    },
  },

  {
    id: "bp-function-length",
    name: "函数体过长",
    category: "best-practice",
    severity: "info",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<AnalysisRule["check"]> = [];
      const MAX_LINES = 80;
      let funcStart = -1;
      let braceDepth = 0;
      let funcName = "";

      lines.forEach((line, i) => {
        const funcMatch = line.match(
          /(?:function|const|let)\s+(\w+).*(?:=>|\{)/,
        );
        if (funcMatch && braceDepth === 0) {
          funcStart = i;
          funcName = funcMatch[1];
          braceDepth = 0;
        }

        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;

        if (braceDepth === 0 && funcStart >= 0) {
          const length = i - funcStart + 1;
          if (length > MAX_LINES) {
            results.push({
              line: funcStart + 1,
              column: 1,
              message: `函数 \`${funcName}\` 有 ${length} 行，建议拆分为更小的函数（推荐 < ${MAX_LINES} 行）`,
              suggestion: "提取子逻辑为独立函数或自定义 Hook",
            });
          }
          funcStart = -1;
        }
      });
      return results;
    },
  },
];

// ===================================================================
//  分析入口
// ===================================================================

/** 分析单个文件 */
export function analyzeFile(filepath: string, content: string): AnalysisResult {
  const lines = content.split("\n");
  const ext = getExtension(filepath);
  const diagnostics: Diagnostic[] = [];

  for (const rule of RULES) {
    // 过滤不适用的文件类型
    if (rule.fileExtensions && !rule.fileExtensions.includes(ext)) continue;

    try {
      const results = rule.check(filepath, content, lines);
      for (const r of results) {
        diagnostics.push({
          ...r,
          id: nextDiagId(),
          ruleId: rule.id,
          filepath,
          severity: rule.severity,
          category: rule.category,
        });
      }
    } catch {
      // Rule execution error — skip silently
    }
  }

  // Sort: errors first, then warnings, etc.
  const severityOrder: Record<DiagnosticSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
    hint: 3,
  };
  diagnostics.sort((a, b) => {
    const s = severityOrder[a.severity] - severityOrder[b.severity];
    return s !== 0 ? s : a.line - b.line;
  });

  return { filepath, diagnostics, analyzedAt: Date.now() };
}

/** 分析整个项目 */
export function analyzeProject(
  fileContents: Record<string, string>,
): ProjectAnalysisResult {
  const files: AnalysisResult[] = [];
  let totalErrors = 0,
    totalWarnings = 0,
    totalInfos = 0,
    totalHints = 0;

  for (const [filepath, content] of Object.entries(fileContents)) {
    // Skip non-code files
    const ext = getExtension(filepath);
    if (![".ts", ".tsx", ".js", ".jsx", ".css", ".scss"].includes(ext))
      continue;
    // Skip very large files (>50KB) for performance
    if (content.length > 50000) continue;

    const result = analyzeFile(filepath, content);
    if (result.diagnostics.length > 0) {
      files.push(result);
      for (const d of result.diagnostics) {
        switch (d.severity) {
          case "error":
            totalErrors++;
            break;
          case "warning":
            totalWarnings++;
            break;
          case "info":
            totalInfos++;
            break;
          case "hint":
            totalHints++;
            break;
        }
      }
    }
  }

  return {
    files,
    totalErrors,
    totalWarnings,
    totalInfos,
    totalHints,
    analyzedAt: Date.now(),
  };
}

/** 对单个文件应用 autoFix */
export function applyAutoFix(content: string, fix: AutoFix): string {
  const lines = content.split("\n");
  const before = lines.slice(0, fix.range.startLine - 1);
  const after = lines.slice(fix.range.endLine);
  const replacementLines = fix.replacement ? fix.replacement.split("\n") : [];
  return [...before, ...replacementLines, ...after].join("\n");
}

/** 构建 AI 修复 prompt 的上下文 */
export function buildFixPromptContext(
  diagnostic: Diagnostic,
  fileContent: string,
): string {
  const lines = fileContent.split("\n");
  const startLine = Math.max(0, diagnostic.line - 6);
  const endLine = Math.min(
    lines.length,
    (diagnostic.endLine ?? diagnostic.line) + 5,
  );
  const codeSlice = lines
    .slice(startLine, endLine)
    .map((l, i) => `${startLine + i + 1} | ${l}`)
    .join("\n");

  return `## 错误诊断
- **文件**: ${diagnostic.filepath}
- **行号**: ${diagnostic.line}
- **严重度**: ${diagnostic.severity}
- **类别**: ${diagnostic.category}
- **规则**: ${diagnostic.ruleId}
- **问题**: ${diagnostic.message}
${diagnostic.suggestion ? `- **建议**: ${diagnostic.suggestion}` : ""}

## 相关代码片段 (第 ${startLine + 1}-${endLine} 行)
\`\`\`
${codeSlice}
\`\`\`

请修复以上问题，输出修改后该文件的完整内容。`;
}

/** 获取所有注册的规则信息（供 UI 展示） */
export function getRuleDescriptions(): {
  id: string;
  name: string;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
}[] {
  return RULES.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    severity: r.severity,
  }));
}

// ── Utilities ──

function getExtension(filepath: string): string {
  const dot = filepath.lastIndexOf(".");
  return dot >= 0 ? filepath.slice(dot) : "";
}
