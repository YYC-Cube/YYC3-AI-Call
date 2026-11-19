# YYC³ AI Intelligent Calling — 安全策略

> **YYC³**（YanYuCloudCube™）· 言启象限 | 语枢未来
> _Words Initiate Quadrants, Language Serves as Core for Future_

## 支持版本

| 版本 | 支持状态 |
| ------- | ---------- |
| 1.0.x   | ✅ 支持 |

## 安全特性

- **JWT 认证**：Access Token + Refresh Token 双令牌；生产环境缺失 `JWT_SECRET` 直接失败，不降级
- **RBAC 权限控制**：USER / AGENT / MANAGER / ADMIN 四级角色
- **输入验证**：Zod 4 Schema 全接口输入验证
- **速率限制**：Redis 支持的 API 速率限制（内存降级兜底）
- **安全头部**：`X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` 全局生效
- **密码安全**：bcryptjs（cost 12）哈希存储；种子密码仅通过 `SEED_DEFAULT_PASSWORD` 显式注入
- **数据库角色分离**：运行时 `yyc3_ai_call_app`（仅 DML）与迁移 `yyc3_ai_call_migrator`（DDL）分离，均非超级用户
- **凭证管理**：所有连接信息通过环境变量注入，禁止硬编码 IP/密钥

## 报告安全漏洞

如果你发现安全漏洞，请通过以下方式报告：

- **首选**：GitHub 私有漏洞报告（Security → Report a vulnerability）
- **邮箱**：[security@0379.email](mailto:security@0379.email)
- **请勿**在公开 Issue / Discussion / PR 中报告或讨论漏洞细节

### 响应时限（对齐团队 P0–P4 事件分级）

| 级别 | 响应 | 处理时限 |
| ---- | ---- | -------- |
| P0 紧急（RCE / 数据泄露） | 24 小时内确认 | 7 天内修复或缓解 |
| P1 高（认证绕过 / 注入） | 48 小时内确认 | 14 天内 |
| P2 中（XSS / 权限越界） | 72 小时内确认 | 30 天内 |
| P3 低（信息泄露 / 加固建议） | 1 周内确认 | 下一迭代 |

### 报告内容

1. 漏洞类型（XSS、SQL 注入、SSRF、认证绕过等）
2. 受影响的版本与组件（含复现仓库分支/commit）
3. 复现步骤或 PoC
4. 潜在影响评估

## 依赖漏洞治理

- 审计命令：`pnpm audit --registry=https://registry.npmjs.org`
- 当前状态：主应用 critical/high 已清零；剩余事项见
  [阶段总结 · 依赖漏洞治理](docs/YYC3-AI-Call-运维阶段/165-YYC3-AI-Call-运维阶段-阶段总结-数据库基线与安全加固.md)
- 已知事项：`docs/packages/cli` 保留 Zod 3（受 `@modelcontextprotocol/sdk` 类型依赖阻塞），待其支持 Zod 4 后升级

## 范围与不在范围

**在范围**：本仓库源码、CI/CD 配置、部署脚本、PWA 前端。

**不在范围**：自架基础设施的配置错误、社会工程、DoS 压测、`docs/packages/*` 演示示例中已在 README 声明的演示性限制。

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
