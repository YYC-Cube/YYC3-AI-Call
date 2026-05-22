/**
 * @file ai/CodeApplicator.ts
 * @description 解析 LLM 响应并应用代码到文件系统，支持单文件/多文件、创建/更新、diff 预览
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,code-applicator,diff,file-system
 */

// ===================================================================
//  CodeApplicator — 解析 LLM 响应并应用代码到文件系统
//  支持: 单文件/多文件、创建/更新、diff 预览
// ===================================================================

// ── 类型定义 ──

export interface ParsedCodeBlock {
  filepath: string; // 目标文件路径
  language: string; // 语言标识 (tsx, ts, css, json, etc.)
  content: string; // 完整文件内容
  isNew: boolean; // 是否为新文件 (在 FileStore 中不存在)
}

export interface CodeApplicationPlan {
  blocks: ParsedCodeBlock[];
  summary: string; // 变更摘要
  fileCount: number; // 涉及的文件数
  newFileCount: number; // 新建文件数
  modifiedFileCount: number; // 修改文件数
}

export interface ApplyResult {
  success: boolean;
  appliedFiles: string[];
  errors: string[];
}

// ── 解析 LLM 响应中的代码块 ──

const CODE_BLOCK_REGEX = /```(\w+)?\s*\n([\s\S]*?)```/g;
const FILEPATH_REGEX = /^\/\/\s*filepath:\s*(.+?)$/m;
const FILEPATH_ALT_REGEX = /^\/\*\s*filepath:\s*(.+?)\s*\*\/$/m;
const FILEPATH_COMMENT_REGEX =
  /^(?:\/\/|#|\/\*)\s*(?:file(?:path)?|File|FILE):\s*(.+?)(?:\s*\*\/)?$/m;

export function parseCodeBlocks(
  llmResponse: string,
  existingFiles: Record<string, string>,
): CodeApplicationPlan {
  const blocks: ParsedCodeBlock[] = [];
  let match: RegExpExecArray | null;

  // Reset regex
  CODE_BLOCK_REGEX.lastIndex = 0;

  while ((match = CODE_BLOCK_REGEX.exec(llmResponse)) !== null) {
    const language = match[1] || "plaintext";
    const rawContent = match[2].trim();

    // Skip non-code blocks (shell commands, output examples, etc.)
    if (
      [
        "bash",
        "sh",
        "shell",
        "cmd",
        "powershell",
        "console",
        "terminal",
      ].includes(language)
    ) {
      continue;
    }

    // Try to extract filepath from the code content
    let filepath = extractFilepath(rawContent);

    // If no filepath found in code, try to find it in preceding text
    if (!filepath) {
      const precedingText = llmResponse.slice(
        Math.max(0, match.index - 200),
        match.index,
      );
      filepath = extractFilepathFromContext(precedingText, language);
    }

    // If still no filepath, try to infer from content
    if (!filepath) {
      filepath = inferFilepath(rawContent, language, existingFiles);
    }

    if (!filepath) continue; // Skip blocks without identifiable file path

    // Clean the content (remove filepath comment if it was the first line)
    const cleanedContent = cleanFileContent(rawContent);
    const isNew = !(filepath in existingFiles);

    blocks.push({
      filepath,
      language,
      content: cleanedContent,
      isNew,
    });
  }

  // Deduplicate: if same filepath appears multiple times, keep the last one
  const deduped = new Map<string, ParsedCodeBlock>();
  for (const block of blocks) {
    deduped.set(block.filepath, block);
  }
  const finalBlocks = [...deduped.values()];

  const newCount = finalBlocks.filter((b) => b.isNew).length;
  const modCount = finalBlocks.filter((b) => !b.isNew).length;

  return {
    blocks: finalBlocks,
    summary: buildSummary(finalBlocks),
    fileCount: finalBlocks.length,
    newFileCount: newCount,
    modifiedFileCount: modCount,
  };
}

// ── 从代码内容提取文件路径 ──

function extractFilepath(content: string): string | null {
  const firstLine = content.split("\n")[0].trim();

  // Try various filepath comment formats
  for (const regex of [
    FILEPATH_REGEX,
    FILEPATH_ALT_REGEX,
    FILEPATH_COMMENT_REGEX,
  ]) {
    const match = firstLine.match(regex);
    if (match) {
      return normalizePath(match[1].trim());
    }
  }

  return null;
}

// ── 从上文中提取文件路径 ──

function extractFilepathFromContext(
  text: string,
  language: string,
): string | null {
  // Look for patterns like "文件: src/..." or "File: src/..." or "`src/...`"
  const patterns = [
    /[`"]([^`"]+\.(?:tsx?|jsx?|css|json|html|md))[`"]/,
    /(?:文件|file|File|FILE)[:\s]+[`"]?([^\s`"]+\.(?:tsx?|jsx?|css|json|html|md))[`"]?/i,
    /(?:创建|修改|更新|create|modify|update)\s+[`"]?([^\s`"]+\.(?:tsx?|jsx?|css|json|html|md))[`"]?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizePath(match[1]);
    }
  }

  return null;
}

// ── 从内容推断文件路径 ──

function inferFilepath(
  content: string,
  language: string,
  existingFiles: Record<string, string>,
): string | null {
  // Try to match component name from export
  const exportMatch = content.match(/export\s+(?:default\s+)?function\s+(\w+)/);
  const classMatch = content.match(/export\s+(?:default\s+)?class\s+(\w+)/);

  const componentName = exportMatch?.[1] || classMatch?.[1];

  if (componentName) {
    const ext = language === "tsx" || language === "jsx" ? ".tsx" : ".ts";

    // Check if a file with this component name already exists
    for (const path of Object.keys(existingFiles)) {
      const fileName = path
        .split("/")
        .pop()
        ?.replace(/\.\w+$/, "");
      if (fileName === componentName) {
        return path;
      }
    }

    // If not found, suggest a new path
    return `src/components/${componentName}${ext}`;
  }

  return null;
}

// ── 清理文件内容 ──

function cleanFileContent(content: string): string {
  const lines = content.split("\n");

  // Remove filepath comment if it's the first line
  if (lines.length > 0) {
    const first = lines[0].trim();
    if (
      FILEPATH_REGEX.test(first) ||
      FILEPATH_ALT_REGEX.test(first) ||
      FILEPATH_COMMENT_REGEX.test(first)
    ) {
      lines.shift();
      // Also remove empty line after filepath comment
      if (lines.length > 0 && lines[0].trim() === "") {
        lines.shift();
      }
    }
  }

  return lines.join("\n");
}

// ── 路径规范化 ──

function normalizePath(path: string): string {
  // Remove leading ./
  path = path.replace(/^\.\//, "");
  // Remove leading /
  path = path.replace(/^\//, "");
  // Ensure consistent format
  return path;
}

// ── 构建变更摘要 ──

function buildSummary(blocks: ParsedCodeBlock[]): string {
  if (blocks.length === 0) return "无代码变更";

  const parts: string[] = [];
  const newFiles = blocks.filter((b) => b.isNew);
  const modFiles = blocks.filter((b) => !b.isNew);

  if (newFiles.length > 0) {
    parts.push(
      `新建 ${newFiles.length} 个文件: ${newFiles.map((b) => b.filepath).join(", ")}`,
    );
  }
  if (modFiles.length > 0) {
    parts.push(
      `修改 ${modFiles.length} 个文件: ${modFiles.map((b) => b.filepath).join(", ")}`,
    );
  }

  return parts.join("；");
}

// ── 应用代码到文件系统 ──

export function applyCodeToFiles(
  plan: CodeApplicationPlan,
  updateFile: (path: string, content: string) => void,
  createFile: (path: string, content: string) => void,
): ApplyResult {
  const appliedFiles: string[] = [];
  const errors: string[] = [];

  for (const block of plan.blocks) {
    try {
      if (block.isNew) {
        createFile(block.filepath, block.content);
      } else {
        updateFile(block.filepath, block.content);
      }
      appliedFiles.push(block.filepath);
    } catch (err) {
      errors.push(
        `Failed to apply ${block.filepath}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return {
    success: errors.length === 0,
    appliedFiles,
    errors,
  };
}

// ── 生成 Diff 预览 ──

export interface DiffLine {
  type: "unchanged" | "added" | "removed";
  content: string;
  lineNumber: number;
}

export function generateSimpleDiff(
  oldContent: string | undefined,
  newContent: string,
): DiffLine[] {
  if (!oldContent) {
    // New file - all lines are additions
    return newContent.split("\n").map((line, i) => ({
      type: "added" as const,
      content: line,
      lineNumber: i + 1,
    }));
  }

  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  // Simple line-by-line diff (not LCS, but good enough for preview)
  const result: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
    const newLine = i < newLines.length ? newLines[i] : undefined;

    if (oldLine === newLine) {
      result.push({ type: "unchanged", content: newLine!, lineNumber: i + 1 });
    } else {
      if (oldLine !== undefined) {
        result.push({ type: "removed", content: oldLine, lineNumber: i + 1 });
      }
      if (newLine !== undefined) {
        result.push({ type: "added", content: newLine, lineNumber: i + 1 });
      }
    }
  }

  return result;
}

// ── 验证代码块 ──

export function validateCodeBlock(block: ParsedCodeBlock): string[] {
  const warnings: string[] = [];

  // Check for empty content
  if (!block.content.trim()) {
    warnings.push(`${block.filepath}: 文件内容为空`);
  }

  // Check for suspiciously short TSX/TS files
  if (
    (block.language === "tsx" || block.language === "ts") &&
    block.content.trim().length < 20
  ) {
    warnings.push(`${block.filepath}: 文件内容异常短`);
  }

  // Check for common issues
  if (block.language === "tsx" && !block.content.includes("import")) {
    warnings.push(`${block.filepath}: TSX 文件缺少 import 语句`);
  }

  return warnings;
}
