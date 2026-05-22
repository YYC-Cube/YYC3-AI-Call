/**
 * @file i18n/index.ts
 * @description 国際化システム — 对齐 P3-国际化-多语言支持.md，轻量级 i18n 实现，
 *              支持 zh-CN / en-US / ja-JP 三语，动态切换，Context 驱动
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags i18n,internationalization,locale,translation
 */

// ================================================================
// i18n — 国際化システム
// ================================================================
//
// 对齐：YYC3-Design-Prompt/P3-优化完善/YYC3-P3-国际化-多语言支持.md
//
// 设计：
//   - 轻量级，无外部依赖
//   - 基于嵌套 key 的翻译查找 (dot notation)
//   - Zustand store 管理当前语言
//   - React Hook: useI18n() 提供 t() 函数
//   - 支持插值: t("hello", { name: "YYC³" }) → "你好，YYC³"
//   - 支持复数: t("items", { count: 3 }) → "3 项"
//   - 回退链: 指定语言 → en-US → key 本身
// ================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemo, useCallback } from "react";
import type { SupportedLocale } from "../types";

// ── Types ──

export type { SupportedLocale } from "../types";

export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

// ── Translation Resources ──

const zhCN: TranslationMap = {
  common: {
    confirm: "确认",
    cancel: "取消",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    close: "关闭",
    search: "搜索",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    warning: "警告",
    info: "提示",
    copy: "复制",
    paste: "粘贴",
    undo: "撤销",
    redo: "重做",
    selectAll: "全选",
    noData: "暂无数据",
    more: "更多",
    back: "返回",
    next: "下一步",
    previous: "上一步",
    finish: "完成",
    reset: "重置",
    refresh: "刷新",
    export: "导出",
    import: "导入",
  },
  nav: {
    home: "首页",
    ide: "智能编程",
    aiChat: "AI 工作台",
    templates: "模板中心",
    docs: "文档中心",
    settings: "设置",
    icons: "图标资产",
    notifications: "通知中心",
    projects: "项目管理",
  },
  brand: {
    name: "YYC³ Family AI",
    slogan: "言启象限 | 语枢未来",
    sloganEn: "Words Initiate Quadrants, Language Serves as Core for Future",
    footer: "YanYuCloudCube · 万象归元于云枢 | 深栈智启新纪元",
    description: "智能编程助手 — 多联式低码编程平台",
  },
  ide: {
    newFile: "新建文件",
    newFolder: "新建文件夹",
    openFile: "打开文件",
    saveFile: "保存文件",
    rename: "重命名",
    deleteFile: "删除文件",
    fileTree: "文件树",
    terminal: "终端",
    preview: "预览",
    code: "代码",
    console: "控制台",
    problems: "问题",
    output: "输出",
    search: "搜索",
    replace: "替换",
    goToLine: "跳转到行",
    format: "格式化",
    fold: "折叠",
    unfold: "展开",
    panels: "面板",
    layout: "布局",
    splitHorizontal: "水平拆分",
    splitVertical: "垂直拆分",
    mergePanels: "合并面板",
  },
  ai: {
    send: "发送",
    stop: "停止",
    regenerate: "重新生成",
    thinking: "思考中...",
    generating: "生成中...",
    modelSelect: "选择模型",
    providerSelect: "选择服务商",
    temperature: "温度",
    maxTokens: "最大 Token",
    systemPrompt: "系统提示词",
    chatHistory: "对话历史",
    newChat: "新建对话",
    clearHistory: "清除历史",
    codeGeneration: "代码生成",
    codeReview: "代码审查",
    codeFix: "代码修复",
    codeExplain: "代码解释",
    codeOptimize: "代码优化",
  },
  panels: {
    ai: "AI 对话",
    files: "文件管理",
    code: "代码编辑",
    git: "Git 版本控制",
    agents: "Agent 编排",
    market: "Agent 市场",
    knowledge: "知识库",
    rag: "RAG 对话",
    collab: "协同编辑",
    ops: "运维监控",
    workflow: "工作流",
    preview: "实时预览",
    diagnostics: "错误诊断",
    performance: "性能优化",
    security: "安全扫描",
    testGen: "测试生成",
    quality: "代码质量",
    terminal: "集成终端",
  },
  settings: {
    general: "通用设置",
    appearance: "外观",
    editor: "编辑器",
    aiModels: "AI 模型",
    shortcuts: "快捷键",
    plugins: "插件",
    about: "关于",
    theme: "主题",
    language: "语言",
    fontSize: "字体大小",
    tabSize: "制表符宽度",
    wordWrap: "自动换行",
    minimap: "小地图",
    lineNumbers: "行号",
    autoSave: "自动保存",
    account: "账号信息",
    agents: "智能体",
    mcp: "MCP 连接",
    models: "模型配置",
    context: "上下文管理",
    conversation: "对话流设置",
    rules: "规则管理",
    skills: "技能管理",
    importExport: "导入导出",
    backToHome: "返回首页",
    globalSettings: "全局设置",
    searchPlaceholder: "搜索设置...",
    saveSettings: "保存设置",
    saved: "已保存",
    createNew: "新建",
    addNew: "添加",
    builtIn: "内置",
    custom: "自定义",
    enabled: "已启用",
    disabled: "已禁用",
    configured: "已配置",
    notConfigured: "未配置",
    personal: "个人",
    project: "项目",
    global: "全局",
    dangerZone: "危险操作区",
    clearCache: "清除应用缓存",
    resetAll: "重置所有设置",
    exportConfig: "导出配置",
    importConfig: "导入配置",
    themeNavy: "Navy 深蓝",
    themeCyber: "赛博朋克",
    openThemeEditor: "打开自定义主题编辑器",
    editorFont: "编辑器字体",
    nodeVersion: "Node.js 版本",
    timezone: "时区",
    keybindingScheme: "快捷键方案",
    temperature: "温度",
    maxTokens: "最大 Token",
    systemPrompt: "系统提示词",
    codeReview: "代码审查",
    todoList: "待办清单",
    autoFix: "自动修复代码",
    volume: "音量",
    whitelistCommands: "白名单命令",
    codeIndex: "代码索引",
    ignoreRules: "忽略文件规则",
    documentSets: "文档集",
    includeAgentsMD: "包含 AGENTS.md",
    includeClaudeMD: "包含 CLAUDE.md",
  },
  project: {
    create: "新建项目",
    open: "打开项目",
    recent: "最近项目",
    viewAll: "查看全部",
    rename: "重命名项目",
    delete: "删除项目",
    export: "导出项目",
    import: "导入项目",
    template: "从模板创建",
    blank: "空白项目",
    name: "项目名称",
    description: "项目描述",
    status: {
      active: "活跃",
      draft: "草稿",
      archived: "归档",
    },
  },
  quality: {
    score: "质量评分",
    grade: "等级",
    diagnostics: "诊断问题",
    performance: "性能问题",
    security: "安全问题",
    tests: "测试覆盖",
    fix: "修复",
    autoFix: "自动修复",
    aiFix: "AI 修复",
    ignore: "忽略",
  },
  quickActions: {
    title: "快速操作",
    clipboard: "剪贴板历史",
    copyCode: "复制代码",
    copyMarkdown: "复制为 Markdown",
    copyHTML: "复制为 HTML",
    formatCode: "格式化代码",
    aiRefactor: "AI 重构",
    aiOptimize: "AI 优化",
    aiExplain: "AI 解释",
    generateTest: "生成测试",
    generateDoc: "生成文档",
    translate: "AI 翻译",
    rewrite: "AI 改写",
    summarize: "AI 摘要",
    formatDoc: "格式化文档",
    convertDoc: "格式转换",
    linesSelected: "行已选中",
    noSelection: "选择代码或文本以查看可用操作",
    shortcutHint: "Ctrl+Shift+A 切换",
  },
};

const enUS: TranslationMap = {
  common: {
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    search: "Search",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    copy: "Copy",
    paste: "Paste",
    undo: "Undo",
    redo: "Redo",
    selectAll: "Select All",
    noData: "No Data",
    more: "More",
    back: "Back",
    next: "Next",
    previous: "Previous",
    finish: "Finish",
    reset: "Reset",
    refresh: "Refresh",
    export: "Export",
    import: "Import",
  },
  nav: {
    home: "Home",
    ide: "IDE",
    aiChat: "AI Workspace",
    templates: "Templates",
    docs: "Docs",
    settings: "Settings",
    icons: "Icon Assets",
    notifications: "Notifications",
    projects: "Projects",
  },
  brand: {
    name: "YYC³ Family AI",
    slogan: "Words Initiate Quadrants | Language Serves as Core for Future",
    sloganEn: "Words Initiate Quadrants, Language Serves as Core for Future",
    footer:
      "YanYuCloudCube · All Returns to Cloud Hub | Deep Stack Ignites New Era",
    description: "AI Programming Assistant — Multi-panel Low-code Platform",
  },
  ide: {
    newFile: "New File",
    newFolder: "New Folder",
    openFile: "Open File",
    saveFile: "Save File",
    rename: "Rename",
    deleteFile: "Delete File",
    fileTree: "File Tree",
    terminal: "Terminal",
    preview: "Preview",
    code: "Code",
    console: "Console",
    problems: "Problems",
    output: "Output",
    search: "Search",
    replace: "Replace",
    goToLine: "Go to Line",
    format: "Format",
    fold: "Fold",
    unfold: "Unfold",
    panels: "Panels",
    layout: "Layout",
    splitHorizontal: "Split Horizontal",
    splitVertical: "Split Vertical",
    mergePanels: "Merge Panels",
  },
  ai: {
    send: "Send",
    stop: "Stop",
    regenerate: "Regenerate",
    thinking: "Thinking...",
    generating: "Generating...",
    modelSelect: "Select Model",
    providerSelect: "Select Provider",
    temperature: "Temperature",
    maxTokens: "Max Tokens",
    systemPrompt: "System Prompt",
    chatHistory: "Chat History",
    newChat: "New Chat",
    clearHistory: "Clear History",
    codeGeneration: "Code Generation",
    codeReview: "Code Review",
    codeFix: "Code Fix",
    codeExplain: "Code Explanation",
    codeOptimize: "Code Optimization",
  },
  panels: {
    ai: "AI Chat",
    files: "File Manager",
    code: "Code Editor",
    git: "Git Version Control",
    agents: "Agent Orchestrator",
    market: "Agent Market",
    knowledge: "Knowledge Base",
    rag: "RAG Chat",
    collab: "Collaboration",
    ops: "Operations",
    workflow: "Workflow",
    preview: "Live Preview",
    diagnostics: "Diagnostics",
    performance: "Performance",
    security: "Security Scan",
    testGen: "Test Generator",
    quality: "Code Quality",
    terminal: "Terminal",
  },
  settings: {
    general: "General",
    appearance: "Appearance",
    editor: "Editor",
    aiModels: "AI Models",
    shortcuts: "Shortcuts",
    plugins: "Plugins",
    about: "About",
    theme: "Theme",
    language: "Language",
    fontSize: "Font Size",
    tabSize: "Tab Size",
    wordWrap: "Word Wrap",
    minimap: "Minimap",
    lineNumbers: "Line Numbers",
    autoSave: "Auto Save",
    account: "Account Information",
    agents: "Agents",
    mcp: "MCP Connection",
    models: "Model Configuration",
    context: "Context Management",
    conversation: "Conversation Settings",
    rules: "Rule Management",
    skills: "Skill Management",
    importExport: "Import/Export",
    backToHome: "Back to Home",
    globalSettings: "Global Settings",
    searchPlaceholder: "Search settings...",
    saveSettings: "Save Settings",
    saved: "Saved",
    createNew: "Create New",
    addNew: "Add New",
    builtIn: "Built-in",
    custom: "Custom",
    enabled: "Enabled",
    disabled: "Disabled",
    configured: "Configured",
    notConfigured: "Not Configured",
    personal: "Personal",
    project: "Project",
    global: "Global",
    dangerZone: "Danger Zone",
    clearCache: "Clear App Cache",
    resetAll: "Reset All Settings",
    exportConfig: "Export Configuration",
    importConfig: "Import Configuration",
    themeNavy: "Navy Blue",
    themeCyber: "Cyberpunk",
    openThemeEditor: "Open Custom Theme Editor",
    editorFont: "Editor Font",
    nodeVersion: "Node.js Version",
    timezone: "Timezone",
    keybindingScheme: "Keybinding Scheme",
    temperature: "Temperature",
    maxTokens: "Max Tokens",
    systemPrompt: "System Prompt",
    codeReview: "Code Review",
    todoList: "To-Do List",
    autoFix: "Auto Fix Code",
    volume: "Volume",
    whitelistCommands: "Whitelist Commands",
    codeIndex: "Code Index",
    ignoreRules: "Ignore File Rules",
    documentSets: "Document Sets",
    includeAgentsMD: "Include AGENTS.md",
    includeClaudeMD: "Include CLAUDE.md",
  },
  project: {
    create: "New Project",
    open: "Open Project",
    recent: "Recent Projects",
    viewAll: "View All",
    rename: "Rename Project",
    delete: "Delete Project",
    export: "Export Project",
    import: "Import Project",
    template: "From Template",
    blank: "Blank Project",
    name: "Project Name",
    description: "Description",
    status: {
      active: "Active",
      draft: "Draft",
      archived: "Archived",
    },
  },
  quality: {
    score: "Quality Score",
    grade: "Grade",
    diagnostics: "Diagnostics",
    performance: "Performance",
    security: "Security",
    tests: "Test Coverage",
    fix: "Fix",
    autoFix: "Auto Fix",
    aiFix: "AI Fix",
    ignore: "Ignore",
  },
  quickActions: {
    title: "Quick Actions",
    clipboard: "Clipboard History",
    copyCode: "Copy Code",
    copyMarkdown: "Copy as Markdown",
    copyHTML: "Copy as HTML",
    formatCode: "Format Code",
    aiRefactor: "AI Refactor",
    aiOptimize: "AI Optimize",
    aiExplain: "AI Explain",
    generateTest: "Generate Test",
    generateDoc: "Generate Documentation",
    translate: "AI Translate",
    rewrite: "AI Rewrite",
    summarize: "AI Summarize",
    formatDoc: "Format Documentation",
    convertDoc: "Convert Format",
    linesSelected: "Lines Selected",
    noSelection: "Select code or text to see available actions",
    shortcutHint: "Ctrl+Shift+A to toggle",
  },
};

const jaJP: TranslationMap = {
  common: {
    confirm: "確認",
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    edit: "編集",
    close: "閉じる",
    search: "検索",
    loading: "読み込み中...",
    error: "エラー",
    success: "成功",
    warning: "警告",
    info: "情報",
    copy: "コピー",
    paste: "貼り付け",
    undo: "元に戻す",
    redo: "やり直し",
    selectAll: "すべて選択",
    noData: "データなし",
    more: "もっと見る",
    back: "戻る",
    next: "次へ",
    previous: "前へ",
    finish: "完了",
    reset: "リセット",
    refresh: "更新",
    export: "エクスポート",
    import: "インポート",
  },
  nav: {
    home: "ホーム",
    ide: "IDE",
    aiChat: "AI ワークスペース",
    templates: "テンプレート",
    docs: "ドキュメント",
    settings: "設定",
    icons: "アイコン",
    notifications: "通知",
    projects: "プロジェクト",
  },
  brand: {
    name: "YYC³ Family AI",
    slogan: "言葉が象限を開く | 言語が未来の核心",
    sloganEn: "Words Initiate Quadrants, Language Serves as Core for Future",
    footer: "YanYuCloudCube · すべてはクラウドハブに帰す",
    description:
      "AI プログラミングアシスタント — マルチパネルローコードプラットフォーム",
  },
  ide: {
    newFile: "新規ファイル",
    newFolder: "新規フォルダ",
    openFile: "ファイルを開く",
    saveFile: "ファイルを保存",
    rename: "名前変更",
    deleteFile: "ファイルを削除",
    fileTree: "ファイルツリー",
    terminal: "ターミナル",
    preview: "プレビュー",
    code: "コード",
    console: "コンソール",
    problems: "問題",
    output: "出力",
    search: "検索",
    replace: "置換",
    goToLine: "行に移動",
    format: "フォーマット",
    fold: "折りたたむ",
    unfold: "展開",
    panels: "パネル",
    layout: "レイアウト",
    splitHorizontal: "水平分割",
    splitVertical: "垂直分割",
    mergePanels: "パネルを結合",
  },
  ai: {
    send: "送信",
    stop: "停止",
    regenerate: "再生成",
    thinking: "思考中...",
    generating: "生成中...",
    modelSelect: "モデル選択",
    providerSelect: "プロバイダ選択",
    temperature: "温度",
    maxTokens: "最大トークン",
    systemPrompt: "システムプロンプト",
    chatHistory: "チャット履歴",
    newChat: "新規チャット",
    clearHistory: "履歴をクリア",
    codeGeneration: "コード生成",
    codeReview: "コードレビュー",
    codeFix: "コード修正",
    codeExplain: "コード解説",
    codeOptimize: "コード最適化",
  },
  panels: {
    ai: "AI チャット",
    files: "ファイル管理",
    code: "コードエディタ",
    git: "Gitバージョン管理",
    agents: "エージェント",
    market: "マーケット",
    knowledge: "ナレッジベース",
    rag: "RAGチャット",
    collab: "コラボレーション",
    ops: "運用",
    workflow: "ワークフロー",
    preview: "ライブプレビュー",
    diagnostics: "診断",
    performance: "パフォーマンス",
    security: "セキュリティ",
    testGen: "テスト生成",
    quality: "コード品質",
    terminal: "ターミナル",
  },
  settings: {
    general: "一般",
    appearance: "外観",
    editor: "エディタ",
    aiModels: "AIモデル",
    shortcuts: "ショートカット",
    plugins: "プラグイン",
    about: "概要",
    theme: "テーマ",
    language: "言語",
    fontSize: "フォントサイズ",
    tabSize: "タブサイズ",
    wordWrap: "ワードラップ",
    minimap: "ミニマップ",
    lineNumbers: "行番号",
    autoSave: "自動保存",
    account: "アカウント情報",
    agents: "エージェント",
    mcp: "MCP接続",
    models: "モデル設定",
    context: "コンテキスト管理",
    conversation: "会話フロー設定",
    rules: "ルール管理",
    skills: "スキル管理",
    importExport: "インポート/エクスポート",
    backToHome: "ホームに戻る",
    globalSettings: "グローバル設定",
    searchPlaceholder: "設定を検索...",
    saveSettings: "設定を保存",
    saved: "保存されました",
    createNew: "新規作成",
    addNew: "追加",
    builtIn: "組み込み",
    custom: "カスタム",
    enabled: "有効",
    disabled: "無効",
    configured: "設定済み",
    notConfigured: "未設定",
    personal: "個人",
    project: "プロジェクト",
    global: "グローバル",
    dangerZone: "危険ゾーン",
    clearCache: "アプリケーションキャッシュをクリア",
    resetAll: "すべての設定をリセット",
    exportConfig: "設定をエクスポート",
    importConfig: "設定をインポート",
    themeNavy: "ナビーグレー",
    themeCyber: "サイバーパンク",
    openThemeEditor: "カスタムテーマエディタを開く",
    editorFont: "エディタフォント",
    nodeVersion: "Node.jsバージョン",
    timezone: "タイムゾーン",
    keybindingScheme: "キーバインディングスキーム",
    temperature: "温度",
    maxTokens: "最大トークン",
    systemPrompt: "システムプロンプト",
    codeReview: "コードレビュー",
    todoList: "TODOリスト",
    autoFix: "コードの自動修正",
    volume: "音量",
    whitelistCommands: "ホワイトリストコマンド",
    codeIndex: "コードインデックス",
    ignoreRules: "無視ファイルルール",
    documentSets: "ドキュメントセット",
    includeAgentsMD: "AGENTS.mdを含む",
    includeClaudeMD: "CLAUDE.mdを含む",
  },
  project: {
    create: "新規プロジェクト",
    open: "プロジェクトを開く",
    recent: "最近のプロジェクト",
    viewAll: "すべて表示",
    rename: "プロジェクト名変更",
    delete: "プロジェクトを削除",
    export: "エクスポート",
    import: "インポート",
    template: "テンプレートから作成",
    blank: "空白プロジェクト",
    name: "プロジェクト名",
    description: "説明",
    status: {
      active: "アクティブ",
      draft: "ドラフト",
      archived: "アーカイブ",
    },
  },
  quality: {
    score: "品質スコア",
    grade: "グレード",
    diagnostics: "診断",
    performance: "パフォーマンス",
    security: "セキュリティ",
    tests: "テストカバレッジ",
    fix: "修正",
    autoFix: "自動修正",
    aiFix: "AI修正",
    ignore: "無視",
  },
  quickActions: {
    title: "クイックアクション",
    clipboard: "クリップボード履歴",
    copyCode: "コードをコピー",
    copyMarkdown: "Markdown としてコピー",
    copyHTML: "HTML としてコピー",
    formatCode: "コードをフォーマット",
    aiRefactor: "AI によるリファクタリング",
    aiOptimize: "AI による最適化",
    aiExplain: "AI による説明",
    generateTest: "テストを生成",
    generateDoc: "ドキュメントを生成",
    translate: "AI による翻訳",
    rewrite: "AI による書き換え",
    summarize: "AI による要約",
    formatDoc: "ドキュメントをフォーマット",
    convertDoc: "フォーマットを変換",
    linesSelected: "行が選択されました",
    noSelection: "コードやテキストを選択して利用可能なアクションを確認",
    shortcutHint: "Ctrl+Shift+A で切り替え",
  },
};

// ── Resource Map ──

const RESOURCES: Record<SupportedLocale, TranslationMap> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "ja-JP": jaJP,
};

// ── Locale metadata ──

export const LOCALE_OPTIONS: Array<{
  value: SupportedLocale;
  label: string;
  nativeLabel: string;
  flag: string;
}> = [
  {
    value: "zh-CN",
    label: "Simplified Chinese",
    nativeLabel: "简体中文",
    flag: "🇨🇳",
  },
  { value: "en-US", label: "English", nativeLabel: "English", flag: "🇺🇸" },
  { value: "ja-JP", label: "Japanese", nativeLabel: "日本語", flag: "🇯🇵" },
];

// ── Translation lookup ──

function getNestedValue(obj: TranslationMap, path: string): string | undefined {
  const parts = path.split(".");
  let current: TranslationMap | string = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as TranslationMap)[part] as TranslationMap | string;
    if (current === undefined) return undefined;
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{{${key}}}`;
  });
}

// ── Zustand Store ──

interface I18nState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: "zh-CN",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "yyc3_i18n" },
  ),
);

// ── React Hook ──

/** t() function: translate a key with optional interpolation params */
export function useI18n() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Try current locale
      let value = getNestedValue(RESOURCES[locale], key);
      // Fallback to en-US
      if (value === undefined && locale !== "en-US") {
        value = getNestedValue(RESOURCES["en-US"], key);
      }
      // Fallback to key itself
      if (value === undefined) return key;

      return params ? interpolate(value, params) : value;
    },
    [locale],
  );

  return useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);
}

/** Get translation outside React (for services/utilities) */
export function translate(
  key: string,
  params?: Record<string, string | number>,
  locale?: SupportedLocale,
): string {
  const currentLocale = locale || useI18nStore.getState().locale;
  let value = getNestedValue(RESOURCES[currentLocale], key);
  if (value === undefined && currentLocale !== "en-US") {
    value = getNestedValue(RESOURCES["en-US"], key);
  }
  if (value === undefined) return key;
  return params ? interpolate(value, params) : value;
}
