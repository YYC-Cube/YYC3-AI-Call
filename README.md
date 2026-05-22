# YYC³ AI Intelligent Calling

<div align="center">

![YYC³ AI Intelligent Calling](public/yyc3-article-cover-2.png)

> **_YanYuCloudCube_**
> 言启象限 | 语枢未来

> **_Words Initiate Quadrants, Language Serves as Core for the Future_**

> 万象归元于云枢 | 深栈智启新纪元

> **_All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence_**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-8+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/YYC-Cube/yyc3-ai-call/graphs/commit-activity)

**AI 驱动的智能外呼系统 | Intelligent Calling System Powered by AI**

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [技术架构](#-技术架构) • [API 文档](#-api-文档) • [贡献指南](#-贡献指南)

</div>

---

## 📋 目录导航

- [项目概述](#-项目概述)
- [功能特性](#-功能特性)
- [技术架构](#-技术架构)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [开发指南](#-开发指南)
- [API 文档](#-api-文档)
- [部署指南](#-部署指南)
- [测试规范](#-测试规范)
- [贡献指南](#-贡献指南)
- [常见问题](#-常见问题)
- [许可证](#-许可证)

---

## 📖 项目概述

YYC³ AI Intelligent Calling 是一个**企业级智能外呼系统**，基于先进的人工智能技术和现代化的技术栈构建。系统采用 **Next.js 14** 全栈框架，集成 **Zhipu AI**（智谱AI）大模型和 **vLLM** 本地推理引擎，为教育机构、企业客服、医疗健康等行业提供高效、智能、安全的自动化呼叫解决方案。

### 核心价值主张

- **🧠 智能化**：深度集成 Zhipu AI 大模型，支持自然语言理解、意图识别、情感分析，实现类人对话体验
- **⚡ 高效性**：全流程自动化外呼管理，智能任务调度，大幅降低人工成本，提升运营效率 300%+
- **🔧 可扩展**：模块化微服务架构，支持灵活定制和扩展，快速适配不同业务场景
- **🔒 安全性**：企业级安全防护体系，端到端数据加密，符合 GDPR、ISO 27001 等国际标准
- **📊 数据驱动**：实时数据分析与可视化，多维度洞察业务指标，支持科学决策

### 典型应用场景

- 🎓 **教育培训**：课程推广、学员回访、学习提醒、缴费通知、满意度调查
- 🏢 **企业客服**：客户关怀、售后回访、意见收集、产品推荐、续费提醒
- 🏥 **医疗健康**：预约提醒、复诊通知、随访管理、健康宣教、用药指导
- 💼 **金融保险**：信用卡激活、保单续保、理财推荐、风险评估、满意度调研
- 📊 **市场调研**：问卷调查、数据采集、用户反馈、市场分析、竞品研究

---

## ✨ 功能特性

### 核心功能

| 功能模块            | 描述                          | 状态      |
| ------------------- | ----------------------------- | --------- |
| 🤖 **智能对话引擎** | 基于 NLP 的自然语言理解和生成 | ✅ 已实现 |
| 📞 **外呼管理系统** | 批量外呼任务管理和调度        | ✅ 已实现 |
| 📊 **数据分析平台** | 实时数据监控和可视化分析      | ✅ 已实现 |
| 👥 **客户管理**     | 完整的客户信息管理和画像      | ✅ 已实现 |
| 🎯 **意图识别**     | 多维度意图分类和路由          | ✅ 已实现 |
| 🔔 **智能提醒**     | 个性化提醒和通知服务          | ✅ 已实现 |

### 技术亮点

- **高可用架构**：分布式微服务架构，支持高并发访问
- **实时通信**：WebSocket 实时通信，低延迟响应
- **智能路由**：基于规则的智能路由和负载均衡
- **数据安全**：端到端加密，符合 GDPR 等数据保护标准
- **可观测性**：完整的日志、监控和告警体系

---

## 🏗️ 技术架构

### 技术栈

#### 前端技术

```yaml
框架: Next.js 15.2.4 (App Router)
语言: TypeScript 5.0
UI 库: React 19.0
样式: Tailwind CSS 3.4
组件库: Radix UI
状态管理: React Hooks
表单处理: React Hook Form + Zod
图表: Recharts
```

#### 后端技术

```yaml
运行时: Node.js 18+
框架: Next.js API Routes
数据库: PostgreSQL
缓存: Redis
队列: Bull Queue
```

#### 开发工具

```yaml
包管理器: pnpm
代码检查: ESLint + Prettier
类型检查: TypeScript
测试框架: Jest + Playwright
版本控制: Git + Husky
容器化: Docker + Docker Compose
```

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 学生端   │  │ 教师端   │  │ 家长端   │  │ 管理端   │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       网关层 (API Gateway)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  认证授权  │  限流熔断  │  路由转发  │  日志审计      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       应用层 (Microservices)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 用户服务 │  │ 外呼服务 │  │ 数据服务 │  │ 分析服务 │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 消息服务 │  │ 任务服务 │  │ 报表服务 │  │ 配置服务 │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       数据层 (Data Layer)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │PostgreSQL│  │  Redis   │  │  MinIO   │  │  Elastic │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0
Docker >= 20.10.0 (可选)
```

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/YYC-Cube/yyc3-ai-call.git
cd yyc3-ai-call
```

#### 2. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的环境变量
```

#### 4. 启动开发服务器

```bash
# 开发模式
pnpm dev

# 或
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

#### 5. 构建生产版本

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

---

## 📁 项目结构

```
yyc3-ai-call/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 认证相关
│   │   ├── calling/              # 外呼相关
│   │   ├── customer/             # 客户管理
│   │   └── analytics/            # 数据分析
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页
│   └── globals.css               # 全局样式
├── components/                   # React 组件
│   ├── ui/                       # UI 组件库
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── theme-provider.tsx        # 主题提供者
├── lib/                          # 工具库
│   ├── db.ts                     # 数据库配置
│   ├── redis.ts                  # Redis 配置
│   └── utils.ts                  # 工具函数
├── types/                        # TypeScript 类型定义
│   ├── api.ts                    # API 类型
│   ├── models.ts                 # 数据模型
│   └── index.ts                  # 类型导出
├── hooks/                        # React Hooks
│   ├── useAuth.ts                # 认证 Hook
│   ├── useCalling.ts             # 外呼 Hook
│   └── ...
├── utils/                        # 工具函数
│   ├── format.ts                 # 格式化函数
│   ├── validation.ts             # 验证函数
│   └── ...
├── docs/                         # 项目文档
│   ├── YYC³团队文档标准化审核规范.md
│   ├── YYC3-AI-Call-API文档/
│   ├── YYC3-AI-Call-产品文档/
│   ├── YYC3-AI-Call-架构设计/
│   └── ...
├── public/                       # 静态资源
│   ├── yyc3-article-cover-2.png  # 封面图
│   └── ...
├── scripts/                      # 脚本文件
│   ├── deploy.ts                 # 部署脚本
│   └── ...
├── tests/                        # 测试文件
│   ├── unit/                     # 单元测试
│   ├── integration/              # 集成测试
│   └── e2e/                      # E2E 测试
├── .env.example                  # 环境变量示例
├── .gitignore                    # Git 忽略文件
├── Dockerfile                    # Docker 配置
├── docker-compose.yml            # Docker Compose 配置
├── next.config.js                # Next.js 配置
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
├── tailwind.config.ts            # Tailwind CSS 配置
└── README.md                     # 项目说明
```

---

## 💻 开发指南

### 代码规范

#### TypeScript 规范

```typescript
/**
 * @fileoverview 用户服务模块
 * @description 处理用户相关的业务逻辑
 * @module services/user
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { z } from "zod";

// 使用 Zod 进行数据验证
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
});

type User = z.infer<typeof UserSchema>;

/**
 * 获取用户信息
 * @param userId - 用户 ID
 * @returns 用户信息
 * @throws {Error} 当用户不存在时抛出错误
 */
export async function getUserById(userId: string): Promise<User> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error(`用户 ${userId} 不存在`);
  }
  return user;
}
```

#### 组件开发规范

```typescript
/**
 * @fileoverview 用户卡片组件
 * @description 展示用户信息的卡片组件
 * @module components/UserCard
 * @author YYC³
 * @version 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserCardProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit?: (userId: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{user.email}</p>
        {onEdit && (
          <button onClick={() => onEdit(user.id)}>
            编辑
          </button>
        )}
      </CardContent>
    </Card>
  );
}
```

### 可用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 代码质量
pnpm lint             # 运行 ESLint
pnpm lint:fix         # 自动修复 ESLint 问题
pnpm format           # 格式化代码
pnpm format:check     # 检查代码格式
pnpm type-check       # TypeScript 类型检查

# 测试
pnpm test             # 运行测试
pnpm test:watch       # 监听模式运行测试
pnpm test:coverage    # 生成测试覆盖率报告
pnpm test:e2e         # 运行 E2E 测试

# 数据库
pnpm db:migrate       # 运行数据库迁移
pnpm db:seed          # 填充测试数据

# 部署
pnpm deploy:dev       # 部署到开发环境
pnpm deploy:staging   # 部署到预发布环境
pnpm deploy:prod      # 部署到生产环境

# Docker
pnpm docker:build     # 构建 Docker 镜像
pnpm docker:run       # 启动 Docker 容器
pnpm docker:stop      # 停止 Docker 容器
pnpm docker:logs      # 查看 Docker 日志
```

---

## 📚 API 文档

### RESTful API

系统提供完整的 RESTful API，支持以下主要端点：

#### 认证相关

```http
POST   /api/auth/login       # 用户登录
POST   /api/auth/logout      # 用户登出
POST   /api/auth/refresh     # 刷新令牌
GET    /api/auth/profile     # 获取用户信息
PUT    /api/auth/profile     # 更新用户信息
```

#### 外呼管理

```http
GET    /api/calling/tasks        # 获取外呼任务列表
POST   /api/calling/tasks        # 创建外呼任务
GET    /api/calling/tasks/:id    # 获取任务详情
PUT    /api/calling/tasks/:id    # 更新任务
DELETE /api/calling/tasks/:id    # 删除任务
POST   /api/calling/tasks/:id/start    # 启动任务
POST   /api/calling/tasks/:id/stop     # 停止任务
```

#### 客户管理

```http
GET    /api/customers        # 获取客户列表
POST   /api/customers        # 创建客户
GET    /api/customers/:id    # 获取客户详情
PUT    /api/customers/:id    # 更新客户信息
DELETE /api/customers/:id    # 删除客户
```

#### 数据分析

```http
GET    /api/analytics/overview       # 获取概览数据
GET    /api/analytics/call-stats     # 获取通话统计
GET    /api/analytics/conversion     # 获取转化率
GET    /api/analytics/reports/:id    # 获取报告详情
```

### API 认证

所有 API 请求都需要在 Header 中包含认证令牌：

```http
Authorization: Bearer <your-access-token>
```

### 响应格式

成功响应：

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "示例数据"
  },
  "message": "操作成功"
}
```

错误响应：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

详细的 API 文档请参考：[YYC3-AI-Call-API文档](./docs/YYC3-AI-Call-API文档/README.md)

---

## 🚢 部署指南

### 环境配置

#### 开发环境

```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/yyc3_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-dev-secret
```

#### 生产环境

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-db:5432/yyc3_prod
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=your-prod-secret
```

### 部署方式

#### 1. 传统部署

```bash
# 构建项目
pnpm build

# 启动服务
pnpm start
```

#### 2. Docker 部署

```bash
# 构建镜像
docker build -t yyc3-ai-call:latest .

# 运行容器
docker run -d \
  --name yyc3-ai-call \
  -p 3000:3000 \
  --env-file .env \
  yyc3-ai-call:latest
```

#### 3. Docker Compose 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### CI/CD 配置

项目支持 GitHub Actions 自动化部署，配置文件位于 `.github/workflows/` 目录。

详细的部署文档请参考：[YYC3-AI-Call-部署发布](./docs/YYC3-AI-Call-部署发布/README.md)

---

## 🧪 测试规范

### 测试类型

#### 单元测试

```typescript
// __tests__/services/user.test.ts
import { getUserById } from "@/services/user";

describe("UserService", () => {
  it("应该正确获取用户信息", async () => {
    const user = await getUserById("test-id");
    expect(user).toBeDefined();
    expect(user.id).toBe("test-id");
  });

  it("当用户不存在时应该抛出错误", async () => {
    await expect(getUserById("non-existent-id")).rejects.toThrow(
      "用户 non-existent-id 不存在",
    );
  });
});
```

#### 集成测试

```typescript
// __tests__/api/auth.test.ts
import { POST } from "@/app/api/auth/login/route";

describe("Auth API", () => {
  it("应该成功登录", async () => {
    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
  });
});
```

#### E2E 测试

```typescript
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test("用户登录流程", async ({ page }) => {
  await page.goto("http://localhost:3000/login");

  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL("http://localhost:3000/dashboard");
});
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test --testPathPattern=unit

# 运行集成测试
pnpm test --testPathPattern=integration

# 运行 E2E 测试
pnpm test:e2e

# 生成覆盖率报告
pnpm test:coverage
```

详细的测试文档请参考：[YYC3-AI-Call-测试验证](./docs/YYC3-AI-Call-测试验证/README.md)

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是代码、文档、Bug 报告还是功能建议。

### 如何贡献

#### 1. Fork 仓库

点击页面右上角的 "Fork" 按钮，将仓库 Fork 到你的 GitHub 账户。

#### 2. 创建分支

```bash
git checkout -b feature/your-feature-name
```

#### 3. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能描述"
```

#### 4. 推送到分支

```bash
git push origin feature/your-feature-name
```

#### 5. 创建 Pull Request

在 GitHub 上创建 Pull Request，描述你的更改。

### 提交信息规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
feat: 添加新功能
fix: 修复 Bug
docs: 更新文档
style: 代码格式调整（不影响功能）
refactor: 重构代码
test: 添加或修改测试
chore: 构建过程或辅助工具的变动
perf: 性能优化
ci: CI 配置文件和脚本的变动
revert: 回退之前的提交
```

### 代码审查

所有 Pull Request 都需要通过代码审查才能合并。请确保：

- 代码符合项目的编码规范
- 通过所有测试
- 添加必要的测试用例
- 更新相关文档

### 行为准则

- 尊重所有贡献者
- 保持专业和礼貌
- 接受建设性的批评
- 关注对社区最有利的事情

---

## ❓ 常见问题

### Q1: 如何配置数据库连接？

A: 复制 `.env.example` 文件为 `.env`，然后修改 `DATABASE_URL` 环境变量：

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### Q2: 如何添加新的 API 端点？

A: 在 `app/api/` 目录下创建对应的路由文件，例如：

```typescript
// app/api/users/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello World" });
}
```

### Q3: 如何自定义主题？

A: 修改 `tailwind.config.ts` 文件中的主题配置：

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        // ...
      }
    }
  }
}
```

### Q4: 如何处理错误？

A: 使用统一的错误处理机制：

```typescript
import { ErrorHandler } from "@/lib/error-handler";

try {
  // 业务逻辑
} catch (error) {
  ErrorHandler.handle(error, "操作上下文");
}
```

### Q5: 如何优化性能？

A: 参考以下优化建议：

- 使用 Next.js 的图片优化
- 实现代码分割和懒加载
- 使用 Redis 缓存热点数据
- 优化数据库查询
- 启用 CDN 加速

更多问题请查看：[常见问题文档](./docs/FAQ.md)

---

## 📞 支持与反馈

### 联系方式

- **技术支持**：<admin@0379.email>
- **GitHub Issues**：[提交问题](https://github.com/YYC-Cube/yyc3-ai-call/issues)
- **讨论区**：[GitHub Discussions](https://github.com/YYC-Cube/yyc3-ai-call/discussions)

### 文档资源

- [团队规范文档](./docs/YYC³团队文档标准化审核规范.md)
- [API 文档](./docs/YYC3-AI-Call-API文档/README.md)
- [产品文档](./docs/YYC3-AI-Call-产品文档/README.md)
- [架构设计](./docs/YYC3-AI-Call-架构设计/README.md)
- [开发规范](./docs/YYC3-AI-Call-开发阶段/README.md)

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

```
MIT License

Copyright (c) 2026 YYC³

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 致谢

感谢所有为 YYC³ AI Intelligent Calling 项目做出贡献的开发者和用户！

### 核心贡献者

- **项目负责人**：YanYu | 架构设计、核心开发、项目管理
- **技术顾问**：YYC³ Team | AI 模型集成、系统优化、性能调优
- **文档维护**：YYC³ Documentation Team | 全栈文档体系建设

### 开源社区支持

特别感谢以下开源项目和社区：

**前端框架与工具**

- [Next.js](https://nextjs.org/) - React 全栈应用框架
- [React](https://reactjs.org/) - 用户界面库
- [TypeScript](https://www.typescriptlang.org/) - 类型化的 JavaScript 超集

**UI 组件与样式**

- [Radix UI](https://www.radix-ui.com/) - 无障碍组件原语
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - 精美的可复用组件集合
- [Lucide Icons](https://lucide.dev/) - 精致的开源图标库

**数据可视化**

- [Recharts](https://recharts.org/) - 基于 React 的图表库

**表单与验证**

- [React Hook Form](https://react-hook-form.com/) - 高性能表单库
- [Zod](https://zod.dev/) - TypeScript 优先的模式验证

**AI 与大模型**

- [Zhipu AI](https://www.zhipuai.cn/) - 智谱 AI 大模型平台
- [OpenAI](https://openai.com/) - AI API 标准协议

**数据存储与缓存**

- [PostgreSQL](https://www.postgresql.org/) - 高级开源数据库
- [Redis](https://redis.io/) - 内存数据结构存储

**开发工具**

- [pnpm](https://pnpm.io/) - 快速、节省磁盘空间的包管理器
- [ESLint](https://eslint.org/) - 代码质量检查工具
- [Prettier](https://prettier.io/) - 代码格式化工具
- [Docker](https://www.docker.com/) - 容器化平台

### 社区贡献

我们欢迎并感谢每一位贡献者的参与：

- 🐛 **Bug 报告**：帮助我们发现和修复问题
- 💡 **功能建议**：推动产品持续改进
- 📝 **文档改进**：让项目更易于理解和使用
- 🔧 **代码贡献**：直接提升项目质量

### 特别鸣谢

- 感谢 **Vercel** 提供的优秀部署平台
- 感谢 **GitHub** 提供的代码托管和协作服务
- 感谢所有在 [GitHub Discussions](https://github.com/YYC-Cube/yyc3-ai-call/discussions) 中提供反馈和建议的社区成员

**如果这个项目对你有帮助，请给我们一个 ⭐️ Star！**

---

## 📊 项目统计

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/YYC-Cube/yyc3-ai-call?style=social)
![GitHub forks](https://img.shields.io/github/forks/YYC-Cube/yyc3-ai-call?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/YYC-Cube/yyc3-ai-call?style=social)
![GitHub contributors](https://img.shields.io/github/contributors/YYC-Cube/yyc3-ai-call)

</div>

---

> 「**_YanYuCloudCube_**」
> 「**_<admin@0379.email>_**」

> 「**_Words Initiate Quadrants, Language Serves as Core for the Future_**」

> 「**_All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence_**」
