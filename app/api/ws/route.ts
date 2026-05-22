import { NextRequest, NextResponse } from 'next/server';
import { wsManager } from '@/lib/websocket/manager';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const stats = {
      connectedClients: wsManager.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get WebSocket stats', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to get WebSocket statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientId, roomId, userId, userRole, token } = body;

    switch (action) {
      case 'subscribe':
        if (!clientId || !roomId) {
          return NextResponse.json(
            { success: false, error: 'clientId and roomId are required' },
            { status: 400 }
          );
        }

        const subscribed = wsManager.subscribeToRoom(clientId, roomId);
        
        return NextResponse.json({
          success: subscribed,
          message: subscribed 
            ? `Subscribed to room ${roomId}` 
            : `Failed to subscribe to room ${roomId}`,
        });

      case 'unsubscribe':
        if (!clientId || !roomId) {
          return NextResponse.json(
            { success: false, error: 'clientId and roomId are required' },
            { status: 400 }
          );
        }

        wsManager.unsubscribeFromRoom(clientId, roomId);
        
        return NextResponse.json({
          success: true,
          message: `Unsubscribed from room ${roomId}`,
        });

      case 'authenticate':
        if (!clientId || !userId || !userRole || !token) {
          return NextResponse.json(
            { success: false, error: 'clientId, userId, userRole, and token are required' },
            { status: 400 }
          );
        }

        const isAuthenticated = await wsManager.authenticateClient(
          clientId,
          userId,
          userRole,
          token
        );

        return NextResponse.json({
          success: isAuthenticated,
          message: isAuthenticated ? 'Authentication successful' : 'Authentication failed',
        });

      case 'get-room-info':
        if (!roomId) {
          return NextResponse.json(
            { success: false, error: 'roomId is required' },
            { status: 400 }
          );
        }

        const roomInfo = wsManager.getRoomInfo(roomId);

        return NextResponse.json({
          success: true,
          data: roomInfo || { clients: 0, exists: false },
        });

      case 'check-user-online':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }

        const isOnline = wsManager.getUserOnlineStatus(userId);

        return NextResponse.json({
          success: true,
          data: { isOnline, userId },
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('WebSocket API error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
