/**
 * @file PanelManager.tsx
 * @description 多联式可拖拽合并布局系统核心，支持面板拆分、合并、拖拽、
 *              最大化、布局持久化、预设布局切换、面板交换、面板替换，
 *              面板固定/锁定、浮动面板窗口，管理 18 个功能面板
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v3.1.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panels,layout,dnd,split,merge,persistence,swap,replace,pin,lock,float,wave3
 */

import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  createContext,
  useContext,
  useEffect,
} from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  GripVertical,
  Maximize2,
  Minimize2,
  SplitSquareHorizontal,
  SplitSquareVertical,
  X,
  Columns3,
  RotateCcw,
  Pin,
  Lock,
  Unlock,
  ExternalLink,
} from "lucide-react";
import { SK_PANEL_LAYOUT } from "./constants/storage-keys";
import { usePanelPinStore } from "./stores/usePanelPinStore";
import { useFloatingPanelStore } from "./stores/useFloatingPanelStore";
import { errorReporting } from "./services/ErrorReportingService";

// ===== Types =====
export type PanelId =
  | "ai"
  | "files"
  | "code"
  | "preview"
  | "terminal"
  | "git"
  | "agents"
  | "market"
  | "knowledge"
  | "rag"
  | "collab"
  | "ops"
  | "workflow"
  | "diagnostics"
  | "performance"
  | "security"
  | "test-gen"
  | "quality"
  | "document-editor"
  | "taskboard"
  | "multi-instance";
export type SplitDirection = "horizontal" | "vertical";

export interface LayoutNode {
  id: string;
  type: "leaf" | "split";
  panelId?: PanelId;
  direction?: SplitDirection;
  children?: LayoutNode[];
  size?: number; // percentage
}

// Drag item type
const PANEL_DRAG_TYPE = "PANEL_TAB";

interface DragItem {
  panelId: PanelId;
  sourceNodeId: string;
}

// ===== Context =====
interface PanelManagerContextType {
  layout: LayoutNode;
  setLayout: (layout: LayoutNode | ((prev: LayoutNode) => LayoutNode)) => void;
  splitPanel: (
    nodeId: string,
    direction: SplitDirection,
    newPanelId: PanelId,
  ) => void;
  mergePanel: (
    targetNodeId: string,
    sourcePanelId: PanelId,
    position: "left" | "right" | "top" | "bottom",
  ) => void;
  removePanel: (nodeId: string) => void;
  resetLayout: () => void;
  openPanel: (panelId: PanelId) => void;
  swapPanels: (nodeIdA: string, nodeIdB: string) => void;
  replacePanel: (nodeId: string, newPanelId: PanelId) => void;
  maximizedPanel: string | null;
  setMaximizedPanel: (id: string | null) => void;
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
}

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export function usePanelManager() {
  return useContext(PanelManagerContext);
}

// ===== Default layout =====
const DEFAULT_LAYOUT: LayoutNode = {
  id: "root",
  type: "split",
  direction: "horizontal",
  children: [
    { id: "left", type: "leaf", panelId: "ai", size: 35 },
    { id: "center", type: "leaf", panelId: "files", size: 35 },
    { id: "right", type: "leaf", panelId: "code", size: 30 },
  ],
};

// Layout presets for different IDE modes
export const LAYOUT_PRESETS: Record<string, LayoutNode> = {
  designer: DEFAULT_LAYOUT,
  "ai-workspace": {
    id: "root",
    type: "split",
    direction: "horizontal",
    children: [
      { id: "left", type: "leaf", panelId: "ai", size: 40 },
      {
        id: "right-split",
        type: "split",
        direction: "vertical",
        children: [
          { id: "top-right", type: "leaf", panelId: "code", size: 60 },
          { id: "bottom-right", type: "leaf", panelId: "preview", size: 40 },
        ],
      },
    ],
  },
  default: DEFAULT_LAYOUT,
};

// ===== Utilities =====
let nodeCounter = 0;
function genId() {
  return `node_${Date.now()}_${++nodeCounter}`;
}

function findNode(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

function findParent(root: LayoutNode, id: string): LayoutNode | null {
  if (root.children) {
    for (const child of root.children) {
      if (child.id === id) return root;
      const found = findParent(child, id);
      if (found) return found;
    }
  }
  return null;
}

function cloneLayout(node: LayoutNode): LayoutNode {
  return JSON.parse(JSON.stringify(node));
}

function removeNodeFromTree(root: LayoutNode, id: string): LayoutNode {
  const clone = cloneLayout(root);
  const parent = findParent(clone, id);
  if (!parent || !parent.children) return clone;

  parent.children = parent.children.filter((c) => c.id !== id);

  // If parent has only one child left, collapse
  if (parent.children.length === 1) {
    const remaining = parent.children[0];
    parent.type = remaining.type;
    parent.panelId = remaining.panelId;
    parent.direction = remaining.direction;
    parent.children = remaining.children;
    parent.size = parent.size;
  }

  return clone;
}

// Find the last (rightmost / bottommost) leaf node in the tree
function findLastLeaf(node: LayoutNode): LayoutNode | null {
  if (node.type === "leaf") return node;
  if (node.children && node.children.length > 0) {
    return findLastLeaf(node.children[node.children.length - 1]);
  }
  return null;
}

// Check if a panelId is already visible in the layout
function isPanelOpen(node: LayoutNode, panelId: PanelId): string | null {
  if (node.type === "leaf" && node.panelId === panelId) return node.id;
  if (node.children) {
    for (const child of node.children) {
      const found = isPanelOpen(child, panelId);
      if (found) return found;
    }
  }
  return null;
}

// ===== Panel Header (Draggable) =====
interface PanelHeaderProps {
  nodeId: string;
  panelId: PanelId;
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

const PANEL_TITLES: Record<PanelId, string> = {
  ai: "AI 对话",
  files: "文件管理",
  code: "代码编辑",
  preview: "实时预览",
  terminal: "终端",
  git: "Git",
  agents: "Agent 编排",
  market: "Agent 市场",
  knowledge: "知识库",
  rag: "RAG 问答",
  collab: "实时协作",
  ops: "智能运维",
  workflow: "工作流闭环",
  diagnostics: "诊断工具",
  performance: "性能监控",
  security: "安全扫描",
  "test-gen": "测试生成",
  quality: "代码质量",
  "document-editor": "文档编辑器",
  taskboard: "任务看板",
  "multi-instance": "应用多开",
};

export function PanelHeader({
  nodeId,
  panelId,
  title,
  icon,
  children,
}: PanelHeaderProps) {
  const ctx = usePanelManager();
  const { isPinned, togglePin } = usePanelPinStore();
  const { isLocked, toggleLock } = usePanelPinStore();
  const { detachPanel } = useFloatingPanelStore();
  const pinned = isPinned(nodeId);
  const locked = isLocked(nodeId);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: PANEL_DRAG_TYPE,
      item: { panelId, sourceNodeId: nodeId } as DragItem,
      canDrag: () => !pinned, // Pinned panels cannot be dragged
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [panelId, nodeId, pinned],
  );

  const isMaximized = ctx ? ctx.maximizedPanel === nodeId : false;
  const canRemove = ctx
    ? ctx.layout.children && ctx.layout.children.length > 1
    : false;

  const [showSplitMenu, setShowSplitMenu] = useState(false);

  const handleFloat = useCallback(() => {
    if (ctx && canRemove) {
      detachPanel(panelId);
      ctx.removePanel(nodeId);
    }
  }, [ctx, canRemove, detachPanel, panelId, nodeId]);

  return (
    <div
      className={`flex items-center gap-0 px-1 py-0 border-b border-[var(--ide-border-dim)] bg-[var(--ide-bg-dark)] flex-shrink-0 ${
        isDragging ? "opacity-40" : ""
      } ${pinned ? "border-l-2 border-l-[var(--ide-accent-solid)]" : ""}`}
    >
      {/* Drag handle */}
      <div
        ref={ctx && !pinned ? (drag as any) : undefined}
        className={`flex items-center gap-1 px-1.5 py-1.5 ${ctx && !pinned ? "cursor-grab active:cursor-grabbing" : ""} hover:bg-white/5 rounded transition-colors`}
        title={pinned ? "面板已固定" : ctx ? "拖拽合并面板" : undefined}
      >
        {ctx && (
          <GripVertical
            className={`w-3 h-3 ${pinned ? "text-[var(--ide-accent-solid)]" : "text-[var(--ide-text-faint)]"}`}
          />
        )}
        <span className="flex items-center gap-1 text-[0.65rem] text-[var(--ide-text-muted)]">
          {icon}
          {title}
          {locked && <Lock className="w-2.5 h-2.5 text-amber-500/60 ml-0.5" />}
        </span>
      </div>

      {/* Custom header children */}
      {children}

      <div className="flex-1" />

      {/* Pin/Lock buttons */}
      {ctx && (
        <>
          <button
            onClick={() => togglePin(nodeId)}
            className={`w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors ${pinned ? "text-[var(--ide-accent-solid)]" : ""}`}
            title={pinned ? "取消固定" : "固定面板"}
          >
            <Pin
              className={`w-3 h-3 ${pinned ? "text-[var(--ide-accent-solid)]" : "text-[var(--ide-text-faint)]"}`}
            />
          </button>
          <button
            onClick={() => toggleLock(nodeId)}
            className={`w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors`}
            title={locked ? "解锁面板" : "锁定面板"}
          >
            {locked ? (
              <Lock className="w-3 h-3 text-amber-500" />
            ) : (
              <Unlock className="w-3 h-3 text-[var(--ide-text-faint)]" />
            )}
          </button>
        </>
      )}

      {/* Float out button */}
      {ctx && canRemove && !pinned && (
        <button
          onClick={handleFloat}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          title="浮动窗口"
        >
          <ExternalLink className="w-3 h-3 text-[var(--ide-text-faint)]" />
        </button>
      )}

      {/* Split button - only when inside PanelManager */}
      {ctx && (
        <div className="relative">
          <button
            onClick={() => setShowSplitMenu(!showSplitMenu)}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
            title="拆分面板"
          >
            <Columns3 className="w-3 h-3 text-[var(--ide-text-faint)]" />
          </button>
          {showSplitMenu && (
            <div className="absolute right-0 top-full mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded shadow-xl z-50 py-1 min-w-[140px]">
              <div className="px-2 py-1 text-[0.58rem] text-[var(--ide-text-dim)] border-b border-[var(--ide-border-faint)]">
                方向
              </div>
              <button
                onClick={() => {
                  ctx.splitPanel(nodeId, "horizontal", "preview");
                  setShowSplitMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)] transition-colors"
              >
                <SplitSquareHorizontal className="w-3 h-3" />
                水平拆分
              </button>
              <button
                onClick={() => {
                  ctx.splitPanel(nodeId, "vertical", "preview");
                  setShowSplitMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)] transition-colors"
              >
                <SplitSquareVertical className="w-3 h-3" />
                垂直拆分
              </button>
              <div className="px-2 py-1 text-[0.58rem] text-[var(--ide-text-dim)] border-t border-b border-[var(--ide-border-faint)] mt-1">
                拆分为
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {(
                  [
                    "preview",
                    "code",
                    "files",
                    "git",
                    "terminal",
                    "agents",
                    "market",
                    "knowledge",
                    "rag",
                    "collab",
                    "ops",
                    "workflow",
                    "diagnostics",
                    "performance",
                    "security",
                    "test-gen",
                    "quality",
                    "document-editor",
                    "taskboard",
                    "multi-instance",
                  ] as PanelId[]
                )
                  .filter((p) => p !== panelId)
                  .map((pid) => (
                    <button
                      key={pid}
                      onClick={() => {
                        ctx.splitPanel(nodeId, "horizontal", pid);
                        setShowSplitMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)] transition-colors"
                    >
                      <span className="w-3 h-3 text-[0.5rem] flex items-center justify-center text-[var(--ide-text-muted)]">
                        ●
                      </span>
                      {PANEL_TITLES[pid]}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Maximize/minimize - only when inside PanelManager */}
      {ctx && (
        <button
          onClick={() => ctx.setMaximizedPanel(isMaximized ? null : nodeId)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          title={isMaximized ? "还原" : "最大化"}
        >
          {isMaximized ? (
            <Minimize2 className="w-3 h-3 text-[var(--ide-text-faint)]" />
          ) : (
            <Maximize2 className="w-3 h-3 text-[var(--ide-text-faint)]" />
          )}
        </button>
      )}

      {/* Close (remove from layout) - only when inside PanelManager */}
      {ctx && canRemove && (
        <button
          onClick={() => ctx.removePanel(nodeId)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-900/20 transition-colors"
          title="关闭面板"
        >
          <X className="w-3 h-3 text-[var(--ide-text-faint)] hover:text-red-400" />
        </button>
      )}
    </div>
  );
}

// ===== Drop Zone (edges of panels) =====
interface DropZoneProps {
  nodeId: string;
  position: "left" | "right" | "top" | "bottom";
}

function DropZone({ nodeId, position }: DropZoneProps) {
  const ctx = usePanelManager();

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: PANEL_DRAG_TYPE,
      drop: (item: DragItem) => {
        if (item.sourceNodeId !== nodeId && ctx) {
          ctx.mergePanel(nodeId, item.panelId, position);
        }
      },
      canDrop: (item: DragItem) => item.sourceNodeId !== nodeId && !!ctx,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [nodeId, position, ctx],
  );

  if (!ctx) return null;

  const isActive = isOver && canDrop;

  const posStyles: Record<string, string> = {
    left: "left-0 top-0 w-4 h-full",
    right: "right-0 top-0 w-4 h-full",
    top: "top-0 left-0 w-full h-4",
    bottom: "bottom-0 left-0 w-full h-4",
  };

  const indicatorStyles: Record<string, string> = {
    left: "left-0 top-0 w-1/2 h-full",
    right: "right-0 top-0 w-1/2 h-full",
    top: "top-0 left-0 w-full h-1/2",
    bottom: "bottom-0 left-0 w-full h-1/2",
  };

  if (!canDrop) return null;

  return (
    <>
      <div
        ref={drop as any}
        className={`absolute ${posStyles[position]} z-30`}
      />
      {isActive && (
        <div
          className={`absolute ${indicatorStyles[position]} z-20 bg-[var(--ide-accent-solid)]/15 border-2 border-dashed border-[var(--ide-accent-solid)]/50 rounded pointer-events-none`}
        />
      )}
    </>
  );
}

// ===== Panel Leaf Container =====
interface PanelLeafProps {
  node: LayoutNode;
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
}

function PanelLeaf({ node, renderPanel }: PanelLeafProps) {
  if (!node.panelId) return null;

  return (
    <div className="size-full relative">
      {/* Drop zones on all edges */}
      <DropZone nodeId={node.id} position="left" />
      <DropZone nodeId={node.id} position="right" />
      <DropZone nodeId={node.id} position="top" />
      <DropZone nodeId={node.id} position="bottom" />

      {/* Panel content */}
      <div className="size-full">{renderPanel(node.panelId, node.id)}</div>
    </div>
  );
}

// ===== Split Container =====
interface SplitContainerProps {
  node: LayoutNode;
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
}

function SplitContainer({ node, renderPanel }: SplitContainerProps) {
  const children = node.children || [];
  const isHorizontal = node.direction === "horizontal";
  const [sizes, setSizes] = useState<number[]>(
    children.map((c) => c.size || 100 / children.length),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    index: number;
    startPos: number;
    startSizes: number[];
  } | null>(null);

  // Sync sizes when children change (layout reset, split, merge)
  const childIds = children.map((c) => c.id).join(",");
  useEffect(() => {
    setSizes(children.map((c) => c.size || 100 / children.length));
  }, [childIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResizeStart = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      const startPos = isHorizontal ? e.clientX : e.clientY;
      dragInfo.current = { index, startPos, startSizes: [...sizes] };

      const handleMove = (ev: MouseEvent) => {
        if (!dragInfo.current || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const totalSize = isHorizontal
          ? containerRect.width
          : containerRect.height;
        const currentPos = isHorizontal ? ev.clientX : ev.clientY;
        const delta = currentPos - dragInfo.current.startPos;
        const deltaPct = (delta / totalSize) * 100;

        const newSizes = [...dragInfo.current.startSizes];
        const minSize = 10;
        newSizes[index] = Math.max(
          minSize,
          dragInfo.current.startSizes[index] + deltaPct,
        );
        newSizes[index + 1] = Math.max(
          minSize,
          dragInfo.current.startSizes[index + 1] - deltaPct,
        );

        // Clamp
        if (newSizes[index] < minSize) {
          newSizes[index + 1] += newSizes[index] - minSize;
          newSizes[index] = minSize;
        }
        if (newSizes[index + 1] < minSize) {
          newSizes[index] += newSizes[index + 1] - minSize;
          newSizes[index + 1] = minSize;
        }

        setSizes(newSizes);
      };

      const handleUp = () => {
        dragInfo.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [sizes, isHorizontal],
  );

  return (
    <div
      ref={containerRef}
      className={`size-full flex ${isHorizontal ? "flex-row" : "flex-col"}`}
    >
      {children.map((child, i) => (
        <div key={child.id} className="contents">
          <div
            style={{
              [isHorizontal ? "width" : "height"]:
                `${sizes[i] || 100 / children.length}%`,
              [isHorizontal ? "minWidth" : "minHeight"]: "60px",
            }}
            className={`relative overflow-hidden ${
              isHorizontal
                ? i < children.length - 1
                  ? "border-r border-dashed border-[var(--ide-border-dim)]"
                  : ""
                : i < children.length - 1
                  ? "border-b border-dashed border-[var(--ide-border-dim)]"
                  : ""
            }`}
          >
            <LayoutRenderer node={child} renderPanel={renderPanel} />
          </div>
          {/* Resize handle */}
          {i < children.length - 1 && (
            <div
              onMouseDown={(e) => handleResizeStart(i, e)}
              className={`flex-shrink-0 z-10 ${
                isHorizontal
                  ? "w-[3px] cursor-col-resize hover:bg-[var(--ide-accent-solid)]/40"
                  : "h-[3px] cursor-row-resize hover:bg-[var(--ide-accent-solid)]/40"
              } bg-[var(--ide-border-subtle)] transition-colors`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ===== Layout Renderer =====
interface LayoutRendererProps {
  node: LayoutNode;
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
}

function LayoutRenderer({ node, renderPanel }: LayoutRendererProps) {
  if (node.type === "leaf") {
    return <PanelLeaf node={node} renderPanel={renderPanel} />;
  }
  return <SplitContainer node={node} renderPanel={renderPanel} />;
}

// ===== Main PanelManager Provider =====
interface PanelManagerProviderProps {
  children: React.ReactNode;
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
  initialLayout?: LayoutNode;
}

const LAYOUT_STORAGE_KEY = SK_PANEL_LAYOUT;

/** Save layout to localStorage for persistence across refreshes */
function persistLayout(layout: LayoutNode): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {}
}

/** Load persisted layout from localStorage */
function loadPersistedLayout(): LayoutNode | null {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function PanelManagerProvider({
  children,
  renderPanel,
  initialLayout,
}: PanelManagerProviderProps) {
  const [layout, setLayoutState] = useState<LayoutNode>(() => {
    // Try loading persisted layout first
    const persisted = loadPersistedLayout();
    if (persisted) return persisted;
    return initialLayout
      ? cloneLayout(initialLayout)
      : cloneLayout(DEFAULT_LAYOUT);
  });
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);

  // Persist layout whenever it changes
  const setLayout = useCallback(
    (layoutOrFn: LayoutNode | ((prev: LayoutNode) => LayoutNode)) => {
      setLayoutState((prev) => {
        const next =
          typeof layoutOrFn === "function" ? layoutOrFn(prev) : layoutOrFn;
        persistLayout(next);
        return next;
      });
    },
    [],
  );

  const splitPanel = useCallback(
    (nodeId: string, direction: SplitDirection, newPanelId: PanelId) => {
      errorReporting.addBreadcrumb({
        type: "click",
        category: "panel",
        message: `拆分面板: ${direction} → ${PANEL_TITLES[newPanelId] || newPanelId}`,
        data: { nodeId, direction, newPanelId },
      });
      setLayout((prev) => {
        const clone = cloneLayout(prev);
        const node = findNode(clone, nodeId);
        if (!node || node.type !== "leaf") return prev;

        const existingPanelId = node.panelId!;
        node.type = "split";
        node.direction = direction;
        node.panelId = undefined;
        node.children = [
          { id: genId(), type: "leaf", panelId: existingPanelId, size: 50 },
          { id: genId(), type: "leaf", panelId: newPanelId, size: 50 },
        ];
        return clone;
      });
    },
    [],
  );

  const mergePanel = useCallback(
    (
      targetNodeId: string,
      sourcePanelId: PanelId,
      position: "left" | "right" | "top" | "bottom",
    ) => {
      errorReporting.addBreadcrumb({
        type: "click",
        category: "panel",
        message: `合并面板: ${PANEL_TITLES[sourcePanelId] || sourcePanelId} → ${position}`,
        data: { targetNodeId, sourcePanelId, position },
      });
      setLayout((prev) => {
        const clone = cloneLayout(prev);
        const targetNode = findNode(clone, targetNodeId);
        if (!targetNode || targetNode.type !== "leaf") return prev;

        const existingPanelId = targetNode.panelId!;
        const direction: SplitDirection =
          position === "left" || position === "right"
            ? "horizontal"
            : "vertical";
        const first =
          position === "left" || position === "top"
            ? sourcePanelId
            : existingPanelId;
        const second =
          position === "left" || position === "top"
            ? existingPanelId
            : sourcePanelId;

        targetNode.type = "split";
        targetNode.direction = direction;
        targetNode.panelId = undefined;
        targetNode.children = [
          { id: genId(), type: "leaf", panelId: first, size: 50 },
          { id: genId(), type: "leaf", panelId: second, size: 50 },
        ];
        return clone;
      });
    },
    [],
  );

  const removePanel = useCallback(
    (nodeId: string) => {
      errorReporting.addBreadcrumb({
        type: "click",
        category: "panel",
        message: `关闭面板: ${nodeId}`,
        data: { nodeId },
      });
      setLayout((prev) => removeNodeFromTree(prev, nodeId));
      if (maximizedPanel === nodeId) setMaximizedPanel(null);
    },
    [maximizedPanel],
  );

  const resetLayout = useCallback(() => {
    errorReporting.addBreadcrumb({
      type: "click",
      category: "panel",
      message: "重置布局",
    });
    setLayout(cloneLayout(initialLayout || DEFAULT_LAYOUT));
    setMaximizedPanel(null);
    // Clear persisted layout so fresh start uses the initial preset
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {}
  }, [initialLayout]);

  const openPanel = useCallback((panelId: PanelId) => {
    errorReporting.addBreadcrumb({
      type: "click",
      category: "panel",
      message: `打开面板: ${PANEL_TITLES[panelId] || panelId}`,
      data: { panelId },
    });
    setLayout((prev) => {
      // If panel is already open, just focus it (maximize temporarily)
      const existingNodeId = isPanelOpen(prev, panelId);
      if (existingNodeId) return prev;

      const clone = cloneLayout(prev);
      // Find the last leaf to split into
      const lastLeaf = findLastLeaf(clone);
      if (!lastLeaf) return prev;

      const existingPanelId = lastLeaf.panelId!;
      lastLeaf.type = "split";
      lastLeaf.direction = "horizontal";
      lastLeaf.panelId = undefined;
      lastLeaf.children = [
        { id: genId(), type: "leaf", panelId: existingPanelId, size: 50 },
        { id: genId(), type: "leaf", panelId: panelId, size: 50 },
      ];
      return clone;
    });
  }, []);

  const swapPanels = useCallback((nodeIdA: string, nodeIdB: string) => {
    errorReporting.addBreadcrumb({
      type: "click",
      category: "panel",
      message: `交换面板: ${nodeIdA} ↔ ${nodeIdB}`,
      data: { nodeIdA, nodeIdB },
    });
    setLayout((prev) => {
      const clone = cloneLayout(prev);
      const nodeA = findNode(clone, nodeIdA);
      const nodeB = findNode(clone, nodeIdB);
      if (!nodeA || !nodeB || nodeA.type !== "leaf" || nodeB.type !== "leaf")
        return prev;

      const tempPanelId = nodeA.panelId!;
      nodeA.panelId = nodeB.panelId!;
      nodeB.panelId = tempPanelId;
      return clone;
    });
  }, []);

  const replacePanel = useCallback((nodeId: string, newPanelId: PanelId) => {
    errorReporting.addBreadcrumb({
      type: "click",
      category: "panel",
      message: `替换面板: → ${PANEL_TITLES[newPanelId] || newPanelId}`,
      data: { nodeId, newPanelId },
    });
    setLayout((prev) => {
      const clone = cloneLayout(prev);
      const node = findNode(clone, nodeId);
      if (!node || node.type !== "leaf") return prev;

      node.panelId = newPanelId;
      return clone;
    });
  }, []);

  const ctx = useMemo(
    () => ({
      layout,
      setLayout,
      splitPanel,
      mergePanel,
      removePanel,
      resetLayout,
      openPanel,
      swapPanels,
      replacePanel,
      maximizedPanel,
      setMaximizedPanel,
      renderPanel,
    }),
    [
      layout,
      splitPanel,
      mergePanel,
      removePanel,
      resetLayout,
      openPanel,
      swapPanels,
      replacePanel,
      maximizedPanel,
      renderPanel,
    ],
  );

  return (
    <PanelManagerContext.Provider value={ctx}>
      {children}
    </PanelManagerContext.Provider>
  );
}

// ===== Layout Area (place this where you want the panels to render) =====
export function PanelLayoutArea() {
  const ctx = usePanelManager();
  if (!ctx) return null;
  const { layout, maximizedPanel, renderPanel } = ctx;

  return (
    <div className="size-full">
      {maximizedPanel ? (
        <MaximizedView nodeId={maximizedPanel} renderPanel={renderPanel} />
      ) : (
        <LayoutRenderer node={layout} renderPanel={renderPanel} />
      )}
    </div>
  );
}

// ===== Maximized View =====
function MaximizedView({
  nodeId,
  renderPanel,
}: {
  nodeId: string;
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
}) {
  const ctx = usePanelManager();
  if (!ctx) return null;
  const node = findNode(ctx.layout, nodeId);
  if (!node || !node.panelId) return null;
  return <div className="size-full">{renderPanel(node.panelId, nodeId)}</div>;
}

// ===== Reset Button =====
export function LayoutResetButton() {
  const ctx = usePanelManager();
  if (!ctx) return null;
  return (
    <button
      onClick={ctx.resetLayout}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.62rem] text-slate-600 hover:text-sky-400 hover:bg-white/5 transition-colors"
      title="重置布局"
    >
      <RotateCcw className="w-3 h-3" />
    </button>
  );
}
