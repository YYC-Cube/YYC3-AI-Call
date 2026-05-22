/**
 * @fileoverview 意图识别服务
 * @description 基于大语言模型实现智能意图识别和情感分析
 * @module ai-services/nlp
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export type IntentType =
  | 'product_inquiry'
  | 'price_negotiation'
  | 'appointment_booking'
  | 'complaint'
  | 'not_interested'
  | 'greeting'
  | 'farewell'
  | 'other';

export interface SentimentResult {
  sentiment: SentimentType;
  confidence: number;
  score: number; // -1 到 1，负数表示负面，正数表示正面
}

export type SentimentType =
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative';

export interface NLPConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_CONFIG: Required<NLPConfig> = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.3,
  maxTokens: 100,
};

const INTENT_DESCRIPTIONS: Record<IntentType, string> = {
  product_inquiry: '询问产品信息',
  price_negotiation: '询价/议价',
  appointment_booking: '预约/安排',
  complaint: '投诉/不满',
  not_interested: '暂时不需要',
  greeting: '问候/打招呼',
  farewell: '告别/结束对话',
  other: '其他',
};

const SENTIMENT_DESCRIPTIONS: Record<SentimentType, string> = {
  very_positive: '非常积极（强烈正面情绪）',
  positive: '积极（有正面情绪）',
  neutral: '中性（无明显情绪）',
  negative: '消极（有负面情绪）',
  very_negative: '非常消极（强烈负面情绪）',
};

export class IntentRecognitionService {
  private config: Required<NLPConfig>;
  private isInitialized = false;

  constructor(config: NLPConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 初始化意图识别服务...');
    console.log(`   模型: ${this.config.model}`);
    console.log(`   温度: ${this.config.temperature}`);

    this.isInitialized = true;
    console.log('✅ 意图识别服务初始化完成');
  }

  async recognizeIntent(text: string): Promise<IntentResult> {
    if (!this.isInitialized) {
      throw new Error('意图识别服务未初始化，请先调用 initialize() 方法');
    }

    try {
      const result = await this.performIntentRecognition(text);
      return result;
    } catch (error) {
      console.error('❌ 意图识别失败:', error);
      throw new Error(`意图识别失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async performIntentRecognition(text: string): Promise<IntentResult> {
    // TODO: 集成实际的 LLM API（如 OpenAI、Azure OpenAI 或本地部署的模型）
    // 这里使用基于规则的模拟实现

    await new Promise(resolve => setTimeout(resolve, 80)); // 模拟处理时间

    const lowerText = text.toLowerCase();

    let intent: IntentType = 'other';
    let confidence = 0.5;
    const entities: Array<{ type: string; value: string; confidence: number }> = [];

    if (lowerText.includes('价格') || lowerText.includes('多少钱') || lowerText.includes('费用')) {
      intent = 'price_negotiation';
      confidence = 0.85 + Math.random() * 0.15;
      entities.push({
        type: 'price_topic',
        value: '价格询问',
        confidence: 0.9,
      });
    } else if (lowerText.includes('课程') || lowerText.includes('产品') || lowerText.includes('介绍')) {
      intent = 'product_inquiry';
      confidence = 0.8 + Math.random() * 0.2;
      entities.push({
        type: 'product_interest',
        value: '产品咨询',
        confidence: 0.85,
      });
    } else if (lowerText.includes('预约') || lowerText.includes('安排') || lowerText.includes('时间')) {
      intent = 'appointment_booking';
      confidence = 0.75 + Math.random() * 0.25;
    } else if (lowerText.includes('投诉') || lowerText.includes('不满') || lowerText.includes('问题')) {
      intent = 'complaint';
      confidence = 0.8 + Math.random() * 0.2;
      entities.push({
        type: 'complaint_type',
        value: '客户投诉',
        confidence: 0.88,
      });
    } else if (lowerText.includes('不需要') || lowerText.includes('谢谢') || lowerText.includes('再见')) {
      intent = 'not_interested';
      confidence = 0.82 + Math.random() * 0.18;
    } else if (lowerText.includes('你好') || lowerText.includes('您好') || lowerText.includes('嗨')) {
      intent = 'greeting';
      confidence = 0.95;
    } else if (lowerText.includes('拜拜') || lowerText.includes('再见') || lowerText.includes('bye')) {
      intent = 'farewell';
      confidence = 0.92;
    }

    return {
      intent,
      confidence,
      entities: entities.length > 0 ? entities : undefined,
    };
  }

  getIntentDescription(intent: IntentType): string {
    return INTENT_DESCRIPTIONS[intent] || '未知意图';
  }

  getAllIntents(): Array<{ type: IntentType; description: string }> {
    return Object.entries(INTENT_DESCRIPTIONS).map(([type, description]) => ({
      type: type as IntentType,
      description,
    }));
  }
}

export class SentimentAnalysisService {
  private config: Required<NLPConfig>;
  private isInitialized = false;

  constructor(config: NLPConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('😊 初始化情感分析服务...');
    this.isInitialized = true;
    console.log('✅ 情感分析服务初始化完成');
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!this.isInitialized) {
      throw new Error('情感分析服务未初始化，请先调用 initialize() 方法');
    }

    try {
      const result = await this.performSentimentAnalysis(text);
      return result;
    } catch (error) {
      console.error('❌ 情感分析失败:', error);
      throw new Error(`情感分析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async performSentimentAnalysis(text: string): Promise<SentimentResult> {
    // TODO: 集成实际的情感分析模型或 LLM
    // 这里使用基于关键词的模拟实现

    await new Promise(resolve => setTimeout(resolve, 60)); // 模拟处理时间

    const positiveWords = ['好', '喜欢', '满意', '不错', '棒', '优秀', '感谢', '太好了'];
    const negativeWords = ['不好', '差', '不满意', '糟糕', '讨厌', '失望', '生气', '愤怒'];

    const lowerText = text.toLowerCase();
    let score = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) {
        score += 0.2;
      }
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) {
        score -= 0.25;
      }
    }

    score = Math.max(-1, Math.min(1, score));
    score += (Math.random() - 0.5) * 0.2; // 添加一些随机性

    let sentiment: SentimentType;
    let confidence: number;

    if (score >= 0.6) {
      sentiment = 'very_positive';
      confidence = 0.8 + Math.random() * 0.2;
    } else if (score >= 0.2) {
      sentiment = 'positive';
      confidence = 0.7 + Math.random() * 0.3;
    } else if (score > -0.2) {
      sentiment = 'neutral';
      confidence = 0.65 + Math.random() * 0.35;
    } else if (score > -0.6) {
      sentiment = 'negative';
      confidence = 0.7 + Math.random() * 0.3;
    } else {
      sentiment = 'very_negative';
      confidence = 0.75 + Math.random() * 0.25;
    }

    return {
      sentiment,
      confidence,
      score: parseFloat(score.toFixed(3)),
    };
  }

  getSentimentDescription(sentiment: SentimentType): string {
    return SENTIMENT_DESCRIPTIONS[sentiment] || '未知情感';
  }

  getAllSentiments(): Array<{ type: SentimentType; description: string }> {
    return Object.entries(SENTIMENT_DESCRIPTIONS).map(([type, description]) => ({
      type: type as SentimentType,
      description,
    }));
  }
}
