/**
 * file: utils/clipboard.ts
 * description: 剪贴板工具函数，兼容 Clipboard API 被禁用的沙箱环境，
 *              使用 execCommand('copy') 作为回退方案
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v1.0.0
 * created: 2026-03-15
 * updated: 2026-03-19
 * status: dev
 * license: MIT
 * copyright: Copyright (c) 2026 YanYuCloudCube Team
 * tags: clipboard,copy,fallback,sandbox
 */

/**
 * Copies text to the clipboard with a fallback for sandboxed environments
 * where the Clipboard API is blocked by permissions policy.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try the modern Clipboard API first
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API blocked — fall through to legacy fallback
    }
  }

  // Legacy fallback using execCommand('copy')
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Move off-screen to avoid flash
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Reads text from clipboard (best-effort; returns null on failure).
 */
export async function readFromClipboard(): Promise<string | null> {
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.readText === "function"
  ) {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }
  return null;
}
