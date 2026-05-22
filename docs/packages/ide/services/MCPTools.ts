/**
 * @file MCPTools.ts
 * @description MCP 工具集成 - 封装常用 MCP 工具调用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags mcp,tools,integration
 */

import type { MCPClient } from "./MCPClient";

/**
 * 文件操作工具
 */
export class FileSystemTools {
  constructor(private client: MCPClient) {}

  /**
   * 读取文件
   */
  async readFile(path: string): Promise<string> {
    const result = await this.client.callTool("read_file", { path });
    if (result.success) {
      return result.data.content;
    }
    throw new Error(result.error);
  }

  /**
   * 写入文件
   */
  async writeFile(path: string, content: string): Promise<void> {
    const result = await this.client.callTool("write_file", { path, content });
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * 列出目录
   */
  async listDirectory(path: string): Promise<string[]> {
    const result = await this.client.callTool("list_directory", { path });
    if (result.success) {
      return result.data.files;
    }
    throw new Error(result.error);
  }

  /**
   * 创建目录
   */
  async createDirectory(path: string): Promise<void> {
    const result = await this.client.callTool("create_directory", { path });
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(path: string): Promise<void> {
    const result = await this.client.callTool("delete_file", { path });
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * 重命名文件
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const result = await this.client.callTool("rename_file", {
      oldPath,
      newPath,
    });
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * 搜索文件
   */
  async searchFiles(path: string, pattern: string): Promise<string[]> {
    const result = await this.client.callTool("search_files", { path, pattern });
    if (result.success) {
      return result.data.files;
    }
    throw new Error(result.error);
  }
}

/**
 * Git 操作工具
 */
export class GitTools {
  constructor(private client: MCPClient) {}

  /**
   * 获取 Git 状态
   */
  async status(): Promise<{
    staged: string[];
    unstaged: string[];
    untracked: string[];
  }> {
    const result = await this.client.callTool("git_status", {});
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }

  /**
   * Git Diff
   */
  async diff(file?: string): Promise<string> {
    const result = await this.client.callTool("git_diff", { file });
    if (result.success) {
      return result.data.diff;
    }
    throw new Error(result.error);
  }

  /**
   * Git Commit
   */
  async commit(message: string): Promise<string> {
    const result = await this.client.callTool("git_commit", { message });
    if (result.success) {
      return result.data.hash;
    }
    throw new Error(result.error);
  }

  /**
   * Git Push
   */
  async push(): Promise<void> {
    const result = await this.client.callTool("git_push", {});
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Git Pull
   */
  async pull(): Promise<void> {
    const result = await this.client.callTool("git_pull", {});
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Git Log
   */
  async log(limit: number = 10): Promise<Array<{
    hash: string;
    message: string;
    author: string;
    date: string;
  }>> {
    const result = await this.client.callTool("git_log", { limit });
    if (result.success) {
      return result.data.commits;
    }
    throw new Error(result.error);
  }

  /**
   * Git Branch
   */
  async branch(): Promise<{
    current: string;
    branches: string[];
  }> {
    const result = await this.client.callTool("git_branch", {});
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }
}

/**
 * 数据库操作工具
 */
export class DatabaseTools {
  constructor(private client: MCPClient) {}

  /**
   * 查询
   */
  async query(sql: string): Promise<any[]> {
    const result = await this.client.callTool("query", { sql });
    if (result.success) {
      return result.data.rows;
    }
    throw new Error(result.error);
  }

  /**
   * 列出表
   */
  async listTables(): Promise<string[]> {
    const result = await this.client.callTool("list_tables", {});
    if (result.success) {
      return result.data.tables;
    }
    throw new Error(result.error);
  }

  /**
   * 描述表
   */
  async describeTable(table: string): Promise<Array<{
    column: string;
    type: string;
    nullable: boolean;
  }>> {
    const result = await this.client.callTool("describe_table", { table });
    if (result.success) {
      return result.data.columns;
    }
    throw new Error(result.error);
  }

  /**
   * 插入
   */
  async insert(table: string, data: Record<string, any>): Promise<void> {
    const result = await this.client.callTool("insert", { table, data });
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * 更新
   */
  async update(
    table: string,
    data: Record<string, any>,
    where: string
  ): Promise<void> {
    const result = await this.client.callTool("update", { table, data, where });
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * 删除
   */
  async delete(table: string, where: string): Promise<void> {
    const result = await this.client.callTool("delete", { table, where });
    if (!result.success) {
      throw new Error(result.error);
    }
  }
}

/**
 * 记忆管理工具
 */
export class MemoryTools {
  constructor(private client: MCPClient) {}

  /**
   * 创建记忆
   */
  async createMemory(content: string, tags?: string[]): Promise<string> {
    const result = await this.client.callTool("create_memory", { content, tags });
    if (result.success) {
      return result.data.id;
    }
    throw new Error(result.error);
  }

  /**
   * 搜索记忆
   */
  async searchMemories(query: string, limit: number = 10): Promise<Array<{
    id: string;
    content: string;
    tags: string[];
    createdAt: number;
  }>> {
    const result = await this.client.callTool("search_memories", { query, limit });
    if (result.success) {
      return result.data.memories;
    }
    throw new Error(result.error);
  }

  /**
   * 删除记忆
   */
  async deleteMemory(id: string): Promise<void> {
    const result = await this.client.callTool("delete_memory", { id });
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * 更新记忆
   */
  async updateMemory(id: string, content: string): Promise<void> {
    const result = await this.client.callTool("update_memory", { id, content });
    if (!result.success) {
      throw new Error(result.error);
    }
  }
}

/**
 * MCP 工具管理器
 */
export class MCPToolManager {
  public fs: FileSystemTools;
  public git: GitTools;
  public db: DatabaseTools;
  public memory: MemoryTools;

  constructor(private client: MCPClient) {
    this.fs = new FileSystemTools(client);
    this.git = new GitTools(client);
    this.db = new DatabaseTools(client);
    this.memory = new MemoryTools(client);
  }

  /**
   * 列出所有可用工具
   */
  listAvailableTools(): Array<{ name: string; description: string }> {
    const tools = this.client.listTools();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
  }
}

export default MCPToolManager;
