/**
 * file AgentCard.tsx
 * description Agent 卡片组件
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
 * brief Agent 卡片组件
 */
import type { AgentDefinition } from '@yyc3/core/ai-family'

interface Capability {
  name: string
  description: string
}

export interface AgentCardProps {
  agent: AgentDefinition
  onClick?: () => void
  showCapabilities?: boolean
}

export function AgentCard({ 
  agent, 
  onClick,
  showCapabilities = true 
}: AgentCardProps) {
  return (
    <div 
      className={`agent-card agent-card--${agent.id}`}
      onClick={onClick}
    >
      <div className="agent-card__header">
        <span className="agent-card__emoji">{(agent as any).emoji || '🤖'}</span>
        <div className="agent-card__info">
          <h3 className="agent-card__name">{(agent as any).displayName || agent.id}</h3>
          <p className="agent-card__role">{(agent as any).role || 'Agent'}</p>
        </div>
      </div>
      
      <p className="agent-card__description">{(agent as any).description || ''}</p>
      
      {showCapabilities && (agent as any).capabilities && (
        <div className="agent-card__capabilities">
          <h4>核心能力</h4>
          <ul>
            {(agent as any).capabilities.slice(0, 3).map((cap: Capability, index: number) => (
              <li key={index}>
                <strong>{cap.name}</strong>: {cap.description}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="agent-card__footer">
        <span className="agent-card__priority">优先级: {(agent as any).priority || '-'}</span>
        <span className="agent-card__tasks">
          最大并发: {(agent as any).maxConcurrentTasks || '-'}
        </span>
      </div>
    </div>
  )
}

export default AgentCard
