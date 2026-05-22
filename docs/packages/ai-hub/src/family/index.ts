/**
 * file index.ts
 * description @yyc3/ai-hub 模块入口
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub 模块入口
 */
export * from './base-member';
export * from './members';
export type * from './types';

export { FamilyOrchestrator } from './orchestrator';
export type { EmotionalIntelligence } from './emotional-intelligence';
export type { PersonalizedGrowthSystem } from './growth-system';

import { FamilyOrchestrator } from './orchestrator';
import { EmotionalIntelligence } from './emotional-intelligence';
import { PersonalizedGrowthSystem } from './growth-system';