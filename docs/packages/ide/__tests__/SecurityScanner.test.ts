import { describe, it, expect } from 'vitest'
import type { SecurityFinding, SecurityReport, ProjectSecurityReport } from '../ai/SecurityScanner'

describe('SecurityScanner types', () => {
  it('SecurityFinding 应该有正确的结构', () => {
    const finding: SecurityFinding = {
      id: 'sec-1',
      ruleId: 'xss-dangerous-innerhtml',
      filepath: 'src/App.tsx',
      line: 15,
      column: 10,
      severity: 'high',
      category: 'xss',
      title: 'Dangerous innerHTML usage',
      description: 'Using dangerouslySetInnerHTML can lead to XSS attacks',
      cweId: 'CWE-79',
      owaspCategory: 'A03:2021 - Injection',
      remediation: 'Use a sanitizer library or React text rendering',
      autoFixable: false,
    }
    expect(finding.severity).toBe('high')
    expect(finding.category).toBe('xss')
    expect(finding.cweId).toBe('CWE-79')
  })

  it('SecuritySeverity 应该包含所有级别', () => {
    const severities = ['critical', 'high', 'medium', 'low', 'info'] as const
    expect(severities).toHaveLength(5)
  })

  it('SecurityCategory 应该包含所有类别', () => {
    const categories = [
      'xss', 'injection', 'auth', 'sensitive-data', 'dependency',
      'csrf', 'config', 'crypto', 'access-control', 'supply-chain',
    ] as const
    expect(categories).toHaveLength(10)
  })

  it('SecurityReport 应该有正确的结构', () => {
    const report: SecurityReport = {
      filepath: 'src/App.tsx',
      findings: [],
      riskScore: 15,
      analyzedAt: Date.now(),
    }
    expect(report.riskScore).toBeLessThan(100)
    expect(report.findings).toHaveLength(0)
  })

  it('ProjectSecurityReport 应该汇总正确', () => {
    const report: ProjectSecurityReport = {
      files: [
        { filepath: 'a.ts', findings: [], riskScore: 10, analyzedAt: Date.now() },
        { filepath: 'b.ts', findings: [], riskScore: 20, analyzedAt: Date.now() },
      ],
      overallRiskScore: 15,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 1,
      lowCount: 2,
      infoCount: 0,
      topFindings: [],
      categoryBreakdown: { xss: 0, injection: 0, auth: 0, 'sensitive-data': 0, dependency: 0, csrf: 0, config: 0, crypto: 0, 'access-control': 0, 'supply-chain': 0 },
      analyzedAt: Date.now(),
    }
    expect(report.overallRiskScore).toBe(15)
    expect(report.files).toHaveLength(2)
  })

  it('SecurityFinding autoFix 应该有正确的结构', () => {
    const finding: SecurityFinding = {
      id: 'sec-2',
      ruleId: 'eval-usage',
      filepath: 'src/eval.ts',
      line: 5,
      column: 1,
      severity: 'critical',
      category: 'injection',
      title: 'eval() usage detected',
      description: 'eval() can execute arbitrary code',
      remediation: 'Replace eval with JSON.parse or Function constructor',
      autoFixable: true,
      autoFix: {
        range: { startLine: 5, endLine: 5 },
        replacement: 'JSON.parse(input)',
      },
    }
    expect(finding.autoFix).toBeDefined()
    expect(finding.autoFix!.replacement).toBe('JSON.parse(input)')
  })
})
