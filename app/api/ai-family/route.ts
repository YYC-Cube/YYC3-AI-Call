import { NextRequest, NextResponse } from 'next/server';
import { aiFamilyManager } from '@/lib/ai-family/manager';
import { TaskPriority, CollaborationMode } from '@/lib/ai-family/types';
import {
  securityMiddleware,
  addSecurityHeaders,
  globalRateLimiter,
} from '@/lib/core/security-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'agents':
        const snapshots = aiFamilyManager.getAllSnapshots();
        return NextResponse.json({
          success: true,
          data: {
            agents: snapshots,
            count: snapshots.length,
          },
        });

      case 'metrics':
        const metrics = aiFamilyManager.getMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'queue':
        const queueStatus = aiFamilyManager.getQueueStatus();
        return NextResponse.json({ success: true, data: queueStatus });

      case 'agent':
        const agentId = searchParams.get('id');
        if (!agentId) {
          return NextResponse.json(
            { success: false, error: 'Agent ID is required' },
            { status: 400 }
          );
        }

        const snapshot = aiFamilyManager.getAgentSnapshot(agentId);
        if (!snapshot) {
          return NextResponse.json(
            { success: false, error: `Agent ${agentId} not found` },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, data: snapshot });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Family API GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = globalRateLimiter.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
      let response = NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          code: 'E0006',
        },
        { status: 429 }
      );
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toISOString());
      return addSecurityHeaders(response);
    }

    const securityCheck = await securityMiddleware(request);
    if (!securityCheck.success) {
      let response = NextResponse.json(
        {
          success: false,
          error: securityCheck.error,
          code: 'E0001',
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const body = securityCheck.data;
    const { action, ...params } = body;

    switch (action) {
      case 'initialize':
        await aiFamilyManager.initialize();
        return addSecurityHeaders(
          NextResponse.json({
            success: true,
            message: 'AI Family initialized successfully',
          })
        );

      case 'create-task':
        if (!params.type || !params.input) {
          return addSecurityHeaders(
            NextResponse.json(
              { success: false, error: 'Task type and input are required', code: 'E0001' },
              { status: 400 }
            )
          );
        }

        const task = aiFamilyManager.createTask(params.type, params.input, {
          priority: params.priority || TaskPriority.NORMAL,
          sessionId: params.sessionId,
        });

        return addSecurityHeaders(NextResponse.json({ success: true, data: task }));

      case 'submit-task':
        if (!params.task) {
          return addSecurityHeaders(
            NextResponse.json(
              { success: false, error: 'Task is required', code: 'E0001' },
              { status: 400 }
            )
          );
        }

        const result = await aiFamilyManager.submitTask(params.task);
        return addSecurityHeaders(NextResponse.json({ success: true, data: result }));

      case 'recommend-agents':
        if (!params.taskType) {
          return addSecurityHeaders(
            NextResponse.json(
              { success: false, error: 'Task type is required', code: 'E0001' },
              { status: 400 }
            )
          );
        }

        const recommendations = aiFamilyManager.recommendAgents(params.taskType);
        return addSecurityHeaders(NextResponse.json({ success: true, data: recommendations }));

      case 'collaborate':
        if (!params.mode || !params.tasks || !Array.isArray(params.tasks)) {
          return addSecurityHeaders(
            NextResponse.json(
              {
                success: false,
                error: 'Collaboration mode and tasks array are required',
                code: 'E0001',
              },
              { status: 400 }
            )
          );
        }

        const collabResult = await aiFamilyManager.collaborate({
          id: params.sessionId,
          mode: params.mode as CollaborationMode,
          tasks: params.tasks,
          agents: params.agents,
        });

        return addSecurityHeaders(NextResponse.json({ success: true, data: collabResult }));

      case 'update-config':
        if (!params.agentId || !params.updates) {
          return addSecurityHeaders(
            NextResponse.json(
              { success: false, error: 'Agent ID and updates are required', code: 'E0001' },
              { status: 400 }
            )
          );
        }

        aiFamilyManager.updateAgentConfig(params.agentId, params.updates);
        return addSecurityHeaders(
          NextResponse.json({
            success: true,
            message: `Agent ${params.agentId} config updated`,
          })
        );

      default:
        return addSecurityHeaders(
          NextResponse.json(
            { success: false, error: `Unknown action: ${action}`, code: 'E0001' },
            { status: 400 }
          )
        );
    }
  } catch (error) {
    console.error('AI Family API POST error:', error);

    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
        ? error.message
        : 'Internal server error';

    let response = NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'E0100',
        requestId: crypto.randomUUID(),
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}
