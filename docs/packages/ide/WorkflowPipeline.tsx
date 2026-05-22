/**
 * @file WorkflowPipeline.tsx
 * @description 工作流流水线可视化面板，展示 CI/CD 阶段状态，订阅 WorkflowEventBus 事件驱动
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags workflow,pipeline,cicd,visualization,events
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  // Pipeline icons
  GitCommitHorizontal,
  CircleDot,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  // Workflow category icons
  Palette,
  Code2,
  Eye,
  Bot,
  Users,
  // Stage icons - Design Input
  MessageSquare,
  Layers,
  BrainCircuit,
  FileJson,
  Monitor,
  ThumbsUp,
  RefreshCw,
  // Stage icons - Code Generation
  FileSearch,
  LayoutTemplate,
  Database,
  FileCode2,
  AlignLeft,
  ShieldCheck,
  HardDrive,
  Play,
  AlertTriangle,
  // Stage icons - Preview
  ScanSearch,
  GitCompare,
  PackagePlus,
  Cpu,
  RotateCcw,
  MousePointerClick,
  Pencil,
  // Stage icons - AI
  Zap,
  Telescope,
  Lightbulb,
  ListChecks,
  Hand,
  Sparkles,
  BarChart3,
  // Stage icons - Collab
  UserRound,
  Shuffle,
  Share2,
  Wifi,
  ShieldAlert,
  UsersRound,
  // Extra
  ChevronRight,
  ChevronDown,
  ArrowDown,
  Activity,
  Timer,
  TrendingUp,
  Hash,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import {
  useWorkflowEventBus,
  EVENT_STAGE_MAP,
  type WorkflowEvent,
} from "./WorkflowEventBus";

// ===== Types =====
type StageStatus = "idle" | "active" | "completed" | "error" | "waiting";

interface PipelineStage {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StageStatus;
  duration?: number; // ms
  detail?: string;
}

interface WorkflowLoop {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  description: string;
  stages: PipelineStage[];
  cycleCount: number;
  lastCycleTime?: number;
  isRunning: boolean;
}

// ===== Initial Workflow Definitions =====
function createWorkflows(): WorkflowLoop[] {
  return [
    {
      id: "design-input",
      name: "设计输入闭环",
      nameEn: "Design Input Loop",
      icon: Palette,
      color: "text-violet-400",
      glowColor: "rgba(167,139,250,0.3)",
      description:
        "用户需求 → 多模态处理 → 意图识别 → 设计数据 → 实时预览 → 确认调整",
      cycleCount: 12,
      lastCycleTime: 3420,
      isRunning: true,
      stages: [
        {
          id: "di-1",
          name: "用户需求输入",
          description: "接收文本、图片、文件等多模态输入",
          icon: MessageSquare,
          status: "completed",
          duration: 120,
          detail: "文本输入 + 2张截图",
        },
        {
          id: "di-2",
          name: "多模态输入处理",
          description: "解析并标准化不同类型的输入数据",
          icon: Layers,
          status: "completed",
          duration: 340,
          detail: "NLP + Vision 双通道",
        },
        {
          id: "di-3",
          name: "意图识别与分析",
          description: "AI 语义分析，识别用户真实意图和需求",
          icon: BrainCircuit,
          status: "completed",
          duration: 580,
          detail: "意图: 创建仪表板, 置信度: 0.93",
        },
        {
          id: "di-4",
          name: "设计数据生成",
          description: "根据识别结果生成 Design JSON 数据结构",
          icon: FileJson,
          status: "active",
          duration: 750,
          detail: "生成中... 45 个节点",
        },
        {
          id: "di-5",
          name: "实时预览反馈",
          description: "渲染设计数据，提供即时视觉反馈",
          icon: Monitor,
          status: "waiting",
        },
        {
          id: "di-6",
          name: "用户确认/调整",
          description: "用户审核并调整设计，触发下一轮循环",
          icon: ThumbsUp,
          status: "idle",
        },
      ],
    },
    {
      id: "code-gen",
      name: "代码生成闭环",
      nameEn: "Code Generation Loop",
      icon: Code2,
      color: "text-sky-400",
      glowColor: "rgba(56,189,248,0.3)",
      description:
        "读取设计 → 模板匹配 → 数据转换 → 代码生成 → 类型检查 → 文件写入 → 编译运行 → 错误修正",
      cycleCount: 8,
      lastCycleTime: 5200,
      isRunning: false,
      stages: [
        {
          id: "cg-1",
          name: "设计数据读取",
          description: "读取 Design JSON 文件，解析设计规范",
          icon: FileSearch,
          status: "completed",
          duration: 45,
          detail: "读取 design.json (2.4KB)",
        },
        {
          id: "cg-2",
          name: "模板选择与匹配",
          description: "根据组件类型选择最佳代码生成模板",
          icon: LayoutTemplate,
          status: "completed",
          duration: 120,
          detail: "匹配模板: React + TypeScript",
        },
        {
          id: "cg-3",
          name: "数据填充与转换",
          description: "将设计数据转换并填充到模板变量中",
          icon: Database,
          status: "completed",
          duration: 230,
          detail: "转换 Props × 18, Styles × 32",
        },
        {
          id: "cg-4",
          name: "代码生成与格式化",
          description: "生成最终代码并应用 Prettier 格式化",
          icon: FileCode2,
          status: "completed",
          duration: 380,
          detail: "生成 3 个组件 (共 247 行)",
        },
        {
          id: "cg-5",
          name: "类型检查与验证",
          description: "运行 TypeScript 编译器进行类型安全检查",
          icon: ShieldCheck,
          status: "completed",
          duration: 560,
          detail: "tsc --noEmit: 0 errors",
        },
        {
          id: "cg-6",
          name: "文件写入与更新",
          description: "将生成的代码写入文件系统，更新文件树",
          icon: HardDrive,
          status: "completed",
          duration: 30,
          detail: "写入 3 文件",
        },
        {
          id: "cg-7",
          name: "编译与运行",
          description: "Vite HMR 热模块替换，实时编译更新",
          icon: Play,
          status: "completed",
          duration: 420,
          detail: "HMR 热更新 342ms",
        },
        {
          id: "cg-8",
          name: "错误反馈与修正",
          description: "收集运行时错误，触发自动修正或提示",
          icon: AlertTriangle,
          status: "completed",
          duration: 0,
          detail: "无错误",
        },
      ],
    },
    {
      id: "preview",
      name: "实时预览闭环",
      nameEn: "Real-time Preview Loop",
      icon: Eye,
      color: "text-emerald-400",
      glowColor: "rgba(52,211,153,0.3)",
      description:
        "变更检测 → 差异计算 → 增量更新 → 重新编译 → 预览刷新 → 用户反馈 → 设计调整",
      cycleCount: 34,
      lastCycleTime: 890,
      isRunning: true,
      stages: [
        {
          id: "pv-1",
          name: "设计变更检测",
          description: "监听文件系统和编辑器变更事件",
          icon: ScanSearch,
          status: "completed",
          duration: 5,
          detail: "监听: file watcher + editor events",
        },
        {
          id: "pv-2",
          name: "差异计算 (Diff)",
          description: "计算变更前后的差异，生成最小变更集",
          icon: GitCompare,
          status: "completed",
          duration: 12,
          detail: "Diff: 3 chunks, +15/-8 lines",
        },
        {
          id: "pv-3",
          name: "增量更新 (Patch)",
          description: "生成增量补丁，避免全量重新渲染",
          icon: PackagePlus,
          status: "active",
          duration: 28,
          detail: "Patch 2/3 applied...",
        },
        {
          id: "pv-4",
          name: "代码重新编译",
          description: "Vite HMR 增量编译变更模块",
          icon: Cpu,
          status: "waiting",
        },
        {
          id: "pv-5",
          name: "预览刷新",
          description: "更新 iframe 预览视图，无闪烁热替换",
          icon: RotateCcw,
          status: "idle",
        },
        {
          id: "pv-6",
          name: "用户交互反馈",
          description: "收集用户在预览中的点击、滚动等交互",
          icon: MousePointerClick,
          status: "idle",
        },
        {
          id: "pv-7",
          name: "设计调整",
          description: "根据反馈调整设计参数，触发新循环",
          icon: Pencil,
          status: "idle",
        },
      ],
    },
    {
      id: "ai-assist",
      name: "AI 辅助闭环",
      nameEn: "AI Assistance Loop",
      icon: Bot,
      color: "text-amber-400",
      glowColor: "rgba(251,191,36,0.3)",
      description:
        "操作触发 → 上下文收集 → AI 理解 → 建议生成 → 展示 → 用户选择 → 应用 → 效果反馈",
      cycleCount: 6,
      lastCycleTime: 4100,
      isRunning: false,
      stages: [
        {
          id: "ai-1",
          name: "用户操作触发",
          description: "点击按钮、快捷键或自动触发 AI 辅助",
          icon: Zap,
          status: "completed",
          duration: 0,
          detail: "触发: 手动 (Ctrl+Space)",
        },
        {
          id: "ai-2",
          name: "上下文收集",
          description: "收集当前选中组件、编辑内容、设计状态",
          icon: Telescope,
          status: "completed",
          duration: 45,
          detail: "上下文: 3 文件, 1 选中组件",
        },
        {
          id: "ai-3",
          name: "AI 意图理解",
          description: "AI 分析上下文，理解用户当前需求",
          icon: BrainCircuit,
          status: "completed",
          duration: 820,
          detail: "模型: GPT-4o, tokens: 1.2k",
        },
        {
          id: "ai-4",
          name: "智能建议生成",
          description: "生成代码建议、优化方案或错误修复",
          icon: Lightbulb,
          status: "completed",
          duration: 1200,
          detail: "生成 3 条建议",
        },
        {
          id: "ai-5",
          name: "建议展示",
          description: "以内联提示或面板形式展示 AI 建议",
          icon: ListChecks,
          status: "completed",
          duration: 10,
          detail: "展示: 内联补全 + 面板卡片",
        },
        {
          id: "ai-6",
          name: "用户选择/拒绝",
          description: "用户审核并选择接受或忽略建议",
          icon: Hand,
          status: "completed",
          duration: 2500,
          detail: "接受 2/3 建议",
        },
        {
          id: "ai-7",
          name: "建议应用/忽略",
          description: "将选中的建议应用到代码或设计中",
          icon: Sparkles,
          status: "completed",
          duration: 130,
          detail: "已应用: 代码优化 + 类型修复",
        },
        {
          id: "ai-8",
          name: "效果反馈",
          description: "收集应用效果，用于模型优化和学习",
          icon: BarChart3,
          status: "completed",
          duration: 20,
          detail: "反馈: positive, 编译通过",
        },
      ],
    },
    {
      id: "collab",
      name: "协同编辑闭环",
      nameEn: "Collaborative Editing Loop",
      icon: Users,
      color: "text-cyan-400",
      glowColor: "rgba(34,211,238,0.3)",
      description:
        "用户操作 → 操作转换(OT) → CRDT 更新 → 状态同步 → 冲突解决 → 多用户视图更新",
      cycleCount: 156,
      lastCycleTime: 45,
      isRunning: true,
      stages: [
        {
          id: "co-1",
          name: "用户操作",
          description: "捕获本地用户的编辑操作",
          icon: UserRound,
          status: "completed",
          duration: 0,
          detail: "操作: insertText @L42:C18",
        },
        {
          id: "co-2",
          name: "操作转换 (OT)",
          description: "将操作转换为可合并的规范化格式",
          icon: Shuffle,
          status: "completed",
          duration: 2,
          detail: "OT Transform: insert → retain + insert",
        },
        {
          id: "co-3",
          name: "CRDT 更新",
          description: "更新 Yjs CRDT 数据结构",
          icon: Database,
          status: "active",
          duration: 3,
          detail: "Y.Text.insert(42, 'const')",
        },
        {
          id: "co-4",
          name: "状态同步",
          description: "通过 WebSocket 广播操作到所有协作者",
          icon: Wifi,
          status: "waiting",
        },
        {
          id: "co-5",
          name: "冲突检测与解决",
          description: "检测并发编辑冲突，自动解决",
          icon: ShieldAlert,
          status: "idle",
        },
        {
          id: "co-6",
          name: "多用户视图更新",
          description: "更新所有用户的编辑器视图和光标",
          icon: UsersRound,
          status: "idle",
        },
      ],
    },
  ];
}

// ===== Status visual config =====
const STATUS_CONFIG: Record<
  StageStatus,
  {
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  idle: {
    color: "text-slate-600",
    bgColor: "bg-slate-800/30",
    icon: Clock,
    label: "等待中",
  },
  waiting: {
    color: "text-amber-500",
    bgColor: "bg-amber-900/20",
    icon: Clock,
    label: "排队中",
  },
  active: {
    color: "text-sky-400",
    bgColor: "bg-sky-900/30",
    icon: Loader2,
    label: "执行中",
  },
  completed: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/20",
    icon: CheckCircle2,
    label: "已完成",
  },
  error: {
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    icon: XCircle,
    label: "错误",
  },
};

// ===== Stage Component =====
function StageNode({
  stage,
  isLast,
  index,
}: {
  stage: PipelineStage;
  isLast: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[stage.status];
  const StatusIcon = config.icon;
  const StageIcon = stage.icon;

  return (
    <div className="relative">
      {/* Stage row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors text-left ${config.bgColor} hover:bg-opacity-60`}
      >
        {/* Status + index */}
        <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              stage.status === "active" ? "ring-2 ring-sky-400/40" : ""
            }`}
          >
            <StatusIcon
              className={`w-3.5 h-3.5 ${config.color} ${stage.status === "active" ? "animate-spin" : ""}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <StageIcon className={`w-3 h-3 ${config.color} flex-shrink-0`} />
            <span
              className={`text-[0.7rem] truncate ${
                stage.status === "active"
                  ? "text-sky-300"
                  : stage.status === "completed"
                    ? "text-slate-300"
                    : "text-slate-500"
              }`}
            >
              {stage.name}
            </span>
            <span className="text-[0.5rem] text-slate-700 flex-shrink-0">
              #{index + 1}
            </span>
          </div>
          {/* Duration */}
          {stage.duration !== undefined && stage.status !== "idle" && (
            <div className="flex items-center gap-1 mt-0.5">
              <Timer className="w-2 h-2 text-slate-700" />
              <span className="text-[0.55rem] text-slate-700">
                {stage.duration < 1000
                  ? `${stage.duration}ms`
                  : `${(stage.duration / 1000).toFixed(1)}s`}
              </span>
            </div>
          )}
        </div>

        {/* Expand arrow */}
        <div className="flex-shrink-0 pt-0.5">
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-slate-700" />
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-700" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="ml-7 mt-1 mb-1 px-2 py-1.5 rounded bg-[var(--ide-bg-elevated)] border border-dashed border-[var(--ide-border-faint)]">
          <p className="text-[0.62rem] text-slate-500 mb-1">
            {stage.description}
          </p>
          {stage.detail && (
            <div className="flex items-center gap-1 mt-1">
              <Hash className="w-2.5 h-2.5 text-slate-600" />
              <span className="text-[0.58rem] text-sky-400/70 font-mono">
                {stage.detail}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`text-[0.55rem] px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}
            >
              {config.label}
            </span>
          </div>
        </div>
      )}

      {/* Connector line to next stage */}
      {!isLast && (
        <div className="flex justify-start ml-[17px] py-0.5">
          <ArrowDown
            className={`w-3 h-3 ${
              stage.status === "completed"
                ? "text-emerald-500/40"
                : stage.status === "active"
                  ? "text-sky-400/40"
                  : "text-slate-800"
            }`}
          />
        </div>
      )}
    </div>
  );
}

// ===== Workflow Card =====
function WorkflowCard({
  workflow,
  isSelected,
  onClick,
}: {
  workflow: WorkflowLoop;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = workflow.icon;
  const completedCount = workflow.stages.filter(
    (s) => s.status === "completed",
  ).length;
  const activeCount = workflow.stages.filter(
    (s) => s.status === "active",
  ).length;
  const totalCount = workflow.stages.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
        isSelected
          ? "bg-[var(--ide-bg-elevated)] border border-[var(--ide-accent-solid)]/30 shadow-sm"
          : "hover:bg-[var(--ide-bg-elevated)]/50 border border-transparent"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSelected ? "bg-[var(--ide-accent-bg)]" : "bg-[var(--ide-bg-inset)]"
        }`}
        style={
          workflow.isRunning && isSelected
            ? { boxShadow: `0 0 8px ${workflow.glowColor}` }
            : {}
        }
      >
        <Icon className={`w-4 h-4 ${workflow.color}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[0.72rem] truncate ${isSelected ? "text-slate-200" : "text-slate-400"}`}
          >
            {workflow.name}
          </span>
          {workflow.isRunning && (
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Progress bar */}
          <div className="flex-1 h-1 bg-[var(--ide-bg-inset)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100
                  ? "bg-emerald-500"
                  : activeCount > 0
                    ? "bg-sky-500"
                    : "bg-slate-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[0.55rem] text-slate-600 flex-shrink-0">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>
    </button>
  );
}

// ===== Workflow Stats =====
function WorkflowStats({ workflow }: { workflow: WorkflowLoop }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 px-3 py-2">
      <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <RefreshCw className="w-2.5 h-2.5 text-sky-400/50" />
        </div>
        <div className="text-[0.72rem] text-slate-300">
          {workflow.cycleCount}
        </div>
        <div className="text-[0.5rem] text-slate-700">循环次数</div>
      </div>
      <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <Timer className="w-2.5 h-2.5 text-amber-400/50" />
        </div>
        <div className="text-[0.72rem] text-slate-300">
          {workflow.lastCycleTime
            ? workflow.lastCycleTime < 1000
              ? `${workflow.lastCycleTime}ms`
              : `${(workflow.lastCycleTime / 1000).toFixed(1)}s`
            : "—"}
        </div>
        <div className="text-[0.5rem] text-slate-700">上次耗时</div>
      </div>
      <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <TrendingUp className="w-2.5 h-2.5 text-emerald-400/50" />
        </div>
        <div className="text-[0.72rem] text-slate-300">
          {workflow.isRunning ? "运行中" : "已停止"}
        </div>
        <div className="text-[0.5rem] text-slate-700">当前状态</div>
      </div>
    </div>
  );
}

// ===== Main Component =====
export default function WorkflowPipeline({ nodeId }: { nodeId: string }) {
  const [workflows, setWorkflows] = useState<WorkflowLoop[]>(createWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<string>("design-input");
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [eventLog, setEventLog] = useState<WorkflowEvent[]>([]);

  const { subscribe } = useWorkflowEventBus();

  const currentWorkflow =
    workflows.find((w) => w.id === selectedWorkflow) || workflows[0];

  // ── Subscribe to IDE workflow events ──
  useEffect(() => {
    const unsubscribe = subscribe((event: WorkflowEvent) => {
      // Add to event log (keep last 50)
      setEventLog((prev) => [...prev.slice(-49), event]);

      // Map event to workflow stage
      const mapping = EVENT_STAGE_MAP[event.type];
      if (!mapping) return;

      const { workflowId, stageId } = mapping;

      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== workflowId) return wf;

          const stages = wf.stages.map((stage) => {
            if (stage.id === stageId) {
              // Mark this stage as active, update detail
              return {
                ...stage,
                status: "active" as StageStatus,
                detail: event.detail || stage.detail,
                duration: Date.now() - event.timestamp,
              };
            }
            // Mark stages before this one as completed
            const stageIndex = wf.stages.findIndex((s) => s.id === stageId);
            const currentIndex = wf.stages.findIndex((s) => s.id === stage.id);
            if (currentIndex < stageIndex && stage.status !== "completed") {
              return { ...stage, status: "completed" as StageStatus };
            }
            return stage;
          });

          return { ...wf, stages, isRunning: true };
        }),
      );

      // Auto-switch to the relevant workflow
      setSelectedWorkflow(workflowId);
    });

    return unsubscribe;
  }, [subscribe]);

  // Simulation: advance active stages periodically
  const advanceStage = useCallback(() => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (!wf.isRunning) return wf;

        const stages = [...wf.stages];
        let changed = false;

        for (let i = 0; i < stages.length; i++) {
          if (stages[i].status === "active") {
            // Complete current, activate next
            stages[i] = { ...stages[i], status: "completed" };
            if (i + 1 < stages.length) {
              stages[i + 1] = { ...stages[i + 1], status: "active" };
            } else {
              // Loop completed - reset for next cycle
              // Reset all to idle, start first as active
              for (let j = 0; j < stages.length; j++) {
                stages[j] = {
                  ...stages[j],
                  status: j === 0 ? "active" : "idle",
                };
              }
              wf = { ...wf, cycleCount: wf.cycleCount + 1 };
            }
            changed = true;
            break;
          }
        }

        // Also advance waiting → active if previous is completed
        if (!changed) {
          for (let i = 0; i < stages.length; i++) {
            if (
              stages[i].status === "waiting" &&
              (i === 0 || stages[i - 1].status === "completed")
            ) {
              stages[i] = { ...stages[i], status: "active" };
              break;
            }
          }
        }

        return { ...wf, stages };
      }),
    );
  }, []);

  // Toggle simulation
  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => {
      if (!prev) {
        simulationRef.current = setInterval(advanceStage, 2000);
      } else {
        if (simulationRef.current) {
          clearInterval(simulationRef.current);
          simulationRef.current = null;
        }
      }
      return !prev;
    });
  }, [advanceStage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  // Toggle workflow running state
  const toggleWorkflowRunning = useCallback((wfId: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === wfId ? { ...wf, isRunning: !wf.isRunning } : wf,
      ),
    );
  }, []);

  // Reset workflow
  const resetWorkflow = useCallback((wfId: string) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id !== wfId) return wf;
        const stages = wf.stages.map((s, i) => ({
          ...s,
          status: (i === 0 ? "active" : "idle") as StageStatus,
        }));
        return { ...wf, stages, cycleCount: 0, isRunning: false };
      }),
    );
  }, []);

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      {/* Header */}
      <PanelHeader
        nodeId={nodeId}
        panelId="workflow"
        title="工作流闭环"
        icon={<Activity className="w-3 h-3 text-violet-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.58rem] transition-colors ${
              isSimulating
                ? "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50"
                : "bg-[var(--ide-bg-inset)] text-slate-600 hover:text-slate-400"
            }`}
            title={isSimulating ? "停止模拟" : "启动模拟"}
          >
            {isSimulating ? (
              <>
                <Activity className="w-2.5 h-2.5" />
                <span>模拟中</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5" />
                <span>模拟</span>
              </>
            )}
          </button>
        </div>
      </PanelHeader>

      {/* Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Workflow list */}
        <div className="w-[45%] min-w-[160px] border-r border-[var(--ide-border-dim)] flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-3 py-1.5 border-b border-dashed border-[var(--ide-border-faint)]">
            <span className="text-[0.6rem] text-slate-600">功能闭环列表</span>
            <span className="text-[0.5rem] text-slate-700 ml-2">
              ({workflows.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto py-1 px-1 space-y-0.5">
            {workflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                isSelected={selectedWorkflow === wf.id}
                onClick={() => setSelectedWorkflow(wf.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Pipeline detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Workflow header */}
          <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)]">
            <div className="flex items-center gap-2 mb-1">
              <currentWorkflow.icon
                className={`w-4 h-4 ${currentWorkflow.color}`}
              />
              <span className="text-[0.78rem] text-slate-200">
                {currentWorkflow.name}
              </span>
              {currentWorkflow.isRunning && (
                <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">
                  运行中
                </span>
              )}
            </div>
            <p className="text-[0.6rem] text-slate-600 leading-relaxed">
              {currentWorkflow.description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                onClick={() => toggleWorkflowRunning(currentWorkflow.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[0.58rem] transition-colors ${
                  currentWorkflow.isRunning
                    ? "bg-amber-900/20 text-amber-400 hover:bg-amber-900/30"
                    : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/30"
                }`}
              >
                {currentWorkflow.isRunning ? (
                  <>
                    <Clock className="w-2.5 h-2.5" /> 暂停
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5" /> 启动
                  </>
                )}
              </button>
              <button
                onClick={() => resetWorkflow(currentWorkflow.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[0.58rem] bg-[var(--ide-bg-inset)] text-slate-600 hover:text-slate-400 transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" /> 重置
              </button>
            </div>
          </div>

          {/* Stats */}
          <WorkflowStats workflow={currentWorkflow} />

          {/* Pipeline stages */}
          <div className="flex-shrink-0 px-3 py-1 border-y border-dashed border-[var(--ide-border-faint)]">
            <div className="flex items-center gap-1">
              <GitCommitHorizontal className="w-3 h-3 text-slate-600" />
              <span className="text-[0.6rem] text-slate-600">管道阶段</span>
              <span className="text-[0.5rem] text-slate-700 ml-1">
                ({currentWorkflow.stages.length} 阶段)
              </span>
              <div className="flex-1" />
              {/* Legend */}
              <div className="flex items-center gap-2">
                {(
                  ["completed", "active", "waiting", "idle"] as StageStatus[]
                ).map((s) => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <div key={s} className="flex items-center gap-0.5">
                      <CircleDot className={`w-2 h-2 ${c.color}`} />
                      <span className="text-[0.48rem] text-slate-700">
                        {c.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stage list */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0">
            {currentWorkflow.stages.map((stage, i) => (
              <StageNode
                key={stage.id}
                stage={stage}
                isLast={i === currentWorkflow.stages.length - 1}
                index={i}
              />
            ))}

            {/* Loop indicator */}
            <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-md bg-[var(--ide-bg-inset)] border border-dashed border-[var(--ide-border-faint)]">
              <RefreshCw
                className={`w-3.5 h-3.5 ${currentWorkflow.isRunning ? "text-sky-400/60 animate-spin" : "text-slate-700"}`}
                style={{ animationDuration: "3s" }}
              />
              <div className="flex-1">
                <span className="text-[0.62rem] text-slate-500">闭环循环</span>
                <span className="text-[0.55rem] text-slate-700 ml-1.5">
                  完成后自动从阶段 #1 重新开始
                </span>
              </div>
              <span className="text-[0.58rem] text-sky-400/60 font-mono">
                ×{currentWorkflow.cycleCount}
              </span>
            </div>

            {/* IDE Event Log */}
            {eventLog.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="w-2.5 h-2.5 text-violet-400/50" />
                  <span className="text-[0.58rem] text-slate-600">
                    IDE 事件日志
                  </span>
                  <span className="text-[0.5rem] text-slate-700 ml-1">
                    ({eventLog.length})
                  </span>
                </div>
                <div className="max-h-[80px] overflow-y-auto space-y-0.5">
                  {eventLog
                    .slice(-10)
                    .reverse()
                    .map((evt, i) => (
                      <div
                        key={`${evt.timestamp}-${i}`}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--ide-bg-inset)]/50 text-[0.55rem]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400/40 flex-shrink-0" />
                        <span className="text-violet-400/60 flex-shrink-0">
                          {evt.type}
                        </span>
                        {evt.detail && (
                          <span className="text-slate-600 truncate">
                            {evt.detail}
                          </span>
                        )}
                        <span className="text-slate-800 flex-shrink-0 ml-auto">
                          {new Date(evt.timestamp).toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
