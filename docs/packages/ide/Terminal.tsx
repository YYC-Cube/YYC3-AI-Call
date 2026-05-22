/**
 * @file Terminal.tsx
 * @description 集成终端组件，支持多终端标签页、命令历史、Tab 补全、
 *              主题适配、命令执行（基于 CommandRegistry）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags terminal,shell,commands,tabs,panel
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Trash2,
  Maximize2,
  Play,
  CornerDownLeft,
  Clipboard,
  Zap,
  GripHorizontal,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Upload,
  Download,
  Search,
  FileDiff,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useWorkflowEventBus } from "./WorkflowEventBus";
import { useFileStore } from "./FileStore";
import {
  executeCommand as registryExecuteCommand,
  getCompletions as registryGetCompletions,
  type CommandContext,
  type CommandOutput,
} from "./ai/CommandRegistry";

interface TerminalProps {
  height: number;
  onHeightChange: (h: number) => void;
  visible: boolean;
  onToggle: () => void;
}

interface TerminalEntry {
  type: "input" | "output" | "error" | "success";
  text: string;
}

interface TerminalSession {
  name: string;
  history: TerminalEntry[];
  commandHistory: string[];
  historyIndex: number;
}

const INITIAL_HISTORY: TerminalEntry[] = [
  { type: "input", text: "$ npm run dev" },
  { type: "success", text: "  VITE v5.4.0  ready in 342ms" },
  { type: "output", text: "" },
  { type: "output", text: "  ➜  Local:   http://localhost:5173/" },
  { type: "output", text: "  ➜  Network: http://192.168.1.100:5173/" },
  { type: "output", text: "" },
  { type: "input", text: "$ npx tsc --noEmit" },
  { type: "success", text: "✓ 无类型错误" },
  { type: "output", text: "" },
  { type: "input", text: "$ git status" },
  { type: "output", text: "位于分支 main" },
  { type: "output", text: "已修改: src/app/App.tsx" },
  { type: "output", text: "新文件: src/app/components/DataTable.tsx" },
];

export default function Terminal({
  height,
  onHeightChange,
  visible,
  onToggle,
}: TerminalProps) {
  const { emit } = useWorkflowEventBus();
  const {
    fileContents,
    updateFile,
    createFile,
    deleteFile,
    renameFile,
    setActiveFile,
  } = useFileStore();

  // ── Build CommandContext for CommandRegistry ──
  const buildCommandContext = useCallback(
    (): CommandContext => ({
      cwd: "/project",
      fileContents,
      createFile: (path: string, content?: string) =>
        createFile(path, content ?? ""),
      deleteFile: (path: string) => deleteFile(path),
      renameFile: (oldPath: string, newPath: string) =>
        renameFile(oldPath, newPath),
      updateFile: (path: string, content: string) => updateFile(path, content),
      openFile: (path: string) => setActiveFile(path),
      env: {
        NODE_ENV: "development",
        SHELL: "/bin/bash",
        USER: "yyc3-user",
        HOME: "/home/yyc3-user",
        PWD: "/project",
      },
      gitBranch: "main",
      gitChanges: [],
    }),
    [
      fileContents,
      createFile,
      deleteFile,
      renameFile,
      updateFile,
      setActiveFile,
    ],
  );

  const [terminals, setTerminals] = useState<TerminalSession[]>([
    {
      name: "终端 1",
      history: INITIAL_HISTORY,
      commandHistory: ["npm run dev", "npx tsc --noEmit", "git status"],
      historyIndex: -1,
    },
  ]);
  const [activeTerminal, setActiveTerminal] = useState(0);
  const [terminalInput, setTerminalInput] = useState("");
  const [showGitBar, setShowGitBar] = useState(false);
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(-1);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const session = terminals[activeTerminal] || terminals[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.history.length]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startH: height };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const delta = dragRef.current.startY - ev.clientY;
        const newH = Math.max(
          100,
          Math.min(400, dragRef.current.startH + delta),
        );
        onHeightChange(newH);
      };

      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [height, onHeightChange],
  );

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      // Emit workflow events
      emit({ type: "terminal-command", detail: `$ ${trimmed}` });
      if (trimmed.startsWith("git ")) {
        emit({ type: "git-operation", detail: trimmed });
      }

      setTerminals((prev) => {
        const next = [...prev];
        const s = { ...next[activeTerminal] };
        s.commandHistory = [...s.commandHistory, trimmed];
        s.historyIndex = -1;

        if (trimmed === "clear") {
          s.history = [];
        } else {
          const inputEntry: TerminalEntry = {
            type: "input",
            text: `$ ${trimmed}`,
          };
          // ── Use CommandRegistry for real file-system-aware commands ──
          const ctx = buildCommandContext();
          const cmdOutput: CommandOutput[] = registryExecuteCommand(
            trimmed,
            ctx,
          );
          // Handle __CLEAR__ sentinel from CommandRegistry's clear command
          const hasClear = cmdOutput.some((o) => o.text === "__CLEAR__");
          if (hasClear) {
            s.history = [];
          } else {
            const output: TerminalEntry[] = cmdOutput.map((o) => ({
              type:
                o.type === "warning"
                  ? ("output" as const)
                  : o.type === "info"
                    ? ("output" as const)
                    : (o.type as TerminalEntry["type"]),
              text: o.text,
            }));
            s.history = [...s.history, inputEntry, ...output];
          }
        }

        next[activeTerminal] = s;
        return next;
      });
      setTerminalInput("");
    },
    [activeTerminal, emit, buildCommandContext],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(terminalInput);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const cmdHist = session.commandHistory;
      if (cmdHist.length === 0) return;
      const newIndex =
        session.historyIndex < 0
          ? cmdHist.length - 1
          : Math.max(0, session.historyIndex - 1);
      setTerminals((prev) => {
        const next = [...prev];
        next[activeTerminal] = {
          ...next[activeTerminal],
          historyIndex: newIndex,
        };
        return next;
      });
      setTerminalInput(cmdHist[newIndex] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const cmdHist = session.commandHistory;
      if (session.historyIndex < 0) return;
      const newIndex = session.historyIndex + 1;
      if (newIndex >= cmdHist.length) {
        setTerminals((prev) => {
          const next = [...prev];
          next[activeTerminal] = { ...next[activeTerminal], historyIndex: -1 };
          return next;
        });
        setTerminalInput("");
      } else {
        setTerminals((prev) => {
          const next = [...prev];
          next[activeTerminal] = {
            ...next[activeTerminal],
            historyIndex: newIndex,
          };
          return next;
        });
        setTerminalInput(cmdHist[newIndex] || "");
      }
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setTerminals((prev) => {
        const next = [...prev];
        next[activeTerminal] = { ...next[activeTerminal], history: [] };
        return next;
      });
    } else if (e.key === "Tab") {
      e.preventDefault();
      const currentInput = terminalInput.trim();

      // ── 路径补全检测: 检查最后一个 token 是否像文件路径 ──
      const PATH_CMDS = [
        "ls",
        "cat",
        "cd",
        "vim",
        "nano",
        "code",
        "cp",
        "mv",
        "rm",
        "mkdir",
        "touch",
        "git add",
        "git diff",
        "git checkout",
      ];
      const parts = currentInput.split(/\s+/);
      const lastToken = parts[parts.length - 1] || "";
      const cmdPrefix = parts.slice(0, -1).join(" ");
      const isPathContext =
        parts.length >= 2 &&
        (PATH_CMDS.some((pc) => currentInput.startsWith(`${pc  } `)) ||
          lastToken.includes("/") ||
          lastToken.includes("."));

      if (isPathContext && tabSuggestions.length === 0) {
        // 基于 FileStore 的文件路径补全
        const allPaths = Object.keys(fileContents);
        // 同时收集目录路径
        const dirSet = new Set<string>();
        for (const p of allPaths) {
          const segs = p.split("/");
          for (let i = 1; i < segs.length; i++) {
            dirSet.add(`${segs.slice(0, i).join("/")  }/`);
          }
        }
        const allEntries = [...allPaths, ...Array.from(dirSet)].sort();

        const matchPrefix = lastToken;
        const pathMatches = matchPrefix
          ? allEntries.filter(
              (p) => p.startsWith(matchPrefix) && p !== matchPrefix,
            )
          : allEntries.slice(0, 12);

        if (pathMatches.length === 1) {
          // 唯一匹配 — 自动补全
          setTerminalInput(
            cmdPrefix ? `${cmdPrefix  } ${  pathMatches[0]}` : pathMatches[0],
          );
          setTabSuggestions([]);
          setTabIndex(-1);
        } else if (pathMatches.length > 0) {
          // 多个匹配 — 展示候选(显示路径而非完整命令)
          const suggestions = pathMatches
            .slice(0, 10)
            .map((p) => (cmdPrefix ? `${cmdPrefix  } ${  p}` : p));
          setTabSuggestions(suggestions);
          setTabIndex(0);
          setTerminalInput(suggestions[0]);
        }
        // 如果无路径匹配则 fall through 到命令补全
        if (pathMatches.length > 0) return;
      }

      // Build smart candidate list from history + common commands
      const BUILTIN_CMDS = [
        "ls",
        "pwd",
        "echo",
        "date",
        "whoami",
        "node -v",
        "npm -v",
        "npm run dev",
        "npm run build",
        "npm install",
        "npx tsc --noEmit",
        "git status",
        "git add .",
        'git commit -m "update"',
        "git push",
        "git pull",
        "git diff",
        "git log --oneline",
        "git branch",
        "git stash",
        "git stash pop",
        "git checkout",
        "git merge",
        "clear",
        "help",
      ];
      const allCandidates = [
        ...new Set([...session.commandHistory, ...BUILTIN_CMDS]),
      ];

      if (tabSuggestions.length > 0) {
        // Cycle through existing suggestions
        const nextIdx = (tabIndex + 1) % tabSuggestions.length;
        setTabIndex(nextIdx);
        setTerminalInput(tabSuggestions[nextIdx]);
      } else {
        // Generate new suggestions
        const filtered = currentInput
          ? allCandidates.filter(
              (c) => c.startsWith(currentInput) && c !== currentInput,
            )
          : allCandidates.slice(-8);
        if (filtered.length === 1) {
          // Single match — auto-complete
          setTerminalInput(filtered[0]);
          setTabSuggestions([]);
          setTabIndex(-1);
        } else if (filtered.length > 0) {
          setTabSuggestions(filtered.slice(0, 8));
          setTabIndex(0);
          setTerminalInput(filtered[0]);
        }
      }
    } else if (e.key === "Escape") {
      setTabSuggestions([]);
      setTabIndex(-1);
    } else {
      // Any other key clears tab suggestions
      if (tabSuggestions.length > 0) {
        setTabSuggestions([]);
        setTabIndex(-1);
      }
    }
  };

  const handleClear = () => {
    setTerminals((prev) => {
      const next = [...prev];
      next[activeTerminal] = { ...next[activeTerminal], history: [] };
      return next;
    });
  };

  const addTerminal = () => {
    const newSession: TerminalSession = {
      name: `终端 ${terminals.length + 1}`,
      history: [],
      commandHistory: [],
      historyIndex: -1,
    };
    setTerminals((prev) => [...prev, newSession]);
    setActiveTerminal(terminals.length);
  };

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="h-7 w-full flex items-center gap-1.5 px-3 border-t border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)] text-[0.65rem] text-slate-600 hover:text-sky-400 hover:bg-[var(--ide-bg-inset)] transition-colors"
      >
        <TerminalIcon className="w-3 h-3" />
        <span>终端</span>
      </button>
    );
  }

  return (
    <div
      className="flex flex-col border-t border-[var(--ide-border-dim)] bg-[var(--ide-bg-deep)]"
      style={{ height: `${height}px` }}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleDragStart}
        className="h-1.5 cursor-row-resize flex items-center justify-center hover:bg-sky-900/30 transition-colors group"
      >
        <GripHorizontal className="w-4 h-3 text-slate-800 group-hover:text-sky-500/50" />
      </div>

      {/* Terminal Header with Tabs */}
      <div className="flex-shrink-0 flex items-center border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-dark)]">
        {/* Left section */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-[0.6rem] text-slate-600 border-r border-dashed border-[var(--ide-border-faint)]">
          <TerminalIcon className="w-3 h-3 text-slate-500" />
          <span>集成终端</span>
          <Clipboard className="w-2.5 h-2.5 text-slate-700 ml-1" />
          <span>命令行</span>
        </div>

        {/* Terminal tabs */}
        <div className="flex items-center">
          {terminals.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTerminal(i)}
              className={`flex items-center gap-1 px-2 py-1 text-[0.62rem] transition-colors ${
                i === activeTerminal
                  ? "text-sky-400 bg-[var(--ide-bg-inset)]"
                  : "text-slate-600 hover:text-slate-400"
              }`}
            >
              <TerminalIcon className="w-2.5 h-2.5" />
              {t.name}
              {terminals.length > 1 && (
                <X
                  className="w-2.5 h-2.5 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTerminals((prev) => prev.filter((_, idx) => idx !== i));
                    if (activeTerminal >= terminals.length - 1)
                      setActiveTerminal(Math.max(0, terminals.length - 2));
                  }}
                />
              )}
            </button>
          ))}
          <button
            onClick={addTerminal}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 ml-0.5"
          >
            <Plus className="w-2.5 h-2.5 text-slate-700" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Right section */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-[0.6rem] text-slate-600 border-l border-dashed border-[var(--ide-border-faint)]">
          <Zap className="w-2.5 h-2.5 text-yellow-500/50" />
          <span>命令执行</span>
          <span className="text-slate-700">快速操作</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 pr-2">
          <button
            onClick={handleClear}
            className="w-4.5 h-4.5 rounded flex items-center justify-center hover:bg-white/5"
            title="清屏 (Ctrl+L)"
          >
            <Trash2 className="w-2.5 h-2.5 text-slate-700" />
          </button>
          <button
            className="w-4.5 h-4.5 rounded flex items-center justify-center hover:bg-white/5"
            title="全屏"
          >
            <Maximize2 className="w-2.5 h-2.5 text-slate-700" />
          </button>
          <button
            onClick={onToggle}
            className="w-4.5 h-4.5 rounded flex items-center justify-center hover:bg-white/5"
            title="关闭终端"
          >
            <X className="w-2.5 h-2.5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Git Quick Commands Bar */}
      <div className="flex-shrink-0 flex items-center border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-dark)]">
        <button
          onClick={() => setShowGitBar(!showGitBar)}
          className={`flex items-center gap-1 px-2 py-1 text-[0.58rem] transition-colors ${
            showGitBar
              ? "text-orange-400"
              : "text-slate-700 hover:text-slate-500"
          }`}
          title="Git 快捷命"
        >
          <GitBranch className="w-2.5 h-2.5" />
          <span>Git</span>
          {showGitBar ? (
            <ChevronDown className="w-2.5 h-2.5" />
          ) : (
            <ChevronRight className="w-2.5 h-2.5" />
          )}
        </button>

        {showGitBar && (
          <div className="flex items-center gap-0.5 px-1 overflow-x-auto">
            {[
              {
                label: "status",
                cmd: "git status",
                icon: Search,
                color: "text-sky-400",
              },
              {
                label: "add .",
                cmd: "git add .",
                icon: Plus,
                color: "text-emerald-400",
              },
              {
                label: "commit",
                cmd: 'git commit -m "update"',
                icon: GitCommit,
                color: "text-amber-400",
              },
              {
                label: "push",
                cmd: "git push",
                icon: Upload,
                color: "text-purple-400",
              },
              {
                label: "pull",
                cmd: "git pull",
                icon: Download,
                color: "text-cyan-400",
              },
              {
                label: "diff",
                cmd: "git diff",
                icon: FileDiff,
                color: "text-orange-400",
              },
              {
                label: "log",
                cmd: "git log --oneline",
                icon: GitPullRequest,
                color: "text-slate-400",
              },
              {
                label: "branch",
                cmd: "git branch",
                icon: GitBranch,
                color: "text-pink-400",
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => executeCommand(item.cmd)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.55rem] text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors whitespace-nowrap"
                title={item.cmd}
              >
                <item.icon className={`w-2.5 h-2.5 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Terminal Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-2.5 font-mono text-[0.68rem]"
        onClick={() => inputRef.current?.focus()}
      >
        {session.history.map((entry, i) => (
          <div
            key={i}
            className={`${
              entry.type === "input"
                ? "text-emerald-400"
                : entry.type === "error"
                  ? "text-red-400"
                  : entry.type === "success"
                    ? "text-emerald-300"
                    : "text-slate-500"
            } ${entry.text === "" ? "h-2.5" : ""}`}
          >
            {entry.text}
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-emerald-400">$</span>
          <input
            ref={inputRef}
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 outline-none text-slate-300 text-[0.68rem] font-mono"
            placeholder="输入命令..."
          />
        </div>
        {/* Tab completion suggestions row */}
        {tabSuggestions.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap mt-1 px-2">
            <span className="text-[0.55rem] text-slate-700 mr-1">Tab:</span>
            {tabSuggestions.map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  setTerminalInput(s);
                  setTabSuggestions([]);
                  setTabIndex(-1);
                  inputRef.current?.focus();
                }}
                className={`px-1.5 py-0.5 rounded text-[0.6rem] font-mono transition-colors ${
                  i === tabIndex
                    ? "text-sky-300 bg-sky-500/15"
                    : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            ))}
            <span className="text-[0.5rem] text-slate-800 ml-auto">
              Tab 循环 · Esc 取消
            </span>
          </div>
        )}
      </div>

      {/* Terminal Status Bar */}
      <div className="flex-shrink-0 border-t border-[var(--ide-border-subtle)] px-2.5 py-1 flex items-center gap-3 text-[0.58rem] text-slate-700">
        <div className="flex items-center gap-1">
          <Play className="w-2.5 h-2.5 text-emerald-500" />
          <span>运行中</span>
        </div>
        <span>bash</span>
        <span>UTF-8</span>
        <div className="flex-1" />
        <span className="text-slate-800">
          {session.commandHistory.length} 条历史
        </span>
        <div className="flex items-center gap-1">
          <CornerDownLeft className="w-2.5 h-2.5" />
          <span>Enter 执行</span>
        </div>
      </div>
    </div>
  );
}
