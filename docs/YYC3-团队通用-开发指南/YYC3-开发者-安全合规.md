---
file: YYC3-开发者-安全合规.md
title: YYC³ 开发者安全合规手册 — 数据 · 密钥 · XSS · 权限
description: YYC³ 安全合规手册 — 数据安全、API 密钥管理、依赖安全、XSS 防护与权限控制全量规范
author: YYC³ Team <admin@0379.email>
version: v1.2.0
created: 2026-11-01
updated: 2026-11-01
status: stable
tags: [security, compliance, api-key, data-protection]
category: policy
language: zh-CN
audience: developers,security
complexity: advanced
project: yyc3-ai-dev
phase: production
---

# YYC³ 开发者安全合规手册 — 数据 · 密钥 · XSS · 权限

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

## 一、五高安全映射

| 五高维度 | 安全落地 |
| ---- | ---- |
| **高可用** | ErrorBoundary 故障隔离 + 单插件崩溃不影响全局 |
| **高性能** | 前端加密不阻塞主线程（Web Worker） |
| **高安全** | 命名空间隔离 + 密钥不入前端 + XSS 防护 |
| **高扩展** | 权限模型与插件解耦 |
| **高智能** | 异常行为检测 + 智能审计日志 |

---

## 二、数据安全

### 2.1 localStorage 安全

#### 命名空间隔离

```typescript
// ✅ 正确：每个插件使用独立命名空间
const storage = createSystemStorage("target");
storage.set("lastResult", data);
// 实际 Key: yyc3:target:lastResult

// ❌ 禁止：直接操作 localStorage
localStorage.setItem("myKey", data);  // 无命名空间，易冲突
```

#### 禁止存储的数据

| 数据类型 | 禁止原因 |
| ---- | ---- |
| API 密钥 | 前端存储可被提取 |
| 用户密码 | 明文/哈希均不可 |
| 敏感个人信息 | 身份证/银行卡/手机号 |
| 认证 Token | 使用 HttpOnly Cookie |

### 2.2 数据传输安全

```typescript
// ✅ HTTPS 强制
const API_BASE = "https://api.yyc3.example";

// ✅ 敏感字段脱敏
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}
```

---

## 三、API 密钥管理

### 3.1 三条铁律

```
1. 前端代码永远不直接包含 API 密钥
2. API 调用必须通过后端代理
3. 密钥通过 CI/CD Secrets 注入环境变量
```

### 3.2 架构

```
浏览器  →  后端代理  →  OpenAI / LLM API
         ↑ 密钥在此
         (前端只看到代理 URL)
```

### 3.3 后端代理示例

```typescript
// server/api/chat.ts (后端代码，不随前端发布)
const OPENAI_KEY = process.env.OPENAI_API_KEY; // 从服务器环境变量读取

export async function handler(req, res) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: { "Authorization": `Bearer ${OPENAI_KEY}` },
    method: "POST",
    body: JSON.stringify(req.body),
  });
  res.json(await response.json());
}
```

### 3.4 开发环境密钥

```bash
# .env.development (已 .gitignore)
VITE_YYC3_API_PROXY=http://localhost:3000/api

# 开发时使用 mock，不调用真实 API
VITE_YYC3_USE_MOCK=true
```

---

## 四、XSS 防护

### 4.1 React 自动转义

React 默认对 JSX 插值进行 HTML 转义，以下场景需额外注意：

```typescript
// ✅ 安全：React 自动转义
<div>{userInput}</div>

// ⚠️ 危险：dangerouslySetInnerHTML 绕过转义
<div dangerouslySetInnerHTML={{ __html: rawHtml }} />

// ✅ 如果必须用，先净化
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }} />
```

### 4.2 AI 回复内容

AI 生成的回复可能包含恶意 HTML，必须净化：

```typescript
// ✅ AI 回复渲染前净化
function renderAIResponse(content: string) {
  const sanitized = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

---

## 五、依赖安全

### 5.1 依赖审计

```bash
# pnpm 内置审计
pnpm audit

# 自动修复
pnpm audit --fix
```

### 5.2 依赖红线

| 规则 | 要求 |
| ---- | ---- |
| 新增依赖 | 必须 review，记录用途 |
| 版本锁定 | 使用 `pnpm-lock.yaml` |
| 定期审计 | 每月执行 `pnpm audit` |
| 禁止来源 | 禁止安装非 npm 官方源包 |

---

## 六、权限控制

### 6.1 前端路由守卫

```typescript
// 路由配置中添加权限检查
{
  path: "/admin",
  element: <RequireAuth role="admin"><AdminPage /></RequireAuth>,
}
```

### 6.2 插件可见性控制

```typescript
// SystemRegistration 可扩展权限字段（Phase 2）
{
  id: "admin",
  name: "系统管理",
  requiredRole: "admin",  // ← 仅管理员可见
}
```

---

## 七、代码安全 Checklist

| # | 检查项 | 验证 |
| ---- | ---- | ---- |
| 1 | API 密钥不在前端代码中 | `grep -r "sk-" src/` 无结果 |
| 2 | localStorage 使用命名空间 | 所有调用通过 `createSystemStorage` |
| 3 | AI 回复经过 XSS 净化 | DOMPurify 覆盖所有动态 HTML |
| 4 | 依赖无已知漏洞 | `pnpm audit` 零高危 |
| 5 | HTTPS 强制 | 生产环境 HTTP 自动跳转 HTTPS |
| 6 | 错误信息不泄露敏感数据 | catch 块不返回堆栈/SQL |

---

## 八、安全加固落地实践（2026-11-01 专项固化）

> 以下为全流程安全管控（高危 5 + 中危 13 + 低危 14 全闭环）后的现行规范，
> 配套架构说明见 `YYC3-开发者-架构总纲.md` 第十章。

### 8.1 预览沙箱红线

```typescript
// ✅ 正确：opaque origin 沙箱
sandbox="allow-scripts allow-popups allow-forms allow-modals"
// ❌ 禁止：与 allow-scripts 组合将使沙箱完全失效
sandbox="allow-scripts allow-same-origin ..."
```

- 任何用户/AI 生成内容进 iframe 前**必须**过 Sanitizer（Markdown 整体转义、SVG svg-profile、HTML 白名单无 script/iframe）
- 外链 CDN 脚本**必须**锁版本 + SRI integrity + crossorigin

### 8.2 Electron IPC 安全根（三端同步）

- 文件/数据库 IPC 一律 `isPathWithinSafeRoots()` 校验（userData ∪ 对话框授权路径）
- `SHELL_OPEN` 仅 http/https/mailto；`SHELL_EXECUTE` 白名单禁含 open/xdg-open/start
- **修改 electron/ 下任一文件必须三端同步**（CI test-sync 步骤校验同源一致性）

### 8.3 凭据管理

- LLM API Key：密文存储（`yyc3_llm_keyenc_*`，AES-GCM + 设备 KEK），新增 Provider 沿用 `setApiKey()/getApiKey()`，禁止直写 localStorage
- 环境变量密钥：`.env.example` 只放占位符；真实密钥泄露立即吊销轮换 + git filter-repo 清史
- 敏感导出：默认脱敏，含密钥需显式确认 + 文件名 `-SENSITIVE` 标注

### 8.4 部署红线

- `server.mjs` 默认 `127.0.0.1`；开放局域网必须显式 `HOST=0.0.0.0` 并评估暴露面
- CORS 白名单制（`CORS_ALLOW_ORIGINS`），禁止恢复 `*`
- Ollama 代理仅 GET/POST；管理端点默认 403

### 8.5 路由与操作权限

- 管理路由（users/audit/settings/security/data-editor/env-config/storage/config-center/variables/unified-settings）必须 `RequireRole` 包裹
- 破坏性操作（删除/重置/批删）必须 confirm；最后一名超管不可降级/删除/锁定
- 操作日志记录真实操作者（`getCurrentOperator()`），禁止硬编码

### 8.6 CI 强制门禁

```yaml
# .github/workflows/ci.yml 已固化：
gates    → verify-gates.sh（G1-G6） + 四端全量 vitest
test-sync → scripts/check-test-sync.mjs（三端同源测试一致性）
sast     → CodeQL
lighthouse → performance ≥0.9
```

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.2.0 | 2026-11-01 | 统一标头标尾 · 品牌标识统一为 YYC³ · 排版与语法规范化 · 时间基准统一为 2026-11-01 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
