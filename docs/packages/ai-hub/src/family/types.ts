/**
 * file types.ts
 * description @yyc3/ai-hub 类型定义
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub 类型定义
 */
export type FamilyRole =
  | 'teacher'
  | 'friend'
  | 'mentor'
  | 'guardian'
  | 'companion'
  | 'advisor'
  | 'creator'
  | 'navigator'
  | 'analyst'
  | 'prophet'
  | 'recommender'
  | 'orchestrator'
  | 'sentinel'
  | 'master';

export type EmotionType = 
  | 'joy' 
  | 'peace' 
  | 'anxiety' 
  | 'sadness' 
  | 'anger' 
  | 'confusion' 
  | 'excitement' 
  | 'frustration';

export type CollaborationMode =
  | 'sequential'
  | 'parallel'
  | 'hierarchical'
  | 'democratic'
  | 'mentoring'
  | 'creative'
  | 'visual'
  | 'independent'
  | 'logical'
  | 'harmonious'
  | 'inclusive'
  | 'results-driven'
  | 'user-centered'
  | 'paradigm-shifting'
  | 'collaborative'
  | 'intuitive';

export type GrowthStage = 
  | 'seed' 
  | 'sprout' 
  | 'sapling' 
  | 'tree' 
  | 'forest';

export interface EmotionState {
  type: EmotionType;
  intensity: number;
  confidence: number;
  timestamp: Date;
  triggers?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  
  capabilities: {
    skills: Map<string, number>;
    knowledgeAreas: Map<string, number>;
    growthRate: number;
  };
  
  interests: {
    domains: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    interactionMode: 'proactive' | 'responsive' | 'balanced';
  };
  
  emotions: {
    patterns: EmotionPattern[];
    stressLevel: number;
    supportNeeds: string[];
  };
  
  growth: {
    goals: Goal[];
    milestones: Milestone[];
    achievements: Achievement[];
    stage: GrowthStage;
  };
  
  preferences: {
    communicationStyle: 'formal' | 'casual' | 'adaptive';
    responseLength: 'brief' | 'detailed' | 'adaptive';
    proactivityLevel: number;
  };
}

export interface EmotionPattern {
  type: EmotionType;
  frequency: number;
  triggers: string[];
  copingMechanisms: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'knowledge' | 'project' | 'life';
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progress: number;
  deadline?: Date;
  subGoals?: Goal[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  significance: 'minor' | 'moderate' | 'major' | 'breakthrough';
  relatedGoalId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MultimodalInput {
  text?: string;
  image?: Buffer;
  audio?: Buffer;
  video?: Buffer;
  metadata?: Record<string, unknown>;
}

export interface MultimodalResponse {
  text: string;
  emotion?: EmotionState;
  suggestions?: string[];
  actions?: RecommendedAction[];
  followUpQuestions?: string[];
}

export interface RecommendedAction {
  type:
    | 'learn'
    | 'practice'
    | 'create'
    | 'collaborate'
    | 'reflect'
    | 'architect'
    | 'review'
    | 'optimize'
    | 'secure'
    | 'analyze'
    | 'protect'
    | 'ux'
    | 'prototype'
    | 'test'
    | 'research'
    | 'innovate'
    | 'mentor'
    | 'coordinate'
    | 'harmonize'
    | 'care'
    | 'strategy'
    | 'execute'
    | 'lead'
    | 'design'
    | 'inspire'
    | 'product'
    | 'support'
    | 'search'
    | 'navigate'
    | 'route'
    | 'summarize'
    | 'deduct'
    | 'predict'
    | 'detect'
    | 'warn'
    | 'recommend'
    | 'discover'
    | 'surprise'
    | 'orchestrate'
    | 'decide'
    | 'monitor'
    | 'respond'
    | 'standardize'
    | 'evolve';
  title: string;
  description: string;
  priority: number;
  estimatedTime?: number;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  history: ConversationTurn[];
  currentEmotion?: EmotionState;
  activeGoals: Goal[];
  relevantKnowledge: string[];
}

export interface ConversationTurn {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'family';
  memberId?: string;
  content: MultimodalInput | MultimodalResponse;
  emotion?: EmotionState;
  intent?: string;
}

export interface TaskContext {
  taskId: string;
  description: string;
  type: 'learning' | 'working' | 'creating' | 'exploring' | 'problem_solving';
  complexity: 'simple' | 'moderate' | 'complex';
  urgency: 'low' | 'medium' | 'high';
  requiredCapabilities: string[];
  userContext: ConversationContext;
}

export interface CollaborationSession {
  id: string;
  task: TaskContext;
  members: FamilyMemberState[];
  mode: CollaborationMode;
  startTime: Date;
  status: 'planning' | 'executing' | 'reviewing' | 'completed';
  outputs: CollaborationOutput[];
}

export interface FamilyMemberState {
  memberId: string;
  role: FamilyRole;
  assignedTasks: string[];
  contributions: MemberContribution[];
  performance: PerformanceMetrics;
}

export interface MemberContribution {
  timestamp: Date;
  type: 'analysis' | 'suggestion' | 'execution' | 'review';
  content: string;
  impact: number;
}

export interface PerformanceMetrics {
  accuracy: number;
  relevance: number;
  timeliness: number;
  userSatisfaction: number;
  growthContribution: number;
}

export interface CollaborationOutput {
  memberId: string;
  type: 'insight' | 'recommendation' | 'suggestion' | 'artifact' | 'feedback';
  content: unknown;
  confidence: number;
}

export interface EmotionalResponse {
  acknowledgment: string;
  empathy: string;
  support: string;
  action?: RecommendedAction;
}

export interface GrowthReport {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    goalsProgress: number;
    skillsImproved: string[];
    achievementsUnlocked: Achievement[];
    emotionalGrowth: string;
    overallGrowth: number;
  };
  insights: string[];
  recommendations: string[];
  nextSteps: RecommendedAction[];
}

export interface FamilyMemberConfig {
  id: string;
  name: string;
  displayName: string;
  role: FamilyRole;
  description: string;
  capabilities: string[];
  personality: {
    tone:
      | 'warm'
      | 'professional'
      | 'playful'
      | 'wise'
      | 'confident'
      | 'artistic'
      | 'analytical'
      | 'gentle'
      | 'rational'
      | 'authoritative'
      | 'serious'
      | 'enthusiastic';
    proactivity: number;
    empathy: number;
    patience: number;
  };
  triggers: string[];
  collaborationPreferences: {
    preferredPartners: string[];
    preferredModes: CollaborationMode[];
  };
}

export interface FamilyOrchestrationConfig {
  maxActiveMembers: number;
  defaultCollaborationMode: CollaborationMode;
  emotionSensitivity: number;
  proactivityThreshold: number;
  learningRate: number;
}
