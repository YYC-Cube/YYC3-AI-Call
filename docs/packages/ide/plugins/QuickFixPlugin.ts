import { createLogger } from "../utils/logger";
const log = createLogger("QuickFix");
/**
 * @file plugins/QuickFixPlugin.ts
 * @description 快速修复插件示例 - 提供常见代码问题的快速修复建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,quick-fix,code-quality
 */

import type { PluginManifest, PluginContext } from "../types";

export const QuickFixPlugin: PluginManifest = {
  id: "yyc3-quick-fix",
  name: "快速修复",
  nameEn: "Quick Fix",
  version: "1.0.0",
  description: "检测并修复常见代码问题，如 console.log、TODO 注释、未使用变量等",
  descriptionEn: "Detect and fix common code issues like console.log, TODO comments, unused variables",
  author: "YYC3 Team <admin@0379.email>",
  homepage: "https://github.com/YYC-Cube/yyc3-family-ai",
  license: "MIT",
  tags: ["fix", "code-quality", "productivity"],
  icon: "Wand2",
  
  activate: (context: PluginContext) => {
    log.info("插件已激活");
    
    // 注册状态栏项
    context.ui.registerStatusBarItem({
      id: "quick-fix",
      text: "✨ 快速修复",
      tooltip: "扫描并修复代码问题",
      onClick: () => {
        scanAndFix(context);
      },
    });
    
    // 注册命令
    context.commands.registerCommand("yyc3.quickFix.scan", () => {
      scanAndFix(context);
    });
    
    context.commands.registerCommand("yyc3.quickFix.fixAll", () => {
      fixAllIssues(context);
    });
    
    // 注册菜单项
    context.ui.registerMenuItem("tools", {
      label: "快速修复",
      action: () => scanAndFix(context),
      shortcut: "Ctrl+Shift+F",
    });
    
    return () => {
      log.info("插件已停用");
    };
  },
  
  deactivate: () => {
    log.info("插件正在停用");
  },
};

/**
 * 扫描并修复
 */
function scanAndFix(context: PluginContext) {
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
  
  const issues = scanIssues(content, activeFile);
  
  if (issues.length === 0) {
    context.ui.showToast("✨ 未发现代码问题", "success");
    return;
  }
  
  // 显示问题列表
  showIssuesPanel(context, issues);
}

/**
 * 扫描代码问题
 */
function scanIssues(content: string, filepath: string) {
  const issues: Array<{
    type: string;
    severity: "error" | "warning" | "info";
    line: number;
    message: string;
    fix?: () => string;
  }> = [];
  
  const lines = content.split("\n");
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 检测 console.log
    if (/console\.(log|warn|error|info|debug)\(/.test(line)) {
      issues.push({
        type: "console",
        severity: "warning",
        line: lineNum,
        message: "发现 console 语句，生产环境应该移除",
        fix: () => line.replace(/console\.\w+\([^)]*\);?/, ""),
      });
    }
    
    // 检测 debugger
    if (/\bdebugger\b/.test(line)) {
      issues.push({
        type: "debugger",
        severity: "error",
        line: lineNum,
        message: "发现 debugger 语句，必须移除",
        fix: () => line.replace(/\bdebugger\b;?/, "").trim(),
      });
    }
    
    // 检测 TODO 注释
    if (/TODO|FIXME|XXX|HACK/.test(line)) {
      issues.push({
        type: "todo",
        severity: "info",
        line: lineNum,
        message: "发现待办注释",
      });
    }
    
    // 检测 var 使用
    if (/\bvar\s+\w+/.test(line)) {
      issues.push({
        type: "var",
        severity: "warning",
        line: lineNum,
        message: "使用 var 声明变量，建议使用 let 或 const",
        fix: () => line.replace(/\bvar\s+/, "const "),
      });
    }
    
    // 检测 == 而不是 ===
    if (/[^=!]=[^=]/.test(line) && !/[^=!]===[^=]/.test(line)) {
      issues.push({
        type: "eqeqeq",
        severity: "warning",
        line: lineNum,
        message: "使用 == 而不是 ===，建议使用严格相等",
        fix: () => line.replace(/([^=!])=\s*=([^=])/g, "$1=== $2"),
      });
    }
    
    // 检测空 catch 块
    if (/catch\s*\(\s*\w*\s*\)\s*{\s*}/.test(line)) {
      issues.push({
        type: "empty-catch",
        severity: "error",
        line: lineNum,
        message: "空 catch 块，应该处理错误或重新抛出",
      });
    }
  });
  
  return issues;
}

/**
 * 显示问题面板
 */
function showIssuesPanel(context: PluginContext, issues: Array<{
  type: string;
  severity: string;
  line: number;
  message: string;
}>) {
  const severityIcon: Record<string, string> = {
    error: "🔴",
    warning: "🟡",
    info: "🔵",
  };
  
  const html = `
    <div style="padding: 16px; font-family: system-ui; font-size: 13px;">
      <h3 style="margin: 0 0 16px; color: var(--ide-text);">
        🔍 发现 ${issues.length} 个代码问题
      </h3>
      
      <div style="max-height: 400px; overflow-y: auto;">
        ${issues.map((issue) => `
          <div style="
            padding: 12px;
            margin-bottom: 8px;
            background: var(--ide-bg-inset);
            border-radius: 6px;
            border-left: 3px solid ${issue.severity === "error" ? "#ef4444" : issue.severity === "warning" ? "#f59e0b" : "#3b82f6"};
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span>${severityIcon[issue.severity]}</span>
              <span style="color: var(--ide-text-muted); font-size: 11px;">第 ${issue.line} 行</span>
              <span style="
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                background: ${issue.severity === "error" ? "#ef4444/20" : issue.severity === "warning" ? "#f59e0b/20" : "#3b82f6/20"};
                color: ${issue.severity === "error" ? "#ef4444" : issue.severity === "warning" ? "#f59e0b" : "#3b82f6"};
              ">${issue.type}</span>
            </div>
            <div style="color: var(--ide-text);">${issue.message}</div>
          </div>
        `).join("")}
      </div>
      
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button onclick="window.postMessage({ type: 'fix-all' }, '*')" style="
          padding: 8px 16px;
          background: var(--ide-accent);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">一键修复所有</button>
        <button onclick="window.postMessage({ type: 'close' }, '*')" style="
          padding: 8px 16px;
          background: var(--ide-border);
          color: var(--ide-text);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">关闭</button>
      </div>
    </div>
  `;
  
  context.ui.showPanel({
    title: "🔍 代码问题扫描",
    content: html,
    width: 500,
    height: 500,
  });
}

/**
 * 修复所有问题
 */
function fixAllIssues(context: PluginContext) {
  const activeFile = context.editor.getActiveFile();
  if (!activeFile) return;
  
  const content = context.editor.getFileContent(activeFile);
  if (!content) return;
  
  let fixedContent = content;
  let fixCount = 0;
  
  // 移除 console.log
  fixedContent = fixedContent.replace(/console\.\w+\([^)]*\);?\n?/g, "");
  fixCount++;
  
  // 移除 debugger
  fixedContent = fixedContent.replace(/\bdebugger\b;?\n?/g, "");
  fixCount++;
  
  // var 转 const
  fixedContent = fixedContent.replace(/\bvar\s+/g, "const ");
  fixCount++;
  
  // == 转 ===
  fixedContent = fixedContent.replace(/([^=!])=\s*=([^=])/g, "$1=== $2");
  fixCount++;
  
  context.editor.setFileContent(activeFile, fixedContent);
  context.ui.showToast(`✨ 已修复 ${fixCount} 类问题`, "success");
}

export default QuickFixPlugin;
