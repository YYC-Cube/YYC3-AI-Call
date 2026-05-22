export interface AgentRouteRule {
  agent: string
  keywords: string[]
  patterns?: RegExp[]
  priority: number
}

const DEFAULT_RULES: AgentRouteRule[] = [
  { agent: 'security-scanning', keywords: ['security', 'vulnerability', 'audit', '安全', '漏洞'], priority: 90 },
  { agent: 'kubernetes-operations', keywords: ['k8s', 'kubernetes', 'deploy', 'container', 'docker', 'helm'], priority: 85 },
  { agent: 'llm-application-dev', keywords: ['llm', 'rag', 'prompt', 'agent', 'ai', '模型', 'embedding'], priority: 80 },
  { agent: 'backend-development', keywords: ['api', 'server', 'database', 'microservice', 'backend', 'rest', 'graphql'], priority: 75 },
  { agent: 'python-development', keywords: ['python', 'data', 'ml', 'machine learning', 'pytorch', 'pandas'], priority: 70 },
  { agent: 'javascript-typescript', keywords: ['javascript', 'typescript', 'node', 'react', 'vue', 'next', 'nuxt'], priority: 70 },
  { agent: 'rust-development', keywords: ['rust', 'cargo', 'wasm', '系统编程'], priority: 65 },
  { agent: 'go-development', keywords: ['golang', 'go', '并发', 'goroutine'], priority: 65 },
  { agent: 'mobile-development', keywords: ['mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'], priority: 60 },
  { agent: 'devops', keywords: ['devops', 'ci', 'cd', 'pipeline', 'jenkins', 'github actions'], priority: 55 },
  { agent: 'testing', keywords: ['test', '测试', 'unit', 'integration', 'e2e', 'vitest', 'jest'], priority: 50 },
  { agent: 'documentation', keywords: ['doc', '文档', 'readme', 'api doc', 'typedoc'], priority: 45 },
]

export class AgentRouter {
  private static rules: AgentRouteRule[] = [...DEFAULT_RULES]
  private static customRules: AgentRouteRule[] = []

  static addRule(rule: AgentRouteRule): void {
    this.customRules.push(rule)
  }

  static clearCustomRules(): void {
    this.customRules = []
  }

  static route(task: string): string[] {
    const lowerTask = task.toLowerCase()
    const allRules = [...this.customRules, ...this.rules]

    const scored: Array<{ agent: string; score: number }> = []

    for (const rule of allRules) {
      let score = 0

      for (const keyword of rule.keywords) {
        if (lowerTask.includes(keyword.toLowerCase())) {
          score += keyword.length
        }
      }

      if (rule.patterns) {
        for (const pattern of rule.patterns) {
          if (pattern.test(task)) {
            score += 10
          }
        }
      }

      if (score > 0) {
        scored.push({ agent: rule.agent, score: score * (rule.priority / 100) })
      }
    }

    scored.sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      return ['general']
    }

    return scored.slice(0, 3).map(s => s.agent)
  }
}
