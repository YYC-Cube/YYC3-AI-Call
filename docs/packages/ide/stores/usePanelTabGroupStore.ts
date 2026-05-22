/**
 * @file stores/usePanelTabGroupStore.ts
 * @description 面板标签页分组 Store，支持将面板标签页归类到命名分组中，
 *              分组折叠/展开、拖拽排序、颜色标识、持久化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,tab-group,panels,wave3
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { PanelId } from "../PanelManager";

// ── Types ──

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  panelIds: PanelId[];
  collapsed: boolean;
}

export interface PanelTabGroupState {
  groups: TabGroup[];
  // Ungrouped panels are implicitly those not in any group

  // Actions
  createGroup: (name: string, color?: string) => string;
  removeGroup: (groupId: string) => void;
  renameGroup: (groupId: string, name: string) => void;
  setGroupColor: (groupId: string, color: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  addPanelToGroup: (groupId: string, panelId: PanelId) => void;
  removePanelFromGroup: (groupId: string, panelId: PanelId) => void;
  movePanelBetweenGroups: (
    fromGroupId: string,
    toGroupId: string,
    panelId: PanelId,
  ) => void;
  reorderGroups: (fromIndex: number, toIndex: number) => void;
  getGroupForPanel: (panelId: PanelId) => TabGroup | null;
  resetGroups: () => void;
}

// ── Default group colors ──
const GROUP_COLORS = [
  "#818cf8", // indigo
  "#f87171", // red
  "#34d399", // emerald
  "#fbbf24", // amber
  "#60a5fa", // blue
  "#f472b6", // pink
  "#a78bfa", // violet
  "#2dd4bf", // teal
];

let groupCounter = 0;
function genGroupId(): string {
  return `grp_${Date.now()}_${++groupCounter}`;
}

// ── Default groups ──
const DEFAULT_GROUPS: TabGroup[] = [
  {
    id: "grp_default_dev",
    name: "开发核心",
    color: "#60a5fa",
    panelIds: ["ai", "files", "code", "preview", "terminal"],
    collapsed: false,
  },
  {
    id: "grp_default_tools",
    name: "开发工具",
    color: "#34d399",
    panelIds: [
      "git",
      "diagnostics",
      "performance",
      "security",
      "test-gen",
      "quality",
    ],
    collapsed: true,
  },
  {
    id: "grp_default_ai",
    name: "AI 生态",
    color: "#a78bfa",
    panelIds: ["agents", "market", "knowledge", "rag"],
    collapsed: true,
  },
  {
    id: "grp_default_collab",
    name: "协作运维",
    color: "#fbbf24",
    panelIds: ["collab", "ops", "workflow"],
    collapsed: true,
  },
];

export const usePanelTabGroupStore = create<PanelTabGroupState>()(
  persist(
    immer((set, get) => ({
      groups: DEFAULT_GROUPS,

      createGroup: (name: string, color?: string) => {
        const id = genGroupId();
        const colorIndex = get().groups.length % GROUP_COLORS.length;
        set((state) => {
          state.groups.push({
            id,
            name,
            color: color || GROUP_COLORS[colorIndex],
            panelIds: [],
            collapsed: false,
          });
        });
        return id;
      },

      removeGroup: (groupId: string) => {
        set((state) => {
          state.groups = state.groups.filter((g) => g.id !== groupId);
        });
      },

      renameGroup: (groupId: string, name: string) => {
        set((state) => {
          const group = state.groups.find((g) => g.id === groupId);
          if (group) group.name = name;
        });
      },

      setGroupColor: (groupId: string, color: string) => {
        set((state) => {
          const group = state.groups.find((g) => g.id === groupId);
          if (group) group.color = color;
        });
      },

      toggleGroupCollapse: (groupId: string) => {
        set((state) => {
          const group = state.groups.find((g) => g.id === groupId);
          if (group) group.collapsed = !group.collapsed;
        });
      },

      addPanelToGroup: (groupId: string, panelId: PanelId) => {
        set((state) => {
          // Remove from any existing group first
          for (const g of state.groups) {
            g.panelIds = g.panelIds.filter((id) => id !== panelId);
          }
          const group = state.groups.find((g) => g.id === groupId);
          if (group && !group.panelIds.includes(panelId)) {
            group.panelIds.push(panelId);
          }
        });
      },

      removePanelFromGroup: (groupId: string, panelId: PanelId) => {
        set((state) => {
          const group = state.groups.find((g) => g.id === groupId);
          if (group) {
            group.panelIds = group.panelIds.filter((id) => id !== panelId);
          }
        });
      },

      movePanelBetweenGroups: (
        fromGroupId: string,
        toGroupId: string,
        panelId: PanelId,
      ) => {
        set((state) => {
          const fromGroup = state.groups.find((g) => g.id === fromGroupId);
          const toGroup = state.groups.find((g) => g.id === toGroupId);
          if (fromGroup && toGroup) {
            fromGroup.panelIds = fromGroup.panelIds.filter(
              (id) => id !== panelId,
            );
            if (!toGroup.panelIds.includes(panelId)) {
              toGroup.panelIds.push(panelId);
            }
          }
        });
      },

      reorderGroups: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const [moved] = state.groups.splice(fromIndex, 1);
          state.groups.splice(toIndex, 0, moved);
        });
      },

      getGroupForPanel: (panelId: PanelId) => {
        return get().groups.find((g) => g.panelIds.includes(panelId)) || null;
      },

      resetGroups: () => {
        set((state) => {
          state.groups = DEFAULT_GROUPS;
        });
      },
    })),
    {
      name: "yyc3_panel_tab_groups",
    },
  ),
);
