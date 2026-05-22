/**
 * @file CenterPanel.tsx
 * @description 项目文件管理面板，包含文件树、搜索过滤、Monaco 编辑器集成、
 *              多标签页编辑、文件 CRUD 操作、右键菜单
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.5.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags files,file-tree,editor,tabs,monaco
 */

import { useState, useCallback, lazy, Suspense, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Search,
  X,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Trash2,
  Pencil,
  Check,
} from "lucide-react";
import { type FileNode } from "./fileData";
import { PanelHeader } from "./PanelManager";
import { useFileStore } from "./FileStore";
import { useWorkflowEventBus } from "./WorkflowEventBus";
const MonacoWrapper = lazy(() => import("./MonacoWrapper"));
import TabBar from "./TabBar";
import VirtualFileTree from "./VirtualFileTree";

interface CenterPanelProps {
  searchOpen: boolean;
  nodeId: string;
}

function getFileIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts"))
    return <FileCode2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  if (name.endsWith(".json"))
    return <FileJson className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
  if (name.endsWith(".css"))
    return <FileText className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />;
}

export default function CenterPanel({ searchOpen, nodeId }: CenterPanelProps) {
  const {
    fileContents,
    fileTree,
    activeFile,
    setActiveFile,
    updateFile,
    createFile,
    deleteFile,
    renameFile,
  } = useFileStore();

  const { emit } = useWorkflowEventBus();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src", "src/app", "src/app/components"]),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(true);
  const fileTreeContainerRef = useRef<HTMLDivElement>(null);
  const [fileTreeHeight, setFileTreeHeight] = useState(400);

  // File CRUD dialogs
  const [newFileDialog, setNewFileDialog] = useState<{
    parentPath: string;
    type: "file" | "folder";
  } | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [renameDialog, setRenameDialog] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    path: string;
    type: "file" | "folder";
    x: number;
    y: number;
  } | null>(null);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // 动态计算文件树高度
  useEffect(() => {
    const updateHeight = () => {
      if (fileTreeContainerRef.current) {
        const containerHeight = fileTreeContainerRef.current.clientHeight;
        setFileTreeHeight(containerHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [showEditor]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateFile(activeFile, value);
        emit({
          type: "change-detected",
          detail: `编辑: ${activeFile.split("/").pop()}`,
        });
      }
    },
    [activeFile, updateFile, emit],
  );

  const handleCreateFile = () => {
    if (!newFileDialog || !newFileName.trim()) return;
    const separator = newFileDialog.parentPath ? "/" : "";
    const fullPath = `${newFileDialog.parentPath}${separator}${newFileName.trim()}`;
    if (newFileDialog.type === "file") {
      createFile(fullPath, `// ${newFileName.trim()}\n`);
      setActiveFile(fullPath);
      emit({ type: "file-created", detail: `新建文件: ${newFileName.trim()}` });
    } else {
      createFile(`${fullPath}/.gitkeep`, "");
      emit({
        type: "file-created",
        detail: `新建文件夹: ${newFileName.trim()}`,
      });
    }
    setNewFileDialog(null);
    setNewFileName("");
    // Auto expand parent
    setExpandedFolders((prev) => new Set([...prev, newFileDialog.parentPath]));
  };

  const handleRename = () => {
    if (!renameDialog || !renameDialog.name.trim()) return;
    const parts = renameDialog.path.split("/");
    const oldName = parts[parts.length - 1];
    parts[parts.length - 1] = renameDialog.name.trim();
    const newPath = parts.join("/");
    renameFile(renameDialog.path, newPath);
    setRenameDialog(null);
    emit({
      type: "file-saved",
      detail: `重命名: ${oldName} → ${renameDialog.name.trim()}`,
    });
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    const fileName = deleteDialog.split("/").pop() || deleteDialog;
    deleteFile(deleteDialog);
    setDeleteDialog(null);
    emit({ type: "file-deleted", detail: `删除: ${fileName}` });
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      path: node.path,
      type: node.type,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const renderTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map((node) => {
      if (
        searchQuery &&
        node.type === "file" &&
        !node.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return null;
      }

      const isExpanded = expandedFolders.has(node.path);
      const isActive = node.path === activeFile;

      if (node.type === "folder") {
        const children = node.children
          ? renderTree(node.children, depth + 1)
          : null;
        const hasVisibleChildren = children && children.some((c) => c !== null);

        if (searchQuery && !hasVisibleChildren) return null;

        return (
          <div key={node.path}>
            <button
              onClick={() => toggleFolder(node.path)}
              onContextMenu={(e) => handleContextMenu(e, node)}
              className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-white/3 transition-colors rounded-sm group"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              )}
              <span className="text-[0.72rem] text-slate-400 truncate">
                {node.name}
              </span>
            </button>
            {(isExpanded || searchQuery) && children}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          onClick={() => setActiveFile(node.path)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={`w-full flex items-center gap-1.5 py-1 px-2 rounded-sm transition-colors ${
            isActive
              ? "bg-sky-900/30 text-sky-300"
              : "hover:bg-white/3 text-slate-400"
          }`}
          style={{ paddingLeft: `${depth * 12 + 24}px` }}
        >
          {getFileIcon(node.name)}
          <span className="text-[0.72rem] truncate">{node.name}</span>
        </button>
      );
    });
  };

  const codeContent = fileContents[activeFile] || "// 选择一个文件查看内容";

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      {/* Panel Header - Draggable */}
      <PanelHeader
        nodeId={nodeId}
        panelId="files"
        title="文件管理"
        icon={<Folder className="w-3 h-3 text-amber-500/70" />}
      >
        <div className="flex items-center gap-0.5 ml-2">
          <button
            onClick={() =>
              setNewFileDialog({ parentPath: "src/app", type: "file" })
            }
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="新建文件"
          >
            <FilePlus className="w-3 h-3 text-slate-600" />
          </button>
          <button
            onClick={() =>
              setNewFileDialog({ parentPath: "src/app", type: "folder" })
            }
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="新建文件夹"
          >
            <FolderPlus className="w-3 h-3 text-slate-600" />
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="刷新"
          >
            <RefreshCw className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      </PanelHeader>

      {/* Search */}
      {searchOpen && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)]">
          <div className="flex items-center gap-1.5 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] rounded px-2 py-1">
            <Search className="w-3 h-3 text-slate-600" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件..."
              className="flex-1 bg-transparent border-0 outline-none text-[0.72rem] text-slate-300 placeholder:text-slate-700"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3 text-slate-600" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* File Tree - Virtual Scrolling */}
      <div
        ref={fileTreeContainerRef}
        className={`${showEditor ? "h-[35%]" : "flex-1"} overflow-hidden py-1 border-b border-[var(--ide-border-faint)]`}
      >
        <VirtualFileTree
          treeData={fileTree}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
          onContextMenu={handleContextMenu}
          searchQuery={searchQuery}
          height={fileTreeHeight - 8} // 减去padding
          itemHeight={28}
        />
      </div>

      {/* Monaco Code Editor */}
      {showEditor && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Multi-Tab Bar */}
          <TabBar />

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
                minimap={false}
                lineNumbers="on"
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Show editor toggle if hidden */}
      {!showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          className="flex-shrink-0 h-7 w-full flex items-center gap-1.5 px-3 border-t border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)] text-[0.65rem] text-slate-600 hover:text-sky-400 transition-colors"
        >
          <FileCode2 className="w-3 h-3" />
          <span>打开编辑器</span>
        </button>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded shadow-xl py-1 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === "folder" && (
              <>
                <button
                  onClick={() => {
                    setNewFileDialog({
                      parentPath: contextMenu.path,
                      type: "file",
                    });
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-slate-400 hover:bg-[var(--ide-border-faint)] transition-colors"
                >
                  <FilePlus className="w-3 h-3" />
                  新建文件
                </button>
                <button
                  onClick={() => {
                    setNewFileDialog({
                      parentPath: contextMenu.path,
                      type: "folder",
                    });
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-slate-400 hover:bg-[var(--ide-border-faint)] transition-colors"
                >
                  <FolderPlus className="w-3 h-3" />
                  新建文件夹
                </button>
              </>
            )}
            {contextMenu.type === "file" && (
              <>
                <button
                  onClick={() => {
                    const name = contextMenu.path.split("/").pop() || "";
                    setRenameDialog({ path: contextMenu.path, name });
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-slate-400 hover:bg-[#1e3a5f]/30 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  重命名
                </button>
                <button
                  onClick={() => {
                    setDeleteDialog(contextMenu.path);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  删除
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* New File/Folder Dialog */}
      {newFileDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-2xl p-4 min-w-[300px]">
            <h3 className="text-[0.82rem] text-slate-300 mb-3">
              {newFileDialog.type === "file" ? "新建文件" : "新建文件夹"}
            </h3>
            <div className="text-[0.62rem] text-slate-600 mb-1.5">
              位置: {newFileDialog.parentPath}/
            </div>
            <input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile();
                if (e.key === "Escape") {
                  setNewFileDialog(null);
                  setNewFileName("");
                }
              }}
              placeholder={
                newFileDialog.type === "file" ? "filename.tsx" : "folder-name"
              }
              className="w-full px-2.5 py-1.5 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.72rem] text-slate-300 placeholder:text-slate-700 outline-none focus:border-sky-600/50"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setNewFileDialog(null);
                  setNewFileName("");
                }}
                className="px-3 py-1 rounded text-[0.68rem] text-slate-500 hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateFile}
                disabled={!newFileName.trim()}
                className="px-3 py-1 rounded bg-sky-600 text-white text-[0.68rem] hover:bg-sky-500 transition-colors disabled:opacity-30"
              >
                <Check className="w-3 h-3 inline mr-1" />
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-2xl p-4 min-w-[300px]">
            <h3 className="text-[0.82rem] text-slate-300 mb-3">重命名文件</h3>
            <input
              value={renameDialog.name}
              onChange={(e) =>
                setRenameDialog({ ...renameDialog, name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenameDialog(null);
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.72rem] text-slate-300 outline-none focus:border-sky-600/50"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setRenameDialog(null)}
                className="px-3 py-1 rounded text-[0.68rem] text-slate-500 hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRename}
                className="px-3 py-1 rounded bg-sky-600 text-white text-[0.68rem] hover:bg-sky-500 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-2xl p-4 min-w-[300px]">
            <h3 className="text-[0.82rem] text-slate-300 mb-2">确认删除</h3>
            <p className="text-[0.72rem] text-slate-500 mb-3">
              确定要删除{" "}
              <span className="text-red-400">
                {deleteDialog.split("/").pop()}
              </span>{" "}
              吗？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteDialog(null)}
                className="px-3 py-1 rounded text-[0.68rem] text-slate-500 hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 rounded bg-red-600 text-white text-[0.68rem] hover:bg-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3 inline mr-1" />
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
