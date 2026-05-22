/**
 * @file left-panel/ChatInputArea.tsx
 * @description 聊天输入区子组件 — 快捷建议、文本输入框、附件按钮、
 *              发送/停止按钮、Enter 快捷键
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags left-panel,chat-input,suggestions,send
 */

import {
  Paperclip,
  Image as ImageIcon,
  Send,
} from "lucide-react";

// ── Types ──

export interface ChatInputAreaProps {
  chatInput: string;
  setChatInput: (value: string) => void;
  isStreaming: boolean;
  showSuggestions: boolean;
  onSend: () => void;
  onStop: () => void;
}

export default function ChatInputArea({
  chatInput,
  setChatInput,
  isStreaming,
  showSuggestions,
  onSend,
  onStop,
}: ChatInputAreaProps) {
  return (
    <>
      {/* Input Section */}
      <div className="flex-shrink-0 border-t border-[var(--ide-border-dim)] p-2.5">
        <div className="flex items-end gap-1.5">
          <div className="flex-1 flex items-end bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] rounded px-2.5 py-1.5">
            <div className="flex gap-0.5 mr-2">
              <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors">
                <Paperclip className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors">
                <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="输入你的需求..."
              className="flex-1 bg-transparent border-0 outline-none text-slate-300 placeholder:text-slate-700 text-[0.75rem] resize-none max-h-20 min-h-[20px]"
              rows={1}
              disabled={isStreaming}
            />
            <button
              onClick={onSend}
              disabled={!chatInput.trim() || isStreaming}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors disabled:opacity-30"
            >
              <Send className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
