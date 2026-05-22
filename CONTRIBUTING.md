# YYC³ AI Intelligent Calling - 贡献指南

感谢你对 YYC³ AI Intelligent Calling 项目的关注！本文档将帮助你参与项目开发。

## 开发环境准备

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL 16+
- Redis 7+

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/YY-Nexus/YYC-AI-Intelligent-Calling.git
cd YYC-AI-Intelligent-Calling

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际配置

# 生成 Prisma Client
pnpm db:generate

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3077

## 开发规范

### 代码风格

- 使用 TypeScript strict 模式
- 使用 ESLint + Prettier 统一代码风格
- 提交前自动运行 lint-staged（husky）

```bash
# 手动格式化
pnpm format

# 手动 lint
pnpm lint
```

### 分支管理

- `main` - 生产分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 紧急修复分支

### 提交规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型(type):**

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具变更

### 测试要求

```bash
# 运行单元测试
pnpm test

# 运行测试并查看覆盖率
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e

# 类型检查
pnpm type-check
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   └── ui/               # shadcn/ui 组件库
├── lib/                   # 核心业务逻辑
│   ├── ai-client.ts      # AI 客户端
│   ├── auth/             # 认证模块
│   ├── security/         # 安全模块
│   ├── analytics/        # 数据分析
│   ├── websocket/        # WebSocket
│   └── ...
├── ai-services/           # AI 服务层
├── config/                # 全局配置
├── prisma/                # 数据库 Schema
├── tests/                 # 测试文件
├── docs/                  # 项目文档
└── public/                # 静态资源
```

## Pull Request 流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### PR 检查清单

- [ ] 代码通过 lint 检查
- [ ] 代码通过类型检查
- [ ] 新功能有对应的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档（如有必要）

## 生态包开发

本项目集成了 9 个 YYC³ 生态包，位于 `docs/packages/` 下：

| 包名 | 版本 | 说明 |
|------|------|------|
| @yyc3/core | 1.4.0 | 核心包：认证、MCP、技能系统 |
| @yyc3/ui | 2.0.0 | UI 组件库 |
| @yyc3/ai-hub | 1.4.0 | AI 中枢 |
| @yyc3/plugins | 1.4.0 | 插件集合 |
| @yyc3/i18n-core | 2.4.0 | 国际化框架 |
| @yyc3/emotion | 1.0.0 | 情感引擎 |
| @yyc3/mcp-servers | 1.0.0 | MCP 服务器 |
| @yyc3/motion | 1.0.0 | 动画系统 |
| @yyc3/cli | 1.0.0 | CLI 工具 |

## 许可证

本项目基于 MIT 许可证。详见 [LICENSE](LICENSE) 文件。
