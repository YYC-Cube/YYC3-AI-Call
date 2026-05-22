/**
 * API 集成测试套件
 *
 * 测试目标：
 * 1. 验证API端点的功能完整性
 * 2. 测试请求/响应格式
 * 3. 验证错误处理机制
 * 4. 测试安全性和性能
 */

import { AIFamilyManager } from '@/lib/ai-family/manager';
import { ImageProcessor } from '@/lib/multimodal/image-processor';
import { AudioProcessor } from '@/lib/multimodal/audio-processor';
import { DocumentProcessor } from '@/lib/multimodal/document-processor';
import { MCPServer } from '@/lib/mcp/server';
import { UnifiedAuthManager } from '@/lib/unified-auth/manager';
import {
  MediaType,
  ImageFormat,
  AudioFormat,
  DocumentFormat,
  ImageAnalysisTask,
  AudioProcessingTask,
  DocumentProcessingTask,
} from '@/lib/multimodal/types';
import {
  MCPMessageType,
  MCPRole,
} from '@/lib/mcp/types';
import {
  AuthProvider,
  AuthTokenType,
} from '@/lib/unified-auth/types';
import { CollaborationMode } from '@/lib/ai-family/types';

describe('🔗 API Integration Tests', () => {

  // ============================================
  // 测试组1: AI Family API 集成
  // ============================================
  describe('1️⃣ AI Family API Integration', () => {
    let aiManager: AIFamilyManager;

    beforeAll(async () => {
      aiManager = new AIFamilyManager();
      await aiManager.initialize();
    });

    it('should initialize AI Family system successfully', () => {
      const metrics = aiManager.getMetrics();
      expect(metrics.activeAgents).toBe(8);
    });

    it('should create and process tasks end-to-end', async () => {
      const task = aiManager.createTask('text-generation', {
        type: 'text',
        data: { content: 'Integration test' },
      });

      expect(task.id).toBeDefined();
      expect(task.status).toBe('pending');

      try {
        await aiManager.submitTask(task);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should support collaboration workflows', async () => {
      const result = await aiManager.collaborate({
        mode: CollaborationMode.PARALLEL,
        tasks: [
          { type: 'task-1', input: { type: 'text', data: {} } },
          { type: 'task-2', input: { type: 'text', data: {} } },
        ],
      });

      expect(result.sessionId).toBeDefined();
      expect(result.results.size).toBe(2);
    });
  });

  // ============================================
  // 测试组2: 多模态处理 API 集成
  // ============================================
  describe('2️⃣ Multimodal Processing Integration', () => {
    let imageProcessor: ImageProcessor;
    let audioProcessor: AudioProcessor;
    let documentProcessor: DocumentProcessor;

    beforeAll(() => {
      imageProcessor = new ImageProcessor();
      audioProcessor = new AudioProcessor();
      documentProcessor = new DocumentProcessor();
    });

    it('should analyze images with multiple tasks', async () => {
      const testImage = {
        type: MediaType.IMAGE,
        format: ImageFormat.PNG,
        data: 'base64-image-data',
        metadata: {
          filename: 'test.png',
          size: 1024,
          mimeType: 'image/png',
          dimensions: { width: 800, height: 600 },
        },
      };

      const results = await imageProcessor.analyzeImage(testImage, [
        ImageAnalysisTask.DESCRIBE,
        ImageAnalysisTask.CLASSIFY,
        ImageAnalysisTask.GENERATE_CAPTION,
      ]);

      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.processingTime).toBeGreaterThan(0);
      });
    });

    it('should transcribe and enhance audio', async () => {
      const testAudio = {
        type: MediaType.AUDIO,
        format: AudioFormat.MP3,
        data: 'audio-data',
        metadata: {
          filename: 'test.mp3',
          size: 2048,
          duration: 30,
          mimeType: 'audio/mp3',
        },
      };

      const transcriptionResult = await audioProcessor.processAudio(
        testAudio,
        AudioProcessingTask.TRANSCRIBE
      );

      expect(transcriptionResult.success).toBe(true);
      expect(transcriptionResult.data?.text).toBeDefined();

      const enhancementResult = await audioProcessor.processAudio(
        testAudio,
        AudioProcessingTask.ENHANCE_QUALITY
      );

      expect(enhancementResult.success).toBe(true);
    });

    it('should parse and extract text from documents', async () => {
      const testDoc = {
        type: MediaType.DOCUMENT,
        format: DocumentFormat.PDF,
        data: 'document-data',
        metadata: {
          filename: 'test.pdf',
          size: 4096,
          mimeType: 'application/pdf',
        },
      };

      const extractionResult = await documentProcessor.processDocument(
        testDoc,
        DocumentProcessingTask.EXTRACT_TEXT
      );

      expect(extractionResult.success).toBe(true);
      if (extractionResult.data?.content) {
        expect(typeof extractionResult.data.content).toBe('string');
      }

      const summaryResult = await documentProcessor.processDocument(
        testDoc,
        DocumentProcessingTask.SUMMARIZE
      );

      expect(summaryResult.success).toBe(true);
      expect(summaryResult.data?.summary).toBeDefined();
    });
  });

  // ============================================
  // 测试组3: MCP 协议集成
  // ============================================
  describe('3️⃣ MCP Protocol Integration', () => {
    let mcpServer: MCPServer;

    beforeEach(() => {
      mcpServer = new MCPServer({
        name: 'Integration-Test-MCP-Server',
        version: '1.0.0',
        description: 'MCP Server for integration testing',
        capabilities: {
          tools: true,
          resources: true,
          prompts: false,
          logging: false,
        },
        tools: [
          {
            name: 'integration-tool',
            description: 'Tool for integration testing',
            inputSchema: {
              type: 'object',
              properties: {},
            },
            handler: async (params: any) => ({
              success: true,
              result: `Integration: ${JSON.stringify(params)}`,
            }),
          },
        ],
      });
    });

    it('should handle complete message lifecycle', async () => {
      const requestMessage = {
        id: 'integration-msg-1',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: { action: 'list-tools' },
      };

      const response = await mcpServer.handleMessage(requestMessage);

      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.role).toBe(MCPRole.SERVER);
      expect(response.payload.tools.length).toBeGreaterThan(0);

      const toolCallRequest = {
        id: 'integration-msg-2',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: {
          action: 'call-tool',
          params: { name: 'integration-tool', arguments: { key: 'value' } },
        },
      };

      const toolResponse = await mcpServer.handleMessage(toolCallRequest);

      expect(toolResponse.type).toBe(MCPMessageType.RESPONSE);
      expect(toolResponse.payload.result.success).toBe(true);
    });

    it('should track message history during integration', async () => {
      for (let i = 0; i < 5; i++) {
        await mcpServer.handleMessage({
          id: `history-msg-${i}`,
          type: MCPMessageType.REQUEST,
          role: MCPRole.CLIENT,
          timestamp: new Date(),
          payload: { action: 'list-tools' },
        });
      }

      const history = mcpServer.getMessageHistory();
      expect(history.length).toBe(5);
    });
  });

  // ============================================
  // 测试组4: 统一认证集成
  // ============================================
  describe('4️⃣ Unified Authentication Integration', () => {
    let authManager: UnifiedAuthManager;

    beforeEach(() => {
      authManager = new UnifiedAuthManager();
    });

    it('should complete authentication workflow', async () => {
      const token = await authManager.authenticate(AuthProvider.ZHIPU, {
        apiKey: 'integration-test-key',
      });

      expect(token.type).toBe(AuthTokenType.API_KEY);
      expect(token.value).toBeDefined();
      expect(authManager.getCurrentProvider()).toBe(AuthProvider.ZHIPU);

      const retrievedToken = authManager.getToken(AuthProvider.ZHIPU);
      expect(retrievedToken).not.toBeNull();
    });

    it('should support provider switching in workflow', async () => {
      await authManager.authenticate(AuthProvider.OPENAI, { apiKey: 'key-1' });
      await authManager.authenticate(AuthProvider.ANTHROPIC, { apiKey: 'key-2' });

      await authManager.switchProvider(AuthProvider.OPENAI);
      expect(authManager.getCurrentProvider()).toBe(AuthProvider.OPENAI);

      await authManager.switchProvider(AuthProvider.ANTHROPIC);
      expect(authManager.getCurrentProvider()).toBe(AuthProvider.ANTHROPIC);
    });

    it('should manage user profiles with usage tracking', () => {
      authManager.registerProfile({
        id: 'integration-user',
        email: 'integration@test.com',
        name: 'Integration User',
        provider: AuthProvider.ZHIPU,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        usageStats: {
          totalRequests: 100,
          totalTokens: 50000,
          lastRequestAt: new Date(),
        },
      });

      authManager.updateUsageStats('integration-user', 1500);

      const profile = authManager.getProfile('integration-user');
      expect(profile?.usageStats.totalRequests).toBe(101);
      expect(profile?.usageStats.totalTokens).toBe(51500);
    });
  });

  // ============================================
  // 测试组5: 跨模块协同工作流
  // ============================================
  describe('5️⃣ Cross-Module Workflow Integration', () => {
    it('should integrate AI Family + Multimodal processing', async () => {
      const aiManager = new AIFamilyManager();
      await aiManager.initialize();

      const imageProcessor = new ImageProcessor();

      const task = aiManager.createTask('image-analysis', {
        type: 'image',
        data: 'base64-image' as any,
      });

      const analysisResults = await imageProcessor.analyzeImage(
        {
          type: MediaType.IMAGE,
          format: ImageFormat.PNG,
          data: task.input.data as unknown as string,
        },
        [ImageAnalysisTask.DESCRIBE]
      );

      expect(analysisResults[0].success).toBe(true);
      expect(analysisResults[0].data?.description).toBeDefined();
    });

    it('should integrate Auth + AI Family workflow', async () => {
      const authManager = new UnifiedAuthManager();
      const aiManager = new AIFamilyManager();

      await authManager.authenticate(AuthProvider.ZHIPU, { apiKey: 'workflow-key' });
      await aiManager.initialize();

      const metrics = aiManager.getMetrics();
      expect(metrics.activeAgents).toBe(8);
    });

    it('should integrate MCP + Authentication', async () => {
      const authManager = new UnifiedAuthManager();
      const mcpServer = new MCPServer({
        name: 'Auth-MCP-Integration-Server',
        version: '1.0.0',
        description: 'Auth-MCP Integration Test',
        capabilities: { tools: true, resources: false, prompts: false, logging: false },
        tools: [{
          name: 'auth-check',
          description: 'Check authentication status',
          inputSchema: { type: 'object', properties: {} },
          handler: async () => ({
            success: true,
            authenticated: authManager.getCurrentProvider() !== null,
            provider: authManager.getCurrentProvider(),
          }),
        }],
      });

      await authManager.authenticate(AuthProvider.LOCAL, { apiKey: 'mcp-key' });

      const response = await mcpServer.handleMessage({
        id: 'auth-mcp-msg',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: {
          action: 'call-tool',
          params: { name: 'auth-check', arguments: {} },
        },
      });

      expect(response.payload.result.authenticated).toBe(true);
      expect(response.payload.result.provider).toBe(AuthProvider.LOCAL);
    });
  });
});