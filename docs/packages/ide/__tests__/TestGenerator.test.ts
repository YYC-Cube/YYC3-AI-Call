import { describe, expect, it } from 'vitest'
import { extractSymbols, type ExtractedSymbol, type ProjectTestPlan, type TestCase, type TestCategory, type TestPriority, type TestSuite } from '../ai/TestGenerator'

describe('TestGenerator', () => {
  describe('extractSymbols', () => {
    it('应该提取导出的函数', () => {
      const code = `
export function add(a: number, b: number): number {
  return a + b;
}
`
      const symbols = extractSymbols(code)
      expect(symbols.length).toBeGreaterThanOrEqual(1)
      const addFn = symbols.find(s => s.name === 'add')
      expect(addFn).toBeDefined()
      expect(addFn!.type).toBe('function')
      expect(addFn!.exported).toBe(true)
    })

    it('应该提取 React 组件', () => {
      const code = `
export function App(props: { name: string }) {
  return <div>{props.name}</div>;
}
`
      const symbols = extractSymbols(code)
      const appComp = symbols.find(s => s.name === 'App')
      expect(appComp).toBeDefined()
    })

    it('应该提取箭头函数', () => {
      const code = `export const greet = (name: string): string => \`Hello \${name}\`;`
      const symbols = extractSymbols(code)
      expect(symbols.length).toBeGreaterThanOrEqual(1)
    })

    it('应该跳过注释行', () => {
      const code = `// This is a comment\n/* block comment */\nexport function test() {}`
      const symbols = extractSymbols(code)
      const testFn = symbols.find(s => s.name === 'test')
      expect(testFn).toBeDefined()
    })

    it('空代码应该返回空数组', () => {
      const symbols = extractSymbols('')
      expect(symbols).toEqual([])
    })

    it('只有注释应该返回空数组', () => {
      const code = '// comment\n/* block */\n// another'
      const symbols = extractSymbols(code)
      expect(symbols).toEqual([])
    })
  })

  describe('类型验证', () => {
    it('TestCategory 应该包含所有类别', () => {
      const categories: TestCategory[] = ['unit', 'component', 'hook', 'integration', 'edge-case', 'error']
      expect(categories).toHaveLength(6)
    })

    it('TestPriority 应该包含所有优先级', () => {
      const priorities: TestPriority[] = ['critical', 'high', 'medium', 'low']
      expect(priorities).toHaveLength(4)
    })

    it('ExtractedSymbol 应该有正确的结构', () => {
      const sym: ExtractedSymbol = {
        name: 'add',
        type: 'function',
        exported: true,
        async: false,
        params: ['a', 'b'],
        returnType: 'number',
        line: 1,
        body: 'return a + b',
        jsDoc: null,
      }
      expect(sym.type).toBe('function')
      expect(sym.params).toHaveLength(2)
    })

    it('TestCase 应该有正确的结构', () => {
      const tc: TestCase = {
        id: 'test-1',
        name: 'should add two numbers',
        category: 'unit',
        priority: 'critical',
        description: 'Tests addition',
        testCode: 'expect(add(1,2)).toBe(3)',
        targetSymbol: 'add',
        targetFile: 'src/math.ts',
      }
      expect(tc.category).toBe('unit')
      expect(tc.priority).toBe('critical')
    })

    it('TestSuite 应该有正确的结构', () => {
      const suite: TestSuite = {
        filepath: 'src/__tests__/math.test.ts',
        targetFile: 'src/math.ts',
        imports: "import { add } from '../math'",
        testCases: [],
        fullCode: '',
        generatedAt: Date.now(),
      }
      expect(suite.targetFile).toBe('src/math.ts')
    })

    it('ProjectTestPlan 应该有正确的结构', () => {
      const plan: ProjectTestPlan = {
        suites: [],
        totalTests: 0,
        coverageEstimate: { functions: 0, branches: 0, lines: 0 },
        analyzedAt: Date.now(),
      }
      expect(plan.coverageEstimate.functions).toBe(0)
    })
  })
})
