import { createLogger } from "../utils/logger";
const log = createLogger("ThemeSwitcher");
/**
 * @file plugins/ThemeSwitcherPlugin.ts
 * @description 主题切换插件示例 - 快速切换预设主题
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,theme,ui
 */

import type { PluginManifest, PluginContext } from "../types";

// 预设主题配置
const PRESET_THEMES = [
  {
    id: "default",
    name: "默认深色",
    nameEn: "Default Dark",
    colors: {
      "--ide-bg-deep": "#060d1a",
      "--ide-bg": "#0b1729",
      "--ide-bg-surface": "#112240",
      "--ide-text": "#e2e8f0",
      "--ide-text-muted": "#94a3b8",
      "--ide-border": "#1e293b",
      "--ide-accent": "#38bdf8",
    },
  },
  {
    id: "cyberpunk",
    name: "赛博朋克",
    nameEn: "Cyberpunk",
    colors: {
      "--ide-bg-deep": "#050a10",
      "--ide-bg": "#0a1628",
      "--ide-bg-surface": "#112240",
      "--ide-text": "#e2e8f0",
      "--ide-text-muted": "#64748b",
      "--ide-border": "#1e3a5f",
      "--ide-accent": "#00f0ff",
    },
  },
  {
    id: "light",
    name: "浅色模式",
    nameEn: "Light Mode",
    colors: {
      "--ide-bg-deep": "#f8fafc",
      "--ide-bg": "#ffffff",
      "--ide-bg-surface": "#f1f5f9",
      "--ide-text": "#0f172a",
      "--ide-text-muted": "#64748b",
      "--ide-border": "#e2e8f0",
      "--ide-accent": "#0284c7",
    },
  },
  {
    id: "github",
    name: "GitHub",
    nameEn: "GitHub Dark",
    colors: {
      "--ide-bg-deep": "#0d1117",
      "--ide-bg": "#161b22",
      "--ide-bg-surface": "#21262d",
      "--ide-text": "#c9d1d9",
      "--ide-text-muted": "#8b949e",
      "--ide-border": "#30363d",
      "--ide-accent": "#58a6ff",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    nameEn: "Dracula",
    colors: {
      "--ide-bg-deep": "#282a36",
      "--ide-bg": "#44475a",
      "--ide-bg-surface": "#6272a4",
      "--ide-text": "#f8f8f2",
      "--ide-text-muted": "#6272a4",
      "--ide-border": "#6272a4",
      "--ide-accent": "#bd93f9",
    },
  },
];

export const ThemeSwitcherPlugin: PluginManifest = {
  id: "yyc3-theme-switcher",
  name: "主题切换器",
  nameEn: "Theme Switcher",
  version: "1.0.0",
  description: "快速切换预设主题，支持自定义主题颜色",
  descriptionEn: "Quick switch between preset themes, support custom theme colors",
  author: "YYC3 Team <admin@0379.email>",
  homepage: "https://github.com/YYC-Cube/yyc3-family-ai",
  license: "MIT",
  tags: ["theme", "ui", "customization"],
  icon: "Palette",
  
  activate: (context: PluginContext) => {
    log.info("插件已激活");
    
    // 注册状态栏项
    context.ui.registerStatusBarItem({
      id: "theme-switcher",
      text: "🎨 主题",
      tooltip: "切换主题",
      onClick: () => {
        showThemeSelector(context);
      },
    });
    
    // 注册命令
    context.commands.registerCommand("yyc3.theme.switch", () => {
      showThemeSelector(context);
    });
    
    context.commands.registerCommand("yyc3.theme.next", () => {
      cycleTheme(context, 1);
    });
    
    context.commands.registerCommand("yyc3.theme.prev", () => {
      cycleTheme(context, -1);
    });
    
    // 注册菜单项
    context.ui.registerMenuItem("view", {
      label: "切换主题",
      action: () => showThemeSelector(context),
      shortcut: "Ctrl+Shift+T",
    });
    
    // 从 localStorage 加载上次使用的主题
    loadSavedTheme(context);
    
    return () => {
      log.info("插件已停用");
    };
  },
  
  deactivate: () => {
    log.info("插件正在停用");
  },
};

/**
 * 显示主题选择器
 */
function showThemeSelector(context: PluginContext) {
  const currentTheme = getCurrentTheme(context);
  
  const html = `
    <div style="padding: 16px; font-family: system-ui; font-size: 13px;">
      <h3 style="margin: 0 0 16px; color: var(--ide-text);">🎨 选择主题</h3>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        ${PRESET_THEMES.map((theme) => `
          <button onclick="window.postMessage({ type: 'select-theme', themeId: '${theme.id}' }, '*')" style="
            padding: 16px;
            background: ${theme.colors["--ide-bg"]};
            border: 2px solid ${currentTheme === theme.id ? "var(--ide-accent)" : theme.colors["--ide-border"]};
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
          " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            <div style="font-weight: bold; color: ${theme.colors["--ide-text"]}; margin-bottom: 4px;">
              ${theme.name}
            </div>
            <div style="font-size: 11px; color: ${theme.colors["--ide-text-muted"]};">
              ${theme.nameEn}
            </div>
            <div style="display: flex; gap: 4px; margin-top: 8px;">
              ${Object.values(theme.colors).slice(0, 4).map((color) => `
                <div style="width: 16px; height: 16px; border-radius: 3px; background: ${color};"></div>
              `).join("")}
            </div>
          </button>
        `).join("")}
      </div>
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ide-border);">
        <button onclick="window.postMessage({ type: 'close' }, '*')" style="
          padding: 8px 16px;
          background: var(--ide-border);
          color: var(--ide-text);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">关闭</button>
      </div>
    </div>
  `;
  
  context.ui.showPanel({
    title: "🎨 主题选择器",
    content: html,
    width: 500,
    height: 450,
  });
}

/**
 * 获取当前主题
 */
function getCurrentTheme(context: PluginContext): string {
  return localStorage.getItem("yyc3-theme") || "default";
}

/**
 * 加载保存的主题
 */
function loadSavedTheme(context: PluginContext) {
  const savedTheme = localStorage.getItem("yyc3-theme");
  if (savedTheme) {
    applyTheme(context, savedTheme);
  }
}

/**
 * 循环切换主题
 */
function cycleTheme(context: PluginContext, direction: number) {
  const currentTheme = getCurrentTheme(context);
  const currentIndex = PRESET_THEMES.findIndex((t) => t.id === currentTheme);
  const newIndex = (currentIndex + direction + PRESET_THEMES.length) % PRESET_THEMES.length;
  const newTheme = PRESET_THEMES[newIndex];
  
  applyTheme(context, newTheme.id);
  context.ui.showToast(`已切换到 ${newTheme.name}`, "success");
}

/**
 * 应用主题
 */
function applyTheme(context: PluginContext, themeId: string) {
  const theme = PRESET_THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  
  // 应用 CSS 变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  
  // 保存到 localStorage
  localStorage.setItem("yyc3-theme", themeId);
  
  log.info("已应用主题:", theme.name);
}

export default ThemeSwitcherPlugin;
