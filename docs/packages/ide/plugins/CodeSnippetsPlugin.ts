/**
 * @file plugins/CodeSnippetsPlugin.ts
 * @description 示例插件 #2 — 代码片段管理器，支持片段 CRUD、分类、搜索、
 *              快速插入到编辑器，注册命令 "snippets.insert" / "snippets.create"
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,snippets,code,productivity
 */

import type { PluginManifest } from "../types";
import type { PluginAPI } from "../PluginSystem";

// ── Plugin Manifest ──

export const CODE_SNIPPETS_MANIFEST: PluginManifest = {
  id: "yyc3.code-snippets",
  name: "代码片段管理器",
  version: "1.0.0",
  description: "管理和快速插入常用代码片段，支持分类、搜索、自定义模板",
  author: "YanYuCloudCube Team",
  icon: "code-2",
  category: "productivity",
  permissions: [
    "editor.read",
    "editor.write",
    "ui.panel",
    "commands",
    "storage",
  ],
  entry: "CodeSnippetsPlugin",
  tags: ["snippets", "templates", "productivity", "code"],
};

// ── Types ──

export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  language: string;
  category: string;
  code: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

export type SnippetCategory =
  | "react"
  | "typescript"
  | "css"
  | "testing"
  | "hooks"
  | "patterns"
  | "custom";

// ── Built-in Snippets ──

const BUILTIN_SNIPPETS: CodeSnippet[] = [
  {
    id: "snippet-react-fc",
    name: "React 函数组件",
    description: "带 Props 接口的 React 函数组件模板",
    language: "tsx",
    category: "react",
    code: `interface \${1:Component}Props {
  \${2:// props}
}

export function \${1:Component}({ \${3} }: \${1:Component}Props) {
  return (
    <div>
      \${4:// content}
    </div>
  )
}`,
    tags: ["react", "component", "typescript"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "snippet-useState",
    name: "useState Hook",
    description: "React useState 状态钩子",
    language: "tsx",
    category: "hooks",
    code: `const [\${1:state}, set\${2:State}] = useState<\${3:Type}>(\${4:initialValue})`,
    tags: ["react", "hooks", "state"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "snippet-useEffect",
    name: "useEffect Hook",
    description: "React useEffect 副作用钩子",
    language: "tsx",
    category: "hooks",
    code: `useEffect(() => {
  \${1:// effect}

  return () => {
    \${2:// cleanup}
  }
}, [\${3:deps}])`,
    tags: ["react", "hooks", "effect"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "snippet-useCallback",
    name: "useCallback Hook",
    description: "React useCallback 缓存回调函数",
    language: "tsx",
    category: "hooks",
    code: `const \${1:handler} = useCallback((\${2:args}) => {
  \${3:// logic}
}, [\${4:deps}])`,
    tags: ["react", "hooks", "performance"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "snippet-zustand",
    name: "Zustand Store",
    description: "Zustand 状态管理 store 模板",
    language: "ts",
    category: "patterns",
    code: `import { create } from "zustand"

interface \${1:Store}State {
  \${2:// state}
  \${3:count}: number
}

interface \${1:Store}Actions {
  \${4:increment}: () => void
  \${5:reset}: () => void
}

export const use\${1:Store} = create<\${1:Store}State & \${1:Store}Actions>((set) => ({
  \${3:count}: 0,
  \${4:increment}: () => set((state) => ({ \${3:count}: state.\${3:count} + 1 })),
  \${5:reset}: () => set({ \${3:count}: 0 }),
}))`,
    tags: ["zustand", "state", "store"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "snippet-vitest",
    name: "Vitest 测试用例",
    description: "Vitest describe/it 测试模板",
    language: "ts",
    category: "testing",
    code: `import { describe, it, expect, vi } from "vitest"

describe("\${1:Module}", () => {
  it("\${2:should do something}", () => {
    // Arrange
    \${3:const input = "test"}

    // Act
    \${4:const result = input}

    // Assert
    expect(result).\${5:toBe("test")}
  })
})`,
    tags: ["vitest", "testing", "unit"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "snippet-tailwind-card",
    name: "Tailwind 卡片",
    description: "Tailwind CSS 样式卡片组件",
    language: "tsx",
    category: "css",
    code: `<div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-colors">
  <h3 className="text-sm text-slate-200 mb-1">\${1:标题}</h3>
  <p className="text-xs text-slate-500">\${2:描述}</p>
</div>`,
    tags: ["tailwind", "card", "component"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "snippet-file-header",
    name: "YYC3 文件标头",
    description: "YYC3 团队标准文件标头注释",
    language: "ts",
    category: "patterns",
    code: `/**
 * @file \${1:filename}
 * @description \${2:description}
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created \${3:${new Date().toISOString().split("T")[0]}}
 * @updated \${3:${new Date().toISOString().split("T")[0]}}
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags \${4:tags}
 */`,
    tags: ["header", "jsdoc", "standard"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
];

// ── Plugin Activation ──

export function activateCodeSnippetsPlugin(api: PluginAPI): void {
  // Load or initialize snippets
  let snippets: CodeSnippet[] = (api.storage.get(
    "snippets",
  ) as CodeSnippet[]) || [...BUILTIN_SNIPPETS];

  // Persist initial snippets
  api.storage.set("snippets", snippets);

  // ── Commands ──

  api.commands.registerCommand(
    "list",
    () => {
      const names = snippets
        .map((s) => `• ${s.name} (${s.language})`)
        .join("\n");
      api.ui.showNotification(
        `代码片段 (${snippets.length}):\n${names}`,
        "info",
      );
    },
    {
      title: "列出所有片段",
      shortcut: "Ctrl+Shift+S",
    },
  );

  api.commands.registerCommand(
    "insert",
    () => {
      // In a real implementation, this would show a picker
      const activeFile = api.editor.getActiveFile();
      if (!activeFile) {
        api.ui.showNotification("请先打开一个文件", "warning");
        return;
      }

      // Insert the first snippet as demo
      const snippet = snippets[0];
      if (snippet) {
        const currentContent = api.editor.getFileContent(activeFile) || "";
        const resolvedCode = snippet.code.replace(/\$\{[^}]+\}/g, (match) => {
          const parts = match.slice(2, -1).split(":");
          return parts[1] || parts[0] || "";
        });
        api.editor.setFileContent(
          activeFile,
          `${currentContent  }\n\n${  resolvedCode}`,
        );
        snippet.usageCount++;
        api.storage.set("snippets", snippets);
        api.ui.showNotification(`已插入片段: ${snippet.name}`, "success");
      }
    },
    {
      title: "插入代码片段",
      shortcut: "Ctrl+Shift+I",
    },
  );

  api.commands.registerCommand(
    "create",
    () => {
      const selectedText = api.editor.getSelectedText();
      if (!selectedText) {
        api.ui.showNotification("请先选中要保存为片段的代码", "warning");
        return;
      }

      const newSnippet: CodeSnippet = {
        id: `snippet-custom-${Date.now()}`,
        name: `自定义片段 ${snippets.filter((s) => s.category === "custom").length + 1}`,
        description: "从选中代码创建的自定义片段",
        language: "tsx",
        category: "custom",
        code: selectedText,
        tags: ["custom"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      };

      snippets = [...snippets, newSnippet];
      api.storage.set("snippets", snippets);
      api.ui.showNotification(`已创建片段: ${newSnippet.name}`, "success");
    },
    {
      title: "从选中代码创建片段",
    },
  );

  api.commands.registerCommand(
    "search",
    () => {
      // In a real implementation, this would open a search modal
      api.ui.showNotification(
        "片段搜索功能 — 请在命令面板中使用关键词搜索",
        "info",
      );
    },
    {
      title: "搜索代码片段",
    },
  );

  api.commands.registerCommand(
    "delete",
    () => {
      const customSnippets = snippets.filter((s) => s.category === "custom");
      if (customSnippets.length === 0) {
        api.ui.showNotification("没有可删除的自定义片段", "info");
        return;
      }
      // Remove last custom snippet as demo
      const toDelete = customSnippets[customSnippets.length - 1];
      snippets = snippets.filter((s) => s.id !== toDelete.id);
      api.storage.set("snippets", snippets);
      api.ui.showNotification(`已删除片段: ${toDelete.name}`, "info");
    },
    {
      title: "删除最近的自定义片段",
    },
  );

  // ── Status Bar ──

  api.ui.registerStatusBarItem({
    text: `Snippets: ${snippets.length}`,
    tooltip: "代码片段管理器",
    onClick: () => {
      api.commands.executeCommand("yyc3.code-snippets.list");
    },
  });

  // ── Menu Items ──

  api.ui.registerMenuItem("edit", {
    label: "插入代码片段",
    action: () => api.commands.executeCommand("yyc3.code-snippets.insert"),
    shortcut: "Ctrl+Shift+I",
  });

  api.ui.registerMenuItem("edit", {
    label: "从选中创建片段",
    action: () => api.commands.executeCommand("yyc3.code-snippets.create"),
  });
}

// ── Exported helpers ──

export function getSnippetsByCategory(
  api: PluginAPI,
  category?: SnippetCategory,
): CodeSnippet[] {
  const all = (api.storage.get("snippets") as CodeSnippet[]) || [];
  if (!category) return all;
  return all.filter((s) => s.category === category);
}

export function searchSnippets(api: PluginAPI, query: string): CodeSnippet[] {
  const all = (api.storage.get("snippets") as CodeSnippet[]) || [];
  const q = query.toLowerCase();
  return all.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
