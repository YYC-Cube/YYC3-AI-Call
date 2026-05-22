/**
 * @fileoverview 认证中间件
 * @description Next.js API 路由的 JWT 认证和权限控制中间件
 * @module lib/middleware
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: Role;
  };
}

export interface AuthOptions {
  requiredRoles?: Role[];
  requireAuth?: boolean;
}

/**
 * 认证中间件工厂函数
 */
export function createAuthMiddleware(options: AuthOptions = {}) {
  const { requiredRoles = [], requireAuth = true } = options;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    // 提取 Bearer Token
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractBearerToken(authHeader ?? undefined);

    if (!token) {
      if (requireAuth) {
        return NextResponse.json(
          { error: '未提供认证令牌', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
      return null; // 不需要认证，继续处理请求
    }

    // 验证令牌
    const payload = AuthService.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '无效或过期的令牌', code: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }

    // 检查角色权限
    if (requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
      return NextResponse.json(
        { error: '权限不足', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 将用户信息添加到请求对象中
    (request as AuthenticatedRequest).user = payload;

    return null; // 认证通过，继续处理请求
  };
}

// 预定义的角色权限常量
export const ROLES = {
  ALL: [] as Role[],
  USER_ONLY: ['USER'] as Role[],
  AGENT_AND_ABOVE: ['AGENT', 'MANAGER', 'ADMIN'] as Role[],
  MANAGER_AND_ABOVE: ['MANAGER', 'ADMIN'] as Role[],
  ADMIN_ONLY: ['ADMIN'] as Role[],
} as const;

// 常用中间件实例
export const requireAuth = createAuthMiddleware({ requireAuth: true });
export const requireAdmin = createAuthMiddleware({
  requiredRoles: ROLES.ADMIN_ONLY,
});
export const requireManagerOrAbove = createAuthMiddleware({
  requiredRoles: ROLES.MANAGER_AND_ABOVE,
});
export const requireAgentOrAbove = createAuthMiddleware({
  requiredRoles: ROLES.AGENT_AND_ABOVE,
});
