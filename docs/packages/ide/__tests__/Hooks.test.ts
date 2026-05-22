import { describe, it, expect } from 'vitest'
import type { DiagnosticFilter } from '../hooks/useErrorDiagnostics'
import type { PerformanceReport } from '../hooks/usePerformanceMonitor'

describe('Hooks 类型验证', () => {
  describe('DiagnosticFilter', () => {
    it('应该有正确的默认结构', () => {
      const filter: DiagnosticFilter = {
        severity: new Set(['error', 'warning', 'info', 'hint']),
        category: null,
        searchQuery: '',
        fileFilter: '',
      }
      expect(filter.severity.size).toBe(4)
      expect(filter.category).toBeNull()
    })

    it('应该支持过滤特定严重度', () => {
      const filter: DiagnosticFilter = {
        severity: new Set(['error']),
        category: null,
        searchQuery: '',
        fileFilter: '',
      }
      expect(filter.severity.has('error')).toBe(true)
      expect(filter.severity.has('warning')).toBe(false)
    })

    it('应该支持搜索查询', () => {
      const filter: DiagnosticFilter = {
        severity: new Set(['error', 'warning']),
        category: null,
        searchQuery: 'unused',
        fileFilter: 'src/App.tsx',
      }
      expect(filter.searchQuery).toBe('unused')
      expect(filter.fileFilter).toBe('src/App.tsx')
    })
  })

  describe('PerformanceReport', () => {
    it('应该有正确的结构', () => {
      const report: PerformanceReport = {
        fcp: 800,
        lcp: 1500,
        tti: 2000,
        cls: 0.05,
        fid: 50,
        timestamp: Date.now(),
        url: 'http://localhost:3000',
      }
      expect(report.fcp).toBeLessThan(1000)
      expect(report.lcp).toBeLessThan(2500)
    })

    it('应该支持内存数据', () => {
      const report: PerformanceReport = {
        fcp: null,
        lcp: null,
        tti: null,
        cls: null,
        fid: null,
        memory: {
          used: 128 * 1024 * 1024,
          total: 256 * 1024 * 1024,
          limit: 512 * 1024 * 1024,
        },
        timestamp: Date.now(),
        url: 'http://localhost:3000',
      }
      expect(report.memory).toBeDefined()
      expect(report.memory!.used).toBeLessThan(report.memory!.limit)
    })
  })
})
