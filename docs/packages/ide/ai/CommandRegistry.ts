/**
 * @file ai/CommandRegistry.ts
 * @description 可扩展的终端命令系统，内置 19 个文件系统命令（ls, cat, pwd 等）
 *              和 4 个模拟命令（npm, git, node, tsc）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags terminal,commands,filesystem,simulation
 */

// ===================================================================
//  CommandRegistry — 可扩展的终端命令系统
//  内置命令: ls, cat, pwd, echo, clear, help, tree, find, grep,
//            touch, mkdir, rm, mv, cp, wc, head, tail, date, whoami
//  模拟命令: npm, git, node, tsc (输出模拟结果)
// ===================================================================

// ── 类型 ──

export interface CommandOutput {
  type: "output" | "error" | "success" | "info" | "warning";
  text: string;
}

export interface CommandContext {
  // 当前工作目录
  cwd: string;
  // 文件系统访问
  fileContents: Record<string, string>;
  // 文件操作
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  updateFile: (path: string, content: string) => void;
  // 打开文件
  openFile: (path: string) => void;
  // 环境变量
  env: Record<string, string>;
  // Git 状态
  gitBranch: string;
  gitChanges: { path: string; status: string; staged: boolean }[];
}

export interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[], ctx: CommandContext) => CommandOutput[];
}

// ── 命令注册表 ──

const commands = new Map<string, CommandDefinition>();

export function registerCommand(cmd: CommandDefinition): void {
  commands.set(cmd.name, cmd);
}

export function getCommand(name: string): CommandDefinition | undefined {
  return commands.get(name);
}

export function getAllCommands(): CommandDefinition[] {
  return [...commands.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCommandNames(): string[] {
  return [...commands.keys()].sort();
}

// ── 执行命令 ──

export function executeCommand(
  input: string,
  ctx: CommandContext,
): CommandOutput[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // 支持 && 连接多条命令
  if (trimmed.includes(" && ")) {
    const cmds = trimmed
      .split(" && ")
      .map((s) => s.trim())
      .filter(Boolean);
    const allOutput: CommandOutput[] = [];
    for (const cmd of cmds) {
      const out = executeSingle(cmd, ctx);
      allOutput.push(...out);
      // 如果有错误，停止后续命令
      if (out.some((o) => o.type === "error")) break;
    }
    return allOutput;
  }

  return executeSingle(trimmed, ctx);
}

function executeSingle(input: string, ctx: CommandContext): CommandOutput[] {
  const parts = parseCommandLine(input);
  if (parts.length === 0) return [];

  const cmdName = parts[0];
  const args = parts.slice(1);

  const cmd = commands.get(cmdName);
  if (!cmd) {
    return [
      {
        type: "error",
        text: `yyc3: command not found: ${cmdName}\n提示: 输入 'help' 查看可用命令`,
      },
    ];
  }

  try {
    return cmd.handler(args, ctx);
  } catch (err) {
    return [
      {
        type: "error",
        text: `${cmdName}: ${err instanceof Error ? err.message : String(err)}`,
      },
    ];
  }
}

// ── 命令行解析 (支持引号) ──

function parseCommandLine(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === " " || ch === "\t") {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }

  if (current) parts.push(current);
  return parts;
}

// ── Tab 补全 ──

export function getCompletions(partial: string, ctx: CommandContext): string[] {
  const parts = parseCommandLine(partial);

  if (parts.length <= 1) {
    // 补全命令名
    const prefix = parts[0] || "";
    return getCommandNames().filter((n) => n.startsWith(prefix));
  }

  // 补全文件路径
  const lastPart = parts[parts.length - 1];
  return getPathCompletions(lastPart, ctx);
}

function getPathCompletions(partial: string, ctx: CommandContext): string[] {
  const allPaths = Object.keys(ctx.fileContents);
  if (!partial) return allPaths.slice(0, 20);

  return allPaths
    .filter((p) => p.startsWith(partial) || p.includes(`/${  partial}`))
    .slice(0, 20);
}

// ===================================================================
//  内置命令注册
// ===================================================================

// ── help ──
registerCommand({
  name: "help",
  description: "显示可用命令列表",
  usage: "help [command]",
  handler: (args) => {
    if (args.length > 0) {
      const cmd = commands.get(args[0]);
      if (cmd) {
        return [
          { type: "info", text: `${cmd.name} — ${cmd.description}` },
          { type: "output", text: `用法: ${cmd.usage}` },
        ];
      }
      return [{ type: "error", text: `未知命令: ${args[0]}` }];
    }

    const cmds = getAllCommands();
    const lines = cmds.map((c) => `  ${c.name.padEnd(12)} ${c.description}`);
    return [
      { type: "info", text: "YYC³ 终端 — 可用命令:" },
      { type: "output", text: lines.join("\n") },
      { type: "info", text: "\n输入 'help <命令>' 查看详细用法" },
    ];
  },
});

// ── clear ──
registerCommand({
  name: "clear",
  description: "清空终端",
  usage: "clear",
  handler: () => [{ type: "output", text: "__CLEAR__" }],
});

// ── pwd ──
registerCommand({
  name: "pwd",
  description: "显示当前工作目录",
  usage: "pwd",
  handler: (_args, ctx) => [{ type: "output", text: ctx.cwd || "/project" }],
});

// ── ls ──
registerCommand({
  name: "ls",
  description: "列出目录内容",
  usage: "ls [path] [-a] [-l]",
  handler: (args, ctx) => {
    const showAll =
      args.includes("-a") || args.includes("-la") || args.includes("-al");
    const showLong =
      args.includes("-l") || args.includes("-la") || args.includes("-al");
    const pathArg = args.find((a) => !a.startsWith("-")) || "";

    const allPaths = Object.keys(ctx.fileContents).sort();
    const prefix = pathArg ? `${pathArg.replace(/\/$/, "")  }/` : "";

    // Get items at this directory level
    const items = new Set<string>();
    for (const p of allPaths) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      const firstPart = rest.split("/")[0];
      if (firstPart) items.add(firstPart);
    }

    if (items.size === 0) {
      return [
        {
          type: "error",
          text: `ls: cannot access '${pathArg}': No such file or directory`,
        },
      ];
    }

    const sorted = [...items].sort();

    if (showLong) {
      const lines = sorted.map((item) => {
        const fullPath = prefix + item;
        const isDir = allPaths.some((p) => p.startsWith(`${fullPath  }/`));
        const size = ctx.fileContents[fullPath]?.length ?? 0;
        const type = isDir ? "d" : "-";
        return `${type}rw-r--r--  1 user  ${String(size).padStart(6)}  ${item}${isDir ? "/" : ""}`;
      });
      return [{ type: "output", text: lines.join("\n") }];
    }

    // Colorized short format
    const formatted = sorted.map((item) => {
      const fullPath = prefix + item;
      const isDir = allPaths.some((p) => p.startsWith(`${fullPath  }/`));
      return isDir ? `${item}/` : item;
    });

    // Format in columns
    return [{ type: "output", text: formatted.join("  ") }];
  },
});

// ── cat ──
registerCommand({
  name: "cat",
  description: "显示文件内容",
  usage: "cat <file>",
  handler: (args, ctx) => {
    if (args.length === 0) {
      return [{ type: "error", text: "cat: missing file operand" }];
    }
    const content = ctx.fileContents[args[0]];
    if (content === undefined) {
      return [
        { type: "error", text: `cat: ${args[0]}: No such file or directory` },
      ];
    }
    return [{ type: "output", text: content }];
  },
});

// ── head ──
registerCommand({
  name: "head",
  description: "显示文件前 N 行",
  usage: "head [-n N] <file>",
  handler: (args, ctx) => {
    let n = 10;
    let file = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-n" && i + 1 < args.length) {
        n = parseInt(args[++i], 10) || 10;
      } else {
        file = args[i];
      }
    }
    if (!file) return [{ type: "error", text: "head: missing file operand" }];
    const content = ctx.fileContents[file];
    if (content === undefined) {
      return [
        { type: "error", text: `head: ${file}: No such file or directory` },
      ];
    }
    return [
      { type: "output", text: content.split("\n").slice(0, n).join("\n") },
    ];
  },
});

// ── tail ──
registerCommand({
  name: "tail",
  description: "显示文件后 N 行",
  usage: "tail [-n N] <file>",
  handler: (args, ctx) => {
    let n = 10;
    let file = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-n" && i + 1 < args.length) {
        n = parseInt(args[++i], 10) || 10;
      } else {
        file = args[i];
      }
    }
    if (!file) return [{ type: "error", text: "tail: missing file operand" }];
    const content = ctx.fileContents[file];
    if (content === undefined) {
      return [
        { type: "error", text: `tail: ${file}: No such file or directory` },
      ];
    }
    const lines = content.split("\n");
    return [{ type: "output", text: lines.slice(-n).join("\n") }];
  },
});

// ── wc ──
registerCommand({
  name: "wc",
  description: "统计文件行数/字数/字节数",
  usage: "wc [-l|-w|-c] <file>",
  handler: (args, ctx) => {
    const file = args.find((a) => !a.startsWith("-"));
    if (!file) return [{ type: "error", text: "wc: missing file operand" }];
    const content = ctx.fileContents[file];
    if (content === undefined) {
      return [
        { type: "error", text: `wc: ${file}: No such file or directory` },
      ];
    }
    const lines = content.split("\n").length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const bytes = new Blob([content]).size;

    if (args.includes("-l"))
      return [{ type: "output", text: `${lines} ${file}` }];
    if (args.includes("-w"))
      return [{ type: "output", text: `${words} ${file}` }];
    if (args.includes("-c"))
      return [{ type: "output", text: `${bytes} ${file}` }];

    return [{ type: "output", text: `  ${lines}  ${words}  ${bytes} ${file}` }];
  },
});

// ── grep ──
registerCommand({
  name: "grep",
  description: "搜索文件内容",
  usage: "grep <pattern> <file|*>",
  handler: (args, ctx) => {
    if (args.length < 2) {
      return [{ type: "error", text: "grep: usage: grep <pattern> <file|*>" }];
    }
    const pattern = args[0];
    const target = args[1];
    const caseInsensitive = args.includes("-i");
    const regex = new RegExp(pattern, caseInsensitive ? "i" : "");

    const results: string[] = [];

    if (target === "*" || target === "**") {
      // Search all files
      for (const [path, content] of Object.entries(ctx.fileContents)) {
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            results.push(`${path}:${i + 1}: ${lines[i].trim()}`);
          }
        }
      }
    } else {
      const content = ctx.fileContents[target];
      if (content === undefined) {
        return [
          { type: "error", text: `grep: ${target}: No such file or directory` },
        ];
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push(`${i + 1}: ${lines[i]}`);
        }
      }
    }

    if (results.length === 0) {
      return [{ type: "output", text: "(no matches)" }];
    }

    return [{ type: "output", text: results.slice(0, 50).join("\n") }];
  },
});

// ── find ──
registerCommand({
  name: "find",
  description: "查找文件",
  usage: "find [pattern]",
  handler: (args, ctx) => {
    const pattern = args[0];
    let paths = Object.keys(ctx.fileContents).sort();

    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"), "i");
      paths = paths.filter((p) => regex.test(p));
    }

    if (paths.length === 0) {
      return [{ type: "output", text: "(no files found)" }];
    }

    return [{ type: "output", text: paths.join("\n") }];
  },
});

// ── tree ──
registerCommand({
  name: "tree",
  description: "以树形结构显示目录",
  usage: "tree [path]",
  handler: (args, ctx) => {
    const prefix = args[0] ? `${args[0].replace(/\/$/, "")  }/` : "";
    const allPaths = Object.keys(ctx.fileContents)
      .filter((p) => p.startsWith(prefix))
      .map((p) => p.slice(prefix.length))
      .sort();

    if (allPaths.length === 0) {
      return [{ type: "output", text: ".\n0 directories, 0 files" }];
    }

    // Build tree
    const lines = [`.${  prefix ? ` (${prefix.slice(0, -1)})` : ""}`];
    const tree: Record<string, any> = {};

    for (const p of allPaths) {
      const parts = p.split("/");
      let node = tree;
      for (const part of parts) {
        if (!node[part]) node[part] = {};
        node = node[part];
      }
    }

    let fileCount = 0;
    let dirCount = 0;

    function render(
      node: Record<string, any>,
      indent: string,
      isLast: boolean,
    ) {
      const keys = Object.keys(node).sort();
      keys.forEach((key, i) => {
        const last = i === keys.length - 1;
        const connector = last ? "└── " : "├── ";
        const childIndent = indent + (last ? "    " : "│   ");

        const children = Object.keys(node[key]);
        if (children.length > 0) {
          dirCount++;
          lines.push(`${indent + connector + key  }/`);
          render(node[key], childIndent, last);
        } else {
          fileCount++;
          lines.push(indent + connector + key);
        }
      });
    }

    render(tree, "", true);
    lines.push(`\n${dirCount} directories, ${fileCount} files`);

    return [{ type: "output", text: lines.join("\n") }];
  },
});

// ── touch ──
registerCommand({
  name: "touch",
  description: "创建新文件",
  usage: "touch <file>",
  handler: (args, ctx) => {
    if (args.length === 0) {
      return [{ type: "error", text: "touch: missing file operand" }];
    }
    const path = args[0];
    if (ctx.fileContents[path] !== undefined) {
      return [{ type: "info", text: `文件已存在: ${path}` }];
    }
    ctx.createFile(path, "");
    return [{ type: "success", text: `已创建: ${path}` }];
  },
});

// ── mkdir ──
registerCommand({
  name: "mkdir",
  description: "创建目录 (通过创建 .gitkeep)",
  usage: "mkdir <directory>",
  handler: (args, ctx) => {
    if (args.length === 0) {
      return [{ type: "error", text: "mkdir: missing operand" }];
    }
    const dir = args[0].replace(/\/$/, "");
    ctx.createFile(`${dir}/.gitkeep`, "");
    return [{ type: "success", text: `已创建目录: ${dir}/` }];
  },
});

// ── rm ──
registerCommand({
  name: "rm",
  description: "删除文件",
  usage: "rm <file>",
  handler: (args, ctx) => {
    if (args.length === 0) {
      return [{ type: "error", text: "rm: missing operand" }];
    }
    const path = args[0];
    if (ctx.fileContents[path] === undefined) {
      return [
        {
          type: "error",
          text: `rm: cannot remove '${path}': No such file or directory`,
        },
      ];
    }
    ctx.deleteFile(path);
    return [{ type: "success", text: `已删除: ${path}` }];
  },
});

// ── mv ──
registerCommand({
  name: "mv",
  description: "移动/重命名文件",
  usage: "mv <source> <destination>",
  handler: (args, ctx) => {
    if (args.length < 2) {
      return [{ type: "error", text: "mv: missing destination operand" }];
    }
    const [src, dest] = args;
    if (ctx.fileContents[src] === undefined) {
      return [
        {
          type: "error",
          text: `mv: cannot stat '${src}': No such file or directory`,
        },
      ];
    }
    ctx.renameFile(src, dest);
    return [{ type: "success", text: `'${src}' -> '${dest}'` }];
  },
});

// ── cp ──
registerCommand({
  name: "cp",
  description: "复制文件",
  usage: "cp <source> <destination>",
  handler: (args, ctx) => {
    if (args.length < 2) {
      return [{ type: "error", text: "cp: missing destination operand" }];
    }
    const [src, dest] = args;
    const content = ctx.fileContents[src];
    if (content === undefined) {
      return [
        {
          type: "error",
          text: `cp: cannot stat '${src}': No such file or directory`,
        },
      ];
    }
    ctx.createFile(dest, content);
    return [{ type: "success", text: `'${src}' -> '${dest}'` }];
  },
});

// ── echo ──
registerCommand({
  name: "echo",
  description: "输出文本",
  usage: "echo <text>",
  handler: (args) => [{ type: "output", text: args.join(" ") }],
});

// ── date ──
registerCommand({
  name: "date",
  description: "显示当前日期时间",
  usage: "date",
  handler: () => [{ type: "output", text: new Date().toLocaleString("zh-CN") }],
});

// ── whoami ──
registerCommand({
  name: "whoami",
  description: "显示当前用户",
  usage: "whoami",
  handler: () => [{ type: "output", text: "yyc3-user" }],
});

// ── open ──
registerCommand({
  name: "open",
  description: "在编辑器中打开文件",
  usage: "open <file>",
  handler: (args, ctx) => {
    if (args.length === 0) {
      return [{ type: "error", text: "open: missing file operand" }];
    }
    const path = args[0];
    if (ctx.fileContents[path] === undefined) {
      return [
        { type: "error", text: `open: ${path}: No such file or directory` },
      ];
    }
    ctx.openFile(path);
    return [{ type: "success", text: `已在编辑器中打开: ${path}` }];
  },
});

// ── env ──
registerCommand({
  name: "env",
  description: "显示环境变量",
  usage: "env",
  handler: (_args, ctx) => {
    const lines = Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`);
    return [{ type: "output", text: lines.join("\n") }];
  },
});

// ── git (模拟) ──
registerCommand({
  name: "git",
  description: "Git 版本控制 (模拟)",
  usage: "git <subcommand>",
  handler: (args, ctx) => {
    if (args.length === 0) {
      return [
        {
          type: "output",
          text: "usage: git <command> [<args>]\n\n常用命令: status, log, branch, diff",
        },
      ];
    }
    const sub = args[0];
    switch (sub) {
      case "status": {
        const lines = [`On branch ${ctx.gitBranch}\n`];
        const staged = ctx.gitChanges.filter((c) => c.staged);
        const unstaged = ctx.gitChanges.filter((c) => !c.staged);
        if (staged.length > 0) {
          lines.push("Changes to be committed:");
          staged.forEach((c) =>
            lines.push(`  ${c.status.padEnd(12)} ${c.path}`),
          );
          lines.push("");
        }
        if (unstaged.length > 0) {
          lines.push("Changes not staged for commit:");
          unstaged.forEach((c) =>
            lines.push(`  ${c.status.padEnd(12)} ${c.path}`),
          );
        }
        if (staged.length === 0 && unstaged.length === 0) {
          lines.push("nothing to commit, working tree clean");
        }
        return [{ type: "output", text: lines.join("\n") }];
      }
      case "branch":
        return [
          { type: "output", text: `* ${ctx.gitBranch}\n  main\n  develop` },
        ];
      case "log":
        return [
          {
            type: "output",
            text: `commit abc1234 (HEAD -> ${ctx.gitBranch})\nAuthor: YYC³ User <user@yyc3.ai>\nDate:   ${new Date().toLocaleString("zh-CN")}\n\n    Latest changes`,
          },
        ];
      case "diff":
        return [
          { type: "info", text: `${ctx.gitChanges.length} 个文件有变更` },
        ];
      default:
        return [
          { type: "warning", text: `git ${sub}: 该子命令在模拟模式下不可用` },
        ];
    }
  },
});

// ── npm (模拟) ──
registerCommand({
  name: "npm",
  description: "npm 包管理器 (模拟)",
  usage: "npm <command>",
  handler: (args) => {
    if (args.length === 0) {
      return [
        {
          type: "output",
          text: "npm <command>\n\n常用命令: install, run, list, init",
        },
      ];
    }
    const sub = args[0];
    switch (sub) {
      case "install":
      case "i":
        return [
          { type: "output", text: "⠋ Installing dependencies..." },
          {
            type: "success",
            text: "added 342 packages in 8.2s\n\n156 packages are looking for funding\n  run `npm fund` for details",
          },
        ];
      case "run":
        if (args[1] === "dev") {
          return [
            { type: "output", text: "> vite\n" },
            {
              type: "success",
              text: "  VITE v6.3.5  ready in 412 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: http://192.168.1.100:5173/",
            },
          ];
        }
        if (args[1] === "build") {
          return [
            { type: "output", text: "> tsc && vite build\n" },
            {
              type: "success",
              text: "✓ 42 modules transformed.\ndist/index.html           0.42 kB\ndist/assets/index-abc.js  156.2 kB │ gzip: 48.3 kB\ndist/assets/index-abc.css  12.1 kB │ gzip:  3.2 kB\n✓ built in 2.14s",
            },
          ];
        }
        if (args[1] === "test") {
          return [
            { type: "output", text: "> vitest run\n" },
            {
              type: "success",
              text: " ✓ __tests__/useThemeTokens.test.tsx (5 tests)\n ✓ __tests__/LLMService.test.ts (3 tests)\n\n Test Files  2 passed (2)\n      Tests  8 passed (8)\n   Duration  1.24s",
            },
          ];
        }
        return [
          {
            type: "warning",
            text: `npm run ${args[1] || ""}: script not found`,
          },
        ];
      case "list":
      case "ls":
        return [
          {
            type: "output",
            text: "├── react@18.3.1\n├── react-dom@18.3.1\n├── typescript@5.5.0\n├── vite@6.3.5\n├── tailwindcss@4.1.12\n└── zustand@5.0.11",
          },
        ];
      default:
        return [
          { type: "warning", text: `npm ${sub}: 该子命令在模拟模式下不可用` },
        ];
    }
  },
});

// ── node (模拟) ──
registerCommand({
  name: "node",
  description: "Node.js 运行时 (模拟)",
  usage: "node [-v] [file]",
  handler: (args) => {
    if (args.includes("-v") || args.includes("--version")) {
      return [{ type: "output", text: "v20.11.0" }];
    }
    return [
      {
        type: "warning",
        text: "Node.js REPL 在浏览器环境中不可用\n提示: 使用 AI 助手运行和测试代码",
      },
    ];
  },
});

// ── tsc (模拟) ──
registerCommand({
  name: "tsc",
  description: "TypeScript 编译器 (模拟)",
  usage: "tsc [--noEmit] [--version]",
  handler: (args) => {
    if (args.includes("--version")) {
      return [{ type: "output", text: "Version 5.5.4" }];
    }
    return [
      { type: "output", text: "Checking TypeScript types..." },
      { type: "success", text: "✓ No errors found." },
    ];
  },
});

// ── export (别名) ──
registerCommand({
  name: "export",
  description: "导出项目为 ZIP",
  usage: "export [--json]",
  handler: (args) => {
    if (args.includes("--json")) {
      return [{ type: "info", text: "请使用工具栏的导出按钮导出为 JSON 格式" }];
    }
    return [
      {
        type: "info",
        text: "请使用工具栏的导出按钮导出项目\n或使用 Ctrl+Shift+E 快捷键",
      },
    ];
  },
});

// ── about ──
registerCommand({
  name: "about",
  description: "显示系统信息",
  usage: "about",
  handler: () => [
    { type: "info", text: "╔══════════════════════════════════════════╗" },
    { type: "info", text: "║   YYC³ Family AI 智能编程助手 v1.0       ║" },
    { type: "info", text: "║   言传千行代码 | 语枢万物智能             ║" },
    { type: "info", text: "╚══════════════════════════════════════════╝" },
    { type: "output", text: "\nReact 18.3 + TypeScript + Tailwind CSS 4" },
    { type: "output", text: "6 LLM Providers | Multi-panel DnD IDE" },
    { type: "output", text: `Build: ${new Date().toISOString().slice(0, 10)}` },
  ],
});
