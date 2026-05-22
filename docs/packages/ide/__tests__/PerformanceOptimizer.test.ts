import { describe, it, expect } from 'vitest'
import type { PerformanceSuggestion, PerformanceReport, ProjectPerformanceReport, OptimizationCategory, OptimizationImpact } from '../ai/PerformanceOptimizer'

describe('PerformanceOptimizer types', () => {
  it('OptimizationCategory 应该包含所有类别', () => {
    const categories: OptimizationCategory[] = [
      'render', 'state', 'code-split', 'memoization',
      'resource', 'memory', 'network', 'bundle',
    ]
    expect(categories).toHaveLength(8)
  })

  it('OptimizationImpact 应该包含所有级别', () => {
    const impacts: OptimizationImpact[] = ['high', 'medium', 'low']
    expect(impacts).toHaveLength(3)
  })

  it('PerformanceSuggestion 应该有正确的结构', () => {
    const suggestion: PerformanceSuggestion = {
      id: 'perf-1',
      ruleId: 'render-no-memo',
      filepath: 'src/App.tsx',
      line: 10,
      category: 'render',
      impact: 'medium',
      title: '组件未使用 React.memo',
      description: '建议使用 React.memo 优化',
      codeExample: {
        before: 'export function App() {}',
        after: 'const App = React.memo(function App() {})',
      },
      docsUrl: 'https://react.dev/reference/react/memo',
    }
    expect(suggestion.category).toBe('render')
    expect(suggestion.impact).toBe('medium')
    expect(suggestion.codeExample).toBeDefined()
  })

  it('PerformanceReport 应该有正确的结构', () => {
    const report: PerformanceReport = {
      filepath: 'src/App.tsx',
      suggestions: [],
      score: 85,
      analyzedAt: Date.now(),
    }
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(100)
  })

  it('ProjectPerformanceReport 应该汇总正确', () => {
    const report: ProjectPerformanceReport = {
      files: [
        { filepath: 'a.tsx', suggestions: [], score: 90, analyzedAt: Date.now() },
        { filepath: 'b.tsx', suggestions: [], score: 80, analyzedAt: Date.now() },
      ],
      overallScore: 85,
      topIssues: [],
      categoryBreakdown: {
        render: 0, state: 0, 'code-split': 0, memoization: 0,
        resource: 0, memory: 0, network: 0, bundle: 0,
      },
      analyzedAt: Date.now(),
    }
    expect(report.files).toHaveLength(2)
    expect(report.categoryBreakdown.render).toBe(0)
  })
})
