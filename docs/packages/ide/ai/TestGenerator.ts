/**
 * @file ai/TestGenerator.ts
 * @description F2.5 智能测试用例生成模块，分析 React 组件/函数/Hook 代码自动生成 Vitest 测试用例，
 *              覆盖快乐路径 / 边界值 / 错误处理 / 异步行为 / 组件渲染 / Hook 测试 / 集成测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,test-generation,vitest,react,automation
 */

// ===================================================================
//  TestGenerator — F2.5 智能测试用例生成模块
//  分析 React 组件/函数/Hook 代码，自动生成 Vitest 测试用例
//  覆盖: 快乐路径 / 边界值 / 错误处理 / 异步行为 /
//        组件渲染 / Hook 测试 / 集成测试
// ===================================================================

// ── 类型定义 ──

export type TestCategory =
  | "unit" // 纯函数单元测试
  | "component" // React 组件渲染测试
  | "hook" // 自定义 Hook 测试
  | "integration" // 集成测试
  | "edge-case" // 边界情况
  | "error"; // 错误处理

export type TestPriority = "critical" | "high" | "medium" | "low";

export interface TestCase {
  id: string;
  name: string; // describe/it 描述
  category: TestCategory;
  priority: TestPriority;
  description: string; // 人类可读描述
  testCode: string; // 生成的测试代码
  targetSymbol: string; // 被测符号名称
  targetFile: string; // 被测文件路径
}

export interface TestSuite {
  filepath: string; // 测试文件路径建议
  targetFile: string; // 源文件路径
  imports: string; // import 语句
  testCases: TestCase[];
  fullCode: string; // 完整可粘贴的测试文件内容
  generatedAt: number;
}

export interface ProjectTestPlan {
  suites: TestSuite[];
  totalTests: number;
  coverageEstimate: {
    functions: number; // 预估函数覆盖率 (0-100)
    branches: number;
    lines: number;
  };
  analyzedAt: number;
}

// ── ID 生成 ──

let _testId = 0;
function nextTestId(): string {
  return `tg-${++_testId}-${Date.now().toString(36)}`;
}

// ===================================================================
//  代码分析器 — 提取文件中的可测符号
// ===================================================================

export interface ExtractedSymbol {
  name: string;
  type: "function" | "component" | "hook" | "class" | "constant" | "type";
  exported: boolean;
  async: boolean;
  params: string[];
  returnType: string | null;
  line: number;
  body: string; // 函数体/组件体（用于分析分支）
  jsDoc: string | null;
}

/** 从 TS/TSX 源码提取可测试的符号 */
export function extractSymbols(content: string): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];
  const lines = content.split("\n");

  // ── 提取导出的函数 ──
  const funcPatterns = [
    // export function name(params): RetType { ... }
    // Use a more flexible pattern to match complex return types
    /^(export\s+(?:default\s+)?)?(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)[^{]*\{/,
    // export const name = (params): RetType => ...
    /^(export\s+(?:default\s+)?)?const\s+(\w+)\s*(?::\s*\w+)?\s*=\s*(?:async\s+)?\(([^)]*)\)[^}]*=>/,
    // export const name = function(params) { ... }
    /^(export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(([^)]*)\)/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments
    if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*"))
      continue;

    // Extract JSDoc from preceding lines
    let jsDoc: string | null = null;
    if (i > 0 && lines[i - 1].trim().endsWith("*/")) {
      const jsdocLines: string[] = [];
      for (let j = i - 1; j >= 0; j--) {
        jsdocLines.unshift(lines[j]);
        if (lines[j].trim().startsWith("/**")) break;
      }
      jsDoc = jsdocLines.join("\n");
    }

    for (const pattern of funcPatterns) {
      const match = line.match(pattern);
      if (match) {
        const exported = !!match[1];
        const name = match[2];
        const paramsStr = match[3] || match[4] || "";
        const returnType = match[5] || match[4] || null;
        const isAsync = line.includes("async");
        const params = paramsStr
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

        // Determine type
        let type: ExtractedSymbol["type"] = "function";
        if (
          /^[A-Z]/.test(name) &&
          (content.includes("return (") || content.includes("return <"))
        ) {
          type = "component";
        }
        if (/^use[A-Z]/.test(name)) {
          type = "hook";
        }

        // Extract body (simplified: count braces)
        const bodyLines: string[] = [];
        let braceCount = 0;
        let started = false;
        for (let j = i; j < lines.length && j < i + 200; j++) {
          const l = lines[j];
          for (const ch of l) {
            if (ch === "{") {
              braceCount++;
              started = true;
            }
            if (ch === "}") braceCount--;
          }
          bodyLines.push(l);
          if (started && braceCount <= 0) break;
        }

        symbols.push({
          name,
          type,
          exported,
          async: isAsync,
          params,
          returnType,
          line: i + 1,
          body: bodyLines.join("\n"),
          jsDoc,
        });
        break;
      }
    }

    // ── 提取导出的常量 ──
    const constMatch = line.match(
      /^export\s+const\s+(\w+)\s*(?::\s*([^\s=]+))?\s*=\s*(?![\s(]|function|async)/,
    );
    if (constMatch && !symbols.find((s) => s.name === constMatch[1])) {
      symbols.push({
        name: constMatch[1],
        type: "constant",
        exported: true,
        async: false,
        params: [],
        returnType: constMatch[2] || null,
        line: i + 1,
        body: line,
        jsDoc,
      });
    }

    // ── 提取导出的类 ──
    const classMatch = line.match(/^(export\s+(?:default\s+)?)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[2],
        type: "class",
        exported: !!classMatch[1],
        async: false,
        params: [],
        returnType: null,
        line: i + 1,
        body: "",
        jsDoc,
      });
    }
  }

  return symbols;
}

// ===================================================================
//  测试用例生成器
// ===================================================================

/** 为单个函数/组件生成测试用例 */
function generateTestsForSymbol(
  symbol: ExtractedSymbol,
  filepath: string,
): TestCase[] {
  const cases: TestCase[] = [];

  switch (symbol.type) {
    case "function":
      cases.push(...generateFunctionTests(symbol, filepath));
      break;
    case "component":
      cases.push(...generateComponentTests(symbol, filepath));
      break;
    case "hook":
      cases.push(...generateHookTests(symbol, filepath));
      break;
    case "class":
      cases.push(...generateClassTests(symbol, filepath));
      break;
    case "constant":
      cases.push(...generateConstantTests(symbol, filepath));
      break;
  }

  return cases;
}

// ─── 函数测试生成 ───

function generateFunctionTests(sym: ExtractedSymbol, fp: string): TestCase[] {
  const cases: TestCase[] = [];
  const { name, params, async: isAsync, body } = sym;

  // 1. Happy path
  cases.push({
    id: nextTestId(),
    name: `${name} 应正确执行`,
    category: "unit",
    priority: "critical",
    description: `验证 ${name} 在正常输入时返回预期结果`,
    targetSymbol: name,
    targetFile: fp,
    testCode: isAsync
      ? `it("${name} 应正确执行", async () => {\n  const result = await ${name}(${generateMockArgs(params)})\n  expect(result).toBeDefined()\n})`
      : `it("${name} 应正确执行", () => {\n  const result = ${name}(${generateMockArgs(params)})\n  expect(result).toBeDefined()\n})`,
  });

  // 2. Null/undefined params
  if (params.length > 0) {
    cases.push({
      id: nextTestId(),
      name: `${name} 处理空参数`,
      category: "edge-case",
      priority: "high",
      description: `验证 ${name} 在参数为 null/undefined 时的行为`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("${name} 处理空参数", () => {\n  ${params.map((p) => `// @ts-expect-error 测试空参数\n`).join("")}  expect(() => ${name}(${params.map(() => "undefined").join(", ")})).not.toThrow()\n})`,
    });
  }

  // 3. Return type check
  if (sym.returnType) {
    cases.push({
      id: nextTestId(),
      name: `${name} 返回正确类型`,
      category: "unit",
      priority: "medium",
      description: `验证 ${name} 返回值的类型正确`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("${name} 返回正确类型", () => {\n  const result = ${name}(${generateMockArgs(params)})\n  expect(typeof result).toBe("${inferJsType(sym.returnType)}")\n})`,
    });
  }

  // 4. Error path (if body contains throw/catch)
  if (/throw\s|catch\s*\(/.test(body)) {
    cases.push({
      id: nextTestId(),
      name: `${name} 错误处理`,
      category: "error",
      priority: "high",
      description: `验证 ${name} 的错误处理逻辑`,
      targetSymbol: name,
      targetFile: fp,
      testCode: isAsync
        ? `it("${name} 错误处理", async () => {\n  // 提供会触发错误的参数\n  await expect(${name}(${generateBadArgs(params)})).rejects.toThrow()\n})`
        : `it("${name} 错误处理", () => {\n  expect(() => ${name}(${generateBadArgs(params)})).toThrow()\n})`,
    });
  }

  // 5. Boundary values (if params include numbers)
  if (params.some((p) => /number|int|count|index|size|length/i.test(p))) {
    cases.push({
      id: nextTestId(),
      name: `${name} 边界值`,
      category: "edge-case",
      priority: "medium",
      description: `验证 ${name} 在边界值（0, -1, MAX_SAFE_INTEGER）时的行为`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("${name} 边界值 — 零", () => {\n  const result = ${name}(0)\n  expect(result).toBeDefined()\n})\n\nit("${name} 边界值 — 负数", () => {\n  const result = ${name}(-1)\n  expect(result).toBeDefined()\n})`,
    });
  }

  // 6. Async specific
  if (isAsync) {
    cases.push({
      id: nextTestId(),
      name: `${name} 异步行为`,
      category: "unit",
      priority: "high",
      description: `验证 ${name} 返回 Promise 且正确 resolve`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("${name} 返回 Promise", () => {\n  const result = ${name}(${generateMockArgs(params)})\n  expect(result).toBeInstanceOf(Promise)\n})`,
    });
  }

  // 7. Branch coverage hint (if-else, switch, ternary)
  const branchCount = (body.match(/\bif\s*\(|case\s+|[^?]\?[^?:]/g) || [])
    .length;
  if (branchCount >= 2) {
    cases.push({
      id: nextTestId(),
      name: `${name} 分支覆盖 (${branchCount} 个分支)`,
      category: "unit",
      priority: "medium",
      description: `${name} 有 ${branchCount} 个分支条件，需要多组输入覆盖`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `// TODO: ${name} 有 ${branchCount} 个条件分支\n// 为每个分支编写独立测试用例:\n${Array.from({ length: Math.min(branchCount, 4) }, (_, i) => `it("${name} 分支 ${i + 1}", () => {\n  // 提供触发分支 ${i + 1} 的参数\n  const result = ${name}(/* branch ${i + 1} args */)\n  expect(result).toBeDefined()\n})`).join("\n\n")}`,
    });
  }

  return cases;
}

// ─── React 组件测试生成 ───

function generateComponentTests(sym: ExtractedSymbol, fp: string): TestCase[] {
  const cases: TestCase[] = [];
  const { name, params, body } = sym;

  // 1. Renders without crash
  cases.push({
    id: nextTestId(),
    name: `<${name} /> 正常渲染`,
    category: "component",
    priority: "critical",
    description: `验证 ${name} 组件在传入必须 props 后能正常渲染`,
    targetSymbol: name,
    targetFile: fp,
    testCode: `it("<${name} /> 正常渲染", () => {\n  render(<${name} ${generateMockProps(params)} />)\n  // 验证组件存在\n  expect(document.body.children.length).toBeGreaterThan(0)\n})`,
  });

  // 2. Snapshot
  cases.push({
    id: nextTestId(),
    name: `<${name} /> 快照匹配`,
    category: "component",
    priority: "low",
    description: `验证 ${name} 的渲染输出与快照一致`,
    targetSymbol: name,
    targetFile: fp,
    testCode: `it("<${name} /> 快照匹配", () => {\n  const { container } = render(<${name} ${generateMockProps(params)} />)\n  expect(container.innerHTML).toMatchSnapshot()\n})`,
  });

  // 3. Props variation
  if (params.length > 0) {
    cases.push({
      id: nextTestId(),
      name: `<${name} /> 不同 props 渲染`,
      category: "component",
      priority: "high",
      description: `验证 ${name} 在不同 props 组合下的渲染`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("<${name} /> 空 props 不崩溃", () => {\n  // @ts-expect-error 测试缺少 props\n  expect(() => render(<${name} />)).not.toThrow()\n})`,
    });
  }

  // 4. Event handlers (if body has onClick, onChange, onSubmit)
  const eventHandlers =
    body.match(/on(?:Click|Change|Submit|KeyDown|Focus|Blur)\s*=/g) || [];
  if (eventHandlers.length > 0 && eventHandlers[0]) {
    const eventName = eventHandlers[0].replace(/\s*[=:]/, "");
    cases.push({
      id: nextTestId(),
      name: `<${name} /> 事件处理 — ${eventName}`,
      category: "component",
      priority: "high",
      description: `验证 ${name} 的 ${eventName} 事件响应`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("<${name} /> ${eventName} 触发", async () => {\n  const handler = vi.fn()\n  render(<${name} ${eventName}={handler} ${generateMockProps(params)} />)\n  // 找到可交互元素并触发事件\n  const el = screen.getByRole("button") // 根据实际元素调整\n  await userEvent.click(el)\n  expect(handler).toHaveBeenCalled()\n})`,
    });
  }

  // 5. Conditional rendering
  if (/\{.*&&\s*<|[?]\s*<|\bif\s*\(/.test(body)) {
    cases.push({
      id: nextTestId(),
      name: `<${name} /> 条件渲染`,
      category: "component",
      priority: "medium",
      description: `验证 ${name} 在不同条件下显示/隐藏元素`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("<${name} /> 条件为 true 时显示", () => {\n  render(<${name} ${generateMockProps(params)} />)\n  // 验证条件渲染的元素存在\n  // expect(screen.getByText("...")).toBeInTheDocument()\n})\n\nit("<${name} /> 条件为 false 时隐藏", () => {\n  render(<${name} /* 使条件为 false 的 props */ />)\n  // expect(screen.queryByText("...")).not.toBeInTheDocument()\n})`,
    });
  }

  // 6. Loading/Error states
  if (/loading|isLoading|spinner|skeleton/i.test(body)) {
    cases.push({
      id: nextTestId(),
      name: `<${name} /> 加载状态`,
      category: "component",
      priority: "medium",
      description: `验证 ${name} 在加载中时显示加载指示器`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("<${name} /> 显示加载状态", () => {\n  render(<${name} loading={true} ${generateMockProps(params)} />)\n  // expect(screen.getByRole("progressbar")).toBeInTheDocument()\n})`,
    });
  }

  return cases;
}

// ─── Hook 测试生成 ───

function generateHookTests(sym: ExtractedSymbol, fp: string): TestCase[] {
  const cases: TestCase[] = [];
  const { name, params, body } = sym;

  // 1. Returns expected shape
  cases.push({
    id: nextTestId(),
    name: `${name} 返回预期结构`,
    category: "hook",
    priority: "critical",
    description: `验证 ${name} 返回值的结构`,
    targetSymbol: name,
    targetFile: fp,
    testCode: `it("${name} 返回预期结构", () => {\n  const { result } = renderHook(() => ${name}(${generateMockArgs(params)}))\n  expect(result.current).toBeDefined()\n})`,
  });

  // 2. State updates
  if (/useState/.test(body)) {
    cases.push({
      id: nextTestId(),
      name: `${name} 状态更新`,
      category: "hook",
      priority: "high",
      description: `验证 ${name} 的状态更新行为`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("${name} 状态更新", () => {\n  const { result } = renderHook(() => ${name}(${generateMockArgs(params)}))\n  // act(() => { result.current.setSomething(newValue) })\n  // expect(result.current.something).toBe(newValue)\n})`,
    });
  }

  // 3. Effect cleanup
  if (/useEffect/.test(body)) {
    cases.push({
      id: nextTestId(),
      name: `${name} effect 清理`,
      category: "hook",
      priority: "high",
      description: `验证 ${name} 的 useEffect 清理函数被调用`,
      targetSymbol: name,
      targetFile: fp,
      testCode: `it("${name} 卸载时清理", () => {\n  const { unmount } = renderHook(() => ${name}(${generateMockArgs(params)}))\n  // 不应抛出错误\n  expect(() => unmount()).not.toThrow()\n})`,
    });
  }

  // 4. Re-render stability
  cases.push({
    id: nextTestId(),
    name: `${name} 重渲染稳定性`,
    category: "hook",
    priority: "medium",
    description: `验证 ${name} 在重渲染时不产生异常`,
    targetSymbol: name,
    targetFile: fp,
    testCode: `it("${name} 重渲染稳定", () => {\n  const { result, rerender } = renderHook(() => ${name}(${generateMockArgs(params)}))\n  rerender()\n  expect(result.current).toBeDefined()\n})`,
  });

  return cases;
}

// ─── 类测试生成 ───

function generateClassTests(sym: ExtractedSymbol, fp: string): TestCase[] {
  const cases: TestCase[] = [];
  const { name } = sym;

  cases.push({
    id: nextTestId(),
    name: `${name} 实例化`,
    category: "unit",
    priority: "critical",
    description: `验证 ${name} 可以正常实例化`,
    targetSymbol: name,
    targetFile: fp,
    testCode: `it("${name} 实例化", () => {\n  const instance = new ${name}()\n  expect(instance).toBeInstanceOf(${name})\n})`,
  });

  return cases;
}

// ─── 常量测试生成 ───

function generateConstantTests(sym: ExtractedSymbol, fp: string): TestCase[] {
  return [
    {
      id: nextTestId(),
      name: `${sym.name} 已定义且非空`,
      category: "unit",
      priority: "low",
      description: `验证导出常量 ${sym.name} 存在且有值`,
      targetSymbol: sym.name,
      targetFile: fp,
      testCode: `it("${sym.name} 已定义且非空", () => {\n  expect(${sym.name}).toBeDefined()\n  expect(${sym.name}).not.toBeNull()\n})`,
    },
  ];
}

// ===================================================================
//  辅助函数
// ===================================================================

function generateMockArgs(params: string[]): string {
  if (params.length === 0) return "";
  return params
    .map((p) => {
      const name = p.split(":")[0].trim().replace(/[{}?]/g, "");
      const type = (p.split(":")[1] || "").trim();
      if (/string/i.test(type)) return `"test-${name}"`;
      if (/number|int/i.test(type)) return "42";
      if (/boolean|bool/i.test(type)) return "true";
      if (/\[\]/i.test(type)) return "[]";
      if (/Record|Map|object|\{/i.test(type)) return "{}";
      if (/function|callback|handler|\(/i.test(type)) return "() => {}";
      // Default: empty object (works for destructured props)
      if (name.startsWith("{")) return "{}";
      return `"mock-${name}"`;
    })
    .join(", ");
}

function generateMockProps(params: string[]): string {
  if (params.length === 0) return "";
  // For React components, params are often destructured: { title, onClick }
  const propStr = params.join(", ");
  const propNames = propStr.match(/\b(\w+)(?:\s*[?:,}])/g) || [];
  return propNames
    .map((p) => p.replace(/[?:,}]/g, "").trim())
    .filter((p) => p && !["children", "className", "style"].includes(p))
    .slice(0, 5) // Limit
    .map((p) => {
      if (/^on[A-Z]/.test(p)) return `${p}={() => {}}`;
      if (/title|label|name|text|placeholder/i.test(p)) return `${p}="test"`;
      if (/count|index|size|id/i.test(p)) return `${p}={1}`;
      if (/is|show|visible|disabled|loading|active|open/i.test(p))
        return `${p}={false}`;
      if (/items|data|list|options/i.test(p)) return `${p}={[]}`;
      return `${p}={"test"}`;
    })
    .join(" ");
}

function generateBadArgs(params: string[]): string {
  return params.map(() => "null as any").join(", ");
}

function inferJsType(tsType: string): string {
  if (/string/i.test(tsType)) return "string";
  if (/number|int/i.test(tsType)) return "number";
  if (/boolean/i.test(tsType)) return "boolean";
  if (/void/i.test(tsType)) return "undefined";
  return "object";
}

// ===================================================================
//  主入口 API
// ===================================================================

/** 为单个文件生成测试套件 */
export function generateTestSuite(
  filepath: string,
  content: string,
): TestSuite {
  const symbols = extractSymbols(content);
  const exportedSymbols = symbols.filter(
    (s) => s.exported && s.type !== "type",
  );

  const allCases: TestCase[] = [];
  for (const sym of exportedSymbols) {
    allCases.push(...generateTestsForSymbol(sym, filepath));
  }

  // Sort by priority
  const priorityOrder: Record<TestPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  allCases.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  // Generate import statement
  const symbolNames = exportedSymbols
    .filter((s) => s.type !== "type")
    .map((s) => s.name);
  const relativePath = filepath.replace(/\.(tsx?|jsx?)$/, "");
  const hasComponents = exportedSymbols.some((s) => s.type === "component");
  const hasHooks = exportedSymbols.some((s) => s.type === "hook");

  let imports = `import { describe, it, expect, vi } from "vitest"\n`;
  if (symbolNames.length > 0) {
    imports += `import { ${symbolNames.join(", ")} } from "${relativePath}"\n`;
  }
  if (hasComponents) {
    imports += `import { render, screen } from "@testing-library/react"\nimport userEvent from "@testing-library/user-event"\n`;
  }
  if (hasHooks) {
    imports += `import { renderHook, act } from "@testing-library/react"\n`;
  }

  // Build full file code
  const groupedBySymbol = new Map<string, TestCase[]>();
  for (const c of allCases) {
    if (!groupedBySymbol.has(c.targetSymbol))
      groupedBySymbol.set(c.targetSymbol, []);
    groupedBySymbol.get(c.targetSymbol)!.push(c);
  }

  let fullCode = `${imports  }\n`;
  for (const [symbol, tests] of groupedBySymbol) {
    fullCode += `describe("${symbol}", () => {\n`;
    for (const t of tests) {
      fullCode += `  ${t.testCode.split("\n").join("\n  ")}\n\n`;
    }
    fullCode += `})\n\n`;
  }

  // Suggest test file path
  const testFilePath = filepath
    .replace(/^src\//, "src/__tests__/")
    .replace(/\.(tsx?|jsx?)$/, ".test.$1");

  return {
    filepath: testFilePath,
    targetFile: filepath,
    imports,
    testCases: allCases,
    fullCode: fullCode.trim(),
    generatedAt: Date.now(),
  };
}

/** 为整个项目生成测试计划 */
export function generateProjectTestPlan(
  fileContents: Record<string, string>,
): ProjectTestPlan {
  const suites: TestSuite[] = [];
  let totalExported = 0;
  let totalWithTests = 0;

  for (const [filepath, content] of Object.entries(fileContents)) {
    const ext = getExtension(filepath);
    if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;
    if (
      filepath.includes("__tests__") ||
      filepath.includes(".test.") ||
      filepath.includes(".spec.")
    )
      continue;
    if (content.length > 50000) continue;

    const suite = generateTestSuite(filepath, content);
    if (suite.testCases.length > 0) {
      suites.push(suite);
      const symbols = extractSymbols(content).filter((s) => s.exported);
      totalExported += symbols.length;
      totalWithTests += symbols.filter((s) => s.type !== "type").length;
    }
  }

  const totalTests = suites.reduce((sum, s) => sum + s.testCases.length, 0);

  return {
    suites,
    totalTests,
    coverageEstimate: {
      functions:
        totalExported > 0
          ? Math.round((totalWithTests / totalExported) * 100)
          : 100,
      branches: Math.round(totalTests * 3.5), // rough heuristic
      lines: Math.round(totalTests * 5), // rough heuristic
    },
    analyzedAt: Date.now(),
  };
}

/** 获取符号统计信息 */
export function getSymbolStats(content: string): {
  functions: number;
  components: number;
  hooks: number;
  classes: number;
  constants: number;
  exported: number;
  total: number;
} {
  const symbols = extractSymbols(content);
  return {
    functions: symbols.filter((s) => s.type === "function").length,
    components: symbols.filter((s) => s.type === "component").length,
    hooks: symbols.filter((s) => s.type === "hook").length,
    classes: symbols.filter((s) => s.type === "class").length,
    constants: symbols.filter((s) => s.type === "constant").length,
    exported: symbols.filter((s) => s.exported).length,
    total: symbols.length,
  };
}

function getExtension(filepath: string): string {
  const dot = filepath.lastIndexOf(".");
  return dot >= 0 ? filepath.slice(dot) : "";
}
