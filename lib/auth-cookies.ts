/**
 * @fileoverview 认证 Cookie 写入助手（HttpOnly）
 * @description 令牌经 Set-Cookie 下发：HttpOnly（JS 不可读，收敛 XSS 面）、
 *              SameSite=Lax、生产环境附加 Secure；Path=/ 全站可用。
 *              requireAuth（lib/api-auth）已支持 access_token Cookie 通道，
 *              前端同源 fetch 自动携带，无需 localStorage 明文存储。
 * @module lib/auth-cookies
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

/** Cookie 名称（与 lib/api-auth parseCookie 的 access_token 通道对齐） */
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

/** 有效期与 lib/auth 签发口径一致：access 默认 24h / refresh 7d */
const ACCESS_MAX_AGE = 24 * 60 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

function cookieAttrs(maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/** 组装 access + refresh 双 Cookie 的 Set-Cookie 头数组 */
export function buildAuthCookies(accessToken: string, refreshToken: string): string[] {
  return [
    `${ACCESS_COOKIE}=${encodeURIComponent(accessToken)}; ${cookieAttrs(ACCESS_MAX_AGE)}`,
    `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; ${cookieAttrs(REFRESH_MAX_AGE)}`,
  ];
}

/** 登出：清空双 Cookie（立即过期） */
export function buildClearedAuthCookies(): string[] {
  return [
    `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${REFRESH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ];
}

/** 从请求 Cookie 头解析指定名称（与 lib/api-auth parseCookie 同口径） */
export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}
