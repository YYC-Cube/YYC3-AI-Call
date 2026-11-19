---
file: YYC3-开发者-部署运维.md
title: YYC³ 开发者部署运维与 CI/CD 指南 — 构建 · 容器 · 监控
description: YYC³ 部署运维与 CI/CD 指南 — 构建流程、Docker 部署、CI 流水线、环境配置与监控方案
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-01
updated: 2026-11-01
status: stable
tags: [deployment, devops, ci-cd, docker, monitoring]
category: guide
language: zh-CN
audience: developers,devops
complexity: advanced
project: yyc3-ai-dev
phase: production
---

# YYC³ 开发者部署运维与 CI/CD 指南 — 构建 · 容器 · 监控

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 一、五标体系映射

| 五标维度 | 运维落地 |
| ---- | ---- |
| **标准化** | 统一构建脚本 + Docker 镜像模板 |
| **规范化** | 环境变量命名规范 + 配置文件分层 |
| **自动化** | GitHub Actions CI 流水线 |
| **可视化** | 构建日志 + 部署状态看板 |
| **智能化** | 健康检查自动恢复 + 智能工作流引擎 |

---

## 二、构建流程

### 2.1 开发环境构建

```bash
# 安装依赖
pnpm install

# 类型检查（零错误门禁）
npx tsc --noEmit

# 运行测试（全绿门禁）
npx vitest run

# 启动开发服务器
pnpm dev
```

### 2.2 生产构建

```bash
# 合并版应用
cd apps/full
pnpm build         # → dist/

# 独立应用（以 AI Family 为例）
cd apps/standalone-ai-family
pnpm build         # → dist/
```

### 2.3 构建产物结构

```
dist/
├── assets/
│   ├── index-[hash].js       ← 主 bundle
│   ├── index-[hash].css      ← 样式
│   └── vendor-[hash].js      ← 第三方依赖
├── index.html
└── favicon.ico
```

---

## 三、CI/CD 流水线

### 3.1 GitHub Actions 配置

项目已有 `.github/workflows/ai-eco-ci.yml`，核心流程：

```yaml
name: YYC³ AI Ecosystem CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Type Check
        run: npx tsc --noEmit

      - name: Test
        run: npx vitest run

      - name: Build
        run: pnpm build
```

### 3.2 质量门禁

| 门禁 | 失败动作 |
| ---- | ---- |
| `tsc --noEmit` 零错误 | ❌ 阻止合并 |
| `vitest run` 全绿 | ❌ 阻止合并 |
| 构建成功 | ❌ 阻止部署 |

---

## 四、环境配置

### 4.1 环境变量命名规范

```
命名格式: VITE_YYC3_{SYSTEM}_{KEY}

VITE_YYC3_SHELL_API_BASE     ← Shell 层 API 地址
VITE_YYC3_AI_OPENAI_KEY      ← AI 系统 OpenAI Key
VITE_YYC3_MONITOR_GRAFANA    ← 监控系统 Grafana URL
```

### 4.2 环境分层

| 环境 | 文件 | 说明 |
| ---- | ---- | ---- |
| 开发 | `.env.development` | 本地开发，可含 mock |
| 预发布 | `.env.staging` | 预发布服务器 |
| 生产 | `.env.production` | 生产环境（密钥通过 CI 注入） |

### 4.3 敏感信息处理

```bash
# ❌ 禁止：提交到 Git
echo "VITE_YYC3_AI_OPENAI_KEY=sk-xxx" >> .env

# ✅ 正确：.gitignore 已包含 .env*
# 生产密钥通过 CI/CD Secrets 注入
```

---

## 五、Docker 部署

### 5.1 Dockerfile 模板

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

# 构建 Shell + 插件
COPY . .
RUN npx tsc --noEmit && pnpm build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/apps/full/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.2 compose.yaml

```yaml
services:
  yyc3-app:
    build: .
    ports:
      - "8080:80"
    environment:
      - VITE_YYC3_SHELL_API_BASE=https://api.yyc3.example
    restart: unless-stopped
```

> Docker Compose v2 起 `version: '3.8'` 已废弃，无需声明版本号（`compose.yaml` 为推荐文件名）。

---

## 六、部署目标

### 6.1 静态托管（推荐）

| 平台 | 优势 | 配置 |
| ---- | ---- | ---- |
| **Netlify** | 静态优化 + CDN | 设置 build 命令 |
| **Cloudflare Pages** | 全球 CDN | 免费额度大 |

### 6.2 容器化部署

```bash
# 构建镜像
docker build -t yyc3-ai-dev:latest .

# 运行
docker run -d -p 8080:80 yyc3-ai-dev:latest

# compose
docker compose up -d
```

---

## 七、监控与告警

### 7.1 应用层监控

- **ErrorBoundary** 全覆盖率：Shell 层自动捕获渲染错误
- **EventBus 审计日志**：关键事件可订阅记录
- **定时健康检查**：辅助层 Agent 定时巡检（健康看板）

### 7.2 健康检查端点

```
GET /health        → { status: "ok", timestamp: ISO 8601 }
GET /health/ready  → { services: { shell: "up", plugins: [...] } }
```

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.1.0 | 2026-11-01 | 统一标头标尾 · 品牌标识统一为 YYC³ · 排版与语法规范化 · 时间基准统一为 2026-11-01 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
