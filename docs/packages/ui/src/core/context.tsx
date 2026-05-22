/**
 * file context.tsx
 * description React Context 上下文
 * module @yyc3/ui
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.1
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ui]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief React Context 上下文
 */
import React, { createContext, useContext } from 'react'

export interface FamilyUIConfig {
  auth?: Record<string, unknown>
  theme?: 'light' | 'dark' | 'auto'
  locale?: string
}

const FamilyUIContext = createContext<FamilyUIConfig | null>(null)

export interface FamilyProviderProps {
  config: FamilyUIConfig
  children: React.ReactNode
}

export function FamilyProvider({ config, children }: FamilyProviderProps) {
  return (
    <FamilyUIContext.Provider value={config}>
      {children}
    </FamilyUIContext.Provider>
  )
}

export function useFamilyConfig() {
  const context = useContext(FamilyUIContext)
  if (!context) {
    throw new Error('useFamilyConfig must be used within FamilyProvider')
  }
  return context
}

export default FamilyProvider
