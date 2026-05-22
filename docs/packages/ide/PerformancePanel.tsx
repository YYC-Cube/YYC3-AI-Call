/**
 * @file PerformancePanel.tsx
 * @description F2.3 智能性能优化建议面板，可视化展示 PerformanceOptimizer 的分析结果，
 *              支持按影响度过滤、分类统计、代码示例、文档链接
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,optimization,panel,react,analysis
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Gauge,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Search,
  RefreshCw,
  Zap,
  Cpu,
  Database,
  Layers,
  Image as ImageIcon,
  HardDrive,
  Wifi,
  Package,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  Bug,
} from "lucide-react";
import { PanelHeader, usePanelManager } from "./PanelManager";
import { useFileStore } from "./FileStore";
import {
  analyzeProjectPerformance,
  type ProjectPerformanceReport,
  type PerformanceSuggestion,
  type OptimizationCategory,
  type OptimizationImpact,
} from "./ai/PerformanceOptimizer";
import { useAIFixStore } from "./stores/useAIFixStore";
import { errorReporting } from "./services/ErrorReportingService";

// ── Category config ──

const CATEGORY_CONFIG: Record<
  OptimizationCategory,
  { icon: typeof Zap; label: string; color: string }
> = {
  render: { icon: Zap, label: "渲染优化", color: "text-amber-400" },
  state: { icon: Database, label: "状态管理", color: "text-blue-400" },
  "code-split": { icon: Layers, label: "代码分割", color: "text-violet-400" },
  memoization: { icon: Cpu, label: "缓存策略", color: "text-cyan-400" },
  resource: { icon: ImageIcon, label: "资源优化", color: "text-emerald-400" },
  memory: { icon: HardDrive, label: "内存管理", color: "text-rose-400" },
  network: { icon: Wifi, label: "网络优化", color: "text-sky-400" },
  bundle: { icon: Package, label: "打包优化", color: "text-orange-400" },
};

const IMPACT_CONFIG: Record<
  OptimizationImpact,
  { label: string; color: string; bgColor: string }
> = {
  high: { label: "高", color: "text-red-400", bgColor: "bg-red-500/15" },
  medium: { label: "中", color: "text-amber-400", bgColor: "bg-amber-500/15" },
  low: { label: "低", color: "text-blue-400", bgColor: "bg-blue-500/10" },
};

// ── Component ──

export default function PerformancePanel({ nodeId }: { nodeId: string }) {
  const { fileContents, setActiveFile } = useFileStore();
  const requestFix = useAIFixStore((s) => s.requestFix);

  const [report, setReport] = useState<ProjectPerformanceReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [impactFilter, setImpactFilter] = useState<Set<OptimizationImpact>>(
    new Set(["high", "medium", "low"]),
  );
  const [categoryFilter, setCategoryFilter] =
    useState<OptimizationCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Run analysis
  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    queueMicrotask(() => {
      const result = analyzeProjectPerformance(fileContents);
      setReport(result);
      setIsAnalyzing(false);
    });
  }, [fileContents]);

  // Auto-analyze on first render
  useEffect(() => {
    analysisTimer.current = setTimeout(runAnalysis, 800);
    return () => clearTimeout(analysisTimer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!report) return [];
    const all: PerformanceSuggestion[] = [];
    for (const file of report.files) {
      for (const s of file.suggestions) {
        if (!impactFilter.has(s.impact)) continue;
        if (categoryFilter && s.category !== categoryFilter) continue;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !s.title.toLowerCase().includes(q) &&
            !s.filepath.toLowerCase().includes(q)
          )
            continue;
        }
        all.push(s);
      }
    }
    return all;
  }, [report, impactFilter, categoryFilter, searchQuery]);

  // By file
  const byFile = useMemo(() => {
    const map = new Map<string, PerformanceSuggestion[]>();
    for (const s of filteredSuggestions) {
      if (!map.has(s.filepath)) map.set(s.filepath, []);
      map.get(s.filepath)!.push(s);
    }
    return map;
  }, [filteredSuggestions]);

  const toggleFile = useCallback((fp: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fp)) next.delete(fp);
      else next.add(fp);
      return next;
    });
  }, []);

  const toggleImpact = useCallback((impact: OptimizationImpact) => {
    setImpactFilter((prev) => {
      const next = new Set(prev);
      if (next.has(impact)) next.delete(impact);
      else next.add(impact);
      return next;
    });
  }, []);

  const handleAIOptimize = useCallback(
    (s: PerformanceSuggestion) => {
      const prompt = `## 性能优化请求\n- **文件**: ${s.filepath}\n- **行号**: ${s.line}\n- **类别**: ${s.category}\n- **影响**: ${s.impact}\n- **问题**: ${s.title}\n- **描述**: ${s.description}\n${s.codeExample ? `\n### 优化前:\n\`\`\`\n${s.codeExample.before}\n\`\`\`\n\n### 建议优化为:\n\`\`\`\n${s.codeExample.after}\n\`\`\`` : ""}\n\n请对该文件执行此性能优化，输出修改后的完整文件内容。`;
      requestFix(prompt, s.filepath);
    },
    [requestFix],
  );

  // Score color
  const scoreColor = (score: number) =>
    score >= 80
      ? "text-emerald-400"
      : score >= 60
        ? "text-amber-400"
        : "text-red-400";

  const scoreBg = (score: number) =>
    score >= 80
      ? "bg-emerald-500/10"
      : score >= 60
        ? "bg-amber-500/10"
        : "bg-red-500/10";

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="diagnostics"
        title="性能优化"
        icon={<Gauge className="w-3 h-3 text-amber-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={runAnalysis}
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

      {/* Score Overview */}
      {report && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-faint)]">
          <div className="flex items-center gap-3">
            {/* Score circle */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${scoreBg(report.overallScore)} border border-current/10`}
            >
              <span
                className={`text-[1rem] ${scoreColor(report.overallScore)}`}
              >
                {report.overallScore}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                性能得分
              </div>
              <div className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5">
                {filteredSuggestions.length} 项建议 · {report.files.length}{" "}
                个文件
              </div>
            </div>
          </div>

          {/* Category breakdown mini-chips */}
          <div className="flex flex-wrap gap-1 mt-2">
            {(
              Object.entries(report.categoryBreakdown) as [
                OptimizationCategory,
                number,
              ][]
            )
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                return (
                  <button
                    key={cat}
                    onClick={() =>
                      setCategoryFilter(categoryFilter === cat ? null : cat)
                    }
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.55rem] transition-colors ${
                      categoryFilter === cat
                        ? `${cfg.color} bg-white/5`
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{cfg.label}</span>
                    <span className="text-[0.5rem] opacity-60">{count}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded px-2 py-0.5">
            <Search className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索建议..."
              className="flex-1 bg-transparent border-0 outline-none text-[0.68rem] text-slate-300 placeholder:text-slate-700"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3 text-slate-600" />
              </button>
            )}
          </div>

          {/* Impact toggles */}
          {(["high", "medium", "low"] as OptimizationImpact[]).map((impact) => {
            const cfg = IMPACT_CONFIG[impact];
            const active = impactFilter.has(impact);
            return (
              <button
                key={impact}
                onClick={() => toggleImpact(impact)}
                className={`px-1.5 py-0.5 rounded text-[0.58rem] transition-colors ${
                  active
                    ? `${cfg.bgColor} ${cfg.color}`
                    : "text-slate-700 hover:text-slate-500"
                }`}
                title={`影响: ${cfg.label}`}
              >
                {cfg.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              showFilters
                ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
                : "text-slate-600 hover:bg-white/5"
            }`}
          >
            <Filter className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!report ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              {isAnalyzing ? (
                <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
              ) : (
                <Gauge className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              )}
              <p className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                {isAnalyzing ? "正在分析..." : "等待分析"}
              </p>
            </div>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Zap className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                性能良好！
              </p>
              <p className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5">
                未发现明显的性能优化空间
              </p>
            </div>
          </div>
        ) : (
          <div className="py-0.5">
            {/* Top issues banner */}
            {report.topIssues.length > 0 && !categoryFilter && !searchQuery && (
              <div className="mx-3 my-2 px-2.5 py-2 rounded-md bg-red-500/[0.04] border border-red-500/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Zap className="w-3 h-3 text-red-400" />
                  <span className="text-[0.65rem] text-red-400">
                    高影响优化 ({report.topIssues.length})
                  </span>
                </div>
                {report.topIssues.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className="text-[0.6rem] text-red-400/70 py-0.5 cursor-pointer hover:text-red-300 transition-colors"
                    onClick={() => setActiveFile(s.filepath)}
                  >
                    • {s.title}
                  </div>
                ))}
              </div>
            )}

            {/* By file */}
            {[...byFile.entries()].map(([filepath, suggestions]) => {
              const expanded = expandedFiles.has(filepath);
              const fileName = filepath.split("/").pop() || filepath;
              const fileReport = report.files.find(
                (f) => f.filepath === filepath,
              );
              const highCount = suggestions.filter(
                (s) => s.impact === "high",
              ).length;

              return (
                <div
                  key={filepath}
                  className="border-b border-[var(--ide-border-faint)] last:border-b-0"
                >
                  <button
                    onClick={() => toggleFile(filepath)}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/[0.02] transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    )}
                    <FileCode2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-[0.7rem] text-[var(--ide-text-secondary)] truncate flex-1 text-left">
                      {fileName}
                    </span>
                    {fileReport && (
                      <span
                        className={`text-[0.55rem] ${scoreColor(fileReport.score)}`}
                      >
                        {fileReport.score}分
                      </span>
                    )}
                    {highCount > 0 && (
                      <span className="px-1 py-0.5 rounded text-[0.5rem] bg-red-500/15 text-red-400">
                        {highCount}高
                      </span>
                    )}
                    <span className="px-1 py-0.5 rounded text-[0.5rem] bg-slate-500/10 text-slate-500">
                      {suggestions.length}
                    </span>
                  </button>

                  {expanded && (
                    <div className="bg-[var(--ide-bg-inset)]">
                      {suggestions.map((s) => (
                        <SuggestionRow
                          key={s.id}
                          suggestion={s}
                          onClick={() => setActiveFile(s.filepath)}
                          onAIOptimize={() => handleAIOptimize(s)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {report && <RecentErrorsFooter report={report} />}
    </div>
  );
}

// ── Recent errors footer — 跨面板联动入口 ──

function RecentErrorsFooter({ report }: { report: ProjectPerformanceReport }) {
  const panelManager = usePanelManager();
  const summary = errorReporting.getErrorSummary();
  const errorCount =
    (summary.bySeverity["error"] || 0) + (summary.bySeverity["fatal"] || 0);
  const warningCount = summary.bySeverity["warning"] || 0;
  const hasErrors = errorCount > 0 || warningCount > 0;

  if (!hasErrors || !panelManager) return null;

  return (
    <div className="flex-shrink-0 border-t border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
      {/* Stats row */}
      <div className="h-6 px-3 flex items-center justify-between">
        <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
          {report.files.length} 个文件 · 得分 {report.overallScore}/100
        </span>
        <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
          {new Date(report.analyzedAt).toLocaleTimeString()} 更新
        </span>
      </div>
      {/* Recent errors entry */}
      {hasErrors && (
        <button
          onClick={() => panelManager?.openPanel("ops")}
          className="w-full h-6 px-3 flex items-center gap-1.5 border-t border-[var(--ide-border-faint)] hover:bg-white/[0.03] transition-colors group"
          title="跳转至 运维面板 → 错误标签页"
        >
          <Bug className="w-3 h-3 text-red-400/70 group-hover:text-red-400 transition-colors" />
          <span className="text-[0.55rem] text-red-400/70 group-hover:text-red-400 transition-colors">
            近期错误
          </span>
          {errorCount > 0 && (
            <span className="px-1 py-0.5 rounded text-[0.45rem] bg-red-500/15 text-red-400 min-w-[16px] text-center">
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-1 py-0.5 rounded text-[0.45rem] bg-amber-500/15 text-amber-400 min-w-[16px] text-center">
              {warningCount}
            </span>
          )}
          <span className="text-[0.48rem] text-slate-700 ml-auto group-hover:text-slate-500 transition-colors">
            查看详情 →
          </span>
        </button>
      )}
    </div>
  );
}

// ── Suggestion row ──

function SuggestionRow({
  suggestion: s,
  onClick,
  onAIOptimize,
}: {
  suggestion: PerformanceSuggestion;
  onClick: () => void;
  onAIOptimize: () => void;
}) {
  const [showCode, setShowCode] = useState(false);
  const catCfg = CATEGORY_CONFIG[s.category];
  const impactCfg = IMPACT_CONFIG[s.impact];
  const CatIcon = catCfg.icon;

  return (
    <div
      className="px-3 py-2 hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-[var(--ide-border-faint)] last:border-b-0 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <CatIcon
          className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${catCfg.color}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[0.68rem] text-[var(--ide-text-secondary)] flex-1">
              {s.title}
            </p>
            <span
              className={`px-1 py-0.5 rounded text-[0.5rem] ${impactCfg.bgColor} ${impactCfg.color}`}
            >
              {impactCfg.label}
            </span>
          </div>
          <p className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5 flex items-center gap-1">
            <ArrowRight className="w-2.5 h-2.5 flex-shrink-0" />
            {s.description}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              行 {s.line}
            </span>
            <span className="text-[0.55rem] text-[var(--ide-text-dim)] flex items-center gap-0.5">
              <CatIcon className="w-2.5 h-2.5" />
              {catCfg.label}
            </span>

            {s.codeExample && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCode(!showCode);
                }}
                className="text-[0.55rem] text-sky-400/60 hover:text-sky-400 transition-colors"
              >
                {showCode ? "隐藏示例" : "查看示例"}
              </button>
            )}

            {s.docsUrl && (
              <a
                href={s.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[0.55rem] text-sky-400/60 hover:text-sky-400 transition-colors flex items-center gap-0.5"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                文档
              </a>
            )}
          </div>

          {/* Code example */}
          {showCode && s.codeExample && (
            <div className="mt-2 rounded border border-[var(--ide-border-dim)] overflow-hidden text-[0.58rem]">
              <div className="px-2 py-1 bg-red-500/[0.04] border-b border-[var(--ide-border-faint)]">
                <span className="text-red-400/60">优化前:</span>
                <pre className="text-red-400/80 mt-0.5 whitespace-pre-wrap">
                  {s.codeExample.before}
                </pre>
              </div>
              <div className="px-2 py-1 bg-emerald-500/[0.04]">
                <span className="text-emerald-400/60">优化后:</span>
                <pre className="text-emerald-400/80 mt-0.5 whitespace-pre-wrap">
                  {s.codeExample.after}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* AI optimize button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAIOptimize();
          }}
          className="w-5 h-5 rounded flex items-center justify-center bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
          title="AI 优化"
        >
          <Sparkles className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
