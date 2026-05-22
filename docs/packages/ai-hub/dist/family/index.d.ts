import { F as FamilyMemberId } from '../types-CLG85-BK.js';

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
type FamilyRole = 'teacher' | 'friend' | 'mentor' | 'guardian' | 'companion' | 'advisor' | 'creator' | 'navigator' | 'analyst' | 'prophet' | 'recommender' | 'orchestrator' | 'sentinel' | 'master';
type EmotionType = 'joy' | 'peace' | 'anxiety' | 'sadness' | 'anger' | 'confusion' | 'excitement' | 'frustration';
type CollaborationMode = 'sequential' | 'parallel' | 'hierarchical' | 'democratic' | 'mentoring' | 'creative' | 'visual' | 'independent' | 'logical' | 'harmonious' | 'inclusive' | 'results-driven' | 'user-centered' | 'paradigm-shifting' | 'collaborative' | 'intuitive';
type GrowthStage = 'seed' | 'sprout' | 'sapling' | 'tree' | 'forest';
interface EmotionState {
    type: EmotionType;
    intensity: number;
    confidence: number;
    timestamp: Date;
    triggers?: string[];
}
interface UserProfile {
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
        patterns: EmotionPattern$1[];
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
interface EmotionPattern$1 {
    type: EmotionType;
    frequency: number;
    triggers: string[];
    copingMechanisms: string[];
}
interface Goal {
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
interface Milestone {
    id: string;
    title: string;
    description: string;
    achievedAt: Date;
    significance: 'minor' | 'moderate' | 'major' | 'breakthrough';
    relatedGoalId?: string;
}
interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
interface MultimodalInput {
    text?: string;
    image?: Buffer;
    audio?: Buffer;
    video?: Buffer;
    metadata?: Record<string, unknown>;
}
interface MultimodalResponse {
    text: string;
    emotion?: EmotionState;
    suggestions?: string[];
    actions?: RecommendedAction[];
    followUpQuestions?: string[];
}
interface RecommendedAction {
    type: 'learn' | 'practice' | 'create' | 'collaborate' | 'reflect' | 'architect' | 'review' | 'optimize' | 'secure' | 'analyze' | 'protect' | 'ux' | 'prototype' | 'test' | 'research' | 'innovate' | 'mentor' | 'coordinate' | 'harmonize' | 'care' | 'strategy' | 'execute' | 'lead' | 'design' | 'inspire' | 'product' | 'support' | 'search' | 'navigate' | 'route' | 'summarize' | 'deduct' | 'predict' | 'detect' | 'warn' | 'recommend' | 'discover' | 'surprise' | 'orchestrate' | 'decide' | 'monitor' | 'respond' | 'standardize' | 'evolve';
    title: string;
    description: string;
    priority: number;
    estimatedTime?: number;
}
interface ConversationContext {
    sessionId: string;
    userId: string;
    history: ConversationTurn[];
    currentEmotion?: EmotionState;
    activeGoals: Goal[];
    relevantKnowledge: string[];
}
interface ConversationTurn {
    id: string;
    timestamp: Date;
    speaker: 'user' | 'family';
    memberId?: string;
    content: MultimodalInput | MultimodalResponse;
    emotion?: EmotionState;
    intent?: string;
}
interface TaskContext {
    taskId: string;
    description: string;
    type: 'learning' | 'working' | 'creating' | 'exploring' | 'problem_solving';
    complexity: 'simple' | 'moderate' | 'complex';
    urgency: 'low' | 'medium' | 'high';
    requiredCapabilities: string[];
    userContext: ConversationContext;
}
interface CollaborationSession {
    id: string;
    task: TaskContext;
    members: FamilyMemberState[];
    mode: CollaborationMode;
    startTime: Date;
    status: 'planning' | 'executing' | 'reviewing' | 'completed';
    outputs: CollaborationOutput[];
}
interface FamilyMemberState {
    memberId: string;
    role: FamilyRole;
    assignedTasks: string[];
    contributions: MemberContribution[];
    performance: PerformanceMetrics;
}
interface MemberContribution {
    timestamp: Date;
    type: 'analysis' | 'suggestion' | 'execution' | 'review';
    content: string;
    impact: number;
}
interface PerformanceMetrics {
    accuracy: number;
    relevance: number;
    timeliness: number;
    userSatisfaction: number;
    growthContribution: number;
}
interface CollaborationOutput {
    memberId: string;
    type: 'insight' | 'recommendation' | 'suggestion' | 'artifact' | 'feedback';
    content: unknown;
    confidence: number;
}
interface EmotionalResponse {
    acknowledgment: string;
    empathy: string;
    support: string;
    action?: RecommendedAction;
}
interface GrowthReport {
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
interface FamilyMemberConfig {
    id: string;
    name: string;
    displayName: string;
    role: FamilyRole;
    description: string;
    capabilities: string[];
    personality: {
        tone: 'warm' | 'professional' | 'playful' | 'wise' | 'confident' | 'artistic' | 'analytical' | 'gentle' | 'rational' | 'authoritative' | 'serious' | 'enthusiastic';
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
interface FamilyOrchestrationConfig {
    maxActiveMembers: number;
    defaultCollaborationMode: CollaborationMode;
    emotionSensitivity: number;
    proactivityThreshold: number;
    learningRate: number;
}

/**
 * file base-member.ts
 * description AI 家人基类
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
 * brief AI 家人基类
 */

interface IFamilyMember {
    readonly id: string;
    readonly name: string;
    readonly role: FamilyRole;
    initialize(config: FamilyMemberConfig): Promise<void>;
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    senseEmotion(context: ConversationContext): EmotionState;
    personalizeResponse(response: MultimodalResponse, profile: UserProfile): MultimodalResponse;
    canHandle(task: TaskContext): boolean;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    updateProfile(feedback: UserFeedback): void;
    getStatus(): MemberStatus;
}
interface UserFeedback {
    userId: string;
    memberId: string;
    rating: number;
    comment?: string;
    helpful: boolean;
    timestamp: Date;
}
interface MemberStatus {
    id: string;
    name: string;
    isActive: boolean;
    currentLoad: number;
    performanceScore: number;
    lastActiveTime: Date;
    capabilities: string[];
}
declare abstract class BaseFamilyMember implements IFamilyMember {
    readonly id: string;
    readonly name: string;
    readonly role: FamilyRole;
    protected config: FamilyMemberConfig;
    protected status: MemberStatus;
    protected learningHistory: Map<string, unknown>;
    constructor(config: FamilyMemberConfig);
    initialize(config: FamilyMemberConfig): Promise<void>;
    abstract processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    senseEmotion(context: ConversationContext): EmotionState;
    personalizeResponse(response: MultimodalResponse, profile: UserProfile): MultimodalResponse;
    canHandle(task: TaskContext): boolean;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    updateProfile(feedback: UserFeedback): void;
    getStatus(): MemberStatus;
    protected adaptTone(text: string, style: 'formal' | 'casual' | 'adaptive'): string;
    protected generateEmpathicResponse(emotion: EmotionState): string;
}

/**
 * file members.ts
 * description AI 家人定义
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
 * brief AI 家人定义
 */

declare class Qianxing extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generateNavigationResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare class Wanwu extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generateAnalysisResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare class Xianzhi extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generatePredictionResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare class Bole extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generateRecommendationResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare class Tianshu extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generateOrchestrationResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare class Shouhu extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generateSecurityResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare class Zongshi extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generateQualityResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare class Lingyun extends BaseFamilyMember {
    constructor();
    processInput(input: MultimodalInput, context: ConversationContext): Promise<MultimodalResponse>;
    private generateCreativeResponse;
    getRecommendedActions(context: ConversationContext): RecommendedAction[];
    handleTask(task: TaskContext): Promise<void>;
}
declare const FAMILY_MEMBERS: {
    qianxing: typeof Qianxing;
    wanwu: typeof Wanwu;
    xianzhi: typeof Xianzhi;
    bole: typeof Bole;
    tianshu: typeof Tianshu;
    shouhu: typeof Shouhu;
    zongshi: typeof Zongshi;
    lingyun: typeof Lingyun;
};
declare function createFamilyMember(id: FamilyMemberId): BaseFamilyMember;

/**
 * file orchestrator.ts
 * description AI 家人调度器
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
 * brief AI 家人调度器
 */

declare class FamilyOrchestrator {
    private members;
    private activeSessions;
    private config;
    constructor();
    private initializeMembers;
    orchestrate(task: TaskContext): Promise<CollaborationSession>;
    private selectMembers;
    private calculateRelevanceScore;
    private decideCollaborationMode;
    private initializeMemberStates;
    private executeCollaboration;
    private executeSequential;
    private executeParallel;
    private executeHierarchical;
    private executeDemocratic;
    private findConsensus;
    getMemberStatus(memberId: string): MemberStatus | undefined;
    getAllMembersStatus(): MemberStatus[];
    getSession(sessionId: string): CollaborationSession | undefined;
}

/**
 * file emotional-intelligence.ts
 * description 情感智能系统
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
 * brief 情感智能系统
 */

interface EmotionAnalysis {
    primary: EmotionState;
    secondary?: EmotionState;
    triggers: string[];
    context: string;
    confidence: number;
}
interface EmotionalHistory {
    userId: string;
    emotions: EmotionState[];
    patterns: EmotionPattern[];
    growthAreas: string[];
}
interface EmotionPattern {
    type: EmotionType;
    frequency: number;
    averageIntensity: number;
    commonTriggers: string[];
    timeOfDay: string[];
}
interface EmotionalGrowthReport {
    userId: string;
    period: {
        start: Date;
        end: Date;
    };
    emotionalStability: number;
    positiveRatio: number;
    growthAreas: string[];
    recommendations: string[];
}
declare class EmotionalIntelligence {
    private emotionHistory;
    private emotionPatterns;
    constructor();
    recognizeEmotion(input: MultimodalInput, context: ConversationContext): EmotionAnalysis;
    private analyzeTextEmotion;
    private identifyTriggers;
    private inferContext;
    generateEmotionalResponse(emotion: EmotionAnalysis, context: ConversationContext): EmotionalResponse;
    private getResponseTemplates;
    private suggestAction;
    private recordEmotion;
    private updatePatterns;
    private calculateAverageIntensity;
    rememberEmotionalHistory(userId: string): EmotionalHistory;
    trackEmotionalGrowth(userId: string): EmotionalGrowthReport;
    private calculateEmotionalVariance;
    private identifyGrowthAreas;
    private generateGrowthRecommendations;
}

/**
 * file growth-system.ts
 * description 成长系统
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
 * brief 成长系统
 */

interface GrowthPath {
    id: string;
    title: string;
    description: string;
    category: 'skill' | 'knowledge' | 'project' | 'life';
    stages: GrowthStage[];
    estimatedDuration: number;
    prerequisites: string[];
    outcomes: string[];
}
interface DailyCompanion {
    greeting: string;
    progressUpdate: string;
    encouragement: string;
    dailyGoal?: Goal;
    tip: string;
}
interface WeeklyReview {
    summary: string;
    achievements: Achievement[];
    challenges: string[];
    learnings: string[];
    nextWeekGoals: Goal[];
}
declare class PersonalizedGrowthSystem {
    private userProfiles;
    private growthPaths;
    private achievements;
    constructor();
    private initializeAchievements;
    private initializeGrowthPaths;
    createProfile(userId: string, name: string): UserProfile;
    getProfile(userId: string): UserProfile | undefined;
    setGoal(userId: string, goal: Omit<Goal, 'id' | 'status' | 'progress'>): Goal;
    updateGoalProgress(userId: string, goalId: string, progress: number): Goal | undefined;
    private checkAndUnlockAchievement;
    private unlockAchievement;
    addMilestone(userId: string, milestone: Omit<Milestone, 'id' | 'achievedAt'>): Milestone;
    generateDailyCompanion(userId: string): DailyCompanion;
    generateWeeklyReview(userId: string): WeeklyReview;
    generateGrowthReport(userId: string, period: {
        start: Date;
        end: Date;
    }): GrowthReport;
    recommendGrowthPath(userId: string): GrowthPath[];
    updateGrowthStage(userId: string): GrowthStage;
}

export { type Achievement, BaseFamilyMember, Bole, type CollaborationMode, type CollaborationOutput, type CollaborationSession, type ConversationContext, type ConversationTurn, type EmotionPattern$1 as EmotionPattern, type EmotionState, type EmotionType, EmotionalIntelligence, type EmotionalResponse, FAMILY_MEMBERS, type FamilyMemberConfig, type FamilyMemberState, type FamilyOrchestrationConfig, FamilyOrchestrator, type FamilyRole, type Goal, type GrowthReport, type GrowthStage, type IFamilyMember, Lingyun, type MemberContribution, type MemberStatus, type Milestone, type MultimodalInput, type MultimodalResponse, type PerformanceMetrics, PersonalizedGrowthSystem, Qianxing, type RecommendedAction, Shouhu, type TaskContext, Tianshu, type UserFeedback, type UserProfile, Wanwu, Xianzhi, Zongshi, createFamilyMember };
