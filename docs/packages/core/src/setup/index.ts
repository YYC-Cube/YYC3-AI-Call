/**
 * file index.ts
 * description @yyc3/core 模块入口
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[setup]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 模块入口
 */
export { AutoDetector } from './auto-detector.js'
export { SmartSelector } from './smart-selector.js'
export { QuickStarter } from './quick-starter.js'

export type {
  ProviderType,
  ProviderStatus,
  EnvironmentDetectionResult,
} from './auto-detector.js'

export type {
  SelectionFactors,
  ProviderScore,
  SelectionResult,
  ProviderPerformance,
} from './smart-selector.js'

export type {
  QuickStartConfig,
  QuickStartResult,
  SystemStatus,
} from './quick-starter.js'
