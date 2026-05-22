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
import {
  FamilyRole,
  MultimodalInput,
  MultimodalResponse,
  EmotionState,
  UserProfile,
  ConversationContext,
  FamilyMemberConfig,
  TaskContext,
  RecommendedAction,
} from './types';
import { logger } from '../logger.js';

export interface IFamilyMember {
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

export interface UserFeedback {
  userId: string;
  memberId: string;
  rating: number;
  comment?: string;
  helpful: boolean;
  timestamp: Date;
}

export interface MemberStatus {
  id: string;
  name: string;
  isActive: boolean;
  currentLoad: number;
  performanceScore: number;
  lastActiveTime: Date;
  capabilities: string[];
}

export abstract class BaseFamilyMember implements IFamilyMember {
  readonly id: string;
  readonly name: string;
  readonly role: FamilyRole;
  
  protected config: FamilyMemberConfig;
  protected status: MemberStatus;
  protected learningHistory: Map<string, unknown>;
  
  constructor(config: FamilyMemberConfig) {
    this.id = config.id;
    this.name = config.displayName;
    this.role = config.role;
    this.config = config;
    this.learningHistory = new Map();
    this.status = {
      id: config.id,
      name: config.displayName,
      isActive: true,
      currentLoad: 0,
      performanceScore: 1.0,
      lastActiveTime: new Date(),
      capabilities: config.capabilities,
    };
  }
  
  async initialize(config: FamilyMemberConfig): Promise<void> {
    this.config = config;
    logger.info(`${this.name} 初始化完成`);
  }
  
  abstract processInput(
    input: MultimodalInput, 
    context: ConversationContext
  ): Promise<MultimodalResponse>;
  
  senseEmotion(context: ConversationContext): EmotionState {
    const lastTurn = context.history[context.history.length - 1];
    if (lastTurn?.emotion) {
      return lastTurn.emotion;
    }
    
    return {
      type: 'peace',
      intensity: 0.5,
      confidence: 0.7,
      timestamp: new Date(),
    };
  }
  
  personalizeResponse(
    response: MultimodalResponse, 
    profile: UserProfile
  ): MultimodalResponse {
    const personalizedText = this.adaptTone(
      response.text, 
      profile.preferences.communicationStyle
    );
    
    return {
      ...response,
      text: personalizedText,
    };
  }
  
  canHandle(task: TaskContext): boolean {
    const hasCapability = task.requiredCapabilities.some(cap => 
      this.config.capabilities.includes(cap)
    );
    return hasCapability && this.status.currentLoad < 1.0;
  }
  
  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [];
  }
  
  updateProfile(feedback: UserFeedback): void {
    const key = `feedback_${feedback.userId}_${Date.now()}`;
    this.learningHistory.set(key, feedback);
    
    if (feedback.rating >= 4) {
      this.status.performanceScore = Math.min(
        1.0, 
        this.status.performanceScore + 0.01
      );
    } else if (feedback.rating <= 2) {
      this.status.performanceScore = Math.max(
        0.5, 
        this.status.performanceScore - 0.01
      );
    }
  }
  
  getStatus(): MemberStatus {
    return { ...this.status };
  }
  
  protected adaptTone(text: string, style: 'formal' | 'casual' | 'adaptive'): string {
    if (style === 'formal') {
      return text.replace(/你/g, '您');
    }
    return text;
  }
  
  protected generateEmpathicResponse(emotion: EmotionState): string {
    const responses: Record<string, string[]> = {
      joy: [
        '看到你这么开心，我也很高兴！',
        '这份喜悦值得庆祝！',
      ],
      anxiety: [
        '我理解你的担忧，让我们一起面对。',
        '深呼吸，我们一步步来解决。',
      ],
      sadness: [
        '我感受到了你的难过，我在这里陪着你。',
        '有时候，难过也是一种力量。',
      ],
      anger: [
        '我理解你的愤怒，让我帮你理清思路。',
        '愤怒是正常的，让我们一起找到解决办法。',
      ],
      confusion: [
        '困惑是成长的开始，让我帮你理清思路。',
        '别担心，我们一起探索答案。',
      ],
      peace: [
        '平静的心态是最好的状态。',
        '让我们一起稳步前进。',
      ],
    };
    
    const emotionResponses = responses[emotion.type] || responses.peace;
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
  }
}
