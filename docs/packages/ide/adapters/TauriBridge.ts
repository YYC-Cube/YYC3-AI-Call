import { createLogger } from "./utils/logger";
const log = createLogger("TauriBridge");
/**
 * @file adapters/TauriBridge.ts
 * @description Tauri 宿主机桥接层 — 对齐 P0-架构-宿主机桥接.md，封装原生 API 调用，
 *              Web 环境自动降级为浏览器 API 兼容模式
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags adapters,tauri,bridge,native,filesystem
 */

// ================================================================
// Tauri Bridge — 宿主机桥接层
// ================================================================
//
// 设计理念：
//   - 统一 API 抽象层，屏蔽 Tauri/Web 差异
//   - Tauri 环境调用原生 API（文件系统、剪贴板、对话框等）
//   - Web 环境自动降级为浏览器兼容实现
//   - 运行时检测，无需编译时条件判断
//
// 对齐：YYC3-Design-Prompt/P0-核心架构/YYC3-P0-架构-宿主机桥接.md
// ================================================================

/** 检测当前是否在 Tauri 环境中运行 */
export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/** 获取平台类型 */
export type PlatformType =
  | "tauri-windows"
  | "tauri-macos"
  | "tauri-linux"
  | "web";

export function getPlatform(): PlatformType {
  if (!isTauriEnvironment()) return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("windows")) return "tauri-windows";
  if (ua.includes("mac")) return "tauri-macos";
  return "tauri-linux";
}

// ── 文件系统桥接 ──

export interface NativeFileResult {
  path: string;
  content: string;
  name: string;
  size: number;
}

/** 打开文件选择对话框 */
export async function openFileDialog(options?: {
  multiple?: boolean;
  filters?: Array<{ name: string; extensions: string[] }>;
}): Promise<NativeFileResult[]> {
  if (isTauriEnvironment()) {
    // Tauri: 调用原生文件对话框
    try {
      const tauri = window.__TAURI__!;
      const selected = await tauri.dialog.open({
        multiple: options?.multiple ?? false,
        filters: options?.filters,
      });
      if (!selected) return [];
      const paths = Array.isArray(selected) ? selected : [selected];
      const results: NativeFileResult[] = [];
      for (const path of paths) {
        const content = await tauri.fs.readTextFile(path);
        const name = path.split(/[/\\]/).pop() || path;
        results.push({ path, content, name, size: content.length });
      }
      return results;
    } catch (e) {
      log.warn(
        "[TauriBridge] Native file dialog failed, falling back to web:",
        e,
      );
    }
  }

  // Web fallback: HTML file input
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options?.multiple ?? false;
    if (options?.filters?.length) {
      input.accept = options.filters
        .flatMap((f) => f.extensions.map((ext) => `.${ext}`))
        .join(",");
    }
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      const results: NativeFileResult[] = [];
      for (const file of files) {
        const content = await file.text();
        results.push({
          path: file.name,
          content,
          name: file.name,
          size: file.size,
        });
      }
      resolve(results);
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}

/** 保存文件对话框 */
export async function saveFileDialog(
  content: string,
  defaultName?: string,
  filters?: Array<{ name: string; extensions: string[] }>,
): Promise<string | null> {
  if (isTauriEnvironment()) {
    try {
      const tauri = window.__TAURI__!;
      const path = await tauri.dialog.save({
        defaultPath: defaultName,
        filters,
      });
      if (path) {
        await tauri.fs.writeTextFile(path, content);
        return path;
      }
      return null;
    } catch (e) {
      log.warn("Native save failed, falling back to web:", e);
    }
  }

  // Web fallback: Blob download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName || "untitled.txt";
  a.click();
  URL.revokeObjectURL(url);
  return defaultName || null;
}

// ── 剪贴板桥接 ──

/** 写入剪贴板 */
export async function writeClipboard(text: string): Promise<boolean> {
  if (isTauriEnvironment()) {
    try {
      const tauri = window.__TAURI__!;
      await tauri.clipboard.writeText(text);
      return true;
    } catch (e) {
      log.warn("Native clipboard write failed:", e);
    }
  }

  // Web fallback using shared clipboard utility
  const { copyToClipboard } = await import("../utils/clipboard");
  return copyToClipboard(text);
}

/** 读取剪贴板 */
export async function readClipboard(): Promise<string | null> {
  if (isTauriEnvironment()) {
    try {
      const tauri = window.__TAURI__!;
      return await tauri.clipboard.readText();
    } catch (e) {
      log.warn("Native clipboard read failed:", e);
    }
  }

  const { readFromClipboard } = await import("../utils/clipboard");
  return readFromClipboard();
}

// ── 通知桥接 ──

/** 发送系统通知 */
export async function sendNotification(
  title: string,
  body: string,
  options?: { icon?: string },
): Promise<boolean> {
  if (isTauriEnvironment()) {
    try {
      const tauri = window.__TAURI__!;
      await tauri.notification.sendNotification({
        title,
        body,
        icon: options?.icon,
      });
      return true;
    } catch (e) {
      log.warn("Native notification failed:", e);
    }
  }

  // Web fallback: Notification API
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: options?.icon });
      return true;
    }
    if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification(title, { body, icon: options?.icon });
        return true;
      }
    }
  }
  return false;
}

// ── Shell 桥接 ──

export interface ShellOutput {
  stdout: string;
  stderr: string;
  code: number;
}

/** 执行 Shell 命令（仅 Tauri 环境） */
export async function executeShellCommand(
  command: string,
  args?: string[],
): Promise<ShellOutput> {
  if (!isTauriEnvironment()) {
    return {
      stdout: "",
      stderr:
        "[TauriBridge] Shell commands are only available in Tauri environment",
      code: 1,
    };
  }

  try {
    const tauri = window.__TAURI__!;
    const result = await tauri.shell.Command.create(command, args).execute();
    return {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      code: result.code ?? 0,
    };
  } catch (e) {
    return {
      stdout: "",
      stderr: String(e),
      code: 1,
    };
  }
}

// ── 窗口桥接 ──

/** 设置窗口标题 */
export async function setWindowTitle(title: string): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const tauri = window.__TAURI__!;
      await tauri.window.appWindow.setTitle(title);
      return;
    } catch {}
  }
  document.title = title;
}

/** 最小化窗口 */
export async function minimizeWindow(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const tauri = window.__TAURI__!;
      await tauri.window.appWindow.minimize();
    } catch {}
  }
}

/** 最大化/还原窗口 */
export async function toggleMaximize(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const tauri = window.__TAURI__!;
      await tauri.window.appWindow.toggleMaximize();
    } catch {}
  }
}

// ── 导出桥接信息 ──

export const BRIDGE_INFO = {
  isTauri: isTauriEnvironment(),
  platform: getPlatform(),
  capabilities: {
    nativeFs: isTauriEnvironment(),
    nativeClipboard: isTauriEnvironment(),
    nativeNotification:
      isTauriEnvironment() ||
      "Notification" in (typeof window !== "undefined" ? window : {}),
    nativeShell: isTauriEnvironment(),
    nativeWindow: isTauriEnvironment(),
  },
} as const;
