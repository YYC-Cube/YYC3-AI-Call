import { createLogger } from "../utils/logger";
const log = createLogger("CodeStats");
/**
 * @file plugins/CodeStatsPlugin.ts
 * @description 代码统计插件示例 - 统计代码行数、字符数、复杂度等指标
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,code-stats,analytics
 */

import type { PluginManifest, PluginContext } from "../types";

export const CodeStatsPlugin: PluginManifest = {
  id: "yyc3-code-stats",
  name: "代码统计",
  nameEn: "Code Statistics",
  version: "1.0.0",
  description: "统计代码行数、字符数、函数数量等指标",
  descriptionEn: "Count lines of code, characters, functions and more metrics",
  author: "YYC3 Team <admin@0379.email>",
  homepage: "https://github.com/YYC-Cube/yyc3-family-ai",
  license: "MIT",
  tags: ["analytics", "code-quality", "productivity"],
  icon: "BarChart3",
  
  activate: (context: PluginContext) => {
    log.info("插件已激活");
    
    // 注册状态栏项
    context.ui.registerStatusBarItem({
      id: "code-stats",
      text: "📊 代码统计",
      tooltip: "查看当前文件的代码统计",
      onClick: () => {
        showStats(context);
      },
    });
    
    // 注册命令
    context.commands.registerCommand("yyc3.codeStats.show", () => {
      showStats(context);
    });
    
    // 监听文件切换
    const unsubscribe = context.events.on("file-change", (path: string) => {
      log.info("文件变更:", path);
      updateStats(context, path);
    });
    
    // 返回清理函数
    return () => {
      unsubscribe();
      log.info("插件已停用");
    };
  },
  
  deactivate: () => {
    log.info("插件正在停用");
  },
};

/**
 * 显示代码统计信息
 */
function showStats(context: PluginContext) {
  const activeFile = context.editor.getActiveFile();
  if (!activeFile) {
    context.ui.showToast("请先打开一个文件", "info");
    return;
  }
  
  const content = context.editor.getFileContent(activeFile);
  if (!content) {
    context.ui.showToast("无法读取文件内容", "error");
    return;
  }
  
  const stats = calculateStats(content, activeFile);
  
  // 显示统计面板
  context.ui.showPanel({
    title: `📊 代码统计 - ${activeFile.split("/").pop()}`,
    content: renderStats(stats),
    width: 400,
    height: 300,
  });
}

/**
 * 更新统计
 */
function updateStats(context: PluginContext, path: string) {
  const content = context.editor.getFileContent(path);
  if (!content) return;
  
  const stats = calculateStats(content, path);
  log.info("统计更新:", stats);
}

/**
 * 计算代码统计
 */
function calculateStats(content: string, filepath: string) {
  const lines = content.split("\n");
  const totalLines = lines.length;
  const codeLines = lines.filter(
    (line) => line.trim() && !line.trim().startsWith("//") && !line.trim().startsWith("/*")
  ).length;
  const commentLines = lines.filter(
    (line) => line.trim().startsWith("//") || 
              line.trim().startsWith("/*") || 
              line.trim().startsWith("*")
  ).length;
  const blankLines = lines.filter((line) => !line.trim()).length;
  const characters = content.length;
  const words = content.split(/\s+/).filter(Boolean).length;
  
  // 简单函数计数 (匹配 function、=> 等)
  const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(|\w+\s*\(.*\)\s*{)/g);
  const functionCount = functionMatches ? functionMatches.length : 0;
  
  // 类计数
  const classMatches = content.match(/(?:class\s+\w+|export\s+default\s+class\s+\w+)/g);
  const classCount = classMatches ? classMatches.length : 0;
  
  // 导入语句计数
  const importMatches = content.match(/^import\s+/gm);
  const importCount = importMatches ? importMatches.length : 0;
  
  return {
    filepath,
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    characters,
    words,
    functions: functionCount,
    classes: classCount,
    imports: importCount,
    // 代码密度 (代码行占比)
    codeDensity: Math.round((codeLines / totalLines) * 100) || 0,
  };
}

/**
 * 渲染统计面板 HTML
 */
function renderStats(stats: ReturnType<typeof calculateStats>) {
  return `
    <div style="padding: 16px; font-family: system-ui; font-size: 13px;">
      <h3 style="margin: 0 0 16px; color: var(--ide-text);">📊 代码统计</h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="padding: 12px; background: var(--ide-bg-inset); border-radius: 8px;">
          <div style="color: var(--ide-text-muted); font-size: 12px;">总行数</div>
          <div style="font-size: 24px; font-weight: bold; color: var(--ide-text);">${stats.totalLines}</div>
        </div>
        
        <div style="padding: 12px; background: var(--ide-bg-inset); border-radius: 8px;">
          <div style="color: var(--ide-text-muted); font-size: 12px;">代码行</div>
          <div style="font-size: 24px; font-weight: bold; color: var(--ide-accent);">${stats.codeLines}</div>
        </div>
        
        <div style="padding: 12px; background: var(--ide-bg-inset); border-radius: 8px;">
          <div style="color: var(--ide-text-muted); font-size: 12px;">注释行</div>
          <div style="font-size: 24px; font-weight: bold; color: var(--ide-text-secondary);">${stats.commentLines}</div>
        </div>
        
        <div style="padding: 12px; background: var(--ide-bg-inset); border-radius: 8px;">
          <div style="color: var(--ide-text-muted); font-size: 12px;">空行</div>
          <div style="font-size: 24px; font-weight: bold; color: var(--ide-text-dim);">${stats.blankLines}</div>
        </div>
      </div>
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ide-border);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--ide-text-muted);">代码密度</span>
          <span style="color: var(--ide-accent); font-weight: bold;">${stats.codeDensity}%</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--ide-text-muted);">字符数</span>
          <span style="color: var(--ide-text);">${stats.characters.toLocaleString()}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--ide-text-muted);">单词数</span>
          <span style="color: var(--ide-text);">${stats.words.toLocaleString()}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--ide-text-muted);">函数数</span>
          <span style="color: var(--ide-text);">${stats.functions}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--ide-text-muted);">类数</span>
          <span style="color: var(--ide-text);">${stats.classes}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--ide-text-muted);">导入数</span>
          <span style="color: var(--ide-text);">${stats.imports}</span>
        </div>
      </div>
      
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--ide-border); font-size: 11px; color: var(--ide-text-dim);">
        文件：${stats.filepath}
      </div>
    </div>
  `;
}

export default CodeStatsPlugin;
