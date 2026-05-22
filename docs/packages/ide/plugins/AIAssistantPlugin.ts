import { createLogger } from "../utils/logger";
const log = createLogger("AIAssistant");
/**
 * @file plugins/AIAssistantPlugin.ts
 * @description AI 助手插件示例 - 集成 AI 对话、代码解释、智能建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,ai,assistant
 */

import type { PluginManifest, PluginContext } from "../types";

export const AIAssistantPlugin: PluginManifest = {
  id: "yyc3-ai-assistant",
  name: "AI 助手",
  nameEn: "AI Assistant",
  version: "1.0.0",
  description: "集成 AI 对话、代码解释、智能建议等功能",
  descriptionEn: "AI chat, code explanation, intelligent suggestions and more",
  author: "YYC3 Team <admin@0379.email>",
  homepage: "https://github.com/YYC-Cube/yyc3-family-ai",
  license: "MIT",
  tags: ["ai", "assistant", "productivity"],
  icon: "Sparkles",
  
  activate: (context: PluginContext) => {
    log.info("插件已激活");
    
    // 注册状态栏项
    context.ui.registerStatusBarItem({
      id: "ai-assistant",
      text: "✨ AI 助手",
      tooltip: "打开 AI 助手",
      onClick: () => {
        openAssistant(context);
      },
    });
    
    // 注册命令
    context.commands.registerCommand("yyc3.ai.assist", () => {
      openAssistant(context);
    });
    
    context.commands.registerCommand("yyc3.ai.explain", () => {
      explainCode(context);
    });
    
    context.commands.registerCommand("yyc3.ai.optimize", () => {
      optimizeCode(context);
    });
    
    // 注册菜单项
    context.ui.registerMenuItem("tools", {
      label: "AI 助手",
      action: () => openAssistant(context),
      shortcut: "Ctrl+Shift+A",
    });
    
    context.ui.registerMenuItem("editor", {
      label: "AI 解释代码",
      action: () => explainCode(context),
      shortcut: "Ctrl+Shift+E",
    });
    
    context.ui.registerMenuItem("editor", {
      label: "AI 优化代码",
      action: () => optimizeCode(context),
      shortcut: "Ctrl+Shift+O",
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
 * 打开 AI 助手
 */
function openAssistant(context: PluginContext) {
  const activeFile = context.editor.getActiveFile();
  const selectedText = context.editor.getSelectedText();
  
  const html = `
    <div style="display: flex; flex-direction: column; height: 500px;">
      <div style="padding: 12px; border-bottom: 1px solid var(--ide-border);">
        <h3 style="margin: 0; color: var(--ide-text); font-size: 14px;">✨ AI 助手</h3>
        <p style="margin: 4px 0 0; font-size: 11px; color: var(--ide-text-muted);">
          ${activeFile ? `当前文件：${activeFile.split("/").pop()}` : "请先打开一个文件"}
        </p>
      </div>
      
      <div style="flex: 1; padding: 12px; overflow-y: auto;">
        <div style="padding: 12px; background: var(--ide-accent)/10; border-radius: 8px; margin-bottom: 12px;">
          <div style="font-size: 12px; color: var(--ide-text);">
            👋 你好！我是 AI 助手，可以帮你：
          </div>
          <ul style="margin: 8px 0 0 16px; font-size: 11px; color: var(--ide-text-muted);">
            <li>解释代码功能和逻辑</li>
            <li>优化代码性能和可读性</li>
            <li>生成单元测试</li>
            <li>修复代码错误</li>
            <li>提供最佳实践建议</li>
          </ul>
        </div>
        
        ${selectedText ? `
          <div style="padding: 12px; background: var(--ide-bg-inset); border-radius: 8px; border-left: 3px solid var(--ide-accent);">
            <div style="font-size: 11px; color: var(--ide-text-muted); margin-bottom: 4px;">已选中文本</div>
            <pre style="margin: 0; font-size: 10px; color: var(--ide-text-secondary); white-space: pre-wrap; word-break: break-all;">${selectedText.slice(0, 200)}${selectedText.length > 200 ? "..." : ""}</pre>
          </div>
        ` : ""}
      </div>
      
      <div style="padding: 12px; border-top: 1px solid var(--ide-border);">
        <div style="display: flex; gap: 8px;">
          <input 
            type="text" 
            placeholder="输入你的问题..." 
            style="flex: 1; padding: 8px 12px; background: var(--ide-bg-inset); border: 1px solid var(--ide-border); border-radius: 6px; color: var(--ide-text); font-size: 12px; outline: none;"
            onkeydown="if(event.key==='Enter'){window.postMessage({type:'ask',text:this.value},'*');this.value='';}"
          />
          <button onclick="window.postMessage({type:'ask',text:this.previousElementSibling.value},'*');this.previousElementSibling.value=''" style="
            padding: 8px 16px;
            background: var(--ide-accent);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
          ">发送</button>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button onclick="window.postMessage({type:'quick',action:'explain'},'*')" style="
            padding: 4px 8px;
            background: var(--ide-border);
            color: var(--ide-text);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
          ">解释代码</button>
          <button onclick="window.postMessage({type:'quick',action:'optimize'},'*')" style="
            padding: 4px 8px;
            background: var(--ide-border);
            color: var(--ide-text);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
          ">优化代码</button>
          <button onclick="window.postMessage({type:'quick',action:'test'},'*')" style="
            padding: 4px 8px;
            background: var(--ide-border);
            color: var(--ide-text);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
          ">生成测试</button>
          <button onclick="window.postMessage({type:'quick',action:'doc'},'*')" style="
            padding: 4px 8px;
            background: var(--ide-border);
            color: var(--ide-text);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
          ">添加注释</button>
        </div>
      </div>
    </div>
  `;
  
  context.ui.showPanel({
    title: "✨ AI 助手",
    content: html,
    width: 500,
    height: 550,
  });
}

/**
 * 解释代码
 */
function explainCode(context: PluginContext) {
  const selectedText = context.editor.getSelectedText();
  
  if (!selectedText) {
    context.ui.showToast("请先选择要解释的代码", "info");
    return;
  }
  
  context.ui.showToast("正在分析代码...", "info");
  
  // 模拟 AI 响应 (实际应该调用 LLM)
  setTimeout(() => {
    context.ui.showPanel({
      title: "📖 代码解释",
      content: `
        <div style="padding: 16px; font-family: system-ui; font-size: 13px; line-height: 1.6;">
          <h4 style="margin: 0 0 12px; color: var(--ide-text);">代码功能</h4>
          <p style="color: var(--ide-text-secondary); margin: 0 0 16px;">
            这段代码实现了一个...功能。主要逻辑包括：
          </p>
          
          <h4 style="margin: 0 0 12px; color: var(--ide-text);">关键点</h4>
          <ul style="color: var(--ide-text-secondary); margin: 0 0 16px; padding-left: 20px;">
            <li>使用了...模式/技术</li>
            <li>处理了...情况</li>
            <li>返回了...结果</li>
          </ul>
          
          <h4 style="margin: 0 0 12px; color: var(--ide-text);">改进建议</h4>
          <ul style="color: var(--ide-text-secondary); margin: 0; padding-left: 20px;">
            <li>可以添加错误处理</li>
            <li>考虑性能优化</li>
            <li>添加类型定义</li>
          </ul>
        </div>
      `,
      width: 500,
      height: 400,
    });
    
    context.ui.showToast("代码解释完成", "success");
  }, 1000);
}

/**
 * 优化代码
 */
function optimizeCode(context: PluginContext) {
  const activeFile = context.editor.getActiveFile();
  const selectedText = context.editor.getSelectedText();
  
  if (!selectedText && !activeFile) {
    context.ui.showToast("请先打开文件或选择代码", "info");
    return;
  }
  
  context.ui.showToast("正在优化代码...", "info");
  
  // 模拟 AI 优化
  setTimeout(() => {
    if (selectedText) {
      // 优化选中的代码
      const optimized = selectedText
        .replace(/\bvar\b/g, "const")
        .replace(/==/g, "===")
        .replace(/!=/g, "!==");
      
      context.editor.setFileContent(activeFile!, selectedText.replace(selectedText, optimized));
      context.ui.showToast("代码优化完成", "success");
    } else {
      context.ui.showToast("优化建议已生成", "success");
    }
  }, 1500);
}

export default AIAssistantPlugin;
