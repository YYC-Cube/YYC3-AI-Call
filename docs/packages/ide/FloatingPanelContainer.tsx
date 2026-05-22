/**
 * @file FloatingPanelContainer.tsx
 * @description 浮动面板窗口容器，渲染所有从布局中分离的浮动面板，
 *              支持自由拖拽、调整大小、最小化/还原、回停入布局
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags floating,panels,windows,drag,resize,wave3
 */

import React, { useCallback, useRef, useState } from "react";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  ArrowDownToLine,
  GripVertical,
} from "lucide-react";
import {
  useFloatingPanelStore,
  type FloatingPanelConfig,
} from "./stores/useFloatingPanelStore";
import { usePanelManager, type PanelId } from "./PanelManager";

// ── Panel title map ──

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
  "document-editor": "文档编辑",
  taskboard: "任务看板",
  "multi-instance": "多实例",
};

// ── Single Floating Window ──

interface FloatingWindowProps {
  config: FloatingPanelConfig;
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
}

function FloatingWindow({ config, renderPanel }: FloatingWindowProps) {
  const { movePanel, resizePanel, toggleMinimize, bringToFront, attachPanel } =
    useFloatingPanelStore();
  const panelCtx = usePanelManager();

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      bringToFront(config.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: config.x,
        origY: config.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        movePanel(
          config.id,
          dragRef.current.origX + dx,
          dragRef.current.origY + dy,
        );
      };

      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [config.id, config.x, config.y, bringToFront, movePanel],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      bringToFront(config.id);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: config.width,
        origH: config.height,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dx = ev.clientX - resizeRef.current.startX;
        const dy = ev.clientY - resizeRef.current.startY;
        resizePanel(
          config.id,
          resizeRef.current.origW + dx,
          resizeRef.current.origH + dy,
        );
      };

      const handleUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "nwse-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [config.id, config.width, config.height, bringToFront, resizePanel],
  );

  const handleDock = useCallback(() => {
    const panelId = attachPanel(config.id);
    if (panelId && panelCtx) {
      panelCtx.openPanel(panelId);
    }
  }, [config.id, attachPanel, panelCtx]);

  const handleClose = useCallback(() => {
    attachPanel(config.id);
  }, [config.id, attachPanel]);

  const title = PANEL_TITLES[config.panelId] || config.panelId;

  if (config.minimized) {
    return (
      <div
        style={{
          position: "fixed",
          left: config.x,
          bottom: 48,
          zIndex: config.zIndex,
        }}
        className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-2xl overflow-hidden"
        onMouseDown={() => bringToFront(config.id)}
      >
        <div className="flex items-center gap-1.5 px-2 py-1">
          <span className="text-[0.65rem] text-[var(--ide-text-secondary)]">
            {title}
          </span>
          <button
            onClick={() => toggleMinimize(config.id)}
            className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
            title="还原"
          >
            <Maximize2 className="w-3 h-3 text-[var(--ide-text-faint)]" />
          </button>
          <button
            onClick={handleClose}
            className="w-4 h-4 rounded flex items-center justify-center hover:bg-red-900/20 transition-colors"
            title="关闭"
          >
            <X className="w-3 h-3 text-[var(--ide-text-faint)]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: config.x,
        top: config.y,
        width: config.width,
        height: config.height,
        zIndex: config.zIndex,
      }}
      className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-2xl overflow-hidden flex flex-col"
      onMouseDown={() => bringToFront(config.id)}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center gap-1 px-1.5 py-1 bg-[var(--ide-bg-dark)] border-b border-[var(--ide-border-dim)] cursor-grab active:cursor-grabbing flex-shrink-0 select-none"
      >
        <GripVertical className="w-3 h-3 text-[var(--ide-text-faint)]" />
        <span className="text-[0.65rem] text-[var(--ide-text-muted)] flex-1">
          {title}
        </span>

        {/* Dock back into layout */}
        <button
          onClick={handleDock}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          title="停靠回布局"
        >
          <ArrowDownToLine className="w-3 h-3 text-[var(--ide-text-faint)]" />
        </button>

        {/* Minimize */}
        <button
          onClick={() => toggleMinimize(config.id)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          title="最小化"
        >
          <Minus className="w-3 h-3 text-[var(--ide-text-faint)]" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-900/20 transition-colors"
          title="关闭浮动窗口"
        >
          <X className="w-3 h-3 text-[var(--ide-text-faint)] hover:text-red-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderPanel(config.panelId, `floating-${config.id}`)}
      </div>

      {/* Resize handle (bottom-right corner) */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        style={{ touchAction: "none" }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="absolute bottom-0.5 right-0.5 text-[var(--ide-text-faint)] opacity-50"
        >
          <path
            d="M9 1L1 9M9 5L5 9M9 9L9 9"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

// ── Floating Panel Container (renders all floating panels) ──

interface FloatingPanelContainerProps {
  renderPanel: (panelId: PanelId, nodeId: string) => React.ReactNode;
}

export default function FloatingPanelContainer({
  renderPanel,
}: FloatingPanelContainerProps) {
  const { floatingPanels } = useFloatingPanelStore();

  if (floatingPanels.length === 0) return null;

  return (
    <>
      {floatingPanels.map((config) => (
        <FloatingWindow
          key={config.id}
          config={config}
          renderPanel={renderPanel}
        />
      ))}
    </>
  );
}
