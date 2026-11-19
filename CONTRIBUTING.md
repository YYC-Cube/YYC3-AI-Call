# YYC³ AI Intelligent Calling — 贡献指南

> **YYC³**（YanYuCloudCube™）· 言启象限 | 语枢未来
> _Words Initiate Quadrants, Language Serves as Core for Future_

感谢你对 YYC³ AI Intelligent Calling 项目的关注！本文档帮助你快速参与项目开发。参与前请先阅读 [行为准则](CODE_OF_CONDUCT.md)。

## 开发环境准备

### 前置要求

- Node.js **>= 20.0.0**
- pnpm **>= 8.0.0**（禁止切换包管理器）
- PostgreSQL 16+（主备部署均为 **5433** 端口）
- Redis 7+（支持 `YYC3_REDIS_HOST/PORT/PASSWORD` 环境变量注入）

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/YYC-Cube/YYC3-AI-Call.git
cd YYC3-AI-Call

# 安装依赖
pnpm install

# 配置环境变量（模板已对齐主备环境：端口 5433 / schema yyc3_v2）
cp .env.example .env.local
# 编辑 .env.local 填入实际配置（禁止提交真实凭证）

# 生成 Prisma Client
pnpm db:generate

# 主备/Tailscale 环境（推荐）
export YYC3_NAS_PG_HOST=<NAS_MagicDNS名称>
pnpm db:migrate:yyc3      # 迁移（migrator 角色）
pnpm dev:yyc3             # 运行时（app 角色，端口 3077）

# 或本地默认方式
pnpm dev                  # http://localhost:3077
```

> 数据库采用**角色分离**：运行时 `yyc3_ai_call_app`（仅 DML）、迁移 `yyc3_ai_call_migrator`（schema owner）。凭证保存在仓库外 `~/yyc3-secrets/`，详见 [README](README.md#deployment)。

## 开发规范

### 代码风格

- TypeScript strict 模式
- ESLint + Prettier 统一风格；提交前自动运行 lint-staged（husky）
- 新增依赖禁止使用 `latest` 版本号；禁止引入 Supabase/Firebase 等 BaaS

```bash
pnpm format      # 格式化
pnpm lint        # 静态检查
pnpm type-check  # 类型检查
```

### 分支管理

- `main` — 生产分支（受 CI 保护）
- `develop` — 集成分支（可选）
- `feature/*` / `bugfix/*` / `refactor/*` — 功能/修复/重构分支
- `hotfix/*` — 紧急修复分支

### 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

[body]

[footer]
```

**类型**：`feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore`

### 测试要求

```bash
pnpm test            # 单元测试（Jest，默认仅 tests/unit）
pnpm test:coverage   # 覆盖率
pnpm test:integration
pnpm test:e2e        # Playwright（baseURL 3077）
pnpm type-check
```

**门禁**：lint 0 error、类型检查通过、单元测试全绿、`pnpm build` 成功。

## 项目结构

```
├── app/                    # Next.js App Router（18 个 API 路由）
├── components/            # React 组件（含 shadcn/ui）
├── lib/                   # 核心业务逻辑（auth / ai-family / mcp / multimodal / tenant / websocket / security / analytics / cache）
├── ai-services/           # AI 服务层（LLM/ASR/TTS/NLP）
├── config/                # 全局配置
├── prisma/                # 数据库 Schema 与迁移（基线 schema：yyc3_v2）
├── scripts/               # 运维脚本（use-yyc3-db*.sh 连接助手）
├── tests/                 # unit / integration / e2e / performance
├── docs/                  # 项目文档（需求→架构→设计→测试→部署→运维 全周期）
└── public/                # 静态资源（PWA）
```

## Pull Request 流程

1. Fork 本仓库并创建功能分支（`git checkout -b feature/amazing-feature`）
2. 提交变更（`git commit -m 'feat: add amazing feature'`）
3. 推送并创建 Pull Request 至 `main`
4. 等待 CI（lint → type-check → unit tests → build）通过

### PR 检查清单

- [ ] 通过 `pnpm lint`（0 error）与 `pnpm type-check`
- [ ] 新功能有对应测试，`pnpm test` 全绿
- [ ] 涉及数据库时：通过 `pnpm db:migrate:yyc3` 应用迁移并保持 `yyc3_v2` 与 schema.prisma 一致
- [ ] 未硬编码任何 IP / 密钥 / 凭证（配置一律环境变量注入）
- [ ] 更新了相关文档（如有必要）

## 生态包开发

`docs/packages/` 下集成 8 个运行时包 + 1 个开发工具（独立 lockfile，各自安装测试）：

| 包名 | 说明 |
|------|------|
| @yyc3/core | 核心包：认证、MCP、技能系统（Zod 4） |
| @yyc3/ui | UI 组件库 |
| @yyc3/ai-hub | AI 中枢（Zod 4） |
| @yyc3/plugins | 插件集合 |
| @yyc3/i18n-core | 国际化框架 |
| @yyc3/emotion | 情感引擎 |
| @yyc3/mcp-servers | MCP 服务器 |
| @yyc3/motion | 动画系统 |
| @yyc3/cli | CLI 工具（Zod 3，待 @modelcontextprotocol/sdk 支持 Zod 4 后升级） |

## 安全问题

请勿在公开 Issue 中报告安全漏洞，参见 [安全策略](SECURITY.md)。

## 许可证

本项目基于 [MIT 许可证](LICENSE) 发布。提交即表示你同意贡献内容以同一许可证授权。

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
