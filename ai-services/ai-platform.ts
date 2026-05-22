/**
 * @fileoverview AI 中台 - 智能服务编排与协同引擎
 * @description 统一管理所有AI服务，提供智能编排、降级策略、五维协同能力
 * @module ai-services/platform
 * @author YYC³
 * @version 2.0.0
 * @created 2026-05-01
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 *
 * 对齐五维管理体系V2.0第5章：标规数智转型层
 * - 标准化接口规范
 * - 智能化服务编排
 * - 协同化能力集成
 */

import { WhisperASRService, TranscriptionResult } from './asr/whisper-service';
import { VITSTTSService, SynthesisResult } from './tts/vits-service';
import { QwenLLMService, LLMResponse } from './llm/qwen-llm-service';
import { QwenEmbeddingService, SimilarityResult } from './embedding/qwen-embedding-service';

export interface AIPlatformConfig {
  llm?: {
    modelPath?: string;
    apiUrl?: string;
    temperature?: number;
  };
  embedding?: {
    modelPath?: string;
    apiUrl?: string;
    dimension?: number;
  };
  asr?: {
    model?: 'base' | 'small' | 'medium' | 'large';
    language?: string;
  };
  tts?: {
    voiceId?: string;
    speed?: number;
    emotion?: string;
  };
}

export interface IntelligentCallContext {
  customerId?: string;
  customerProfile?: string;
  callId: string;
  stage: 'greeting' | 'introduction' | 'needs_analysis' | 'presentation' | 'handling_objections' | 'closing' | 'follow_up';
  previousTranscripts?: Array<{
    role: 'agent' | 'customer';
    text: string;
    timestamp: Date;
  }>;
  metadata?: Record<string, any>;
}

export interface CallAnalysisResult {
  transcription: TranscriptionResult;
  intent: {
    intent: string;
    confidence: number;
    entities: Array<{ type: string; value: string }>;
    reasoning: string;
  };
  sentiment: {
    sentiment: string;
    confidence: number;
    score: number;
    reasoning: string;
  };
  suggestedResponse: string;
  suggestedAction: {
    action: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  };
  knowledgeBaseResults: Array<{
    content: string;
    source: string;
    confidence: number;
  }>;
  overallConfidence: number;
  processingTime: number; // ms
  timestamp: Date;
}

export class AIPlatform {
  private static instance: AIPlatform;

  private asrService: WhisperASRService;
  private ttsService: VITSTTSService;
  private llmService: QwenLLMService;
  private embeddingService: QwenEmbeddingService;

  private isInitialized = false;
  private callHistory: Map<string, CallAnalysisResult[]> = new Map();

  private constructor() {
    this.asrService = new WhisperASRService();
    this.ttsService = new VITSTTSService();
    this.llmService = new QwenLLMService();
    this.embeddingService = new QwenEmbeddingService();
  }

  static getInstance(): AIPlatform {
    if (!AIPlatform.instance) {
      AIPlatform.instance = new AIPlatform();
    }
    return AIPlatform.instance;
  }

  async initialize(config?: AIPlatformConfig): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 初始化 AI 中台平台...');

    try {
      await Promise.all([
        this.asrService.initialize(),
        this.ttsService.initialize(),
        this.llmService.initialize(),
        this.embeddingService.initialize(),
      ]);

      console.log('✅ 所有AI服务初始化完成');
      console.log('   ✅ ASR (Whisper) - 语音识别就绪');
      console.log('   ✅ TTS (VITS) - 语音合成就绪');
      console.log('   ✅ LLM (Qwen3-35B-A3B) - 大语言模型就绪 (23GB)');
      console.log('   ✅ Embedding (Qwen3-Embedding-8B) - 向量检索就绪 (15GB)');

      this.isInitialized = true;
      console.log('🎉 AI 中台平台初始化完成！');
    } catch (error) {
      console.error('❌ AI 中台初始化失败:', error);
      throw error;
    }
  }

  async analyzeCallAudio(
    audioBuffer: ArrayBuffer,
    context: IntelligentCallContext
  ): Promise<CallAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('AI中台未初始化');
    }

    const startTime = Date.now();

    try {
      const transcription = await this.asrService.transcribe(audioBuffer);

      const [intent, sentiment] = await Promise.all([
        this.llmService.recognizeIntent(transcription.text),
        this.llmService.analyzeSentiment(transcription.text),
      ]);

      const [suggestedResponse, suggestedAction, knowledgeResults] = await Promise.all([
        this.generateContextualResponse(context, transcription.text),
        this.llmService.suggestNextAction({
          transcript: transcription.text,
          intent: intent.intent,
          sentiment: sentiment.sentiment,
          stage: context.stage,
        }),
        this.embeddingService.searchKnowledgeBase(
          `${transcription.text} ${context.customerProfile || ''}`,
          3
        ),
      ]);

      const overallConfidence = this.calculateOverallConfidence([
        intent.confidence,
        sentiment.confidence,
      ]);

      const result: CallAnalysisResult = {
        transcription,
        intent,
        sentiment,
        suggestedResponse,
        suggestedAction,
        knowledgeBaseResults: knowledgeResults,
        overallConfidence,
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.addToCallHistory(context.callId, result);

      return result;
    } catch (error) {
      console.error('❌ 通话分析失败:', error);
      throw new Error(`通话分析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateTextResponse(
    userInput: string,
    context: IntelligentCallContext
  ): Promise<string> {
    const response = await this.generateContextualResponse(context, userInput);
    return response;
  }

  private async generateContextualResponse(
    context: IntelligentCallContext,
    userInput: string
  ): Promise<string> {
    const systemPrompt = `你是YYC³智能呼叫中心的AI助手。根据客户信息和对话上下文，生成专业、自然、有针对性的回复。

当前阶段：${context.stage}
${context.customerProfile ? `客户画像：${context.customerProfile}` : ''}
${context.previousTranscripts?.length ? `历史对话：\n${context.previousTranscripts.slice(-5).map(t => `${t.role}: ${t.text}`).join('\n')}` : ''}`;

    const response = await this.llmService.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ], { temperature: 0.7, maxTokens: 512 });

    return response.content;
  }

  async synthesizeSpeech(
    text: string,
    options?: {
      voiceId?: string;
      emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
      speed?: number;
    }
  ): Promise<SynthesisResult> {
    return this.ttsService.synthesize(text, options);
  }

  async findSimilarCustomers(
    description: string,
    topK: number = 5
  ): Promise<SimilarityResult[]> {
    return this.embeddingService.findSimilarCustomers(description, topK);
  }

  async recommendProducts(
    needs: string,
    topK: number = 5
  ): Promise<SimilarityResult[]> {
    return this.embeddingService.recommendProducts(needs, topK);
  }

  async addToKnowledgeBase(
    id: string,
    content: string,
    source: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.embeddingService.addToVectorStore(id, content, {
      ...metadata,
      type: 'knowledge_base',
      source,
    });
  }

  async getCallInsights(callId: string): Promise<{
    totalInteractions: number;
    averageConfidence: number;
    intents: Array<{ intent: string; count: number }>;
    sentiments: Array<{ sentiment: string; count: number }>;
    timeline: CallAnalysisResult[];
  }> {
    const history = this.callHistory.get(callId) || [];

    const intentCounts: Record<string, number> = {};
    const sentimentCounts: Record<string, number> = {};
    let totalConfidence = 0;

    for (const analysis of history) {
      intentCounts[analysis.intent.intent] = (intentCounts[analysis.intent.intent] || 0) + 1;
      sentimentCounts[analysis.sentiment.sentiment] = (sentimentCounts[analysis.sentiment.sentiment] || 0) + 1;
      totalConfidence += analysis.overallConfidence;
    }

    return {
      totalInteractions: history.length,
      averageConfidence: history.length > 0 ? totalConfidence / history.length : 0,
      intents: Object.entries(intentCounts).map(([intent, count]) => ({ intent, count })),
      sentiments: Object.entries(sentimentCounts).map(([sentiment, count]) => ({ sentiment, count })),
      timeline: history,
    };
  }

  private calculateOverallConfidence(scores: number[]): number {
    if (scores.length === 0) return 0;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round(avg * 10000) / 10000;
  }

  private addToCallHistory(callId: string, result: CallAnalysisResult): void {
    const history = this.callHistory.get(callId) || [];
    history.push(result);
    this.callHistory.set(callId, history);
  }

  getPlatformStatus(): {
    initialized: boolean;
    services: {
      asr: boolean;
      tts: boolean;
      llm: boolean;
      embedding: boolean;
    };
    statistics: {
      llm: ReturnType<QwenLLMService['getStatistics']>;
      embedding: ReturnType<QwenEmbeddingService['getStatistics']>;
    };
    activeCalls: number;
  } {
    return {
      initialized: this.isInitialized,
      services: {
        asr: true,
        tts: true,
        llm: this.llmService.getStatistics().uptime,
        embedding: this.embeddingService.getStatistics().uptime,
      },
      statistics: {
        llm: this.llmService.getStatistics(),
        embedding: this.embeddingService.getStatistics(),
      },
      activeCalls: this.callHistory.size,
    };
  }

  clearCallHistory(callId?: string): void {
    if (callId) {
      this.callHistory.delete(callId);
    } else {
      this.callHistory.clear();
    }
  }
}

export default AIPlatform;
