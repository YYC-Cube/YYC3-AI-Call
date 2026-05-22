/**
 * @file ErrorDiagnosticsPanel.tsx
 * @description 智能错误诊断面板，实时展示 ErrorAnalyzer 的分析结果，
 *              支持按文件分组/按严重度过滤/搜索、点击定位、一键 AutoFix、AI 辅助修复
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags diagnostics,error-analysis,autofix,panel,ai-fix
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  Search,
  X,
  RefreshCw,
  Wrench,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Filter,
  Power,
  PowerOff,
  Zap,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Shield,
  Palette,
  Accessibility,
  Cpu,
  Package,
  Code2,
  Bug,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import { useFileStore } from "./FileStore";
import { useErrorDiagnostics } from "./hooks/useErrorDiagnostics";
import {
  type Diagnostic,
  type DiagnosticSeverity,
  type DiagnosticCategory,
  buildFixPromptContext,
} from "./ai/ErrorAnalyzer";
import { useAIFixStore } from "./stores/useAIFixStore";
import { RecentErrorsEntry } from "./RecentErrorsEntry";

// ── Severity config ──

const SEVERITY_CONFIG: Record<
  DiagnosticSeverity,
  { icon: typeof AlertCircle; color: string; bgColor: string; label: string }
> = {
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/15",
    label: "错误",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    label: "警告",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    label: "信息",
  },
  hint: {
    icon: Lightbulb,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    label: "提示",
  },
};

const CATEGORY_CONFIG: Record<
  DiagnosticCategory,
  { icon: typeof Code2; label: string }
> = {
  typescript: { icon: Code2, label: "TypeScript" },
  react: { icon: Zap, label: "React" },
  hooks: { icon: Zap, label: "Hooks" },
  imports: { icon: Package, label: "导入" },
  performance: { icon: Cpu, label: "性能" },
  accessibility: { icon: Accessibility, label: "可访问性" },
  style: { icon: Palette, label: "样式" },
  security: { icon: Shield, label: "安全" },
  "best-practice": { icon: Lightbulb, label: "最佳实践" },
};

// ── Component ──

interface ErrorDiagnosticsPanelProps {
  nodeId: string;
  /** 当用户请求 AI 修复时回调，父组件可发起 LLM 流式调用 */
  onRequestAIFix?: (prompt: string, filepath: string) => void;
}

export default function ErrorDiagnosticsPanel({
  nodeId,
  onRequestAIFix,
}: ErrorDiagnosticsPanelProps) {
  const { setActiveFile, fileContents } = useFileStore();
  const requestFix = useAIFixStore((s) => s.requestFix);
  const {
    analysis,
    isAnalyzing,
    enabled,
    filter,
    stats,
    filteredDiagnostics,
    diagnosticsByFile,
    runFullAnalysis,
    applyFix,
    applyFixAll,
    setEnabled,
    toggleSeverity,
    setSearchQuery,
    setFileFilter,
    resetFilter,
  } = useErrorDiagnostics();

  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"byFile" | "flat">("byFile");

  // Toggle file expansion
  const toggleFileExpand = useCallback((filepath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filepath)) next.delete(filepath);
      else next.add(filepath);
      return next;
    });
  }, []);

  // Navigate to diagnostic location
  const goToDiagnostic = useCallback(
    (d: Diagnostic) => {
      setActiveFile(d.filepath);
      // TODO: integrate with Monaco to scroll to line
    },
    [setActiveFile],
  );

  // AI Fix handler
  const handleAIFix = useCallback(
    (d: Diagnostic) => {
      const content = fileContents[d.filepath];
      if (!content) return;
      const prompt = buildFixPromptContext(d, content);
      if (onRequestAIFix) {
        onRequestAIFix(prompt, d.filepath);
      } else {
        requestFix(prompt, d.filepath);
      }
    },
    [fileContents, onRequestAIFix, requestFix],
  );

  // Count fixable diagnostics for a rule
  const fixableCountByRule = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of filteredDiagnostics) {
      if (d.autoFix) {
        map.set(d.ruleId, (map.get(d.ruleId) || 0) + 1);
      }
    }
    return map;
  }, [filteredDiagnostics]);

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      {/* Panel Header */}
      <PanelHeader
        nodeId={nodeId}
        panelId="diagnostics"
        title="错误诊断"
        icon={<Bug className="w-3 h-3 text-red-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          {/* Stats badges */}
          {stats.errors > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[0.58rem] bg-red-500/15 text-red-400">
              {stats.errors}
            </span>
          )}
          {stats.warnings > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[0.58rem] bg-amber-500/15 text-amber-400">
              {stats.warnings}
            </span>
          )}

          {/* Toggle enabled */}
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              enabled
                ? "hover:bg-white/5 text-emerald-400"
                : "hover:bg-white/5 text-slate-600"
            }`}
            title={enabled ? "暂停诊断" : "启用诊断"}
          >
            {enabled ? (
              <Power className="w-3 h-3" />
            ) : (
              <PowerOff className="w-3 h-3" />
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={runFullAnalysis}
            disabled={!enabled || isAnalyzing}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 text-slate-600 disabled:opacity-30 transition-colors"
            title="重新分析"
          >
            <RefreshCw
              className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </PanelHeader>

      {/* Search & Filter Bar */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="flex-1 flex items-center gap-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded px-2 py-0.5">
            <Search className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <input
              value={filter.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索诊断..."
              className="flex-1 bg-transparent border-0 outline-none text-[0.68rem] text-slate-300 placeholder:text-slate-700"
            />
            {filter.searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3 text-slate-600" />
              </button>
            )}
          </div>

          {/* Severity toggles */}
          {(["error", "warning", "info", "hint"] as DiagnosticSeverity[]).map(
            (sev) => {
              const cfg = SEVERITY_CONFIG[sev];
              const Icon = cfg.icon;
              const active = filter.severity.has(sev);
              const count =
                sev === "error"
                  ? stats.errors
                  : sev === "warning"
                    ? stats.warnings
                    : sev === "info"
                      ? stats.infos
                      : stats.hints;
              return (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.6rem] transition-colors ${
                    active
                      ? `${cfg.bgColor} ${cfg.color}`
                      : "text-slate-700 hover:text-slate-500"
                  }`}
                  title={`${cfg.label} (${count})`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{count}</span>
                </button>
              );
            },
          )}

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              showFilters
                ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
                : "text-slate-600 hover:bg-white/5"
            }`}
            title="高级过滤"
          >
            <Filter className="w-3 h-3" />
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded px-2 py-0.5">
              <FileCode2 className="w-3 h-3 text-slate-600 flex-shrink-0" />
              <input
                value={filter.fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                placeholder="过滤文件路径..."
                className="bg-transparent border-0 outline-none text-[0.62rem] text-slate-400 placeholder:text-slate-700 w-[140px]"
              />
            </div>
            <button
              onClick={resetFilter}
              className="text-[0.6rem] text-slate-600 hover:text-sky-400 transition-colors"
            >
              重置过滤
            </button>
            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 ml-auto">
              <button
                onClick={() => setViewMode("byFile")}
                className={`px-1.5 py-0.5 rounded text-[0.6rem] transition-colors ${
                  viewMode === "byFile"
                    ? "bg-[var(--ide-border-dim)] text-[var(--ide-accent)]"
                    : "text-slate-600"
                }`}
              >
                按文件
              </button>
              <button
                onClick={() => setViewMode("flat")}
                className={`px-1.5 py-0.5 rounded text-[0.6rem] transition-colors ${
                  viewMode === "flat"
                    ? "bg-[var(--ide-border-dim)] text-[var(--ide-accent)]"
                    : "text-slate-600"
                }`}
              >
                平铺
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!enabled ? (
          <EmptyState
            icon={<PowerOff className="w-6 h-6 text-slate-600" />}
            title="诊断已暂停"
            description="点击顶部电源按钮启用实时诊断"
          />
        ) : !analysis ? (
          <EmptyState
            icon={
              isAnalyzing ? (
                <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
              ) : (
                <BarChart3 className="w-6 h-6 text-slate-600" />
              )
            }
            title={isAnalyzing ? "正在分析..." : "等待分析"}
            description={
              isAnalyzing ? "正在扫描项目文件" : "编辑文件后将自动开始分析"
            }
          />
        ) : filteredDiagnostics.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
            title="没有发现问题"
            description={
              stats.total > 0 ? "当前过滤条件下没有匹配项" : "代码质量良好！"
            }
          />
        ) : viewMode === "byFile" ? (
          <ByFileView
            diagnosticsByFile={diagnosticsByFile}
            expandedFiles={expandedFiles}
            toggleFileExpand={toggleFileExpand}
            goToDiagnostic={goToDiagnostic}
            applyFix={applyFix}
            handleAIFix={handleAIFix}
            fixableCountByRule={fixableCountByRule}
            applyFixAll={applyFixAll}
          />
        ) : (
          <FlatView
            diagnostics={filteredDiagnostics}
            goToDiagnostic={goToDiagnostic}
            applyFix={applyFix}
            handleAIFix={handleAIFix}
          />
        )}
      </div>

      {/* Footer status bar */}
      {analysis && (
        <div className="flex-shrink-0 border-t border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
          <div className="h-6 px-3 flex items-center justify-between">
            <span className="text-[0.58rem] text-[var(--ide-text-dim)]">
              {stats.fileCount} 个文件 · {filteredDiagnostics.length} 条诊断
              {filteredDiagnostics.length !== stats.total &&
                ` (共 ${stats.total} 条)`}
            </span>
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              {new Date(analysis.analyzedAt).toLocaleTimeString()} 更新
            </span>
          </div>
          <RecentErrorsEntry />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">{icon}</div>
        <p className="text-[0.78rem] text-[var(--ide-text-secondary)] mb-0.5">
          {title}
        </p>
        <p className="text-[0.62rem] text-[var(--ide-text-dim)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function ByFileView({
  diagnosticsByFile,
  expandedFiles,
  toggleFileExpand,
  goToDiagnostic,
  applyFix,
  handleAIFix,
  fixableCountByRule,
  applyFixAll,
}: {
  diagnosticsByFile: Map<string, Diagnostic[]>;
  expandedFiles: Set<string>;
  toggleFileExpand: (fp: string) => void;
  goToDiagnostic: (d: Diagnostic) => void;
  applyFix: (d: Diagnostic) => boolean;
  handleAIFix?: (d: Diagnostic) => void;
  fixableCountByRule: Map<string, number>;
  applyFixAll: (ruleId: string) => number;
}) {
  const sortedFiles = [...diagnosticsByFile.entries()].sort(([, a], [, b]) => {
    // Files with errors first
    const aErrors = a.filter((d) => d.severity === "error").length;
    const bErrors = b.filter((d) => d.severity === "error").length;
    if (aErrors !== bErrors) return bErrors - aErrors;
    return b.length - a.length;
  });

  return (
    <div className="py-0.5">
      {sortedFiles.map(([filepath, diagnostics]) => {
        const expanded = expandedFiles.has(filepath);
        const errorCount = diagnostics.filter(
          (d) => d.severity === "error",
        ).length;
        const warnCount = diagnostics.filter(
          (d) => d.severity === "warning",
        ).length;
        const fileName = filepath.split("/").pop() || filepath;

        return (
          <div
            key={filepath}
            className="border-b border-[var(--ide-border-faint)] last:border-b-0"
          >
            {/* File header */}
            <button
              onClick={() => toggleFileExpand(filepath)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/[0.02] transition-colors group"
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
              <span className="text-[0.55rem] text-[var(--ide-text-dim)] truncate max-w-[120px] mr-1">
                {filepath}
              </span>
              {errorCount > 0 && (
                <span className="px-1 py-0.5 rounded text-[0.55rem] bg-red-500/15 text-red-400">
                  {errorCount}
                </span>
              )}
              {warnCount > 0 && (
                <span className="px-1 py-0.5 rounded text-[0.55rem] bg-amber-500/15 text-amber-400">
                  {warnCount}
                </span>
              )}
              {diagnostics.length - errorCount - warnCount > 0 && (
                <span className="px-1 py-0.5 rounded text-[0.55rem] bg-blue-500/10 text-blue-400">
                  {diagnostics.length - errorCount - warnCount}
                </span>
              )}
            </button>

            {/* Diagnostics list */}
            {expanded && (
              <div className="bg-[var(--ide-bg-inset)]">
                {diagnostics.map((d) => (
                  <DiagnosticRow
                    key={d.id}
                    diagnostic={d}
                    onClick={() => goToDiagnostic(d)}
                    onFix={() => applyFix(d)}
                    onAIFix={handleAIFix ? () => handleAIFix(d) : undefined}
                    showFile={false}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FlatView({
  diagnostics,
  goToDiagnostic,
  applyFix,
  handleAIFix,
}: {
  diagnostics: Diagnostic[];
  goToDiagnostic: (d: Diagnostic) => void;
  applyFix: (d: Diagnostic) => boolean;
  handleAIFix?: (d: Diagnostic) => void;
}) {
  return (
    <div className="py-0.5">
      {diagnostics.map((d) => (
        <DiagnosticRow
          key={d.id}
          diagnostic={d}
          onClick={() => goToDiagnostic(d)}
          onFix={() => applyFix(d)}
          onAIFix={handleAIFix ? () => handleAIFix(d) : undefined}
          showFile
        />
      ))}
    </div>
  );
}

function DiagnosticRow({
  diagnostic: d,
  onClick,
  onFix,
  onAIFix,
  showFile,
}: {
  diagnostic: Diagnostic;
  onClick: () => void;
  onFix: () => void;
  onAIFix?: () => void;
  showFile: boolean;
}) {
  const sev = SEVERITY_CONFIG[d.severity];
  const cat = CATEGORY_CONFIG[d.category];
  const SevIcon = sev.icon;
  const CatIcon = cat.icon;

  return (
    <div
      className="flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors cursor-pointer group border-b border-[var(--ide-border-faint)] last:border-b-0"
      onClick={onClick}
    >
      {/* Severity icon */}
      <SevIcon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${sev.color}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.68rem] text-[var(--ide-text-secondary)] leading-relaxed">
          {d.message}
        </p>
        {d.suggestion && (
          <p className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5 flex items-center gap-1">
            <ArrowRight className="w-2.5 h-2.5 flex-shrink-0" />
            {d.suggestion}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-[0.55rem] text-[var(--ide-text-dim)]">
          {showFile && (
            <span className="truncate max-w-[180px]">{d.filepath}</span>
          )}
          <span>行 {d.line}</span>
          <span className="flex items-center gap-0.5">
            <CatIcon className="w-2.5 h-2.5" />
            {cat.label}
          </span>
          <span className="opacity-60">{d.ruleId}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        {d.autoFix && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFix();
            }}
            className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            title="自动修复"
          >
            <Wrench className="w-3 h-3" />
          </button>
        )}
        {onAIFix && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAIFix();
            }}
            className="w-5 h-5 rounded flex items-center justify-center bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
            title="AI 修复"
          >
            <Sparkles className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
