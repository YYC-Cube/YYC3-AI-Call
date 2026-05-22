/**
 * @file hooks/useSettingsSync.ts
 * @description 设置同步 Hook — 在 IDE 页面挂载时启动全局设置同步、
 *              快捷键绑定安装、模型配置同步、MCP 注入、CSS 变量同步
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hooks,settings,sync,keybindings,lifecycle
 */

import { useEffect, useRef } from "react";
import {
  startSettingsSync,
  installGlobalKeybindings,
  registerKeybindingAction,
  syncLLMServiceToSettings,
} from "../SettingsBridge";

/**
 * 设置同步 Hook — 在组件挂载时启动全局同步系统
 *
 * 功能：
 * 1. 启动 Settings Store → IDE 模块的数据同步（模型、MCP、CSS 变量）
 * 2. 安装全局快捷键事件监听
 * 3. 从 LLMService localStorage 反向导入已有配置
 *
 * @param actionMap 快捷键动作映射表 { actionId: handler }
 */
export function useSettingsSync(actionMap?: Record<string, () => void>): void {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. 从 LLMService 反向同步到 Settings Store (首次)
    syncLLMServiceToSettings();

    // 2. 启动持续同步 (Settings Store → IDE 模块)
    const unsubSync = startSettingsSync();

    // 3. 安装全局快捷键
    const unsubKeys = installGlobalKeybindings();

    return () => {
      unsubSync();
      unsubKeys();
      initialized.current = false;
    };
  }, []);

  // 4. 注册快捷键动作处理函数
  useEffect(() => {
    if (!actionMap) return;

    const cleanups: (() => void)[] = [];
    for (const [action, handler] of Object.entries(actionMap)) {
      cleanups.push(registerKeybindingAction(action, handler));
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [actionMap]);
}
