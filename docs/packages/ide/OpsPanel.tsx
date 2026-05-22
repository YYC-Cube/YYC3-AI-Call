/**
 * @file OpsPanel.tsx
 * @description DevOps 运维面板，展示系统健康状态、性能指标、AI 模型监控、
 *              代理配置管理、自动扩缩策略等运维信息
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags devops,monitoring,health,proxy,panel
 */

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Wrench,
  RotateCcw,
  Zap,
  Clock,
  Server,
  Bot,
  Target,
  HeartPulse,
  Timer,
  Settings2,
  Bug,
  Trash2,
  ChevronDown,
  Shield,
  Gauge,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import { useModelRegistry } from "./ModelRegistry";
import {
  loadProxyConfig,
  saveProxyConfig,
  checkProxyHealth,
  type ProxyConfig,
} from "./ProxyService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  errorReporting,
  type ErrorEvent,
  type ErrorCategory,
  type ErrorSeverity,
} from "./services/ErrorReportingService";

type OpsTab =
  | "monitor"
  | "predict"
  | "heal"
  | "schedule"
  | "optimize"
  | "heartbeat"
  | "proxy"
  | "errors";

interface MetricData {
  label: string;
  value: number;
  max: number;
  unit: string;
  trend: "up" | "down" | "stable";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  message: string;
  source: string;
  time: string;
  resolved: boolean;
}

interface HealAction {
  id: string;
  trigger: string;
  action: string;
  status: "success" | "running" | "failed" | "pending";
  time: string;
  duration: string;
}

interface ScheduleTask {
  id: string;
  name: string;
  resource: string;
  allocated: number;
  used: number;
  cost: string;
  status: "optimal" | "over" | "under";
}

interface OptimizeItem {
  id: string;
  category: string;
  suggestion: string;
  impact: "high" | "medium" | "low";
  automated: boolean;
  applied: boolean;
}

const METRICS: MetricData[] = [
  {
    label: "CPU 使用率",
    value: 67,
    max: 100,
    unit: "%",
    trend: "up",
    icon: Cpu,
    color: "text-sky-400",
  },
  {
    label: "内存使用",
    value: 4.2,
    max: 8,
    unit: "GB",
    trend: "stable",
    icon: MemoryStick,
    color: "text-purple-400",
  },
  {
    label: "磁盘 I/O",
    value: 234,
    max: 500,
    unit: "MB/s",
    trend: "down",
    icon: HardDrive,
    color: "text-amber-400",
  },
  {
    label: "网络延迟",
    value: 12,
    max: 100,
    unit: "ms",
    trend: "stable",
    icon: Wifi,
    color: "text-emerald-400",
  },
];

const ALERTS: Alert[] = [
  {
    id: "a1",
    level: "warning",
    message: "CPU 使用率持续超过 70%，预计 30 分钟后达到阈值",
    source: "预测引擎",
    time: "2 分钟前",
    resolved: false,
  },
  {
    id: "a2",
    level: "info",
    message: "内存使用趋势平稳，未来 1 小时内无风险",
    source: "监控系统",
    time: "5 分钟前",
    resolved: false,
  },
  {
    id: "a3",
    level: "critical",
    message: "数据库连接池使用率 95%，已自动扩容",
    source: "自愈系统",
    time: "15 分钟前",
    resolved: true,
  },
  {
    id: "a4",
    level: "warning",
    message: "API 响应时间 P99 上升至 800ms",
    source: "性能分析",
    time: "20 分钟前",
    resolved: false,
  },
];

const HEAL_ACTIONS: HealAction[] = [
  {
    id: "h1",
    trigger: "数据库连接池耗尽",
    action: "自动扩容连接池 (50→100)",
    status: "success",
    time: "15 分钟前",
    duration: "3s",
  },
  {
    id: "h2",
    trigger: "服务实例健康检查失败",
    action: "重启实例 worker-03",
    status: "success",
    time: "1 小时前",
    duration: "12s",
  },
  {
    id: "h3",
    trigger: "内存泄漏检测",
    action: "自动触发 GC 并重启服务",
    status: "running",
    time: "刚刚",
    duration: "-",
  },
  {
    id: "h4",
    trigger: "缓存命中率低于 60%",
    action: "重建缓存索引",
    status: "pending",
    time: "排队中",
    duration: "-",
  },
];

const SCHEDULE_TASKS: ScheduleTask[] = [
  {
    id: "s1",
    name: "Web 服务",
    resource: "CPU",
    allocated: 4,
    used: 2.8,
    cost: "¥1,200/月",
    status: "optimal",
  },
  {
    id: "s2",
    name: "API 网关",
    resource: "内存",
    allocated: 8,
    used: 7.6,
    cost: "¥800/月",
    status: "over",
  },
  {
    id: "s3",
    name: "数据库",
    resource: "存储",
    allocated: 100,
    used: 45,
    cost: "¥2,400/月",
    status: "under",
  },
  {
    id: "s4",
    name: "缓存服务",
    resource: "内存",
    allocated: 16,
    used: 12,
    cost: "¥600/月",
    status: "optimal",
  },
];

const OPTIMIZE_ITEMS: OptimizeItem[] = [
  {
    id: "o1",
    category: "配置优化",
    suggestion: "调整线程池大小从 200 降至 120，减少资源浪费",
    impact: "high",
    automated: true,
    applied: false,
  },
  {
    id: "o2",
    category: "模型量化",
    suggestion: "将 Embedding 模型从 FP32 量化为 INT8，推理速度提升 40%",
    impact: "high",
    automated: true,
    applied: false,
  },
  {
    id: "o3",
    category: "参数调优",
    suggestion: "优化数据库查询缓存时间从 5s 到 30s",
    impact: "medium",
    automated: true,
    applied: true,
  },
  {
    id: "o4",
    category: "架构调整",
    suggestion: "将热点 API 迁移至边缘节点，降低 50ms 延迟",
    impact: "medium",
    automated: false,
    applied: false,
  },
  {
    id: "o5",
    category: "成本优化",
    suggestion: "数据库存储从 SSD 降级至 HDD（冷数据），节省 40% 成本",
    impact: "low",
    automated: false,
    applied: false,
  },
];

export default function OpsPanel({ nodeId }: { nodeId: string }) {
  const [activeTab, setActiveTab] = useState<OpsTab>("monitor");
  const [metrics, setMetrics] = useState(METRICS);
  const [alerts] = useState(ALERTS);
  const [heals] = useState(HEAL_ACTIONS);
  const [optimizations, setOptimizations] = useState(OPTIMIZE_ITEMS);

  // Simulate live metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => ({
          ...m,
          value: Math.max(
            0,
            Math.min(m.max, m.value + (Math.random() - 0.48) * m.max * 0.05),
          ),
        })),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tabs: {
    key: OpsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "monitor", label: "监控", icon: Activity },
    { key: "predict", label: "预测", icon: TrendingUp },
    { key: "heal", label: "自愈", icon: Wrench },
    { key: "schedule", label: "调度", icon: Server },
    { key: "optimize", label: "优化", icon: Zap },
    { key: "heartbeat", label: "心跳", icon: HeartPulse },
    { key: "proxy", label: "代理", icon: Server },
    { key: "errors", label: "错误", icon: Bug },
  ];

  const alertColors = {
    critical: "border-red-500/40 bg-red-900/10",
    warning: "border-amber-500/40 bg-amber-900/10",
    info: "border-sky-500/40 bg-sky-900/10",
  };
  const alertIcons = {
    critical: XCircle,
    warning: AlertTriangle,
    info: Activity,
  };
  const alertTextColors = {
    critical: "text-red-400",
    warning: "text-amber-400",
    info: "text-sky-400",
  };

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="ops"
        title="智能运维"
        icon={<Activity className="w-3 h-3 text-emerald-400/70" />}
      />

      {/* Tab bar */}
      <div className="flex-shrink-0 flex border-b border-[var(--ide-border-dim)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[0.62rem] flex-shrink-0 transition-colors ${activeTab === tab.key ? "text-sky-400 border-b border-sky-500" : "text-slate-600 hover:text-slate-400"}`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Monitor Tab */}
        {activeTab === "monitor" && (
          <div className="p-2 space-y-2">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {metrics.map((m) => {
                const pct = (m.value / m.max) * 100;
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="border border-[var(--ide-border-faint)] rounded-lg p-2"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Icon className={`w-3 h-3 ${m.color}`} />
                      <span className="text-[0.58rem] text-slate-500">
                        {m.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[0.9rem] text-slate-200">
                        {typeof m.value === "number"
                          ? m.value.toFixed(1)
                          : m.value}
                      </span>
                      <span className="text-[0.52rem] text-slate-600">
                        {m.unit}
                      </span>
                      {m.trend === "up" && (
                        <TrendingUp className="w-2.5 h-2.5 text-red-400 ml-auto" />
                      )}
                      {m.trend === "down" && (
                        <TrendingDown className="w-2.5 h-2.5 text-emerald-400 ml-auto" />
                      )}
                    </div>
                    <div className="w-full h-1 bg-[#1e3a5f]/30 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${pct > 80 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Alerts */}
            <div className="text-[0.62rem] text-slate-500 px-1 mt-2 mb-1">
              告警列表
            </div>
            {alerts.map((a) => {
              const Icon = alertIcons[a.level];
              return (
                <div
                  key={a.id}
                  className={`border rounded-lg px-2.5 py-1.5 ${alertColors[a.level]} ${a.resolved ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-1.5">
                    <Icon
                      className={`w-3 h-3 ${alertTextColors[a.level]} flex-shrink-0 mt-0.5`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.65rem] text-slate-300">
                        {a.message}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[0.5rem] text-slate-600">
                          {a.source}
                        </span>
                        <span className="text-[0.5rem] text-slate-700">
                          {a.time}
                        </span>
                        {a.resolved && (
                          <span className="text-[0.5rem] text-emerald-400">
                            已解决
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Predict Tab */}
        {activeTab === "predict" && (
          <div className="p-2 space-y-2">
            <div className="border border-[var(--ide-border-faint)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[0.72rem] text-slate-300">
                  资源趋势预测
                </span>
              </div>
              {/* Simulated chart */}
              <div className="h-24 bg-[var(--ide-bg-dark)] rounded border border-[var(--ide-border-subtle)] flex items-end px-2 pb-1 gap-1">
                {[
                  40, 45, 42, 48, 52, 55, 58, 62, 65, 67, 70, 74, 78, 82, 85,
                ].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div
                      className={`w-full rounded-t transition-all ${i >= 12 ? "bg-red-500/60 border border-dashed border-red-500/40" : i >= 9 ? "bg-amber-500/60" : "bg-sky-500/60"}`}
                      style={{ height: `${v}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[0.48rem] text-slate-700">
                <span>当前</span>
                <span>+1h</span>
                <span>+2h</span>
                <span>+3h</span>
              </div>
            </div>
            <div className="border border-amber-500/30 bg-amber-900/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-[0.68rem] text-amber-300">预警</span>
              </div>
              <p className="text-[0.65rem] text-slate-400">
                基于当前趋势分析，CPU 使用率预计在{" "}
                <span className="text-amber-400">2 小时后</span> 超过 85%
                阈值。建议提前扩容或优化负载。
              </p>
            </div>
            <div className="border border-[#1e3a5f]/30 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="w-3 h-3 text-purple-400" />
                <span className="text-[0.68rem] text-slate-300">
                  AI 根因分析
                </span>
              </div>
              <p className="text-[0.65rem] text-slate-500">
                检测到 CPU 使用率上升主要由以下因素导致：
              </p>
              <ul className="mt-1 space-y-0.5">
                <li className="text-[0.62rem] text-slate-400 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 text-sky-400" />
                  定时任务批量执行 (贡献 35%)
                </li>
                <li className="text-[0.62rem] text-slate-400 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 text-sky-400" />
                  缓存重建操作 (贡献 25%)
                </li>
                <li className="text-[0.62rem] text-slate-400 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 text-sky-400" />
                  用户请求高峰 (贡献 20%)
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Heal Tab */}
        {activeTab === "heal" && (
          <div className="p-2 space-y-1.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[0.62rem] text-slate-500">
                自动修复记录
              </span>
              <span className="text-[0.55rem] text-emerald-400">
                {heals.filter((h) => h.status === "success").length}/
                {heals.length} 成功
              </span>
            </div>
            {heals.map((h) => {
              const statusConfig: Record<
                string,
                {
                  color: string;
                  icon: React.ComponentType<{ className?: string }>;
                  bg: string;
                }
              > = {
                success: {
                  color: "text-emerald-400",
                  icon: CheckCircle2,
                  bg: "border-emerald-500/30",
                },
                running: {
                  color: "text-sky-400",
                  icon: RotateCcw,
                  bg: "border-sky-500/30",
                },
                failed: {
                  color: "text-red-400",
                  icon: XCircle,
                  bg: "border-red-500/30",
                },
                pending: {
                  color: "text-slate-500",
                  icon: Clock,
                  bg: "border-[var(--ide-border-faint)]",
                },
              };
              const cfg = statusConfig[h.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={h.id} className={`border rounded-lg p-2.5 ${cfg.bg}`}>
                  <div className="flex items-start gap-2">
                    <StatusIcon
                      className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0 mt-0.5 ${h.status === "running" ? "animate-spin" : ""}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.65rem] text-slate-300">
                        {h.action}
                      </p>
                      <p className="text-[0.58rem] text-slate-600 mt-0.5">
                        触发: {h.trigger}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[0.5rem] text-slate-700">
                          {h.time}
                        </span>
                        {h.duration !== "-" && (
                          <span className="text-[0.5rem] text-slate-600">
                            耗时: {h.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="p-2 space-y-1.5">
            <div className="text-[0.62rem] text-slate-500 px-1 mb-1">
              智能资源调度
            </div>
            {SCHEDULE_TASKS.map((t) => {
              const pct = (t.used / t.allocated) * 100;
              return (
                <div
                  key={t.id}
                  className="border border-[var(--ide-border-faint)] rounded-lg p-2.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[0.68rem] text-slate-300">
                      {t.name}
                    </span>
                    <span
                      className={`text-[0.52rem] px-1 py-0.5 rounded ${t.status === "optimal" ? "bg-emerald-900/30 text-emerald-400" : t.status === "over" ? "bg-red-900/30 text-red-400" : "bg-amber-900/30 text-amber-400"}`}
                    >
                      {t.status === "optimal"
                        ? "最优"
                        : t.status === "over"
                          ? "过载"
                          : "空闲"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.58rem] text-slate-500">
                    <span>
                      {t.resource}: {t.used}/{t.allocated}
                    </span>
                    <span className="text-slate-700">{t.cost}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1e3a5f]/30 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="border border-dashed border-sky-500/30 rounded-lg p-2.5 bg-sky-900/10 mt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="w-3 h-3 text-sky-400" />
                <span className="text-[0.65rem] text-sky-300">AI 调度建议</span>
              </div>
              <p className="text-[0.62rem] text-slate-400">
                API 网关内存使用率过高，建议横向扩展 1
                个实例。数据库存储利用率仅 45%，可缩减至 60GB 节省 ¥960/月。
              </p>
            </div>
          </div>
        )}

        {/* Optimize Tab */}
        {activeTab === "optimize" && (
          <div className="p-2 space-y-1.5">
            <div className="text-[0.62rem] text-slate-500 px-1 mb-1">
              自动化优化建议
            </div>
            {optimizations.map((o) => {
              const impactColors = {
                high: "bg-red-900/20 text-red-400",
                medium: "bg-amber-900/20 text-amber-400",
                low: "bg-slate-800 text-slate-500",
              };
              return (
                <div
                  key={o.id}
                  className={`border rounded-lg p-2.5 ${o.applied ? "border-emerald-500/30 opacity-60" : "border-[var(--ide-border-faint)]"}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[0.55rem] text-slate-600 bg-[#1e3a5f]/20 px-1 py-0.5 rounded">
                          {o.category}
                        </span>
                        <span
                          className={`text-[0.5rem] px-1 py-0.5 rounded ${impactColors[o.impact]}`}
                        >
                          {o.impact === "high"
                            ? "高影响"
                            : o.impact === "medium"
                              ? "中影响"
                              : "低影响"}
                        </span>
                        {o.automated && (
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[0.65rem] text-slate-300">
                        {o.suggestion}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setOptimizations((prev) =>
                          prev.map((opt) =>
                            opt.id === o.id ? { ...opt, applied: true } : opt,
                          ),
                        )
                      }
                      disabled={o.applied}
                      className={`flex-shrink-0 px-2 py-1 rounded text-[0.58rem] transition-colors ${o.applied ? "bg-emerald-900/20 text-emerald-400" : "bg-sky-600/30 text-sky-300 hover:bg-sky-600/50"}`}
                    >
                      {o.applied ? "已应用" : o.automated ? "自动执行" : "手动"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Heartbeat Tab */}
        {activeTab === "heartbeat" && <HeartbeatTab />}

        {/* Proxy Tab */}
        {activeTab === "proxy" && <ProxyTab />}

        {/* Errors Tab */}
        {activeTab === "errors" && <ErrorsTab />}
      </div>
    </div>
  );
}

// ===== Heartbeat Tab — 心跳检测控制面板 =====
const INTERVAL_OPTIONS = [
  { label: "10s", value: 10000 },
  { label: "30s", value: 30000 },
  { label: "60s", value: 60000 },
  { label: "2m", value: 120000 },
  { label: "5m", value: 300000 },
  { label: "10m", value: 600000 },
];

function HeartbeatTab() {
  const {
    heartbeatEnabled,
    toggleHeartbeat,
    heartbeatIntervalMs,
    setHeartbeatIntervalMs,
    activeModel,
    connectivityResults,
    latencyHistory,
  } = useModelRegistry();

  const activeResult = activeModel ? connectivityResults[activeModel.id] : null;

  const formatTime = (ts: number) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="p-2 space-y-2">
      {/* Main toggle */}
      <div className="border border-[var(--ide-border-faint)] rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <HeartPulse
              className={`w-4 h-4 ${heartbeatEnabled ? "text-emerald-400" : "text-slate-600"}`}
            />
            <span className="text-[0.72rem] text-slate-300">自动心跳检测</span>
          </div>
          <button
            onClick={() => toggleHeartbeat(!heartbeatEnabled)}
            className={`relative w-10 h-5 rounded-full transition-colors ${heartbeatEnabled ? "bg-emerald-600" : "bg-slate-700"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${heartbeatEnabled ? "left-5.5" : "left-0.5"}`}
              style={{ left: heartbeatEnabled ? "22px" : "2px" }}
            />
          </button>
        </div>

        <p className="text-[0.6rem] text-slate-600 mb-3">
          {heartbeatEnabled
            ? `每 ${heartbeatIntervalMs / 1000}s 自动 Ping 当前活跃模型，检测连通性和延迟`
            : "已暂停自动心跳检测，仅可手动触发 Ping 测试"}
        </p>

        {/* Interval selector */}
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1.5">
            <Timer className="w-3 h-3 text-slate-600" />
            <span className="text-[0.62rem] text-slate-500">检测间隔</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {INTERVAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHeartbeatIntervalMs(opt.value)}
                className={`px-2 py-1 rounded text-[0.58rem] transition-colors ${
                  heartbeatIntervalMs === opt.value
                    ? "bg-sky-600/30 text-sky-300 border border-sky-500/30"
                    : "bg-[var(--ide-bg-inset)] text-slate-600 hover:text-slate-400 border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active model */}
        <div className="border-t border-dashed border-[var(--ide-border-faint)] pt-2">
          <div className="flex items-center gap-1 mb-1">
            <Settings2 className="w-3 h-3 text-slate-600" />
            <span className="text-[0.62rem] text-slate-500">当前监控模型</span>
          </div>
          {activeModel ? (
            <div className="bg-[var(--ide-bg-inset)] rounded px-2.5 py-1.5">
              <div className="text-[0.68rem] text-slate-300">
                {activeModel.name}
              </div>
              <div className="text-[0.55rem] text-slate-600">
                {activeModel.provider} · {activeModel.modelId}
              </div>
            </div>
          ) : (
            <div className="text-[0.62rem] text-slate-700">未选择活跃模型</div>
          )}
        </div>
      </div>

      {/* Live status */}
      <div className="border border-[var(--ide-border-faint)] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[0.72rem] text-slate-300">实时状态</span>
        </div>

        {activeResult ? (
          <div className="space-y-2">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  activeResult.status === "success"
                    ? "bg-emerald-500"
                    : activeResult.status === "testing"
                      ? "bg-sky-500 animate-pulse"
                      : activeResult.status === "fail"
                        ? "bg-red-500"
                        : "bg-slate-600"
                }`}
              />
              <span
                className={`text-[0.68rem] ${
                  activeResult.status === "success"
                    ? "text-emerald-400"
                    : activeResult.status === "testing"
                      ? "text-sky-400"
                      : activeResult.status === "fail"
                        ? "text-red-400"
                        : "text-slate-500"
                }`}
              >
                {activeResult.status === "success"
                  ? "连接正常"
                  : activeResult.status === "testing"
                    ? "检测中..."
                    : activeResult.status === "fail"
                      ? "连接异常"
                      : "未检测"}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5">
                <div className="text-[0.52rem] text-slate-700 mb-0.5">延迟</div>
                <div className="text-[0.78rem] text-slate-300">
                  {activeResult.latencyMs !== null
                    ? `${activeResult.latencyMs}ms`
                    : "—"}
                </div>
              </div>
              <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5">
                <div className="text-[0.52rem] text-slate-700 mb-0.5">
                  上次检测
                </div>
                <div className="text-[0.72rem] text-slate-300">
                  {formatTime(activeResult.timestamp)}
                </div>
              </div>
            </div>

            {/* Error message */}
            {activeResult.error && (
              <div className="border border-red-500/30 bg-red-900/10 rounded px-2.5 py-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span className="text-[0.58rem] text-red-400">错误详情</span>
                </div>
                <p className="text-[0.58rem] text-slate-500">
                  {activeResult.error}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[0.62rem] text-slate-700 py-2">
            暂无检测数据。
            {heartbeatEnabled
              ? `将在 ${heartbeatIntervalMs / 1000}s 内自动执行首次检测。`
              : "请启用心跳检测。"}
          </div>
        )}
      </div>

      {/* Latency Trend Chart */}
      <div className="border border-[var(--ide-border-faint)] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[0.72rem] text-slate-300">延迟趋势</span>
          <span className="text-[0.5rem] text-slate-700 ml-auto">
            {latencyHistory.length} 条记录
          </span>
        </div>

        {latencyHistory.length > 1 ? (
          (() => {
            const chartData = latencyHistory.map((r, i) => ({
              idx: i,
              time: new Date(r.timestamp).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              latency: r.latencyMs ?? 0,
              status: r.status,
            }));
            const validLatencies = chartData
              .filter((d) => d.latency > 0)
              .map((d) => d.latency);
            const avgLatency =
              validLatencies.length > 0
                ? Math.round(
                    validLatencies.reduce((a, b) => a + b, 0) /
                      validLatencies.length,
                  )
                : 0;
            const maxLatency =
              validLatencies.length > 0 ? Math.max(...validLatencies) : 100;
            const successRate =
              latencyHistory.length > 0
                ? Math.round(
                    (latencyHistory.filter((r) => r.status === "success")
                      .length /
                      latencyHistory.length) *
                      100,
                  )
                : 0;

            return (
              <>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
                    >
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 8, fill: "#4a5568" }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={{ stroke: "#1e3a5f", strokeWidth: 0.5 }}
                      />
                      <YAxis
                        tick={{ fontSize: 8, fill: "#4a5568" }}
                        tickLine={false}
                        axisLine={{ stroke: "#1e3a5f", strokeWidth: 0.5 }}
                        domain={[0, Math.ceil(maxLatency * 1.2)]}
                        unit="ms"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f1729",
                          border: "1px solid #1e3a5f",
                          borderRadius: "6px",
                          fontSize: "0.6rem",
                          color: "#94a3b8",
                          padding: "4px 8px",
                        }}
                        labelStyle={{ color: "#64748b", fontSize: "0.55rem" }}
                        formatter={(value: number, name: string) => [
                          `${value}ms`,
                          "延迟",
                        ]}
                      />
                      {avgLatency > 0 && (
                        <ReferenceLine
                          y={avgLatency}
                          stroke="#6366f1"
                          strokeDasharray="3 3"
                          strokeWidth={0.5}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="latency"
                        stroke="#38bdf8"
                        strokeWidth={1.5}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          const color =
                            payload.status === "fail" ? "#ef4444" : "#10b981";
                          return (
                            <circle
                              key={`dot-${payload.idx}`}
                              cx={cx}
                              cy={cy}
                              r={2.5}
                              fill={color}
                              stroke="none"
                            />
                          );
                        }}
                        activeDot={{
                          r: 4,
                          fill: "#38bdf8",
                          stroke: "#0f1729",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5 text-center">
                    <div className="text-[0.48rem] text-slate-700">
                      平均延迟
                    </div>
                    <div className="text-[0.72rem] text-sky-400">
                      {avgLatency}ms
                    </div>
                  </div>
                  <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5 text-center">
                    <div className="text-[0.48rem] text-slate-700">
                      最大延迟
                    </div>
                    <div className="text-[0.72rem] text-amber-400">
                      {Math.round(maxLatency)}ms
                    </div>
                  </div>
                  <div className="bg-[var(--ide-bg-inset)] rounded-md px-2 py-1.5 text-center">
                    <div className="text-[0.48rem] text-slate-700">成功率</div>
                    <div
                      className={`text-[0.72rem] ${successRate >= 80 ? "text-emerald-400" : successRate >= 50 ? "text-amber-400" : "text-red-400"}`}
                    >
                      {successRate}%
                    </div>
                  </div>
                </div>
              </>
            );
          })()
        ) : (
          <div className="h-[120px] flex items-center justify-center border border-dashed border-[var(--ide-border-faint)] rounded bg-[var(--ide-bg-inset)]">
            <div className="text-center">
              <TrendingUp className="w-5 h-5 text-slate-700 mx-auto mb-1" />
              <p className="text-[0.6rem] text-slate-700">
                需要至少 2 次心跳检测才能显示趋势
              </p>
              <p className="text-[0.5rem] text-slate-800 mt-0.5">
                {heartbeatEnabled ? "数据收集中..." : "请启用心跳检测"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="border border-dashed border-[var(--ide-border-faint)] rounded-lg p-2.5">
        <div className="flex items-center gap-1 mb-1">
          <Bot className="w-3 h-3 text-purple-400" />
          <span className="text-[0.62rem] text-slate-500">配置建议</span>
        </div>
        <ul className="space-y-1">
          <li className="text-[0.58rem] text-slate-600 flex items-start gap-1">
            <span className="text-sky-400 mt-0.5">•</span>
            本地模型 (Ollama) 建议 10-30s 间隔
          </li>
          <li className="text-[0.58rem] text-slate-600 flex items-start gap-1">
            <span className="text-sky-400 mt-0.5">•</span>
            云端 API (OpenAI/DeepSeek) 建议 2-5m 间隔以节省配额
          </li>
          <li className="text-[0.58rem] text-slate-600 flex items-start gap-1">
            <span className="text-sky-400 mt-0.5">•</span>
            检测结果全局共享，LeftPanel Ping 也会更新此处状态
          </li>
        </ul>
      </div>
    </div>
  );
}

// ===== Proxy Tab — 代理配置控制面板 =====
function ProxyTab() {
  const [config, setConfig] = useState<ProxyConfig>(() => loadProxyConfig());
  const [healthStatus, setHealthStatus] = useState<{
    status: "idle" | "checking" | "healthy" | "unhealthy";
    latencyMs?: number;
    error?: string;
  }>({ status: "idle" });
  const [saved, setSaved] = useState(false);

  const handleToggle = () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    saveProxyConfig(updated);
  };

  const handleSave = () => {
    saveProxyConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleHealthCheck = async () => {
    setHealthStatus({ status: "checking" });
    const result = await checkProxyHealth(config.baseUrl);
    setHealthStatus({
      status: result.healthy ? "healthy" : "unhealthy",
      latencyMs: result.latencyMs,
      error: result.error,
    });
  };

  return (
    <div className="p-2 space-y-2">
      {/* 架构说明 */}
      <div className="border border-sky-500/20 bg-sky-900/10 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Server className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[0.68rem] text-sky-300">后端代理层</span>
        </div>
        <p className="text-[0.58rem] text-slate-500 mb-1.5">
          代理模式: 前端 → 代理服务器 → LLM Provider
        </p>
        <div className="flex items-center gap-3 text-[0.52rem] text-slate-600">
          <span>解决 CORS</span>
          <span>·</span>
          <span>API Key 安全</span>
          <span>·</span>
          <span>速率限制</span>
          <span>·</span>
          <span>审计日志</span>
        </div>
      </div>

      {/* 代理开关 */}
      <div className="border border-[var(--ide-border-faint)] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Wifi
              className={`w-4 h-4 ${config.enabled ? "text-emerald-400" : "text-slate-600"}`}
            />
            <span className="text-[0.72rem] text-slate-300">启用代理</span>
          </div>
          <button
            onClick={handleToggle}
            className={`relative w-10 h-5 rounded-full transition-colors ${config.enabled ? "bg-emerald-600" : "bg-slate-700"}`}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: config.enabled ? "22px" : "2px" }}
            />
          </button>
        </div>

        <p className="text-[0.58rem] text-slate-600 mb-3">
          {config.enabled
            ? "所有 LLM API 请求将通过代理服务器转发，API Key 由服务端管理"
            : "直连模式 — 请求直发至 Provider（需自行处理 CORS 和 Key 安全）"}
        </p>

        {/* 代理 URL */}
        <div className="mb-2">
          <label className="text-[0.58rem] text-slate-500 mb-1 block">
            代理端点 URL
          </label>
          <input
            value={config.baseUrl}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))
            }
            className="w-full bg-[var(--ide-bg-inset)] border border-[var(--ide-border-faint)] rounded px-2 py-1.5 text-[0.62rem] text-slate-300 font-mono focus:outline-none focus:border-sky-500/30"
            placeholder="http://localhost:3001/api/proxy"
          />
        </div>

        {/* Auth Token */}
        <div className="mb-2">
          <label className="text-[0.58rem] text-slate-500 mb-1 block">
            认证 Token (前端→代理)
          </label>
          <input
            value={config.authToken || ""}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, authToken: e.target.value }))
            }
            type="password"
            className="w-full bg-[var(--ide-bg-inset)] border border-[var(--ide-border-faint)] rounded px-2 py-1.5 text-[0.62rem] text-slate-300 font-mono focus:outline-none focus:border-sky-500/30"
            placeholder="可选 · 用于验证前端身份"
          />
        </div>

        {/* 参数 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[0.52rem] text-slate-600 mb-0.5 block">
              超时 (ms)
            </label>
            <input
              type="number"
              value={config.timeout}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  timeout: Number(e.target.value),
                }))
              }
              className="w-full bg-[var(--ide-bg-inset)] border border-[var(--ide-border-faint)] rounded px-2 py-1 text-[0.58rem] text-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[0.52rem] text-slate-600 mb-0.5 block">
              速率限制 (/min)
            </label>
            <input
              type="number"
              value={config.rateLimitPerMin}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  rateLimitPerMin: Number(e.target.value),
                }))
              }
              className="w-full bg-[var(--ide-bg-inset)] border border-[var(--ide-border-faint)] rounded px-2 py-1 text-[0.58rem] text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* 保存 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded text-[0.58rem] bg-sky-600/30 text-sky-300 hover:bg-sky-600/50 transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                已保存
              </>
            ) : (
              "保存配置"
            )}
          </button>
          <button
            onClick={handleHealthCheck}
            className="px-3 py-1.5 rounded text-[0.58rem] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
          >
            {healthStatus.status === "checking" ? (
              <>
                <RotateCcw className="w-3 h-3 inline mr-1 animate-spin" />
                检测中
              </>
            ) : (
              "健康检查"
            )}
          </button>
        </div>
      </div>

      {/* 健康状态 */}
      {healthStatus.status !== "idle" && (
        <div
          className={`border rounded-lg p-2.5 ${
            healthStatus.status === "healthy"
              ? "border-emerald-500/30 bg-emerald-900/10"
              : healthStatus.status === "unhealthy"
                ? "border-red-500/30 bg-red-900/10"
                : "border-sky-500/30 bg-sky-900/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                healthStatus.status === "healthy"
                  ? "bg-emerald-500"
                  : healthStatus.status === "unhealthy"
                    ? "bg-red-500"
                    : "bg-sky-500 animate-pulse"
              }`}
            />
            <span
              className={`text-[0.65rem] ${
                healthStatus.status === "healthy"
                  ? "text-emerald-400"
                  : healthStatus.status === "unhealthy"
                    ? "text-red-400"
                    : "text-sky-400"
              }`}
            >
              {healthStatus.status === "healthy"
                ? "代理服务正常"
                : healthStatus.status === "unhealthy"
                  ? "代理服务异常"
                  : "检测中..."}
            </span>
            {healthStatus.latencyMs !== undefined && (
              <span className="text-[0.55rem] text-slate-600 ml-auto">
                {healthStatus.latencyMs}ms
              </span>
            )}
          </div>
          {healthStatus.error && (
            <p className="text-[0.55rem] text-red-400/70 mt-1 pl-4">
              {healthStatus.error}
            </p>
          )}
        </div>
      )}

      {/* 部署选项 */}
      <div className="border border-[var(--ide-border-faint)] rounded-lg p-2.5">
        <div className="flex items-center gap-1 mb-2">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[0.62rem] text-slate-400">推荐部署方案</span>
        </div>
        <div className="space-y-1.5">
          {[
            {
              name: "Cloudflare Workers",
              desc: "零延迟边缘代理，免费 tier",
              tag: "推荐",
              tagColor: "text-emerald-400 bg-emerald-900/30",
            },
            {
              name: "Vercel Edge Functions",
              desc: "与前端同域部署",
              tag: "简单",
              tagColor: "text-sky-400 bg-sky-900/30",
            },
            {
              name: "Supabase Edge Functions",
              desc: "集成 Supabase 生态",
              tag: "集成",
              tagColor: "text-purple-400 bg-purple-900/30",
            },
            {
              name: "自建 Node.js 服务",
              desc: "完全控制，自定义逻辑",
              tag: "灵活",
              tagColor: "text-amber-400 bg-amber-900/30",
            },
          ].map((opt) => (
            <div
              key={opt.name}
              className="flex items-center gap-2 bg-[var(--ide-bg-inset)] rounded px-2 py-1.5"
            >
              <Server className="w-3 h-3 text-slate-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[0.62rem] text-slate-300">{opt.name}</div>
                <div className="text-[0.5rem] text-slate-600">{opt.desc}</div>
              </div>
              <span
                className={`text-[0.48rem] px-1.5 py-0.5 rounded-full ${opt.tagColor}`}
              >
                {opt.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 安全提示 */}
      <div className="border border-dashed border-amber-500/20 rounded-lg p-2.5">
        <div className="flex items-center gap-1 mb-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span className="text-[0.62rem] text-amber-400/80">安全须知</span>
        </div>
        <ul className="space-y-0.5">
          <li className="text-[0.55rem] text-slate-600">
            · API Key 应存储在代理服务器环境变量中，切勿前端硬编码
          </li>
          <li className="text-[0.55rem] text-slate-600">
            · 前端→代理 使用 X-Proxy-Auth Token 认证
          </li>
          <li className="text-[0.55rem] text-slate-600">
            · 代理服务器应配置速率限制防止滥用
          </li>
          <li className="text-[0.55rem] text-slate-600">
            · 生产环境建议启用 HTTPS 和请求日志
          </li>
        </ul>
      </div>
    </div>
  );
}

// ===== Errors Tab — 错误历史可视化面板 =====

const SEVERITY_CFG: Record<
  ErrorSeverity,
  { label: string; color: string; bg: string; dot: string }
> = {
  fatal: {
    label: "致命",
    color: "text-red-500",
    bg: "bg-red-500/15",
    dot: "bg-red-500",
  },
  error: {
    label: "错误",
    color: "text-red-400",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
  },
  warning: {
    label: "警告",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    dot: "bg-amber-400",
  },
  info: {
    label: "信息",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    dot: "bg-sky-400",
  },
  debug: {
    label: "调试",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    dot: "bg-slate-500",
  },
};

const CAT_LABELS: Record<string, { label: string; color: string }> = {
  route: { label: "路由", color: "text-violet-400" },
  render: { label: "渲染", color: "text-rose-400" },
  network: { label: "网络", color: "text-sky-400" },
  chunk_load: { label: "加载", color: "text-amber-400" },
  unhandled: { label: "未捕获", color: "text-red-400" },
  promise: { label: "Promise", color: "text-orange-400" },
  ai_service: { label: "AI服务", color: "text-purple-400" },
  editor: { label: "编辑器", color: "text-cyan-400" },
  file_system: { label: "文件系统", color: "text-emerald-400" },
  plugin: { label: "插件", color: "text-indigo-400" },
  unknown: { label: "未知", color: "text-slate-500" },
};

const ERR_PIE_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#64748b",
  "#14b8a6",
];

function ErrorsTab() {
  const [events, setEvents] = useState<ErrorEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | "all">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadEvents = useCallback(() => {
    const all = errorReporting.getLocalEvents();
    setEvents(all.slice().reverse());
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshKey]);

  useEffect(() => {
    const t = setInterval(() => setRefreshKey((k) => k + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  const summary = errorReporting.getErrorSummary();

  const filtered = events.filter((e) => {
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    return true;
  });

  const timelineData = (() => {
    const buckets = new Map<
      string,
      {
        time: string;
        fatal: number;
        error: number;
        warning: number;
        info: number;
        debug: number;
      }
    >();
    for (const e of events) {
      const d = new Date(e.timestamp);
      const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
      if (!buckets.has(key))
        buckets.set(key, {
          time: key,
          fatal: 0,
          error: 0,
          warning: 0,
          info: 0,
          debug: 0,
        });
      const b = buckets.get(key)!;
      if (e.severity in b) (b as any)[e.severity]++;
    }
    return [...buckets.values()].slice(-24);
  })();

  const categoryPieData = Object.entries(summary.byCategory).map(
    ([cat, count]) => ({
      name: CAT_LABELS[cat]?.label || cat,
      value: count,
    }),
  );

  const handleClear = () => {
    errorReporting.clearLocalEvents();
    setEvents([]);
  };

  const formatTs = (ts: number) =>
    new Date(ts).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  // 多来源面板溯源检测 — 统一面包屑机制
  const sourcePanel = (() => {
    const SOURCE_PANELS: {
      keyword: string;
      label: string;
      color: string;
      bgColor: string;
      borderColor: string;
      desc: string;
    }[] = [
      {
        keyword: "性能监控",
        label: "性能面板",
        color: "text-purple-400",
        bgColor: "bg-purple-500/[0.06]",
        borderColor: "border-purple-500/15",
        desc: '通过 "近期错误" 入口跳转',
      },
      {
        keyword: "安全扫描",
        label: "安全扫描",
        color: "text-rose-400",
        bgColor: "bg-rose-500/[0.06]",
        borderColor: "border-rose-500/15",
        desc: "通过安全扫描面板跳转",
      },
      {
        keyword: "代码质量",
        label: "代码质量",
        color: "text-amber-400",
        bgColor: "bg-amber-500/[0.06]",
        borderColor: "border-amber-500/15",
        desc: "通过代码质量面板跳转",
      },
      {
        keyword: "诊断工具",
        label: "诊断工具",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/[0.06]",
        borderColor: "border-cyan-500/15",
        desc: "通过诊断工具面板跳转",
      },
      {
        keyword: "测试生成",
        label: "测试生成",
        color: "text-green-400",
        bgColor: "bg-green-500/[0.06]",
        borderColor: "border-green-500/15",
        desc: "通过测试生成面板跳转",
      },
      {
        keyword: "AI 对话",
        label: "AI 对话",
        color: "text-blue-400",
        bgColor: "bg-blue-500/[0.06]",
        borderColor: "border-blue-500/15",
        desc: "通过 AI 对话面板跳转",
      },
    ];
    try {
      const crumbs = errorReporting.getRecentBreadcrumbs?.(10) ?? [];
      // 从最近的面包屑反向搜索，找到第一个"打开面板: 智能运维"之前的来源面板操作
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const bc = crumbs[i];
        if (bc.category !== "panel" || Date.now() - bc.timestamp > 30_000)
          continue;
        // 跳过自身（智能运维）
        if (bc.message.includes("智能运维")) continue;
        // 匹配来源面板
        for (const src of SOURCE_PANELS) {
          if (bc.message.includes(src.keyword)) return src;
        }
      }
    } catch {
      /* 静默容错 */
    }
    return null;
  })();

  return (
    <div className="p-2 space-y-2">
      {/* Source tracing — 多来源双向溯源标记 */}
      {sourcePanel && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${sourcePanel.bgColor} border ${sourcePanel.borderColor}`}
        >
          <Gauge className={`w-3 h-3 ${sourcePanel.color} flex-shrink-0`} />
          <span className={`text-[0.58rem] ${sourcePanel.color} opacity-80`}>
            来源: {sourcePanel.label}
          </span>
          <span className="text-[0.48rem] text-slate-600 ml-auto">
            {sourcePanel.desc}
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="border border-[var(--ide-border-faint)] rounded-lg p-2 text-center">
          <div className="text-[0.48rem] text-slate-700 mb-0.5">总计</div>
          <div className="text-[0.9rem] text-slate-200">{summary.total}</div>
        </div>
        <div className="border border-red-500/20 rounded-lg p-2 text-center">
          <div className="text-[0.48rem] text-slate-700 mb-0.5">错误</div>
          <div className="text-[0.9rem] text-red-400">
            {(summary.bySeverity["error"] || 0) +
              (summary.bySeverity["fatal"] || 0)}
          </div>
        </div>
        <div className="border border-amber-500/20 rounded-lg p-2 text-center">
          <div className="text-[0.48rem] text-slate-700 mb-0.5">警告</div>
          <div className="text-[0.9rem] text-amber-400">
            {summary.bySeverity["warning"] || 0}
          </div>
        </div>
        <div className="border border-sky-500/20 rounded-lg p-2 text-center">
          <div className="text-[0.48rem] text-slate-700 mb-0.5">信息</div>
          <div className="text-[0.9rem] text-sky-400">
            {(summary.bySeverity["info"] || 0) +
              (summary.bySeverity["debug"] || 0)}
          </div>
        </div>
      </div>

      {/* Timeline chart */}
      {timelineData.length > 1 && (
        <div className="border border-[var(--ide-border-faint)] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[0.72rem] text-slate-300">错误时间线</span>
          </div>
          <div className="h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
                margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
              >
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 7, fill: "#4a5568" }}
                  tickLine={false}
                  axisLine={{ stroke: "#1e3a5f", strokeWidth: 0.5 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 8, fill: "#4a5568" }}
                  tickLine={false}
                  axisLine={{ stroke: "#1e3a5f", strokeWidth: 0.5 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1729",
                    border: "1px solid #1e3a5f",
                    borderRadius: "6px",
                    fontSize: "0.6rem",
                    color: "#94a3b8",
                    padding: "4px 8px",
                  }}
                  labelStyle={{ color: "#64748b", fontSize: "0.55rem" }}
                />
                <Bar dataKey="fatal" stackId="a" fill="#ef4444" />
                <Bar dataKey="error" stackId="a" fill="#f87171" />
                <Bar dataKey="warning" stackId="a" fill="#f59e0b" />
                <Bar dataKey="info" stackId="a" fill="#38bdf8" />
                <Bar
                  dataKey="debug"
                  stackId="a"
                  fill="#64748b"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-3 mt-1.5">
            {(["fatal", "error", "warning", "info"] as ErrorSeverity[]).map(
              (s) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-sm ${SEVERITY_CFG[s].dot}`}
                  />
                  <span className="text-[0.48rem] text-slate-600">
                    {SEVERITY_CFG[s].label}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Category distribution (pie) */}
      {categoryPieData.length > 0 && (
        <div className="border border-[var(--ide-border-faint)] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[0.72rem] text-slate-300">分类分布</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[100px] h-[100px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={42}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryPieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={ERR_PIE_COLORS[i % ERR_PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f1729",
                      border: "1px solid #1e3a5f",
                      borderRadius: "6px",
                      fontSize: "0.6rem",
                      color: "#94a3b8",
                      padding: "4px 8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {categoryPieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{
                      backgroundColor:
                        ERR_PIE_COLORS[i % ERR_PIE_COLORS.length],
                    }}
                  />
                  <span className="text-[0.58rem] text-slate-400 flex-1">
                    {d.name}
                  </span>
                  <span className="text-[0.58rem] text-slate-500">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters + actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setSeverityFilter("all")}
          className={`px-1.5 py-0.5 rounded text-[0.55rem] transition-colors ${severityFilter === "all" ? "bg-white/10 text-slate-300" : "text-slate-600 hover:text-slate-400"}`}
        >
          全部
        </button>
        {(
          ["fatal", "error", "warning", "info", "debug"] as ErrorSeverity[]
        ).map((s) => {
          const cfg = SEVERITY_CFG[s];
          return (
            <button
              key={s}
              onClick={() =>
                setSeverityFilter(severityFilter === s ? "all" : s)
              }
              className={`px-1.5 py-0.5 rounded text-[0.55rem] transition-colors ${severityFilter === s ? `${cfg.bg} ${cfg.color}` : "text-slate-600 hover:text-slate-400"}`}
            >
              {cfg.label}
            </button>
          );
        })}
        <span className="flex-1" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[var(--ide-bg-inset)] border border-[var(--ide-border-faint)] rounded px-1.5 py-0.5 text-[0.55rem] text-slate-400 focus:outline-none"
        >
          <option value="all">全部分类</option>
          {Object.entries(CAT_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 text-slate-600 transition-colors"
          title="刷新"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        {events.length > 0 && (
          <button
            onClick={handleClear}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
            title="清空所有"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Event list */}
      <div className="border border-[var(--ide-border-faint)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
          <Bug className="w-3 h-3 text-red-400" />
          <span className="text-[0.62rem] text-slate-500">错误事件</span>
          <span className="text-[0.5rem] text-slate-700 ml-auto">
            {filtered.length} / {events.length}
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--ide-border-faint)]">
            {filtered.map((evt) => {
              const sCfg = SEVERITY_CFG[evt.severity] || SEVERITY_CFG.error;
              const cCfg = CAT_LABELS[evt.category] || CAT_LABELS.unknown;
              const isExpanded = expandedId === evt.id;
              return (
                <div
                  key={evt.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                    className="w-full text-left px-2.5 py-2 flex items-start gap-2"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${sCfg.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.62rem] text-slate-300 truncate">
                        {evt.message}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[0.48rem] px-1 py-0.5 rounded ${sCfg.bg} ${sCfg.color}`}
                        >
                          {sCfg.label}
                        </span>
                        <span className={`text-[0.48rem] ${cCfg.color}`}>
                          {cCfg.label}
                        </span>
                        {evt.route && (
                          <span className="text-[0.48rem] text-slate-700 font-mono">
                            {evt.route}
                          </span>
                        )}
                        <span className="text-[0.48rem] text-slate-700 ml-auto">
                          {formatTs(evt.timestamp)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-700 flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 pt-0 ml-6">
                      {evt.stack && (
                        <div className="mb-2">
                          <div className="text-[0.5rem] text-slate-600 mb-0.5">
                            堆栈信息
                          </div>
                          <pre className="text-[0.5rem] text-slate-600 font-mono bg-[var(--ide-bg-dark)] rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap border border-[var(--ide-border-faint)]">
                            {evt.stack}
                          </pre>
                        </div>
                      )}
                      {evt.componentStack && (
                        <div className="mb-2">
                          <div className="text-[0.5rem] text-slate-600 mb-0.5">
                            组件堆栈
                          </div>
                          <pre className="text-[0.5rem] text-purple-400/70 font-mono bg-[var(--ide-bg-dark)] rounded p-2 overflow-auto max-h-24 whitespace-pre-wrap border border-[var(--ide-border-faint)]">
                            {evt.componentStack}
                          </pre>
                        </div>
                      )}
                      {evt.breadcrumbs.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[0.5rem] text-slate-600 mb-0.5">
                            操作面包屑 ({evt.breadcrumbs.length})
                          </div>
                          <div className="space-y-0.5 max-h-24 overflow-y-auto">
                            {evt.breadcrumbs.slice(-8).map((bc, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 text-[0.48rem]"
                              >
                                <span className="text-slate-700 w-12 flex-shrink-0">
                                  {new Date(bc.timestamp).toLocaleTimeString(
                                    "zh-CN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    },
                                  )}
                                </span>
                                <span className="text-sky-400/60 px-1 rounded bg-sky-500/5">
                                  {bc.type}
                                </span>
                                <span className="text-slate-500 truncate">
                                  {bc.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {Object.keys(evt.context).length > 0 && (
                        <div className="mb-2">
                          <div className="text-[0.5rem] text-slate-600 mb-0.5">
                            上下文
                          </div>
                          <pre className="text-[0.48rem] text-slate-600 font-mono bg-[var(--ide-bg-dark)] rounded p-2 overflow-auto max-h-20 whitespace-pre-wrap border border-[var(--ide-border-faint)]">
                            {JSON.stringify(evt.context, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div>
                        <div className="text-[0.5rem] text-slate-600 mb-0.5">
                          环境
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[0.48rem]">
                          <span className="text-slate-700">
                            版本:{" "}
                            <span className="text-slate-500">
                              {evt.environment.appVersion}
                            </span>
                          </span>
                          <span className="text-slate-700">
                            环境:{" "}
                            <span className="text-slate-500">
                              {evt.environment.buildMode}
                            </span>
                          </span>
                          <span className="text-slate-700">
                            屏幕:{" "}
                            <span className="text-slate-500">
                              {evt.environment.screenSize}
                            </span>
                          </span>
                          <span className="text-slate-700">
                            上报:{" "}
                            <span
                              className={
                                evt.reported
                                  ? "text-emerald-400"
                                  : "text-amber-400"
                              }
                            >
                              {evt.reported ? "已上报" : "未上报"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[140px] flex items-center justify-center">
            <div className="text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500/40 mx-auto mb-1" />
              <p className="text-[0.62rem] text-slate-600">
                {events.length > 0 ? "当前筛选条件无匹���" : "暂无错误记录"}
              </p>
              <p className="text-[0.5rem] text-slate-700 mt-0.5">
                {events.length > 0 ? "尝试调整筛选条件" : "系统运行正常"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
