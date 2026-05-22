/**
 * @file hooks/useErrorDiagnostics.ts
 * @description 响应式错误诊断 Hook，监听 FileStore 变更并自动触发 ErrorAnalyzer，
 *              支持防抖、按文件/严重度过滤、统计
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hooks,diagnostics,error-analysis,debounce
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  analyzeProject,
  analyzeFile,
  applyAutoFix,
  type ProjectAnalysisResult,
  type Diagnostic,
  type DiagnosticSeverity,
  type DiagnosticCategory,
  type AutoFix,
} from "../ai/ErrorAnalyzer";
import { useFileStore } from "../FileStore";
import { useWorkflowEventBus } from "../WorkflowEventBus";

// ── 配置 ──

const ANALYSIS_DEBOUNCE_MS = 1200;
const INCREMENTAL_DEBOUNCE_MS = 600;

// ── 过滤器 ──

export interface DiagnosticFilter {
  severity: Set<DiagnosticSeverity>;
  category: Set<DiagnosticCategory> | null; // null = all
  searchQuery: string;
  fileFilter: string; // 空 = 所有文件
}

const DEFAULT_FILTER: DiagnosticFilter = {
  severity: new Set(["error", "warning", "info", "hint"]),
  category: null,
  searchQuery: "",
  fileFilter: "",
};

// ── Hook ──

export function useErrorDiagnostics() {
  const { fileContents, activeFile, updateFile } = useFileStore();
  const { emit } = useWorkflowEventBus();

  const [analysis, setAnalysis] = useState<ProjectAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState<DiagnosticFilter>(DEFAULT_FILTER);
  const [enabled, setEnabled] = useState(true);

  // Debounce refs
  const fullAnalysisTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const incrementalTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const lastContentHash = useRef<string>("");

  // ── 全量分析 ──

  const runFullAnalysis = useCallback(() => {
    if (!enabled) return;
    setIsAnalyzing(true);

    // Run in a microtask to avoid blocking render
    queueMicrotask(() => {
      const result = analyzeProject(fileContents);
      setAnalysis(result);
      setIsAnalyzing(false);

      if (result.totalErrors > 0) {
        emit({
          type: "error-feedback",
          detail: `检测到 ${result.totalErrors} 个错误, ${result.totalWarnings} 个警告`,
          data: { errors: result.totalErrors, warnings: result.totalWarnings },
        });
      }
    });
  }, [fileContents, enabled, emit]);

  // ── 增量分析 (单文件) ──

  const runIncrementalAnalysis = useCallback(
    (filepath: string) => {
      if (!enabled || !analysis) return;
      const content = fileContents[filepath];
      if (!content) return;

      const fileResult = analyzeFile(filepath, content);

      setAnalysis((prev) => {
        if (!prev) return prev;
        // Replace or add this file's results
        const files = prev.files.filter((f) => f.filepath !== filepath);
        if (fileResult.diagnostics.length > 0) {
          files.push(fileResult);
        }

        // Recount
        let totalErrors = 0,
          totalWarnings = 0,
          totalInfos = 0,
          totalHints = 0;
        for (const f of files) {
          for (const d of f.diagnostics) {
            switch (d.severity) {
              case "error":
                totalErrors++;
                break;
              case "warning":
                totalWarnings++;
                break;
              case "info":
                totalInfos++;
                break;
              case "hint":
                totalHints++;
                break;
            }
          }
        }

        return {
          files,
          totalErrors,
          totalWarnings,
          totalInfos,
          totalHints,
          analyzedAt: Date.now(),
        };
      });
    },
    [fileContents, enabled, analysis],
  );

  // ── 自动触发: 文件内容变更 → 防抖分析 ──

  useEffect(() => {
    if (!enabled) return;

    // Create a lightweight content hash to detect changes
    const hash =
      `${Object.keys(fileContents).length
      }:${
      fileContents[activeFile]?.length ?? 0}`;

    if (hash === lastContentHash.current) return;
    lastContentHash.current = hash;

    // First run: full analysis
    if (!analysis) {
      clearTimeout(fullAnalysisTimer.current);
      fullAnalysisTimer.current = setTimeout(
        runFullAnalysis,
        ANALYSIS_DEBOUNCE_MS,
      );
      return;
    }

    // Subsequent: incremental on active file
    clearTimeout(incrementalTimer.current);
    incrementalTimer.current = setTimeout(() => {
      runIncrementalAnalysis(activeFile);
    }, INCREMENTAL_DEBOUNCE_MS);

    return () => {
      clearTimeout(fullAnalysisTimer.current);
      clearTimeout(incrementalTimer.current);
    };
  }, [
    fileContents,
    activeFile,
    enabled,
    analysis,
    runFullAnalysis,
    runIncrementalAnalysis,
  ]);

  // ── 过滤后的诊断列表 ──

  const filteredDiagnostics = useMemo(() => {
    if (!analysis) return [];

    const all: Diagnostic[] = [];
    for (const file of analysis.files) {
      for (const d of file.diagnostics) {
        // Severity filter
        if (!filter.severity.has(d.severity)) continue;
        // Category filter
        if (filter.category && !filter.category.has(d.category)) continue;
        // File filter
        if (filter.fileFilter && !d.filepath.includes(filter.fileFilter))
          continue;
        // Search filter
        if (filter.searchQuery) {
          const q = filter.searchQuery.toLowerCase();
          if (
            !d.message.toLowerCase().includes(q) &&
            !d.filepath.toLowerCase().includes(q) &&
            !d.ruleId.toLowerCase().includes(q)
          )
            continue;
        }
        all.push(d);
      }
    }

    return all;
  }, [analysis, filter]);

  // ── 按文件分组 ──

  const diagnosticsByFile = useMemo(() => {
    const map = new Map<string, Diagnostic[]>();
    for (const d of filteredDiagnostics) {
      if (!map.has(d.filepath)) map.set(d.filepath, []);
      map.get(d.filepath)!.push(d);
    }
    return map;
  }, [filteredDiagnostics]);

  // ── 活跃文件的诊断 ──

  const activeFileDiagnostics = useMemo(() => {
    return filteredDiagnostics.filter((d) => d.filepath === activeFile);
  }, [filteredDiagnostics, activeFile]);

  // ── 应用 AutoFix ──

  const applyFix = useCallback(
    (diagnostic: Diagnostic) => {
      if (!diagnostic.autoFix) return false;
      const content = fileContents[diagnostic.filepath];
      if (!content) return false;

      const fixed = applyAutoFix(content, diagnostic.autoFix);
      updateFile(diagnostic.filepath, fixed);

      emit({
        type: "suggestion-applied",
        detail: `自动修复: ${diagnostic.ruleId} @ ${diagnostic.filepath}:${diagnostic.line}`,
      });

      // Re-analyze the file
      setTimeout(() => runIncrementalAnalysis(diagnostic.filepath), 100);
      return true;
    },
    [fileContents, updateFile, emit, runIncrementalAnalysis],
  );

  // ── 批量修复同一规则的所有问题 ──

  const applyFixAll = useCallback(
    (ruleId: string) => {
      if (!analysis) return 0;
      let fixCount = 0;

      // Collect all auto-fixable diagnostics for this rule, grouped by file
      const byFile = new Map<string, Diagnostic[]>();
      for (const file of analysis.files) {
        for (const d of file.diagnostics) {
          if (d.ruleId === ruleId && d.autoFix) {
            if (!byFile.has(d.filepath)) byFile.set(d.filepath, []);
            byFile.get(d.filepath)!.push(d);
          }
        }
      }

      // Apply fixes file by file (from bottom to top to preserve line numbers)
      for (const [filepath, diagnostics] of byFile) {
        let content = fileContents[filepath];
        if (!content) continue;

        const sorted = [...diagnostics].sort((a, b) => b.line - a.line);
        for (const d of sorted) {
          if (d.autoFix) {
            content = applyAutoFix(content, d.autoFix);
            fixCount++;
          }
        }
        updateFile(filepath, content);
      }

      if (fixCount > 0) {
        emit({
          type: "suggestion-applied",
          detail: `批量修复 ${ruleId}: ${fixCount} 处`,
        });
        setTimeout(runFullAnalysis, 200);
      }

      return fixCount;
    },
    [analysis, fileContents, updateFile, emit, runFullAnalysis],
  );

  // ── Filter helpers ──

  const toggleSeverity = useCallback((sev: DiagnosticSeverity) => {
    setFilter((prev) => {
      const next = new Set(prev.severity);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return { ...prev, severity: next };
    });
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: q }));
  }, []);

  const setFileFilter = useCallback((f: string) => {
    setFilter((prev) => ({ ...prev, fileFilter: f }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  // ── Stats ──

  const stats = useMemo(() => {
    if (!analysis)
      return {
        errors: 0,
        warnings: 0,
        infos: 0,
        hints: 0,
        total: 0,
        fileCount: 0,
      };
    return {
      errors: analysis.totalErrors,
      warnings: analysis.totalWarnings,
      infos: analysis.totalInfos,
      hints: analysis.totalHints,
      total:
        analysis.totalErrors +
        analysis.totalWarnings +
        analysis.totalInfos +
        analysis.totalHints,
      fileCount: analysis.files.length,
    };
  }, [analysis]);

  return {
    // State
    analysis,
    isAnalyzing,
    enabled,
    filter,
    stats,

    // Derived
    filteredDiagnostics,
    diagnosticsByFile,
    activeFileDiagnostics,

    // Actions
    runFullAnalysis,
    runIncrementalAnalysis,
    applyFix,
    applyFixAll,
    setEnabled,

    // Filter actions
    toggleSeverity,
    setSearchQuery,
    setFileFilter,
    resetFilter,
  };
}
