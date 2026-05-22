import type { MCPServerDefinition, MCPTool } from "../types/index.js";

const BRAVE_SEARCH_TOOLS: MCPTool[] = [
  {
    name: "brave_web_search",
    description: "使用 Brave Search API 搜索网页",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索关键词" },
        count: { type: "string", description: "返回结果数量，默认10" },
        offset: { type: "string", description: "分页偏移量" },
      },
      required: ["query"],
    },
  },
  {
    name: "brave_local_search",
    description: "使用 Brave Search 搜索本地商家和地点",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "本地搜索关键词" },
        count: { type: "string", description: "返回结果数量" },
      },
      required: ["query"],
    },
  },
];

const GITHUB_TOOLS: MCPTool[] = [
  {
    name: "github_search_repos",
    description: "搜索 GitHub 仓库",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索关键词" },
        maxResults: { type: "string", description: "最大返回数量" },
      },
      required: ["query"],
    },
  },
  {
    name: "github_get_file_contents",
    description: "获取仓库文件内容",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "仓库所有者" },
        repo: { type: "string", description: "仓库名称" },
        path: { type: "string", description: "文件路径" },
        branch: { type: "string", description: "分支名" },
      },
      required: ["owner", "repo", "path"],
    },
  },
  {
    name: "github_create_issue",
    description: "创建 GitHub Issue",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "仓库所有者" },
        repo: { type: "string", description: "仓库名称" },
        title: { type: "string", description: "Issue 标题" },
        body: { type: "string", description: "Issue 内容" },
      },
      required: ["owner", "repo", "title"],
    },
  },
  {
    name: "github_list_issues",
    description: "列出仓库的 Issues",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "仓库所有者" },
        repo: { type: "string", description: "仓库名称" },
        state: { type: "string", description: "Issue 状态", enum: ["open", "closed", "all"] },
      },
      required: ["owner", "repo"],
    },
  },
];

const FILESYSTEM_TOOLS: MCPTool[] = [
  {
    name: "read_file",
    description: "读取文件内容",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径" },
        encoding: { type: "string", description: "编码方式", enum: ["utf-8", "base64", "latin1"] },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "写入文件内容",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径" },
        content: { type: "string", description: "文件内容" },
        createDirs: { type: "string", description: "是否创建父目录" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_directory",
    description: "列出目录内容",
    inputSchema: {
      type: "object",
      properties: {
        dirPath: { type: "string", description: "目录路径" },
        recursive: { type: "string", description: "是否递归" },
      },
      required: ["dirPath"],
    },
  },
  {
    name: "search_files",
    description: "搜索文件",
    inputSchema: {
      type: "object",
      properties: {
        rootDir: { type: "string", description: "搜索根目录" },
        query: { type: "string", description: "搜索关键词" },
      },
      required: ["rootDir", "query"],
    },
  },
];

const DOCKER_TOOLS: MCPTool[] = [
  {
    name: "docker_list_containers",
    description: "列出 Docker 容器",
    inputSchema: {
      type: "object",
      properties: {
        all: { type: "string", description: "是否包括停止的容器" },
        filter: { type: "string", description: "过滤条件" },
      },
      required: [],
    },
  },
  {
    name: "docker_run_container",
    description: "运行 Docker 容器",
    inputSchema: {
      type: "object",
      properties: {
        image: { type: "string", description: "镜像名称" },
        name: { type: "string", description: "容器名称" },
        ports: { type: "string", description: "端口映射" },
      },
      required: ["image"],
    },
  },
  {
    name: "docker_build_image",
    description: "构建 Docker 镜像",
    inputSchema: {
      type: "object",
      properties: {
        dockerfile: { type: "string", description: "Dockerfile 路径" },
        tag: { type: "string", description: "镜像标签" },
      },
      required: ["dockerfile"],
    },
  },
];

const POSTGRESQL_TOOLS: MCPTool[] = [
  {
    name: "postgres_query",
    description: "执行 PostgreSQL 查询",
    inputSchema: {
      type: "object",
      properties: {
        sql: { type: "string", description: "SQL 查询语句" },
        params: { type: "string", description: "查询参数（JSON 数组）" },
      },
      required: ["sql"],
    },
  },
  {
    name: "postgres_list_tables",
    description: "列出数据库中的表",
    inputSchema: {
      type: "object",
      properties: {
        schema: { type: "string", description: "Schema 名称，默认 public" },
      },
      required: [],
    },
  },
  {
    name: "postgres_describe_table",
    description: "查看表结构",
    inputSchema: {
      type: "object",
      properties: {
        tableName: { type: "string", description: "表名" },
        schema: { type: "string", description: "Schema 名称" },
      },
      required: ["tableName"],
    },
  },
];

const CLAUDE_PROMPTS_TOOLS: MCPTool[] = [
  {
    name: "claude_get_prompt",
    description: "获取 Claude 提示词模板",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "提示词分类" },
        name: { type: "string", description: "提示词名称" },
      },
      required: ["category", "name"],
    },
  },
  {
    name: "claude_list_prompts",
    description: "列出所有可用的 Claude 提示词",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "按分类过滤" },
      },
      required: [],
    },
  },
];

const YYC3CN_TOOLS: MCPTool[] = [
  {
    name: "yyc3cn_code_review",
    description: "YYC³ 中文代码审查",
    inputSchema: {
      type: "object",
      properties: {
        codePath: { type: "string", description: "代码文件路径" },
        language: { type: "string", description: "编程语言", enum: ["typescript", "python", "java", "swift", "kotlin", "javascript"] },
        focus: { type: "string", description: "审查重点", enum: ["ai_integration", "performance", "security", "chinese_nlp", "mobile_optimization"] },
      },
      required: ["codePath"],
    },
  },
  {
    name: "yyc3cn_ai_prompt_optimizer",
    description: "YYC³ AI 提示词优化器",
    inputSchema: {
      type: "object",
      properties: {
        promptText: { type: "string", description: "原始提示词" },
        context: { type: "string", description: "使用场景" },
        goal: { type: "string", description: "优化目标", enum: ["accuracy", "response_speed", "user_experience", "chinese_understanding", "domain_specific"] },
      },
      required: ["promptText"],
    },
  },
];

export const SERVER_DEFINITIONS: MCPServerDefinition[] = [
  {
    id: "brave-search",
    name: "Brave Search",
    description: "使用 Brave Search API 进行网页搜索和本地搜索",
    version: "1.0.0",
    tools: BRAVE_SEARCH_TOOLS,
    configTemplate: {
      name: "brave-search",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      enabled: true,
      priority: 1,
    },
    category: "search",
  },
  {
    id: "github",
    name: "GitHub",
    description: "GitHub 仓库管理 — 搜索仓库、文件操作、Issue/PR 管理",
    version: "1.0.0",
    tools: GITHUB_TOOLS,
    configTemplate: {
      name: "github",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      enabled: true,
      priority: 2,
    },
    category: "code",
  },
  {
    id: "filesystem",
    name: "Filesystem",
    description: "文件系统操作 — 读写文件、目录管理、文件搜索",
    version: "1.0.0",
    tools: FILESYSTEM_TOOLS,
    configTemplate: {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem"],
      enabled: true,
      priority: 3,
    },
    category: "filesystem",
  },
  {
    id: "docker",
    name: "Docker",
    description: "Docker 容器管理 — 列表、运行、构建、日志查看",
    version: "1.0.0",
    tools: DOCKER_TOOLS,
    configTemplate: {
      name: "docker",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-docker"],
      enabled: true,
      priority: 4,
    },
    category: "container",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "PostgreSQL 数据库操作 — 查询、表管理、结构查看",
    version: "1.0.0",
    tools: POSTGRESQL_TOOLS,
    configTemplate: {
      name: "postgresql",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      enabled: true,
      priority: 5,
    },
    category: "database",
  },
  {
    id: "claude-prompts",
    name: "Claude Prompts",
    description: "Claude 提示词模板库 — 获取和列出提示词",
    version: "1.0.0",
    tools: CLAUDE_PROMPTS_TOOLS,
    configTemplate: {
      name: "claude-prompts",
      command: "npx",
      args: ["-y", "@anthropic/mcp-server-claude-prompts"],
      enabled: true,
      priority: 6,
    },
    category: "ai",
  },
  {
    id: "yyc3cn-assistant",
    name: "YYC³ CN Assistant",
    description: "YYC³ 中文 AI 助手 — 代码审查、提示词优化、组件生成",
    version: "1.0.0",
    tools: YYC3CN_TOOLS,
    configTemplate: {
      name: "yyc3cn-assistant",
      command: "npx",
      args: ["-y", "@yyc3/mcp-server-cn-assistant"],
      enabled: true,
      priority: 7,
    },
    category: "ai",
  },
];

export function getServerDefinition(id: string): MCPServerDefinition | undefined {
  return SERVER_DEFINITIONS.find((s) => s.id === id);
}

export function getServersByCategory(category: MCPServerDefinition["category"]): MCPServerDefinition[] {
  return SERVER_DEFINITIONS.filter((s) => s.category === category);
}

export function getAllTools(): MCPTool[] {
  return SERVER_DEFINITIONS.flatMap((s) => s.tools);
}

export function getToolByName(toolName: string): MCPTool | undefined {
  for (const server of SERVER_DEFINITIONS) {
    const tool = server.tools.find((t) => t.name === toolName);
    if (tool) return tool;
  }
  return undefined;
}
