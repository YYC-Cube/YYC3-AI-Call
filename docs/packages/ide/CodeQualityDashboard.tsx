/**
 * @file CodeQualityDashboard.tsx
 * @description 统一代码质量仪表盘，聚合 ErrorAnalyzer + PerformanceOptimizer + SecurityScanner，
 *              提供全局评分、趋势折线图、类别分布、雷达图、快捷入口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags dashboard,quality,metrics,charts,analysis
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  BarChart3,
  RefreshCw,
  Bug,
  Gauge,
  ShieldAlert,
  FlaskConical,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Trash2,
  Clock,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { PanelHeader, usePanelManager } from "./PanelManager";
import { useFileStore } from "./FileStore";
import { analyzeProject, type ProjectAnalysisResult } from "./ai/ErrorAnalyzer";
import {
  analyzeProjectPerformance,
  type ProjectPerformanceReport,
} from "./ai/PerformanceOptimizer";
import { scanProject, type ProjectSecurityReport } from "./ai/SecurityScanner";
import {
  generateProjectTestPlan,
  type ProjectTestPlan,
} from "./ai/TestGenerator";
import { loadJSON, saveJSON } from "./constants/storage-keys";
import { RecentErrorsEntry } from "./RecentErrorsEntry";

// ── Types ──

interface QualitySnapshot {
  diagnostics: ProjectAnalysisResult | null;
  performance: ProjectPerformanceReport | null;
  security: ProjectSecurityReport | null;
  testPlan: ProjectTestPlan | null;
  overallScore: number;
  analyzedAt: number;
}

interface HistoryEntry {
  timestamp: number;
  overall: number;
  diagnostics: number;
  performance: number;
  security: number;
  testing: number;
}

const SK_QUALITY_HISTORY = "yyc3_quality_history";
const MAX_HISTORY = 30;

// ── Score calculation ──

function calcDiagScore(diag: ProjectAnalysisResult | null): number {
  if (!diag) return 100;
  return Math.max(
    0,
    100 - diag.totalErrors * 10 - diag.totalWarnings * 3 - diag.totalInfos * 1,
  );
}

function calcPerfScore(perf: ProjectPerformanceReport | null): number {
  return perf?.overallScore ?? 100;
}

function calcSecScore(sec: ProjectSecurityReport | null): number {
  if (!sec) return 100;
  return Math.max(0, 100 - sec.overallRiskScore);
}

function calcTestScore(plan: ProjectTestPlan | null): number {
  if (!plan) return 0;
  return Math.min(100, plan.totalTests * 2); // heuristic
}

function calcOverallScore(
  diag: ProjectAnalysisResult | null,
  perf: ProjectPerformanceReport | null,
  sec: ProjectSecurityReport | null,
): number {
  const scores: number[] = [];
  if (diag) scores.push(calcDiagScore(diag));
  if (perf) scores.push(calcPerfScore(perf));
  if (sec) scores.push(calcSecScore(sec));
  if (scores.length === 0) return 100;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── Grade ──

function getGrade(score: number): {
  letter: string;
  color: string;
  bg: string;
} {
  if (score >= 90)
    return { letter: "A", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (score >= 80)
    return { letter: "B", color: "text-sky-400", bg: "bg-sky-500/10" };
  if (score >= 70)
    return { letter: "C", color: "text-amber-400", bg: "bg-amber-500/10" };
  if (score >= 60)
    return { letter: "D", color: "text-orange-400", bg: "bg-orange-500/10" };
  return { letter: "F", color: "text-red-400", bg: "bg-red-500/10" };
}

// ── History persistence ──

function loadHistory(): HistoryEntry[] {
  return loadJSON<HistoryEntry[]>(SK_QUALITY_HISTORY, []);
}

function saveHistory(entries: HistoryEntry[]): void {
  saveJSON(SK_QUALITY_HISTORY, entries.slice(-MAX_HISTORY));
}

// ── Custom tooltip ──

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-md px-2.5 py-1.5 shadow-xl">
      <div className="text-[0.55rem] text-[var(--ide-text-dim)] mb-1">
        {label}
      </div>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          className="flex items-center gap-1.5 text-[0.6rem]"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-[var(--ide-text-secondary)]">{p.name}</span>
          <span className="text-[var(--ide-text-primary)] ml-auto">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Tabs ──

type DashboardTab = "overview" | "trend" | "radar";

// ── Component ──

export default function CodeQualityDashboard({ nodeId }: { nodeId: string }) {
  const { fileContents } = useFileStore();
  const ctx = usePanelManager();
  const [snapshot, setSnapshot] = useState<QualitySnapshot | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runFullAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    queueMicrotask(() => {
      const diagnostics = analyzeProject(fileContents);
      const performance = analyzeProjectPerformance(fileContents);
      const security = scanProject(fileContents);
      const testPlan = generateProjectTestPlan(fileContents);
      const overallScore = calcOverallScore(diagnostics, performance, security);

      if (snapshot) setPrevScore(snapshot.overallScore);

      const newSnapshot: QualitySnapshot = {
        diagnostics,
        performance,
        security,
        testPlan,
        overallScore,
        analyzedAt: Date.now(),
      };
      setSnapshot(newSnapshot);

      // Record history
      const entry: HistoryEntry = {
        timestamp: Date.now(),
        overall: overallScore,
        diagnostics: calcDiagScore(diagnostics),
        performance: calcPerfScore(performance),
        security: calcSecScore(security),
        testing: calcTestScore(testPlan),
      };
      setHistory((prev) => {
        const next = [...prev, entry].slice(-MAX_HISTORY);
        saveHistory(next);
        return next;
      });

      setIsAnalyzing(false);
    });
  }, [fileContents, snapshot]);

  useEffect(() => {
    timer.current = setTimeout(runFullAnalysis, 600);
    return () => clearTimeout(timer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to sub-panel
  const openPanel = useCallback(
    (panelId: string) => {
      if (!ctx) return;
      ctx.splitPanel(nodeId, "horizontal", panelId as any);
    },
    [ctx, nodeId],
  );

  // Score trend
  const scoreTrend = useMemo(() => {
    if (prevScore === null || !snapshot) return 0;
    return snapshot.overallScore - prevScore;
  }, [prevScore, snapshot]);

  const grade = snapshot ? getGrade(snapshot.overallScore) : getGrade(100);

  // ── History chart data ──
  const chartData = useMemo(() => {
    return history.map((h) => ({
      time: new Date(h.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      overall: h.overall,
      diagnostics: h.diagnostics,
      performance: h.performance,
      security: h.security,
      testing: h.testing,
    }));
  }, [history]);

  // ── Radar chart data ──
  const radarData = useMemo(() => {
    if (!snapshot) return [];
    return [
      { dim: "诊断", score: calcDiagScore(snapshot.diagnostics) },
      { dim: "性能", score: calcPerfScore(snapshot.performance) },
      { dim: "安全", score: calcSecScore(snapshot.security) },
      { dim: "测试", score: calcTestScore(snapshot.testPlan) },
    ];
  }, [snapshot]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  // ── Dimension cards data ──
  const dimensions = useMemo(() => {
    if (!snapshot) return [];

    const d = snapshot.diagnostics;
    const p = snapshot.performance;
    const s = snapshot.security;
    const t = snapshot.testPlan;

    return [
      {
        id: "diagnostics",
        icon: Bug,
        label: "代码诊断",
        color: "text-red-400",
        bgColor: "bg-red-500/[0.06]",
        borderColor: "border-red-500/10",
        score: calcDiagScore(d),
        stats: d
          ? [
              { label: "错误", value: d.totalErrors, color: "text-red-400" },
              {
                label: "警告",
                value: d.totalWarnings,
                color: "text-amber-400",
              },
              { label: "信息", value: d.totalInfos, color: "text-blue-400" },
              { label: "文件", value: d.files.length, color: "text-slate-400" },
            ]
          : [],
        panelId: "diagnostics",
      },
      {
        id: "performance",
        icon: Gauge,
        label: "性能优化",
        color: "text-amber-400",
        bgColor: "bg-amber-500/[0.06]",
        borderColor: "border-amber-500/10",
        score: calcPerfScore(p),
        stats: p
          ? [
              {
                label: "高影响",
                value: p.topIssues.length,
                color: "text-red-400",
              },
              {
                label: "建议",
                value: p.files.reduce((s2, f) => s2 + f.suggestions.length, 0),
                color: "text-amber-400",
              },
              { label: "文件", value: p.files.length, color: "text-slate-400" },
            ]
          : [],
        panelId: "performance",
      },
      {
        id: "security",
        icon: ShieldAlert,
        label: "安全扫描",
        color: "text-rose-400",
        bgColor: "bg-rose-500/[0.06]",
        borderColor: "border-rose-500/10",
        score: calcSecScore(s),
        stats: s
          ? [
              { label: "严重", value: s.criticalCount, color: "text-red-500" },
              { label: "高危", value: s.highCount, color: "text-orange-400" },
              { label: "中危", value: s.mediumCount, color: "text-amber-400" },
              { label: "文件", value: s.files.length, color: "text-slate-400" },
            ]
          : [],
        panelId: "security",
      },
      {
        id: "testing",
        icon: FlaskConical,
        label: "测试覆盖",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/[0.06]",
        borderColor: "border-emerald-500/10",
        score: calcTestScore(t),
        stats: t
          ? [
              { label: "用例", value: t.totalTests, color: "text-emerald-400" },
              { label: "套件", value: t.suites.length, color: "text-sky-400" },
            ]
          : [],
        panelId: "test-gen",
      },
    ];
  }, [snapshot]);

  // Top issues across all dimensions
  const topIssues = useMemo(() => {
    if (!snapshot) return [];
    const issues: { text: string; severity: string; panel: string }[] = [];

    if (snapshot.diagnostics) {
      for (const file of snapshot.diagnostics.files) {
        for (const d of file.diagnostics) {
          if (d.severity === "error") {
            issues.push({
              text: d.message,
              severity: "error",
              panel: "diagnostics",
            });
          }
        }
      }
    }

    if (snapshot.security) {
      for (const f of snapshot.security.topFindings.slice(0, 3)) {
        issues.push({ text: f.title, severity: f.severity, panel: "security" });
      }
    }

    if (snapshot.performance) {
      for (const f of snapshot.performance.topIssues.slice(0, 2)) {
        issues.push({ text: f.title, severity: "high", panel: "performance" });
      }
    }

    return issues.slice(0, 6);
  }, [snapshot]);

  // ── Tab definitions ──
  const tabs: {
    id: DashboardTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "overview", label: "概览", icon: BarChart3 },
    { id: "trend", label: "趋势", icon: Activity },
    { id: "radar", label: "雷达", icon: Gauge },
  ];

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="quality"
        title="代码质量"
        icon={<BarChart3 className="w-3 h-3 text-sky-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={runFullAnalysis}
            disabled={isAnalyzing}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 text-slate-600 disabled:opacity-30 transition-colors"
            title="重新分析"
          >
            <RefreshCw
              className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </PanelHeader>

      {/* Tab Bar */}
      {snapshot && (
        <div className="flex-shrink-0 flex items-center gap-0 px-2 bg-[var(--ide-bg-surface)] border-b border-[var(--ide-border-faint)]">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[0.62rem] transition-colors border-b-2 ${
                  active
                    ? "border-[var(--ide-accent)] text-[var(--ide-accent)]"
                    : "border-transparent text-[var(--ide-text-dim)] hover:text-[var(--ide-text-secondary)]"
                }`}
              >
                <TabIcon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {!snapshot ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              {isAnalyzing ? (
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
              ) : (
                <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              )}
              <p className="text-[0.75rem] text-[var(--ide-text-secondary)]">
                {isAnalyzing ? "正在分析项目..." : "等待分析"}
              </p>
              <p className="text-[0.6rem] text-[var(--ide-text-dim)] mt-1">
                综合诊断 · 性能 · 安全 · 测试覆盖
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* ===== Overview Tab ===== */}
            {activeTab === "overview" && (
              <>
                {/* ── Overall Score ── */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)]">
                  <div
                    className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ${grade.bg} border-2 border-current/10`}
                  >
                    <span className={`text-[1.3rem] ${grade.color}`}>
                      {grade.letter}
                    </span>
                    <span className={`text-[0.5rem] ${grade.color} opacity-70`}>
                      {snapshot.overallScore}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.78rem] text-[var(--ide-text-primary)]">
                      综合代码质量
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {scoreTrend > 0 ? (
                        <span className="flex items-center gap-0.5 text-[0.6rem] text-emerald-400">
                          <TrendingUp className="w-3 h-3" />+{scoreTrend}
                        </span>
                      ) : scoreTrend < 0 ? (
                        <span className="flex items-center gap-0.5 text-[0.6rem] text-red-400">
                          <TrendingDown className="w-3 h-3" />
                          {scoreTrend}
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[0.6rem] text-slate-500">
                          <Minus className="w-3 h-3" />
                          无变化
                        </span>
                      )}
                      {history.length > 1 && (
                        <span className="text-[0.5rem] text-[var(--ide-text-dim)] ml-2">
                          ({history.length} 次分析)
                        </span>
                      )}
                    </div>

                    {/* Mini bar */}
                    <div className="w-full h-1.5 bg-[var(--ide-bg-deep)] rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          snapshot.overallScore >= 80
                            ? "bg-emerald-500"
                            : snapshot.overallScore >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${snapshot.overallScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Mini Trend Sparkline (inline) ── */}
                {chartData.length >= 2 && (
                  <div className="rounded-lg bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.58rem] text-[var(--ide-text-dim)] flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        最近趋势
                      </span>
                      <button
                        onClick={() => setActiveTab("trend")}
                        className="text-[0.52rem] text-[var(--ide-accent)] hover:underline"
                      >
                        详细 &rarr;
                      </button>
                    </div>
                    <div className="h-14">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 2, right: 4, bottom: 0, left: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="sparkGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#38bdf8"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#38bdf8"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="overall"
                            stroke="#38bdf8"
                            strokeWidth={1.5}
                            fill="url(#sparkGrad)"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* ── Dimension Cards ── */}
                <div className="grid grid-cols-2 gap-2">
                  {dimensions.map((dim) => {
                    const Icon = dim.icon;
                    const dimGrade = getGrade(dim.score);
                    return (
                      <button
                        key={dim.id}
                        onClick={() => openPanel(dim.panelId)}
                        className={`p-2.5 rounded-lg ${dim.bgColor} border ${dim.borderColor} hover:border-opacity-30 transition-all text-left group`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${dim.color}`} />
                            <span className="text-[0.65rem] text-[var(--ide-text-secondary)]">
                              {dim.label}
                            </span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-slate-500 transition-colors" />
                        </div>

                        {/* Score */}
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className={`text-[1rem] ${dimGrade.color}`}>
                            {dim.score}
                          </span>
                          <span className="text-[0.5rem] text-[var(--ide-text-dim)]">
                            /100
                          </span>
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {dim.stats.map((st) => (
                            <span key={st.label} className="text-[0.52rem]">
                              <span className={st.color}>{st.value}</span>
                              <span className="text-[var(--ide-text-dim)] ml-0.5">
                                {st.label}
                              </span>
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ── Top Issues ── */}
                {topIssues.length > 0 && (
                  <div className="rounded-lg border border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[var(--ide-border-faint)]">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="text-[0.65rem] text-[var(--ide-text-secondary)]">
                        优先处理 ({topIssues.length})
                      </span>
                    </div>
                    <div className="divide-y divide-[var(--ide-border-faint)]">
                      {topIssues.map((issue, i) => (
                        <button
                          key={i}
                          onClick={() => openPanel(issue.panel)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors text-left group"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              issue.severity === "critical"
                                ? "bg-red-500"
                                : issue.severity === "error"
                                  ? "bg-red-400"
                                  : issue.severity === "high"
                                    ? "bg-orange-400"
                                    : "bg-amber-400"
                            }`}
                          />
                          <span className="text-[0.6rem] text-[var(--ide-text-secondary)] truncate flex-1">
                            {issue.text}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Quick Actions ── */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openPanel("diagnostics")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] hover:border-[var(--ide-border-dim)] transition-colors text-[0.62rem] text-[var(--ide-text-secondary)]"
                  >
                    <Bug className="w-3 h-3 text-red-400" />
                    查看诊断
                  </button>
                  <button
                    onClick={() => openPanel("performance")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] hover:border-[var(--ide-border-dim)] transition-colors text-[0.62rem] text-[var(--ide-text-secondary)]"
                  >
                    <Gauge className="w-3 h-3 text-amber-400" />
                    性能优化
                  </button>
                  <button
                    onClick={() => openPanel("security")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] hover:border-[var(--ide-border-dim)] transition-colors text-[0.62rem] text-[var(--ide-text-secondary)]"
                  >
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    安全扫描
                  </button>
                  <button
                    onClick={() => openPanel("test-gen")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] hover:border-[var(--ide-border-dim)] transition-colors text-[0.62rem] text-[var(--ide-text-secondary)]"
                  >
                    <FlaskConical className="w-3 h-3 text-emerald-400" />
                    测试生成
                  </button>
                </div>
              </>
            )}

            {/* ===== Trend Tab ===== */}
            {activeTab === "trend" && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[0.68rem] text-[var(--ide-text-secondary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    历史趋势 ({history.length} 次分析)
                  </span>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.55rem] text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="清除历史记录"
                    >
                      <Trash2 className="w-3 h-3" />
                      清除
                    </button>
                  )}
                </div>

                {chartData.length < 2 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-[0.68rem] text-[var(--ide-text-dim)]">
                        至少需要 2 次分析才能显示趋势
                      </p>
                      <p className="text-[0.55rem] text-[var(--ide-text-dim)] mt-1">
                        点击上方刷新按钮运行新分析
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Overall Trend Chart */}
                    <div className="rounded-lg bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] p-3">
                      <div className="text-[0.6rem] text-[var(--ide-text-dim)] mb-2">
                        综合评分趋势
                      </div>
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
                            margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                          >
                            <defs>
                              <linearGradient
                                id="overallGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#38bdf8"
                                  stopOpacity={0.25}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#38bdf8"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="time"
                              tick={{
                                fontSize: 9,
                                fill: "var(--ide-text-dim, #475569)",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{
                                fontSize: 9,
                                fill: "var(--ide-text-dim, #475569)",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip content={<ChartTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="overall"
                              name="综合"
                              stroke="#38bdf8"
                              strokeWidth={2}
                              fill="url(#overallGrad)"
                              dot={{ r: 2.5, fill: "#38bdf8", strokeWidth: 0 }}
                              activeDot={{ r: 4, fill: "#38bdf8" }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Per-dimension Trend Chart */}
                    <div className="rounded-lg bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] p-3">
                      <div className="text-[0.6rem] text-[var(--ide-text-dim)] mb-2">
                        各维度评分
                      </div>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                          >
                            <XAxis
                              dataKey="time"
                              tick={{
                                fontSize: 9,
                                fill: "var(--ide-text-dim, #475569)",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{
                                fontSize: 9,
                                fill: "var(--ide-text-dim, #475569)",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip content={<ChartTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="diagnostics"
                              name="诊断"
                              stroke="#f87171"
                              strokeWidth={1.5}
                              dot={{ r: 2 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="performance"
                              name="性能"
                              stroke="#fbbf24"
                              strokeWidth={1.5}
                              dot={{ r: 2 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="security"
                              name="安全"
                              stroke="#fb7185"
                              strokeWidth={1.5}
                              dot={{ r: 2 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="testing"
                              name="测试"
                              stroke="#34d399"
                              strokeWidth={1.5}
                              dot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend */}
                      <div className="flex items-center justify-center gap-3 mt-2">
                        {[
                          { label: "诊断", color: "#f87171" },
                          { label: "性能", color: "#fbbf24" },
                          { label: "安全", color: "#fb7185" },
                          { label: "测试", color: "#34d399" },
                        ].map((l) => (
                          <span
                            key={l.label}
                            className="flex items-center gap-1 text-[0.52rem] text-[var(--ide-text-dim)]"
                          >
                            <span
                              className="w-2 h-1 rounded-full"
                              style={{ backgroundColor: l.color }}
                            />
                            {l.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* History Table */}
                    <div className="rounded-lg bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)]">
                      <div className="px-3 py-1.5 border-b border-[var(--ide-border-faint)] text-[0.6rem] text-[var(--ide-text-dim)]">
                        分析记录 (最近 {Math.min(history.length, 10)})
                      </div>
                      <div className="divide-y divide-[var(--ide-border-faint)]">
                        {history
                          .slice(-10)
                          .reverse()
                          .map((h, i) => {
                            const g = getGrade(h.overall);
                            return (
                              <div
                                key={h.timestamp}
                                className="flex items-center px-3 py-1.5 text-[0.58rem]"
                              >
                                <span className="text-[var(--ide-text-dim)] w-16 flex-shrink-0">
                                  {new Date(h.timestamp).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                                <span className={`${g.color} w-8`}>
                                  {g.letter}
                                </span>
                                <span className="text-[var(--ide-text-secondary)] w-8">
                                  {h.overall}
                                </span>
                                <div className="flex-1 flex gap-2 justify-end">
                                  <span className="text-red-400/70">
                                    {h.diagnostics}
                                  </span>
                                  <span className="text-amber-400/70">
                                    {h.performance}
                                  </span>
                                  <span className="text-rose-400/70">
                                    {h.security}
                                  </span>
                                  <span className="text-emerald-400/70">
                                    {h.testing}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ===== Radar Tab ===== */}
            {activeTab === "radar" && (
              <>
                {/* Radar Chart */}
                <div className="rounded-lg bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] p-3">
                  <div className="text-[0.6rem] text-[var(--ide-text-dim)] mb-2">
                    质量维度雷达图
                  </div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="75%"
                        data={radarData}
                      >
                        <PolarGrid stroke="var(--ide-border-dim, #1e293b)" />
                        <PolarAngleAxis
                          dataKey="dim"
                          tick={{
                            fontSize: 10,
                            fill: "var(--ide-text-secondary, #94a3b8)",
                          }}
                        />
                        <Radar
                          name="评分"
                          dataKey="score"
                          stroke="#38bdf8"
                          fill="#38bdf8"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-2">
                  {radarData.map((r) => {
                    const g = getGrade(r.score);
                    return (
                      <div
                        key={r.dim}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)]"
                      >
                        <span className="text-[0.68rem] text-[var(--ide-text-secondary)] w-12">
                          {r.dim}
                        </span>
                        <div className="flex-1 h-2 bg-[var(--ide-bg-deep)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              r.score >= 80
                                ? "bg-emerald-500"
                                : r.score >= 60
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${r.score}%` }}
                          />
                        </div>
                        <span
                          className={`text-[0.72rem] w-8 text-right ${g.color}`}
                        >
                          {r.score}
                        </span>
                        <span className={`text-[0.72rem] w-5 ${g.color}`}>
                          {g.letter}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Dimension Quick Nav */}
                <div className="flex flex-wrap gap-2">
                  {dimensions.map((dim) => {
                    const Icon = dim.icon;
                    return (
                      <button
                        key={dim.id}
                        onClick={() => openPanel(dim.panelId)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--ide-bg-surface)] border border-[var(--ide-border-faint)] hover:border-[var(--ide-border-dim)] transition-colors text-[0.62rem] text-[var(--ide-text-secondary)]"
                      >
                        <Icon className={`w-3 h-3 ${dim.color}`} />
                        {dim.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {snapshot && (
        <div className="flex-shrink-0 border-t border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
          <div className="h-6 px-3 flex items-center justify-between">
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              综合 {snapshot.overallScore}/100 · {grade.letter} 级 ·{" "}
              {history.length} 次
            </span>
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              {new Date(snapshot.analyzedAt).toLocaleTimeString()} 更新
            </span>
          </div>
          <RecentErrorsEntry />
        </div>
      )}
    </div>
  );
}
