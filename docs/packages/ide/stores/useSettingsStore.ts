/**
 * @file stores/useSettingsStore.ts
 * @description 全局设置状态管理 Store，基于 Zustand + persist 中间件，
 *              覆盖账号、通用、智能体、MCP、模型、上下文、对话流、规则、技能等模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,zustand,persist,state-management
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Type Definitions ──

export type ThemeMode = "light" | "dark" | "auto";
export type LanguageCode = "zh-CN" | "en-US" | "ja-JP";
export type NotificationType = "banner" | "sound" | "menu";
export type SoundType = "complete" | "waiting" | "interrupt";
export type CodeReviewScope = "none" | "all" | "changed";
export type CommandRunMode = "sandbox" | "direct";
export type SkillScope = "global" | "project";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface GeneralSettings {
  theme: ThemeMode;
  language: LanguageCode;
  editorFont: string;
  editorFontSize: number;
  wordWrap: boolean;
  keybindingScheme: "vscode" | "custom";
  customKeybindings: Record<string, string>;
  localLinkOpenMode: "system" | "builtin";
  markdownOpenMode: "editor" | "preview";
  nodeVersion: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isBuiltIn: boolean;
  isCustom: boolean;
}

export interface MCPConfig {
  id: string;
  name: string;
  type: "market" | "manual";
  endpoint?: string;
  enabled: boolean;
  projectLevel: boolean;
}

export interface ModelConfig {
  id: string;
  provider: string;
  model: string;
  apiKey: string;
  enabled: boolean;
}

export interface DocumentSet {
  id: string;
  name: string;
  source: "url" | "local";
  url?: string;
  localPath?: string;
  enabled: boolean;
}

export interface ContextSettings {
  indexStatus: "idle" | "indexing" | "completed" | "error";
  ignoreRules: string[];
  documentSets: DocumentSet[];
}

export interface ConversationSettings {
  useTodoList: boolean;
  autoCollapseNodes: boolean;
  autoFixCodeIssues: boolean;
  agentProactiveQuestion: boolean;
  codeReviewScope: CodeReviewScope;
  jumpAfterReview: boolean;
  autoRunMCP: boolean;
  commandRunMode: CommandRunMode;
  whitelistCommands: string[];
  notificationTypes: NotificationType[];
  volume: number;
  soundConfig: Record<SoundType, string>;
}

export interface RuleConfig {
  id: string;
  name: string;
  content: string;
  scope: "personal" | "project";
  enabled: boolean;
}

export interface SkillConfig {
  id: string;
  name: string;
  description?: string;
  content: string;
  scope: SkillScope;
  enabled: boolean;
}

export interface ImportSettings {
  includeAgentsMD: boolean;
  includeClaudeMD: boolean;
}

export interface Settings {
  userProfile: UserProfile;
  general: GeneralSettings;
  agents: AgentConfig[];
  mcpConfigs: MCPConfig[];
  models: ModelConfig[];
  context: ContextSettings;
  conversation: ConversationSettings;
  rules: RuleConfig[];
  skills: SkillConfig[];
  importSettings: ImportSettings;
}

// ── Search Result ──

export interface SearchResult {
  path: string;
  title: string;
  description?: string;
  value: unknown;
  type: "setting" | "agent" | "mcp" | "model" | "rule" | "skill";
  section: string;
}

// ── Default Settings ──

const defaultSettings: Settings = {
  userProfile: {
    id: "local-user",
    username: "YYC3 Developer",
    email: "dev@yyc3.local",
  },
  general: {
    theme: "dark",
    language: "zh-CN",
    editorFont: "Monaco",
    editorFontSize: 14,
    wordWrap: true,
    keybindingScheme: "vscode",
    customKeybindings: {},
    localLinkOpenMode: "system",
    markdownOpenMode: "editor",
    nodeVersion: "18.0.0",
  },
  agents: [
    {
      id: "agent-code-assistant",
      name: "代码助手",
      description: "通用编程辅助智能体，支持多语言代码生成与优化",
      systemPrompt: "你是一位资深的全栈开发工程师...",
      model: "auto",
      temperature: 0.7,
      maxTokens: 4096,
      isBuiltIn: true,
      isCustom: false,
    },
    {
      id: "agent-code-reviewer",
      name: "代码审查员",
      description: "专注于代码质量审查，提供改进建议",
      systemPrompt: "你是一位代码审查专家...",
      model: "auto",
      temperature: 0.3,
      maxTokens: 2048,
      isBuiltIn: true,
      isCustom: false,
    },
  ],
  mcpConfigs: [
    {
      id: "mcp-filesystem",
      name: "文件系统",
      type: "market",
      endpoint: "mcp://filesystem",
      enabled: true,
      projectLevel: false,
    },
  ],
  models: [],
  context: {
    indexStatus: "idle",
    ignoreRules: ["node_modules", ".git", "dist", ".next"],
    documentSets: [],
  },
  conversation: {
    useTodoList: true,
    autoCollapseNodes: false,
    autoFixCodeIssues: true,
    agentProactiveQuestion: true,
    codeReviewScope: "all",
    jumpAfterReview: true,
    autoRunMCP: false,
    commandRunMode: "sandbox",
    whitelistCommands: ["ls", "cat", "echo", "pwd"],
    notificationTypes: ["banner", "sound"],
    volume: 80,
    soundConfig: {
      complete: "default",
      waiting: "default",
      interrupt: "default",
    },
  },
  rules: [
    {
      id: "rule-code-style",
      name: "代码风格规范",
      content:
        "遵循 ESLint + Prettier 配置，使用 2 空格缩进，单引号，不使用分号",
      scope: "project",
      enabled: true,
    },
  ],
  skills: [
    {
      id: "skill-react-component",
      name: "React 组件生成",
      description: "快速生成符合项目规范的 React TypeScript 组件",
      content: "生成包含 props 接口、JSDoc 注释、导出的 React 函数组件",
      scope: "global",
      enabled: true,
    },
  ],
  importSettings: {
    includeAgentsMD: false,
    includeClaudeMD: false,
  },
};

// ── Store Interface ──

interface SettingsState {
  settings: Settings;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

interface SettingsActions {
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  addAgent: (agent: AgentConfig) => void;
  updateAgent: (id: string, agent: Partial<AgentConfig>) => void;
  removeAgent: (id: string) => void;
  addMCP: (mcp: MCPConfig) => void;
  updateMCP: (id: string, mcp: Partial<MCPConfig>) => void;
  removeMCP: (id: string) => void;
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, model: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  updateContextSettings: (settings: Partial<ContextSettings>) => void;
  updateConversationSettings: (settings: Partial<ConversationSettings>) => void;
  addRule: (rule: RuleConfig) => void;
  updateRule: (id: string, rule: Partial<RuleConfig>) => void;
  removeRule: (id: string) => void;
  addSkill: (skill: SkillConfig) => void;
  updateSkill: (id: string, skill: Partial<SkillConfig>) => void;
  removeSkill: (id: string) => void;
  updateImportSettings: (settings: Partial<ImportSettings>) => void;
  setSearchQuery: (query: string) => void;
  importConfig: (config: Partial<Settings>) => void;
  exportConfig: () => Settings;
  resetSettings: () => void;
  searchSettings: (query: string) => SearchResult[];
}

// ── Create Store ──

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      searchQuery: "",
      loading: false,
      error: null,

      updateUserProfile: (profile) => {
        set((state) => ({
          settings: {
            ...state.settings,
            userProfile: { ...state.settings.userProfile, ...profile },
          },
        }));
      },

      updateGeneralSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            general: { ...state.settings.general, ...newSettings },
          },
        }));
      },

      addAgent: (agent) => {
        set((state) => ({
          settings: {
            ...state.settings,
            agents: [...state.settings.agents, agent],
          },
        }));
      },

      updateAgent: (id, agent) => {
        set((state) => ({
          settings: {
            ...state.settings,
            agents: state.settings.agents.map((a) =>
              a.id === id ? { ...a, ...agent } : a,
            ),
          },
        }));
      },

      removeAgent: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            agents: state.settings.agents.filter((a) => a.id !== id),
          },
        }));
      },

      addMCP: (mcp) => {
        set((state) => ({
          settings: {
            ...state.settings,
            mcpConfigs: [...state.settings.mcpConfigs, mcp],
          },
        }));
      },

      updateMCP: (id, mcp) => {
        set((state) => ({
          settings: {
            ...state.settings,
            mcpConfigs: state.settings.mcpConfigs.map((m) =>
              m.id === id ? { ...m, ...mcp } : m,
            ),
          },
        }));
      },

      removeMCP: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            mcpConfigs: state.settings.mcpConfigs.filter((m) => m.id !== id),
          },
        }));
      },

      addModel: (model) => {
        set((state) => ({
          settings: {
            ...state.settings,
            models: [...state.settings.models, model],
          },
        }));
      },

      updateModel: (id, model) => {
        set((state) => ({
          settings: {
            ...state.settings,
            models: state.settings.models.map((m) =>
              m.id === id ? { ...m, ...model } : m,
            ),
          },
        }));
      },

      removeModel: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            models: state.settings.models.filter((m) => m.id !== id),
          },
        }));
      },

      updateContextSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            context: { ...state.settings.context, ...newSettings },
          },
        }));
      },

      updateConversationSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            conversation: { ...state.settings.conversation, ...newSettings },
          },
        }));
      },

      addRule: (rule) => {
        set((state) => ({
          settings: {
            ...state.settings,
            rules: [...state.settings.rules, rule],
          },
        }));
      },

      updateRule: (id, rule) => {
        set((state) => ({
          settings: {
            ...state.settings,
            rules: state.settings.rules.map((r) =>
              r.id === id ? { ...r, ...rule } : r,
            ),
          },
        }));
      },

      removeRule: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            rules: state.settings.rules.filter((r) => r.id !== id),
          },
        }));
      },

      addSkill: (skill) => {
        set((state) => ({
          settings: {
            ...state.settings,
            skills: [...state.settings.skills, skill],
          },
        }));
      },

      updateSkill: (id, skill) => {
        set((state) => ({
          settings: {
            ...state.settings,
            skills: state.settings.skills.map((s) =>
              s.id === id ? { ...s, ...skill } : s,
            ),
          },
        }));
      },

      removeSkill: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            skills: state.settings.skills.filter((s) => s.id !== id),
          },
        }));
      },

      updateImportSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            importSettings: {
              ...state.settings.importSettings,
              ...newSettings,
            },
          },
        }));
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      importConfig: (config) => {
        set({ settings: { ...defaultSettings, ...config } });
      },

      exportConfig: () => {
        return get().settings;
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      searchSettings: (query: string): SearchResult[] => {
        if (!query.trim()) return [];
        const s = get().settings;
        const results: SearchResult[] = [];
        const q = query.toLowerCase();

        // ── General settings (deep field match) ──
        const generalFields: Array<{
          path: string;
          title: string;
          aliases: string[];
        }> = [
          {
            path: "general.theme",
            title: "主题",
            aliases: ["theme", "外观", "暗色", "亮色", "dark", "light"],
          },
          {
            path: "general.language",
            title: "语言",
            aliases: ["language", "界面语言", "多语言", "i18n"],
          },
          {
            path: "general.editorFont",
            title: "编辑器字体",
            aliases: ["font", "字体", "monaco", "fira"],
          },
          {
            path: "general.editorFontSize",
            title: "编辑器字体大小",
            aliases: ["fontsize", "字号", "字体大小"],
          },
          {
            path: "general.wordWrap",
            title: "自动换行",
            aliases: ["wordwrap", "换行", "折行"],
          },
          {
            path: "general.keybindingScheme",
            title: "快捷键方案",
            aliases: ["keybinding", "快捷键", "shortcut", "vscode"],
          },
          {
            path: "general.localLinkOpenMode",
            title: "本地链接打开方式",
            aliases: ["link", "链接"],
          },
          {
            path: "general.markdownOpenMode",
            title: "Markdown 打开方式",
            aliases: ["markdown", "md", "预览"],
          },
          {
            path: "general.nodeVersion",
            title: "Node.js 版本",
            aliases: ["node", "nodejs", "版本"],
          },
        ];
        for (const field of generalFields) {
          if (
            field.title.toLowerCase().includes(q) ||
            field.path.includes(q) ||
            field.aliases.some((a) => a.includes(q))
          ) {
            results.push({
              path: field.path,
              title: field.title,
              type: "setting",
              section: "general",
              value: null,
            });
          }
        }

        // ── Agents (deep field match: name, description, model, temperature, maxTokens) ──
        const agentFieldAliases: Record<string, string[]> = {
          temperature: ["温度", "temperature", "随机性", "创造性"],
          maxTokens: ["最大token", "max tokens", "token数", "令牌"],
          systemPrompt: ["系统提示词", "system prompt", "提示词", "prompt"],
          model: ["模型", "model", "大模型"],
        };
        for (const agent of s.agents) {
          const matchesName = agent.name.toLowerCase().includes(q);
          const matchesDesc = agent.description?.toLowerCase().includes(q);
          // Deep field: match agent sub-fields by alias
          const matchesField = Object.entries(agentFieldAliases).some(
            ([, aliases]) => aliases.some((a) => a.toLowerCase().includes(q)),
          );
          if (matchesName || matchesDesc || matchesField) {
            results.push({
              path: `agents.${agent.id}`,
              title: agent.name,
              description: agent.description,
              type: "agent",
              section: "agents",
              value: agent,
            });
          }
        }

        // ── MCP (deep: name, endpoint, type) ──
        for (const mcp of s.mcpConfigs) {
          if (
            mcp.name.toLowerCase().includes(q) ||
            mcp.endpoint?.toLowerCase().includes(q) ||
            mcp.type.includes(q)
          ) {
            results.push({
              path: `mcp.${mcp.id}`,
              title: mcp.name,
              type: "mcp",
              section: "mcp",
              value: mcp,
            });
          }
        }

        // ── Models (deep: provider, model, apiKey masked) ──
        for (const model of s.models) {
          if (
            model.provider.toLowerCase().includes(q) ||
            model.model.toLowerCase().includes(q)
          ) {
            results.push({
              path: `models.${model.id}`,
              title: `${model.provider} - ${model.model}`,
              type: "model",
              section: "models",
              value: model,
            });
          }
        }

        // ── Conversation (deep field match with aliases) ──
        const convFields: Array<{
          path: string;
          title: string;
          aliases: string[];
        }> = [
          {
            path: "conversation.useTodoList",
            title: "待办清单",
            aliases: ["todo", "清单", "任务"],
          },
          {
            path: "conversation.autoCollapseNodes",
            title: "自动折叠对话",
            aliases: ["折叠", "收起", "collapse"],
          },
          {
            path: "conversation.autoFixCodeIssues",
            title: "自动修复代码",
            aliases: ["修复", "fix", "代码规范", "lint"],
          },
          {
            path: "conversation.agentProactiveQuestion",
            title: "智能体主动提问",
            aliases: ["提问", "主动", "proactive"],
          },
          {
            path: "conversation.codeReviewScope",
            title: "代码审查",
            aliases: ["审查", "review", "检查"],
          },
          {
            path: "conversation.jumpAfterReview",
            title: "审查后跳转",
            aliases: ["跳转", "jump"],
          },
          {
            path: "conversation.autoRunMCP",
            title: "自动运行 MCP",
            aliases: ["自动mcp", "auto mcp", "自动工具"],
          },
          {
            path: "conversation.commandRunMode",
            title: "命令运行方式",
            aliases: ["命令", "command", "沙箱", "sandbox", "终端"],
          },
          {
            path: "conversation.volume",
            title: "提示音量",
            aliases: ["音量", "volume", "声音"],
          },
          {
            path: "conversation.notificationTypes",
            title: "通知方式",
            aliases: ["通知", "notification", "提醒"],
          },
        ];
        for (const field of convFields) {
          if (
            field.title.toLowerCase().includes(q) ||
            field.aliases.some((a) => a.includes(q))
          ) {
            results.push({
              path: field.path,
              title: field.title,
              type: "setting",
              section: "conversation",
              value: null,
            });
          }
        }

        // ── Context (deep: indexStatus, ignoreRules, documentSets) ──
        const ctxAliases = [
          "索引",
          "代码索引",
          "index",
          "忽略",
          "ignore",
          "文档集",
          "document",
        ];
        if (ctxAliases.some((a) => a.includes(q))) {
          results.push({
            path: "context",
            title: "上下文管理",
            type: "setting",
            section: "context",
            value: null,
          });
        }
        for (const doc of s.context.documentSets) {
          if (doc.name.toLowerCase().includes(q)) {
            results.push({
              path: `context.docs.${doc.id}`,
              title: doc.name,
              type: "setting",
              section: "context",
              value: doc,
            });
          }
        }

        // ── Rules (deep: name + content) ──
        for (const rule of s.rules) {
          if (
            rule.name.toLowerCase().includes(q) ||
            rule.content.toLowerCase().includes(q)
          ) {
            results.push({
              path: `rules.${rule.id}`,
              title: rule.name,
              type: "rule",
              section: "rules",
              value: rule,
            });
          }
        }

        // ── Skills (deep: name + description + content) ──
        for (const skill of s.skills) {
          if (
            skill.name.toLowerCase().includes(q) ||
            skill.description?.toLowerCase().includes(q) ||
            skill.content.toLowerCase().includes(q)
          ) {
            results.push({
              path: `skills.${skill.id}`,
              title: skill.name,
              description: skill.description,
              type: "skill",
              section: "skills",
              value: skill,
            });
          }
        }

        return results;
      },
    }),
    {
      name: "yyc3-settings-storage",
      partialize: (state) => ({
        settings: state.settings,
      }),
    },
  ),
);
