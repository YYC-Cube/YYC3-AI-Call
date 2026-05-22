/**
 * @file VirtualFileTree.tsx
 * @description 虚拟滚动文件树组件，支持10,000+文件流畅渲染
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags virtual-scroll,file-tree,performance,react-window
 */

import React, { useMemo, useCallback, useState } from "react";
import { FixedSizeList } from "react-window";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { type FileNode } from "./fileData";

// ===== Types =====

interface FlatTreeNode {
  node: FileNode;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
}

interface VirtualFileTreeProps {
  treeData: FileNode[];
  activeFile: string;
  onFileSelect: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
  searchQuery?: string;
  height?: number;
  itemHeight?: number;
}

// ===== Constants =====

const DEFAULT_ITEM_HEIGHT = 28; // 每行高度
const DEFAULT_HEIGHT = 400; // 默认容器高度

// ===== Helpers =====

/**
 * 获取文件图标
 */
function getFileIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts"))
    return <FileCode2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  if (name.endsWith(".json"))
    return <FileJson className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
  if (name.endsWith(".css"))
    return <FileText className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />;
}

/**
 * 扁平化文件树，只包含可见节点
 */
function flattenTree(
  nodes: FileNode[],
  expandedFolders: Set<string>,
  depth: number = 0,
  searchQuery?: string,
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];

  for (const node of nodes) {
    // 搜索过滤
    if (
      searchQuery &&
      node.type === "file" &&
      !node.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      continue;
    }

    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.type === "folder" && node.children && node.children.length > 0;

    result.push({
      node,
      depth,
      isExpanded,
      hasChildren: !!hasChildren,
    });

    // 递归处理子节点（仅在展开时）
    if (isExpanded && hasChildren && node.children) {
      const childNodes = flattenTree(node.children, expandedFolders, depth + 1, searchQuery);
      
      // 搜索时，如果子节点匹配则显示父节点
      if (searchQuery && childNodes.length > 0) {
        result.push(...childNodes);
      } else if (!searchQuery) {
        result.push(...childNodes);
      }
    }
  }

  return result;
}

// ===== Main Component =====

export default function VirtualFileTree({
  treeData,
  activeFile,
  onFileSelect,
  onContextMenu,
  searchQuery = "",
  height = DEFAULT_HEIGHT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
}: VirtualFileTreeProps) {
  // 展开的文件夹集合
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src", "src/app", "src/app/components"]),
  );

  // 扁平化树数据（仅可见节点）
  const flatNodes = useMemo(
    () => flattenTree(treeData, expandedFolders, 0, searchQuery),
    [treeData, expandedFolders, searchQuery],
  );

  // 切换文件夹展开状态
  const handleToggle = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // 渲染单个节点
  const Node = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = flatNodes[index];
      if (!item) return null;

      const { node, depth, isExpanded, hasChildren } = item;
      const isActive = node.path === activeFile;

      const handleClick = (e: React.MouseEvent) => {
        if (node.type === "folder") {
          handleToggle(node.path);
        } else {
          onFileSelect(node.path);
        }
      };

      const handleContextMenuEvent = (e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu?.(e, node);
      };

      if (node.type === "folder") {
        return (
          <div
            style={{ ...style, paddingLeft: depth * 12 + 8 }}
            className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-white/3 transition-colors cursor-pointer"
            onClick={handleClick}
            onContextMenu={handleContextMenuEvent}
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
            <span className="text-[0.72rem] text-slate-400 truncate">{node.name}</span>
          </div>
        );
      }

      return (
        <div
          style={{ ...style, paddingLeft: depth * 12 + 24 }}
          className={`w-full flex items-center gap-1.5 py-1 px-2 rounded-sm transition-colors cursor-pointer ${
            isActive
              ? "bg-sky-900/30 text-sky-300"
              : "hover:bg-white/3 text-slate-400"
          }`}
          onClick={handleClick}
          onContextMenu={handleContextMenuEvent}
        >
          {getFileIcon(node.name)}
          <span className="text-[0.72rem] truncate">{node.name}</span>
        </div>
      );
    },
    [flatNodes, activeFile, onFileSelect, handleToggle, onContextMenu],
  );

  return (
    <FixedSizeList
      height={height}
      itemCount={flatNodes.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={5} // 预渲染额外5项，提升滚动流畅度
    >
      {Node}
    </FixedSizeList>
  );
}

// ===== Performance Monitor =====

/**
 * 性能监控Hook（可选）
 */
export function useVirtualTreePerformance(flatNodes: FlatTreeNode[]) {
  const totalNodes = flatNodes.length;
  const visibleNodes = Math.min(totalNodes, 20); // 假设可见区域约20项
  const savedRenders = totalNodes > visibleNodes ? totalNodes - visibleNodes : 0;
  const efficiency = totalNodes > 0 ? (visibleNodes / totalNodes) * 100 : 100;

  return {
    totalNodes,
    visibleNodes,
    savedRenders,
    efficiency: efficiency.toFixed(1),
  };
}
