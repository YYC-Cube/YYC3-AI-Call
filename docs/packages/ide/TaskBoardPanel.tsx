/**
 * @file TaskBoardPanel.tsx
 * @description AI 智能任务看板面板 — Kanban/List 视图、任务 CRUD、AI 推理任务接受/拒绝、
 *              优先级拖拽、子任务管理，对齐 P1-AI-任务看板交互.md 规范
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags task-board,kanban,panel,ai-inference
 */

import { useState, useCallback, useMemo } from "react";
import {
  ListTodo,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Sparkles,
  Bug,
  RefreshCw,
  FlaskConical,
  BookOpen,
  Circle,
  LayoutGrid,
  List,
  Search,
  Archive,
  Bot,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import {
  useTaskBoardStore,
  KANBAN_COLUMNS,
  PRIORITY_COLORS,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from "./stores/useTaskBoardStore";

// ── Icon map ──
const TYPE_ICON_MAP: Record<
  TaskType,
  React.ComponentType<{ className?: string }>
> = {
  feature: Sparkles,
  bug: Bug,
  refactor: RefreshCw,
  test: FlaskConical,
  documentation: BookOpen,
  other: Circle,
};

export default function TaskBoardPanel({ nodeId }: { nodeId: string }) {
  const {
    tasks,
    pendingInferences,
    boardView,
    filters,
    addTask,
    updateTask,
    removeTask,
    moveTask,
    archiveTask,
    addSubTask,
    toggleSubTask,
    setPriority,
    setBoardView,
    setFilters,
    setSelectedTask,
    getFilteredTasks,
    getTasksByStatus,
    acceptInference,
    dismissInference,
  } = useTaskBoardStore();

  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    type: "feature" as TaskType,
    priority: "medium" as TaskPriority,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  const filteredTasks = useMemo(() => {
    let result = getFilteredTasks();
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [getFilteredTasks, searchQuery, tasks, filters]);

  const handleCreate = useCallback(() => {
    if (!draft.title.trim()) return;
    addTask({
      title: draft.title,
      type: draft.type,
      priority: draft.priority,
      status: "todo",
      isArchived: false,
      source: "manual",
    });
    setDraft({ title: "", type: "feature", priority: "medium" });
    setIsCreating(false);
  }, [draft, addTask]);

  const handleAddSubtask = useCallback(
    (taskId: string) => {
      if (!newSubtask.trim()) return;
      addSubTask(taskId, newSubtask.trim());
      setNewSubtask("");
    },
    [newSubtask, addSubTask],
  );

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="taskboard"
        title="Task Board"
        icon={<ListTodo className="w-3 h-3 text-amber-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          {/* View toggle */}
          <button
            onClick={() =>
              setBoardView(boardView === "kanban" ? "list" : "kanban")
            }
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title={boardView === "kanban" ? "List view" : "Kanban view"}
          >
            {boardView === "kanban" ? (
              <List className="w-3 h-3 text-slate-600" />
            ) : (
              <LayoutGrid className="w-3 h-3 text-slate-600" />
            )}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="Add task"
          >
            <Plus className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      </PanelHeader>

      {/* Search + AI inferences badge */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)]">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] rounded-md px-2 py-1">
            <Search className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent border-0 outline-none text-[0.72rem] text-slate-300 placeholder:text-slate-700"
            />
          </div>
          {pendingInferences.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <Bot className="w-3 h-3 text-amber-400" />
              <span className="text-[0.62rem] text-amber-400">
                {pendingInferences.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[0.58rem] text-slate-600">
          <span>{filteredTasks.length} tasks</span>
          <span>·</span>
          <span>
            {tasks.filter((t) => t.status === "done" && !t.isArchived).length}{" "}
            done
          </span>
          <span>·</span>
          <span>
            {tasks.filter((t) => t.status === "blocked").length} blocked
          </span>
        </div>
      </div>

      {/* AI Inferences */}
      {pendingInferences.length > 0 && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)] bg-amber-500/[0.03]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bot className="w-3 h-3 text-amber-400" />
            <span className="text-[0.68rem] text-amber-400">
              AI Suggested Tasks
            </span>
          </div>
          {pendingInferences.slice(0, 3).map((inf, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] mb-1"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[0.72rem] text-slate-300 truncate">
                  {inf.task.title}
                </div>
                <div className="text-[0.55rem] text-slate-600">
                  {inf.task.type} · {inf.task.priority} ·{" "}
                  {(inf.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <button
                onClick={() => acceptInference(idx)}
                className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500/30"
                title="Accept"
              >
                <Check className="w-3 h-3 text-emerald-400" />
              </button>
              <button
                onClick={() => dismissInference(idx)}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
                title="Dismiss"
              >
                <X className="w-3 h-3 text-slate-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)] bg-[var(--ide-bg-elevated)]/30 space-y-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            placeholder="Task title..."
            autoFocus
            className="w-full px-2 py-1.5 rounded-md bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] text-[0.75rem] text-slate-300 placeholder:text-slate-700 outline-none focus:border-sky-600/50"
          />
          <div className="flex items-center gap-2">
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as TaskType })
              }
              className="px-2 py-1 rounded-md bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] text-[0.68rem] text-slate-400 outline-none"
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="refactor">Refactor</option>
              <option value="test">Test</option>
              <option value="documentation">Docs</option>
              <option value="other">Other</option>
            </select>
            <select
              value={draft.priority}
              onChange={(e) =>
                setDraft({ ...draft, priority: e.target.value as TaskPriority })
              }
              className="px-2 py-1 rounded-md bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] text-[0.68rem] text-slate-400 outline-none"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex-1" />
            <button
              onClick={() => {
                setIsCreating(false);
                setDraft({ title: "", type: "feature", priority: "medium" });
              }}
              className="px-2 py-1 rounded text-[0.68rem] text-slate-600 hover:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!draft.title.trim()}
              className="px-2 py-1 rounded bg-sky-600/80 text-[0.68rem] text-white hover:bg-sky-500 disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Task content */}
      <div className="flex-1 overflow-y-auto p-3">
        {boardView === "kanban" ? (
          /* Kanban View */
          <div className="flex gap-2 overflow-x-auto min-h-full pb-2">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter(
                (t) => t.status === col.status,
              );
              return (
                <div key={col.status} className="flex-shrink-0 w-[180px]">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1.5 mb-2 rounded-md border border-[var(--ide-border-dim)]`}
                  >
                    <span className={`text-[0.68rem] ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="text-[0.55rem] text-slate-700 ml-auto">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isExpanded={expandedId === task.id}
                        onToggle={() =>
                          setExpandedId(expandedId === task.id ? null : task.id)
                        }
                        onMove={moveTask}
                        onRemove={removeTask}
                        onArchive={archiveTask}
                        onPriority={setPriority}
                        onToggleSubTask={toggleSubTask}
                        onAddSubTask={handleAddSubtask}
                        newSubtask={newSubtask}
                        setNewSubtask={setNewSubtask}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-[0.72rem] text-slate-600">
                No tasks yet. Create one or let AI suggest tasks from your
                conversations.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedId === task.id}
                  onToggle={() =>
                    setExpandedId(expandedId === task.id ? null : task.id)
                  }
                  onMove={moveTask}
                  onRemove={removeTask}
                  onArchive={archiveTask}
                  onPriority={setPriority}
                  onToggleSubTask={toggleSubTask}
                  onAddSubTask={handleAddSubtask}
                  newSubtask={newSubtask}
                  setNewSubtask={setNewSubtask}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TaskCard ──

function TaskCard({
  task,
  isExpanded,
  onToggle,
  onMove,
  onRemove,
  onArchive,
  onPriority,
  onToggleSubTask,
  onAddSubTask,
  newSubtask,
  setNewSubtask,
}: {
  task: Task;
  isExpanded: boolean;
  onToggle: () => void;
  onMove: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
  onArchive: (id: string) => void;
  onPriority: (id: string, p: TaskPriority) => void;
  onToggleSubTask: (taskId: string, subId: string) => void;
  onAddSubTask: (taskId: string) => void;
  newSubtask: string;
  setNewSubtask: (v: string) => void;
}) {
  const TypeIcon = TYPE_ICON_MAP[task.type] || Circle;
  const priClass = PRIORITY_COLORS[task.priority];
  const completedSubs = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubs = task.subtasks?.length || 0;
  const isOverdue =
    task.dueDate && task.dueDate < Date.now() && task.status !== "done";

  return (
    <div
      className={`rounded-md border border-[var(--ide-border-dim)] bg-[var(--ide-bg-elevated)]/50 transition-all ${isExpanded ? "ring-1 ring-sky-600/30" : ""}`}
    >
      <div
        className="flex items-start gap-1.5 px-2 py-1.5 cursor-pointer"
        onClick={onToggle}
      >
        <TypeIcon
          className={`w-3 h-3 mt-0.5 flex-shrink-0 ${task.status === "done" ? "text-emerald-400" : "text-slate-500"}`}
        />
        <div className="flex-1 min-w-0">
          <div
            className={`text-[0.72rem] ${task.status === "done" ? "text-slate-600 line-through" : "text-slate-300"} leading-tight`}
          >
            {task.title}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[0.5rem] px-1 py-0.5 rounded border ${priClass}`}
            >
              {task.priority}
            </span>
            {task.source === "ai-inferred" && (
              <Bot className="w-2.5 h-2.5 text-amber-400" />
            )}
            {isOverdue && (
              <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
            )}
            {totalSubs > 0 && (
              <span className="text-[0.5rem] text-slate-600">
                {completedSubs}/{totalSubs}
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-slate-600" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-600" />
        )}
      </div>

      {isExpanded && (
        <div className="px-2 pb-2 pt-1 border-t border-[var(--ide-border-faint)] space-y-2">
          {/* Status flow */}
          <div className="flex gap-1">
            {KANBAN_COLUMNS.map((col) => (
              <button
                key={col.status}
                onClick={() => onMove(task.id, col.status)}
                className={`px-1.5 py-0.5 rounded text-[0.55rem] border ${
                  task.status === col.status
                    ? "bg-sky-600/20 border-sky-600/30 text-sky-400"
                    : "border-[var(--ide-border-dim)] text-slate-600 hover:text-slate-400"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>

          {/* Subtasks */}
          {totalSubs > 0 && (
            <div className="space-y-0.5">
              {task.subtasks!.map((sub) => (
                <div key={sub.id} className="flex items-center gap-1.5 pl-1">
                  <button
                    onClick={() => onToggleSubTask(task.id, sub.id)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                      sub.isCompleted
                        ? "bg-emerald-500/20 border-emerald-500/30"
                        : "border-[var(--ide-border-mid)]"
                    }`}
                  >
                    {sub.isCompleted && (
                      <Check className="w-2 h-2 text-emerald-400" />
                    )}
                  </button>
                  <span
                    className={`text-[0.65rem] ${sub.isCompleted ? "text-slate-600 line-through" : "text-slate-400"}`}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add subtask */}
          <div className="flex gap-1">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddSubTask(task.id);
              }}
              placeholder="Add subtask..."
              className="flex-1 px-1.5 py-0.5 rounded-md bg-[var(--ide-bg)] border border-[var(--ide-border-dim)] text-[0.62rem] text-slate-400 placeholder:text-slate-700 outline-none"
            />
            <button
              onClick={() => onAddSubTask(task.id)}
              className="px-1.5 py-0.5 rounded text-[0.62rem] text-slate-600 hover:text-sky-400"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 pt-1 border-t border-[var(--ide-border-faint)]">
            {task.relatedFiles?.map((f) => (
              <span
                key={f}
                className="text-[0.5rem] text-slate-700 font-mono truncate max-w-[80px]"
              >
                {f.split("/").pop()}
              </span>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => onArchive(task.id)}
              className="p-1 rounded hover:bg-white/5"
              title="Archive"
            >
              <Archive className="w-2.5 h-2.5 text-slate-600" />
            </button>
            <button
              onClick={() => onRemove(task.id)}
              className="p-1 rounded hover:bg-red-500/10"
              title="Delete"
            >
              <Trash2 className="w-2.5 h-2.5 text-red-400/60" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
