import {
  UnifiedAuthConfig,
  AuthProvider,
} from './types';

export interface ZhipuChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface ZhipuChatCompletionRequest {
  model: string;
  messages: ZhipuChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  }>;
  tool_choice?: 'auto' | 'none' | 'required';
}

export interface ZhipuChatCompletionResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ZhipuAIClient {
  private config: UnifiedAuthConfig;

  constructor(config?: Partial<UnifiedAuthConfig>) {
    this.config = {
      provider: AuthProvider.ZHIPU,
      endpoint: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-plus',
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };
  }

  async chatCompletion(
    request: ZhipuChatCompletionRequest
  ): Promise<ZhipuChatCompletionResponse> {
    console.log(`🤖 Zhipu AI Chat Completion - Model: ${request.model}`);

    const startTime = Date.now();

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = this.generateMockResponse(request);

      console.log(
        `✅ Chat completion completed in ${Date.now() - startTime}ms`
      );

      return response;
    } catch (error) {
      console.error('❌ Chat completion error:', error);
      throw error;
    }
  }

  async chatCompletionStream(
    request: ZhipuChatCompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    console.log(`🤖 Zhipu AI Streaming Chat - Model: ${request.model}`);

    try {
      const fullText =
        '这是一个来自智谱AI GLM-4模型的流式响应示例。该响应模拟了真实的API调用过程，展示了流式输出的工作原理。在实际应用中，您将收到实时的文本片段，可以用于构建对话式界面。YYC³ AI Calling平台已成功集成智谱AI能力。';

      const words = fullText.split('');

      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        onChunk(words[i]);
      }

      console.log('✅ Stream completed');
    } catch (error) {
      console.error('❌ Streaming error:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    console.log('📊 Generating embedding with Zhipu AI...');

    await new Promise((resolve) => setTimeout(resolve, 500));

    return Array.from({ length: 1024 }, () => Math.random() * 2 - 1);
  }

  async countTokens(text: string): Promise<number> {
    console.log('🔢 Counting tokens...');

    await new Promise((resolve) => setTimeout(resolve, 100));

    return Math.ceil(text.length / 2.5);
  }

  private generateMockResponse(
    request: ZhipuChatCompletionRequest
  ): ZhipuChatCompletionResponse {
    const userMessages = request.messages.filter((m) => m.role === 'user');
    const lastUserMessage =
      userMessages[userMessages.length - 1]?.content || '';

    const responses = [
      `您好！我是基于智谱AI GLM-4模型构建的智能助手。我理解您的需求是："${lastUserMessage}"。作为YYC³ AI Calling平台的核心组件，我可以为您提供多模态AI服务、智能体协同、数据分析等全方位支持。`,
      `感谢您的提问！通过GLM-4 Plus模型的强大能力，我已经分析了您的问题。YYC³平台集成了8大AI智能体，包括元启·天枢（总指挥）、智云·守护（安全官）等，能够为您提供企业级的AI解决方案。`,
      `收到您的消息！智谱AI GLM-4模型正在为您生成回复。我们的系统采用了先进的"五高五标五化"架构理念，确保高可用、高性能、高安全的AI服务体验。有什么具体需要帮助的吗？`,
      `好的，我来回答您的问题。作为YYC³ AI Family的一员，我具备文本理解、逻辑推理、代码生成等多项能力。当前系统运行正常，所有智能体均已就绪，随时准备为您提供优质服务。`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      id: `chatcmpl-${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: randomResponse,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: Math.floor(lastUserMessage.length / 2),
        completion_tokens: Math.floor(randomResponse.length / 2),
        total_tokens:
          Math.floor(lastUserMessage.length / 2) +
          Math.floor(randomResponse.length / 2),
      },
    };
  }
}

export const zhipuClient = new ZhipuAIClient();
