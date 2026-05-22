import { describe, expect, it } from 'vitest'
import {
  analyzeFile,
  analyzeProject,
  applyAutoFix,
  buildFixPromptContext,
  getRuleDescriptions,
  type AutoFix,
  type Diagnostic,
} from '../ai/ErrorAnalyzer'

const findDiag = (result: ReturnType<typeof analyzeFile>, ruleId: string) =>
  result.diagnostics.find(d => d.ruleId === ruleId)

describe('ErrorAnalyzer', () => {
  describe('TypeScript Rules', () => {
    it('ts-any-usage: 检测 : any 类型', () => {
      const r = analyzeFile('a.ts', 'const x: any = 1;')
      expect(findDiag(r, 'ts-any-usage')).toBeDefined()
      expect(findDiag(r, 'ts-any-usage')!.severity).toBe('warning')
    })

    it('ts-any-usage: 检测 as any', () => {
      const r = analyzeFile('a.ts', 'const x = data as any;')
      expect(findDiag(r, 'ts-any-usage')).toBeDefined()
    })

    it('ts-any-usage: 检测 <any> 断言', () => {
      const r = analyzeFile('a.ts', 'const x = <any>data;')
      expect(findDiag(r, 'ts-any-usage')).toBeDefined()
    })

    it('ts-any-usage: 跳过注释中的 any', () => {
      const r = analyzeFile('a.ts', '// uses any type\nconst x: number = 1;')
      expect(findDiag(r, 'ts-any-usage')).toBeUndefined()
    })

    it('ts-any-usage: 跳过 * 注释中的 any', () => {
      const r = analyzeFile('a.ts', ' * any type here\nconst x = 1;')
      expect(findDiag(r, 'ts-any-usage')).toBeUndefined()
    })

    it('ts-non-null-assertion: 检测 ! 断言', () => {
      const r = analyzeFile('a.ts', 'const name = user!.name;')
      expect(findDiag(r, 'ts-non-null-assertion')).toBeDefined()
      expect(findDiag(r, 'ts-non-null-assertion')!.severity).toBe('info')
    })

    it('ts-non-null-assertion: 跳过 if! while!', () => {
      const r = analyzeFile('a.ts', 'if(!flag) return;')
      expect(findDiag(r, 'ts-non-null-assertion')).toBeUndefined()
    })

    it('ts-console-log: 检测 console.log', () => {
      const r = analyzeFile('a.ts', 'console.log("debug");')
      expect(findDiag(r, 'ts-console-log')).toBeDefined()
    })

    it('ts-console-log: 跳过注释', () => {
      const r = analyzeFile('a.ts', '// console.log("debug");')
      expect(findDiag(r, 'ts-console-log')).toBeUndefined()
    })

    it('ts-todo-fixme: 检测 TODO 注释', () => {
      const r = analyzeFile('a.ts', '// TODO: fix this later')
      expect(findDiag(r, 'ts-todo-fixme')).toBeDefined()
      expect(findDiag(r, 'ts-todo-fixme')!.severity).toBe('hint')
    })

    it('ts-todo-fixme: 检测 FIXME 注释', () => {
      const r = analyzeFile('a.ts', '// FIXME: broken code')
      expect(findDiag(r, 'ts-todo-fixme')).toBeDefined()
    })

    it('ts-todo-fixme: 检测 HACK 注释', () => {
      const r = analyzeFile('a.ts', '// HACK: workaround')
      expect(findDiag(r, 'ts-todo-fixme')).toBeDefined()
    })

    it('ts-todo-fixme: 检测 XXX 注释', () => {
      const r = analyzeFile('a.ts', '// XXX: temp fix')
      expect(findDiag(r, 'ts-todo-fixme')).toBeDefined()
    })

    it('ts-todo-fixme: 不检测普通注释', () => {
      const r = analyzeFile('a.ts', '// normal comment')
      expect(findDiag(r, 'ts-todo-fixme')).toBeUndefined()
    })

    it('ts-todo-fixme: 适用于所有文件类型', () => {
      const r = analyzeFile('a.css', '// TODO: fix color')
      expect(findDiag(r, 'ts-todo-fixme')).toBeDefined()
    })
  })

  describe('React Rules', () => {
    it('react-missing-key: 检测缺少 key 的 map', () => {
      const code = 'items.map((item) => <div>{item}</div>)'
      const r = analyzeFile('a.tsx', code)
      expect(findDiag(r, 'react-missing-key')).toBeDefined()
      expect(findDiag(r, 'react-missing-key')!.severity).toBe('error')
    })

    it('react-missing-key: 有 key 时不报错', () => {
      const code = 'items.map((item) => <div key={item.id}>{item.name}</div>)'
      const r = analyzeFile('a.tsx', code)
      expect(findDiag(r, 'react-missing-key')).toBeUndefined()
    })

    it('react-missing-key: 不检测 .ts 文件', () => {
      const r = analyzeFile('a.ts', 'items.map((item) => <div>{item}</div>)')
      expect(findDiag(r, 'react-missing-key')).toBeUndefined()
    })

    it('react-direct-state-mutation: 检测直接修改 state', () => {
      const r = analyzeFile('a.tsx', 'state.name = "new";')
      expect(findDiag(r, 'react-direct-state-mutation')).toBeDefined()
    })

    it('react-direct-state-mutation: 检测 this.state 直接修改', () => {
      const r = analyzeFile('a.tsx', 'this.state.count = 5;')
      expect(findDiag(r, 'react-direct-state-mutation')).toBeDefined()
    })

    it('react-hooks-conditional: 检测条件内调用 Hook', () => {
      const code = 'if (condition) {\n  useEffect(() => {}, []);\n}'
      const r = analyzeFile('a.tsx', code)
      expect(findDiag(r, 'react-hooks-conditional')).toBeDefined()
      expect(findDiag(r, 'react-hooks-conditional')!.severity).toBe('error')
    })

    it('react-hooks-conditional: 正常 Hook 不报错', () => {
      const code = 'useEffect(() => {}, []);'
      const r = analyzeFile('a.tsx', code)
      expect(findDiag(r, 'react-hooks-conditional')).toBeUndefined()
    })

    it('react-inline-style-object: 检测内联 style', () => {
      const r = analyzeFile('a.tsx', '<div style={{color: "red"}} />')
      expect(findDiag(r, 'react-inline-style-object')).toBeDefined()
    })

    it('react-inline-style-object: 跳过注释', () => {
      const r = analyzeFile('a.tsx', '// <div style={{color: "red"}} />')
      expect(findDiag(r, 'react-inline-style-object')).toBeUndefined()
    })

    it('perf-index-as-key: 检测 index 作为 key', () => {
      const r = analyzeFile('a.tsx', '<div key={index}>item</div>')
      expect(findDiag(r, 'perf-index-as-key')).toBeDefined()
    })

    it('perf-index-as-key: 检测 idx 作为 key', () => {
      const r = analyzeFile('a.tsx', '<div key={idx}>item</div>')
      expect(findDiag(r, 'perf-index-as-key')).toBeDefined()
    })

    it('perf-anonymous-component: 检测匿名渲染函数', () => {
      const r = analyzeFile('a.tsx', 'render={() => <div />}')
      expect(findDiag(r, 'perf-anonymous-component')).toBeDefined()
    })

    it('import-no-default-react: 检测默认导入 React', () => {
      const r = analyzeFile('a.tsx', "import React from 'react';")
      expect(findDiag(r, 'import-no-default-react')).toBeDefined()
      expect(findDiag(r, 'import-no-default-react')!.severity).toBe('hint')
    })

    it('import-no-default-react: 具名导入不报错', () => {
      const r = analyzeFile('a.tsx', "import { useState } from 'react';")
      expect(findDiag(r, 'import-no-default-react')).toBeUndefined()
    })

    it('import-duplicate: 检测重复导入', () => {
      const code = "import { A } from 'mod';\nimport { B } from 'mod';"
      const r = analyzeFile('a.ts', code)
      expect(findDiag(r, 'import-duplicate')).toBeDefined()
    })

    it('import-duplicate: 不同模块不报错', () => {
      const code = "import { A } from 'mod1';\nimport { B } from 'mod2';"
      const r = analyzeFile('a.ts', code)
      expect(findDiag(r, 'import-duplicate')).toBeUndefined()
    })
  })

  describe('Security Rules', () => {
    it('sec-dangerouslySetInnerHTML: 检测 XSS 风险', () => {
      const r = analyzeFile('a.tsx', '<div dangerouslySetInnerHTML={{__html: html}} />')
      expect(findDiag(r, 'sec-dangerouslySetInnerHTML')).toBeDefined()
    })

    it('sec-eval-usage: 检测 eval()', () => {
      const r = analyzeFile('a.ts', 'eval("console.log(1)")')
      expect(findDiag(r, 'sec-eval-usage')).toBeDefined()
      expect(findDiag(r, 'sec-eval-usage')!.severity).toBe('error')
    })

    it('sec-eval-usage: 检测 new Function()', () => {
      const r = analyzeFile('a.ts', 'new Function("return 1")')
      expect(findDiag(r, 'sec-eval-usage')).toBeDefined()
    })

    it('sec-eval-usage: 跳过注释', () => {
      const r = analyzeFile('a.ts', '// eval("code")')
      expect(findDiag(r, 'sec-eval-usage')).toBeUndefined()
    })

    it('sec-hardcoded-secret: 检测硬编码 API key', () => {
      const r = analyzeFile('a.ts', 'const api_key = "abcdefghijklmnopqrstuvwxyz1234567890"')
      expect(findDiag(r, 'sec-hardcoded-secret')).toBeDefined()
    })

    it('sec-hardcoded-secret: 检测硬编码 token', () => {
      const r = analyzeFile('a.ts', 'const token = "abc123def456ghi789jkl012mno345"')
      expect(findDiag(r, 'sec-hardcoded-secret')).toBeDefined()
    })

    it('sec-hardcoded-secret: 跳过注释', () => {
      const r = analyzeFile('a.ts', '// const secret = "abc123def456ghi789jkl012"')
      expect(findDiag(r, 'sec-hardcoded-secret')).toBeUndefined()
    })
  })

  describe('Accessibility Rules', () => {
    it('a11y-img-alt: 检测 img 缺少 alt', () => {
      const r = analyzeFile('a.tsx', '<img src="pic.jpg" />')
      expect(findDiag(r, 'a11y-img-alt')).toBeDefined()
    })

    it('a11y-img-alt: 有 alt 不报错', () => {
      const r = analyzeFile('a.tsx', '<img src="pic.jpg" alt="photo" />')
      expect(findDiag(r, 'a11y-img-alt')).toBeUndefined()
    })

    it('a11y-button-type: 检测 button 缺少 type', () => {
      const r = analyzeFile('a.tsx', '<button onClick={fn}>Click</button>')
      expect(findDiag(r, 'a11y-button-type')).toBeDefined()
    })

    it('a11y-button-type: 有 type 不报错', () => {
      const r = analyzeFile('a.tsx', '<button type="button" onClick={fn}>Click</button>')
      expect(findDiag(r, 'a11y-button-type')).toBeUndefined()
    })

    it('a11y-click-handler-no-keyboard: 检测 div onClick 无键盘事件', () => {
      const r = analyzeFile('a.tsx', '<div onClick={fn}>Click me</div>')
      expect(findDiag(r, 'a11y-click-handler-no-keyboard')).toBeDefined()
    })

    it('a11y-click-handler-no-keyboard: 有 role 不报错', () => {
      const r = analyzeFile('a.tsx', '<div role="button" tabIndex={0} onClick={fn} onKeyDown={fn}>Click</div>')
      expect(findDiag(r, 'a11y-click-handler-no-keyboard')).toBeUndefined()
    })
  })

  describe('Style Rules', () => {
    it('style-hardcoded-color: 检测硬编码颜色', () => {
      const r = analyzeFile('a.tsx', '<div style={{color: "#ff0000"}} />')
      expect(findDiag(r, 'style-hardcoded-color')).toBeDefined()
    })

    it('style-important: 检测 !important', () => {
      const r = analyzeFile('a.css', '.x { color: red !important; }')
      expect(findDiag(r, 'style-important')).toBeDefined()
      expect(findDiag(r, 'style-important')!.severity).toBe('warning')
    })

    it('style-important: 跳过 CSS 注释中包含 // 的情况', () => {
      const r = analyzeFile('a.css', '// color: red !important;')
      expect(findDiag(r, 'style-important')).toBeUndefined()
    })
  })

  describe('Best Practice Rules', () => {
    it('bp-empty-catch: 检测空 catch 块', () => {
      const r = analyzeFile('a.ts', 'try { fn(); } catch (e) {}')
      expect(findDiag(r, 'bp-empty-catch')).toBeDefined()
    })

    it('bp-nested-ternary: 检测嵌套三元', () => {
      const r = analyzeFile('a.ts', 'const x = a ? b ? 1 : 2 : 3;')
      expect(findDiag(r, 'bp-nested-ternary')).toBeDefined()
    })

    it('bp-magic-number: 检测魔法数字', () => {
      const r = analyzeFile('a.ts', 'const timeout = 3000;')
      expect(findDiag(r, 'bp-magic-number')).toBeDefined()
    })

    it('bp-magic-number: 跳过允许的数字', () => {
      const r = analyzeFile('a.ts', 'const x = 0;\nconst y = 1;\nconst z = -1;')
      expect(findDiag(r, 'bp-magic-number')).toBeUndefined()
    })

    it('bp-magic-number: 跳过带单位的数字', () => {
      const r = analyzeFile('a.ts', 'width: 100px;')
      expect(findDiag(r, 'bp-magic-number')).toBeUndefined()
    })
  })

  describe('analyzeFile 通用', () => {
    it('空文件返回空诊断', () => {
      const r = analyzeFile('a.ts', '')
      expect(r.diagnostics).toHaveLength(0)
      expect(r.filepath).toBe('a.ts')
      expect(typeof r.analyzedAt).toBe('number')
    })

    it('干净代码不报错', () => {
      const r = analyzeFile('a.ts', 'const x: number = 1;\nexport { x };')
      expect(r.diagnostics).toHaveLength(0)
    })

    it('诊断按严重度排序', () => {
      const code = 'const x: any = eval("1");\nconsole.log(x);'
      const r = analyzeFile('a.ts', code)
      if (r.diagnostics.length > 1) {
        const order = { error: 0, warning: 1, info: 2, hint: 3 }
        for (let i = 1; i < r.diagnostics.length; i++) {
          expect(order[r.diagnostics[i].severity]).toBeGreaterThanOrEqual(
            order[r.diagnostics[i - 1].severity],
          )
        }
      }
    })

    it('非代码文件跳过所有 ts 规则', () => {
      const r = analyzeFile('a.md', 'const x: any = 1;')
      expect(r.diagnostics).toHaveLength(0)
    })

    it('多条规则可以同时触发', () => {
      const code = [
        'const x: any = 1;',
        'console.log(x);',
        '// TODO: cleanup',
        'try { x; } catch(e) {}',
      ].join('\n')
      const r = analyzeFile('a.ts', code)
      const ruleIds = r.diagnostics.map(d => d.ruleId)
      expect(ruleIds).toContain('ts-any-usage')
      expect(ruleIds).toContain('ts-console-log')
      expect(ruleIds).toContain('ts-todo-fixme')
    })
  })

  describe('analyzeProject', () => {
    it('分析多文件项目', () => {
      const r = analyzeProject({
        'src/a.ts': 'const x: any = 1;',
        'src/b.ts': 'const y = 2;',
      })
      expect(r.files.length).toBeGreaterThanOrEqual(1)
      expect(r.totalWarnings).toBeGreaterThan(0)
    })

    it('跳过非代码文件', () => {
      const r = analyzeProject({
        'README.md': '# Hello',
        'image.png': 'binary',
        'data.json': '{}',
      })
      expect(r.files).toHaveLength(0)
    })

    it('跳过超大文件', () => {
      const r = analyzeProject({ 'big.ts': 'x'.repeat(50001) })
      expect(r.files).toHaveLength(0)
    })

    it('空项目返回零统计', () => {
      const r = analyzeProject({})
      expect(r.files).toHaveLength(0)
      expect(r.totalErrors).toBe(0)
      expect(r.totalWarnings).toBe(0)
      expect(r.totalInfos).toBe(0)
      expect(r.totalHints).toBe(0)
    })

    it('正确分类 severity', () => {
      const r = analyzeProject({
        'a.ts': 'eval("code");',
        'b.ts': 'const x: any = 1;',
      })
      expect(r.totalErrors).toBeGreaterThan(0)
      expect(r.totalWarnings).toBeGreaterThan(0)
    })
  })

  describe('applyAutoFix', () => {
    it('替换指定行范围', () => {
      const fix: AutoFix = {
        description: 'fix',
        range: { startLine: 2, endLine: 3 },
        replacement: 'fixed',
      }
      expect(applyAutoFix('a\nb\nc\nd', fix)).toBe('a\nfixed\nd')
    })

    it('空替换删除行', () => {
      const fix: AutoFix = {
        description: 'remove',
        range: { startLine: 2, endLine: 2 },
        replacement: '',
      }
      expect(applyAutoFix('a\nb\nc', fix)).toBe('a\nc')
    })

    it('多行替换', () => {
      const fix: AutoFix = {
        description: 'multi',
        range: { startLine: 1, endLine: 1 },
        replacement: 'x\ny\nz',
      }
      expect(applyAutoFix('a\nb', fix)).toBe('x\ny\nz\nb')
    })
  })

  describe('buildFixPromptContext', () => {
    it('生成完整修复上下文', () => {
      const diag: Diagnostic = {
        id: 'd1', ruleId: 'ts-any-usage', filepath: 'a.ts',
        line: 2, column: 7, severity: 'warning', category: 'typescript',
        message: 'Avoid any', suggestion: 'Use specific type',
      }
      const prompt = buildFixPromptContext(diag, 'line1\nconst x: any = 1;\nline3')
      expect(prompt).toContain('a.ts')
      expect(prompt).toContain('ts-any-usage')
      expect(prompt).toContain('Avoid any')
      expect(prompt).toContain('Use specific type')
      expect(prompt).toContain('const x: any')
    })

    it('无 suggestion 时省略建议行', () => {
      const diag: Diagnostic = {
        id: 'd2', ruleId: 'ts-console-log', filepath: 'a.ts',
        line: 1, column: 1, severity: 'info', category: 'typescript',
        message: 'No console',
      }
      const prompt = buildFixPromptContext(diag, 'console.log(1);')
      expect(prompt).not.toContain('**建议**')
    })

    it('有 endLine 时使用范围', () => {
      const diag: Diagnostic = {
        id: 'd3', ruleId: 'test', filepath: 'a.ts',
        line: 2, endLine: 4, column: 1, severity: 'warning', category: 'typescript',
        message: 'test',
      }
      const prompt = buildFixPromptContext(diag, 'a\nb\nc\nd\ne')
      expect(prompt).toContain('a.ts')
    })
  })

  describe('getRuleDescriptions', () => {
    it('返回所有 27 条规则', () => {
      const rules = getRuleDescriptions()
      expect(rules.length).toBeGreaterThanOrEqual(25)
      for (const r of rules) {
        expect(r).toHaveProperty('id')
        expect(r).toHaveProperty('name')
        expect(r).toHaveProperty('category')
        expect(r).toHaveProperty('severity')
      }
    })

    it('包含所有类别', () => {
      const rules = getRuleDescriptions()
      const categories = [...new Set(rules.map(r => r.category))]
      expect(categories).toContain('typescript')
      expect(categories).toContain('react')
      expect(categories).toContain('security')
      expect(categories).toContain('accessibility')
      expect(categories).toContain('best-practice')
    })

    it('包含所有已知规则 ID', () => {
      const rules = getRuleDescriptions()
      const ids = rules.map(r => r.id)
      const expected = [
        'ts-any-usage', 'ts-non-null-assertion', 'ts-console-log', 'ts-todo-fixme',
        'react-missing-key', 'react-direct-state-mutation', 'react-missing-deps',
        'react-hooks-conditional', 'react-inline-style-object', 'react-fragment-unnecessary',
        'import-duplicate', 'import-no-default-react',
        'perf-large-inline-array', 'perf-anonymous-component', 'perf-index-as-key',
        'a11y-img-alt', 'a11y-button-type', 'a11y-click-handler-no-keyboard',
        'style-hardcoded-color', 'style-important',
        'sec-dangerouslySetInnerHTML', 'sec-eval-usage', 'sec-hardcoded-secret',
        'bp-empty-catch', 'bp-magic-number', 'bp-nested-ternary', 'bp-function-length',
      ]
      for (const id of expected) {
        expect(ids).toContain(id)
      }
    })
  })
})
