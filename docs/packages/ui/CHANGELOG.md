# Changelog

All notable changes to `@yyc3/ui` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-04-24

### 🎉 正式发布 (Stable Release)

#### ✨ 新增特性
- **完整文档体系** — README/CHANGELOG/MAINTENANCE 三件套闭环文档
- **五大模块详解** — Core/Components/Family/Themes 完整 API 文档
- **Tree Shaking 指南** — 子路径导入优化，体积节省最高 82%
- **最佳实践** — 推荐做法与常见问题解答
- **架构设计文档** — 项目结构、模块依赖、数据流说明
- **主题系统文档** — CSS 变量映射、自定义 Token 指南
- **测试覆盖报告** — 25 个测试用例全部通过

#### 📖 文档增强
- **README.md** 全量重写 (1025行)
  - 特性概览与五高架构支撑
  - 安装指南与前置要求
  - 4 种快速开始示例（最简/完整/面板定制/主题系统）
  - 五大模块详细使用示例与 API 文档
  - Tree Shaking 优化指南与体积对比表
  - 完整导出索引与 Hooks API 参考
  - 最佳实践 (推荐/避免) 与 FAQ
  - 贡献指南与开发流程
- **CHANGELOG.md** 更新至 1.1.1 正式版
- **MAINTENANCE.md** 新建维护指南

#### 🔧 关键修复
- **exports 路径错误**: 4条子路径 (`./core`, `./components`, `./family`, `./themes`) 从错误的 `dist/*/index.js` 修正为 `dist/*.js`，修复用户子路径导入 404 问题
- **源码完整性**: 补全 24 个缺失的源码文件至 git（components/core/themes/family/__tests__ 全部模块）

#### 验证结果
- ✅ 7关清洗全部通过：源码完整性 / exports匹配 / 品牌清洁 / 构建 / 测试(25/25) / pack验证
- ✅ npm pack 21 文件完整匹配
- ✅ 文档闭环完成度: 100%

---

## [1.1.0] - 2026-04-23

### 🎉 审计升级版发布

#### 新增
- **README.md** — 基础文档：五大模块说明、API索引、快速开始示例
- **LICENSE** — MIT License 文件
- **CHANGELOG.md** — 版本变更记录

#### 修复 🔴
- **仓库地址**: `YanYuCloud/Family-AI` → `YanYuCloudCube/Family-PAI`（修复404）
- **homepage**: `api.yyccube.com` → GitHub README URL
- **bugs URL**: 对齐到正确仓库 issues 页面
- **author**: `YYC` → `YYC³ AI Team <yyc3@family.ai>`
- **品牌残留**: 3处 `@module @family-ai` 注解 → `@module @yyc3/ui/*`
- **publishConfig**: 新增 `registry: https://registry.npmjs.org/`
- **files 字段**: 新增 CHANGELOG.md, LICENSE

---

## [1.0.2] - 历史版本

### 功能模块
- **Core** — AIFamilyProvider Context、useAIChat/useAgentStatus Hooks
- **Components** — Button/Card/Input/Layout/Modal 五大通用组件
- **Family** — AIFamilyPanel/FamilyLayout/AgentCard/AgentStatus 六大家人组件
- **Themes** — ThemeProvider + light/dark 双主题 + Token 系统

### 测试覆盖
- 2 个测试文件，25 passed

---

## 版本说明

| 版本 | 类型 | 发布日期 | 状态 | 说明 |
|------|------|----------|------|------|
| **1.1.1** | Patch | 2026-04-24 | ✅ Stable | 正式版 — 文档闭环完成 |
| **1.1.0** | Minor | 2026-04-23 | ✅ Stable | 审计升级版 |
| **1.0.2** | Patch | 历史版本 | ⚠️ Legacy | 初始功能版本 |

---

## 变更类型图例

- ✨ 新增特性 (Added)
- 🔄 变更 (Changed)
- 🔧 修复 (Fixed)
- ❌ 移除 (Removed)
- 🔒 安全 (Security)
- 📖 文档 (Documentation)
- 🎉 发布 (Release)

---

[1.1.1]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/ui-v1.1.1
[1.1.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/ui-v1.1.0
[1.0.2]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/ui-v1.0.2
