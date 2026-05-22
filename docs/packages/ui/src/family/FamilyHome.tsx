/**
 * file FamilyHome.tsx
 * description Family 首页组件
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
 * brief Family 首页组件
 */
import { AgentCard } from './AgentCard'
import { 
  MetaOracleDefinition,
  SentinelDefinition,
  MasterDefinition,
  CreativeDefinition,
  NavigatorDefinition,
  ThinkerDefinition,
  ProphetDefinition,
  BoleroDefinition
} from '@yyc3/core/ai-family'

export function FamilyHome() {
  const agents = [
    MetaOracleDefinition,
    SentinelDefinition,
    MasterDefinition,
    CreativeDefinition,
    NavigatorDefinition,
    ThinkerDefinition,
    ProphetDefinition,
    BoleroDefinition
  ]

  return (
    <div className="family-home">
      <div className="family-welcome">
        <h2>欢迎来到 AI Family</h2>
        <p>亦师亦友亦伯乐；一言一语一华章</p>
      </div>
      
      <div className="agents-grid">
        {agents.map((agent) => (
          <AgentCard 
            key={agent.id}
            agent={agent}
          />
        ))}
      </div>
    </div>
  )
}

export default FamilyHome
