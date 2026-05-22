/**
 * @file MonacoWrapper.tsx
 * @description Monaco Editor 封装组件，集成深海军蓝/赛博朋克双主题、
 *              编辑器-预览滚动同步、语法高亮、智能提示等功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags editor,monaco,scroll-sync,theme,typescript
 */

import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { getLanguageFromPath } from "./fileData";
import { useTheme } from "./ThemeStore";
import { useScrollSyncStore } from "./stores/useScrollSyncStore";
import { usePreviewStore } from "./stores/usePreviewStore";
import { errorReporting } from "./services/ErrorReportingService";
import { configureMonacoEnvironment } from "./MonacoWorkerManager";

// Configure Monaco to use local resources instead of CDN
loader.config({ monaco });

// Configure Monaco worker URLs for Vite with lazy loading
if (typeof window !== 'undefined') {
  configureMonacoEnvironment();
}

// Define custom deep-navy theme
const NAVY_THEME_NAME = "cloudpivot-navy";
const CYBER_THEME_NAME = "cloudpivot-cyberpunk";

function defineNavyTheme(monaco: any) {
  monaco.editor.defineTheme(NAVY_THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "94a3b8", background: "0b1729" },
      { token: "comment", foreground: "475569", fontStyle: "italic" },
      { token: "keyword", foreground: "c084fc" },
      { token: "keyword.control", foreground: "c084fc" },
      { token: "storage", foreground: "c084fc" },
      { token: "storage.type", foreground: "38bdf8" },
      { token: "type", foreground: "38bdf8" },
      { token: "type.identifier", foreground: "38bdf8" },
      { token: "string", foreground: "34d399" },
      { token: "string.key.json", foreground: "38bdf8" },
      { token: "string.value.json", foreground: "34d399" },
      { token: "number", foreground: "fbbf24" },
      { token: "number.hex", foreground: "fbbf24" },
      { token: "regexp", foreground: "f87171" },
      { token: "annotation", foreground: "fbbf24" },
      { token: "constant", foreground: "fbbf24" },
      { token: "variable", foreground: "e2e8f0" },
      { token: "variable.predefined", foreground: "38bdf8" },
      { token: "entity.name.function", foreground: "fbbf24" },
      { token: "entity.name.type", foreground: "38bdf8" },
      { token: "tag", foreground: "f87171" },
      { token: "attribute.name", foreground: "38bdf8" },
      { token: "attribute.value", foreground: "34d399" },
      { token: "delimiter", foreground: "64748b" },
      { token: "delimiter.bracket", foreground: "94a3b8" },
      { token: "operator", foreground: "94a3b8" },
      { token: "meta.tag", foreground: "64748b" },
      { token: "identifier", foreground: "e2e8f0" },
    ],
    colors: {
      "editor.background": "#0b1729",
      "editor.foreground": "#94a3b8",
      "editor.lineHighlightBackground": "#0f1d3510",
      "editor.selectionBackground": "#1e3a5f40",
      "editor.inactiveSelectionBackground": "#1e3a5f20",
      "editorLineNumber.foreground": "#334155",
      "editorLineNumber.activeForeground": "#64748b",
      "editorCursor.foreground": "#38bdf8",
      "editor.selectionHighlightBackground": "#1e3a5f30",
      "editorBracketMatch.background": "#1e3a5f30",
      "editorBracketMatch.border": "#1e3a5f60",
      "editorIndentGuide.background": "#1e293b20",
      "editorIndentGuide.activeBackground": "#1e3a5f40",
      "editorWhitespace.foreground": "#1e293b30",
      "editorWidget.background": "#0f2240",
      "editorWidget.border": "#1e3a5f60",
      "editorSuggestWidget.background": "#0f2240",
      "editorSuggestWidget.border": "#1e3a5f60",
      "editorSuggestWidget.selectedBackground": "#1e3a5f40",
      "editorHoverWidget.background": "#0f2240",
      "editorHoverWidget.border": "#1e3a5f60",
      "input.background": "#0f2240",
      "input.border": "#1e3a5f50",
      "input.foreground": "#94a3b8",
      "dropdown.background": "#0f2240",
      "dropdown.border": "#1e3a5f50",
      "list.hoverBackground": "#1e3a5f20",
      "list.activeSelectionBackground": "#1e3a5f40",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#1e3a5f30",
      "scrollbarSlider.hoverBackground": "#1e3a5f50",
      "scrollbarSlider.activeBackground": "#1e3a5f70",
      "minimap.background": "#0b1729",
    },
  });
}

function defineCyberpunkTheme(monaco: any) {
  monaco.editor.defineTheme(CYBER_THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "00f0ff", background: "0a0a12" },
      { token: "comment", foreground: "00f0ff55", fontStyle: "italic" },
      { token: "keyword", foreground: "ff00ff" },
      { token: "keyword.control", foreground: "ff00ff" },
      { token: "storage", foreground: "ff00ff" },
      { token: "storage.type", foreground: "00f0ff" },
      { token: "type", foreground: "00f0ff" },
      { token: "type.identifier", foreground: "00f0ff" },
      { token: "string", foreground: "00ff88" },
      { token: "string.key.json", foreground: "00f0ff" },
      { token: "string.value.json", foreground: "00ff88" },
      { token: "number", foreground: "ffff00" },
      { token: "number.hex", foreground: "ffff00" },
      { token: "regexp", foreground: "ff0044" },
      { token: "annotation", foreground: "ffff00" },
      { token: "constant", foreground: "ffff00" },
      { token: "variable", foreground: "e0e8f0" },
      { token: "variable.predefined", foreground: "00f0ff" },
      { token: "entity.name.function", foreground: "ff8800" },
      { token: "entity.name.type", foreground: "00f0ff" },
      { token: "tag", foreground: "ff0044" },
      { token: "attribute.name", foreground: "00f0ff" },
      { token: "attribute.value", foreground: "00ff88" },
      { token: "delimiter", foreground: "00f0ff60" },
      { token: "delimiter.bracket", foreground: "00f0ff90" },
      { token: "operator", foreground: "ff66ff" },
      { token: "meta.tag", foreground: "00f0ff50" },
      { token: "identifier", foreground: "e0e8f0" },
    ],
    colors: {
      "editor.background": "#0a0a12",
      "editor.foreground": "#00f0ffe6",
      "editor.lineHighlightBackground": "#14142a40",
      "editor.selectionBackground": "#00f0ff25",
      "editor.inactiveSelectionBackground": "#00f0ff12",
      "editorLineNumber.foreground": "#00f0ff30",
      "editorLineNumber.activeForeground": "#00f0ff70",
      "editorCursor.foreground": "#00f0ff",
      "editor.selectionHighlightBackground": "#00f0ff18",
      "editorBracketMatch.background": "#ff00ff20",
      "editorBracketMatch.border": "#ff00ff60",
      "editorIndentGuide.background": "#00f0ff10",
      "editorIndentGuide.activeBackground": "#00f0ff25",
      "editorWhitespace.foreground": "#00f0ff10",
      "editorWidget.background": "#14142a",
      "editorWidget.border": "#00f0ff35",
      "editorSuggestWidget.background": "#14142a",
      "editorSuggestWidget.border": "#00f0ff35",
      "editorSuggestWidget.selectedBackground": "#00f0ff20",
      "editorHoverWidget.background": "#14142a",
      "editorHoverWidget.border": "#00f0ff35",
      "input.background": "#0e0e1a",
      "input.border": "#00f0ff30",
      "input.foreground": "#00f0ffe6",
      "dropdown.background": "#14142a",
      "dropdown.border": "#00f0ff30",
      "list.hoverBackground": "#00f0ff12",
      "list.activeSelectionBackground": "#00f0ff20",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#00f0ff20",
      "scrollbarSlider.hoverBackground": "#00f0ff35",
      "scrollbarSlider.activeBackground": "#00f0ff50",
      "minimap.background": "#0a0a12",
    },
  });
}

interface MonacoWrapperProps {
  filePath: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
  minimap?: boolean;
  lineNumbers?: "on" | "off" | "relative";
  fontSize?: number;
}

export default function MonacoWrapper({
  filePath,
  value,
  onChange,
  readOnly = false,
  height = "100%",
  minimap = false,
  lineNumbers = "on",
  fontSize = 12,
}: MonacoWrapperProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const scrollDisposableRef = useRef<any>(null);
  const cursorDisposableRef = useRef<any>(null);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isCyber } = useTheme();

  // Scroll sync stores
  const scrollSyncEnabled = usePreviewStore((s) => s.scrollSyncEnabled);
  const publishEditorScroll = useScrollSyncStore((s) => s.publishEditorScroll);
  const previewScrollRatio = useScrollSyncStore((s) => s.previewScrollRatio);
  const scrollSource = useScrollSyncStore((s) => s.scrollSource);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      try {
        editorRef.current = editor;
        monacoRef.current = monaco;
        defineNavyTheme(monaco);
        defineCyberpunkTheme(monaco);
        monaco.editor.setTheme(isCyber ? CYBER_THEME_NAME : NAVY_THEME_NAME);

        // Additional editor configurations
        editor.updateOptions({
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontLigatures: true,
          renderLineHighlight: "line",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: { top: 8, bottom: 8 },
        });

        // ── Cursor position breadcrumb (debounced 2s) ──
        cursorDisposableRef.current?.dispose();
        cursorDisposableRef.current = editor.onDidChangeCursorPosition(
          (e: any) => {
            if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
            cursorTimerRef.current = setTimeout(() => {
              const pos = e.position;
              errorReporting.addBreadcrumb({
                type: "click",
                category: "editor",
                message: `光标: 行 ${pos.lineNumber}, 列 ${pos.column}`,
                data: {
                  file: filePath,
                  line: pos.lineNumber,
                  column: pos.column,
                },
              });
            }, 2000);
          },
        );
      } catch (error) {
        errorReporting.captureError(error, {
          category: "editor",
          severity: "error",
          context: {
            action: "monaco-mount",
            filePath,
          },
        });
      }
    },
    [isCyber, filePath],
  );

  // ── Scroll Sync: Editor → Preview ──
  // Attach/detach scroll listener based on scrollSyncEnabled
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (scrollDisposableRef.current) {
      scrollDisposableRef.current.dispose();
      scrollDisposableRef.current = null;
    }

    if (scrollSyncEnabled) {
      scrollDisposableRef.current = editor.onDidScrollChange(() => {
        const scrollTop = editor.getScrollTop();
        const scrollHeight = editor.getScrollHeight();
        const clientHeight = editor.getLayoutInfo().height;
        const maxScroll = scrollHeight - clientHeight;
        if (maxScroll > 0) {
          const ratio = scrollTop / maxScroll;
          publishEditorScroll(Math.max(0, Math.min(1, ratio)));
        }
      });
    }

    return () => {
      if (scrollDisposableRef.current) {
        scrollDisposableRef.current.dispose();
        scrollDisposableRef.current = null;
      }
    };
  }, [scrollSyncEnabled, publishEditorScroll]);

  // ── Scroll Sync: Preview → Editor ──
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !scrollSyncEnabled) return;
    if (scrollSource !== "preview") return;

    const scrollHeight = editor.getScrollHeight();
    const clientHeight = editor.getLayoutInfo().height;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      editor.setScrollTop(previewScrollRatio * maxScroll);
    }
  }, [previewScrollRatio, scrollSyncEnabled, scrollSource]);

  // Switch Monaco theme when global theme changes
  if (monacoRef.current) {
    monacoRef.current.editor.setTheme(
      isCyber ? CYBER_THEME_NAME : NAVY_THEME_NAME,
    );
  }

  const language = getLanguageFromPath(filePath);

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      onMount={handleMount}
      theme={isCyber ? CYBER_THEME_NAME : NAVY_THEME_NAME}
      loading={
        <div className="size-full flex items-center justify-center bg-[var(--ide-bg)]">
          <div className="flex items-center gap-2 text-slate-600 text-[0.72rem]">
            <div className="w-4 h-4 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <span>加载编辑器...</span>
          </div>
        </div>
      }
      options={{
        readOnly,
        minimap: { enabled: minimap },
        lineNumbers,
        fontSize,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        contextmenu: true,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        tabSize: 2,
        insertSpaces: true,
        folding: true,
        foldingHighlight: true,
        showFoldingControls: "mouseover",
        matchBrackets: "always",
        renderWhitespace: "none",
        lineDecorationsWidth: 8,
        lineNumbersMinChars: 3,
      }}
    />
  );
}
