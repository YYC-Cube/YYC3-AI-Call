/**
 * file AgentStatus.tsx
 * description Agent 状态组件
 * module @yyc3/ui
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.1
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Agent 状态组件
 */
import { useState } from 'react'

export interface AgentStatusInfo {
  id: string
  name: string
  status: 'idle' | 'busy' | 'error'
  currentTask?: string
  lastActivity?: Date
}

export function AgentStatus() {
  const [agents] = useState<AgentStatusInfo[]>([
    { id: 'meta-oracle', name: '元启·天枢', status: 'idle' },
    { id: 'sentinel', name: '智云·守护', status: 'idle' },
    { id: 'master', name: '格物·宗师', status: 'idle' },
    { id: 'creative', name: '创想·灵韵', status: 'idle' },
    { id: 'navigator', name: '言启·千行', status: 'idle' },
    { id: 'thinker', name: '语枢·万物', status: 'idle' },
    { id: 'prophet', name: '预见·先知', status: 'idle' },
    { id: 'recommender', name: '知遇·伯乐', status: 'idle' }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return '#4ade80'
      case 'busy': return '#fbbf24'
      case 'error': return '#f87171'
      default: return '#94a3b8'
    }
  }

  return (
    <div className="agent-status">
      <h3>智能体状态</h3>
      <div className="agent-status__list">
        {agents.map(agent => (
          <div key={agent.id} className="agent-status__item">
            <span 
              className="agent-status__indicator"
              style={{ backgroundColor: getStatusColor(agent.status) }}
            />
            <span className="agent-status__name">{agent.name}</span>
            {agent.currentTask && (
              <span className="agent-status__task">{agent.currentTask}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgentStatus
