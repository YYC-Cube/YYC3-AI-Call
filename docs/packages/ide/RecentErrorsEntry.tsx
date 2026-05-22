/**
 * @file RecentErrorsEntry.tsx
 * @description 跨面板"近期错误"快捷入口组件，在各功能面板 Footer 区域展示
 *              错误/警告计数徽标，点击跳转到 OpsPanel 错误标签页，实现正向溯源链路
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags errors,cross-panel,footer,tracing
 */

import { Bug } from "lucide-react";
import { usePanelManager } from "./PanelManager";
import { errorReporting } from "./services/ErrorReportingService";

/**
 * 近期错误快捷入口 — 在面板 Footer 中使用
 * 自动从 ErrorReportingService 获取错误/警告计数，
 * 点击后通过 PanelManager.openPanel("ops") 跳转，
 * 面包屑中的面板操作记录会被 OpsPanel ErrorsTab 的溯源机制检测到
 */
export function RecentErrorsEntry() {
  const panelManager = usePanelManager();
  const summary = errorReporting.getErrorSummary();
  const errorCount =
    (summary.bySeverity["error"] || 0) + (summary.bySeverity["fatal"] || 0);
  const warningCount = summary.bySeverity["warning"] || 0;
  const hasErrors = errorCount > 0 || warningCount > 0;

  if (!hasErrors || !panelManager) return null;

  return (
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
  );
}
