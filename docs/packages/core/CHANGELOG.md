# Changelog

All notable changes to `@yyc3/core` will be documented in this file.

## [1.3.0] - 2026-04-23

### 🎉 首次正式发布 (审计升级版)

#### 新增
- **README.md** — 完整文档：八位家人介绍、六大模块说明、API索引、快速开始
- **LICENSE** — MIT License 文件
- **CHANGELOG.md** — 版本变更记录

#### 修复 🔴
- **仓库地址**: `YanYuCloud/Family-AI` → `YanYuCloudCube/Family-PAI`（修复404）
- **homepage**: `api.yyccube.com` → GitHub README URL
- **bugs URL**: 对齐到正确仓库 issues 页面
- **author**: `YYC` → `YYC³ AI Team <yyc3@family.ai>`
- **VERSION 常量**: `'2.0.0'` → `'1.3.0'`（与 package.json 一致）
- **PACKAGE_INFO.author**: 同步更新为 `YYC³ AI Team`
- **files 字段**: 新增 `CHANGELOG.md`, `LICENSE`

---

## [1.2.0] - 历史版本

### 功能模块
- 统一认证系统 (`auth/`) — OpenAI/Ollama/Anthropic 多Provider支持
- AI Family 智能体系统 (`ai-family/`) — 八位家人定义、路由、协作、质量门控
- 技能系统 (`skills/`) — 内置技能、行业技能(18+)、推荐/学习/组合
- MCP 协议客户端 (`mcp/`) — StdioTransport、工具调用、资源管理
- 多模态处理 (`multimodal/`) — 图像/音频/文档统一接口
- 快速启动 (`setup/`) — 自动检测、智能选择、零配置启动

### 测试覆盖
- 10 个测试文件，207 passed / 5 skipped

---

[1.3.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/core-v1.3.0
[1.2.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/core-v1.2.0
