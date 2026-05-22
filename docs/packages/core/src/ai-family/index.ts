/**
 * file index.ts
 * description @yyc3/core 模块入口
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 模块入口
 */
export { AIFamilyManager } from './manager.js'
export { BaseAgent } from './base-agent.js'
export { AgentLayers } from './agent-layers.js'
export { AgentCollaboration } from './agent-collaboration.js'
export { AgentRouter } from './agent-router.js'
export { AgentQualityGates } from './agent-quality-gates.js'

export {
  MetaOracleAgent,
  SentinelAgent,
  MasterAgent,
  CreativeAgent,
  NavigatorAgent,
  ThinkerAgent,
  ProphetAgent,
  BoleroAgent,
} from './agents.js'

export { getAllAgentDefinitions } from './definitions.js'

export {
  MetaOracleDefinition,
  SentinelDefinition,
  MasterDefinition,
  CreativeDefinition,
  NavigatorDefinition,
  ThinkerDefinition,
  ProphetDefinition,
  BoleroDefinition,
  AgentDefinitions,
  getAgentDefinition,
} from './definitions.js'

export {
  ExtendedAgentDefinitions,
  getExtendedAgents,
  TranslatorDefinition,
  SlidesGeneratorDefinition,
  CartoonGeneratorDefinition,
  AIDrawingDefinition,
  ReceiptRecognitionDefinition,
  ClothesRecognitionDefinition,
  ContractParserDefinition,
  ServiceCheckDefinition,
  EducationCorrectionDefinition,
  JobMatcherDefinition,
  ViduTemplateDefinition,
  BidwinParserDefinition,
  EducationSolverDefinition,
} from './extended-definitions.js'

export type {
  AgentRole,
  AgentTask,
  TaskContext,
  TaskResult,
  TaskPriority,
  AgentCapability,
  AgentStatus,
  CollaborationTask,
  AgentRecommendation,
  AgentDefinition,
} from './types.js'

export type {
  AgentLayer,
  LayerConfig,
  ThreeLayerArchitectureConfig,
  ArchitectureEvents,
} from './agent-layers.js'

export type {
  CollaborationMessageType,
  CollaborationMessage,
  CollaborationSession,
  CollaborationStrategy,
  CollaborationConfig,
  CollaborationEvents,
} from './agent-collaboration.js'

export type {
  RoutingStrategy,
  RoutingDecision,
  AgentLoad,
  RoutingRule,
  RouterConfig,
} from './agent-router.js'

export type {
  AgentQualityGateType,
  AgentQualityRule,
  AgentQualityContext,
  AgentQualityResult,
  AgentQualityReport,
  AgentQualityGatesConfig,
} from './agent-quality-gates.js'
