import { NextRequest, NextResponse } from 'next/server';
import { MCPServer, MCPClient, MCPMessageType, MCPRole } from '@/lib/mcp';

const mcpServer = new MCPServer({
  name: 'YYC3-MCP-Server',
  version: '1.0.0',
  description: 'YYC3 AI Calling MCP Server - Model Context Protocol Integration',
  capabilities: {
    tools: true,
    resources: true,
    prompts: true,
    logging: true,
  },
  tools: [
    {
      name: 'ai-call-analyze',
      description: 'Analyze AI call data and generate insights',
      inputSchema: {
        type: 'object',
        properties: {
          callId: { type: 'string', description: 'Call ID to analyze' },
          metrics: {
            type: 'array',
            description: 'Metrics to analyze',
            items: { type: 'string' },
          },
        },
        required: ['callId'],
      },
      handler: async (params) => {
        console.log('📞 Analyzing call:', params.callId);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
          callId: params.callId,
          analysis: {
            duration: Math.floor(Math.random() * 300) + 60,
            sentiment: ['positive', 'neutral', 'negative'][
              Math.floor(Math.random() * 3)
            ],
            keywords: ['service', 'quality', 'support', 'satisfaction'],
            summary: `Analysis of call ${params.callId} completed successfully`,
          },
          timestamp: new Date(),
        };
      },
    },
    {
      name: 'agent-status-check',
      description: 'Check the status and health of AI agents',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Agent ID to check' },
        },
      },
      handler: async (params) => {
        console.log('🤖 Checking agent status:', params.agentId || 'all');

        await new Promise((resolve) => setTimeout(resolve, 500));

        const agents = params.agentId
          ? [params.agentId]
          : [
              'meta-oracle',
              'cloud-guardian',
              'quality-master',
              'creative-spirit',
            ];

        return {
          agents: agents.map((id) => ({
            id,
            status: 'healthy',
            uptime: Math.floor(Math.random() * 86400),
            lastActivity: new Date(),
            tasksCompleted: Math.floor(Math.random() * 100),
          })),
          checkedAt: new Date(),
        };
      },
    },
  ],
  resources: [
    {
      uri: 'resource://yyc3/config',
      name: 'System Configuration',
      description: 'YYC3 system configuration and settings',
      mimeType: 'application/json',
      capabilities: ['read'],
    },
    {
      uri: 'resource://yyc3/metrics',
      name: 'System Metrics',
      description: 'Real-time system performance metrics',
      mimeType: 'application/json',
      capabilities: ['read'],
    },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'send-message': {
        if (!params.message) {
          return NextResponse.json(
            { success: false, error: 'Message is required' },
            { status: 400 }
          );
        }

        const response = await mcpServer.handleMessage(params.message);

        return NextResponse.json({
          success: true,
          data: response,
        });
      }

      case 'list-tools': {
        const tools = mcpServer.getToolNames().map((name) => ({
          name,
          available: true,
        }));

        return NextResponse.json({ success: true, data: tools });
      }

      case 'call-tool': {
        if (!params.name) {
          return NextResponse.json(
            { success: false, error: 'Tool name is required' },
            { status: 400 }
          );
        }

        const message = {
          id: `api-${Date.now()}`,
          type: MCPMessageType.REQUEST,
          role: MCPRole.CLIENT,
          timestamp: new Date(),
          payload: {
            action: 'call-tool',
            params: { name: params.name, arguments: params.arguments || {} },
          },
        };

        const result = await mcpServer.handleMessage(message);

        return NextResponse.json({
          success: true,
          data: result.payload,
        });
      }

      case 'list-resources': {
        const resources = mcpServer.getResourceURIs();

        return NextResponse.json({ success: true, data: resources });
      }

      case 'get-server-info': {
        const info = mcpServer.getConfig();

        return NextResponse.json({ success: true, data: info });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('MCP API Error:', error);

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
  const config = mcpServer.getConfig();
  const tools = mcpServer.getToolNames();
  const resources = mcpServer.getResourceURIs();
  const history = mcpServer.getMessageHistory().slice(-10);

  return NextResponse.json({
    success: true,
    message: 'YYC3 MCP Server - Model Context Protocol',
    version: '1.0.0',
    serverInfo: config,
    capabilities: {
      tools: tools.length,
      resources: resources.length,
      supportedActions: [
        'send-message',
        'list-tools',
        'call-tool',
        'list-resources',
        'get-server-info',
      ],
    },
    recentMessages: history,
  });
}
