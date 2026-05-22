# Changelog

All notable changes to `@yyc3/plugins` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-04-24

### 🎉 正式发布 (Stable Release — 文档闭环完成)

#### ✨ 新增特性
- **完整文档体系** — README/CHANGELOG/MAINTENANCE 三件套闭环文档
- **全量 API 参考** — 1140 行完整文档，覆盖所有模块
- **架构设计文档** — 分层架构图、模块职责说明
- **5 种快速开始示例** — 获取插件/按语言查找/UI构建/自动化安装/配置面板
- **8 个插件详细清单** — 每个插件的完整配置展示与能力列表
- **Tree Shaking 指南** — 子路径导入优化，体积节省最高 50%
- **使用场景文档** — IDE 插件市场 / 项目初始化向导 / 配置面板
- **开发指南** — 如何添加新的 LSP 插件和内容插件
- **类型定义文档** — LSPPluginConfig 和 ContentPluginConfig 完整接口说明

#### 📖 文档增强
- **README.md** 全量重写 (1140行)
  - 特性概览与竞品对比表 (声明式定义/LSP支持/Tree Shaking)
  - 架构设计图 (LSP + Content 双模块)
  - 5 个快速开始示例 (基础查询/UI组件/自动化脚本)
  - 8 个插件详细配置文档 (4 LSP + 4 Content)
  - 完整导出索引与 API 参考手册
  - 子路径导入优化指南 (~1KB per module)
  - 3 个高级使用场景 (IDE管理器/项目向导/设置面板)
  - 类型定义完整接口文档
  - 开发指南: 扩展新插件的步骤说明
  - 测试覆盖状态与示例代码
- **CHANGELOG.md** 更新至 1.2.0 正式版
- **MAINTENANCE.md** 新建企业级维护指南

#### 🔧 改进
- 文档结构优化，提升可读性和导航体验
- 所有示例代码经过验证，确保可运行性
- 类型安全提示和最佳实践建议

---

## [1.1.0] - 2026-04-23

### 🎉 审计升级版发布（瘦身优化）

#### 新增
- **README.md** — 完整文档：插件清单 + API索引 + 快速开始
- **LICENSE** — MIT License 文件
- **CHANGELOG.md** — 版本变更记录

#### 修复 🔴
- **品牌残留 (17处)**: 全部 `@family-ai/*` → `@yyc3/*`
  - index.ts: @module 注解 + PLUGIN_NAME 常量
  - content/index.ts: @module + 4个插件的 package 字段 (emmet/marked/handlebars/ionic)
  - lsp/index.ts: @module + 4个插件的 package 字段 (python/ruby/rust/swift)
- **仓库地址**: `YYC-Cube/yyc3-family` → `YanYuCloudCube/Family-PAI`
- **homepage/bugs URL** → GitHub 正确链接
- **author**: `YYC` → `YYC³ AI Team <yyc3@family.ai>`
- **publishConfig**: 新增 `registry: https://registry.npmjs.org/`
- **exports 瘦身**: 移除不存在的 ai-hooks/zero-deps/effects 子路径，保留实际存在的 content + lsp
- **files 字段**: 新增 CHANGELOG.md, LICENSE

---

## [1.0.2] - 历史版本

### 功能模块
- **LSP 插件** (4个): Python/Ruby/Rust/Swift 语言服务器定义
- **内容插件** (4个): Emmet/Marked/Handlebars/Ionic 处理器定义
- 每个插件包含: 配置接口、安装命令、能力列表、详细参数

### 测试覆盖
- 1 个测试文件，5 passed

---

[1.2.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/plugins-v1.2.0
[1.1.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/plugins-v1.1.0
[1.0.2]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/plugins-v1.0.2
