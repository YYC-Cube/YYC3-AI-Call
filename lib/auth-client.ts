/**
 * @fileoverview 客户端认证会话工具（HttpOnly Cookie 通道）
 * @description R3 升级：令牌由 /api/auth 经 HttpOnly Cookie 下发，浏览器 JS
 *              不可读（收敛 XSS 面）；同源 fetch 自动携带 Cookie，
 *              requireAuth（lib/api-auth）从 access_token Cookie 校验——
 *              前端无需也无法在 localStorage 明文存取令牌。
 * @module lib/auth-client
 * @author YYC³
 * @version 2.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

/** 组装请求头：Cookie 通道由浏览器自动携带，此处保持空对象兼容既有调用方 */
export function getAuthHeaders(): Record<string, string> {
  return {};
}

/** 退出登录：服务端撤销刷新令牌并清空 Cookie */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
  } catch {
    // 网络失败时本地 Cookie 仍随 Max-Age=0 由服务端响应清除尽力而为
  }
}
