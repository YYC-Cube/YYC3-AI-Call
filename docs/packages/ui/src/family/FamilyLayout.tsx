/**
 * file FamilyLayout.tsx
 * description Family 布局组件
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
 * brief Family 布局组件
 */
import { useState } from 'react'
import { FamilyHome } from './FamilyHome'
import { FamilyMembers } from './FamilyMembers'
import { AgentStatus } from './AgentStatus'

export interface FamilyLayoutProps {
  showHeader?: boolean
  defaultView?: 'home' | 'members' | 'settings'
}

export function FamilyLayout({ 
  showHeader = true, 
  defaultView = 'home' 
}: FamilyLayoutProps) {
  const [currentView, setCurrentView] = useState(defaultView)

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <FamilyHome />
      case 'members':
        return <FamilyMembers />
      case 'settings':
        return <div>设置中心（开发中）</div>
      default:
        return <FamilyHome />
    }
  }

  return (
    <div className="family-layout">
      {showHeader && (
        <header className="family-header">
          <h1>AI Family</h1>
          <nav className="family-nav">
            <button onClick={() => setCurrentView('home')}>客厅</button>
            <button onClick={() => setCurrentView('members')}>家人档案</button>
            <button onClick={() => setCurrentView('settings')}>设置</button>
          </nav>
        </header>
      )}
      
      <main className="family-content">
        <AgentStatus />
        {renderContent()}
      </main>
    </div>
  )
}

export default FamilyLayout
