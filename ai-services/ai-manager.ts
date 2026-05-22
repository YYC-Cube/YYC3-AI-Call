/**
 * @fileoverview AI 服务管理器
 * @description 统一管理和协调所有 AI 服务，提供服务编排和降级策略
 * @module ai-services
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { WhisperASRService, TranscriptionResult } from './asr/whisper-service';
import { VITSTTSService, SynthesisResult } from './tts/vits-service';
import { IntentRecognitionService, IntentResult } from './nlp/intent-service';
import { SentimentService, SentimentResult } from './nlp/sentiment-service';

export interface AIServiceConfig {
  asr?: {
    model?: 'base' | 'small' | 'medium' | 'large';
    language?: string;
  };
  tts?: {
    voiceId?: string;
    speed?: number;
    emotion?: string;
  };
  nlp?: {
    model?: string;
    temperature?: number;
  };
}

export interface CallAnalysisResult {
  transcription: TranscriptionResult;
  intent: IntentResult;
  sentiment: SentimentResult;
  suggestedResponse: string;
  confidence: number;
  timestamp: Date;
}

export class AIServiceManager {
  private static instance: AIServiceManager;

  private asrService: WhisperASRService;
  private ttsService: VITSTTSService;
  private intentService: IntentRecognitionService;
  private sentimentService: SentimentService;

  private isInitialized = false;

  private constructor() {
    this.asrService = new WhisperASRService();
    this.ttsService = new VITSTTSService();
    this.intentService = new IntentRecognitionService();
    this.sentimentService = SentimentService.getInstance();
  }

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  async initialize(config?: AIServiceConfig): Promise<void> {
    if (this.isInitialized) return;

    console.log('🤖 初始化 AI 服务管理器...');

    try {
      await Promise.all([
        this.asrService.initialize(),
        this.ttsService.initialize(),
        this.intentService.initialize(),
      ]);

      this.isInitialized = true;
      console.log('✅ AI 服务管理器初始化完成');
    } catch (error) {
      console.error('❌ AI 服务管理器初始化失败:', error);
      throw error;
    }
  }

  getASRService(): WhisperASRService {
    return this.asrService;
  }

  getTTSService(): VITSTTSService {
    return this.ttsService;
  }

  getIntentService(): IntentRecognitionService {
    return this.intentService;
  }

  getSentimentService(): SentimentService {
    return this.sentimentService;
  }

  async analyzeCall(
    audioBuffer: ArrayBuffer,
    options?: {
      customerContext?: Record<string, any>;
      callHistory?: Array<{ text: string; timestamp: Date }>;
    }
  ): Promise<CallAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('AI 服务未初始化');
    }

    try {
      // 1. 语音识别
      const transcription = await this.asrService.transcribe(audioBuffer);
      const text = transcription.text;

      if (!text || text.trim().length === 0) {
        throw new Error('语音识别结果为空');
      }

      // 2. 意图识别
      const intent = await this.intentService.recognizeIntent(text);

      // 3. 情感分析
      const sentiment = await this.sentimentService.analyzeSentiment({ text, language: 'zh' });

      // 4. 生成建议响应
      const suggestedResponse = await this.generateSuggestedResponse(intent, sentiment);

      // 5. 计算综合置信度
      const confidence = (intent.confidence + sentiment.confidence) / 2;

      return {
        transcription,
        intent,
        sentiment,
        suggestedResponse,
        confidence,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ 呼叫分析失败:', error);
      throw error;
    }
  }

  async generateSpeech(text: string, options?: {
    voiceId?: string;
    emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
  }): Promise<SynthesisResult> {
    if (!this.isInitialized) {
      throw new Error('AI 服务未初始化');
    }

    return this.ttsService.synthesize(text, options);
  }

  private async generateSuggestedResponse(
    intent: IntentResult,
    sentiment: SentimentResult
  ): Promise<string> {
    // 根据意图和情感生成建议响应
    const responses: Record<string, Record<string, string[]>> = {
      product_inquiry: {
        positive: [
          '好的！我来为您详细介绍我们的产品。请问您对哪个方面比较感兴趣？',
          '非常感谢您的关注！让我为您介绍一下我们的核心优势...',
        ],
        neutral: [
          '好的，我来为您介绍我们的产品和服务。',
          '没问题，让我为您详细说明一下...',
        ],
        negative: [
          '我理解您可能有疑问，让我为您详细解释一下...',
          '请放心，我会为您详细介绍，帮助您做出最好的选择。',
        ],
      },
      price_negotiation: {
        positive: [
          '关于价格，我们目前有优惠活动，我可以为您申请折扣！',
          '价格方面我们很有竞争力，而且现在有特别优惠哦！',
        ],
        neutral: [
          '关于价格，让我为您说明一下我们的定价方案。',
          '价格方面，我们有多种套餐可以选择。',
        ],
        negative: [
          '我理解价格是重要因素，让我为您看看有什么优惠方案。',
          '请放心，我们会为您提供最优惠的价格方案。',
        ],
      },
      appointment_booking: {
        positive: [
          '太好了！那我们来预约一个时间吧？',
          '没问题！我来为您安排合适的时间。',
        ],
        neutral: [
          '好的，我们可以安排一个时间进行详细沟通。',
          '没问题，我来为您预约时间。',
        ],
        negative: [
          '我理解您可能需要考虑一下，没关系，我们可以稍后再确认时间。',
          '没关系的，您可以先考虑，有需要随时联系我。',
        ],
      },
      complaint: {
        positive: [],
        neutral: [
          '非常抱歉给您带来不便，我会立即为您处理这个问题。',
          '感谢您的反馈，我会尽快解决您的问题。',
        ],
        negative: [
          '非常抱歉让您有这样的体验，我一定会认真处理并改进。',
          '我完全理解您的心情，请给我机会为您解决这个问题。',
        ],
      },
      not_interested: {
        positive: [
          '好的，谢谢您的时间！如果以后有需要，欢迎随时联系我们。',
          '没问题，感谢您的接听！祝您生活愉快！',
        ],
        neutral: [
          '好的，没关系！如果您改变主意，随时可以联系我们。',
          '好的，感谢您的宝贵时间！',
        ],
        negative: [
          '非常抱歉打扰到您了，祝您一切顺利！',
          '抱歉占用您的时间了，再见！',
        ],
      },
      greeting: {
        positive: [
          '您好！很高兴为您服务！请问有什么可以帮助您的？',
          '您好！我是YYC³智能客服助手，请问今天能为您做些什么？',
        ],
        neutral: [
          '您好！请问有什么可以帮助您的？',
          '您好！YYC³智能外呼系统为您服务。',
        ],
        negative: [
          '您好！希望能为您提供帮助，请问有什么需要？',
          '您好！无论什么问题，我都会尽力帮您解决。',
        ],
      },
      farewell: {
        positive: [
          '感谢您的通话！期待下次为您服务！再见！',
          '好的，祝您生活愉快！再见！',
        ],
        neutral: [
          '好的，再见！如有需要随时联系。',
          '再见！感谢您的时间。',
        ],
        negative: [
          '再见！希望下次能为您提供更好的服务。',
          '再见！抱歉没能更好地帮助到您。',
        ],
      },
      other: {
        positive: [
          '好的，我明白了。还有什么其他问题吗？',
          '没问题，请问还有其他事情吗？',
        ],
        neutral: [
          '好的，请问还有什么可以帮您的？',
          '我理解了，还需要其他帮助吗？',
        ],
        negative: [
          '我理解了，让我看看怎么最好地帮助您。',
          '好的，我会尽力协助您解决问题。',
        ],
      },
    };

    const intentResponses = responses[intent.intent]?.[sentiment.sentiment] || responses.other.neutral;
    return intentResponses[Math.floor(Math.random() * intentResponses.length)];
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      asr: boolean;
      tts: boolean;
      nlp: boolean;
      sentiment: boolean;
    };
  }> {
    const services = {
      asr: (this.asrService as any)['isInitialized'] ?? false,
      tts: (this.ttsService as any)['isInitialized'] ?? false,
      nlp: (this.intentService as any)['isInitialized'] ?? false,
      sentiment: true, // SentimentService is always ready (singleton)
    };

    const healthyCount = Object.values(services).filter(Boolean).length;
    const totalCount = Object.keys(services).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      status = 'healthy';
    } else if (healthyCount >= totalCount / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, services };
  }
}
