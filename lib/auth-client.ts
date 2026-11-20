/**
 * @fileoverview 客户端认证凭证工具
 * @description 浏览器侧令牌存取与请求头组装，供前端 fetch 调用受保护 API 使用。
 *              令牌由登录接口（/api/auth）签发，前端保存后自动附加到请求。
 * @module lib/auth-client
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

const ACCESS_TOKEN_KEY = 'yyc3_access_token';
const REFRESH_TOKEN_KEY = 'yyc3_refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function saveAuthTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

/** 组装带 Authorization 的请求头（无令牌时返回空对象，不破坏匿名请求） */
export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
