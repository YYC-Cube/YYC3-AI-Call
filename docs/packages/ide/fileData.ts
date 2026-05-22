/**
 * @file fileData.ts
 * @description 共享文件内容数据，供 CenterPanel 编辑器和 RightPanel 代码详情使用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags data,files,mock,editor
 */

// Shared file contents used by CenterPanel editor and RightPanel code detail
export const FILE_CONTENTS: Record<string, string> = {
  "src/app/App.tsx": `import { RouterProvider } from "react-router"
import { router } from "./routes"

export default function App() {
  return <RouterProvider router={router} />
}`,
  "src/app/components/Header.tsx": `import { Layers, Bell, Settings } from "lucide-react"

interface HeaderProps {
  title: string
  onSettingsClick: () => void
}

export function Header({ title, onSettingsClick }: HeaderProps) {
  return (
    <header className="h-14 border-b flex items-center px-4 gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
        <Layers className="w-4 h-4 text-white" />
      </div>
      <h1 className="text-lg font-medium">{title}</h1>
      <div className="flex-1" />
      <button className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100">
        <Bell className="w-4 h-4 text-gray-500" />
      </button>
      <button
        onClick={onSettingsClick}
        className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100"
      >
        <Settings className="w-4 h-4 text-gray-500" />
      </button>
    </header>
  )
}`,
  "src/app/components/Sidebar.tsx": `import { useState } from "react"
import { Home, BarChart2, Users, Settings, ChevronRight } from "lucide-react"

interface SidebarProps {
  onNavigate: (path: string) => void
}

const NAV_ITEMS = [
  { icon: Home, label: "首页", path: "/" },
  { icon: BarChart2, label: "数据分析", path: "/analytics" },
  { icon: Users, label: "用户管理", path: "/users" },
  { icon: Settings, label: "系统设置", path: "/settings" },
]

export function Sidebar({ onNavigate }: SidebarProps) {
  const [active, setActive] = useState("/")

  return (
    <aside className="w-60 h-full bg-gray-50 border-r flex flex-col">
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              setActive(item.path)
              onNavigate(item.path)
            }}
            className={\`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors \${
              active === item.path
                ? "bg-violet-50 text-violet-700 border-r-2 border-violet-600"
                : "text-gray-600 hover:bg-gray-100"
            }\`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
          </button>
        ))}
      </nav>
    </aside>
  )
}`,
  "src/app/components/Dashboard.tsx": `import { Card } from "./Card"
import { DataTable } from "./DataTable"

interface DashboardData {
  totalUsers: number
  activeUsers: number
  revenue: string
  recentOrders: Record<string, any>[]
}

interface DashboardProps {
  data: DashboardData
}

export function Dashboard({ data }: DashboardProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      <Card title="总用户" value={data.totalUsers} />
      <Card title="活跃用户" value={data.activeUsers} />
      <Card title="收入" value={data.revenue} />
      <div className="col-span-3">
        <DataTable rows={data.recentOrders} />
      </div>
    </div>
  )
}`,
  "src/app/components/DataTable.tsx": `import { useState, useMemo } from "react"

interface Column {
  key: string
  title: string
  sortable?: boolean
}

interface DataTableProps {
  columns?: Column[]
  rows: Record<string, any>[]
  pageSize?: number
  sortable?: boolean
  filterable?: boolean
}

export function DataTable({
  columns,
  rows,
  pageSize = 10,
  sortable = true,
  filterable = false,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [filterText, setFilterText] = useState("")
  const [page, setPage] = useState(0)

  const cols = useMemo(() => {
    return (
      columns ||
      Object.keys(rows[0] || {}).map((k) => ({
        key: k,
        title: k.charAt(0).toUpperCase() + k.slice(1),
        sortable,
      }))
    )
  }, [columns, rows, sortable])

  const filtered = useMemo(() => {
    if (!filterText) return rows
    return rows.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(filterText.toLowerCase())
      )
    )
  }, [rows, filterText])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      const cmp = String(va).localeCompare(String(vb))
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const pageRows = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(sorted.length / pageSize)

  return (
    <div className="border rounded-lg overflow-hidden">
      {filterable && (
        <div className="px-4 py-2 bg-gray-50 border-b">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="搜索..."
            className="w-full px-3 py-1.5 rounded border text-sm"
          />
        </div>
      )}
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {cols.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2.5 text-left text-sm font-medium text-gray-600 cursor-pointer select-none"
                onClick={() => {
                  if (!col.sortable) return
                  if (sortKey === col.key) {
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  } else {
                    setSortKey(col.key)
                    setSortDir("asc")
                  }
                }}
              >
                {col.title}
                {col.sortable && sortKey === col.key && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => (
            <tr
              key={i}
              className="border-t hover:bg-gray-50 transition-colors"
            >
              {cols.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-2.5 text-sm text-gray-700"
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between text-sm text-gray-500">
        <span>共 {sorted.length} 条记录</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-0.5 rounded border disabled:opacity-30"
          >
            上一页
          </button>
          <span>
            第 {page + 1}/{totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-0.5 rounded border disabled:opacity-30"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}`,
  "src/app/panels/PanelDashboard.tsx": `import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react"

interface Metric {
  label: string
  value: string
  change: number
  icon: React.ComponentType<{ className?: string }>
}

const METRICS: Metric[] = [
  { label: "总用户", value: "12,847", change: 12.5, icon: Users },
  { label: "月收入", value: "¥128,450", change: -3.2, icon: DollarSign },
  { label: "活跃率", value: "78.3%", change: 5.8, icon: TrendingUp },
]

export default function PanelDashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 grid grid-cols-3 gap-4">
      {METRICS.map((metric) => (
        <div
          key={metric.label}
          className="bg-white rounded-lg border p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{metric.label}</span>
            <metric.icon className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-semibold">{metric.value}</span>
          <div className="flex items-center gap-1 text-sm">
            {metric.change > 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span
              className={
                metric.change > 0 ? "text-emerald-600" : "text-red-600"
              }
            >
              {Math.abs(metric.change)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}`,
  "src/app/panels/PanelSettings.tsx": `import { useState } from "react"
import { Save, RotateCcw } from "lucide-react"

interface Setting {
  key: string
  label: string
  type: "toggle" | "select" | "input"
  value: any
  options?: string[]
}

const DEFAULT_SETTINGS: Setting[] = [
  { key: "theme", label: "主题模式", type: "select", value: "dark", options: ["light", "dark", "auto"] },
  { key: "fontSize", label: "字体大小", type: "input", value: "14" },
  { key: "autoSave", label: "自动保存", type: "toggle", value: true },
  { key: "minimap", label: "代码缩略图", type: "toggle", value: false },
  { key: "wordWrap", label: "自动换行", type: "select", value: "on", options: ["on", "off", "bounded"] },
]

export default function PanelSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">编辑器设置</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-sm text-gray-600 hover:bg-gray-50">
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-600 text-white text-sm hover:bg-violet-700">
            <Save className="w-3.5 h-3.5" />
            保存
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between py-2 border-b">
            <label className="text-sm text-gray-700">{setting.label}</label>
            {setting.type === "toggle" && (
              <button
                onClick={() => updateSetting(setting.key, !setting.value)}
                className={\`w-10 h-5 rounded-full transition-colors \${
                  setting.value ? "bg-violet-600" : "bg-gray-300"
                }\`}
              >
                <div
                  className={\`w-4 h-4 rounded-full bg-white shadow transition-transform \${
                    setting.value ? "translate-x-5" : "translate-x-0.5"
                  }\`}
                />
              </button>
            )}
            {setting.type === "select" && (
              <select
                value={setting.value}
                onChange={(e) => updateSetting(setting.key, e.target.value)}
                className="px-2 py-1 rounded border text-sm"
              >
                {setting.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {setting.type === "input" && (
              <input
                value={setting.value}
                onChange={(e) => updateSetting(setting.key, e.target.value)}
                className="w-20 px-2 py-1 rounded border text-sm text-right"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}`,
  "src/styles/theme.css": `:root {
  --font-size: 16px;
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --primary: #030213;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --border: rgba(0, 0, 0, 0.1);
  --radius: 0.625rem;
}`,
  "src/styles/fonts.css": `/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`,
  "package.json": `{
  "name": "cloudpivot-ai",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.13.0",
    "lucide-react": "^0.487.0",
    "react-resizable-panels": "^2.1.7",
    "@monaco-editor/react": "^4.7.0"
  }
}`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`,
  "vite.config.ts": `import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})`,
};

// Helper to get language from file path
export function getLanguageFromPath(path: string): string {
  if (path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  return "plaintext";
}

// File tree structure
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  lang?: string;
}

export const FILE_TREE: FileNode[] = [
  {
    name: "src",
    path: "src",
    type: "folder",
    children: [
      {
        name: "app",
        path: "src/app",
        type: "folder",
        children: [
          {
            name: "App.tsx",
            path: "src/app/App.tsx",
            type: "file",
            lang: "tsx",
          },
          {
            name: "components",
            path: "src/app/components",
            type: "folder",
            children: [
              {
                name: "Header.tsx",
                path: "src/app/components/Header.tsx",
                type: "file",
                lang: "tsx",
              },
              {
                name: "Sidebar.tsx",
                path: "src/app/components/Sidebar.tsx",
                type: "file",
                lang: "tsx",
              },
              {
                name: "Dashboard.tsx",
                path: "src/app/components/Dashboard.tsx",
                type: "file",
                lang: "tsx",
              },
              {
                name: "DataTable.tsx",
                path: "src/app/components/DataTable.tsx",
                type: "file",
                lang: "tsx",
              },
            ],
          },
          {
            name: "panels",
            path: "src/app/panels",
            type: "folder",
            children: [
              {
                name: "PanelDashboard.tsx",
                path: "src/app/panels/PanelDashboard.tsx",
                type: "file",
                lang: "tsx",
              },
              {
                name: "PanelSettings.tsx",
                path: "src/app/panels/PanelSettings.tsx",
                type: "file",
                lang: "tsx",
              },
            ],
          },
        ],
      },
      {
        name: "styles",
        path: "src/styles",
        type: "folder",
        children: [
          {
            name: "theme.css",
            path: "src/styles/theme.css",
            type: "file",
            lang: "css",
          },
          {
            name: "fonts.css",
            path: "src/styles/fonts.css",
            type: "file",
            lang: "css",
          },
        ],
      },
    ],
  },
  { name: "package.json", path: "package.json", type: "file", lang: "json" },
  { name: "tsconfig.json", path: "tsconfig.json", type: "file", lang: "json" },
  { name: "vite.config.ts", path: "vite.config.ts", type: "file", lang: "ts" },
];
