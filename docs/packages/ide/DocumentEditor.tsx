/**
 * @file DocumentEditor.tsx
 * @description P2 高级文档编辑器 — 集成 TipTap 富文本编辑、Markdown 双栏预览、
 *              工具栏、代码块高亮、版本历史、快捷键、自动保存
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags p2,editor,tiptap,rich-text,markdown,document
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code2,
  Eye,
  Edit3,
  Save,
  FileText,
  Clock,
  Columns,
  Minus,
  RotateCcw,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";

// ── Types ──

interface DocumentVersion {
  id: string;
  content: string;
  html: string;
  timestamp: number;
  label?: string;
}

interface DocumentEditorProps {
  initialContent?: string;
  filePath?: string;
  nodeId: string;
  onSave?: (content: string, html: string) => void;
}

// ── Lowlight instance (shared) ──

const lowlight = createLowlight(common);

// ── Component ──

export default function DocumentEditor({
  initialContent = "",
  filePath = "untitled.md",
  nodeId,
  onSave,
}: DocumentEditorProps) {
  const [mode, setMode] = useState<"richtext" | "markdown" | "split">(
    "richtext",
  );
  const [markdownSource, setMarkdownSource] = useState(initialContent);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── TipTap Editor ──

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "开始输入文档内容...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-sky-400 underline cursor-pointer",
        },
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: initialContent
      ? `<p>${initialContent.replace(/\n/g, "</p><p>")}</p>`
      : "",
    onUpdate: ({ editor: ed }) => {
      setSaved(false);
      const text = ed.getText();
      setWordCount(text.length);

      // Auto-save after 3 seconds of inactivity
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave();
      }, 3000);
    },
  });

  // ── Save handler ──

  const handleSave = useCallback(() => {
    if (!editor) return;

    const html = editor.getHTML();
    const text = editor.getText();

    // Save version
    const newVersion: DocumentVersion = {
      id: `v-${Date.now()}`,
      content: text,
      html,
      timestamp: Date.now(),
    };
    setVersions((prev) => [newVersion, ...prev].slice(0, 50));

    onSave?.(text, html);
    setSaved(true);
  }, [editor, onSave]);

  // ── Restore version ──

  const handleRestore = useCallback(
    (version: DocumentVersion) => {
      if (!editor) return;
      editor.commands.setContent(version.html);
      setShowHistory(false);
      setSaved(false);
    },
    [editor],
  );

  // ── Keyboard shortcuts ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // ── Link insertion ──

  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("输入链接 URL:");
    if (!url) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  // ── Image insertion ──

  const handleInsertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("输入图片 URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // ── Table insertion ──

  const handleInsertTable = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="size-full flex items-center justify-center bg-[var(--ide-bg)]">
        <div className="text-slate-600 text-xs">加载编辑器...</div>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      {/* Panel Header */}
      <PanelHeader
        nodeId={nodeId}
        panelId="document-editor"
        title="文档编辑器"
        icon={<FileText className="w-3 h-3 text-emerald-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          {/* Mode switcher */}
          <button
            onClick={() => setMode("richtext")}
            className={`px-1.5 py-0.5 rounded text-[0.58rem] transition-colors ${
              mode === "richtext"
                ? "bg-sky-600/20 text-sky-400"
                : "text-slate-600 hover:text-slate-400"
            }`}
            title="富文本模式"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMode("markdown")}
            className={`px-1.5 py-0.5 rounded text-[0.58rem] transition-colors ${
              mode === "markdown"
                ? "bg-sky-600/20 text-sky-400"
                : "text-slate-600 hover:text-slate-400"
            }`}
            title="Markdown 模式"
          >
            <Code2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMode("split")}
            className={`px-1.5 py-0.5 rounded text-[0.58rem] transition-colors ${
              mode === "split"
                ? "bg-sky-600/20 text-sky-400"
                : "text-slate-600 hover:text-slate-400"
            }`}
            title="分栏模式"
          >
            <Columns className="w-3 h-3" />
          </button>

          <div className="w-px h-3 bg-[var(--ide-border-faint)] mx-1" />

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-1.5 py-0.5 rounded text-[0.58rem] transition-colors ${
              showHistory
                ? "bg-amber-600/20 text-amber-400"
                : "text-slate-600 hover:text-slate-400"
            }`}
            title="版本历史"
          >
            <Clock className="w-3 h-3" />
          </button>

          <button
            onClick={handleSave}
            className="px-1.5 py-0.5 rounded text-[0.58rem] text-slate-600 hover:text-emerald-400 transition-colors"
            title="保存 (Ctrl+S)"
          >
            <Save className="w-3 h-3" />
          </button>
        </div>
      </PanelHeader>

      {/* Toolbar */}
      {mode !== "markdown" && (
        <div className="flex-shrink-0 flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)]">
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="粗体 (Ctrl+B)"
          >
            <Bold className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="删除线"
          >
            <Strikethrough className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title="行内代码"
          >
            <Code className="w-3 h-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
            title="标题 1"
          >
            <Heading1 className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title="标题 2"
          >
            <Heading2 className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            title="标题 3"
          >
            <Heading3 className="w-3 h-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="无序列表"
          >
            <List className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="有序列表"
          >
            <ListOrdered className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="引用"
          >
            <Quote className="w-3 h-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Insert */}
          <ToolbarButton onClick={handleInsertLink} title="链接">
            <LinkIcon className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton onClick={handleInsertImage} title="图片">
            <ImageIcon className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton onClick={handleInsertTable} title="表格">
            <TableIcon className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="代码块"
          >
            <Code2 className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="水平线"
          >
            <Minus className="w-3 h-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-3 h-3" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Rich Text Editor */}
        {(mode === "richtext" || mode === "split") && (
          <div
            className={`${
              mode === "split"
                ? "w-1/2 border-r border-[var(--ide-border-dim)]"
                : "w-full"
            } overflow-y-auto p-4`}
          >
            <EditorContent
              editor={editor}
              className="prose prose-sm prose-invert max-w-none min-h-[300px] focus:outline-none
                [&_.ProseMirror]:outline-none
                [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-700
                [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
                [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
                [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
                [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
                [&_.ProseMirror_h1]:text-slate-200 [&_.ProseMirror_h1]:border-b [&_.ProseMirror_h1]:border-[var(--ide-border-faint)] [&_.ProseMirror_h1]:pb-2
                [&_.ProseMirror_h2]:text-slate-300
                [&_.ProseMirror_h3]:text-slate-300
                [&_.ProseMirror_p]:text-slate-400
                [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-sky-500/30 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-slate-500
                [&_.ProseMirror_code]:bg-[var(--ide-bg-elevated)] [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-emerald-400
                [&_.ProseMirror_pre]:bg-[var(--ide-bg-dark)] [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:p-4
                [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-[var(--ide-border)] [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-[var(--ide-bg-elevated)]
                [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-[var(--ide-border-dim)] [&_.ProseMirror_td]:p-2
                [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal
                [&_.ProseMirror_li]:text-slate-400
                [&_.ProseMirror_a]:text-sky-400 [&_.ProseMirror_a]:underline
                [&_.ProseMirror_hr]:border-[var(--ide-border-faint)]
                [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg
              "
            />
          </div>
        )}

        {/* Markdown Source / Preview */}
        {(mode === "markdown" || mode === "split") && (
          <div
            className={`${
              mode === "split" ? "w-1/2" : "w-full"
            } flex flex-col overflow-hidden`}
          >
            {mode === "markdown" ? (
              <textarea
                value={markdownSource}
                onChange={(e) => {
                  setMarkdownSource(e.target.value);
                  setSaved(false);
                }}
                className="flex-1 bg-transparent text-slate-400 p-4 outline-none resize-none font-mono text-[0.75rem]"
                placeholder="# Markdown 内容..."
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-[0.62rem] text-slate-700 mb-2 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  HTML 预览
                </div>
                <div
                  className="prose prose-sm prose-invert max-w-none text-slate-400"
                  dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                />
              </div>
            )}
          </div>
        )}

        {/* Version History Sidebar */}
        {showHistory && (
          <div className="w-60 flex-shrink-0 border-l border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)] overflow-y-auto">
            <div className="px-3 py-2 border-b border-[var(--ide-border-dim)]">
              <div className="text-[0.68rem] text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400/70" />
                版本历史
                <span className="text-slate-700 ml-auto">
                  {versions.length} 个版本
                </span>
              </div>
            </div>
            {versions.length === 0 ? (
              <div className="px-3 py-6 text-center text-[0.62rem] text-slate-700">
                暂无历史版本
              </div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="px-3 py-2 border-b border-[var(--ide-border-faint)] hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[0.6rem] text-slate-500">
                      {new Date(v.timestamp).toLocaleString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => handleRestore(v)}
                      className="text-[0.55rem] text-sky-500 hover:text-sky-400 flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      恢复
                    </button>
                  </div>
                  <div className="text-[0.58rem] text-slate-600 truncate">
                    {v.content.slice(0, 80)}
                    {v.content.length > 80 && "..."}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-1 border-t border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)] text-[0.58rem]">
        <span className="text-slate-600">{filePath}</span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-600">{wordCount} 字</span>
        <span className="text-slate-700">|</span>
        <span className={saved ? "text-emerald-600" : "text-amber-500"}>
          {saved ? "已保存" : "未保存"}
        </span>
        <div className="flex-1" />
        <span className="text-slate-700">
          {mode === "richtext"
            ? "富文本"
            : mode === "markdown"
              ? "Markdown"
              : "分栏"}
        </span>
      </div>
    </div>
  );
}

// ── Toolbar Sub-components ──

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
        active
          ? "bg-sky-600/20 text-sky-400"
          : disabled
            ? "text-slate-800 cursor-not-allowed"
            : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-[var(--ide-border-faint)] mx-0.5" />;
}
