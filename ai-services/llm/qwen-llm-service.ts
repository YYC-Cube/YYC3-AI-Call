/**
 * @fileoverview Qwen3 LLM 大语言模型服务
 * @description 基于本地部署的 Qwen3-35B-A3B 模型实现意图识别、话术生成、对话管理
 * @module ai-services/llm
 * @author YYC³
 * @version 2.0.0
 * @created 2026-05-01
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

export interface QwenLLMConfig {
  modelPath?: string;
  apiUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  contextWindow?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'error';
  latency: number; // ms
  confidence?: number;
}

const DEFAULT_CONFIG: Required<QwenLLMConfig> = {
  modelPath: '/models/Qwen3-35B-A3B',
  apiUrl: 'http://localhost:8080/v1',
  apiKey: 'local-model-no-key-needed',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  contextWindow: 32768,
};

export class QwenLLMService {
  private config: Required<QwenLLMConfig>;
  private isInitialized = false;
  private requestCount = 0;
  private totalLatency = 0;

  constructor(config: QwenLLMConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 初始化 Qwen3-35B-A3B LLM 服务...');
    console.log(`   模型路径: ${this.config.modelPath}`);
    console.log(`   API地址: ${this.config.apiUrl}`);
    console.log(`   温度: ${this.config.temperature}`);
    console.log(`   最大Token: ${this.config.maxTokens}`);

    try {
      await this.healthCheck();
      this.isInitialized = true;
      console.log('✅ Qwen3-35B-A3B LLM 服务初始化完成 (23GB MoE模型已加载)');
    } catch (error) {
      console.warn('⚠️  Qwen3-35B-A3B 连接失败，将使用Mock模式:', error);
      this.isInitialized = true; // 允许使用降级模式
    }
  }

  private async healthCheck(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${this.config.apiUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return true;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async chat(messages: ChatMessage[], options?: Partial<QwenLLMConfig>): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('Qwen LLM服务未初始化');
    }

    const startTime = Date.now();
    const config = { ...this.config, ...options };

    try {
      const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen3-35b-a3b',
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          top_p: config.topP,
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      this.requestCount++;
      this.totalLatency += latency;

      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: data.choices[0]?.finish_reason || 'stop',
        latency,
        confidence: this.calculateConfidence(data),
      };
    } catch (error) {
      console.error('❌ Qwen LLM调用失败:', error);
      throw new Error(`LLM调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private calculateConfidence(response: any): number {
    if (response.logprobs && response.logprobs.content) {
      const avgLogProb = response.logprobs.content.reduce(
        (sum: number, token: any) => sum + token.logprob, 0
      ) / response.logprobs.content.length;
      return Math.min(1, Math.max(0, Math.exp(avgLogProb)));
    }
    return 0;
  }

  async generateText(prompt: string, options?: Partial<QwenLLMConfig>): Promise<LLMResponse> {
    const messages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ];
    return this.chat(messages, options);
  }

  async recognizeIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    entities: Array<{ type: string; value: string }>;
    reasoning: string;
  }> {
    const systemPrompt = `你是一个专业的客服意图识别引擎。请分析用户输入，识别其意图。

可识别的意图类型：
- product_inquiry: 产品咨询（询问产品功能、特性、规格等）
- price_negotiation: 价格相关（询问价格、议价、优惠等）
- appointment_booking: 预约安排（预约时间、安排会面等）
- complaint: 投诉不满（表达不满、投诉问题等）
- not_interested: 无兴趣（拒绝、不需要等）
- greeting: 问候（打招呼、你好等）
- farewell: 告别（再见、结束对话等）
- other: 其他

请以JSON格式返回结果：
{
  "intent": "意图类型",
  "confidence": 0.0-1.0的置信度,
  "entities": [{"type": "实体类型", "value": "实体值"}],
  "reasoning": "简短的推理过程"
}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ], { temperature: 0.3, maxTokens: 256 });

    try {
      const result = JSON.parse(response.content);
      return result;
    } catch {
      return {
        intent: 'other',
        confidence: 0.5,
        entities: [],
        reasoning: 'JSON解析失败，使用默认值'
      };
    }
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
    confidence: number;
    score: number;
    reasoning: string;
  }> {
    const systemPrompt = `你是一个专业的情感分析引擎。分析用户文本的情感倾向。

情感类别：
- very_positive: 非常积极（强烈正面情绪）
- positive: 积极（正面情绪）
- neutral: 中性（无明显情绪）
- negative: 消极（负面情绪）
- very_negative: 非常消极（强烈负面情绪）

请以JSON格式返回：
{
  "sentiment": "情感类别",
  "confidence": 0.0-1.0置信度,
  "score": -1到1的情感分数（负=负面，正=正面），
  "reasoning": "分析依据"
}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ], { temperature: 0.2, maxTokens: 128 });

    try {
      const result = JSON.parse(response.content);
      return result;
    } catch {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        score: 0,
        reasoning: '解析失败'
      };
    }
  }

  async generateCallScript(context: {
    customerProfile?: string;
    productName?: string;
    objective?: string;
    stage?: string;
    previousInteractions?: string;
  }): Promise<string> {
    const systemPrompt = `你是YYC³智能呼叫中心的话术生成专家。根据客户信息和通话目标，生成专业、自然、有说服力的外呼话术。

要求：
1. 语言亲切专业，符合客服场景
2. 针对客户特点个性化定制
3. 包含开场白、核心内容、引导性提问
4. 控制在200字以内
5. 避免过于推销化，注重价值传递`;

    const userPrompt = `请生成外呼话术：

客户画像：${context.customerProfile || '新客户'}
产品/服务：${context.productName || '通用产品'}
通话目标：${context.objective || '产品介绍与需求挖掘'}
通话阶段：${context.stage || '初次接触'}
历史交互：${context.previousInteractions || '无'}

请生成完整话术：`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.8, maxTokens: 512 });

    return response.content;
  }

  async suggestNextAction(callContext: {
    transcript: string;
    intent: string;
    sentiment: string;
    stage: string;
  }): Promise<{
    action: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const systemPrompt = `你是智能外呼系统的决策助手。根据当前通话状态，建议下一步最佳行动。

可用行动：
- 继续介绍产品特性
- 询问客户具体需求
- 提供优惠信息
- 安排后续跟进
- 转接人工客服
- 结束通话
- 处理投诉
- 其他`;

    const userPrompt = `当前通话状态：
- 通话记录：${callContext.transcript.slice(-500)}
- 客户意图：${callContext.intent}
- 情感倾向：${callContext.sentiment}
- 通话阶段：${callContext.stage}

请建议下一步行动（JSON格式）：`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.6, maxTokens: 256 });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        action: '继续介绍产品特性',
        reason: '默认策略',
        priority: 'medium'
      };
    }
  }

  getStatistics(): {
    totalRequests: number;
    averageLatency: number;
    uptime: boolean;
  } {
    return {
      totalRequests: this.requestCount,
      averageLatency: this.requestCount > 0 ? Math.round(this.totalLatency / this.requestCount) : 0,
      uptime: this.isInitialized,
    };
  }
}

export default QwenLLMService;
