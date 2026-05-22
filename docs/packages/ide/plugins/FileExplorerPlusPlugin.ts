import { createLogger } from "../utils/logger";
const log = createLogger("FileExplorerPlus");
/**
 * @file plugins/FileExplorerPlusPlugin.ts
 * @description 文件浏览器增强插件示例 - 提供高级文件管理功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,file-explorer,productivity
 */

import type { PluginManifest, PluginContext } from "../types";

export const FileExplorerPlusPlugin: PluginManifest = {
  id: "yyc3-file-explorer-plus",
  name: "文件浏览器增强",
  nameEn: "File Explorer Plus",
  version: "1.0.0",
  description: "提供高级文件管理功能，如快速搜索、最近文件、书签等",
  descriptionEn: "Advanced file management with quick search, recent files, bookmarks and more",
  author: "YYC3 Team <admin@0379.email>",
  homepage: "https://github.com/YYC-Cube/yyc3-family-ai",
  license: "MIT",
  tags: ["file", "explorer", "productivity"],
  icon: "FolderOpen",
  
  activate: (context: PluginContext) => {
    log.info("插件已激活");
    
    // 初始化书签
    const bookmarks = loadBookmarks();
    
    // 注册状态栏项
    context.ui.registerStatusBarItem({
      id: "file-bookmark",
      text: "🔖 书签",
      tooltip: "管理文件书签",
      onClick: () => {
        showBookmarks(context);
      },
    });
    
    // 注册命令
    context.commands.registerCommand("yyc3.file.toggleBookmark", () => {
      toggleBookmark(context);
    });
    
    context.commands.registerCommand("yyc3.file.showBookmarks", () => {
      showBookmarks(context);
    });
    
    context.commands.registerCommand("yyc3.file.recent", () => {
      showRecentFiles(context);
    });
    
    context.commands.registerCommand("yyc3.file.search", () => {
      quickFileSearch(context);
    });
    
    // 注册菜单项
    context.ui.registerMenuItem("file", {
      label: "快速搜索文件",
      action: () => quickFileSearch(context),
      shortcut: "Ctrl+P",
    });
    
    context.ui.registerMenuItem("file", {
      label: "切换书签",
      action: () => toggleBookmark(context),
      shortcut: "Ctrl+Shift+B",
    });
    
    context.ui.registerMenuItem("file", {
      label: "显示书签",
      action: () => showBookmarks(context),
      shortcut: "Ctrl+B",
    });
    
    // 监听文件打开，记录最近文件
    const unsubscribe = context.events.on("file-open", (path: string) => {
      addRecentFile(path);
    });
    
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
 * 加载书签
 */
function loadBookmarks(): string[] {
  try {
    const data = localStorage.getItem("yyc3-file-bookmarks");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 保存书签
 */
function saveBookmarks(bookmarks: string[]) {
  localStorage.setItem("yyc3-file-bookmarks", JSON.stringify(bookmarks));
}

/**
 * 加载最近文件
 */
function loadRecentFiles(): string[] {
  try {
    const data = localStorage.getItem("yyc3-recent-files");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 添加最近文件
 */
function addRecentFile(path: string) {
  const recent = loadRecentFiles();
  const filtered = recent.filter((p) => p !== path);
  filtered.unshift(path);
  const limited = filtered.slice(0, 20); // 最多保留 20 个
  localStorage.setItem("yyc3-recent-files", JSON.stringify(limited));
}

/**
 * 切换书签
 */
function toggleBookmark(context: PluginContext) {
  const activeFile = context.editor.getActiveFile();
  if (!activeFile) {
    context.ui.showToast("请先打开一个文件", "info");
    return;
  }
  
  const bookmarks = loadBookmarks();
  const index = bookmarks.indexOf(activeFile);
  
  if (index >= 0) {
    // 移除书签
    bookmarks.splice(index, 1);
    saveBookmarks(bookmarks);
    context.ui.showToast(`已移除书签：${activeFile.split("/").pop()}`, "info");
  } else {
    // 添加书签
    bookmarks.push(activeFile);
    saveBookmarks(bookmarks);
    context.ui.showToast(`已添加书签：${activeFile.split("/").pop()}`, "success");
  }
}

/**
 * 显示书签列表
 */
function showBookmarks(context: PluginContext) {
  const bookmarks = loadBookmarks();
  
  if (bookmarks.length === 0) {
    context.ui.showToast("暂无书签，使用 Ctrl+Shift+B 添加当前文件为书签", "info");
    return;
  }
  
  const html = `
    <div style="padding: 16px; font-family: system-ui; font-size: 13px;">
      <h3 style="margin: 0 0 16px; color: var(--ide-text);">🔖 文件书签 (${bookmarks.length})</h3>
      
      <div style="max-height: 400px; overflow-y: auto;">
        ${bookmarks.map((path) => `
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: var(--ide-bg-inset);
            border-radius: 6px;
            margin-bottom: 8px;
          ">
            <div style="flex: 1; overflow: hidden;">
              <div style="color: var(--ide-text); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                📄 ${path.split("/").pop()}
              </div>
              <div style="color: var(--ide-text-dim); font-size: 10px; margin-top: 2px;">
                ${path}
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.postMessage({type:'open',path:'${path}'},'*')" style="
                padding: 4px 8px;
                background: var(--ide-accent);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
              ">打开</button>
              <button onclick="window.postMessage({type:'remove',path:'${path}'},'*')" style="
                padding: 4px 8px;
                background: var(--ide-border);
                color: var(--ide-text);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
              ">删除</button>
            </div>
          </div>
        `).join("")}
      </div>
      
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--ide-border);">
        <button onclick="window.postMessage({type:'clear'},'*')" style="
          padding: 8px 16px;
          background: var(--ide-border);
          color: var(--ide-text);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">清空书签</button>
      </div>
    </div>
  `;
  
  context.ui.showPanel({
    title: "🔖 文件书签",
    content: html,
    width: 500,
    height: 500,
  });
}

/**
 * 显示最近文件
 */
function showRecentFiles(context: PluginContext) {
  const recent = loadRecentFiles();
  
  if (recent.length === 0) {
    context.ui.showToast("暂无最近打开的文件", "info");
    return;
  }
  
  const html = `
    <div style="padding: 16px; font-family: system-ui; font-size: 13px;">
      <h3 style="margin: 0 0 16px; color: var(--ide-text);">🕐 最近文件 (${recent.length})</h3>
      
      <div style="max-height: 400px; overflow-y: auto;">
        ${recent.map((path, index) => `
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            border-bottom: ${index < recent.length - 1 ? "1px solid var(--ide-border-faint)" : "none"};
          ">
            <span style="color: var(--ide-text-dim); font-size: 10px; width: 20px;">${index + 1}</span>
            <div style="flex: 1; overflow: hidden;">
              <div style="color: var(--ide-text); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                📄 ${path.split("/").pop()}
              </div>
            </div>
            <button onclick="window.postMessage({type:'open',path:'${path}'},'*')" style="
              padding: 4px 8px;
              background: var(--ide-accent);
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 10px;
            ">打开</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  
  context.ui.showPanel({
    title: "🕐 最近文件",
    content: html,
    width: 450,
    height: 400,
  });
}

/**
 * 快速文件搜索
 */
function quickFileSearch(context: PluginContext) {
  const allFiles = context.editor.listFiles();
  
  const html = `
    <div style="padding: 16px; font-family: system-ui; font-size: 13px;">
      <h3 style="margin: 0 0 12px; color: var(--ide-text);">🔍 快速搜索文件</h3>
      
      <input 
        type="text" 
        placeholder="输入文件名搜索..." 
        id="file-search-input"
        style="width: 100%; padding: 8px 12px; background: var(--ide-bg-inset); border: 1px solid var(--ide-border); border-radius: 6px; color: var(--ide-text); font-size: 12px; outline: none; box-sizing: border-box;"
        oninput="filterFiles(this.value)"
        autofocus
      />
      
      <div id="search-results" style="max-height: 350px; overflow-y: auto; margin-top: 12px;">
        ${allFiles.slice(0, 20).map((path) => `
          <div onclick="window.postMessage({type:'open',path:'${path}'},'*')" style="
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.2s;
          " onmouseover="this.style.background='var(--ide-border-faint)'" onmouseout="this.style.background='transparent'">
            <div style="color: var(--ide-text); font-size: 12px;">
              📄 ${path.split("/").pop()}
            </div>
            <div style="color: var(--ide-text-dim); font-size: 10px; margin-top: 2px;">
              ${path}
            </div>
          </div>
        `).join("")}
      </div>
      
      <div style="margin-top: 12px; font-size: 10px; color: var(--ide-text-dim);">
        共 ${allFiles.length} 个文件，显示前 20 个
      </div>
    </div>
    
    <script>
      function filterFiles(query) {
        const allFiles = ${JSON.stringify(allFiles)};
        const filtered = query 
          ? allFiles.filter(f => f.toLowerCase().includes(query.toLowerCase()))
          : allFiles;
        
        const resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = filtered.slice(0, 20).map(path => \`
          <div onclick="window.postMessage({type:'open',path:'\${path}'},'*')" style="
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.2s;
          " onmouseover="this.style.background='var(--ide-border-faint)'" onmouseout="this.style.background='transparent'">
            <div style="color: var(--ide-text); font-size: 12px;">
              📄 \${path.split("/").pop()}
            </div>
            <div style="color: var(--ide-text-dim); font-size: 10px; margin-top: 2px;">
              \${path}
            </div>
          </div>
        \`).join('');
      }
    </script>
  `;
  
  context.ui.showPanel({
    title: "🔍 快速搜索",
    content: html,
    width: 450,
    height: 500,
  });
}

export default FileExplorerPlusPlugin;
