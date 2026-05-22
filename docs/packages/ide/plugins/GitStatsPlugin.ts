/**
 * @file plugins/GitStatsPlugin.ts
 * @description 示例插件 #1 — Git 统计插件，注册面板展示提交统计、文件变更频率、
 *              代码行数趋势，注册命令 "git-stats.show" / "git-stats.refresh"
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,git,statistics,commits
 */

import type { PluginManifest } from "../types";
import type { PluginAPI } from "../PluginSystem";

// ── Plugin Manifest ──

export const GIT_STATS_MANIFEST: PluginManifest = {
  id: "yyc3.git-stats",
  name: "Git 统计",
  version: "1.0.0",
  description: "展示 Git 仓库提交统计、文件变更频率、代码行数趋势",
  author: "YanYuCloudCube Team",
  icon: "git-branch",
  category: "tools",
  permissions: ["editor.read", "ui.panel", "commands"],
  entry: "GitStatsPlugin",
  tags: ["git", "statistics", "visualization"],
};

// ── Mock Git Data (simulated) ──

interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

interface FileChangeFrequency {
  path: string;
  changeCount: number;
  lastChanged: string;
}

interface GitStats {
  totalCommits: number;
  totalFiles: number;
  totalLines: number;
  commits: CommitInfo[];
  hotFiles: FileChangeFrequency[];
  dailyCommits: Record<string, number>;
  languageDistribution: Record<string, number>;
}

function generateMockGitStats(files: string[]): GitStats {
  const now = Date.now();
  const dayMs = 86400000;

  const commits: CommitInfo[] = [
    {
      hash: "a3f2c1d",
      message: "feat: 实现 AI 对话流式响应",
      author: "开发者A",
      date: new Date(now - dayMs * 0).toISOString(),
      filesChanged: 5,
      insertions: 230,
      deletions: 45,
    },
    {
      hash: "b7e4f3a",
      message: "fix: 修复 Monaco 滚动同步偏移",
      author: "开发者B",
      date: new Date(now - dayMs * 1).toISOString(),
      filesChanged: 2,
      insertions: 18,
      deletions: 12,
    },
    {
      hash: "c9d6e2b",
      message: "refactor: 统一 Clipboard API 调用",
      author: "开发者A",
      date: new Date(now - dayMs * 1).toISOString(),
      filesChanged: 10,
      insertions: 85,
      deletions: 120,
    },
    {
      hash: "d1a8f4c",
      message: "feat: 添加命令面板 F3.1",
      author: "开发者C",
      date: new Date(now - dayMs * 2).toISOString(),
      filesChanged: 3,
      insertions: 340,
      deletions: 20,
    },
    {
      hash: "e5b3g6d",
      message: "style: 赛博朋克主题优化",
      author: "开发者B",
      date: new Date(now - dayMs * 3).toISOString(),
      filesChanged: 4,
      insertions: 95,
      deletions: 60,
    },
    {
      hash: "f2c7h8e",
      message: "test: 添加 SecurityScanner 测试",
      author: "开发者A",
      date: new Date(now - dayMs * 4).toISOString(),
      filesChanged: 2,
      insertions: 180,
      deletions: 5,
    },
    {
      hash: "g8d4i9f",
      message: "feat: 多联式面板拖拽增强",
      author: "开发者C",
      date: new Date(now - dayMs * 5).toISOString(),
      filesChanged: 6,
      insertions: 420,
      deletions: 150,
    },
    {
      hash: "h3e5j1g",
      message: "docs: 更新 Guidelines.md",
      author: "开发者A",
      date: new Date(now - dayMs * 6).toISOString(),
      filesChanged: 1,
      insertions: 200,
      deletions: 30,
    },
  ];

  const hotFiles: FileChangeFrequency[] = files.slice(0, 8).map((path, i) => ({
    path,
    changeCount: Math.max(1, 20 - i * 2 + Math.floor(Math.random() * 5)),
    lastChanged: new Date(
      now - dayMs * Math.floor(Math.random() * 7),
    ).toISOString(),
  }));
  hotFiles.sort((a, b) => b.changeCount - a.changeCount);

  const dailyCommits: Record<string, number> = {};
  for (let i = 0; i < 14; i++) {
    const date = new Date(now - dayMs * i).toISOString().split("T")[0];
    dailyCommits[date] = Math.floor(Math.random() * 8) + 1;
  }

  return {
    totalCommits: 128,
    totalFiles: files.length,
    totalLines: files.length * 85,
    commits,
    hotFiles,
    dailyCommits,
    languageDistribution: {
      TypeScript: 62,
      TSX: 28,
      CSS: 6,
      JSON: 3,
      Markdown: 1,
    },
  };
}

// ── Plugin Activation ──

export function activateGitStatsPlugin(api: PluginAPI): void {
  const files = api.editor.listFiles();
  let stats = generateMockGitStats(files);

  // Register commands
  api.commands.registerCommand(
    "show",
    () => {
      api.ui.showNotification("Git 统计面板已打开", "info");
    },
    {
      title: "显示 Git 统计",
      shortcut: "Ctrl+Shift+G",
    },
  );

  api.commands.registerCommand(
    "refresh",
    () => {
      const freshFiles = api.editor.listFiles();
      stats = generateMockGitStats(freshFiles);
      api.ui.showNotification("Git 统计已刷新", "success");
    },
    {
      title: "刷新 Git 统计",
    },
  );

  // Register panel
  api.commands.registerCommand(
    "summary",
    () => {
      const summary = [
        `总提交数: ${stats.totalCommits}`,
        `总文件数: ${stats.totalFiles}`,
        `总行数: ${stats.totalLines}`,
        `最近提交: ${stats.commits[0]?.message || "无"}`,
        `最热文件: ${stats.hotFiles[0]?.path || "无"} (${stats.hotFiles[0]?.changeCount || 0} 次变更)`,
      ].join("\n");
      api.ui.showNotification(summary, "info");
    },
    {
      title: "Git 统计摘要",
    },
  );

  // Register status bar item
  api.ui.registerStatusBarItem({
    text: `Git: ${stats.totalCommits} commits`,
    tooltip: "点击查看 Git 统计",
    onClick: () => {
      api.commands.executeCommand("yyc3.git-stats.show");
    },
  });

  // Store stats in plugin storage
  api.storage.set("lastStats", stats);
  api.storage.set("lastRefresh", Date.now());
}

// ── Exported getters (for testing / panel rendering) ──

export function getGitStatsData(api: PluginAPI): GitStats | null {
  return api.storage.get("lastStats") as GitStats | null;
}
