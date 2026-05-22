import { NextRequest, NextResponse } from 'next/server';
import {
  unifiedAuthManager,
  zhipuClient,
  AuthProvider,
  ZhipuChatCompletionRequest,
} from '@/lib/unified-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'authenticate': {
        if (!params.provider) {
          return NextResponse.json(
            { success: false, error: 'Provider is required' },
            { status: 400 }
          );
        }

        const token = await unifiedAuthManager.authenticate(
          params.provider as AuthProvider,
          params.credentials
        );

        return NextResponse.json({ success: true, data: token });
      }

      case 'set-api-key': {
        if (!params.provider || !params.apiKey) {
          return NextResponse.json(
            { success: false, error: 'Provider and API key are required' },
            { status: 400 }
          );
        }

        unifiedAuthManager.setApiKey(params.provider, params.apiKey);

        return NextResponse.json({
          success: true,
          message: `API key set for ${params.provider}`,
        });
      }

      case 'switch-provider': {
        if (!params.provider) {
          return NextResponse.json(
            { success: false, error: 'Provider is required' },
            { status: 400 }
          );
        }

        await unifiedAuthManager.switchProvider(params.provider);

        return NextResponse.json({
          success: true,
          currentProvider: unifiedAuthManager.getCurrentProvider(),
        });
      }

      case 'chat-completion': {
        if (!params.messages) {
          return NextResponse.json(
            { success: false, error: 'Messages are required' },
            { status: 400 }
          );
        }

        const request: ZhipuChatCompletionRequest = {
          model: params.model || 'glm-4-plus',
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens || 2048,
          stream: params.stream || false,
        };

        const response = await zhipuClient.chatCompletion(request);

        return NextResponse.json({ success: true, data: response });
      }

      case 'generate-embedding': {
        if (!params.text) {
          return NextResponse.json(
            { success: false, error: 'Text is required' },
            { status: 400 }
          );
        }

        const embedding = await zhipuClient.generateEmbedding(params.text);

        return NextResponse.json({
          success: true,
          data: {
            embedding,
            dimensions: embedding.length,
          },
        });
      }

      case 'count-tokens': {
        if (!params.text) {
          return NextResponse.json(
            { success: false, error: 'Text is required' },
            { status: 400 }
          );
        }

        const tokenCount = await zhipuClient.countTokens(params.text);

        return NextResponse.json({ success: true, data: { tokenCount } });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Unified Auth API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const currentProvider = unifiedAuthManager.getCurrentProvider();
  const availableProviders = unifiedAuthManager.getAvailableProviders();
  const supportedModels = unifiedAuthManager.getSupportedModels();
  const config = currentProvider
    ? unifiedAuthManager.getConfig(currentProvider)
    : null;

  return NextResponse.json({
    success: true,
    message: 'YYC3 Unified Auth & Zhipu AI Platform Integration',
    version: '1.0.0',
    authInfo: {
      currentProvider,
      availableProviders,
      isAuthenticated: !!currentProvider,
      config,
    },
    aiModels: supportedModels.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      capabilities: model.capabilities,
      contextWindow: model.contextWindow,
      pricing: model.pricing,
    })),
    capabilities: {
      chatCompletion: true,
      streaming: true,
      embeddings: true,
      tokenCounting: true,
      multiProvider: true,
      toolCalling: true,
      vision: true,
    },
  });
}
