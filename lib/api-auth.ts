/**
 * @fileoverview API 路由统一鉴权网关
 * @description 基于 AuthService 的路由级鉴权：支持 Authorization: Bearer 与
 *              access_token Cookie 双通道，为业务路由提供一行式接入模式。
 * @module lib/api-auth
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextResponse } from 'next/server';
import { AuthService } from './auth';

export interface AuthGateSuccess {
  ok: true;
  userId: string;
  email: string;
  role: string;
}

export interface AuthGateFailure {
  ok: false;
  response: NextResponse;
}

export type AuthGate = AuthGateSuccess | AuthGateFailure;

/** 从 Cookie 请求头中解析指定名称的值 */
function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

/**
 * 路由级鉴权网关（同步）。
 *
 * 用法：
 * ```ts
 * const gate = requireAuth(request);
 * if (!gate.ok) return gate.response;
 * // gate.userId / gate.role 已就绪
 * ```
 *
 * 令牌通道优先级：Authorization: Bearer > access_token Cookie。
 */
export function requireAuth(request: Request): AuthGate {
  const bearer = AuthService.extractBearerToken(
    request.headers.get('authorization') ?? undefined
  );
  const token = bearer ?? parseCookie(request.headers.get('cookie'), 'access_token');

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: '未提供认证令牌', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: '无效或过期的令牌', code: 'TOKEN_INVALID' },
        { status: 401 }
      ),
    };
  }

  return { ok: true, userId: payload.userId, email: payload.email, role: payload.role };
}
