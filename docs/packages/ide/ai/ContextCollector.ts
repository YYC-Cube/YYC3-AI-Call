/**
 * @file ai/ContextCollector.ts
 * @description 收集项目上下文供 LLM 使用，从 FileStore 中提取文件树、活跃文件、
 *              打开标签页、最近编辑等信息
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,context,file-tree,project-analysis
 */

export interface ProjectContext {
  // 文件树结构 (缩略)
  fileTree: string;
  // 当前活跃文件的路径和内容
  activeFile: { path: string; content: string } | null;
  // 打开的标签页列表
  openTabs: string[];
  // 已修改但未保存的文件
  modifiedFiles: string[];
  // 项目文件总数
  totalFiles: number;
  // 所有文件路径列表
  allFilePaths: string[];
  // 指定文件的内容 (按需)
  selectedFilesContent: Record<string, string>;
  // Git 状态摘要
  gitSummary: {
    branch: string;
    changedFiles: number;
    stagedFiles: number;
  };
}

export interface ContextCollectorInput {
  fileContents: Record<string, string>;
  activeFile: string;
  openTabs: { path: string; modified: boolean }[];
  gitBranch: string;
  gitChanges: { path: string; status: string; staged: boolean }[];
}

// ── 收集项目上下文 ──

export function collectContext(input: ContextCollectorInput): ProjectContext {
  const { fileContents, activeFile, openTabs, gitBranch, gitChanges } = input;

  const allPaths = Object.keys(fileContents).sort();
  const modifiedFiles = openTabs.filter((t) => t.modified).map((t) => t.path);

  // 构建文件树的文本表示
  const fileTree = buildFileTreeText(allPaths);

  // 活跃文件内容
  const activeFileCtx =
    activeFile && fileContents[activeFile]
      ? { path: activeFile, content: fileContents[activeFile] }
      : null;

  // 收集打开标签页的文件内容 (最多 5 个，避免 token 爆炸)
  const selectedFilesContent: Record<string, string> = {};
  const tabPaths = openTabs.map((t) => t.path).slice(0, 5);
  for (const p of tabPaths) {
    if (fileContents[p] && p !== activeFile) {
      // 截断大文件
      const content = fileContents[p];
      selectedFilesContent[p] =
        content.length > 3000
          ? `${content.slice(0, 3000)
            }\n// ... (truncated, ${
            content.length
            } chars total)`
          : content;
    }
  }

  return {
    fileTree,
    activeFile: activeFileCtx,
    openTabs: tabPaths,
    modifiedFiles,
    totalFiles: allPaths.length,
    allFilePaths: allPaths,
    selectedFilesContent,
    gitSummary: {
      branch: gitBranch,
      changedFiles: gitChanges.length,
      stagedFiles: gitChanges.filter((c) => c.staged).length,
    },
  };
}

// ── 构建文件树文本 ──

function buildFileTreeText(paths: string[]): string {
  if (paths.length === 0) return "(empty project)";

  // Group by top-level directory
  const tree = new Map<string, string[]>();
  for (const p of paths) {
    const parts = p.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    if (!tree.has(dir)) tree.set(dir, []);
    tree.get(dir)!.push(parts[parts.length - 1]);
  }

  const lines: string[] = [];
  const sortedDirs = [...tree.keys()].sort();
  for (const dir of sortedDirs) {
    lines.push(`📁 ${dir}/`);
    const files = tree.get(dir)!.sort();
    for (const f of files) {
      lines.push(`   ${getFileIcon(f)} ${f}`);
    }
  }

  return lines.join("\n");
}

function getFileIcon(filename: string): string {
  if (filename.endsWith(".tsx") || filename.endsWith(".jsx")) return "⚛️";
  if (filename.endsWith(".ts") || filename.endsWith(".js")) return "📄";
  if (filename.endsWith(".css") || filename.endsWith(".scss")) return "🎨";
  if (filename.endsWith(".json")) return "📋";
  if (filename.endsWith(".md")) return "📝";
  if (filename.endsWith(".html")) return "🌐";
  return "📄";
}

// ── 估算 token 数 (粗略) ──

export function estimateTokens(text: string): number {
  // 粗略估算: 英文 ~4 chars/token, 中文 ~2 chars/token
  return Math.ceil(text.length / 3.5);
}

// ── 压缩上下文以适应 token 限制 ──

export function compressContext(
  ctx: ProjectContext,
  maxTokens: number = 8000,
): string {
  const parts: string[] = [];

  // 1. 文件树 (始终包含)
  parts.push(`## 项目文件结构\n\`\`\`\n${  ctx.fileTree  }\n\`\`\``);

  // 2. 活跃文件 (始终包含, 优先级最高 — 增强上限至 8000 chars)
  if (ctx.activeFile) {
    const truncated =
      ctx.activeFile.content.length > 8000
        ? `${ctx.activeFile.content.slice(0, 8000)
          }\n// ... (truncated, ${
          ctx.activeFile.content.length
          } chars total)`
        : ctx.activeFile.content;
    const ext = ctx.activeFile.path.split(".").pop() || "";
    const langMap: Record<string, string> = {
      tsx: "tsx",
      ts: "typescript",
      jsx: "jsx",
      js: "javascript",
      css: "css",
      json: "json",
      md: "markdown",
      html: "html",
    };
    const lang = langMap[ext] || ext;
    parts.push(
      `## 当前编辑文件: ${ctx.activeFile.path}\n\`\`\`${lang}\n${truncated}\n\`\`\``,
    );
  }

  // 3. Git 状态
  parts.push(
    `## Git 状态\n- 分支: ${ctx.gitSummary.branch}\n- 已修改: ${ctx.gitSummary.changedFiles} 个文件\n- 已暂存: ${ctx.gitSummary.stagedFiles} 个文件`,
  );

  // 4. 打开标签 (摘要)
  if (ctx.openTabs.length > 0) {
    parts.push(
      `## 打开的文件\n${ctx.openTabs.map((t) => `- ${t}`).join("\n")}`,
    );
  }

  // 5. 如果还有余量，附加相关文件内容
  const currentText = parts.join("\n\n");
  let currentTokens = estimateTokens(currentText);

  if (currentTokens < maxTokens * 0.7) {
    for (const [path, content] of Object.entries(ctx.selectedFilesContent)) {
      const addition = `\n\n## 相关文件: ${path}\n\`\`\`\n${content}\n\`\`\``;
      const addTokens = estimateTokens(addition);
      if (currentTokens + addTokens < maxTokens) {
        parts.push(addition.trim());
        currentTokens += addTokens;
      }
    }
  }

  return parts.join("\n\n");
}
