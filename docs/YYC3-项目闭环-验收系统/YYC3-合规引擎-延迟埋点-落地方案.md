---
file: YYC3-合规引擎-延迟埋点-落地方案.md
description: 基于行业调研结论的合规引擎与延迟埋点落地方案 — 数据模型、预呼校验管线、AI 内容标识、录音留存、TTFT/E2E 埋点与三迭代任务列表（v1.2.0 M1/M2 已完成闭环）
author: YYC³ Team <admin@0379.email>
version: v1.3.0
created: 2026-11-20
updated: 2026-11-20
status: stable
tags: [合规引擎, 延迟埋点, 迭代规划, 智能外呼, 演进落地]
category: implementation-plan
language: zh-CN
audience: developers,qa-engineers,devops,managers
complexity: intermediate
project: yyc3-ai-dev
phase: production
---

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_

# YYC³ 合规引擎与延迟埋点落地方案

> 上游：《[YYC3-闭环验收-整改复测报告-20261120](./YYC3-闭环验收-整改复测报告-20261120.md)》§六 B 档缺失清单 / §七 功能延展项 / §八 五高演进指导 / §九 遗留风险
> V1/V2 启动前置已决策：《[YYC3-语音供应商-选型方案](./YYC3-语音供应商-选型方案.md)》（主路线 B 自组级联、POC 口径复用本方案 M2 指标、双供应商主备）
> 原则：每一项改动落到**真实存在的文件与接口**（已逐一核实），验收标准复用既有 CI 门禁（覆盖率阈值只升不降、lint 预算 700 只减不增、jest-axe 全绿）。
> 上游规范：[../YYC3-团队通用-标规文档/YYC3-团队通用-开发标准.md](../YYC3-团队通用-标规文档/YYC3-团队通用-开发标准.md)

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 一、目标与行业对标

| 目标 | 对标值 | 来源 | 本项目现状 |
|---|---|---|---|
| 营销外呼号码合规 | 2025-08-01 起三大运营商唯一官方营销号码（10001/10085/10016），未授权号码不得外呼营销 | 工信部官网（复测报告 §5.3 来源 7） | 外呼通道无号码白名单 |
| AI 生成内容标识 | 《人工智能生成合成内容标识办法》2025-09-01 施行：显式标识（内容提示）+ 隐式标识（元数据写服务者信息） | 网信办（来源 8，办法 §4/§5） | `synthesizeSpeech` 无任何标识 |
| 录音留存 | ≥30 日（行业执法口径，复测报告标注**待验证**） | 历史调研 | `Call.recordingUrl` 存在但无留存/清理策略 |
| 端到端语音延迟 | 行业生产目标 ≤800ms；Retell 实测 ~600ms、TTFT 180ms、barge-in 140ms、流连续性 99.7% | Retell latency face-off 2025（来源 2/3） | 无任何延迟埋点 |
| 对话首 token 延迟（文本链路） | TTFT ≤200ms（复测报告 §八 高性能条目） | 同上 | `chat/stream` 未埋点 |

---

## 二、合规引擎落地方案

### 2.1 数据模型增量（[prisma/schema.prisma](../../prisma/schema.prisma)）

现有模型已具备挂接点：`Call`（含 `recordingUrl`）、`AuditLog`（合规审计复用）。新增两个模型 + 一处字段扩展：

```prisma
/// 外呼号码状态机（合规引擎核心表）
model PhoneNumber {
  id            String          @id @default(cuid())
  number        String          @unique
  /// AVAILABLE 可用 | SUSPENDED 待审 | BLOCKED 禁用
  status        PhoneNumberStatus @default(SUSPENDED)
  carrier       String?         // 电信/移动/联通
  /// 运营商授权凭证编号（对接官方号码报备）
  authorization String?
  dailyLimit    Int             @default(3)   // 单号码日呼上限（可配）
  tenantId      String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  callTasks     OutboundTask[]
  @@index([status])
  @@map("phone_numbers")
}

/// 禁拨名单（用户投诉/退订/监管下发）
model DncEntry {
  id        String   @id @default(cuid())
  phone     String   @unique
  reason    String   // COMPLAINT 投诉 | OPT_OUT 退订 | REGULATOR 监管下发
  source    String?
  expiresAt DateTime? // 有期禁拨自动解除，永久禁拨为 null
  tenantId  String?
  createdAt DateTime @default(now())
  @@index([phone])
  @@map("dnc_entries")
}

/// 外呼任务（预呼校验的落点：每次外呼必须关联已通过校验的任务）
model OutboundTask {
  id             String      @id @default(cuid())
  phoneNumberId  String
  customerId     String?
  callId         String?     // 关联既有 Call
  status         TaskStatus  @default(DRAFT)
  /// 预呼校验快照（五道闸结果 JSON）
  complianceSnap Json?
  scheduledAt    DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  phoneNumber    PhoneNumber @relation(fields: [phoneNumberId], references: [id])
  @@index([status])
  @@index([phoneNumberId])
  @@map("outbound_tasks")
}

enum PhoneNumberStatus { AVAILABLE SUSPENDED BLOCKED }
enum TaskStatus { DRAFT COMPLIANCE_PASSED DIALING COMPLETED FAILED BLOCKED }
```

`Call` 模型追加一列（录音留存，见 2.5）：

```prisma
  recordingExpiresAt DateTime?  // 录音到期时间（默认 +30 日）
```

落地方式：`pnpm db:migrate`（PostgreSQL 17 / `yyc3_v2`，走既有 migrations 流程，不重置库）。

### 2.2 预呼合规校验管线（新建 `lib/compliance/precall.ts`，M1-C2 交付）

五道闸顺序执行，任一不通过即阻断并写 `AuditLog`：

```
号码状态闸 → 禁拨名单闸 → 禁拨时段闸 → 频次闸 → AI标识准备闸
```

| 闸 | 校验逻辑 | 数据源 | 默认值（均可配置） |
|---|---|---|---|
| 1 号码状态 | `status === AVAILABLE` 且 `authorization` 非空 | `PhoneNumber` | — |
| 2 禁拨名单 | 号码不在 `DncEntry`（含未过期的有期禁拨） | `DncEntry` | — |
| 3 禁拨时段 | 当前时间不在禁拨窗口 | 配置 | **21:00–次日 09:00 禁营销外呼**（行业惯例默认，以当地监管与运营商协议为准） |
| 4 频次 | 该号码当日呼出次数 < `dailyLimit` | `OutboundTask` 当日计数（Redis 缓冲，复用 [lib/redis.ts](../../lib/redis.ts) 既有降级分支模式） | 3 次/日/号码 |
| 5 AI标识准备 | 生成通话级标识上下文（显式播报文本 + 隐式元数据，见 2.4） | 内存 | — |

输出：`{ ok: true, taskId, snap }` 或 `{ ok: false, gate: 'DNC'|'TIME_WINDOW'|..., reason }`，快照写入 `OutboundTask.complianceSnap`（事件维：全链路可追溯）。

服务形态对齐既有 [lib/api-auth.ts](../../lib/api-auth.ts) 风格：纯函数 `runPrecallCheck(input): Promise<PrecallResult>`，路由一行接入。

### 2.3 API 层（新建 `app/api/compliance/`，全部经 `requireAuth` 网关）

| 路由 | 方法 | 职责 | 鉴权 |
|---|---|---|---|
| `/api/compliance/numbers` | GET/POST/PATCH | 号码台账 CRUD + 状态流转（SUSPENDED→AVAILABLE 需 `authorization` 非空） | `requireAuth` + RBAC `MANAGER+`（复用 [lib/security/rbac.ts](../../lib/security/rbac.ts)） |
| `/api/compliance/dnc` | GET/POST/DELETE | 禁拨名单维护（POST 支持批量） | `requireAuth` + RBAC |
| `/api/compliance/precall-check` | POST | 外呼前校验入口，返回五道闸结果；`ok=false` 时路由层不得发起外呼 | `requireAuth` |
| `/api/compliance/precall-check` | GET | 按 taskId 查询校验快照 | `requireAuth` |

新增路由同步登记：公开 5 / 受保护清单更新（受保护 12→16），CI 鉴权覆盖统计口径同步。

### 2.4 AI 生成内容标识（办法 §4 显式 + §5 隐式）

接入点为 [lib/multimodal/audio-processor.ts](../../lib/multimodal/audio-processor.ts) 的 `synthesizeSpeech`（当前为模拟实现，真实 TTS 供应商接入后逻辑不变）：

```ts
// 显式标识：文本头部注入播报提示（办法 §4，文本提示置于内容起始）
const AI_DISCLOSURE = "您好，本次通话由 YYC³ 智能语音助手为您服务。";
// 隐式标识：结果元数据写制作要素（办法 §5：服务提供者名称/编码、内容编号）
data.features.aiGenerated = true;
data.features.provider = "yyc3-ai-calling";
data.features.providerCode = "YYC3-VOICE-01";
data.features.contentId = callId; // 关联外呼任务，审计可追溯
```

约束：`AI_DISCLOSURE` 常量集中管理于 `lib/compliance/disclosure.ts`，禁止各处散落字符串；显式文本可按话术场景自定义措辞但**不可关闭**（配置项仅允许改文案，无开关）。

### 2.5 录音留存 30 日

1. `Call.recordingUrl` 写入时同步写 `recordingExpiresAt = now + 30d`；
2. 新建 `scripts/purge-expired-recordings.ts`（M1-C5 交付）：扫 `recordingExpiresAt < now` 的记录，删存储对象（对象存储生命周期规则兜底）+ 置空 `recordingUrl`，逐条写 `AuditLog`；
3. 调度：GitHub Actions cron（`.github/workflows/maintenance.yml`，`schedule: cron "17 3 * * *"`）+ 部署环境 crontab 双通道，幂等可重跑；
4. 留存天数集中配置 `lib/compliance/config.ts`（默认 30，**待验证**项在此单点收敛，监管口径更新时只改一处）。

### 2.6 合规引擎测试与门禁

- 单测：`tests/unit/lib/compliance/precall.test.ts`（五道闸各 2 例：通过/阻断 + 快照断言）、`tests/unit/lib/compliance/disclosure.test.ts`（显式文本存在性 + 隐式元数据字段断言）；
- 集成：`tests/integration/compliance-flow.test.ts`（号码入库→校验→任务状态流转→禁拨命中）；
- 路由测试对齐既有 `tests/unit/api/*.test.ts` 模式（`requireAuth` bypass mock + 鉴权由专门测试覆盖）；
- 新增代码纳入既有覆盖率阈值门禁，**阈值随新增代码同步上调**（只升不降原则）。

---

## 三、延迟埋点落地方案

### 3.1 指标定义（Prometheus 命名，挂接既有 [lib/observability/index.ts](../../lib/observability/index.ts) 的 Histogram/Gauge）

| 指标 | 定义 | 对标 | 阶段 |
|---|---|---|---|
| `yyc3_chat_ttft_ms` | `chat/stream` 请求到首字节 chunk | ≤200ms | **M2 立即可做**（文本链路已通） |
| `yyc3_chat_stream_total_ms` | 流结束总耗时 | — | M2 |
| `yyc3_tts_processing_ms` | `synthesizeSpeech.processingTime`（字段已存在） | TTFT ≤200ms | M2（现值即埋点，真实 TTS 接入后自动校准） |
| `yyc3_asr_first_token_ms` | 流式 ASR 首字 | ≤300ms（级联预算） | M3（随真实语音管线建设） |
| `yyc3_call_e2e_latency_ms` | 用户停说到 AI 出声 | **≤800ms**（行业生产目标；Retell 600ms 为优秀线） | M3 |
| `yyc3_bargein_response_ms` | 打断检测到停播 | ≤200ms（Retell 140/PolyAI 190） | M3 |
| `yyc3_stream_continuity` | 流连续性 | 99.7%（Retell） | M3 |

预算分配（级联管线）：ASR 首字 300ms + LLM TTFT 200ms + TTS 首包 200ms + 网络 100ms = **800ms 封顶**，各段独立埋点超标可定位。

### 3.2 文本链路 TTFT 埋点（[app/api/ai/chat/stream/route.ts](../../app/api/ai/chat/stream/route.ts)，一行包装）

`chatStream` 返回 ReadableStream，包一层 `TransformStream` 记录首 chunk 时间：

```ts
import { observeTtft } from "@/lib/observability";

let firstByteAt: number | null = null;
const startedAt = performance.now();
const timed = stream.pipeThrough(
  new TransformStream({
    transform(chunk, controller) {
      if (firstByteAt === null) {
        firstByteAt = performance.now() - startedAt;
        observeTtft("chat_stream", firstByteAt);
      }
      controller.enqueue(chunk);
    },
  })
);
```

`observeTtft` 为 [lib/observability/index.ts](../../lib/observability/index.ts) 新增的薄封装（内部走既有 Histogram 结构），导出保持零依赖。

### 3.3 上报与聚合

1. 服务端指标：直写内存 Histogram（现有机制），`/api/health` 或新增 `/api/metrics` 暴露 Prometheus 文本格式（受 `requireAuth` 或内网保护）；
2. 客户端语音侧（M3）：`lib/telemetry/latency-client.ts` 采样上报 → `POST /api/telemetry/latency`（`requireAuth`）→ Redis List 缓冲（复用降级模式：Redis 不可达时丢弃采样不阻塞业务）→ 定时批量落 `Interaction.metadata`；
3. 采样率配置化（默认 100% 起步，量起后降采样）。

### 3.4 看板与 SLO

1. [lib/analytics/dashboard.ts](../../lib/analytics/dashboard.ts) 增「延迟面板」：TTFT/E2E P50/P95 直方图分位 + 超标占比（可视化维度落地）；
2. SLO 入门禁：把「`chat_ttft` P95 ≤200ms（M2）/ `call_e2e` P95 ≤800ms（M3）」写入《[YYC3-上线部署-稳定运维](./YYC3-上线部署-稳定运维.md)》上线门禁表，超标即阻断发布（高可用条目 2 的落地）；
3. **顺带关闭 P1-8**：同迭代接入 `@lhci/cli`（devDependency + CI 步骤），采集 FCP/LCP 基线，遗留风险 R1 关闭。

---

## 四、迭代任务列表（遗留风险 7 项全量转化 + 合规/埋点落地）

> 规模标记：S=半天内 / M=1-2 天 / L=3 天以上（仅复杂度标度，非承诺工期）。
> 每任务 DoD 通用项：tsc 0 error、lint 预算不升、新增代码带测试且覆盖率阈值上调、文档 front matter 齐全。

### 迭代一 M1：合规闭环（P0 监管硬门槛）

| ID | 任务 | 关键改动 | DoD（验收标准） | 规模 |
|---|---|---|---|---|
| C1 | 数据模型迁移 | `prisma/schema.prisma` 增 `PhoneNumber`/`DncEntry`/`OutboundTask` + `Call.recordingExpiresAt` | `pnpm db:migrate` 成功；`pnpm db:verify` 通过；seed 补示例号码 | M |
| C2 | 预呼校验管线 | 新建 `lib/compliance/precall.ts` 五道闸 + `lib/compliance/config.ts` | 五道闸单测 10+ 例全绿；阻断路径写 `AuditLog` 断言 | L |
| C3 | AI 内容标识 | `lib/compliance/disclosure.ts` + `audio-processor.synthesizeSpeech` 注入显式文本与隐式元数据 | disclosure 单测断言显式文本存在 + `features.aiGenerated/provider/contentId` 齐全；无关闭开关 | S |
| C4 | 合规 API 四路由 | `app/api/compliance/{numbers,dnc,precall-check}/route.ts`，全部 `requireAuth` + RBAC | 路由单测（bypass mock 模式）；precall-check 集成测试覆盖通过/阻断两态 | M |
| C5 | 录音留存清理 | `Call` 写入时带 `recordingExpiresAt`；`scripts/purge-expired-recordings.ts`；`maintenance.yml` cron | 脚本幂等（重跑零副作用）；对到期记录置空 URL + 审计日志断言 | M |
| C6 | 外呼链路接入校验 | 外呼发起入口（现有 WS/后续 SIP 接入点）前置 `runPrecallCheck`，`ok=false` 拒绝并回执原因 | 集成测试：禁拨号码外呼被拒且任务状态 `BLOCKED` | M |
| C7 | 合规台账页面 | 新增管理页：号码状态/禁拨名单/校验记录三表（shadcn/ui DataTable） | jest-axe 全绿；RBAC 无权限不可见 | M |

**M1 出口标准**：监管三件套（号码白名单、AI 双标识、录音留存）代码级闭环；复测报告 §6.2 B3/B4/B5 三项转「已落地」。

### 迭代二 M2：观测闭环（文本链路先行 + P1-8 关闭）

| ID | 任务 | 关键改动 | DoD | 规模 |
|---|---|---|---|---|
| T1 | TTFT 埋点 | `lib/observability` 增 `observeTtft`；`chat/stream` 包装 TransformStream | 单测：mock 流首 chunk 触发记录；P95 逻辑正确 | S |
| T2 | TTS 处理耗时直通 | `yyc3_tts_processing_ms` 接 `processingTime` | 指标随 `processAudio` 断言 | S |
| T3 | 指标暴露端点 | `/api/metrics`（鉴权保护）输出 Prometheus 文本 | 格式校验测试；未授权 401 | S |
| T4 | 延迟看板 | `analytics/dashboard.ts` 延迟面板（P50/P95/超标占比） | 看板组件 axe 全绿 + 渲染测试 | M |
| T5 | LHCI 接入 | `@lhci/cli` devDep + CI 步骤，采集 FCP/LCP 基线 | CI 产出报告工件；基线数值回写执行报告 §9.2 P1-8 行 | M |
| T6 | SLO 门禁登记 | 《上线部署-稳定运维》门禁表增 TTFT P95 ≤200ms | 文档更新 + 变更历史 | S |

**M2 出口标准**：P1-8 关闭（遗留风险 R1 清零）；文本链路延迟可观测；SLO 进入发布门禁。

### 迭代三 M3：治理收尾 + 语音管线埋点（真实语音接入时启动）

| ID | 任务 | 关键改动 | DoD | 规模 |
|---|---|---|---|---|
| V1 | 语音管线级联埋点 | ASR 首字/E2E/barge-in 三指标随真实 ASR/TTS 供应商接入落地 | 各段直方图 + 预算分配表校验 | L |
| V2 | 客户端上报通道 | `lib/telemetry/latency-client.ts` + `/api/telemetry/latency` + Redis 缓冲 | Redis 不可达时静默降级测试 | M |
| R2 | 全库历史断链归档 | 126 条断链按「归档标注」分批：历史报告头部加归档声明，活跃文档修链 | 断链扫描脚本全库 0 真 断链 | M |
| R3 | 令牌存储升级 | `auth/oauth` 扩 Set-Cookie HttpOnly + Refresh 轮换；`auth-client` 去除 localStorage 明文 | 轮换测试 + XSS 面收敛说明 | M |
| R4 | 登录 UI | 登录页接 `/api/auth`，token 会话托管 | 组件测试 + axe 全绿 | M |
| R5 | ai-hub peer 核对 | 升级 ai-hub 时核对 `openai` peer 区间（纳入升级 checklist 文档） | checklist 落档 | S |
| R6 | Dependabot 重扫确认 | esbuild override 后重扫，确认 low 告警关闭 | 告警清单 0 esbuild 项 | S |
| R7 | lint 收敛首批 | `no-unused-vars` 199 清零（`--fix` + 人工），预算降至 ≤450 | 预算下调提交 | M |

**M3 出口标准**：复测报告 §九 全部 7 项遗留风险关闭或转正融入日常治理；语音延迟指标具备对标 Retell 的可比较基线。

### 依赖关系

```
C1 → C2 → C4 → C6 → M1 出口
C3 独立可并行；C5 依赖 C1；C7 依赖 C4
T1/T2/T3 并行 → T4；T5/T6 独立
V1/V2 依赖真实语音供应商接入决策；R2-R7 相互独立
```

---

## 五、验收门禁汇总

1. 迭代出口必须同口径复跑复测报告 §四 五项命令（type-check / lint / jest --coverage / build / 断链扫描），结论写入变更历史；
2. 覆盖率阈值随新增代码**只升不降**；lint 预算只减不增；
3. 合规相关测试（五道闸、disclosure、留存清理）纳入 CI Test 步骤，**失败即阻断合并**；
4. 监管口径变更（留存天数、时段窗口、频次上限）只改 `lib/compliance/config.ts` 单点，配置变更走 `AuditLog`。

## 六、风险与依赖

| 风险 | 缓解 |
|---|---|
| 录音留存「≥30 日」为历史口径，本轮未重新检索佐证 | `lib/compliance/config.ts` 单点配置；C5 落地前做一次法规复核（任务内含） |
| 禁拨时段/频次默认值属行业惯例而非强制条文 | 全部配置化 + 文档标注「以当地监管与运营商协议为准」 |
| 真实语音供应商未选型，V1 无法启动 | M3 与供应商选型解耦：M1/M2 交付不依赖 V1 |
| `synthesizeSpeech` 当前为模拟实现 | 标识逻辑写在结果组装层，供应商替换不动标识代码 |

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| --- | --- | --- | --- |
| v1.0.0 | 2026-11-20 | 首次发布：合规引擎五道闸 + AI 双标识 + 录音留存方案、延迟埋点指标体系与 M1-M3 三迭代任务列表（遗留风险 7 项全量转化） | YYC³ Team |
| v1.1.0 | 2026-11-20 | **M1 合规闭环执行完成**：C1 迁移 `20261120134817_compliance_engine` 已应用（migrator 角色通道，shadow 库权限受限改用 diff+deploy 标准替代路径）；C2 五道闸管线（precall 17 用例）；C3 AI 双标识注入 synthesizeSpeech（6 用例）；C4 合规 API 四路由（11 用例，403/422 硬约束覆盖）；C5 录音留存 attachRecording+purge 幂等+双通道调度（4 用例）；C6 外呼发起入口合规前置（集成 3 例：DNC→BLOCKED+审计）；C7 合规台账组件（6 用例含 RBAC 列可见性+axe）。合规测试合计 41/41 全绿；M1 出口复测 tsc 0 error / lint 0e647w / jest 283/283 / 覆盖率门禁通过（73.2/57.14/75.29/74.9）/ build 成功 | YYC³ Team |
| v1.2.0 | 2026-11-20 | **M2 观测闭环执行完成（P1-8 关闭）**：T1 `observeTtft`/`trackStreamTtft`（TransformStream 首字节 + 总耗时，jsdom/edge 环境防御直通）包装 `/api/ai/chat/stream`（4 用例）；T2 TTS 耗时直通 `yyc3_tts_processing_ms`；T3 `/api/metrics` Prometheus 端点（MANAGER+ 门禁，3 用例；顺带修复 MetricsCollector 导出格式缺陷：TYPE 行去 label、quantile 并入 label 集）；T4 `buildLatencySnapshot` 三态 SLO 判定 + `LatencyPanel` 组件（5 用例含 axe）；T5 LHCI 接入（`@lhci/cli` + `lighthouserc.json` staticDistDir=out + CI 步骤），本地 Playwright Chromium 实测静态导出基线：**首页性能分 100 / FCP 0.2s / LCP 0.2s / TBT 0ms**（a11y 86）；T6 SLO 门禁表登记 TTFT P95 ≤200ms（上线部署 §3.1/§6.1）。M2 出口复测 tsc 0 error / lint 0e / jest 全绿 + 覆盖率门禁 / standalone+export 双构建成功 | YYC³ Team |
| v1.3.0 | 2026-11-20 | **M3 治理收尾执行完成（R2-R7）**：R6 next 15.5.28→15.5.29（Dependabot 6 条 medium 全部修复于该版本，含 Edge HttpOnly 暴露）+ esbuild 告警清零确认；R5 [依赖升级核对清单](../YYC3-AI-Call-运维阶段/166-YYC3-AI-Call-运维阶段-依赖升级核对清单.md) 落档（file: 包升级流程 + openai ✓/ollama 缺口）；R7 lint 收敛 647→443（unused-vars 217→约 1，vars/caughtErrors IgnorePattern 补齐 + 行为保真 codemod 196 处重命名/别名，预算门禁降至 450 exit 0）；R3 令牌升级 HttpOnly Cookie（[auth-cookies](../../lib/auth-cookies.ts) + login/refresh/logout 三端点 + 轮换撤销，auth-client 2.0 去 localStorage，6 用例）；R4 LoginForm（Cookie 通道无令牌落盘，5 用例含 axe）；R2 全库 263 文件 229 链接 0 断链（活跃修链 9 + 归档声明 3 份 + 真实目标重指 24）。V1/V2 随语音供应商选型启动（解耦承诺兑现）。M3 出口：tsc 0 / lint 0e443w / jest 全绿 + 门禁 / build 成功 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
