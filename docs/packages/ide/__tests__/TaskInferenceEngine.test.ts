/**
 * @file __tests__/TaskInferenceEngine.test.ts
 * @description TaskInferenceEngine 单元测试 — 覆盖 6 种模式匹配、边界条件、
 *              代码行过滤、去重、上限控制、空输入处理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,task-inference,ai,pattern-matching
 */

import { describe, it, expect } from "vitest";
import {
  extractTasksFromResponse,
  TASK_PATTERNS,
  MAX_INFERRED_TASKS,
  MIN_RESPONSE_LENGTH,
} from "../ai/TaskInferenceEngine";

describe("TaskInferenceEngine", () => {
  const MSG_ID = "test-msg-001";
  const USER_PROMPT = "请帮我优化这个组件的性能";

  // ── 空输入 / 短输入 ──

  describe("短输入处理", () => {
    it("空字符串返回空数组", () => {
      expect(extractTasksFromResponse("", USER_PROMPT, MSG_ID)).toEqual([]);
    });

    it("长度 < MIN_RESPONSE_LENGTH 返回空数组", () => {
      const short = "a".repeat(MIN_RESPONSE_LENGTH - 1);
      expect(extractTasksFromResponse(short, USER_PROMPT, MSG_ID)).toEqual([]);
    });

    it("恰好等于 MIN_RESPONSE_LENGTH 但无匹配也返回空", () => {
      const noMatch = "这是一段没有任何关键词的普通文本。".repeat(5);
      expect(extractTasksFromResponse(noMatch, USER_PROMPT, MSG_ID)).toEqual(
        [],
      );
    });
  });

  // ── TODO / 待办 模式 ──

  describe("TODO / 待办模式", () => {
    it('匹配 "TODO: ..." 格式', () => {
      const response =
        "这是一段较长的 AI 回复内容，包含以下建议。TODO: 添加单元测试覆盖核心模块的边界情况处理逻辑";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
      const todoTask = tasks.find((t) => t.task.type === "feature");
      expect(todoTask).toBeDefined();
      expect(todoTask!.confidence).toBe(0.7);
      expect(todoTask!.task.status).toBe("todo");
      expect(todoTask!.task.tags).toContain("ai-inferred");
    });

    it('匹配 "建议：..." 格式（中文冒号）', () => {
      const response =
        "分析完成，以下是我的看法。建议：重构组件的状态管理逻辑以提升可维护性，减少不必要的重渲染";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });

    it('匹配 "需要: ..." 格式', () => {
      const response =
        "根据代码审查结果来看整体结构不错。需要: 补充输入验证逻辑防止 XSS 攻击，这是安全最佳实践";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── BUG / 修复模式 ──

  describe("BUG / 修复模式", () => {
    it('匹配 "BUG: ..." 格式', () => {
      const response =
        "经过分析发现了几个问题需要修复处理。BUG: useEffect 缺少依赖项导致闭包陈旧，状态更新不生效";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      const bugTask = tasks.find((t) => t.task.type === "bug");
      expect(bugTask).toBeDefined();
      expect(bugTask!.task.priority).toBe("high");
      expect(bugTask!.confidence).toBe(0.8);
    });

    it('匹配 "修复：..." 格式', () => {
      const response =
        "代码中存在以下已知问题需要处理修正。修复：内存泄漏问题需要在组件卸载时清理定时器和事件监听器";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.some((t) => t.task.type === "bug")).toBe(true);
    });
  });

  // ── 重构模式 ──

  describe("重构模式", () => {
    it('匹配 "重构: ..." 格式', () => {
      const response =
        "这段代码可以进一步改进提升代码质量。重构: 将大型组件拆分为多个子组件以提升代码可读性和可测试性";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      const refactorTask = tasks.find((t) => t.task.type === "refactor");
      expect(refactorTask).toBeDefined();
      expect(refactorTask!.confidence).toBe(0.65);
    });

    it('匹配 "refactor: ..." 格式', () => {
      const response =
        "代码审查建议如下方面可以改进优化。refactor: extract common logic into shared utility functions for better reuse";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.some((t) => t.task.type === "refactor")).toBe(true);
    });
  });

  // ── 测试模式 ──

  describe("测试模式", () => {
    it('匹配 "测试: ..." 格式', () => {
      const response =
        "以下是代码审查报告和改进建议汇总。测试: 为 useTaskBoardStore 添加状态流转的边界条件测试用例覆盖";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.some((t) => t.task.type === "test")).toBe(true);
    });
  });

  // ── 文档模式 ──

  describe("文档模式", () => {
    it('匹配 "文档: ..." 格式', () => {
      const response =
        "项目整体质量良好，以下几个方面可改进。文档: 为公共 API 添加完整的 JSDoc 注释和使用示例代码";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      const docTask = tasks.find((t) => t.task.type === "documentation");
      expect(docTask).toBeDefined();
      expect(docTask!.task.priority).toBe("low");
    });
  });

  // ── 列表项模式 ──

  describe("列表项模式", () => {
    it('匹配 "1. ..." 编号列表', () => {
      const response = `以下是需要完成的工作清单和任务计划：
1. 添加用户认证模块的双因素验证功能支持
2. 优化数据库查询性能减少慢查询次数
3. 完善错误处理和日志记录系统的功能覆盖`;
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('匹配 "- ..." 破折号列表', () => {
      const response = `项目待办事项列表和改进计划如下所示：
- 重构登录流程以支持第三方 OAuth 认证
- 添加响应式设计以支持移动端和平板访问`;
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 代码行过滤 ──

  describe("代码行过滤", () => {
    it("过滤 import 语句", () => {
      const response = `需要: import React from 'react' 这个导入是必须的不能删除
建议: export default function App() {} 这个导出方式
需要: const value = computed() 这个常量声明
需要: 添加完整的错误处理和用户友好的提示信息`;
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      // 只应匹配最后一条非代码行
      const codeTasks = tasks.filter(
        (t) =>
          t.task.title.startsWith("import ") ||
          t.task.title.startsWith("export ") ||
          t.task.title.startsWith("const "),
      );
      expect(codeTasks.length).toBe(0);
    });
  });

  // ── 去重 ──

  describe("去重逻辑", () => {
    it("相同 title 只保留第一个", () => {
      const response = `TODO: 添加输入验证逻辑防止恶意数据注入
建议: 添加输入验证逻辑防止恶意数据注入
需要: 添加输入验证逻辑防止恶意数据注入`;
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      const titles = tasks.map((t) => t.task.title.toLowerCase());
      const unique = new Set(titles);
      expect(titles.length).toBe(unique.size);
    });
  });

  // ── 上限控制 ──

  describe("上限控制 (MAX_INFERRED_TASKS)", () => {
    it(`最多返回 ${MAX_INFERRED_TASKS} 个任务`, () => {
      const lines = Array.from(
        { length: 20 },
        (_, i) => `${i + 1}. 完成第 ${i + 1} 个功能模块的开发和测试工作`,
      ).join("\n");
      const response = `以下是需要完成的全部工作任务清单：\n${lines}`;
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.length).toBeLessThanOrEqual(MAX_INFERRED_TASKS);
    });
  });

  // ── Title 长度过滤 ──

  describe("title 长度边界", () => {
    it("title < 5 字符被过滤", () => {
      const response = "这是一段足够长的 AI 响应文本用于测试。TODO: abcd";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      const shortTasks = tasks.filter((t) => t.task.title.length < 5);
      expect(shortTasks.length).toBe(0);
    });

    it("title > 120 字符被过滤", () => {
      const longTitle = "a".repeat(121);
      const response = `这是一段足够长的 AI 响应文本用于测试。TODO: ${longTitle}`;
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      const longTasks = tasks.filter((t) => t.task.title.length > 120);
      expect(longTasks.length).toBe(0);
    });
  });

  // ── 输出格式验证 ──

  describe("输出格式", () => {
    it("每个 task 包含必要字段", () => {
      const response =
        "根据分析结果建议如下改进方案。TODO: 为关键组件添加错误边界处理以防止白屏崩溃问题";
      const tasks = extractTasksFromResponse(response, USER_PROMPT, MSG_ID);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
      const t = tasks[0];
      expect(t.task.title).toBeTruthy();
      expect(t.task.status).toBe("todo");
      expect(t.task.relatedMessageId).toBe(MSG_ID);
      expect(t.task.tags).toContain("ai-inferred");
      expect(t.confidence).toBeGreaterThan(0);
      expect(t.confidence).toBeLessThanOrEqual(1);
      expect(t.reasoning).toBeTruthy();
      expect(t.context).toBeTruthy();
    });

    it("context 截断为 200 字符", () => {
      const longPrompt = "测试".repeat(200);
      const response =
        "根据分析结果建议如下改进方案。TODO: 为关键组件添加错误边界处理以防止白屏崩溃问题";
      const tasks = extractTasksFromResponse(response, longPrompt, MSG_ID);
      if (tasks.length > 0) {
        expect(tasks[0].context.length).toBeLessThanOrEqual(200);
      }
    });
  });

  // ── TASK_PATTERNS 结构验证 ──

  describe("TASK_PATTERNS 结构", () => {
    it("所有 pattern 都有有效的 regex、type、priority、confidenceBase", () => {
      for (const p of TASK_PATTERNS) {
        expect(p.regex).toBeInstanceOf(RegExp);
        expect([
          "feature",
          "bug",
          "refactor",
          "test",
          "documentation",
          "other",
        ]).toContain(p.type);
        expect(["critical", "high", "medium", "low"]).toContain(p.priority);
        expect(p.confidenceBase).toBeGreaterThan(0);
        expect(p.confidenceBase).toBeLessThanOrEqual(1);
      }
    });
  });
});
