/**
 * @file left-panel/ChatMessageList.tsx
 * @description 聊天消息列表子组件 — 渲染用户/AI 消息气泡、代码块操作、
 *              流式指示器、自动滚动到底部
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags left-panel,chat,message-list,streaming
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Bot, AlertCircle, Copy, Check, Code2, Wand2 } from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";

// ── Types ──

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  codeBlock?: { lang: string; code: string };
  isStreaming?: boolean;
  error?: string;
  modelName?: string;
}

export interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  activeFile: string;
  onApplyCode: (code: string) => void;
  onInsertCode: (code: string, lang: string) => void;
}

export default function ChatMessageList({
  messages,
  isStreaming,
  activeFile,
  onApplyCode,
  onInsertCode,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === "function"
    ) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth" as ScrollBehavior,
      });
    }
  }, [messages]);

  const handleCopyCode = useCallback((code: string, msgId: string) => {
    copyToClipboard(code);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[95%] rounded-lg px-3 py-2 ${
              msg.role === "user"
                ? "bg-gradient-to-r from-sky-700 to-blue-700 text-white"
                : "border border-dashed border-[var(--ide-border-mid)] bg-[var(--ide-bg-elevated)]/50 text-slate-300"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1 mb-1">
                <Bot className="w-3 h-3 text-sky-400" />
                <span className="text-[0.6rem] text-sky-400">AI 助手</span>
                {msg.modelName && (
                  <span className="text-[0.5rem] text-slate-700 ml-1">
                    ({msg.modelName})
                  </span>
                )}
                {msg.isStreaming && (
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse ml-1" />
                )}
              </div>
            )}

            {/* Error state */}
            {msg.error ? (
              <div className="flex items-start gap-1.5 py-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[0.72rem] text-red-400/80">{msg.error}</p>
              </div>
            ) : (
              <p className="text-[0.75rem] whitespace-pre-wrap">
                {msg.content}
              </p>
            )}

            {/* Code Block */}
            {msg.codeBlock && (
              <div className="mt-2 rounded border border-[var(--ide-border-dim)] overflow-hidden">
                <div className="flex items-center justify-between px-2 py-1 bg-[var(--ide-bg-inset)] border-b border-[var(--ide-border-faint)]">
                  <span className="text-[0.58rem] text-slate-600">
                    {msg.codeBlock.lang}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleCopyCode(msg.codeBlock!.code, msg.id)
                      }
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                      title="复制"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-600" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        onInsertCode(msg.codeBlock!.code, msg.codeBlock!.lang)
                      }
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                      title="插入新文件"
                    >
                      <Code2 className="w-2.5 h-2.5 text-slate-600" />
                    </button>
                    <button
                      onClick={() => onApplyCode(msg.codeBlock!.code)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-600/30 hover:bg-sky-600/50 transition-colors"
                      title="应用到当前文件"
                    >
                      <Wand2 className="w-2.5 h-2.5 text-sky-400" />
                      <span className="text-[0.55rem] text-sky-300">应用</span>
                    </button>
                  </div>
                </div>
                <pre className="p-2 text-[0.62rem] text-slate-400 overflow-x-auto max-h-[200px] overflow-y-auto bg-[var(--ide-bg)]">
                  <code>{msg.codeBlock.code}</code>
                </pre>
              </div>
            )}

            <span
              className={`text-[0.55rem] mt-1 block ${
                msg.role === "user" ? "text-white/50" : "text-slate-600"
              }`}
            >
              {msg.timestamp}
            </span>
          </div>
        </div>
      ))}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="border border-dashed border-[var(--ide-border-mid)] bg-[var(--ide-bg-elevated)]/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-sky-400" />
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
