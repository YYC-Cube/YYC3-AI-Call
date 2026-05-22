/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */

/**
 * AI 提供商类型
 */
type AIProviderType = 'openai' | 'ollama' | 'anthropic' | 'azure' | 'custom';
/**
 * 消息角色
 */
type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
/**
 * 聊天消息
 */
interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
}
/**
 * 聊天完成响应
 */
interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finishReason: string;
    }>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export type { AIProviderType as A, ChatMessage as C, ChatCompletionResponse as a };
