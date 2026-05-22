/**
 * @file stores/useTaskBoardStore.ts
 * @description AI 智能任务看板 Zustand Store — 管理任务 CRUD、状态流转、优先级、子任务、
 *              提醒系统、AI 对话自动提取任务，对齐 P1-AI-任务看板交互.md 规范
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,task-board,kanban,ai-inference
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──

export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "blocked";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskType =
  | "feature"
  | "bug"
  | "refactor"
  | "test"
  | "documentation"
  | "other";
export type ReminderType =
  | "deadline"
  | "dependency"
  | "blocking"
  | "progress"
  | "custom";

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  estimatedHours?: number;
  actualHours?: number;
  relatedMessageId?: string;
  relatedFiles?: string[];
  tags?: string[];
  subtasks?: SubTask[];
  dependencies?: string[];
  blocking?: string[];
  assigneeId?: string;
  isArchived: boolean;
  source: "manual" | "ai-inferred" | "imported";
  confidence?: number;
}

export interface Reminder {
  id: string;
  taskId: string;
  type: ReminderType;
  message: string;
  remindAt: number;
  isTriggered: boolean;
  isRead: boolean;
  createdAt: number;
}

export interface TaskInference {
  task: Omit<Task, "id" | "createdAt" | "updatedAt" | "isArchived" | "source">;
  confidence: number;
  reasoning: string;
  context: string;
}

// ── Filter/View ──

export type BoardView = "kanban" | "list" | "timeline";
export type SortField =
  | "priority"
  | "dueDate"
  | "createdAt"
  | "updatedAt"
  | "title";

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  tags?: string[];
  searchQuery?: string;
  showArchived?: boolean;
}

// ── Store ──

interface TaskBoardState {
  tasks: Task[];
  reminders: Reminder[];
  pendingInferences: TaskInference[];
  filters: TaskFilters;
  sortField: SortField;
  sortAsc: boolean;
  boardView: BoardView;
  selectedTaskId: string | null;
}

interface TaskBoardActions {
  // Task CRUD
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  archiveTask: (id: string) => void;

  // Status flow
  moveTask: (id: string, status: TaskStatus) => void;

  // SubTasks
  addSubTask: (taskId: string, title: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  removeSubTask: (taskId: string, subTaskId: string) => void;

  // Priority
  setPriority: (id: string, priority: TaskPriority) => void;

  // Reminders
  addReminder: (
    reminder: Omit<Reminder, "id" | "createdAt" | "isTriggered" | "isRead">,
  ) => void;
  triggerReminder: (id: string) => void;
  markReminderRead: (id: string) => void;
  removeReminder: (id: string) => void;

  // AI Inferences
  addInferences: (inferences: TaskInference[]) => void;
  acceptInference: (index: number) => void;
  dismissInference: (index: number) => void;
  clearInferences: () => void;

  // View/Filter
  setFilters: (filters: TaskFilters) => void;
  setSortField: (field: SortField) => void;
  toggleSortOrder: () => void;
  setBoardView: (view: BoardView) => void;
  setSelectedTask: (id: string | null) => void;

  // Queries
  getTasksByStatus: (status: TaskStatus) => Task[];
  getFilteredTasks: () => Task[];
  getUnreadReminders: () => Reminder[];
  getOverdueTasks: () => Task[];
}

export const useTaskBoardStore = create<TaskBoardState & TaskBoardActions>()(
  persist(
    (set, get) => ({
      // ── State ──
      tasks: [],
      reminders: [],
      pendingInferences: [],
      filters: {},
      sortField: "priority",
      sortAsc: true,
      boardView: "kanban",
      selectedTaskId: null,

      // ── Task CRUD ──

      addTask: (taskData) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = Date.now();
        const task: Task = {
          ...taskData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return id;
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t,
          ),
        }));
      },

      removeTask: (id) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          reminders: s.reminders.filter((r) => r.taskId !== id),
        }));
      },

      archiveTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, isArchived: true, updatedAt: Date.now() } : t,
          ),
        }));
      },

      // ── Status flow ──

      moveTask: (id, status) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status, updatedAt: Date.now() } : t,
          ),
        }));
      },

      // ── SubTasks ──

      addSubTask: (taskId, title) => {
        const subTask: SubTask = {
          id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          isCompleted: false,
          createdAt: Date.now(),
        };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [...(t.subtasks || []), subTask],
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      toggleSubTask: (taskId, subTaskId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((st) =>
                    st.id === subTaskId
                      ? { ...st, isCompleted: !st.isCompleted }
                      : st,
                  ),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      removeSubTask: (taskId, subTaskId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).filter(
                    (st) => st.id !== subTaskId,
                  ),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      // ── Priority ──

      setPriority: (id, priority) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, priority, updatedAt: Date.now() } : t,
          ),
        }));
      },

      // ── Reminders ──

      addReminder: (data) => {
        const reminder: Reminder = {
          ...data,
          id: `rem-${Date.now()}`,
          createdAt: Date.now(),
          isTriggered: false,
          isRead: false,
        };
        set((s) => ({ reminders: [...s.reminders, reminder] }));
      },

      triggerReminder: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, isTriggered: true } : r,
          ),
        }));
      },

      markReminderRead: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, isRead: true } : r,
          ),
        }));
      },

      removeReminder: (id) => {
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
      },

      // ── AI Inferences ──

      addInferences: (inferences) => {
        set((s) => ({
          pendingInferences: [...s.pendingInferences, ...inferences],
        }));
      },

      acceptInference: (index) => {
        const { pendingInferences, addTask } = get();
        const inf = pendingInferences[index];
        if (!inf) return;

        addTask({
          ...inf.task,
          isArchived: false,
          source: "ai-inferred",
          confidence: inf.confidence,
        });

        set((s) => ({
          pendingInferences: s.pendingInferences.filter((_, i) => i !== index),
        }));
      },

      dismissInference: (index) => {
        set((s) => ({
          pendingInferences: s.pendingInferences.filter((_, i) => i !== index),
        }));
      },

      clearInferences: () => set({ pendingInferences: [] }),

      // ── View/Filter ──

      setFilters: (filters) => set({ filters }),

      setSortField: (field) => set({ sortField: field }),

      toggleSortOrder: () => set((s) => ({ sortAsc: !s.sortAsc })),

      setBoardView: (view) => set({ boardView: view }),

      setSelectedTask: (id) => set({ selectedTaskId: id }),

      // ── Queries ──

      getTasksByStatus: (status) => {
        return get().tasks.filter((t) => t.status === status && !t.isArchived);
      },

      getFilteredTasks: () => {
        const { tasks, filters, sortField, sortAsc } = get();
        let filtered = tasks.filter(
          (t) => !t.isArchived || filters.showArchived,
        );

        if (filters.status?.length) {
          filtered = filtered.filter((t) => filters.status!.includes(t.status));
        }
        if (filters.priority?.length) {
          filtered = filtered.filter((t) =>
            filters.priority!.includes(t.priority),
          );
        }
        if (filters.type?.length) {
          filtered = filtered.filter((t) => filters.type!.includes(t.type));
        }
        if (filters.tags?.length) {
          filtered = filtered.filter((t) =>
            t.tags?.some((tag) => filters.tags!.includes(tag)),
          );
        }
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.description?.toLowerCase().includes(q) ||
              t.tags?.some((tag) => tag.toLowerCase().includes(q)),
          );
        }

        // Sort
        const priorityOrder: Record<TaskPriority, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        filtered.sort((a, b) => {
          let cmp = 0;
          switch (sortField) {
            case "priority":
              cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
              break;
            case "dueDate":
              cmp = (a.dueDate || Infinity) - (b.dueDate || Infinity);
              break;
            case "createdAt":
              cmp = a.createdAt - b.createdAt;
              break;
            case "updatedAt":
              cmp = a.updatedAt - b.updatedAt;
              break;
            case "title":
              cmp = a.title.localeCompare(b.title);
              break;
          }
          return sortAsc ? cmp : -cmp;
        });

        return filtered;
      },

      getUnreadReminders: () => {
        return get().reminders.filter((r) => r.isTriggered && !r.isRead);
      },

      getOverdueTasks: () => {
        const now = Date.now();
        return get().tasks.filter(
          (t) =>
            t.dueDate &&
            t.dueDate < now &&
            t.status !== "done" &&
            !t.isArchived,
        );
      },
    }),
    {
      name: "yyc3-task-board",
      partialize: (state) => ({
        tasks: state.tasks,
        reminders: state.reminders,
        filters: state.filters,
        sortField: state.sortField,
        sortAsc: state.sortAsc,
        boardView: state.boardView,
      }),
    },
  ),
);

// ── Kanban Column Definitions ──

export const KANBAN_COLUMNS: Array<{
  status: TaskStatus;
  label: string;
  color: string;
}> = [
  { status: "todo", label: "To Do", color: "text-slate-400" },
  { status: "in-progress", label: "In Progress", color: "text-sky-400" },
  { status: "review", label: "Review", color: "text-amber-400" },
  { status: "done", label: "Done", color: "text-emerald-400" },
  { status: "blocked", label: "Blocked", color: "text-red-400" },
];

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: "text-red-500 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

export const TYPE_ICONS: Record<TaskType, string> = {
  feature: "Sparkles",
  bug: "Bug",
  refactor: "RefreshCw",
  test: "FlaskConical",
  documentation: "BookOpen",
  other: "Circle",
};
