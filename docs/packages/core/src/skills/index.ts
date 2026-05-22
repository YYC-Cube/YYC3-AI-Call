/**
 * file index.ts
 * description @yyc3/core 模块入口
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 模块入口
 */
export { SkillManager } from './manager.js'
export { SkillRecommender } from './skill-recommender.js'
export { SkillLearner } from './skill-learner.js'
export { SkillComposer } from './skill-composer.js'
export { SkillQualityGates } from './skill-quality-gates.js'
export { ReasoningSkill, GenerationSkill, AnalysisSkill } from './builtin.js'

export {
  IndustrySkillDefinitions,
  getIndustrySkills,
  MedicalHealthSkill,
  EducationSkill,
  FinanceSkill,
  RetailSkill,
  LogisticsSkill,
  LawSkill,
  HRSkill,
  ManufacturingSkill,
  AgricultureSkill,
  SmartCitySkill,
  EnergySkill,
  EnvironmentSkill,
  TourismSkill,
  MediaSkill,
  FoodBeverageSkill,
  TrafficSkill,
  RealEstateSkill,
  ElderlyCareSkill,
  CulturalCreativeSkill,
  APIIntegrationSkill,
  EnterpriseManagementSkill,
  CoreFrameworkSkill,
} from './industry-skills.js'

export type { 
  SkillDefinition, 
  ExecutionContext, 
  SkillExecutionResult,
  SkillRegistryItem,
  SkillHandler,
  SkillCategory,
} from './types.js'

export type {
  SkillRecommendation,
  RecommendationContext,
  SkillExecutionHistory,
  UserPreferences,
} from './skill-recommender.js'

export type {
  LearningData,
  UserFeedback,
  SkillOptimization,
  LearningModel,
  PerformanceMetrics,
} from './skill-learner.js'

export type {
  CompositionMode,
  CompositionStep,
  CompositionDefinition,
  CompositionResult,
} from './skill-composer.js'

export type {
  QualityGateType,
  QualityGateRule,
  QualityCheckContext,
  QualityCheckResult,
  QualityGateReport,
} from './skill-quality-gates.js'
