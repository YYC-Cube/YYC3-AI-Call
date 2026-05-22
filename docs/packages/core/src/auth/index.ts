/**
 * file index.ts
 * description @yyc3/core 模块入口
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[auth]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 模块入口
 */
export { UnifiedAuthManager } from './unified-auth.js'
export { OpenAIProvider } from './openai-provider.js'
export { OllamaProvider } from './ollama-provider.js'
export { AnthropicProvider } from './anthropic-provider.js'
export { AuthMonitor } from './auth-monitor.js'
export { AuthSwitcher } from './auth-switcher.js'

export type {
  AuthProvider,
  AuthProviderInfo,
  AuthStatus,
} from './types.js'

export type {
  AuthState,
  HealthCheckResult,
  AuthMonitorConfig,
  AuthMonitorEvents,
} from './auth-monitor.js'

export type {
  SwitchStrategy,
  SwitchReason,
  SwitchDecision,
  AuthSwitcherConfig,
  AuthSwitcherEvents,
} from './auth-switcher.js'

export type {
  UnifiedAuthManagerConfig,
} from './unified-auth.js'
