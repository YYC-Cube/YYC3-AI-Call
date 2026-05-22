/**
 * file AIFamilyPanel.tsx
 * description AI Family 面板组件
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
 * brief AI Family 面板组件
 */
import { FamilyLayout } from './FamilyLayout'

export interface AIFamilyPanelProps {
  className?: string
  showHeader?: boolean
  defaultView?: 'home' | 'members' | 'settings'
}

export function AIFamilyPanel({ 
  className = '', 
  showHeader = true,
  defaultView = 'home' 
}: AIFamilyPanelProps) {
  return (
    <div className={`ai-family-panel ${className}`}>
      <FamilyLayout showHeader={showHeader} defaultView={defaultView} />
    </div>
  )
}

export default AIFamilyPanel
