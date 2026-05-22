/**
 * @file __tests__/useTaskBoardStore.test.ts
 * @description TaskBoardStore 单元测试 — 覆盖任务 CRUD、状态流转、子任务、
 *              AI Inference 接受/拒绝/清空、优先级、筛选排序、提醒系统
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,zustand,task-board,kanban
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useTaskBoardStore,
  type TaskInference,
} from "../stores/useTaskBoardStore";

// Helper: reset store
function resetStore() {
  useTaskBoardStore.setState({
    tasks: [],
    reminders: [],
    pendingInferences: [],
    filters: {},
    sortField: "priority",
    sortAsc: true,
    boardView: "kanban",
    selectedTaskId: null,
  });
}

// Helper: create a sample task via store
function addSampleTask(overrides?: Record<string, any>) {
  return useTaskBoardStore.getState().addTask({
    title: "Sample Task",
    description: "A test task",
    status: "todo",
    priority: "medium",
    type: "feature",
    isArchived: false,
    source: "manual",
    ...overrides,
  });
}

describe("useTaskBoardStore", () => {
  beforeEach(resetStore);

  // ── Task CRUD ──

  describe("Task CRUD", () => {
    it("addTask 返回唯一 ID", () => {
      const id = addSampleTask();
      expect(id).toMatch(/^task-/);
      expect(useTaskBoardStore.getState().tasks.length).toBe(1);
    });

    it("addTask 设置 createdAt 和 updatedAt", () => {
      const before = Date.now();
      addSampleTask();
      const task = useTaskBoardStore.getState().tasks[0];
      expect(task.createdAt).toBeGreaterThanOrEqual(before);
      expect(task.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it("updateTask 更新指定字段", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().updateTask(id, { title: "Updated Title" });
      const task = useTaskBoardStore.getState().tasks.find((t) => t.id === id);
      expect(task!.title).toBe("Updated Title");
    });

    it("updateTask 更新 updatedAt", () => {
      const id = addSampleTask();
      const initialUpdatedAt = useTaskBoardStore.getState().tasks[0].updatedAt;
      // Small delay to ensure different timestamp
      useTaskBoardStore.getState().updateTask(id, { title: "Changed" });
      const newUpdatedAt = useTaskBoardStore.getState().tasks[0].updatedAt;
      expect(newUpdatedAt).toBeGreaterThanOrEqual(initialUpdatedAt);
    });

    it("removeTask 删除任务及其 reminders", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().addReminder({
        taskId: id,
        type: "deadline",
        message: "Due soon",
        remindAt: Date.now() + 100000,
      });
      expect(useTaskBoardStore.getState().reminders.length).toBe(1);

      useTaskBoardStore.getState().removeTask(id);
      expect(useTaskBoardStore.getState().tasks.length).toBe(0);
      expect(useTaskBoardStore.getState().reminders.length).toBe(0);
    });

    it("archiveTask 标记为已归档", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().archiveTask(id);
      expect(useTaskBoardStore.getState().tasks[0].isArchived).toBe(true);
    });
  });

  // ── Status Flow ──

  describe("Status Flow", () => {
    it("moveTask 更改状态", () => {
      const id = addSampleTask({ status: "todo" });
      useTaskBoardStore.getState().moveTask(id, "in-progress");
      expect(useTaskBoardStore.getState().tasks[0].status).toBe("in-progress");
    });

    it("moveTask 更新 updatedAt", () => {
      const id = addSampleTask();
      const old = useTaskBoardStore.getState().tasks[0].updatedAt;
      useTaskBoardStore.getState().moveTask(id, "done");
      expect(
        useTaskBoardStore.getState().tasks[0].updatedAt,
      ).toBeGreaterThanOrEqual(old);
    });
  });

  // ── SubTasks ──

  describe("SubTasks", () => {
    it("addSubTask 添加子任务", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().addSubTask(id, "子任务一");
      const subtasks = useTaskBoardStore.getState().tasks[0].subtasks;
      expect(subtasks).toHaveLength(1);
      expect(subtasks![0].title).toBe("子任务一");
      expect(subtasks![0].isCompleted).toBe(false);
    });

    it("toggleSubTask 切换完成状态", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().addSubTask(id, "子任务");
      const subId = useTaskBoardStore.getState().tasks[0].subtasks![0].id;

      useTaskBoardStore.getState().toggleSubTask(id, subId);
      expect(
        useTaskBoardStore.getState().tasks[0].subtasks![0].isCompleted,
      ).toBe(true);

      useTaskBoardStore.getState().toggleSubTask(id, subId);
      expect(
        useTaskBoardStore.getState().tasks[0].subtasks![0].isCompleted,
      ).toBe(false);
    });

    it("removeSubTask 删除子任务", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().addSubTask(id, "子任务");
      const subId = useTaskBoardStore.getState().tasks[0].subtasks![0].id;

      useTaskBoardStore.getState().removeSubTask(id, subId);
      expect(useTaskBoardStore.getState().tasks[0].subtasks).toHaveLength(0);
    });
  });

  // ── Priority ──

  describe("Priority", () => {
    it("setPriority 更改优先级", () => {
      const id = addSampleTask({ priority: "low" });
      useTaskBoardStore.getState().setPriority(id, "critical");
      expect(useTaskBoardStore.getState().tasks[0].priority).toBe("critical");
    });
  });

  // ── AI Inferences ──

  describe("AI Inferences", () => {
    const sampleInference: TaskInference = {
      task: {
        title: "AI 推荐任务",
        description: "自动提取的任务",
        status: "todo",
        priority: "medium",
        type: "feature",
        tags: ["ai-inferred"],
      },
      confidence: 0.75,
      reasoning: "匹配 TODO 模式",
      context: "用户问了关于性能的问题",
    };

    it("addInferences 添加到 pendingInferences", () => {
      useTaskBoardStore.getState().addInferences([sampleInference]);
      expect(useTaskBoardStore.getState().pendingInferences).toHaveLength(1);
      expect(useTaskBoardStore.getState().pendingInferences[0].confidence).toBe(
        0.75,
      );
    });

    it("addInferences 追加而非覆盖", () => {
      useTaskBoardStore.getState().addInferences([sampleInference]);
      useTaskBoardStore
        .getState()
        .addInferences([{ ...sampleInference, confidence: 0.9 }]);
      expect(useTaskBoardStore.getState().pendingInferences).toHaveLength(2);
    });

    it("acceptInference 转为正式任务并从 pending 移除", () => {
      useTaskBoardStore.getState().addInferences([sampleInference]);
      useTaskBoardStore.getState().acceptInference(0);

      expect(useTaskBoardStore.getState().pendingInferences).toHaveLength(0);
      expect(useTaskBoardStore.getState().tasks).toHaveLength(1);
      const task = useTaskBoardStore.getState().tasks[0];
      expect(task.title).toBe("AI 推荐任务");
      expect(task.source).toBe("ai-inferred");
      expect(task.confidence).toBe(0.75);
    });

    it("acceptInference 无效 index 不报错", () => {
      expect(() =>
        useTaskBoardStore.getState().acceptInference(99),
      ).not.toThrow();
      expect(useTaskBoardStore.getState().tasks).toHaveLength(0);
    });

    it("dismissInference 从 pending 移除但不创建任务", () => {
      useTaskBoardStore.getState().addInferences([sampleInference]);
      useTaskBoardStore.getState().dismissInference(0);

      expect(useTaskBoardStore.getState().pendingInferences).toHaveLength(0);
      expect(useTaskBoardStore.getState().tasks).toHaveLength(0);
    });

    it("clearInferences 清空所有 pending", () => {
      useTaskBoardStore
        .getState()
        .addInferences([sampleInference, sampleInference]);
      useTaskBoardStore.getState().clearInferences();
      expect(useTaskBoardStore.getState().pendingInferences).toHaveLength(0);
    });
  });

  // ── Filters & Sort ──

  describe("Filters & Sort", () => {
    it("getTasksByStatus 按状态过滤（排除归档）", () => {
      addSampleTask({ status: "todo" });
      addSampleTask({ status: "todo", isArchived: true });
      addSampleTask({ status: "done" });

      const todos = useTaskBoardStore.getState().getTasksByStatus("todo");
      expect(todos).toHaveLength(1);
    });

    it("getFilteredTasks 按 status 筛选", () => {
      addSampleTask({ status: "todo" });
      addSampleTask({ status: "in-progress" });

      useTaskBoardStore.getState().setFilters({ status: ["todo"] });
      const filtered = useTaskBoardStore.getState().getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe("todo");
    });

    it("getFilteredTasks 按 priority 筛选", () => {
      addSampleTask({ priority: "high" });
      addSampleTask({ priority: "low" });

      useTaskBoardStore.getState().setFilters({ priority: ["high"] });
      const filtered = useTaskBoardStore.getState().getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe("high");
    });

    it("getFilteredTasks 按 searchQuery 搜索", () => {
      addSampleTask({ title: "Fix login bug" });
      addSampleTask({ title: "Add dashboard feature" });

      useTaskBoardStore.getState().setFilters({ searchQuery: "login" });
      const filtered = useTaskBoardStore.getState().getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toContain("login");
    });

    it("getFilteredTasks 按 priority 排序", () => {
      addSampleTask({ priority: "low", title: "Low" });
      addSampleTask({ priority: "critical", title: "Critical" });
      addSampleTask({ priority: "high", title: "High" });

      useTaskBoardStore.getState().setSortField("priority");
      const sorted = useTaskBoardStore.getState().getFilteredTasks();
      expect(sorted[0].priority).toBe("critical");
      expect(sorted[1].priority).toBe("high");
      expect(sorted[2].priority).toBe("low");
    });

    it("toggleSortOrder 反转排序", () => {
      expect(useTaskBoardStore.getState().sortAsc).toBe(true);
      useTaskBoardStore.getState().toggleSortOrder();
      expect(useTaskBoardStore.getState().sortAsc).toBe(false);
    });
  });

  // ── Reminders ──

  describe("Reminders", () => {
    it("addReminder 创建提醒", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().addReminder({
        taskId: id,
        type: "deadline",
        message: "Due tomorrow",
        remindAt: Date.now() + 86400000,
      });
      const reminders = useTaskBoardStore.getState().reminders;
      expect(reminders).toHaveLength(1);
      expect(reminders[0].isTriggered).toBe(false);
      expect(reminders[0].isRead).toBe(false);
    });

    it("triggerReminder 标记为已触发", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().addReminder({
        taskId: id,
        type: "deadline",
        message: "Due",
        remindAt: Date.now(),
      });
      const remId = useTaskBoardStore.getState().reminders[0].id;
      useTaskBoardStore.getState().triggerReminder(remId);
      expect(useTaskBoardStore.getState().reminders[0].isTriggered).toBe(true);
    });

    it("getUnreadReminders 返回已触发未读", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().addReminder({
        taskId: id,
        type: "deadline",
        message: "Due",
        remindAt: Date.now(),
      });
      const remId = useTaskBoardStore.getState().reminders[0].id;
      useTaskBoardStore.getState().triggerReminder(remId);

      expect(useTaskBoardStore.getState().getUnreadReminders()).toHaveLength(1);

      useTaskBoardStore.getState().markReminderRead(remId);
      expect(useTaskBoardStore.getState().getUnreadReminders()).toHaveLength(0);
    });
  });

  // ── View ──

  describe("View", () => {
    it("setBoardView 切换视图", () => {
      useTaskBoardStore.getState().setBoardView("list");
      expect(useTaskBoardStore.getState().boardView).toBe("list");
    });

    it("setSelectedTask 设置选中任务", () => {
      const id = addSampleTask();
      useTaskBoardStore.getState().setSelectedTask(id);
      expect(useTaskBoardStore.getState().selectedTaskId).toBe(id);
    });
  });

  // ── getOverdueTasks ──

  describe("getOverdueTasks", () => {
    it("返回过期且未完成的任务", () => {
      addSampleTask({ dueDate: Date.now() - 100000, status: "todo" });
      addSampleTask({ dueDate: Date.now() + 100000, status: "todo" });
      addSampleTask({ dueDate: Date.now() - 100000, status: "done" });

      const overdue = useTaskBoardStore.getState().getOverdueTasks();
      expect(overdue).toHaveLength(1);
    });
  });
});
