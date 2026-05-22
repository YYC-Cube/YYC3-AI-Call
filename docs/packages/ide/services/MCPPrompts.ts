/**
 * @file MCPPrompts.ts
 * @description MCP 提示词模板 - 管理 MCP 提示词模板和调用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags mcp,prompts,templates
 */

import type { MCPClient, MCPPrompt } from "./MCPClient";
import { createLogger } from "../utils/logger";
const log = createLogger("MCPPrompts");

export interface PromptTemplate {
  name: string;
  description: string;
  arguments: Record<string, string>;
}

export interface PromptMessage {
  role: "user" | "assistant" | "system";
  content: {
    type: "text" | "image";
    text?: string;
    data?: string;
    mimeType?: string;
  };
}

/**
 * MCP 提示词管理器
 */
export class MCPPromptManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor(private client: MCPClient) {
    this.loadBuiltInTemplates();
  }

  /**
   * 加载内置模板
   */
  private loadBuiltInTemplates(): void {
    // 代码审查模板
    this.templates.set("code-review", {
      name: "code-review",
      description: "代码审查提示词",
      arguments: {
        code: "要审查的代码",
        language: "编程语言",
        focus: "审查重点 (性能/安全/可读性)",
      },
    });

    // 代码生成模板
    this.templates.set("code-generation", {
      name: "code-generation",
      description: "代码生成提示词",
      arguments: {
        description: "功能描述",
        language: "编程语言",
        framework: "框架",
        requirements: "要求列表 (逗号分隔)",
      },
    });

    // 代码解释模板
    this.templates.set("code-explanation", {
      name: "code-explanation",
      description: "代码解释提示词",
      arguments: {
        code: "要解释的代码",
        language: "编程语言",
        level: "解释深度 (入门/中级/高级)",
      },
    });

    // Bug 修复模板
    this.templates.set("bug-fix", {
      name: "bug-fix",
      description: "Bug 修复提示词",
      arguments: {
        code: "问题代码",
        error: "错误信息",
        expected: "期望行为",
        actual: "实际行为",
      },
    });

    // 测试生成模板
    this.templates.set("test-generation", {
      name: "test-generation",
      description: "测试生成提示词",
      arguments: {
        code: "要测试的代码",
        framework: "测试框架",
        coverage: "覆盖范围 (单元/集成/E2E)",
      },
    });

    // 文档生成模板
    this.templates.set("documentation", {
      name: "documentation",
      description: "文档生成提示词",
      arguments: {
        code: "代码",
        type: "文档类型 (API/使用指南/README)",
        language: "文档语言",
      },
    });

    // 重构建议模板
    this.templates.set("refactoring", {
      name: "refactoring",
      description: "重构建议提示词",
      arguments: {
        code: "要重构的代码",
        goals: "重构目标 (性能/可读性/可维护性)",
        constraints: "约束条件",
      },
    });

    // 性能优化模板
    this.templates.set("performance-optimization", {
      name: "performance-optimization",
      description: "性能优化提示词",
      arguments: {
        code: "代码",
        bottleneck: "性能瓶颈",
        metrics: "性能指标",
      },
    });

    log.info(`Loaded ${this.templates.size} built-in templates`);
  }

  /**
   * 获取提示词
   */
  async getPrompt(name: string, args?: Record<string, string>): Promise<PromptMessage[]> {
    const result = await this.client.getPrompt(name, args);
    return result.messages;
  }

  /**
   * 列出所有提示词
   */
  listPrompts(): MCPPrompt[] {
    return this.client.listPrompts();
  }

  /**
   * 列出模板
   */
  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 获取模板
   */
  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * 添加自定义模板
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
    log.info(`Added template: ${template.name}`);
  }

  /**
   * 删除模板
   */
  removeTemplate(name: string): void {
    this.templates.delete(name);
    log.info(`Removed template: ${name}`);
  }

  /**
   * 使用模板生成提示词
   */
  async useTemplate(
    templateName: string,
    args: Record<string, string>
  ): Promise<PromptMessage[]> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // 验证必需参数
    const mcpprompt = this.client.getPromptByName(templateName);
    if (mcpprompt?.arguments) {
      for (const arg of mcpprompt.arguments) {
        if (arg.required && !args[arg.name]) {
          throw new Error(`Missing required argument: ${arg.name}`);
        }
      }
    }

    return await this.getPrompt(templateName, args);
  }

  /**
   * 导出模板
   */
  exportTemplate(name: string): string | null {
    const template = this.templates.get(name);
    if (!template) {
      return null;
    }

    return JSON.stringify(template, null, 2);
  }

  /**
   * 导入模板
   */
  importTemplate(json: string): boolean {
    try {
      const template = JSON.parse(json) as PromptTemplate;
      if (!template.name || !template.description) {
        throw new Error("Invalid template format");
      }
      this.templates.set(template.name, template);
      return true;
    } catch (error) {
      log.error("Import failed:", error);
      return false;
    }
  }

  /**
   * 批量导出模板
   */
  exportAllTemplates(): string {
    const templates = Array.from(this.templates.values());
    return JSON.stringify(templates, null, 2);
  }

  /**
   * 批量导入模板
   */
  importAllTemplates(json: string): number {
    try {
      const templates = JSON.parse(json) as PromptTemplate[];
      let count = 0;
      for (const template of templates) {
        if (template.name && template.description) {
          this.templates.set(template.name, template);
          count++;
        }
      }
      return count;
    } catch (error) {
      log.error("Batch import failed:", error);
      return 0;
    }
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取提示词历史
   */
  async getPromptHistory(limit: number = 10): Promise<Array<{
    name: string;
    arguments: Record<string, string>;
    timestamp: number;
  }>> {
    // 从本地存储获取历史
    const historyKey = "mcp_prompt_history";
    const historyRaw = localStorage.getItem(historyKey);
    if (!historyRaw) {
      return [];
    }

    const history = JSON.parse(historyRaw);
    return history.slice(-limit);
  }

  /**
   * 保存提示词历史
   */
  private savePromptHistory(
    name: string,
    arguments: Record<string, string>
  ): void {
    const historyKey = "mcp_prompt_history";
    const historyRaw = localStorage.getItem(historyKey);
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    history.push({
      name,
      arguments,
      timestamp: Date.now(),
    });

    // 保留最近 100 条
    if (history.length > 100) {
      history.shift();
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  /**
   * 清除提示词历史
   */
  clearPromptHistory(): void {
    localStorage.removeItem("mcp_prompt_history");
    log.info("Prompt history cleared");
  }
}

export default MCPPromptManager;
