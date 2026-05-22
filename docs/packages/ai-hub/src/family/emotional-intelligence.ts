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
import {
  EmotionState,
  EmotionType,
  ConversationContext,
  EmotionalResponse,
  UserProfile,
  MultimodalInput,
} from './types';

export interface EmotionAnalysis {
  primary: EmotionState;
  secondary?: EmotionState;
  triggers: string[];
  context: string;
  confidence: number;
}

export interface EmotionalHistory {
  userId: string;
  emotions: EmotionState[];
  patterns: EmotionPattern[];
  growthAreas: string[];
}

export interface EmotionPattern {
  type: EmotionType;
  frequency: number;
  averageIntensity: number;
  commonTriggers: string[];
  timeOfDay: string[];
}

export interface EmotionalGrowthReport {
  userId: string;
  period: { start: Date; end: Date };
  emotionalStability: number;
  positiveRatio: number;
  growthAreas: string[];
  recommendations: string[];
}

export class EmotionalIntelligence {
  private emotionHistory: Map<string, EmotionalHistory>;
  private emotionPatterns: Map<string, EmotionPattern[]>;
  
  constructor() {
    this.emotionHistory = new Map();
    this.emotionPatterns = new Map();
  }
  
  recognizeEmotion(input: MultimodalInput, context: ConversationContext): EmotionAnalysis {
    const textEmotion = this.analyzeTextEmotion(input.text || '');
    const contextEmotion = context.currentEmotion;
    
    let primary: EmotionState;
    let secondary: EmotionState | undefined;
    
    if (contextEmotion && contextEmotion.confidence > 0.7) {
      primary = contextEmotion;
      secondary = textEmotion;
    } else {
      primary = textEmotion;
    }
    
    const triggers = this.identifyTriggers(input.text || '');
    
    this.recordEmotion(context.userId, primary);
    
    return {
      primary,
      secondary,
      triggers,
      context: this.inferContext(input.text || '', primary),
      confidence: primary.confidence,
    };
  }
  
  private analyzeTextEmotion(text: string): EmotionState {
    const emotionKeywords: Record<EmotionType, string[]> = {
      joy: ['开心', '高兴', '快乐', '太好了', '棒', '喜欢', '爱', '哈哈', '😊', '🎉'],
      peace: ['平静', '安心', '放松', '舒适', '满足', '好的', '嗯'],
      anxiety: ['担心', '焦虑', '紧张', '害怕', '不安', '压力', '着急'],
      sadness: ['难过', '伤心', '失望', '沮丧', '悲伤', '哭', '😢'],
      anger: ['生气', '愤怒', '烦', '讨厌', '气死', '可恶', '😠'],
      confusion: ['困惑', '不明白', '不懂', '迷茫', '疑惑', '为什么'],
      excitement: ['兴奋', '激动', '期待', '太棒了', '太好了', '哇'],
      frustration: ['沮丧', '挫败', '失败', '不行', '做不到', '放弃'],
    };
    
    let maxScore = 0;
    let detectedType: EmotionType = 'peace';
    
    for (const [type, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as EmotionType;
      }
    }
    
    const intensity = Math.min(1, maxScore * 0.3 + 0.3);
    
    return {
      type: detectedType,
      intensity,
      confidence: maxScore > 0 ? Math.min(0.95, 0.6 + maxScore * 0.1) : 0.5,
      timestamp: new Date(),
      triggers: [],
    };
  }
  
  private identifyTriggers(text: string): string[] {
    const triggers: string[] = [];
    
    const triggerPatterns = [
      { pattern: /工作|项目|任务/, trigger: '工作相关' },
      { pattern: /学习|教程|课程/, trigger: '学习相关' },
      { pattern: /人|朋友|同事/, trigger: '人际关系' },
      { pattern: /时间|deadline|截止/, trigger: '时间压力' },
      { pattern: /错误|问题|bug/, trigger: '技术问题' },
    ];
    
    for (const { pattern, trigger } of triggerPatterns) {
      if (pattern.test(text)) {
        triggers.push(trigger);
      }
    }
    
    return triggers;
  }
  
  private inferContext(text: string, emotion: EmotionState): string {
    const contextMap: Record<EmotionType, string> = {
      joy: '用户正在经历积极的事情',
      peace: '用户处于平静的状态',
      anxiety: '用户可能面临压力或不确定性',
      sadness: '用户可能遇到了挫折或失望',
      anger: '用户可能遇到了不公正或障碍',
      confusion: '用户正在寻求理解或方向',
      excitement: '用户对某事充满期待',
      frustration: '用户可能遇到了困难或阻碍',
    };
    
    return contextMap[emotion.type];
  }
  
  generateEmotionalResponse(
    emotion: EmotionAnalysis,
    context: ConversationContext
  ): EmotionalResponse {
    const responses = this.getResponseTemplates(emotion.primary.type);
    
    return {
      acknowledgment: responses.acknowledgment,
      empathy: responses.empathy,
      support: responses.support,
      action: this.suggestAction(emotion),
    };
  }
  
  private getResponseTemplates(emotionType: EmotionType): {
    acknowledgment: string;
    empathy: string;
    support: string;
  } {
    const templates: Record<EmotionType, {
      acknowledgment: string;
      empathy: string;
      support: string;
    }> = {
      joy: {
        acknowledgment: '我能感受到你的喜悦！',
        empathy: '这种快乐的感觉真好，值得珍惜。',
        support: '让我们一起把这份快乐延续下去！',
      },
      peace: {
        acknowledgment: '你现在的状态很平静。',
        empathy: '平静是思考和创造的最佳状态。',
        support: '需要我陪你做些什么吗？',
      },
      anxiety: {
        acknowledgment: '我注意到你有些担心。',
        empathy: '面对不确定性时感到焦虑是很正常的。',
        support: '让我们一起把问题分解，一步步来解决。',
      },
      sadness: {
        acknowledgment: '我感受到了你的难过。',
        empathy: '有时候，允许自己难过也是一种勇气。',
        support: '我在这里陪着你，需要聊聊吗？',
      },
      anger: {
        acknowledgment: '我理解你现在很生气。',
        empathy: '愤怒往往源于对公平的渴望。',
        support: '让我们一起找到解决问题的方法。',
      },
      confusion: {
        acknowledgment: '我看出你有些困惑。',
        empathy: '困惑是理解新事物的必经之路。',
        support: '让我帮你理清思路，我们一起探索答案。',
      },
      excitement: {
        acknowledgment: '你的兴奋感染了我！',
        empathy: '这种期待的感觉真让人充满动力。',
        support: '让我们一起把这份兴奋转化为行动！',
      },
      frustration: {
        acknowledgment: '我理解你的挫败感。',
        empathy: '挫折是成长的垫脚石，不是终点。',
        support: '让我们一起找到突破的方法。',
      },
    };
    
    return templates[emotionType];
  }
  
  private suggestAction(emotion: EmotionAnalysis): {
    type: 'learn' | 'practice' | 'create' | 'collaborate' | 'reflect';
    title: string;
    description: string;
    priority: number;
  } {
    const actionMap: Record<EmotionType, {
      type: 'learn' | 'practice' | 'create' | 'collaborate' | 'reflect';
      title: string;
      description: string;
      priority: number;
    }> = {
      joy: {
        type: 'create',
        title: '记录美好时刻',
        description: '把这份喜悦记录下来，分享给更多人',
        priority: 0.6,
      },
      peace: {
        type: 'learn',
        title: '探索新知识',
        description: '平静的状态最适合学习新事物',
        priority: 0.7,
      },
      anxiety: {
        type: 'reflect',
        title: '梳理担忧',
        description: '把担心的事情写下来，逐一分析',
        priority: 0.9,
      },
      sadness: {
        type: 'collaborate',
        title: '找人聊聊',
        description: '有时候倾诉是最好的疗愈',
        priority: 0.8,
      },
      anger: {
        type: 'reflect',
        title: '冷静分析',
        description: '找到愤怒的根源，理性面对',
        priority: 0.9,
      },
      confusion: {
        type: 'learn',
        title: '寻求解答',
        description: '提出你的问题，我们一起探索',
        priority: 0.8,
      },
      excitement: {
        type: 'create',
        title: '立即行动',
        description: '把兴奋转化为具体的行动计划',
        priority: 0.7,
      },
      frustration: {
        type: 'practice',
        title: '换个角度',
        description: '尝试不同的方法，突破瓶颈',
        priority: 0.8,
      },
    };
    
    return actionMap[emotion.primary.type];
  }
  
  private recordEmotion(userId: string, emotion: EmotionState): void {
    let history = this.emotionHistory.get(userId);
    
    if (!history) {
      history = {
        userId,
        emotions: [],
        patterns: [],
        growthAreas: [],
      };
    }
    
    history.emotions.push(emotion);
    
    if (history.emotions.length > 100) {
      history.emotions = history.emotions.slice(-100);
    }
    
    this.emotionHistory.set(userId, history);
    this.updatePatterns(userId);
  }
  
  private updatePatterns(userId: string): void {
    const history = this.emotionHistory.get(userId);
    if (!history) return;
    
    const emotionCounts: Record<EmotionType, number> = {
      joy: 0, peace: 0, anxiety: 0, sadness: 0,
      anger: 0, confusion: 0, excitement: 0, frustration: 0,
    };
    
    for (const emotion of history.emotions) {
      emotionCounts[emotion.type]++;
    }
    
    const patterns: EmotionPattern[] = [];
    for (const [type, count] of Object.entries(emotionCounts)) {
      if (count > 0) {
        patterns.push({
          type: type as EmotionType,
          frequency: count / history.emotions.length,
          averageIntensity: this.calculateAverageIntensity(history.emotions, type as EmotionType),
          commonTriggers: [],
          timeOfDay: [],
        });
      }
    }
    
    history.patterns = patterns;
    this.emotionHistory.set(userId, history);
  }
  
  private calculateAverageIntensity(emotions: EmotionState[], type: EmotionType): number {
    const filtered = emotions.filter(e => e.type === type);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, e) => sum + e.intensity, 0) / filtered.length;
  }
  
  rememberEmotionalHistory(userId: string): EmotionalHistory {
    return this.emotionHistory.get(userId) || {
      userId,
      emotions: [],
      patterns: [],
      growthAreas: [],
    };
  }
  
  trackEmotionalGrowth(userId: string): EmotionalGrowthReport {
    const history = this.rememberEmotionalHistory(userId);
    
    const positiveEmotions = history.emotions.filter(
      e => e.type === 'joy' || e.type === 'peace' || e.type === 'excitement'
    );
    
    const positiveRatio = history.emotions.length > 0
      ? positiveEmotions.length / history.emotions.length
      : 0.5;
    
    const emotionalStability = 1 - this.calculateEmotionalVariance(history.emotions);
    
    const growthAreas = this.identifyGrowthAreas(history);
    
    return {
      userId,
      period: {
        start: history.emotions[0]?.timestamp || new Date(),
        end: new Date(),
      },
      emotionalStability,
      positiveRatio,
      growthAreas,
      recommendations: this.generateGrowthRecommendations(growthAreas),
    };
  }
  
  private calculateEmotionalVariance(emotions: EmotionState[]): number {
    if (emotions.length < 2) return 0;
    
    const intensities = emotions.map(e => e.intensity);
    const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const variance = intensities.reduce((sum, i) => sum + Math.pow(i - mean, 2), 0) / intensities.length;
    
    return Math.min(1, variance * 4);
  }
  
  private identifyGrowthAreas(history: EmotionalHistory): string[] {
    const areas: string[] = [];
    
    const anxietyPattern = history.patterns.find(p => p.type === 'anxiety');
    if (anxietyPattern && anxietyPattern.frequency > 0.3) {
      areas.push('压力管理');
    }
    
    const frustrationPattern = history.patterns.find(p => p.type === 'frustration');
    if (frustrationPattern && frustrationPattern.frequency > 0.2) {
      areas.push('挫折应对');
    }
    
    const joyPattern = history.patterns.find(p => p.type === 'joy');
    if (!joyPattern || joyPattern.frequency < 0.1) {
      areas.push('积极情绪培养');
    }
    
    return areas;
  }
  
  private generateGrowthRecommendations(growthAreas: string[]): string[] {
    const recommendations: Record<string, string> = {
      '压力管理': '建议尝试冥想或深呼吸练习，每天10分钟',
      '挫折应对': '建议记录每次挫折后的成长，建立正向反馈',
      '积极情绪培养': '建议每天记录三件感恩的事，培养积极心态',
    };
    
    return growthAreas.map(area => recommendations[area] || `建议关注${area}方面的成长`);
  }
}
