/**
 * @file LeftPanel.tsx
 * @description AI 对话面板（重构版），集成真实 LLM 调用（六大 Provider SSE 流式）、
 *              代码生成流水线、Diff 预览确认、会话历史、跨面板 AI 修复通信、
 *              QuickActions 桥接（ref 回调模式）、TaskBoard 自动任务提取、
 *              AI 上下文增强（当前打开文件自动注入系统提示词）
 *              拆分为 ModelSelector / ConnectivityIndicator / ChatMessageList / ChatInputArea 四子组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v3.0.0
 * @created 2026-03-06
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,chat,llm,pipeline,streaming,diff-preview,quick-actions,task-inference,context-enhanced
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, Plus, History, Maximize2, Trash2 } from "lucide-react";
import { PanelHeader } from "./PanelManager";
import { useFileStore } from "./FileStore";
import { useModelRegistry } from "./ModelRegistry";
import { useWorkflowEventBus } from "./WorkflowEventBus";
import { extractCodeBlock } from "./LLMService";
import {
  createSessionId,
  saveMessages,
  listSessions,
  loadMessages,
  deleteSession,
  type ChatSession,
  type PersistedMessage,
} from "./ChatHistoryStore";
import {
  runPipeline,
  applyPlan,
  type CodeApplicationPlan,
} from "./ai/AIPipeline";
import { detectIntent } from "./ai/SystemPromptBuilder";
import DiffPreviewModal from "./DiffPreviewModal";
import { type ParsedCodeBlock } from "./ai/CodeApplicator";
import { useAIFixStore } from "./stores/useAIFixStore";
import { getSettingsEnhancedInstructions } from "./SettingsBridge";
import { useQuickActionBridge } from "./stores/useQuickActionBridge";
import { useTaskBoardStore } from "./stores/useTaskBoardStore";
import { extractTasksFromResponse } from "./ai/TaskInferenceEngine";

// ── Sub-components ──
import ChatMessageList, {
  type ChatMessage,
} from "./left-panel/ChatMessageList";
import ChatInputArea from "./left-panel/ChatInputArea";
import { useChatSessionSync } from "./hooks/useChatSessionSync";

// ── Constants ──

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "你好！我是 YYC³ AI 编程助手。\n\n已支持真实 LLM 调用：\n• 🟢 Ollama 本地（自动检测）\n• 🔵 智谱 GLM 4.5/4.6/4.7\n• 🟠 通义千问 Qwen3\n• ⚪ OpenAI GPT-4o\n• 🔷 DeepSeek V3/R1\n\n点击上方 ⚙️ 配置 API Key 后即可开始对话。",
    timestamp: "10:00",
  },
];

// ── AI Context Enhancement: build active file context injection ──

function buildActiveFileContextInjection(
  activeFile: string,
  fileContents: Record<string, string>,
  openTabs: { path: string; modified: boolean }[],
): string {
  const parts: string[] = [];

  // 1. Current active file — full content (up to 10000 chars)
  const activeContent = fileContents[activeFile];
  if (activeContent) {
    const ext = activeFile.split(".").pop() || "";
    const langMap: Record<string, string> = {
      tsx: "tsx",
      ts: "typescript",
      jsx: "jsx",
      js: "javascript",
      css: "css",
      json: "json",
      md: "markdown",
      html: "html",
    };
    const lang = langMap[ext] || ext;
    const truncated =
      activeContent.length > 10000
        ? `${activeContent.slice(0, 10000)
          }\n// ... (truncated, ${
          activeContent.length
          } chars total)`
        : activeContent;
    parts.push(
      `[当前编辑文件] ${activeFile} (${activeContent.length} chars):\n\`\`\`${lang}\n${truncated}\n\`\`\``,
    );
  }

  // 2. Other open tabs — first 200 chars preview each (max 3 tabs)
  const otherTabs = openTabs
    .filter((t) => t.path !== activeFile && fileContents[t.path])
    .slice(0, 3);
  if (otherTabs.length > 0) {
    const tabPreviews = otherTabs.map((t) => {
      const content = fileContents[t.path];
      const preview =
        content.length > 200 ? `${content.slice(0, 200)  }...` : content;
      return `- ${t.path}${t.modified ? " (已修改)" : ""}:\n  ${preview.split("\n").slice(0, 5).join("\n  ")}`;
    });
    parts.push(
      `[其他打开文件] ${otherTabs.length} 个:\n${tabPreviews.join("\n")}`,
    );
  }

  return parts.length > 0 ? parts.join("\n\n") : "";
}

// ── Main Component ──

export default function LeftPanel({ nodeId }: { nodeId: string }) {
  const {
    activeFile,
    updateFile,
    createFile,
    setActiveFile,
    fileContents,
    openTabs,
    gitBranch,
    gitChanges,
  } = useFileStore();
  const {
    models,
    activeModelId,
    activeModel,
    setActiveModelId,
    setShowSettings,
    setShowModelSettingsV2,
    getActiveProvider,
    hasProviderKey,
    connectivityResults,
    setConnectivityResult,
    providers,
    ollamaStatus,
  } = useModelRegistry();

  const { emit } = useWorkflowEventBus();
  const navigate = useNavigate();
  const aiFixRequest = useAIFixStore((s) => s.pendingRequest);
  const consumeAIFixRequest = useAIFixStore((s) => s.consumeRequest);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Diff Preview Modal state ─
  const [pendingPlan, setPendingPlan] = useState<CodeApplicationPlan | null>(
    null,
  );

  const handleDiffApply = useCallback(
    (selectedBlocks: ParsedCodeBlock[]) => {
      const filteredPlan: CodeApplicationPlan = {
        blocks: selectedBlocks,
        summary: pendingPlan?.summary || "",
        fileCount: selectedBlocks.length,
        newFileCount: selectedBlocks.filter((b) => b.isNew).length,
        modifiedFileCount: selectedBlocks.filter((b) => !b.isNew).length,
      };
      const result = applyPlan(filteredPlan, updateFile, (p, c) =>
        createFile(p, c),
      );
      if (result.appliedFiles.length > 0) {
        emit({
          type: "code-applied",
          detail: `已应用 ${result.appliedFiles.length}/${pendingPlan?.blocks.length || 0} 个文件`,
        });
        setActiveFile(result.appliedFiles[0]);
      }
      if (result.errors.length > 0) {
        emit({
          type: "error-feedback",
          detail: `应用错误: ${result.errors[0]}`,
        });
      }
      setPendingPlan(null);
    },
    [pendingPlan, updateFile, createFile, setActiveFile, emit],
  );

  const handleDiffCancel = useCallback(() => {
    setPendingPlan(null);
    emit({ type: "user-decided", detail: "用户取消了代码应用" });
  }, [emit]);

  // ── Session persistence ──
  const [sessionId, setSessionId] = useState(() => createSessionId());
  const [sessionList, setSessionList] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSessionList(listSessions("ide"));
  }, []);

  useEffect(() => {
    if (messages.length <= 1 || messages.some((m) => m.isStreaming)) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const toSave: PersistedMessage[] = messages
        .filter((m) => !m.isStreaming && m.content)
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          modelName: m.modelName,
          error: m.error,
          codeBlock: m.codeBlock,
        }));
      saveMessages("ide", sessionId, toSave, activeModelId);
      setSessionList(listSessions("ide"));
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, sessionId, activeModelId]);

  const handleLoadSession = useCallback((session: ChatSession) => {
    const loaded = loadMessages("ide", session.id);
    if (loaded.length > 0) {
      setMessages(
        loaded.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          modelName: m.modelName,
          error: m.error,
          codeBlock: m.codeBlock,
        })),
      );
      setSessionId(session.id);
    }
    setShowHistory(false);
  }, []);

  const handleNewSession = useCallback(() => {
    setSessionId(createSessionId());
    setMessages(INITIAL_MESSAGES);
    setShowHistory(false);
  }, []);

  const handleDeleteSession = useCallback(
    (sid: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteSession("ide", sid);
      setSessionList(listSessions("ide"));
      if (sid === sessionId) {
        handleNewSession();
      }
    },
    [sessionId, handleNewSession],
  );

  const handleJumpFullscreen = useCallback(() => {
    navigate("/ai-chat");
  }, [navigate]);

  // ── Send message with real LLM streaming + AI Context Enhancement ──
  const sendMessageDirect = useCallback(
    (inputText: string) => {
      if (!inputText.trim() || isStreaming) return;

      const provider = getActiveProvider();
      if (!provider) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "",
            timestamp: new Date().toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            error: "请先选择一个可用的模型。点击上方 ⚙️ 配置 API Key。",
          },
        ]);
        return;
      }

      if (provider.authType === "bearer" && !hasProviderKey(provider.id)) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "user",
            content: inputText,
            timestamp: new Date().toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "",
            timestamp: new Date().toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            error: `请先配置 ${provider.name} 的 API Key。点击上方 ⚙️ 按钮进入设置。`,
          },
        ]);
        return;
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: inputText,
        timestamp: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isStreaming: true,
        modelName: activeModel?.name,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setChatInput("");
      setIsStreaming(true);

      emit({
        type: "ai-triggered",
        detail: `用户输入: ${inputText.slice(0, 50)}${inputText.length > 50 ? "..." : ""}`,
      });
      emit({
        type: "context-collected",
        detail: `上下文: ${activeFile.split("/").pop()}, ${messages.length} 条历史`,
      });

      const conversationHistory = messages
        .filter((m) => !m.error && m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      const intent = detectIntent(inputText);
      emit({ type: "ai-understood", detail: `意图: ${intent}` });

      // ── AI Context Enhancement: inject active file content into custom instructions ──
      const baseInstructions = getSettingsEnhancedInstructions();
      const activeFileContext = buildActiveFileContextInjection(
        activeFile,
        fileContents,
        openTabs.map((t) => ({ path: t.path, modified: t.modified })),
      );
      const enhancedInstructions = activeFileContext
        ? `${baseInstructions}\n\n## 当前工作区上下文\n\n${activeFileContext}`
        : baseInstructions;

      const taskBoardAddInferences = useTaskBoardStore.getState().addInferences;

      runPipeline(
        {
          userMessage: inputText,
          conversationHistory,
          fileContents,
          activeFile,
          openTabs: openTabs.map((t) => ({
            path: t.path,
            modified: t.modified,
          })),
          gitBranch,
          gitChanges: gitChanges.map((c) => ({
            path: c.path,
            status: c.status,
            staged: c.staged,
          })),
          provider,
          modelId: activeModel?.modelId || "",
          customInstructions: enhancedInstructions,
        },
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + token }
                  : m,
              ),
            );
          },
          onDone: (fullText, codePlan) => {
            const codeBlock = extractCodeBlock(fullText);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      codeBlock: codeBlock || undefined,
                    }
                  : m,
              ),
            );
            setIsStreaming(false);
            abortRef.current = null;

            if (codePlan && codePlan.blocks.length > 0) {
              emit({ type: "code-generated", detail: codePlan.summary });
              setPendingPlan(codePlan);
            }

            emit({
              type: "ai-understood",
              detail: `模型: ${activeModel?.name}, tokens: ~${fullText.length}`,
            });
            emit({
              type: "suggestions-ready",
              detail: codeBlock
                ? "含代码块建议"
                : codePlan
                  ? `${codePlan.fileCount} 文件代码计划`
                  : "纯文本回复",
            });

            // ── TaskBoard: Auto-infer tasks from AI response ──
            try {
              const inferredTasks = extractTasksFromResponse(
                fullText,
                inputText,
                assistantMsgId,
              );
              if (inferredTasks.length > 0) {
                taskBoardAddInferences(inferredTasks);
                emit({
                  type: "ai-understood",
                  detail: `推理出 ${inferredTasks.length} 个任务`,
                });
              }
            } catch {
              // Task inference is best-effort, never block main flow
            }
          },
          onError: (errorMsg) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, isStreaming: false, error: errorMsg, content: "" }
                  : m,
              ),
            );
            setIsStreaming(false);
            abortRef.current = null;
            emit({
              type: "error-feedback",
              detail: `AI 错误: ${errorMsg.slice(0, 60)}`,
            });
          },
          onContextReady: (ctx, detectedIntent) => {
            emit({
              type: "context-collected",
              detail: `上下文: ${ctx.totalFiles} 文件, 意图: ${detectedIntent}`,
            });
          },
        },
        { signal: controller.signal },
      );
    },
    [
      isStreaming,
      activeModel,
      getActiveProvider,
      hasProviderKey,
      messages,
      activeFile,
      emit,
      fileContents,
      openTabs,
      gitBranch,
      gitChanges,
      updateFile,
      createFile,
      setActiveFile,
    ],
  );

  // ── Stable ref for external callers ──
  const sendMessageRef = useRef(sendMessageDirect);
  useEffect(() => {
    sendMessageRef.current = sendMessageDirect;
  }, [sendMessageDirect]);

  const handleSend = useCallback(() => {
    if (!chatInput.trim()) return;
    sendMessageRef.current(chatInput);
  }, [chatInput]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const handleApplyCode = useCallback(
    (code: string) => {
      if (activeFile) updateFile(activeFile, code);
    },
    [activeFile, updateFile],
  );

  const handleInsertCode = useCallback(
    (code: string, lang: string) => {
      const ext = lang === "tsx" ? ".tsx" : lang === "ts" ? ".ts" : ".tsx";
      const name = `Generated${Date.now().toString().slice(-4)}${ext}`;
      const path = `src/app/components/${name}`;
      createFile(path, code);
      setActiveFile(path);
    },
    [createFile, setActiveFile],
  );

  // ── AI Fix Request from Diagnostics Panel ──
  useEffect(() => {
    if (!aiFixRequest || isStreaming) return;
    const req = consumeAIFixRequest();
    if (!req) return;
    sendMessageRef.current(req.prompt);
  }, [aiFixRequest, isStreaming, consumeAIFixRequest]);

  // ── QuickActions → Chat Bridge ──
  const pendingQuickAction = useQuickActionBridge((s) => s.pendingAction);
  const consumeQuickAction = useQuickActionBridge((s) => s.consumePending);

  useEffect(() => {
    if (!pendingQuickAction || isStreaming) return;
    const action = consumeQuickAction();
    if (!action) return;
    sendMessageRef.current(action.prompt);
  }, [pendingQuickAction, isStreaming, consumeQuickAction]);

  // ── Connectivity global state ──
  const globalConn = activeModelId
    ? connectivityResults[activeModelId]
    : undefined;

  // ── Chat ↔ Session bidirectional sync ──
  useChatSessionSync(sessionId, messages);

  return (
    <>
      <div className="size-full flex flex-col bg-[var(--ide-bg)]">
        {/* Panel Header */}
        <PanelHeader
          nodeId={nodeId}
          panelId="ai"
          title="AI 对话"
          icon={<MessageSquare className="w-3 h-3 text-sky-400/70" />}
        >
          <div className="flex items-center gap-0.5 ml-2">
            <button
              onClick={handleNewSession}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
              title="新建对话"
            >
              <Plus className="w-3 h-3 text-slate-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  setSessionList(listSessions("ide"));
                }}
                className={`w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors ${showHistory ? "text-sky-400" : ""}`}
                title="对话历史"
              >
                <History className="w-3 h-3 text-slate-600" />
              </button>
              {showHistory && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowHistory(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-md shadow-2xl z-40 py-1 max-h-[280px] overflow-y-auto">
                    <div className="px-2.5 py-1.5 border-b border-[var(--ide-border-faint)] text-[0.58rem] text-slate-500">
                      对话历史 ({sessionList.length})
                    </div>
                    {sessionList.length === 0 ? (
                      <div className="px-3 py-4 text-[0.6rem] text-slate-700 text-center">
                        暂无历史记录
                      </div>
                    ) : (
                      sessionList.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleLoadSession(s)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-white/5 transition-colors group ${s.id === sessionId ? "bg-sky-600/10" : ""}`}
                        >
                          <MessageSquare className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.65rem] text-slate-400 truncate">
                              {s.title}
                            </div>
                            <div className="text-[0.5rem] text-slate-700">
                              {new Date(s.updatedAt).toLocaleDateString(
                                "zh-CN",
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-red-400" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleJumpFullscreen}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
              title="全屏对话模式"
            >
              <Maximize2 className="w-3 h-3 text-slate-600" />
            </button>
          </div>
        </PanelHeader>

        {/* ── Sub-components ── */}

        <ChatMessageList
          messages={messages}
          isStreaming={isStreaming}
          activeFile={activeFile}
          onApplyCode={handleApplyCode}
          onInsertCode={handleInsertCode}
        />

        <ChatInputArea
          chatInput={chatInput}
          setChatInput={setChatInput}
          isStreaming={isStreaming}
          showSuggestions={messages.length <= 1}
          onSend={handleSend}
          onStop={handleStop}
        />
      </div>

      {/* Diff Preview Modal */}
      {pendingPlan && (
        <DiffPreviewModal
          plan={pendingPlan}
          existingFiles={fileContents}
          onApply={handleDiffApply}
          onCancel={handleDiffCancel}
        />
      )}
    </>
  );
}
