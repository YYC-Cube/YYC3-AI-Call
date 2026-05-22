/**
 * @file SnapshotDiffModal.tsx
 * @description 预览快照差异对比视图组件，支持 side-by-side 并列模式与统一模式，
 *              内置 LCS 行级 diff 算法，含差异统计、快照选择器、左右交换等功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,diff,snapshot,comparison,lcs
 */

import { useState, useMemo, memo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Equal,
  ArrowLeftRight,
  Layers,
} from "lucide-react";
import type { PreviewSnapshot } from "./stores/usePreviewStore";

// ── Simple Line-Level Diff ──

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function computeLineDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const lcs = buildLCS(oldLines, newLines);
  let oi = 0;
  let ni = 0;
  let li = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (
      li < lcs.length &&
      oi < oldLines.length &&
      ni < newLines.length &&
      oldLines[oi] === lcs[li] &&
      newLines[ni] === lcs[li]
    ) {
      result.push({
        type: "unchanged",
        content: oldLines[oi],
        oldLineNum: oi + 1,
        newLineNum: ni + 1,
      });
      oi++;
      ni++;
      li++;
    } else if (
      oi < oldLines.length &&
      (li >= lcs.length || oldLines[oi] !== lcs[li])
    ) {
      result.push({
        type: "removed",
        content: oldLines[oi],
        oldLineNum: oi + 1,
      });
      oi++;
    } else if (
      ni < newLines.length &&
      (li >= lcs.length || newLines[ni] !== lcs[li])
    ) {
      result.push({ type: "added", content: newLines[ni], newLineNum: ni + 1 });
      ni++;
    } else {
      break;
    }
  }

  return result;
}

function buildLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  // For large files, limit computation
  if (m > 2000 || n > 2000) {
    // Fallback: just return common elements in order
    const bSet = new Set(b);
    return a.filter((line) => bSet.has(line));
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

// ── Diff Stats ──

interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

function computeStats(lines: DiffLine[]): DiffStats {
  return {
    added: lines.filter((l) => l.type === "added").length,
    removed: lines.filter((l) => l.type === "removed").length,
    unchanged: lines.filter((l) => l.type === "unchanged").length,
  };
}

// ── Component ──

interface SnapshotDiffModalProps {
  snapshots: PreviewSnapshot[];
  initialLeftIndex: number;
  initialRightIndex: number;
  onClose: () => void;
}

function SnapshotDiffModalInner({
  snapshots,
  initialLeftIndex,
  initialRightIndex,
  onClose,
}: SnapshotDiffModalProps) {
  const [leftIdx, setLeftIdx] = useState(initialLeftIndex);
  const [rightIdx, setRightIdx] = useState(initialRightIndex);
  const [viewMode, setViewMode] = useState<"unified" | "split">("split");

  const leftSnap = snapshots[leftIdx];
  const rightSnap = snapshots[rightIdx];

  const diffLines = useMemo(() => {
    if (!leftSnap || !rightSnap) return [];
    return computeLineDiff(leftSnap.code, rightSnap.code);
  }, [leftSnap?.code, rightSnap?.code]);

  const stats = useMemo(() => computeStats(diffLines), [diffLines]);

  const canGoLeft = leftIdx > 0;
  const canGoRight = rightIdx < snapshots.length - 1;

  const handleSwap = () => {
    setLeftIdx(rightIdx);
    setRightIdx(leftIdx);
  };

  if (!leftSnap || !rightSnap) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90vw] max-w-[1200px] h-[80vh] bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-10 bg-[var(--ide-bg-dark)] border-b border-[var(--ide-border-faint)] flex items-center px-4 gap-3 flex-shrink-0">
          <Layers className="w-4 h-4 text-[var(--ide-accent)]" />
          <span className="text-[0.75rem] text-[var(--ide-text-secondary)]">
            快照差异对比
          </span>

          {/* Stats badges */}
          <div className="flex items-center gap-2 ml-4">
            <span className="flex items-center gap-1 text-[0.6rem] text-emerald-400">
              <Plus className="w-3 h-3" /> {stats.added}
            </span>
            <span className="flex items-center gap-1 text-[0.6rem] text-red-400">
              <Minus className="w-3 h-3" /> {stats.removed}
            </span>
            <span className="flex items-center gap-1 text-[0.6rem] text-[var(--ide-text-dim)]">
              <Equal className="w-3 h-3" /> {stats.unchanged}
            </span>
          </div>

          <div className="flex-1" />

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--ide-bg-inset)] rounded p-0.5 border border-[var(--ide-border-faint)]">
            <button
              onClick={() => setViewMode("split")}
              className={`px-2 py-0.5 rounded text-[0.6rem] transition-colors ${
                viewMode === "split"
                  ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
                  : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)]"
              }`}
            >
              并列
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={`px-2 py-0.5 rounded text-[0.6rem] transition-colors ${
                viewMode === "unified"
                  ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
                  : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)]"
              }`}
            >
              统一
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot selectors */}
        <div className="h-9 bg-[var(--ide-bg-surface)] border-b border-[var(--ide-border-faint)] flex items-center px-4 gap-2 flex-shrink-0">
          {/* Left selector */}
          <div className="flex items-center gap-1 flex-1">
            <button
              onClick={() => canGoLeft && setLeftIdx(leftIdx - 1)}
              disabled={!canGoLeft}
              className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <select
              value={leftIdx}
              onChange={(e) => setLeftIdx(Number(e.target.value))}
              className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded px-2 py-0.5 text-[0.6rem] text-[var(--ide-text-secondary)] outline-none flex-1 max-w-[200px]"
            >
              {snapshots.map((s, i) => (
                <option key={s.id} value={i}>
                  #{i + 1} —{" "}
                  {s.label || new Date(s.timestamp).toLocaleTimeString("zh-CN")}{" "}
                  ({s.language})
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-accent)] hover:bg-[var(--ide-accent-bg)] transition-colors"
            title="交换左右"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>

          {/* Right selector */}
          <div className="flex items-center gap-1 flex-1 justify-end">
            <select
              value={rightIdx}
              onChange={(e) => setRightIdx(Number(e.target.value))}
              className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded px-2 py-0.5 text-[0.6rem] text-[var(--ide-text-secondary)] outline-none flex-1 max-w-[200px]"
            >
              {snapshots.map((s, i) => (
                <option key={s.id} value={i}>
                  #{i + 1} —{" "}
                  {s.label || new Date(s.timestamp).toLocaleTimeString("zh-CN")}{" "}
                  ({s.language})
                </option>
              ))}
            </select>
            <button
              onClick={() => canGoRight && setRightIdx(rightIdx + 1)}
              disabled={!canGoRight}
              className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Diff content */}
        <div className="flex-1 min-h-0 overflow-auto font-mono text-[0.7rem] leading-[1.6]">
          {viewMode === "split" ? (
            <SplitDiffView lines={diffLines} />
          ) : (
            <UnifiedDiffView lines={diffLines} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Split (side-by-side) View ──

function SplitDiffView({ lines }: { lines: DiffLine[] }) {
  // Separate into left/right columns
  const leftLines: (DiffLine | null)[] = [];
  const rightLines: (DiffLine | null)[] = [];

  for (const line of lines) {
    if (line.type === "unchanged") {
      leftLines.push(line);
      rightLines.push(line);
    } else if (line.type === "removed") {
      leftLines.push(line);
      rightLines.push(null); // placeholder
    } else {
      leftLines.push(null); // placeholder
      rightLines.push(line);
    }
  }

  // Compact: merge adjacent null+value pairs
  const maxLen = Math.max(leftLines.length, rightLines.length);

  return (
    <div className="flex min-w-0">
      {/* Left pane */}
      <div className="flex-1 border-r border-[var(--ide-border-faint)]">
        {leftLines.slice(0, maxLen).map((line, i) => (
          <DiffLineRow key={i} line={line} side="left" />
        ))}
      </div>
      {/* Right pane */}
      <div className="flex-1">
        {rightLines.slice(0, maxLen).map((line, i) => (
          <DiffLineRow key={i} line={line} side="right" />
        ))}
      </div>
    </div>
  );
}

function DiffLineRow({
  line,
  side,
}: {
  line: DiffLine | null;
  side: "left" | "right";
}) {
  if (!line) {
    return (
      <div className="flex h-[1.6em] bg-[var(--ide-bg-dark)]/30">
        <span className="w-10 text-right pr-2 text-[var(--ide-text-faint)] select-none opacity-30" />
        <span className="flex-1 px-2" />
      </div>
    );
  }

  const bgClass =
    line.type === "added"
      ? "bg-emerald-950/30"
      : line.type === "removed"
        ? "bg-red-950/30"
        : "";

  const textClass =
    line.type === "added"
      ? "text-emerald-300"
      : line.type === "removed"
        ? "text-red-300"
        : "text-[var(--ide-text-secondary)]";

  const lineNum = side === "left" ? line.oldLineNum : line.newLineNum;

  return (
    <div className={`flex min-h-[1.6em] ${bgClass}`}>
      <span className="w-10 text-right pr-2 text-[var(--ide-text-faint)] select-none text-[0.6rem] flex-shrink-0">
        {lineNum || ""}
      </span>
      <span className="w-4 flex-shrink-0 text-center text-[0.6rem] select-none opacity-60">
        {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
      </span>
      <pre
        className={`flex-1 px-2 whitespace-pre-wrap break-all m-0 p-0 bg-transparent ${textClass}`}
      >
        {line.content || " "}
      </pre>
    </div>
  );
}

// ── Unified View ──

function UnifiedDiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <div>
      {lines.map((line, i) => {
        const bgClass =
          line.type === "added"
            ? "bg-emerald-950/30"
            : line.type === "removed"
              ? "bg-red-950/30"
              : "";

        const textClass =
          line.type === "added"
            ? "text-emerald-300"
            : line.type === "removed"
              ? "text-red-300"
              : "text-[var(--ide-text-secondary)]";

        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";

        return (
          <div key={i} className={`flex min-h-[1.6em] ${bgClass}`}>
            <span className="w-10 text-right pr-2 text-[var(--ide-text-faint)] select-none text-[0.6rem] flex-shrink-0">
              {line.oldLineNum || ""}
            </span>
            <span className="w-10 text-right pr-2 text-[var(--ide-text-faint)] select-none text-[0.6rem] flex-shrink-0">
              {line.newLineNum || ""}
            </span>
            <span className="w-4 flex-shrink-0 text-center text-[0.6rem] select-none opacity-60">
              {prefix}
            </span>
            <pre
              className={`flex-1 px-2 whitespace-pre-wrap break-all m-0 p-0 bg-transparent ${textClass}`}
            >
              {line.content || " "}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

const SnapshotDiffModal = memo(SnapshotDiffModalInner);
export default SnapshotDiffModal;
