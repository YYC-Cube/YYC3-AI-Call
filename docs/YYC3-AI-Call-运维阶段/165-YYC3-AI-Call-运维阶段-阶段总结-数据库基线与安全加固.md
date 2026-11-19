---
file: 165-YYC3-AI-Call-运维阶段-阶段总结-数据库基线与安全加固.md
title: YYC³ AI Call 运维阶段 — 数据库基线与安全加固阶段总结
description: D1 基线重建、主备/Tailscale 接入、角色分离、密码轮转与依赖漏洞治理的阶段总结
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-20
updated: 2026-11-20
status: stable
tags: [summary, database, security, operations]
category: technical
language: zh-CN
audience: developers,qa,managers,stakeholders
complexity: advanced
project: yyc3-ai-call
phase: production
---

# YYC³ AI Call 运维阶段 — 数据库基线与安全加固阶段总结

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

## 一、阶段目标与范围

本阶段聚焦三件事：

1. **D1 数据库基线修复**：解决 Prisma `schema.prisma` 与历史迁移严重漂移的问题，建立可用的 `yyc3_v2` 基线；
2. **生产主备接入**：完成 NAS 主库 / 本机备库的 Tailscale 访问、角色分离与密码轮转；
3. **依赖漏洞治理**：扫描并修复 critical/high 依赖漏洞，保留可复现的验证证据。

范围外：真实外呼链路、前端 mock 数据接入、应用层全 API 鉴权（见“遗留风险”）。

---

## 二、完成事项

| # | 事项 | 结果 |
|---|---|---|
| 1 | Prisma 基线重建 | 以 `schema.prisma` 重新生成 6 张表基线迁移 |
| 2 | 旧数据保护 | 旧 `public` 完整备份并原样保留，未迁移演示数据 |
| 3 | 新基线落库 | 在 NAS 主库创建隔离 schema `yyc3_v2` 并应用迁移 + seed |
| 4 | 主备复制验证 | 本机 standby 已复制 `yyc3_v2`，`replay_lag < 1ms` |
| 5 | 运行时角色 | `yyc3_ai_call_app`：非超级用户，仅 DML，无 `CREATE` |
| 6 | 迁移角色 | `yyc3_ai_call_migrator`：非超级用户，拥有 `yyc3_v2` schema/表/序列/枚举 |
| 7 | 主备 pg_hba | 主库/备库均为 app/migrator 放行 Tailscale（`scram-sha-256`） |
| 8 | 密码轮转 | 应用角色、迁移角色、4 个种子账号全部改密；旧应用密码实测被拒绝 |
| 9 | 端口修正 | `~/.zshenv` 固定 `YYC3_NAS_PG_PORT=5433`；助手脚本强制纠正 |
| 10 | Redis 兼容 | `lib/redis.ts` 支持 `YYC3_REDIS_HOST/PORT/PASSWORD` |
| 11 | CI/测试修正 | 修正 Jest 命令、脚本缺失、Playwright 端口、Jest 误跑 E2E |
| 12 | 依赖漏洞治理 | critical/high 归零；仅余 1 个 dev-only moderate |
| 13 | Next 安全升级 | Next 15.5.24 → **15.5.28**（修复 Image Optimization RCE） |
| 14 | 文档落档 | 本阶段总结、README、环境模板、运维命令同步更新 |

---

## 三、数据库基线（D1）

### 3.1 迁移与 Schema

- 迁移文件：`prisma/migrations/20260123081143_yyc3_33/migration.sql`
- 重建后包含 6 张表：
  - `users`（含 `passwordHash`、`isActive`）
  - `customers`
  - `calls`
  - `interactions`
  - `sessions`
  - `audit_logs`
- 不再包含旧结构：`call_records` / `campaigns` / `tasks` / `analytics_metrics`
- `prisma migrate diff --from-url ... --to-schema-datamodel ... --exit-code` → `No difference detected`

### 3.2 隔离策略

| schema | 用途 | 状态 |
|---|---|---|
| `public` | 旧演示数据归档 | 保留，未修改 |
| `yyc3_v2` | 当前应用基线 | 已应用迁移 + seed |

旧 `public` 数据核勘为演示种子数据（50 客户/100 通话在 37ms/34ms 内批量生成，邮箱为合成地址），**决策：不迁移**，仅归档。

### 3.3 关键数据

| 数据集 | users | customers | calls | interactions |
|---|---|---|---|---|
| 旧 `public` | 3 | 50 | 100（旧表） | — |
| 新 `yyc3_v2` | 4 | 5 | 5 | 4 |
| 备库 `yyc3_v2` | 4 | 5 | 5 | — |

### 3.4 备份

| 文件 | 说明 |
|---|---|
| `~/yyc3-backups/yyc3_ai_call_20261120_030713.dump` | 旧 `public` 全量自定义备份 |
| `..._schema.sql` / `..._data.sql` | 旧结构与数据明文备份 |
| `~/yyc3-backups/roles_before_20261120_032324.sql` | 角色/密码哈希备份 |
| `~/yyc3-backups/yyc3_v2_schema_before_ownership_20261120_032324.sql` | 所有权变更前 schema |

备份目录与文件权限已收紧为 `700/600`。

---

## 四、主备与 Tailscale 接入

### 4.1 拓扑

- 主库：NAS，PostgreSQL 17.11，端口 5433；
- 备库：本机，PostgreSQL 17.11，端口 5433，`pg_is_in_recovery=true`；
- 复制：`streaming / async`，实测 `replay_lag < 1ms`；
- 访问：主备均通过 Tailscale MagicDNS 主机名接入，主机地址由环境变量注入，不写死 IP。

### 4.2 角色分离

| 角色 | LOGIN | SUPERUSER | 权限 |
|---|---|---|---|
| `yyc3_ai_call_app` | ✅ | ❌ | `USAGE` + 表/序列 DML；无 `CREATE` |
| `yyc3_ai_call_migrator` | ✅ | ❌ | 拥有 `yyc3_v2`，可 DDL |

验证：

```text
migrator DDL probe: CREATE TABLE / DROP TABLE 成功
runtime CREATE:     permission denied for schema yyc3_v2
runtime read:       4
migrator status:    Database schema is up to date!
```

### 4.3 pg_hba

主库与备库均新增：

```text
host yyc3_ai_call yyc3_ai_call_app      100.64.0.0/10 scram-sha-256
host yyc3_ai_call yyc3_ai_call_migrator 100.64.0.0/10 scram-sha-256
```

- 主库备份：`pg_hba.conf.bak.20261120_0318` / `_0325`
- 备库备份：`pg_hba.conf.bak.20261120_0323` / `_0325`
- 已执行 `pg_reload_conf()`，主备实测 app/migrator 均可通过 Tailscale 连接。

### 4.4 连接助手

| 脚本 | 用途 |
|---|---|
| `scripts/use-yyc3-db.sh` | 运行时连接（app 角色） |
| `scripts/use-yyc3-db-migrate.sh` | 迁移连接（migrator 角色） |

常用命令：

```bash
export YYC3_NAS_PG_HOST=<NAS_MagicDNS名称>
pnpm dev:yyc3
pnpm db:migrate:yyc3
pnpm db:status:yyc3:migrate
pnpm db:verify:yyc3
```

---

## 五、密码与账号轮转

| 对象 | 处理 | 存放 |
|---|---|---|
| `yyc3_ai_call_app` | 随机 48 位密码轮转，旧密码实测被拒绝 | `~/yyc3-secrets/yyc3_ai_call_app.password` |
| `yyc3_ai_call_migrator` | 新建并设置随机密码 | `~/yyc3-secrets/yyc3_ai_call_migrator.password` |
| 种子账号 4 个 | 全部改密，无 NOT_FOUND | `~/yyc3-secrets/yyc3_seed_accounts.txt` |

- 目录 `~/yyc3-secrets` 权限 700，文件 600；
- 仓库内未写入任何真实密码、主机 IP 或 Tailscale IP；
- `prisma/seed.ts` 已加固：必须显式注入 `SEED_DEFAULT_PASSWORD`，仓库内不再包含任何默认密码。

---

## 六、依赖漏洞治理

### 6.1 审计结果

| 阶段 | critical | high | moderate | low |
|---|---|---|---|---|
| 初始 | 1 | 32 | 13 | 4 |
| 首轮修复后 | 0 | 30 | 10 | 4 |
| 本轮完成 | **0** | **0** | **1** | **0** |

- 修复 critical：Next.js Image Optimization RCE（升级至 15.5.28）；
- 修复 high：`zod`、`sharp`、`socket.io-parser`、`engine.io`、`browserslist`、`source-map-js`、`form-data` 等；
- 通过 `pnpm.overrides` 统一传递依赖版本；
- 剩余 1 个 `minimatch` moderate 为 **dev-only**（ESLint 工具链），不影响生产运行时；直接强制到 11.x 会破坏 ESLint/glob 兼容性，暂缓并记录。

审计命令：

```bash
pnpm audit --registry=https://registry.npmjs.org
```

### 6.2 代码适配

- Zod 4 升级后，`lib/validations.ts` 由 `result.error.errors` 改为 `result.error.issues`；
- TypeScript、单元测试、构建均通过。

---

## 七、验证证据

| 检查 | 结果 |
|---|---|
| `pnpm type-check` | 通过 |
| `pnpm test` | 18 suites / 166 tests 通过 |
| `pnpm lint` | 0 error / 627 warning |
| `pnpm build` | 成功，`.next/standalone` 已产出 |
| `pnpm db:verify:yyc3` | 全部表通过，18 条记录 |
| `pnpm db:migrate:yyc3` | No pending migrations |
| 登录 / 刷新 | 200 / 200（轮转后的 admin 密码） |
| 主备 Tailscale | app / migrator 均可连 |
| 旧 `public` 数据 | 3 / 50 / 100，未变 |

> 构建排障：若 `pnpm build` 输出 webpack 源码转储，通常是 VS Code 调试器环境或 `.next` 缓存损坏。清理 `.next` 后使用 `env -u NODE_OPTIONS -u VSCODE_INSPECTOR_OPTIONS pnpm build` 可恢复。

---

## 八、遗留风险与待办

| 优先级 | 事项 | 说明 |
|---|---|---|
| P0 | 应用层 API 鉴权 | `/api/ai/*`、`/api/unified-auth`、`/api/tenants*`、`/api/mcp`、`/api/multimodal` 等仍未统一 JWT 校验 |
| P0 | 真实外呼链路 | 未发现 SIP/WebRTC/运营商网关集成，当前为演示型原型 |
| P1 | 前端数据接入 | 8 个业务模块仍使用 mock 数据，未调用真实 API |
| P1 | ESM 集成测试 | `yyc3-full-integration.test.ts` 依赖 ESM-only `@yyc3/*`，Jest CJS 无法解析；建议迁移 Vitest |
| P1 | `yanyu` trust 规则 | 现有 Tailscale `trust` 规则仍保留；应用已改用专用角色，后续应收窄 |
| P2 | `minimatch` moderate | dev-only，待 ESLint 工具链升级时一并处理 |
| P2 | 种子脚本幂等性 | `prisma db seed` 仅适用于空库；重复执行会因唯一约束失败 |

---

## 九、回滚方案

| 场景 | 操作 |
|---|---|
| 应用连接失败 | 将 `DATABASE_URL` 切回旧值/旧版本应用；旧 `public` 未修改 |
| pg_hba 回滚 | 用主备对应 `.bak` 覆盖并 `select pg_reload_conf()` |
| 角色/权限回滚 | 使用 `roles_before_*.sql` 与 schema 备份；必要时将 `yyc3_v2` 所有权转回 `postgres` |
| 密码回滚 | 旧密码已失效；重新轮转并更新 secret 文件 |
| 数据恢复 | 从 `~/yyc3-backups/*.dump` 恢复到独立库比对，不直接覆盖主库 |

---

## 十、变更清单

| 类别 | 文件/对象 |
|---|---|
| 数据库 | `prisma/migrations/20260123081143_yyc3_33/migration.sql`、`prisma/seed.ts` |
| 连接 | `scripts/use-yyc3-db.sh`、`scripts/use-yyc3-db-migrate.sh`、`scripts/init-db.sh`、`scripts/init-db.sql` |
| 缓存 | `lib/redis.ts` |
| 依赖安全 | `package.json`、`pnpm-lock.yaml`（Next 15.5.28、Zod 4、overrides） |
| 校验 | `lib/validations.ts` |
| 配置 | `next.config.mjs`、`Dockerfile`、`middleware.ts`、`docker-compose.yml`、`.env*.example` |
| CI/测试 | `.github/workflows/ci.yml`、`ci-cd.yml`、`jest.config.js`、`playwright.config.ts`、`eslint.config.mjs` |
| 文档 | `README.md`、本文件 |

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|---|---|---|---|
| v1.0.0 | 2026-11-20 | 建立数据库基线、主备/Tailscale 接入、角色分离、密码轮转与依赖漏洞治理阶段总结 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
