/**
 * @file GitPanel.tsx
 * @description Git 版本控制面板，模拟 Git 工作流操作，包括暂存、提交、分支管理、
 *              差异查看、文件状态跟踪、拉取/推送等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags git,version-control,panel,branch,commit
 */

import { useState } from "react";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Plus,
  Minus,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Upload,
  Download,
  History,
  Circle,
} from "lucide-react";
import { useFileStore } from "./FileStore";
import { PanelHeader } from "./PanelManager";
import { useWorkflowEventBus } from "./WorkflowEventBus";

function getStatusColor(status: string) {
  switch (status) {
    case "modified":
      return "text-amber-400";
    case "added":
    case "untracked":
      return "text-emerald-400";
    case "deleted":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "modified":
      return "M";
    case "added":
      return "A";
    case "deleted":
      return "D";
    case "untracked":
      return "U";
    default:
      return "?";
  }
}

export default function GitPanel({ nodeId }: { nodeId: string }) {
  const {
    gitBranch,
    gitChanges,
    stageFile,
    unstageFile,
    stageAll,
    unstageAll,
    commitChanges,
    gitLog,
    setActiveFile,
  } = useFileStore();

  const { emit } = useWorkflowEventBus();

  const [commitMessage, setCommitMessage] = useState("");
  const [showStaged, setShowStaged] = useState(true);
  const [showUnstaged, setShowUnstaged] = useState(true);
  const [showLog, setShowLog] = useState(true);
  const [activeTab, setActiveTab] = useState<"changes" | "log">("changes");

  const stagedFiles = gitChanges.filter((c) => c.staged);
  const unstagedFiles = gitChanges.filter((c) => !c.staged);

  const handleCommit = () => {
    if (!commitMessage.trim() || stagedFiles.length === 0) return;
    commitChanges(commitMessage);
    emit({
      type: "git-operation",
      detail: `提交: "${commitMessage}" (${stagedFiles.length} 文件)`,
    });
    setCommitMessage("");
  };

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="git"
        title="Git"
        icon={<GitBranch className="w-3 h-3 text-orange-400/70" />}
      >
        <div className="flex items-center gap-0.5 ml-2">
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="拉取"
            onClick={() =>
              emit({ type: "git-operation", detail: "拉取远程更新 (git pull)" })
            }
          >
            <Download className="w-3 h-3 text-slate-600" />
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="推送"
            onClick={() =>
              emit({
                type: "git-operation",
                detail: `推送到远程 (git push ${gitBranch})`,
              })
            }
          >
            <Upload className="w-3 h-3 text-slate-600" />
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="刷新"
          >
            <RefreshCw className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      </PanelHeader>

      {/* Branch info */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[0.72rem] text-slate-300">{gitBranch}</span>
          <div className="flex-1" />
          <span className="text-[0.6rem] text-slate-600">
            {gitChanges.length} 更改
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex-shrink-0 flex border-b border-[var(--ide-border-dim)]">
        <button
          onClick={() => setActiveTab("changes")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[0.68rem] transition-colors ${
            activeTab === "changes"
              ? "text-sky-400 border-b border-sky-500"
              : "text-slate-600 hover:text-slate-400"
          }`}
        >
          <GitPullRequest className="w-3 h-3" />
          更改
          {gitChanges.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-sky-600/30 text-[0.55rem] flex items-center justify-center text-sky-400">
              {gitChanges.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[0.68rem] transition-colors ${
            activeTab === "log"
              ? "text-sky-400 border-b border-sky-500"
              : "text-slate-600 hover:text-slate-400"
          }`}
        >
          <History className="w-3 h-3" />
          历史
        </button>
      </div>

      {activeTab === "changes" ? (
        <div className="flex-1 overflow-y-auto">
          {/* Commit input */}
          <div className="px-3 py-2 border-b border-[var(--ide-border-faint)]">
            <div className="flex items-center gap-1.5 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] rounded px-2 py-1.5">
              <input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommit();
                }}
                placeholder="提交信息..."
                className="flex-1 bg-transparent border-0 outline-none text-[0.72rem] text-slate-300 placeholder:text-slate-700"
              />
            </div>
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || stagedFiles.length === 0}
              className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-[0.68rem] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Check className="w-3 h-3" />
              提交 ({stagedFiles.length} 个文件)
            </button>
          </div>

          {/* Staged Changes */}
          <div className="border-b border-[var(--ide-border-subtle)]">
            <button
              onClick={() => setShowStaged(!showStaged)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/3 transition-colors"
            >
              {showStaged ? (
                <ChevronDown className="w-3 h-3 text-slate-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
              <span className="text-[0.68rem] text-slate-400">暂存的更改</span>
              <span className="text-[0.58rem] text-slate-700 ml-auto">
                {stagedFiles.length}
              </span>
              {stagedFiles.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    unstageAll();
                    emit({
                      type: "git-operation",
                      detail: `取消暂存全部 (${stagedFiles.length} 文件)`,
                    });
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10"
                  title="取消暂存所有"
                >
                  <Minus className="w-2.5 h-2.5 text-slate-600" />
                </button>
              )}
            </button>
            {showStaged &&
              stagedFiles.map((change) => (
                <div
                  key={change.path}
                  className="flex items-center gap-1.5 px-3 py-1 pl-7 hover:bg-white/3 cursor-pointer transition-colors group"
                  onClick={() => setActiveFile(change.path)}
                >
                  <FileCode2 className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <span className="text-[0.68rem] text-slate-400 flex-1 truncate">
                    {change.path.split("/").pop()}
                  </span>
                  <span
                    className={`text-[0.58rem] ${getStatusColor(
                      change.status,
                    )} flex-shrink-0`}
                  >
                    {getStatusLabel(change.status)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      unstageFile(change.path);
                    }}
                    className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10"
                    title="取消暂存"
                  >
                    <Minus className="w-2.5 h-2.5 text-slate-500" />
                  </button>
                </div>
              ))}
          </div>

          {/* Unstaged Changes */}
          <div>
            <button
              onClick={() => setShowUnstaged(!showUnstaged)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/3 transition-colors"
            >
              {showUnstaged ? (
                <ChevronDown className="w-3 h-3 text-slate-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
              <span className="text-[0.68rem] text-slate-400">更改</span>
              <span className="text-[0.58rem] text-slate-700 ml-auto">
                {unstagedFiles.length}
              </span>
              {unstagedFiles.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stageAll();
                    emit({
                      type: "git-operation",
                      detail: `暂存全部 (${unstagedFiles.length} 文件)`,
                    });
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10"
                  title="暂存所有"
                >
                  <Plus className="w-2.5 h-2.5 text-slate-600" />
                </button>
              )}
            </button>
            {showUnstaged &&
              unstagedFiles.map((change) => (
                <div
                  key={change.path}
                  className="flex items-center gap-1.5 px-3 py-1 pl-7 hover:bg-white/3 cursor-pointer transition-colors group"
                  onClick={() => setActiveFile(change.path)}
                >
                  <FileCode2 className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <span className="text-[0.68rem] text-slate-400 flex-1 truncate">
                    {change.path.split("/").pop()}
                  </span>
                  <span
                    className={`text-[0.58rem] ${getStatusColor(
                      change.status,
                    )} flex-shrink-0`}
                  >
                    {getStatusLabel(change.status)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stageFile(change.path);
                    }}
                    className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10"
                    title="暂存"
                  >
                    <Plus className="w-2.5 h-2.5 text-slate-500" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* Git Log */
        <div className="flex-1 overflow-y-auto">
          {gitLog.map((entry, i) => (
            <div
              key={`${entry.hash}-${i}`}
              className="flex items-start gap-2 px-3 py-2 border-b border-[var(--ide-border-subtle)] hover:bg-white/3 transition-colors"
            >
              <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                <Circle className="w-2.5 h-2.5 text-sky-500 fill-sky-500" />
                {i < gitLog.length - 1 && (
                  <div className="w-px flex-1 bg-[#1e3a5f]/30 mt-0.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.72rem] text-slate-300 truncate">
                  {entry.message}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[0.58rem] text-slate-700 font-mono">
                    {entry.hash}
                  </span>
                  <span className="text-[0.58rem] text-slate-600">
                    {entry.author}
                  </span>
                  <span className="text-[0.58rem] text-slate-700">
                    {entry.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Git Status Footer */}
      <div className="flex-shrink-0 border-t border-[var(--ide-border-faint)] px-3 py-1.5 flex items-center gap-2 text-[0.58rem] text-slate-700">
        <GitBranch className="w-2.5 h-2.5 text-orange-500/60" />
        <span>{gitBranch}</span>
        <div className="flex-1" />
        <GitCommit className="w-2.5 h-2.5" />
        <span>{gitLog.length} 提交</span>
      </div>
    </div>
  );
}
