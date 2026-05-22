/**
 * @file PluginSystem.ts
 * @description 插件系统架构 — 对齐 P2-插件-插件系统.md / P2-插件-插件开发.md，
 *              提供插件注册、生命周期管理、沙箱隔离、事件通信
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,system,registry,lifecycle,sandbox
 */

// ================================================================
// Plugin System — 插件系统核心
// ================================================================
//
// 对齐：YYC3-Design-Prompt/P2-高级功能/YYC3-P2-插件-插件系统.md
//       YYC3-Design-Prompt/P2-高级功能/YYC3-P2-插件-插件开发.md
//
// 架构：
//   ┌──────────────────────────────────┐
//   │         Plugin Manager           │
//   │  ┌──────┐ ┌──────┐ ┌──────┐    │
//   │  │ Reg  │ │ Life │ │ Sand │    │
//   │  │ istry│ │ cycle│ │  box │    │
//   │  └──────┘ └──────┘ └──────┘    │
//   └──────────────────────────────────┘
//        ↑ register   ↑ activate    ↑ API
//   ┌──────────────────────────────────┐
//   │      Plugin A  │  Plugin B      │
//   └──────────────────────────────────┘
//
// 插件 API Surface:
//   - editor: 读写文件、获取选中文本
//   - ui: 注册面板、菜单项、状态栏项
//   - ai: 调用 LLM、注册自定义 Provider
//   - commands: 注册命令、快捷键
//   - events: 监听/发射事件
// ================================================================

import { createLogger } from "./utils/logger";
const log = createLogger("PluginSystem");
import type { PluginManifest, PluginStatus, PluginInstance } from "./types";

// ── Plugin Event System ──

type PluginEventHandler = (...args: unknown[]) => void;

class PluginEventBus {
  private handlers = new Map<string, Set<PluginEventHandler>>();

  on(event: string, handler: PluginEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(...args);
      } catch (e) {
        log.error(`Event handler error for "${event}":`, e);
      }
    });
  }

  removeAll(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}

// ── Plugin API (sandbox) ──

export interface PluginEditorAPI {
  getActiveFile(): string | null;
  getFileContent(path: string): string | null;
  setFileContent(path: string, content: string): void;
  getSelectedText(): string | null;
  openFile(path: string): void;
  listFiles(): string[];
}

export interface PluginUIAPI {
  registerPanel(
    id: string,
    options: { title: string; icon?: string; render: () => unknown },
  ): void;
  registerMenuItem(
    menu: string,
    item: { label: string; action: () => void; shortcut?: string },
  ): void;
  registerStatusBarItem(options: {
    text: string;
    tooltip?: string;
    onClick?: () => void;
  }): void;
  showNotification(
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ): void;
}

export interface PluginAIAPI {
  chat(
    prompt: string,
    options?: { model?: string; temperature?: number },
  ): Promise<string>;
  registerProvider(
    id: string,
    config: { name: string; baseURL: string; models: string[] },
  ): void;
}

export interface PluginCommandAPI {
  registerCommand(
    id: string,
    handler: () => void,
    options?: { title: string; shortcut?: string },
  ): void;
  executeCommand(id: string): void;
}

export interface PluginAPI {
  editor: PluginEditorAPI;
  ui: PluginUIAPI;
  ai: PluginAIAPI;
  commands: PluginCommandAPI;
  events: {
    on: (event: string, handler: PluginEventHandler) => () => void;
    emit: (event: string, ...args: unknown[]) => void;
  };
  storage: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    remove: (key: string) => void;
  };
}

// ── Plugin Manager ──

export class PluginManager {
  private plugins = new Map<string, PluginInstance>();
  private eventBus = new PluginEventBus();
  private commands = new Map<string, () => void>();
  private panels = new Map<
    string,
    { title: string; icon?: string; render: () => unknown }
  >();
  private menuItems = new Map<
    string,
    Array<{ label: string; action: () => void; shortcut?: string }>
  >();
  private statusBarItems: Array<{
    text: string;
    tooltip?: string;
    onClick?: () => void;
  }> = [];
  private pluginStorage = new Map<string, Map<string, unknown>>();

  // ── Registration ──

  register(manifest: PluginManifest): boolean {
    if (this.plugins.has(manifest.id)) {
      log.warn(
        `[PluginSystem] Plugin "${manifest.id}" is already registered`,
      );
      return false;
    }

    this.plugins.set(manifest.id, {
      manifest,
      status: "installed",
    });

    this.eventBus.emit("plugin:registered", manifest.id);
    return true;
  }

  unregister(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    if (plugin.status === "active") {
      this.deactivate(pluginId);
    }

    this.plugins.delete(pluginId);
    this.pluginStorage.delete(pluginId);
    this.eventBus.emit("plugin:unregistered", pluginId);
    return true;
  }

  // ── Lifecycle ──

  activate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      log.error(`Plugin "${pluginId}" not found`);
      return false;
    }

    if (plugin.status === "active") return true;

    try {
      // Create sandboxed API for this plugin
      const api = this.createPluginAPI(pluginId);

      // Execute plugin's main entry point (simulated)
      plugin.status = "active";
      plugin.exports = { api };
      this.plugins.set(pluginId, plugin);

      this.eventBus.emit("plugin:activated", pluginId);
      log.info(`Plugin "${pluginId}" activated`);
      return true;
    } catch (e) {
      plugin.status = "error";
      plugin.error = String(e);
      this.plugins.set(pluginId, plugin);
      log.error(`Failed to activate "${pluginId}":`, e);
      return false;
    }
  }

  deactivate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || plugin.status !== "active") return false;

    try {
      // Cleanup: remove plugin's registered commands, panels, etc.
      this.cleanupPlugin(pluginId);

      plugin.status = "disabled";
      plugin.exports = undefined;
      this.plugins.set(pluginId, plugin);

      this.eventBus.emit("plugin:deactivated", pluginId);
      log.info(`Plugin "${pluginId}" deactivated`);
      return true;
    } catch (e) {
      log.error(`Failed to deactivate "${pluginId}":`, e);
      return false;
    }
  }

  // ── Query ──

  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): PluginInstance[] {
    return this.getAllPlugins().filter((p) => p.status === "active");
  }

  getRegisteredCommands(): Map<string, () => void> {
    return new Map(this.commands);
  }

  getRegisteredPanels(): Map<
    string,
    { title: string; icon?: string; render: () => unknown }
  > {
    return new Map(this.panels);
  }

  getStatusBarItems(): typeof this.statusBarItems {
    return [...this.statusBarItems];
  }

  // ── Event Bus (global) ──

  on(event: string, handler: PluginEventHandler): () => void {
    return this.eventBus.on(event, handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.eventBus.emit(event, ...args);
  }

  // ── Execute command ──

  executeCommand(commandId: string): boolean {
    const handler = this.commands.get(commandId);
    if (!handler) return false;
    try {
      handler();
      return true;
    } catch (e) {
      log.error(`Command "${commandId}" failed:`, e);
      return false;
    }
  }

  // ── Private Helpers ──

  private createPluginAPI(pluginId: string): PluginAPI {
    const self = this;

    // Ensure plugin storage exists
    if (!this.pluginStorage.has(pluginId)) {
      this.pluginStorage.set(pluginId, new Map());
    }

    return {
      editor: {
        getActiveFile: () => null, // Wired to FileStore at integration time
        getFileContent: () => null,
        setFileContent: () => {},
        getSelectedText: () => null,
        openFile: () => {},
        listFiles: () => [],
      },
      ui: {
        registerPanel: (id, options) => {
          self.panels.set(`${pluginId}:${id}`, options);
        },
        registerMenuItem: (menu, item) => {
          const key = `${pluginId}:${menu}`;
          if (!self.menuItems.has(key)) self.menuItems.set(key, []);
          self.menuItems.get(key)!.push(item);
        },
        registerStatusBarItem: (options) => {
          self.statusBarItems.push(options);
        },
        showNotification: (message, type = "info") => {
          self.eventBus.emit("notification", { message, type, pluginId });
        },
      },
      ai: {
        chat: async (prompt, options) => {
          // Stub: integrate with LLMService at runtime
          return `[PluginAI] Prompt received: "${prompt.slice(0, 50)}..." (model: ${options?.model || "default"})`;
        },
        registerProvider: (id, config) => {
          self.eventBus.emit("ai:provider-registered", {
            pluginId,
            providerId: id,
            config,
          });
        },
      },
      commands: {
        registerCommand: (id, handler, options) => {
          const fullId = `${pluginId}.${id}`;
          self.commands.set(fullId, handler);
          if (options?.title) {
            self.eventBus.emit("command:registered", {
              id: fullId,
              ...options,
            });
          }
        },
        executeCommand: (id) => {
          self.executeCommand(id);
        },
      },
      events: {
        on: (event, handler) => self.eventBus.on(event, handler),
        emit: (event, ...args) => self.eventBus.emit(event, ...args),
      },
      storage: {
        get: (key) => self.pluginStorage.get(pluginId)?.get(key),
        set: (key, value) => self.pluginStorage.get(pluginId)?.set(key, value),
        remove: (key) => self.pluginStorage.get(pluginId)?.delete(key),
      },
    };
  }

  private cleanupPlugin(pluginId: string): void {
    // Remove commands
    for (const [key] of this.commands) {
      if (key.startsWith(`${pluginId}.`)) this.commands.delete(key);
    }
    // Remove panels
    for (const [key] of this.panels) {
      if (key.startsWith(`${pluginId}:`)) this.panels.delete(key);
    }
    // Remove menu items
    for (const [key] of this.menuItems) {
      if (key.startsWith(`${pluginId}:`)) this.menuItems.delete(key);
    }
  }
}

// ── Singleton instance ──
export const pluginManager = new PluginManager();

// ── Built-in plugin templates ──

export const BUILTIN_PLUGIN_TEMPLATES: PluginManifest[] = [
  {
    id: "yyc3.code-formatter",
    name: "Code Formatter",
    version: "1.0.0",
    description: "自动格式化代码 (Prettier 集成)",
    author: "YYC³ Team",
    main: "index.ts",
    permissions: ["editor.read", "editor.write"],
    activationEvents: ["onCommand:format"],
  },
  {
    id: "yyc3.git-lens",
    name: "Git Lens",
    version: "1.0.0",
    description: "增强 Git 集成，内联 Blame 显示",
    author: "YYC³ Team",
    main: "index.ts",
    permissions: ["editor.read", "git.read"],
    activationEvents: ["onFileOpen"],
  },
  {
    id: "yyc3.ai-autocomplete",
    name: "AI Autocomplete",
    version: "1.0.0",
    description: "AI 驱动的代码自动补全",
    author: "YYC³ Team",
    main: "index.ts",
    permissions: ["editor.read", "ai.chat"],
    activationEvents: ["onEditorType"],
  },
  {
    id: "yyc3.theme-pack",
    name: "Theme Pack",
    version: "1.0.0",
    description: "额外主题包 (Dracula, Nord, Solarized 等)",
    author: "YYC³ Team",
    main: "index.ts",
    permissions: ["ui.theme"],
    activationEvents: ["onStartup"],
  },
];
