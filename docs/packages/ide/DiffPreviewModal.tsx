/**
 * @file DiffPreviewModal.tsx
 * @description AI 代码变更差异预览模态框，显示 CodeApplicationPlan 的所有代码块，
 *              支持逐文件 diff 查看（新增/修改/删除行高亮）、单独接受/拒绝、一键应用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags diff,preview,modal,code-review,ai
 */

import { useState, useMemo, useCallback } from "react";
import {
  X,
  Check,
  CheckCheck,
  FileCode2,
  FilePlus,
  FileEdit,
  ChevronDown,
  ChevronRight,
  Eye,
  Ban,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  generateSimpleDiff,
  validateCodeBlock,
  type CodeApplicationPlan,
  type ParsedCodeBlock,
  type DiffLine,
} from "./ai/CodeApplicator";

// ── Types ──

interface FileDecision {
  accepted: boolean;
  warnings: string[];
  diff: DiffLine[];
  expanded: boolean;
}

interface DiffPreviewModalProps {
  plan: CodeApplicationPlan;
  existingFiles: Record<string, string>;
  onApply: (selectedBlocks: ParsedCodeBlock[]) => void;
  onCancel: () => void;
}

// ── Component ──

export default function DiffPreviewModal({
  plan,
  existingFiles,
  onApply,
  onCancel,
}: DiffPreviewModalProps) {
  // Per-file decisions: default all to accepted
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>(
    () => {
      const init: Record<string, FileDecision> = {};
      for (const block of plan.blocks) {
        const diff = generateSimpleDiff(
          existingFiles[block.filepath],
          block.content,
        );
        const warnings = validateCodeBlock(block);
        init[block.filepath] = {
          accepted: true,
          warnings,
          diff,
          expanded: plan.blocks.length <= 3, // Auto-expand if few files
        };
      }
      return init;
    },
  );

  const selectedCount = useMemo(
    () => Object.values(decisions).filter((d) => d.accepted).length,
    [decisions],
  );

  const toggleFile = useCallback((filepath: string) => {
    setDecisions((prev) => ({
      ...prev,
      [filepath]: { ...prev[filepath], accepted: !prev[filepath].accepted },
    }));
  }, []);

  const toggleExpand = useCallback((filepath: string) => {
    setDecisions((prev) => ({
      ...prev,
      [filepath]: { ...prev[filepath], expanded: !prev[filepath].expanded },
    }));
  }, []);

  const selectAll = useCallback(() => {
    setDecisions((prev) => {
      const next: Record<string, FileDecision> = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k] = { ...v, accepted: true };
      }
      return next;
    });
  }, []);

  const deselectAll = useCallback(() => {
    setDecisions((prev) => {
      const next: Record<string, FileDecision> = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k] = { ...v, accepted: false };
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const selected = plan.blocks.filter((b) => decisions[b.filepath]?.accepted);
    onApply(selected);
  }, [plan, decisions, onApply]);

  // Stats
  const addedLines = useMemo(() => {
    let count = 0;
    for (const [fp, d] of Object.entries(decisions)) {
      if (d.accepted) {
        count += d.diff.filter((l) => l.type === "added").length;
      }
    }
    return count;
  }, [decisions]);

  const removedLines = useMemo(() => {
    let count = 0;
    for (const [fp, d] of Object.entries(decisions)) {
      if (d.accepted) {
        count += d.diff.filter((l) => l.type === "removed").length;
      }
    }
    return count;
  }, [decisions]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-xl shadow-2xl w-[90vw] max-w-[820px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--ide-border-dim)] bg-[var(--ide-bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-600/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-[0.82rem] text-[var(--ide-text-bright)]">
                AI 代码变更预览
              </h2>
              <p className="text-[0.62rem] text-[var(--ide-text-dim)] mt-0.5">
                {plan.summary}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-[var(--ide-text-muted)]" />
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-inset)]">
          <div className="flex items-center gap-3 text-[0.65rem] text-[var(--ide-text-muted)]">
            <span>
              {plan.fileCount} 个文件 ·{" "}
              <span className="text-emerald-400">+{addedLines}</span>{" "}
              <span className="text-red-400">−{removedLines}</span>
            </span>
            <span>
              已选 {selectedCount}/{plan.blocks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={selectAll}
              className="px-2 py-0.5 rounded text-[0.62rem] text-[var(--ide-text-muted)] hover:bg-white/5 hover:text-[var(--ide-text-secondary)] transition-colors"
            >
              <CheckCheck className="w-3 h-3 inline mr-0.5" />
              全选
            </button>
            <button
              onClick={deselectAll}
              className="px-2 py-0.5 rounded text-[0.62rem] text-[var(--ide-text-muted)] hover:bg-white/5 hover:text-[var(--ide-text-secondary)] transition-colors"
            >
              <Ban className="w-3 h-3 inline mr-0.5" />
              全不选
            </button>
          </div>
        </div>

        {/* ── File List ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {plan.blocks.map((block) => {
            const decision = decisions[block.filepath];
            if (!decision) return null;

            return (
              <div
                key={block.filepath}
                className={`border-b border-[var(--ide-border-faint)] last:border-b-0 ${
                  !decision.accepted ? "opacity-50" : ""
                }`}
              >
                {/* File Header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--ide-bg-surface)] hover:bg-white/[0.02] transition-colors">
                  {/* Accept checkbox */}
                  <button
                    onClick={() => toggleFile(block.filepath)}
                    className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                      decision.accepted
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "border-[var(--ide-border)] text-transparent hover:border-[var(--ide-text-dim)]"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleExpand(block.filepath)}
                    className="flex-shrink-0 text-[var(--ide-text-dim)]"
                  >
                    {decision.expanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* File icon */}
                  {block.isNew ? (
                    <FilePlus className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <FileEdit className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}

                  {/* Path */}
                  <span className="text-[0.72rem] text-[var(--ide-text-secondary)] truncate flex-1">
                    {block.filepath}
                  </span>

                  {/* Badge */}
                  <span
                    className={`text-[0.58rem] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      block.isNew
                        ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/30"
                        : "bg-amber-900/30 text-amber-400 border border-amber-800/30"
                    }`}
                  >
                    {block.isNew ? "新建" : "修改"}
                  </span>

                  {/* Line counts */}
                  <span className="text-[0.58rem] text-[var(--ide-text-dim)] flex-shrink-0">
                    <span className="text-emerald-500">
                      +{decision.diff.filter((l) => l.type === "added").length}
                    </span>{" "}
                    <span className="text-red-500">
                      −
                      {decision.diff.filter((l) => l.type === "removed").length}
                    </span>
                  </span>

                  {/* Warnings */}
                  {decision.warnings.length > 0 && (
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  )}
                </div>

                {/* Diff Content */}
                {decision.expanded && (
                  <div className="bg-[var(--ide-bg-deep)] border-t border-[var(--ide-border-faint)] overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-[0.68rem] font-mono leading-[1.6]">
                      <tbody>
                        {decision.diff.map((line, idx) => (
                          <tr
                            key={idx}
                            className={
                              line.type === "added"
                                ? "bg-emerald-950/30"
                                : line.type === "removed"
                                  ? "bg-red-950/30"
                                  : ""
                            }
                          >
                            <td className="w-10 text-right pr-2 pl-3 select-none text-[var(--ide-text-dim)] opacity-50 align-top">
                              {line.lineNumber}
                            </td>
                            <td className="w-5 text-center select-none align-top">
                              {line.type === "added" && (
                                <span className="text-emerald-400">+</span>
                              )}
                              {line.type === "removed" && (
                                <span className="text-red-400">−</span>
                              )}
                            </td>
                            <td className="pr-4 whitespace-pre">
                              <span
                                className={
                                  line.type === "added"
                                    ? "text-emerald-300"
                                    : line.type === "removed"
                                      ? "text-red-300 line-through opacity-60"
                                      : "text-[var(--ide-text-secondary)]"
                                }
                              >
                                {line.content || " "}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--ide-border-dim)] bg-[var(--ide-bg-surface)]">
          <div className="text-[0.62rem] text-[var(--ide-text-dim)]">
            {plan.newFileCount > 0 && (
              <span className="mr-3">
                <FilePlus className="w-3 h-3 inline mr-0.5 text-emerald-400" />
                {plan.newFileCount} 新建
              </span>
            )}
            {plan.modifiedFileCount > 0 && (
              <span>
                <FileEdit className="w-3 h-3 inline mr-0.5 text-amber-400" />
                {plan.modifiedFileCount} 修改
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-lg text-[0.72rem] text-[var(--ide-text-muted)] hover:bg-white/5 border border-[var(--ide-border-dim)] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              disabled={selectedCount === 0}
              className="px-4 py-1.5 rounded-lg text-[0.72rem] text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-sky-900/30"
            >
              <Check className="w-3 h-3" />
              应用 {selectedCount} 个文件
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
