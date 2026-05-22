/**
 * @file AgentMarket.tsx
 * @description Agent 市场面板，展示可用的 AI Agent 模板，支持搜索、
 *              分类筛选、下载安装、评分排序
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags agent,market,templates,ai,plugins
 */

import { useState } from "react";
import {
  Store,
  Search,
  Star,
  Download,
  Bot,
  Zap,
  Shield,
  Globe,
  Code2,
  Database,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  stars: number;
  downloads: number;
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  installed: boolean;
}

interface PluginItem {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
}

const CATEGORIES = [
  "全部",
  "编程助手",
  "数据分析",
  "安全审计",
  "知识管理",
  "DevOps",
  "自定义",
];

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "a1",
    name: "智能编程助手",
    description: "多语言代码生成、审查、重构和优化，支持上下文感知",
    category: "编程助手",
    author: "YYC³ Official",
    stars: 4823,
    downloads: 12480,
    tags: ["代码生成", "审查", "多语言"],
    icon: Code2,
    color: "bg-gradient-to-br from-sky-600 to-blue-600",
    installed: true,
  },
  {
    id: "a2",
    name: "数据分析 Agent",
    description: "自动化数据清洗、统计分析、可视化报表生成",
    category: "数据分析",
    author: "DataTeam",
    stars: 3156,
    downloads: 8920,
    tags: ["数据分析", "可视化", "报表"],
    icon: BarChart3,
    color: "bg-gradient-to-br from-emerald-600 to-teal-600",
    installed: false,
  },
  {
    id: "a3",
    name: "安全扫描 Agent",
    description: "代码漏洞检测、依赖安全审计、合规性检查",
    category: "安全审计",
    author: "SecLab",
    stars: 2789,
    downloads: 6540,
    tags: ["安全", "漏洞检测", "合规"],
    icon: Shield,
    color: "bg-gradient-to-br from-red-600 to-rose-600",
    installed: false,
  },
  {
    id: "a4",
    name: "知识库问答 Agent",
    description: "基于 RAG 的企业知识库问答，支持多文档源",
    category: "知识管理",
    author: "YYC³ Official",
    stars: 4102,
    downloads: 11200,
    tags: ["RAG", "知识库", "问答"],
    icon: Database,
    color: "bg-gradient-to-br from-purple-600 to-violet-600",
    installed: true,
  },
  {
    id: "a5",
    name: "API 对接 Agent",
    description: "自动生成 API 集成代码，支持 REST/GraphQL/gRPC",
    category: "编程助手",
    author: "APIForge",
    stars: 1890,
    downloads: 4320,
    tags: ["API", "集成", "代码生成"],
    icon: Globe,
    color: "bg-gradient-to-br from-amber-600 to-orange-600",
    installed: false,
  },
  {
    id: "a6",
    name: "智能对话 Agent",
    description: "多轮对话管理、意图识别、情感分析",
    category: "自定义",
    author: "ChatLab",
    stars: 2456,
    downloads: 7800,
    tags: ["对话", "NLP", "情感分析"],
    icon: MessageSquare,
    color: "bg-gradient-to-br from-pink-600 to-fuchsia-600",
    installed: false,
  },
  {
    id: "a7",
    name: "运维自动化 Agent",
    description: "自动监控、故障诊断、资源调度和性能优化",
    category: "DevOps",
    author: "OpsTeam",
    stars: 3567,
    downloads: 9150,
    tags: ["运维", "监控", "自动化"],
    icon: Zap,
    color: "bg-gradient-to-br from-yellow-600 to-lime-600",
    installed: true,
  },
];

const PLUGINS: PluginItem[] = [
  {
    id: "p1",
    name: "代码格式化引擎",
    description: "多语言代码格式化支持",
    version: "2.1.0",
    author: "YYC³",
    enabled: true,
  },
  {
    id: "p2",
    name: "Git 增强工具",
    description: "Git 可视化和智能提交",
    version: "1.8.3",
    author: "GitPlus",
    enabled: true,
  },
  {
    id: "p3",
    name: "性能分析器",
    description: "实时性能监控和瓶颈分析",
    version: "3.0.1",
    author: "PerfLab",
    enabled: false,
  },
  {
    id: "p4",
    name: "国际化插件",
    description: "自动化多语言翻译和本地化",
    version: "1.2.0",
    author: "i18nKit",
    enabled: false,
  },
];

export default function AgentMarket({ nodeId }: { nodeId: string }) {
  const [activeTab, setActiveTab] = useState<"agents" | "plugins">("agents");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState(AGENT_TEMPLATES);
  const [plugins, setPlugins] = useState(PLUGINS);

  const filtered = agents.filter((a) => {
    const matchCategory =
      selectedCategory === "全部" || a.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      a.name.includes(searchQuery) ||
      a.description.includes(searchQuery) ||
      a.tags.some((t) => t.includes(searchQuery));
    return matchCategory && matchSearch;
  });

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="market"
        title="Agent 市场"
        icon={<Store className="w-3 h-3 text-amber-400/70" />}
      />

      {/* Tab switcher */}
      <div className="flex-shrink-0 flex border-b border-[var(--ide-border-dim)]">
        <button
          onClick={() => setActiveTab("agents")}
          className={`flex-1 py-1.5 text-[0.68rem] transition-colors ${activeTab === "agents" ? "text-sky-400 border-b border-sky-500" : "text-slate-600"}`}
        >
          <Bot className="w-3 h-3 inline mr-1" />
          Agent 模板
        </button>
        <button
          onClick={() => setActiveTab("plugins")}
          className={`flex-1 py-1.5 text-[0.68rem] transition-colors ${activeTab === "plugins" ? "text-sky-400 border-b border-sky-500" : "text-slate-600"}`}
        >
          <Zap className="w-3 h-3 inline mr-1" />
          插件市场
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-faint)]">
        <div className="flex items-center gap-1.5 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] rounded px-2 py-1">
          <Search className="w-3 h-3 text-slate-600" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="flex-1 bg-transparent border-0 outline-none text-[0.72rem] text-slate-300 placeholder:text-slate-700"
          />
        </div>
      </div>

      {activeTab === "agents" ? (
        <>
          {/* Categories */}
          <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 overflow-x-auto border-b border-[var(--ide-border-subtle)]">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`flex-shrink-0 px-2 py-0.5 rounded text-[0.62rem] transition-colors ${selectedCategory === c ? "bg-sky-600/30 text-sky-300" : "text-slate-600 hover:text-slate-400 hover:bg-white/5"}`}
              >
                {c}
              </button>
            ))}
          </div>
          {/* Agent grid */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filtered.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.id}
                  className="border border-[var(--ide-border-faint)] rounded-lg p-2.5 hover:border-[var(--ide-border-mid)] transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg ${agent.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.72rem] text-slate-300">
                          {agent.name}
                        </span>
                        {agent.installed && (
                          <span className="text-[0.5rem] bg-emerald-900/40 text-emerald-400 px-1 rounded">
                            已安装
                          </span>
                        )}
                      </div>
                      <p className="text-[0.62rem] text-slate-600 mt-0.5 line-clamp-2">
                        {agent.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[0.55rem] text-slate-600">
                          {agent.author}
                        </span>
                        <span className="flex items-center gap-0.5 text-[0.55rem] text-amber-500">
                          <Star className="w-2.5 h-2.5" />
                          {agent.stars.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-0.5 text-[0.55rem] text-slate-600">
                          <Download className="w-2.5 h-2.5" />
                          {agent.downloads.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {agent.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[0.5rem] text-slate-600 bg-[#1e3a5f]/20 px-1 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setAgents((prev) =>
                          prev.map((a) =>
                            a.id === agent.id
                              ? { ...a, installed: !a.installed }
                              : a,
                          ),
                        )
                      }
                      className={`flex-shrink-0 px-2 py-1 rounded text-[0.62rem] transition-colors ${agent.installed ? "bg-slate-800 text-slate-500 hover:bg-red-900/30 hover:text-red-400" : "bg-sky-600/30 text-sky-300 hover:bg-sky-600/50"}`}
                    >
                      {agent.installed ? "卸载" : "安装"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Plugins list */
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="flex items-center gap-2.5 border border-[var(--ide-border-faint)] rounded-lg p-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.72rem] text-slate-300">
                    {plugin.name}
                  </span>
                  <span className="text-[0.52rem] text-slate-600">
                    v{plugin.version}
                  </span>
                </div>
                <p className="text-[0.62rem] text-slate-600">
                  {plugin.description}
                </p>
                <span className="text-[0.55rem] text-slate-700">
                  {plugin.author}
                </span>
              </div>
              <button
                onClick={() =>
                  setPlugins((prev) =>
                    prev.map((p) =>
                      p.id === plugin.id ? { ...p, enabled: !p.enabled } : p,
                    ),
                  )
                }
                className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${plugin.enabled ? "bg-sky-600" : "bg-slate-700"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${plugin.enabled ? "translate-x-4.5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
