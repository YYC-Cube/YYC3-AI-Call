/**
 * @file AgentOrchestrator.tsx
 * @description Agent 编排面板，支持可视化编排多 Agent 工作流，
 *              包括节点连接、条件分支、并行执行、调试运行
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags agent,orchestrator,workflow,visual-programming
 */

import { useState, useCallback } from "react";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Bot,
  Database,
  Globe,
  FileSearch,
  Sparkles,
  Settings,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import { useModelRegistry } from "./ModelRegistry";

interface AgentNode {
  id: string;
  type: "input" | "llm" | "tool" | "condition" | "output" | "rag" | "code";
  label: string;
  modelId?: string;
  config: Record<string, string>;
  x: number;
  y: number;
  status: "idle" | "running" | "success" | "error";
}

interface AgentEdge {
  from: string;
  to: string;
  label?: string;
}

interface AgentWorkflow {
  id: string;
  name: string;
  nodes: AgentNode[];
  edges: AgentEdge[];
  status: "draft" | "running" | "paused" | "completed";
}

const NODE_TYPES = [
  { type: "input", label: "输入节点", icon: Globe, color: "text-emerald-400" },
  { type: "llm", label: "LLM 推理", icon: Bot, color: "text-sky-400" },
  { type: "tool", label: "工具调用", icon: Settings, color: "text-amber-400" },
  {
    type: "rag",
    label: "RAG 检索",
    icon: FileSearch,
    color: "text-purple-400",
  },
  {
    type: "condition",
    label: "条件分支",
    icon: ArrowRight,
    color: "text-orange-400",
  },
  { type: "code", label: "代码执行", icon: Sparkles, color: "text-pink-400" },
  { type: "output", label: "输出节点", icon: Database, color: "text-cyan-400" },
];

const INITIAL_WORKFLOW: AgentWorkflow = {
  id: "wf_001",
  name: "智能客服 Agent",
  status: "draft",
  nodes: [
    {
      id: "n1",
      type: "input",
      label: "用户输入",
      config: {},
      x: 50,
      y: 50,
      status: "idle",
    },
    {
      id: "n2",
      type: "rag",
      label: "知识库检索",
      config: { topK: "5" },
      x: 250,
      y: 50,
      status: "idle",
    },
    {
      id: "n3",
      type: "llm",
      label: "意图识别",
      modelId: "m1",
      config: { temperature: "0.3" },
      x: 450,
      y: 50,
      status: "idle",
    },
    {
      id: "n4",
      type: "condition",
      label: "路由分发",
      config: {},
      x: 250,
      y: 170,
      status: "idle",
    },
    {
      id: "n5",
      type: "llm",
      label: "回答生成",
      modelId: "m1",
      config: { temperature: "0.7" },
      x: 450,
      y: 170,
      status: "idle",
    },
    {
      id: "n6",
      type: "output",
      label: "响应输出",
      config: {},
      x: 350,
      y: 280,
      status: "idle",
    },
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
    { from: "n3", to: "n4" },
    { from: "n4", to: "n5", label: "需要回答" },
    { from: "n5", to: "n6" },
  ],
};

export default function AgentOrchestrator({ nodeId }: { nodeId: string }) {
  const [workflow, setWorkflow] = useState<AgentWorkflow>(INITIAL_WORKFLOW);
  const { models } = useModelRegistry();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodePalette, setShowNodePalette] = useState(false);

  const getNodeIcon = (type: string) => {
    const nt = NODE_TYPES.find((n) => n.type === type);
    return nt ? nt : NODE_TYPES[0];
  };

  const handleRun = useCallback(() => {
    setWorkflow((prev) => {
      const next = { ...prev, status: "running" as const };
      let delay = 0;
      next.nodes = prev.nodes.map((n, i) => {
        delay += 600;
        setTimeout(() => {
          setWorkflow((w) => ({
            ...w,
            nodes: w.nodes.map((nn) =>
              nn.id === n.id ? { ...nn, status: "running" as const } : nn,
            ),
          }));
          setTimeout(() => {
            setWorkflow((w) => ({
              ...w,
              nodes: w.nodes.map((nn) =>
                nn.id === n.id ? { ...nn, status: "success" as const } : nn,
              ),
              ...(i === prev.nodes.length - 1
                ? { status: "completed" as const }
                : {}),
            }));
          }, 500);
        }, delay);
        return n;
      });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setWorkflow((prev) => ({
      ...prev,
      status: "draft",
      nodes: prev.nodes.map((n) => ({ ...n, status: "idle" as const })),
    }));
  }, []);

  const addNode = useCallback((type: string) => {
    const nt = NODE_TYPES.find((n) => n.type === type);
    if (!nt) return;
    const newNode: AgentNode = {
      id: `n_${Date.now()}`,
      type: type as AgentNode["type"],
      label: nt.label,
      config: {},
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      status: "idle",
    };
    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setShowNodePalette(false);
  }, []);

  const selected = workflow.nodes.find((n) => n.id === selectedNode);

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="agents"
        title="Agent 编排"
        icon={<Workflow className="w-3 h-3 text-violet-400/70" />}
      >
        <div className="flex items-center gap-0.5 ml-2">
          <button
            onClick={() => setShowNodePalette(!showNodePalette)}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="添加节点"
          >
            <Plus className="w-3 h-3 text-slate-600" />
          </button>
          <button
            onClick={workflow.status === "running" ? handleReset : handleRun}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title={workflow.status === "running" ? "停止" : "运行"}
          >
            {workflow.status === "running" ? (
              <Pause className="w-3 h-3 text-amber-400" />
            ) : (
              <Play className="w-3 h-3 text-emerald-400" />
            )}
          </button>
        </div>
      </PanelHeader>

      {/* Workflow info */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-[var(--ide-border-dim)] flex items-center gap-2">
        <span className="text-[0.72rem] text-slate-300">{workflow.name}</span>
        <div className="flex-1" />
        <span
          className={`text-[0.58rem] px-1.5 py-0.5 rounded ${
            workflow.status === "running"
              ? "bg-sky-900/40 text-sky-400"
              : workflow.status === "completed"
                ? "bg-emerald-900/40 text-emerald-400"
                : "bg-[#1e3a5f]/30 text-slate-500"
          }`}
        >
          {workflow.status === "draft"
            ? "草稿"
            : workflow.status === "running"
              ? "运行中"
              : workflow.status === "completed"
                ? "已完成"
                : "已暂停"}
        </span>
      </div>

      {/* Node Palette */}
      {showNodePalette && (
        <div className="flex-shrink-0 px-2 py-2 border-b border-[var(--ide-border-faint)] grid grid-cols-4 gap-1">
          {NODE_TYPES.map((nt) => (
            <button
              key={nt.type}
              onClick={() => addNode(nt.type)}
              className="flex flex-col items-center gap-1 p-1.5 rounded border border-dashed border-[var(--ide-border-faint)] hover:border-sky-600/40 hover:bg-sky-900/10 transition-colors"
            >
              <nt.icon className={`w-3.5 h-3.5 ${nt.color}`} />
              <span className="text-[0.55rem] text-slate-500">{nt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-auto relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {workflow.edges.map((edge, i) => {
            const from = workflow.nodes.find((n) => n.id === edge.from);
            const to = workflow.nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const x1 = from.x + 75;
            const y1 = from.y + 25;
            const x2 = to.x + 75;
            const y2 = to.y + 25;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#1e3a5f"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <circle cx={x2} cy={y2} r="3" fill="#1e3a5f" />
                {edge.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    fill="#475569"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {workflow.nodes.map((node) => {
          const nt = getNodeIcon(node.type);
          const Icon = nt.icon;
          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node.id)}
              className={`absolute cursor-pointer rounded-lg border transition-all ${
                selectedNode === node.id
                  ? "border-sky-500/60 bg-[var(--ide-bg-elevated)] shadow-lg shadow-sky-500/10"
                  : "border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)] hover:border-[var(--ide-border)]"
              }`}
              style={{ left: node.x, top: node.y, width: 150, minHeight: 50 }}
            >
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <Icon className={`w-3.5 h-3.5 ${nt.color} flex-shrink-0`} />
                <span className="text-[0.65rem] text-slate-300 flex-1 truncate">
                  {node.label}
                </span>
                {node.status === "running" && (
                  <div className="w-2.5 h-2.5 border border-sky-400 border-t-transparent rounded-full animate-spin" />
                )}
                {node.status === "success" && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
                {node.status === "error" && (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                )}
              </div>
              {node.modelId && (
                <div className="px-2 pb-1.5">
                  <span className="text-[0.52rem] text-slate-600 bg-[#1e3a5f]/20 px-1 py-0.5 rounded">
                    {models.find((m) => m.id === node.modelId)?.name ||
                      "未配置"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Node Inspector */}
      {selected && (
        <div className="flex-shrink-0 border-t border-[var(--ide-border-dim)] px-3 py-2 bg-[var(--ide-bg-dark)] max-h-[35%] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.72rem] text-slate-300">
              {selected.label}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[0.58rem] text-slate-600 hover:text-slate-400"
            >
              关闭
            </button>
          </div>
          {(selected.type === "llm" || selected.type === "rag") && (
            <div className="mb-2">
              <label className="text-[0.58rem] text-slate-600 block mb-1">
                模型配置
              </label>
              <select className="w-full px-2 py-1 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.68rem] text-slate-300 outline-none">
                <option value="">选择模型...</option>
                {models
                  .filter((m) =>
                    selected.type === "rag"
                      ? m.type === "embedding"
                      : m.type === "llm" ||
                        m.type === "code" ||
                        m.type === "qa",
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
              </select>
            </div>
          )}
          {Object.entries(selected.config).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <span className="text-[0.58rem] text-slate-600 w-20">{key}</span>
              <input
                value={val}
                readOnly
                className="flex-1 px-1.5 py-0.5 bg-[var(--ide-bg)] border border-[var(--ide-border-dim)] rounded text-[0.62rem] text-slate-400 outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
