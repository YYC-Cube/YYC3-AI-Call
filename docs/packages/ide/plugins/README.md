/**
 * @file plugins/README.md
 * @description YYC3 Family AI 插件系统示例插件说明文档
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,documentation
 */

# YYC3 Family AI 示例插件

本目录包含 5 个示例插件，展示如何使用 YYC3 插件系统开发自定义功能。

## 📦 示例插件列表

### 1. 代码统计插件 (CodeStatsPlugin)

**功能**: 统计代码行数、字符数、函数数量等指标

**特点**:
- 📊 实时统计代码行数、注释数、空行数
- 📈 计算代码密度
- 🔢 统计函数、类、导入语句数量
- 💻 可视化统计面板

**使用方式**:
1. 激活插件后，状态栏显示"📊 代码统计"
2. 点击状态栏项或按 `Ctrl+Shift+S` 查看统计
3. 自动监听文件切换，更新统计

---

### 2. 快速修复插件 (QuickFixPlugin)

**功能**: 检测并修复常见代码问题

**特点**:
- 🔍 检测 console.log、debugger 语句
- ⚠️ 检测 TODO/FIXME 注释
- 💡 建议使用 let/const 替代 var
- ✅ 建议严格相等 (===)
- 🚀 一键修复所有问题

**检测类型**:
- `console` - console 语句 (警告)
- `debugger` - debugger 语句 (错误)
- `todo` - TODO 注释 (提示)
- `var` - var 声明 (警告)
- `eqeqeq` - 使用 == (警告)
- `empty-catch` - 空 catch 块 (错误)

**使用方式**:
1. 点击状态栏"✨ 快速修复"或按 `Ctrl+Shift+F`
2. 查看扫描结果
3. 点击"一键修复所有"自动修复

---

### 3. 主题切换器插件 (ThemeSwitcherPlugin)

**功能**: 快速切换预设主题

**预设主题**:
- 🎨 默认深色 (Default Dark)
- 🌃 赛博朋克 (Cyberpunk)
- ☀️ 浅色模式 (Light Mode)
- 🐙 GitHub Dark
- 🧛 Dracula

**特点**:
- 🎨 5 种精美预设主题
- 🔄 快速切换
- 💾 自动保存上次选择
- ⌨️ 快捷键支持 (Ctrl+Shift+T)

**使用方式**:
1. 点击状态栏"🎨 主题"
2. 选择喜欢的主题
3. 使用 `Ctrl+Shift+→/←` 循环切换

---

### 4. AI 助手插件 (AIAssistantPlugin)

**功能**: 集成 AI 对话、代码解释、智能建议

**特点**:
- 💬 AI 对话界面
- 📖 代码解释
- ⚡ 代码优化
- 🧪 生成测试
- 📝 添加注释

**快捷操作**:
- `Ctrl+Shift+A` - 打开 AI 助手
- `Ctrl+Shift+E` - 解释选中代码
- `Ctrl+Shift+O` - 优化选中代码

**使用方式**:
1. 选中代码
2. 右键选择"AI 解释代码"或"AI 优化代码"
3. 查看 AI 分析结果

---

### 5. 文件浏览器增强插件 (FileExplorerPlusPlugin)

**功能**: 提供高级文件管理功能

**特点**:
- 🔖 文件书签管理
- 🕐 最近文件记录
- 🔍 快速文件搜索
- ⌨️ 丰富快捷键支持

**快捷键**:
- `Ctrl+P` - 快速搜索文件
- `Ctrl+B` - 显示书签列表
- `Ctrl+Shift+B` - 切换当前文件书签

**使用方式**:
1. 打开文件后按 `Ctrl+Shift+B` 添加书签
2. 按 `Ctrl+B` 查看所有书签
3. 按 `Ctrl+P` 快速搜索文件

---

## 🚀 开发和测试插件

### 插件结构

每个插件包含以下部分:

```typescript
export const MyPlugin: PluginManifest = {
  id: "my-plugin-id",
  name: "插件名称",
  version: "1.0.0",
  description: "插件描述",
  author: "作者信息",
  license: "MIT",
  tags: ["tag1", "tag2"],
  icon: "IconName",
  
  activate: (context: PluginContext) => {
    // 插件激活时的初始化代码
    return () => {
      // 清理函数 (插件停用时调用)
    };
  },
  
  deactivate: () => {
    // 插件停用时的代码
  },
};
```

### PluginContext API

插件可以通过 `context` 参数访问以下 API:

#### Editor API
- `getActiveFile()` - 获取当前激活的文件路径
- `getFileContent(path)` - 获取文件内容
- `setFileContent(path, content)` - 设置文件内容
- `getSelectedText()` - 获取选中的文本
- `openFile(path)` - 打开文件
- `listFiles()` - 列出所有文件

#### UI API
- `registerStatusBarItem(options)` - 注册状态栏项
- `registerMenuItem(menu, item)` - 注册菜单项
- `showPanel(options)` - 显示面板
- `showToast(message, type)` - 显示提示消息

#### Commands API
- `registerCommand(name, handler)` - 注册命令

#### Events API
- `on(event, handler)` - 监听事件
- `emit(event, ...args)` - 发射事件

### 测试插件

1. **开发环境测试**:
   ```bash
   pnpm dev
   ```

2. **加载插件**:
   - 打开设置页面
   - 进入"插件管理"
   - 启用要测试的插件

3. **查看日志**:
   - 打开浏览器开发者工具
   - 查看 Console 标签
   - 搜索插件名称 (如 `[CodeStats]`)

---

## 📚 扩展阅读

- [插件系统架构](../PluginSystem.ts) - 插件系统核心实现
- [插件开发指南](../../../docs/02-C-YYC3-开发指南-P6-阶段.md) - 详细开发文档
- [类型定义](../types/index.ts) - TypeScript 类型定义

---

## 🤝 贡献插件

欢迎贡献新的示例插件！请遵循以下步骤:

1. Fork 本仓库
2. 创建插件文件 `plugins/MyPlugin.ts`
3. 在本文件中添加插件说明
4. 提交 Pull Request

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**版本**: v1.0.0  
**最后更新**: 2026-03-19  
**维护团队**: YanYuCloudCube Team

</div>
