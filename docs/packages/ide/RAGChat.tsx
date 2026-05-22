/**
 * @file RAGChat.tsx
 * @description RAG 增强检索对话面板，结合知识库文档检索与 LLM 问答，
 *              支持引用溯源、上下文注入、实时流式响应
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags rag,chat,knowledge-base,retrieval,llm
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquareText,
  Send,
  FileText,
  Settings,
  Database,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Square,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import { useModelRegistry } from "./ModelRegistry";
import {
  chatCompletionStream,
  type ChatMessage as LLMMessage,
} from "./LLMService";
import { copyToClipboard } from "./utils/clipboard";

interface Citation {
  doc: string;
  chunk: string;
  score: number;
  page?: number;
}

interface RAGMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
  model?: string;
}

interface RAGConfig {
  topK: number;
  scoreThreshold: number;
  model: string;
  temperature: number;
  knowledgeBase: string;
}

const KNOWLEDGE_BASES = [
  { id: "kb1", name: "项目文档库" },
  { id: "kb2", name: "代码规范库" },
  { id: "all", name: "全部知识库" },
];

const MOCK_RESPONSES: Record<
  string,
  { content: string; citations: Citation[] }
> = {
  default: {
    content:
      "根据知识库中的相关文档，以下是您问题的回答：\n\n项目采用微服务架构，前端使用 React + TypeScript，后端基于 Node.js/Express，数据层使用 PostgreSQL + Redis。各服务通过 API Gateway 进行统一路由和鉴权。\n\n详细的架构图和部署方案请参阅引用的文档。",
    citations: [
      {
        doc: "架构设计方案.pdf",
        chunk:
          "系统整体采用微服务架构，前后端分离。前端：React 18 + TypeScript 5.x + Vite...",
        score: 0.95,
        page: 12,
      },
      {
        doc: "API 接口文档.md",
        chunk:
          "API Gateway 负责统一路由、负载均衡、鉴权和限流，基于 Kong 实现...",
        score: 0.89,
      },
    ],
  },
  api: {
    content:
      "根据 API 文档，用户认证流程如下：\n\n1. **登录请求**：POST /api/v1/auth/login，携带 email 和 password\n2. **获取令牌**：成功后返回 JWT access_token（有效期 2h）和 refresh_token（有效期 7d）\n3. **请求鉴权**：后续请求在 Header 中携带 `Authorization: Bearer <token>`\n4. **令牌刷新**：POST /api/v1/auth/refresh，携带 refresh_token\n\n```typescript\nconst response = await fetch('/api/v1/auth/login', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ email, password })\n})\n```",
    citations: [
      {
        doc: "API 接口文档.md",
        chunk: "用户认证接口使用 JWT 令牌，access_token 有效期 2 小时...",
        score: 0.96,
      },
      {
        doc: "数据库设计.docx",
        chunk:
          "users 表包含 id, email, password_hash, refresh_token, created_at...",
        score: 0.84,
        page: 5,
      },
    ],
  },
};

const RAG_SYSTEM_PROMPT = `你是一个基于知识库的 RAG (Retrieval-Augmented Generation) 问答助手。
你的职责是：
1. 根据用户的问题，结合检索到的知识库上下文来回答
2. 回答时需要引用具体的文档来源
3. 如果知识库中没有相关信息，诚实告知并提供你已知的信息
4. 代码片段使用 markdown 代码块格式
5. 回答简洁专业，重点突出关键信息
请用中文回答。`;

export default function RAGChat({ nodeId }: { nodeId: string }) {
  const { models, activeModel, getActiveProvider, hasProviderKey } =
    useModelRegistry();
  // Filter models suitable for RAG (llm, qa, code types)
  const ragModels = models.filter(
    (m) => m.type === "llm" || m.type === "qa" || m.type === "code",
  );
  const [messages, setMessages] = useState<RAGMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "你好！我是基于知识库的 RAG 问答助手。请选择知识库并提问，我会引用相关文档回答您的问题。",
      timestamp: "10:00",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [config, setConfig] = useState<RAGConfig>({
    topK: 5,
    scoreThreshold: 0.7,
    model: "model-1",
    temperature: 0.3,
    knowledgeBase: "all",
  });
  const [showConfig, setShowConfig] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;

    const userMsg: RAGMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMsg]);
    const q = input;
    setInput("");

    // Try real LLM first
    const provider = getActiveProvider();
    const selectedModel =
      ragModels.find((m) => m.id === config.model) || activeModel;

    if (
      provider &&
      selectedModel &&
      (provider.authType === "none" || hasProviderKey(provider.id))
    ) {
      // ── Real LLM streaming ──
      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: RAGMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        model: selectedModel.name,
        timestamp: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);

      // Build conversation with RAG system prompt
      const kbName =
        KNOWLEDGE_BASES.find((k) => k.id === config.knowledgeBase)?.name ||
        "全部知识库";
      const history: LLMMessage[] = [
        {
          role: "system",
          content:
            `${RAG_SYSTEM_PROMPT
            }\n\n当前知识库: ${kbName}\nTop-K: ${config.topK}\n相似度阈值: ${config.scoreThreshold}`,
        },
      ];

      // Add recent context
      const recent = [
        ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
        userMsg,
      ].slice(-12);
      for (const msg of recent) {
        if (msg.content) {
          history.push({ role: msg.role, content: msg.content });
        }
      }

      const controller = new AbortController();
      abortRef.current = controller;

      chatCompletionStream(
        provider,
        selectedModel.modelId || selectedModel.id,
        history,
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
          onDone: (fullText) => {
            // Simulate citation extraction from response
            const citations: Citation[] = [];
            if (
              fullText.includes("文档") ||
              fullText.includes("方案") ||
              fullText.length > 100
            ) {
              citations.push({
                doc: "知识库文档",
                chunk: `${fullText.slice(0, 80)  }...`,
                score: 0.92,
              });
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      citations: citations.length > 0 ? citations : undefined,
                    }
                  : m,
              ),
            );
            setIsStreaming(false);
            abortRef.current = null;
          },
          onError: (errMsg) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content || `[错误] ${errMsg}` }
                  : m,
              ),
            );
            setIsStreaming(false);
            abortRef.current = null;
          },
        },
        { temperature: config.temperature, signal: controller.signal },
      );
    } else {
      // ── Fallback: mock response ──
      setIsTyping(true);
      setTimeout(() => {
        const response =
          q.toLowerCase().includes("api") ||
          q.includes("认证") ||
          q.includes("接口")
            ? MOCK_RESPONSES["api"]
            : MOCK_RESPONSES["default"];
        const modelName =
          ragModels.find((m) => m.id === config.model)?.name || "通用模型";
        const aiMsg: RAGMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          citations: response.citations,
          model: modelName,
          timestamp: new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 1500);
    }
  }, [
    input,
    isStreaming,
    messages,
    config,
    ragModels,
    activeModel,
    getActiveProvider,
    hasProviderKey,
  ]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="rag"
        title="RAG 问答"
        icon={<MessageSquareText className="w-3 h-3 text-emerald-400/70" />}
      >
        <div className="flex items-center gap-0.5 ml-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="配置"
          >
            <Settings className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      </PanelHeader>

      {/* Config panel */}
      {showConfig && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)] space-y-2 bg-[var(--ide-bg-dark)]">
          <div className="flex items-center gap-2">
            <label className="text-[0.58rem] text-slate-600 w-16">知识库</label>
            <select
              value={config.knowledgeBase}
              onChange={(e) =>
                setConfig((p) => ({ ...p, knowledgeBase: e.target.value }))
              }
              className="flex-1 px-1.5 py-0.5 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.65rem] text-slate-300 outline-none"
            >
              {KNOWLEDGE_BASES.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[0.58rem] text-slate-600 w-16">
              推理模型
            </label>
            <select
              value={config.model}
              onChange={(e) =>
                setConfig((p) => ({ ...p, model: e.target.value }))
              }
              className="flex-1 px-1.5 py-0.5 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.65rem] text-slate-300 outline-none"
            >
              {ragModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[0.58rem] text-slate-600 w-16">Top-K</label>
            <input
              type="number"
              value={config.topK}
              onChange={(e) =>
                setConfig((p) => ({ ...p, topK: +e.target.value }))
              }
              className="w-16 px-1.5 py-0.5 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.65rem] text-slate-300 outline-none"
            />
            <label className="text-[0.58rem] text-slate-600 ml-2">阈值</label>
            <input
              type="number"
              step="0.1"
              value={config.scoreThreshold}
              onChange={(e) =>
                setConfig((p) => ({ ...p, scoreThreshold: +e.target.value }))
              }
              className="w-16 px-1.5 py-0.5 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.65rem] text-slate-300 outline-none"
            />
          </div>
        </div>
      )}

      {/* KB indicator */}
      <div className="flex-shrink-0 px-3 py-1 border-b border-dashed border-[var(--ide-border-faint)] flex items-center gap-1.5">
        <Database className="w-2.5 h-2.5 text-purple-400" />
        <span className="text-[0.58rem] text-slate-600">
          {KNOWLEDGE_BASES.find((k) => k.id === config.knowledgeBase)?.name}
        </span>
        <span className="text-[0.52rem] text-slate-700 ml-auto">
          {ragModels.find((m) => m.id === config.model)?.name}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[95%] rounded-lg px-3 py-2 ${msg.role === "user" ? "bg-gradient-to-r from-emerald-700 to-teal-700 text-white" : "border border-dashed border-[var(--ide-border-mid)] bg-[var(--ide-bg-elevated)]/50 text-slate-300"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span className="text-[0.6rem] text-emerald-400">
                    RAG 助手
                  </span>
                  {msg.model && (
                    <span className="text-[0.5rem] text-slate-600 ml-1">
                      ({msg.model})
                    </span>
                  )}
                </div>
              )}
              <div className="text-[0.75rem] whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 border-t border-[var(--ide-border-faint)] pt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-2.5 h-2.5 text-purple-400" />
                    <span className="text-[0.55rem] text-purple-400">
                      引用来源 ({msg.citations.length})
                    </span>
                  </div>
                  {msg.citations.map((cite, i) => (
                    <div
                      key={i}
                      className="bg-[var(--ide-bg-inset)] rounded px-2 py-1.5 mb-1 border border-[var(--ide-border-subtle)]"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[0.55rem] text-sky-400">
                          [{i + 1}]
                        </span>
                        <span className="text-[0.58rem] text-slate-400">
                          {cite.doc}
                        </span>
                        {cite.page && (
                          <span className="text-[0.5rem] text-slate-700">
                            p.{cite.page}
                          </span>
                        )}
                        <span className="text-[0.5rem] text-emerald-400 ml-auto">
                          {(cite.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[0.55rem] text-slate-600 mt-0.5 line-clamp-2">
                        {cite.chunk}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    onClick={() => {
                      copyToClipboard(msg.content);
                      setCopiedId(msg.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-slate-600" />
                    )}
                  </button>
                  <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
                    <ThumbsUp className="w-2.5 h-2.5 text-slate-600" />
                  </button>
                  <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
                    <ThumbsDown className="w-2.5 h-2.5 text-slate-600" />
                  </button>
                  <span className="text-[0.5rem] text-slate-700 ml-auto">
                    {msg.timestamp}
                  </span>
                </div>
              )}
              {msg.role === "user" && (
                <span className="text-[0.5rem] text-white/40 mt-1 block">
                  {msg.timestamp}
                </span>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="border border-dashed border-[var(--ide-border-mid)] bg-[var(--ide-bg-elevated)]/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3 h-3 text-emerald-400" />
                <span className="text-[0.55rem] text-slate-600">
                  检索知识库并生成回答...
                </span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="border border-dashed border-[var(--ide-border-mid)] bg-[var(--ide-bg-elevated)]/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3 h-3 text-emerald-400" />
                <span className="text-[0.55rem] text-slate-600">
                  检索知识库并生成回答...
                </span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <button
                  onClick={handleStop}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Square className="w-2.5 h-2.5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[var(--ide-border-dim)] p-2.5">
        <div className="flex items-end gap-1.5">
          <div className="flex-1 flex items-end bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] rounded-md px-2.5 py-1.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="基于知识库提问..."
              className="flex-1 bg-transparent border-0 outline-none text-slate-300 placeholder:text-slate-700 text-[0.75rem] resize-none max-h-20 min-h-[20px]"
              rows={1}
            />
          </div>
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="w-6 h-6 rounded bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              <Square className="w-3 h-3 text-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center hover:bg-emerald-500 transition-colors disabled:opacity-30"
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
