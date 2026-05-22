/**
 * @file RightPanel.tsx
 * @description 文件代码编辑面板，集成 Monaco Editor、语法高亮、
 *              代码复制/格式化、类型信息展示、多标签页
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.3.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags editor,code,monaco,formatting,tabs
 */

import {
  FileCode2,
  Copy,
  Download,
  Wand2,
  FileText,
  Monitor,
  Zap,
  BookOpen,
  FoldVertical,
  Check,
  AlignLeft,
} from "lucide-react";
import { useState, useCallback, lazy, Suspense } from "react";
import { useFileStore } from "./FileStore";
import { useWorkflowEventBus } from "./WorkflowEventBus";
import { PanelHeader } from "./PanelManager";
const MonacoWrapper = lazy(() => import("./MonacoWrapper"));
import TabBar from "./TabBar";
import { copyToClipboard } from "./utils/clipboard";

interface RightPanelProps {
  nodeId: string;
}

export default function RightPanel({ nodeId }: RightPanelProps) {
  const { fileContents, activeFile, updateFile, formatCurrentFile } =
    useFileStore();
  const { emit } = useWorkflowEventBus();
  const [copied, setCopied] = useState(false);

  const codeContent = fileContents[activeFile] || "// 选择一个文件查看代码详情";

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateFile(activeFile, value);
        emit({
          type: "file-saved",
          detail: `编辑: ${activeFile.split("/").pop()}`,
        });
      }
    },
    [activeFile, updateFile, emit],
  );

  const handleCopy = useCallback(() => {
    copyToClipboard(codeContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [codeContent]);

  const handleFormat = useCallback(() => {
    formatCurrentFile();
    emit({
      type: "code-generated",
      detail: `格式化: ${activeFile.split("/").pop()}`,
    });
  }, [formatCurrentFile, activeFile, emit]);

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      {/* Panel Header - Draggable */}
      <PanelHeader
        nodeId={nodeId}
        panelId="code"
        title="代码编辑"
        icon={<Monitor className="w-3 h-3 text-sky-400/70" />}
      >
        <div className="flex items-center gap-0.5 ml-2">
          <button
            onClick={handleFormat}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="格式化代码"
          >
            <AlignLeft className="w-3 h-3 text-slate-600" />
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="AI 优化"
          >
            <Wand2 className="w-3 h-3 text-slate-600" />
          </button>
          <button
            onClick={handleCopy}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="复制"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-slate-600" />
            )}
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="下载"
          >
            <Download className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      </PanelHeader>

      {/* Section Labels */}
      <div className="flex-shrink-0 px-3 py-1 border-b border-dashed border-[var(--ide-border-faint)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0 text-[0.58rem] text-slate-700">
          <span className="flex items-center gap-1">
            <Monitor className="w-2.5 h-2.5 text-slate-500" />
            代码编辑器
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-2.5 h-2.5 text-green-500/50" />
            语法高亮
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-yellow-500/50" />
            智能提示
          </span>
          <span className="flex items-center gap-1">
            <FoldVertical className="w-2.5 h-2.5 text-slate-500" />
            代码折叠
          </span>
        </div>
      </div>

      {/* Multi-Tab Bar */}
      <TabBar />

      {/* File Info Bar */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 border-b border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)]">
        {getFileIcon(activeFile)}
        <span className="text-[0.65rem] text-slate-500 truncate">
          {activeFile}
        </span>
        <div className="flex-1" />
        <span className="text-[0.55rem] text-slate-700">
          {codeContent.split("\n").length} 行
        </span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
              Loading editor...
            </div>
          }
        >
          <MonacoWrapper
            filePath={activeFile}
            value={codeContent}
            onChange={handleEditorChange}
            fontSize={12}
            minimap={true}
            lineNumbers="on"
          />
        </Suspense>
      </div>

      {/* Type Info Footer */}
      <div className="flex-shrink-0 border-t border-dashed border-[var(--ide-border-faint)] px-3 py-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <FileText className="w-3 h-3 text-sky-400/60" />
          <span className="text-[0.62rem] text-slate-600">类型信息</span>
        </div>
        <div className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-faint)] rounded px-2 py-1 text-[0.6rem] font-mono text-slate-600">
          {activeFile.endsWith(".tsx") && (
            <div>
              <span className="text-purple-400">export</span>{" "}
              <span className="text-blue-400">default</span>{" "}
              <span className="text-amber-400">function</span>{" "}
              <span className="text-slate-300">
                {activeFile.split("/").pop()?.replace(".tsx", "")}
              </span>
              <span className="text-slate-600">(): JSX.Element</span>
            </div>
          )}
          {activeFile.endsWith(".json") && (
            <span className="text-slate-500">JSON Object</span>
          )}
          {activeFile.endsWith(".css") && (
            <span className="text-slate-500">CSS Stylesheet</span>
          )}
          {activeFile.endsWith(".ts") && !activeFile.endsWith(".tsx") && (
            <div>
              <span className="text-purple-400">module</span>{" "}
              <span className="text-slate-300">
                {activeFile.split("/").pop()?.replace(".ts", "")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getFileIcon(path: string) {
  const name = path.split("/").pop() || "";
  if (name.endsWith(".tsx") || name.endsWith(".ts"))
    return <FileCode2 className="w-3 h-3 text-blue-400" />;
  if (name.endsWith(".json"))
    return <FileCode2 className="w-3 h-3 text-amber-400" />;
  if (name.endsWith(".css"))
    return <FileText className="w-3 h-3 text-pink-400" />;
  return <FileText className="w-3 h-3 text-slate-500" />;
}
