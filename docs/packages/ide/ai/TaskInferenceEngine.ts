/**
 * @file ai/TaskInferenceEngine.ts
 * @description AI 响应任务推理引擎 — 从 AI 响应文本中基于关键词模式匹配提取候选任务，
 *              支持 6 种模式（TODO/BUG/重构/测试/文档/列表项），最多提取 5 个任务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,task-inference,pattern-matching,heuristic
 */

import type {
  TaskInference,
  TaskType,
  TaskPriority,
} from "../stores/useTaskBoardStore";

// ── Pattern Definitions ──

export interface TaskPattern {
  regex: RegExp;
  type: TaskType;
  priority: TaskPriority;
  confidenceBase: number;
}

export const TASK_PATTERNS: TaskPattern[] = [
  {
    regex: /(?:TODO|待办|需要|应该|建议)[:：]\s*(.+)/gi,
    type: "feature",
    priority: "medium",
    confidenceBase: 0.7,
  },
  {
    regex: /(?:BUG|修复|bug|错误|问题)[:：]\s*(.+)/gi,
    type: "bug",
    priority: "high",
    confidenceBase: 0.8,
  },
  {
    regex: /(?:重构|refactor|优化)[:：]\s*(.+)/gi,
    type: "refactor",
    priority: "medium",
    confidenceBase: 0.65,
  },
  {
    regex: /(?:测试|test|单测|覆盖率)[:：]\s*(.+)/gi,
    type: "test",
    priority: "medium",
    confidenceBase: 0.6,
  },
  {
    regex: /(?:文档|document|注释|JSDoc)[:：]\s*(.+)/gi,
    type: "documentation",
    priority: "low",
    confidenceBase: 0.55,
  },
  {
    regex: /(?:1\.|2\.|3\.|①|②|③|-\s)\s*(.{10,80})/gm,
    type: "feature",
    priority: "medium",
    confidenceBase: 0.5,
  },
];

/** Code-like line filter — skip lines that look like source code */
const CODE_LINE_RE =
  /^(import |export |const |let |var |function |class |interface |type |\/\/|{|}|\(|\))/;

/** Maximum number of inferred tasks per response */
export const MAX_INFERRED_TASKS = 5;

/** Minimum AI response length to attempt inference */
export const MIN_RESPONSE_LENGTH = 30;

/**
 * Extract potential tasks from an AI response using keyword pattern matching.
 * Runs synchronously — no LLM call needed. Best-effort, never throws.
 *
 * @param aiResponse  Full AI response text
 * @param userPrompt  The user's original question
 * @param messageId   Chat message ID for traceability
 * @returns Array of TaskInference (max 5)
 */
export function extractTasksFromResponse(
  aiResponse: string,
  userPrompt: string,
  messageId: string,
): TaskInference[] {
  if (aiResponse.length < MIN_RESPONSE_LENGTH) return [];

  const results: TaskInference[] = [];
  const seen = new Set<string>();

  for (const pattern of TASK_PATTERNS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = re.exec(aiResponse)) !== null) {
      const title = match[1]?.trim();
      if (
        !title ||
        title.length < 5 ||
        title.length > 120 ||
        seen.has(title.toLowerCase())
      )
        continue;
      seen.add(title.toLowerCase());

      // Skip code-like lines
      if (CODE_LINE_RE.test(title)) continue;

      results.push({
        task: {
          title,
          description: `从 AI 响应中自动提取。用户提问: ${userPrompt.slice(0, 80)}`,
          status: "todo",
          priority: pattern.priority,
          type: pattern.type,
          relatedMessageId: messageId,
          tags: ["ai-inferred"],
        },
        confidence: pattern.confidenceBase,
        reasoning: `匹配模式: ${pattern.regex.source.slice(0, 30)}`,
        context: userPrompt.slice(0, 200),
      });

      if (results.length >= MAX_INFERRED_TASKS) break;
    }
    if (results.length >= MAX_INFERRED_TASKS) break;
  }

  return results;
}
