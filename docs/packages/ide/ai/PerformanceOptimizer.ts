/**
 * @file ai/PerformanceOptimizer.ts
 * @description F2.3 智能性能优化建议模块，分析 React 组件代码产出可操作的优化建议，
 *              覆盖渲染优化 / 状态管理 / 代码分割 / 缓存策略 / 资源优化 / 内存管理 / 网络优化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,performance,optimization,react,analysis
 */

// ===================================================================
//  PerformanceOptimizer — F2.3 智能性能优化建议模块
//  分析 React 组件代码，产出可操作的性能优化建议
//  覆盖: 渲染优化 / 状态管理 / 代码分割 / 缓存策略 /
//        资源优化 / 内存管理 / 网络优化
// ===================================================================

// ── 类型定义 ──

export type OptimizationImpact = "high" | "medium" | "low";

export type OptimizationCategory =
  | "render" // 渲染优化
  | "state" // 状态管理
  | "code-split" // 代码分割
  | "memoization" // 缓存 & Memo
  | "resource" // 资源优化
  | "memory" // 内存管理
  | "network" // 网络优化
  | "bundle"; // 打包优化

export interface PerformanceSuggestion {
  id: string;
  ruleId: string;
  filepath: string;
  line: number;
  category: OptimizationCategory;
  impact: OptimizationImpact;
  title: string;
  description: string;
  /** 具体的代码修改建议 */
  codeExample?: {
    before: string;
    after: string;
  };
  /** MDN / React 文档链接 */
  docsUrl?: string;
}

export interface PerformanceReport {
  filepath: string;
  suggestions: PerformanceSuggestion[];
  score: number; // 0-100, 100 = 最佳
  analyzedAt: number;
}

export interface ProjectPerformanceReport {
  files: PerformanceReport[];
  overallScore: number;
  topIssues: PerformanceSuggestion[];
  categoryBreakdown: Record<OptimizationCategory, number>;
  analyzedAt: number;
}

// ── ID 生成 ──

let _perfId = 0;
function nextPerfId(): string {
  return `perf-${++_perfId}-${Date.now().toString(36)}`;
}

// ── 优化规则定义 ──

interface PerfRule {
  id: string;
  title: string;
  category: OptimizationCategory;
  impact: OptimizationImpact;
  fileExtensions: string[] | null;
  check: (
    filepath: string,
    content: string,
    lines: string[],
  ) => Omit<
    PerformanceSuggestion,
    "id" | "ruleId" | "filepath" | "category" | "impact"
  >[];
}

// ===================================================================
//  性能优化规则集
// ===================================================================

const PERF_RULES: PerfRule[] = [
  // ─── 渲染优化 ───

  {
    id: "render-no-memo",
    title: "组件未使用 React.memo",
    category: "render",
    impact: "medium",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      // Detect exported function components without React.memo
      const exportPattern =
        /export\s+(?:default\s+)?function\s+([A-Z]\w+)\s*\(/g;
      let match;
      while ((match = exportPattern.exec(content)) !== null) {
        const name = match[1];
        // Check if React.memo wraps this component anywhere
        if (
          !content.includes(`memo(${name})`) &&
          !content.includes(`React.memo(${name})`)
        ) {
          const lineNum = content.slice(0, match.index).split("\n").length;
          // Heuristic: only suggest for components that receive props
          const funcHead = content.slice(match.index, match.index + 200);
          if (/\(\s*\{/.test(funcHead) || /\(\s*props/.test(funcHead)) {
            results.push({
              line: lineNum,
              title: `组件 \`${name}\` 接收 props 但未使用 React.memo`,
              description: `当父组件重渲染时，\`${name}\` 即使 props 未变也会重渲染。使用 React.memo 可以跳过不必要的渲染。`,
              codeExample: {
                before: `export function ${name}({ ... }: Props) { ... }`,
                after: `const ${name} = React.memo(function ${name}({ ... }: Props) { ... })`,
              },
              docsUrl: "https://react.dev/reference/react/memo",
            });
          }
        }
      }
      return results;
    },
  },

  {
    id: "render-object-literal-prop",
    title: "JSX 属性中的对象/数组字面量",
    category: "render",
    impact: "medium",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      let inReturn = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/return\s*\(/.test(line)) inReturn = true;
        if (!inReturn) continue;

        // Detect prop={[...]} or prop={{...}} (excluding style and className)
        if (/\w+=\{\[/.test(line) && !/className|style|key/.test(line)) {
          results.push({
            line: i + 1,
            title: "JSX 属性传递了数组字面量",
            description:
              "每次渲染都会创建新的数组引用，导致接收该 prop 的子组件不必要地重渲染。",
            codeExample: {
              before: `<Child items={[1, 2, 3]} />`,
              after: `const items = useMemo(() => [1, 2, 3], [])\n<Child items={items} />`,
            },
          });
        }
        if (/\w+=\{\{(?!{)/.test(line) && !/style=|className=/.test(line)) {
          // Check it's not a short inline like onError={{ handler }}
          const afterBrace = line.slice(line.indexOf("={{") + 2);
          if (afterBrace.length > 30 || afterBrace.includes(",")) {
            results.push({
              line: i + 1,
              title: "JSX 属性传递了对象字面量",
              description:
                "每次渲染都会创建新的对象引用。使用 useMemo 缓存或提取到组件外部。",
            });
          }
        }
      }
      return results;
    },
  },

  {
    id: "render-anonymous-fn-prop",
    title: "内联箭头函数作为 prop",
    category: "render",
    impact: "low",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      let inReturn = false;
      for (let i = 0; i < lines.length; i++) {
        if (/return\s*\(/.test(lines[i])) inReturn = true;
        if (!inReturn) continue;
        // onClick={() => ...} is fine for handlers; but onChange/onSubmit/render props are worse
        const match = lines[i].match(
          /(?:on(?:Change|Submit|Select|Blur|Focus)|render\w*|component)=\{\s*\(/,
        );
        if (match) {
          results.push({
            line: i + 1,
            title: "频繁触发的事件处理器使用内联箭头函数",
            description:
              "onChange/onSubmit 等高频事件的内联函数在每次渲染时创建新引用，配合 React.memo 使用时会使缓存失效。",
            codeExample: {
              before: `<Input onChange={(e) => setValue(e.target.value)} />`,
              after: `const handleChange = useCallback((e) => setValue(e.target.value), [])\n<Input onChange={handleChange} />`,
            },
          });
        }
      }
      return results;
    },
  },

  // ─── 状态管理优化 ───

  {
    id: "state-too-many-usestate",
    title: "过多的 useState 调用",
    category: "state",
    impact: "medium",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, _lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      const stateMatches = [...content.matchAll(/\buseState\s*[<(]/g)];
      if (stateMatches.length > 6) {
        const lineNum = content
          .slice(0, stateMatches[0].index)
          .split("\n").length;
        results.push({
          line: lineNum,
          title: `组件使用了 ${stateMatches.length} 个 useState，考虑使用 useReducer`,
          description:
            "当组件有大量相关联的状态时，useReducer 可以更好地组织状态逻辑，减少状态更新引起的不必要渲染。",
          codeExample: {
            before: `const [a, setA] = useState(0)\nconst [b, setB] = useState("")\nconst [c, setC] = useState(false)\n// ...更多`,
            after: `const [state, dispatch] = useReducer(reducer, initialState)`,
          },
          docsUrl: "https://react.dev/reference/react/useReducer",
        });
      }
      return results;
    },
  },

  {
    id: "state-derived-state",
    title: "可派生状态存储在 useState 中",
    category: "state",
    impact: "high",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      // Detect patterns: useEffect that only sets state based on other state
      // e.g., useEffect(() => { setFilteredItems(items.filter(...)) }, [items])
      const effectPattern = /useEffect\s*\(\s*\(\)\s*=>\s*\{\s*set(\w+)\s*\(/g;
      let match;
      while ((match = effectPattern.exec(content)) !== null) {
        const setterName = match[1];
        const lineNum = content.slice(0, match.index).split("\n").length;
        results.push({
          line: lineNum,
          title: `\`${setterName}\` 可能是派生状态 — 考虑用 useMemo 替代`,
          description: `如果状态只是从其他状态/props 派生而来，使用 useMemo 代替 useState + useEffect 可以消除中间渲染。`,
          codeExample: {
            before: `const [filtered, setFiltered] = useState([])\nuseEffect(() => {\n  setFiltered(items.filter(...))\n}, [items])`,
            after: `const filtered = useMemo(() => items.filter(...), [items])`,
          },
          docsUrl: "https://react.dev/learn/you-might-not-need-an-effect",
        });
      }
      return results;
    },
  },

  {
    id: "state-context-rerenders",
    title: "Context 值对象未 memo 化",
    category: "state",
    impact: "high",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, _lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      // Detect <SomeContext.Provider value={{ ... }}> — inline object
      const providerPattern = /\.Provider\s+value=\{\{/g;
      let match;
      while ((match = providerPattern.exec(content)) !== null) {
        const lineNum = content.slice(0, match.index).split("\n").length;
        results.push({
          line: lineNum,
          title: "Context Provider 的 value 是内联对象",
          description:
            "每次渲染都会创建新的 value 对象，导致所有 Consumer 重渲染。使用 useMemo 缓存 value。",
          codeExample: {
            before: `<Ctx.Provider value={{ data, updateData }}>`,
            after: `const ctxValue = useMemo(() => ({ data, updateData }), [data, updateData])\n<Ctx.Provider value={ctxValue}>`,
          },
        });
      }
      return results;
    },
  },

  // ─── 缓存 & Memo ───

  {
    id: "memo-expensive-computation",
    title: "渲染中的耗时计算未缓存",
    category: "memoization",
    impact: "high",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      // Detect .sort(), .filter(), .reduce(), .map() chains in render body (not in useMemo)
      let inComponent = false;
      let braceDepth = 0;
      let inUseMemo = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(?:function|const)\s+[A-Z]\w*\s*[\(=]/.test(line))
          inComponent = true;
        if (!inComponent) continue;

        if (/useMemo\s*\(/.test(line)) inUseMemo = true;

        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;

        if (inUseMemo && braceDepth <= 1) inUseMemo = false;

        // Look for chained array operations outside useMemo
        if (!inUseMemo && /\.\s*(?:filter|sort|reduce)\s*\(/.test(line)) {
          // Check if inside return statement or render body
          const prevLines = lines.slice(Math.max(0, i - 5), i).join("\n");
          if (
            /return\s*[\(\{]/.test(prevLines) ||
            /(?:const|let)\s+\w+\s*=/.test(line)
          ) {
            // Exclude if already in useMemo
            if (
              !lines
                .slice(Math.max(0, i - 3), i)
                .join("\n")
                .includes("useMemo")
            ) {
              results.push({
                line: i + 1,
                title: "渲染中执行 filter/sort/reduce 未使用 useMemo 缓存",
                description:
                  "数组排序、过滤等操作在每次渲染时重新执行。如果数据量大，使用 useMemo 可以显著减少计算量。",
                codeExample: {
                  before: `const sorted = items.sort((a, b) => a.name.localeCompare(b.name))`,
                  after: `const sorted = useMemo(\n  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),\n  [items]\n)`,
                },
              });
            }
          }
        }
      }
      return results;
    },
  },

  {
    id: "memo-missing-callback",
    title: "传递给子组件的函数未使用 useCallback",
    category: "memoization",
    impact: "low",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      // Detect handlers defined as const inside component but not wrapped in useCallback
      const handlerPattern = /const\s+(handle\w+)\s*=\s*(?:async\s*)?\(/g;
      let match;
      while ((match = handlerPattern.exec(content)) !== null) {
        const name = match[1];
        // Check if it's wrapped in useCallback
        const context = content.slice(
          Math.max(0, (match.index ?? 0) - 100),
          (match.index ?? 0) + 50,
        );
        if (!context.includes("useCallback")) {
          // Check if handler is passed as prop
          if (
            content.includes(`={${name}}`) ||
            content.includes(`={${name}(`)
          ) {
            const lineNum = content.slice(0, match.index).split("\n").length;
            results.push({
              line: lineNum,
              title: `\`${name}\` 作为 prop 传递但未用 useCallback 包裹`,
              description: `如果子组件使用了 React.memo，未用 useCallback 的函数引用会使缓存失效。`,
              codeExample: {
                before: `const ${name} = (e) => { ... }`,
                after: `const ${name} = useCallback((e) => { ... }, [deps])`,
              },
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 代码分割 ───

  {
    id: "split-large-component",
    title: "组件文件过大，考虑拆分",
    category: "code-split",
    impact: "medium",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      if (lines.length > 300) {
        results.push({
          line: 1,
          title: `文件 ${lines.length} 行，超过建议的 300 行阈值`,
          description:
            "大型组件文件会增加解析时间和维护成本。考虑将子组件提取到独立文件，并使用 React.lazy 按需加载。",
          codeExample: {
            before: `// 一个 500 行的组件文件`,
            after: `// 拆分为:\n// - MainComponent.tsx (主逻辑)\n// - SubSection.tsx (子区块)\n// - useMainLogic.ts (自定义 Hook)\n\nconst SubSection = React.lazy(() => import('./SubSection'))`,
          },
          docsUrl: "https://react.dev/reference/react/lazy",
        });
      }
      return results;
    },
  },

  {
    id: "split-heavy-import",
    title: "顶层导入重量级库",
    category: "code-split",
    impact: "high",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      const HEAVY_LIBS = [
        "monaco-editor",
        "chart.js",
        "three",
        "d3",
        "pdf-lib",
        "xlsx",
        "marked",
        "highlight.js",
        "katex",
      ];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const lib = importMatch[1];
          for (const heavy of HEAVY_LIBS) {
            if (lib === heavy || lib.startsWith(`${heavy  }/`)) {
              results.push({
                line: i + 1,
                title: `顶层导入重量级库 \`${heavy}\``,
                description: `\`${heavy}\` 体积较大，如果不是首屏必需，应使用动态 import() 按需加载。`,
                codeExample: {
                  before: `import { Editor } from '${heavy}'`,
                  after: `const Editor = React.lazy(() => import('${heavy}'))`,
                },
              });
            }
          }
        }
      }
      return results;
    },
  },

  // ─── 资源优化 ───

  {
    id: "resource-img-no-lazy",
    title: "图片未使用懒加载",
    category: "resource",
    impact: "medium",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        if (/<img\b/.test(lines[i]) && !/loading=/.test(lines[i])) {
          results.push({
            line: i + 1,
            title: "`<img>` 缺少 `loading` 属性",
            description:
              '为非首屏图片添加 `loading="lazy"` 可延迟加载，减少初始页面负载。',
            codeExample: {
              before: `<img src="photo.jpg" alt="..." />`,
              after: `<img src="photo.jpg" alt="..." loading="lazy" />`,
            },
          });
        }
      }
      return results;
    },
  },

  {
    id: "resource-no-width-height",
    title: "图片缺少尺寸属性",
    category: "resource",
    impact: "low",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        if (
          /<img\b/.test(lines[i]) &&
          (!/width=/.test(lines[i]) || !/height=/.test(lines[i]))
        ) {
          results.push({
            line: i + 1,
            title: "`<img>` 缺少 `width`/`height` 属性",
            description:
              "设置图片宽高可避免布局偏移 (CLS)，改善 Core Web Vitals 得分。",
          });
        }
      }
      return results;
    },
  },

  // ─── 内存管理 ───

  {
    id: "memory-no-cleanup",
    title: "useEffect 中的订阅/定时器未清理",
    category: "memory",
    impact: "high",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, _lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      // Detect useEffect with addEventListener/setInterval/setTimeout but no return cleanup
      const effectBlocks = [
        ...content.matchAll(/useEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,/g),
      ];
      for (const m of effectBlocks) {
        const body = m[1];
        const hasSubscription =
          /addEventListener|setInterval|setTimeout|subscribe|on\(/.test(body);
        const hasCleanup = /return\s*(?:\(\)\s*=>|\{)/.test(body);
        if (hasSubscription && !hasCleanup) {
          const lineNum = content.slice(0, m.index ?? 0).split("\n").length;
          results.push({
            line: lineNum,
            title: "useEffect 创建了订阅但缺少清理函数",
            description:
              "addEventListener / setInterval / subscribe 需要在 useEffect 的返回函数中清理，否则会导致内存泄漏。",
            codeExample: {
              before: `useEffect(() => {\n  window.addEventListener('resize', handleResize)\n}, [])`,
              after: `useEffect(() => {\n  window.addEventListener('resize', handleResize)\n  return () => window.removeEventListener('resize', handleResize)\n}, [])`,
            },
            docsUrl:
              "https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development",
          });
        }
      }
      return results;
    },
  },

  {
    id: "memory-ref-in-closure",
    title: "闭包中捕获大型数据",
    category: "memory",
    impact: "low",
    fileExtensions: [".tsx", ".jsx", ".ts"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      // Heuristic: useCallback/useEffect with no deps but references large data
      for (let i = 0; i < lines.length; i++) {
        if (
          /useCallback\s*\(/.test(lines[i]) ||
          /useEffect\s*\(/.test(lines[i])
        ) {
          // Check for empty deps with allData/records/fullList references
          const chunk = lines
            .slice(i, Math.min(i + 10, lines.length))
            .join("\n");
          if (
            /,\s*\[\s*\]\s*\)/.test(chunk) &&
            /\b(?:allData|records|fullList|entireStore)\b/.test(chunk)
          ) {
            results.push({
              line: i + 1,
              title: "空依赖数组的 Hook 可能捕获了过时的大型数据引用",
              description:
                "闭包会保留对创建时作用域中所有变量的引用，包括大型数据对象。确保依赖数组正确或使用 ref。",
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 网络优化 ───

  {
    id: "network-no-debounce",
    title: "搜索/输入请求未防抖",
    category: "network",
    impact: "high",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect onChange handler that calls fetch/API
        if (/onChange=/.test(line)) {
          const nearby = lines
            .slice(i, Math.min(i + 5, lines.length))
            .join("\n");
          if (
            /fetch\s*\(|axios|api\.|request\(/.test(nearby) &&
            !/debounce|throttle|useDebounce/.test(nearby)
          ) {
            results.push({
              line: i + 1,
              title: "输入变更直接触发网络请求，缺少防抖",
              description:
                "每次按键都发送请求会造成不必要的网络负载。使用 debounce 延迟请求。",
              codeExample: {
                before: `onChange={(e) => fetch('/search?q=' + e.target.value)}`,
                after: `const debouncedSearch = useMemo(\n  () => debounce((q) => fetch('/search?q=' + q), 300),\n  []\n)\nonChange={(e) => debouncedSearch(e.target.value)}`,
              },
            });
          }
        }
      }
      return results;
    },
  },

  {
    id: "network-fetch-in-render",
    title: "渲染逻辑中直接调用 fetch",
    category: "network",
    impact: "high",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      let inComponent = false;
      let inEffect = false;
      for (let i = 0; i < lines.length; i++) {
        if (/(?:function|const)\s+[A-Z]\w*/.test(lines[i])) inComponent = true;
        if (/useEffect\s*\(/.test(lines[i])) inEffect = true;
        if (/\}\s*,\s*\[/.test(lines[i])) inEffect = false;

        if (
          inComponent &&
          !inEffect &&
          /\bfetch\s*\(/.test(lines[i]) &&
          !lines[i].trimStart().startsWith("//")
        ) {
          // Check if it's not inside a handler or callback
          const prevLine = lines[Math.max(0, i - 1)] || "";
          if (
            !/(?:handle|on)\w+|useCallback|useEffect|=>\s*\{|async\s+function/.test(
              prevLine,
            )
          ) {
            results.push({
              line: i + 1,
              title: "渲染逻辑中直接调用 fetch",
              description:
                "在渲染阶段直接调用 fetch 会导致每次渲染都发起请求。应放入 useEffect 或事件处理器中。",
              docsUrl:
                "https://react.dev/learn/you-might-not-need-an-effect#fetching-data",
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 打包优化 ───

  {
    id: "bundle-barrel-import",
    title: "从桶文件导入可能导致 tree-shaking 失效",
    category: "bundle",
    impact: "medium",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      const BARREL_LIBS = [
        "lodash",
        "@mui/material",
        "@mui/icons-material",
        "antd",
        "@ant-design/icons",
      ];
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(
          /^import\s+\{[^}]+\}\s+from\s+['"]([^'"]+)['"]/,
        );
        if (match) {
          const lib = match[1];
          for (const barrel of BARREL_LIBS) {
            if (lib === barrel) {
              results.push({
                line: i + 1,
                title: `从 \`${barrel}\` 整体导入，可能影响 tree-shaking`,
                description: `直接从子路径导入可以减小打包体积。`,
                codeExample: {
                  before: `import { Button } from '${barrel}'`,
                  after: `import Button from '${barrel}/Button'`,
                },
              });
            }
          }
        }
      }
      return results;
    },
  },

  {
    id: "bundle-dynamic-import-string",
    title: "动态 import 使用模板字符串",
    category: "bundle",
    impact: "low",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<PerfRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        if (
          /import\s*\(\s*`/.test(lines[i]) ||
          /import\s*\(\s*\w+\s*\+/.test(lines[i])
        ) {
          results.push({
            line: i + 1,
            title: "动态 import 使用模板字符串/变量",
            description:
              "打包器无法静态分析动态路径，会导致整个目录被打入 chunk 或分割失败。尽量使用固定路径。",
          });
        }
      }
      return results;
    },
  },
];

// ===================================================================
//  分析入口
// ===================================================================

/** 分析单个文件的性能问题 */
export function analyzeFilePerformance(
  filepath: string,
  content: string,
): PerformanceReport {
  const lines = content.split("\n");
  const ext = getExtension(filepath);
  const suggestions: PerformanceSuggestion[] = [];

  for (const rule of PERF_RULES) {
    if (rule.fileExtensions && !rule.fileExtensions.includes(ext)) continue;

    try {
      const results = rule.check(filepath, content, lines);
      for (const r of results) {
        suggestions.push({
          ...r,
          id: nextPerfId(),
          ruleId: rule.id,
          filepath,
          category: rule.category,
          impact: rule.impact,
        });
      }
    } catch {
      // Rule error — skip
    }
  }

  // Sort: high impact first
  const impactOrder: Record<OptimizationImpact, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  suggestions.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  // Score: start at 100, deduct per issue
  const deductions: Record<OptimizationImpact, number> = {
    high: 12,
    medium: 6,
    low: 2,
  };
  let score = 100;
  for (const s of suggestions) {
    score -= deductions[s.impact];
  }
  score = Math.max(0, Math.min(100, score));

  return { filepath, suggestions, score, analyzedAt: Date.now() };
}

/** 分析整个项目的性能 */
export function analyzeProjectPerformance(
  fileContents: Record<string, string>,
): ProjectPerformanceReport {
  const files: PerformanceReport[] = [];
  const categoryBreakdown: Record<OptimizationCategory, number> = {
    render: 0,
    state: 0,
    "code-split": 0,
    memoization: 0,
    resource: 0,
    memory: 0,
    network: 0,
    bundle: 0,
  };

  for (const [filepath, content] of Object.entries(fileContents)) {
    const ext = getExtension(filepath);
    if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;
    if (content.length > 50000) continue;

    const report = analyzeFilePerformance(filepath, content);
    if (report.suggestions.length > 0) {
      files.push(report);
      for (const s of report.suggestions) {
        categoryBreakdown[s.category]++;
      }
    }
  }

  // Overall score: average of file scores (or 100 if no files)
  const overallScore =
    files.length > 0
      ? Math.round(files.reduce((sum, f) => sum + f.score, 0) / files.length)
      : 100;

  // Top issues: all high-impact across project
  const topIssues = files
    .flatMap((f) => f.suggestions)
    .filter((s) => s.impact === "high")
    .slice(0, 10);

  return {
    files,
    overallScore,
    topIssues,
    categoryBreakdown,
    analyzedAt: Date.now(),
  };
}

/** 获取所有性能规则描述 */
export function getPerfRuleDescriptions(): {
  id: string;
  title: string;
  category: OptimizationCategory;
  impact: OptimizationImpact;
}[] {
  return PERF_RULES.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    impact: r.impact,
  }));
}

// ── Utilities ──

function getExtension(filepath: string): string {
  const dot = filepath.lastIndexOf(".");
  return dot >= 0 ? filepath.slice(dot) : "";
}
