/**
 * @file QuickActionsBar.tsx
 * @description 智能一键操作浮动工具栏 — 代码选中后弹出，提供复制/重构/优化/解释等一键操作，
 *              集成剪贴板历史、AI 辅助操作、上下文感知，对齐 P1-AI-一键操作交互.md 规范
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags quick-actions,toolbar,clipboard,ai,code-operations
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Copy,
  FileText,
  Code2,
  AlignLeft,
  RefreshCw,
  Zap,
  MessageSquare,
  Languages,
  PenTool,
  ListCollapse,
  BookOpen,
  FlaskConical,
  FileCheck,
  ArrowRightLeft,
  Check,
  X,
  Loader2,
  Clipboard,
  Clock,
  ChevronDown,
  Sparkles,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeTokens } from "./hooks/useThemeTokens";
import { useI18n } from "./i18n";
import { copyToClipboard } from "./utils/clipboard";
import {
  useQuickActionsStore,
  QUICK_ACTIONS,
  type QuickAction,
  type ActionType,
} from "./stores/useQuickActionsStore";
import {
  useQuickActionBridge,
  buildActionPrompt,
} from "./stores/useQuickActionBridge";
import { useFileStore } from "./FileStore";

// ── Icon Map ──
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Copy,
  FileText,
  Code2,
  AlignLeft,
  RefreshCw,
  Zap,
  MessageSquare,
  Languages,
  PenTool,
  ListCollapse,
  BookOpen,
  FlaskConical,
  FileCheck,
  ArrowRightLeft,
};

// ── Sub-views ──
type BarView = "actions" | "clipboard";

export default function QuickActionsBar() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const {
    showQuickBar,
    setShowQuickBar,
    currentContext,
    activeActionId,
    actionStatus,
    clipboardHistory,
    recentActions,
    addToClipboard,
    trackRecentAction,
    startAction,
    completeAction,
    clearClipboard,
    removeClipboardItem,
  } = useQuickActionsStore();

  const { activeFile, fileContents } = useFileStore();
  const [view, setView] = useState<BarView>("actions");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandAI, setExpandAI] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 自动填充上下文 — 如果无 selection 则用当前文件
  const effectiveContext = useMemo(() => {
    if (currentContext?.selection?.text) return currentContext;
    // Fallback: 整个活跃文件
    const content = fileContents[activeFile] || "";
    return {
      selection: { text: "" },
      file: {
        path: activeFile,
        name: activeFile.split("/").pop() || "",
        language: guessLanguage(activeFile),
        content,
      },
    };
  }, [currentContext, activeFile, fileContents]);

  const hasSelection = !!effectiveContext.selection.text;

  // 按 target 过滤可用操作
  const availableActions = useMemo(() => {
    if (!hasSelection) {
      return QUICK_ACTIONS.filter((a) => !a.requiresAI && a.type === "format");
    }
    return QUICK_ACTIONS.filter((a) => a.isAvailable);
  }, [hasSelection]);

  const codeActions = availableActions.filter(
    (a) => a.target === "code" && !a.requiresAI,
  );
  const aiActions = availableActions.filter((a) => a.requiresAI);
  const textActions = availableActions.filter(
    (a) => a.target === "text" || a.target === "document",
  );

  // ── 操作执行 ──

  const { dispatchToChat } = useQuickActionBridge();

  const executeAction = useCallback(
    async (action: QuickAction) => {
      const selText = effectiveContext.selection.text;
      if (!selText && action.type !== "format") return;

      startAction(action.id);
      trackRecentAction(action.type);

      try {
        switch (action.type) {
          case "copy": {
            await copyToClipboard(selText);
            addToClipboard({
              content: selText,
              type: "code",
              language: effectiveContext.file?.language,
              sourceFile: effectiveContext.file?.path,
            });
            break;
          }
          case "copy-markdown": {
            const lang = effectiveContext.file?.language || "text";
            const md = `\`\`\`${lang}\n${selText}\n\`\`\``;
            await copyToClipboard(md);
            addToClipboard({
              content: md,
              type: "text",
              sourceFile: effectiveContext.file?.path,
            });
            break;
          }
          case "copy-html": {
            const lang = effectiveContext.file?.language || "text";
            const html = `<pre><code class="language-${lang}">${escapeHTML(selText)}</code></pre>`;
            await copyToClipboard(html);
            addToClipboard({
              content: html,
              type: "text",
              sourceFile: effectiveContext.file?.path,
            });
            break;
          }
          default: {
            // AI 操作 — 构建提示词并派发到 LeftPanel 对话流
            if (action.requiresAI && selText) {
              const lang = effectiveContext.file?.language || "text";
              const filePath = effectiveContext.file?.path || activeFile;
              const prompt = buildActionPrompt(
                action.type,
                selText,
                lang,
                filePath,
              );

              dispatchToChat({
                id: `qa-${Date.now()}`,
                type: action.type,
                prompt,
                codeSnippet: selText,
                language: lang,
                filePath,
                timestamp: Date.now(),
              });

              // 关闭 QuickBar，让用户看到 LeftPanel 的 AI 响应
              setShowQuickBar(false);
            }
            break;
          }
        }

        completeAction({
          actionId: action.id,
          type: action.type,
          status: "success",
          timestamp: Date.now(),
        });
        setCopiedId(action.id);
        setTimeout(() => setCopiedId(null), 1500);
      } catch (err: unknown) {
        completeAction({
          actionId: action.id,
          type: action.type,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
          timestamp: Date.now(),
        });
      }
    },
    [
      effectiveContext,
      activeFile,
      startAction,
      completeAction,
      trackRecentAction,
      addToClipboard,
      dispatchToChat,
      setShowQuickBar,
    ],
  );

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowQuickBar(false);
      }
    };
    if (showQuickBar) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [showQuickBar, setShowQuickBar]);

  if (!showQuickBar) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[520px] max-w-[90vw] rounded-2xl border shadow-2xl backdrop-blur-xl ${th.page.cardBg} ${th.page.cardBorder}`}
      >
        {/* Tab Bar */}
        <div
          className={`flex items-center gap-1 px-3 pt-2 pb-1 border-b ${th.page.cardBorder}`}
        >
          <TabButton
            active={view === "actions"}
            onClick={() => setView("actions")}
            icon={Sparkles}
            label={t("ai.codeGeneration")}
            t={th}
          />
          <TabButton
            active={view === "clipboard"}
            onClick={() => setView("clipboard")}
            icon={Clipboard}
            label={t("common.paste")}
            count={clipboardHistory.length}
            t={th}
          />
          <div className="flex-1" />
          <button
            onClick={() => setShowQuickBar(false)}
            className={`p-1 rounded ${th.hoverBg}`}
          >
            <X className={`w-3.5 h-3.5 ${th.text.caption}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 max-h-[50vh] overflow-y-auto">
          {view === "actions" ? (
            <div className="space-y-3">
              {/* Selection info */}
              {hasSelection && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[0.72rem] ${th.page.shortcutRowBg}`}
                >
                  <Code2 className={`w-3 h-3 ${th.text.accent}`} />
                  <span className={th.text.caption}>
                    {effectiveContext.selection.text.split("\n").length} lines
                    selected
                    {effectiveContext.file?.name &&
                      ` · ${effectiveContext.file.name}`}
                  </span>
                </div>
              )}

              {/* Code Operations */}
              {codeActions.length > 0 && (
                <ActionGroup
                  title={t("ai.codeGeneration")}
                  actions={codeActions}
                  onExecute={executeAction}
                  activeId={activeActionId}
                  copiedId={copiedId}
                  th={th}
                />
              )}

              {/* AI Operations */}
              {aiActions.length > 0 && hasSelection && (
                <div>
                  <button
                    onClick={() => setExpandAI(!expandAI)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[0.78rem] ${th.text.secondary} ${th.hoverBg}`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${th.text.accent}`} />
                    AI {t("ai.codeGeneration")}
                    <ChevronDown
                      className={`w-3 h-3 ml-auto transition-transform ${expandAI ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandAI && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ActionGroup
                          actions={aiActions}
                          onExecute={executeAction}
                          activeId={activeActionId}
                          copiedId={copiedId}
                          th={th}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!hasSelection && (
                <div
                  className={`text-center py-6 text-[0.78rem] ${th.text.caption}`}
                >
                  {t("common.noData")} — Select code or text to see available
                  actions
                </div>
              )}
            </div>
          ) : (
            /* Clipboard History */
            <div className="space-y-2">
              {clipboardHistory.length === 0 ? (
                <div
                  className={`text-center py-6 text-[0.78rem] ${th.text.caption}`}
                >
                  {t("common.noData")}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[0.72rem] ${th.text.caption}`}>
                      {clipboardHistory.length} items
                    </span>
                    <button
                      onClick={clearClipboard}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[0.68rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("common.delete")}
                    </button>
                  </div>
                  {clipboardHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${th.page.shortcutRowBg} hover:ring-1 hover:ring-violet-500/30`}
                      onClick={async () => {
                        await copyToClipboard(item.content);
                        setCopiedId(item.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[0.58rem] px-1 py-0.5 rounded ${
                              item.type === "code"
                                ? th.status.infoBg
                                : th.status.warningBg
                            }`}
                          >
                            {item.type}
                          </span>
                          {item.language && (
                            <span
                              className={`text-[0.58rem] ${th.text.caption}`}
                            >
                              {item.language}
                            </span>
                          )}
                          <span className={`text-[0.58rem] ${th.text.muted}`}>
                            {formatAge(item.copiedAt)}
                          </span>
                        </div>
                        <pre
                          className={`text-[0.72rem] mt-1 whitespace-pre-wrap line-clamp-3 ${th.text.secondary}`}
                        >
                          {item.content.slice(0, 200)}
                          {item.content.length > 200 ? "..." : ""}
                        </pre>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className={`w-3.5 h-3.5 ${th.text.caption}`} />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClipboardItem(item.id);
                          }}
                          className={`p-0.5 rounded ${th.hoverBg}`}
                        >
                          <X className={`w-3 h-3 ${th.text.caption}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          className={`flex items-center gap-2 px-3 py-2 border-t text-[0.62rem] ${th.page.cardBorder} ${th.text.muted}`}
        >
          <Clock className="w-3 h-3" />
          Ctrl+Shift+A to toggle · Recent:{" "}
          {recentActions.slice(0, 3).join(", ") || "none"}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Sub-components ──

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  t: th,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  t: ReturnType<typeof useThemeTokens>;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] transition-colors ${
        active ? `${th.page.navActive}` : `${th.text.caption} ${th.hoverBg}`
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`text-[0.58rem] px-1 py-0.5 rounded-full min-w-[16px] text-center ${th.status.infoBg}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ActionGroup({
  title,
  actions,
  onExecute,
  activeId,
  copiedId,
  th,
}: {
  title?: string;
  actions: QuickAction[];
  onExecute: (action: QuickAction) => void;
  activeId: string | null;
  copiedId: string | null;
  th: ReturnType<typeof useThemeTokens>;
}) {
  return (
    <div>
      {title && (
        <div className={`text-[0.68rem] px-2 py-1 ${th.text.caption}`}>
          {title}
        </div>
      )}
      <div className="grid grid-cols-3 gap-1">
        {actions.map((action) => {
          const IconComp = ICON_MAP[action.icon] || Zap;
          const isActive = activeId === action.id;
          const isCopied = copiedId === action.id;

          return (
            <button
              key={action.id}
              onClick={() => onExecute(action)}
              disabled={isActive}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[0.75rem] transition-all ${
                isCopied
                  ? "bg-emerald-500/10 text-emerald-400"
                  : isActive
                    ? "opacity-50 cursor-not-allowed"
                    : `${th.text.secondary} ${th.hoverBg} hover:ring-1 hover:ring-violet-500/20`
              }`}
            >
              {isActive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isCopied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <IconComp
                  className={`w-3.5 h-3.5 ${action.requiresAI ? th.text.accent : ""}`}
                />
              )}
              <span className="truncate">{action.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ──

function guessLanguage(filepath: string): string {
  const ext = filepath.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
  };
  return map[ext || ""] || "text";
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAge(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
