/**
 * @file constants/providers.ts
 * @description 服务商元数据共享常量，由 ModelSettings 和 SettingsPage 共同引用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags constants,providers,metadata
 */

// ================================================================
// Provider Definitions — 服务商元数据 (共享常量)
// ================================================================
//
// 由 ModelSettings.tsx 和 SettingsPage.tsx 共同引用，
// 避免重复定义导致的同步漂移。
// ================================================================

import { Cloud, Shield, Cpu, Globe, Zap, Server } from "lucide-react";

/** 模型定义 */
export interface ModelDef {
  id: string;
  name: string;
  description: string;
  contextWindow?: string;
  pricing?: string;
}

/** 服务商定义 */
export interface ProviderDef {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  colorBg: string;
  colorBorder: string;
  description: string;
  baseURL: string;
  apiKeyUrl: string;
  apiKeyPlaceholder: string;
  models: ModelDef[];
  openaiCompatible: boolean;
  docsUrl: string;
}

/** 内置服务商列表 */
export const BUILTIN_PROVIDERS: ProviderDef[] = [
  {
    id: "openai",
    name: "OpenAI",
    shortName: "GPT",
    icon: Cloud,
    color: "text-emerald-400",
    colorBg: "bg-emerald-500/10",
    colorBorder: "border-emerald-500/20",
    description: "GPT-4o / o3 / o4-mini",
    baseURL: "https://api.openai.com/v1/chat/completions",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    apiKeyPlaceholder: "sk-proj-...",
    openaiCompatible: true,
    docsUrl: "https://platform.openai.com/docs",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "旗舰多模态模型",
        contextWindow: "128K",
        pricing: "$2.5/1M input",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o-mini",
        description: "高性价比推理模型",
        contextWindow: "128K",
        pricing: "$0.15/1M input",
      },
      {
        id: "o3-mini",
        name: "o3-mini",
        description: "推理增强模型",
        contextWindow: "128K",
        pricing: "$1.1/1M input",
      },
      {
        id: "o4-mini",
        name: "o4-mini",
        description: "最新推理模型",
        contextWindow: "200K",
        pricing: "$1.1/1M input",
      },
    ],
  },
  {
    id: "claude",
    name: "Anthropic",
    shortName: "Claude",
    icon: Shield,
    color: "text-orange-400",
    colorBg: "bg-orange-500/10",
    colorBorder: "border-orange-500/20",
    description: "Claude Sonnet / Haiku",
    baseURL: "https://api.anthropic.com/v1/messages",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    apiKeyPlaceholder: "sk-ant-...",
    openaiCompatible: false,
    docsUrl: "https://docs.anthropic.com",
    models: [
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        description: "最新旗舰模型",
        contextWindow: "200K",
        pricing: "$3/1M input",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        description: "快速高效模型",
        contextWindow: "200K",
        pricing: "$0.8/1M input",
      },
    ],
  },
  {
    id: "zhipu",
    name: "智谱 AI",
    shortName: "GLM",
    icon: Cpu,
    color: "text-blue-400",
    colorBg: "bg-blue-500/10",
    colorBorder: "border-blue-500/20",
    description: "GLM-5 / GLM-4 系列",
    baseURL: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    apiKeyPlaceholder: "输入智谱 API Key...",
    openaiCompatible: true,
    docsUrl: "https://open.bigmodel.cn/dev/api/normal-model/glm-4",
    models: [
      {
        id: "glm-5",
        name: "GLM-5",
        description: "最新旗舰推理模型",
        contextWindow: "128K",
      },
      { id: "glm-4.7", name: "GLM-4.7", description: "高性能通用模型" },
      { id: "glm-4.6", name: "GLM-4.6", description: "均衡型通用模型" },
      {
        id: "glm-4.5",
        name: "GLM-4.5",
        description: "高质量对话模型",
        contextWindow: "128K",
      },
      { id: "glm-4.5-air", name: "GLM-4.5-Air", description: "轻量高速模型" },
    ],
  },
  {
    id: "qwen",
    name: "通义千问 (阿里云)",
    shortName: "QWEN",
    icon: Globe,
    color: "text-purple-400",
    colorBg: "bg-purple-500/10",
    colorBorder: "border-purple-500/20",
    description: "DashScope OpenAI 兼容",
    baseURL:
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiKeyUrl: "https://dashscope.console.aliyun.com/apiKey",
    apiKeyPlaceholder: "sk-...",
    openaiCompatible: true,
    docsUrl:
      "https://help.aliyun.com/zh/model-studio/getting-started/first-api-call-to-qwen",
    models: [
      {
        id: "qwen3-max",
        name: "Qwen3-Max",
        description: "旗舰思考模型",
        contextWindow: "128K",
      },
      {
        id: "qwen-plus",
        name: "Qwen-Plus",
        description: "效果/速度均衡",
        contextWindow: "128K",
      },
      {
        id: "qwen3-coder-plus",
        name: "Qwen3-Coder-Plus",
        description: "代码专精模型",
        contextWindow: "128K",
      },
      {
        id: "qwen-vl-max",
        name: "Qwen-VL-Max",
        description: "多模态视觉模型",
        contextWindow: "32K",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    shortName: "DS",
    icon: Zap,
    color: "text-cyan-400",
    colorBg: "bg-cyan-500/10",
    colorBorder: "border-cyan-500/20",
    description: "DeepSeek V3.2 / R1",
    baseURL: "https://api.deepseek.com/v1/chat/completions",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    apiKeyPlaceholder: "sk-...",
    openaiCompatible: true,
    docsUrl: "https://api-docs.deepseek.com",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek V3.2",
        description: "最新旗舰对话模型",
        contextWindow: "128K",
        pricing: "$0.27/1M input",
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek R1",
        description: "推理增强模型",
        contextWindow: "128K",
        pricing: "$0.55/1M input",
      },
    ],
  },
  {
    id: "ollama",
    name: "Ollama (本地)",
    shortName: "Local",
    icon: Server,
    color: "text-amber-400",
    colorBg: "bg-amber-500/10",
    colorBorder: "border-amber-500/20",
    description: "本地部署 · 私有数据",
    baseURL: "http://localhost:11434/api/chat",
    apiKeyUrl: "",
    apiKeyPlaceholder: "",
    openaiCompatible: false,
    docsUrl: "https://ollama.com",
    models: [
      {
        id: "llama3.1:8b",
        name: "Llama 3.1 8B",
        description: "Meta 开源通用模型",
      },
      {
        id: "codellama:13b",
        name: "CodeLlama 13B",
        description: "代码专精模型",
      },
      { id: "qwen2.5:7b", name: "Qwen 2.5 7B", description: "通义千问本地版" },
      {
        id: "deepseek-coder:6.7b",
        name: "DeepSeek Coder 6.7B",
        description: "代码生成模型",
      },
    ],
  },
];
