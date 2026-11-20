---
file: 166-YYC3-AI-Call-运维阶段-依赖升级核对清单.md
description: @yyc3 生态包与关键依赖升级核对清单 — file: 本地包升级流程、peer 依赖核对表、回归门禁
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-20
updated: 2026-11-20
status: stable
tags: [运维, 依赖管理, 升级清单, peer-dependencies]
category: ops
language: zh-CN
audience: developers,devops
complexity: basic
project: yyc3-ai-dev
phase: production
---

# YYC³ 运维阶段 · 依赖升级核对清单

> 适用对象：`@yyc3/*` 生态包（**file: 本地包**，位于 `docs/packages/`）与宿主关键依赖
> 来源任务：《[合规引擎-延迟埋点-落地方案](../YYC3-项目闭环-验收系统/YYC3-合规引擎-延迟埋点-落地方案.md)》§四 R5
> 原则：升级必须过回归门禁；peer 缺口禁止带病上线。

## 一、生态包升级流程（file: 本地包特性）

`@yyc3/core`、`@yyc3/ai-hub` 等通过 `file:docs/packages/<pkg>` 引入——**没有远端版本可拉**，
「升级」= 更新 `docs/packages/<pkg>` 源码并重装链接：

```bash
# 1. 更新本地包源码后，强制重链接（pnpm 缓存 file: 协议内容）
pnpm install --force
# 2. 验证 dist 与 peer 声明一致（示例：ai-hub）
node -e "const p=require('./node_modules/@yyc3/ai-hub/package.json');console.log(p.version, p.peerDependencies)"
# 3. 回归门禁（见 §三）
```

## 二、peer 依赖核对表（升级 ai-hub 时逐项核对）

| peer 声明（ai-hub@1.4.0） | 区间 | 宿主安装状态（2026-11-20 实测） | 缺口处理 |
| --- | --- | --- | --- |
| `openai` | `>=4.0.0` | **7.61.0** ✓（devDependencies） | 无；升级 ai-hub 时复核新区间 |
| `ollama` | `>=0.5.0` | **未安装** ⚠️ | 仅当启用 ollama 适配器时需补装；当前 chat 链路走 openai 兼容端点，不触发加载。若引入 ollama 路由：`pnpm add -D ollama` 后再升级 |

核对命令（升级前跑一遍）：

```bash
node -e "const p=require('./node_modules/@yyc3/ai-hub/package.json');console.log(JSON.stringify(p.peerDependencies))"
grep -E '"(openai|ollama)"' package.json
```

## 三、升级回归门禁（全部通过方可合入）

1. `pnpm type-check` → 0 error
2. `pnpm exec jest --coverage` → 全绿 + 覆盖率阈值门禁通过（阈值只升不降）
3. `pnpm lint --max-warnings <当前预算>` → 不超预算
4. `pnpm build` → 成功（若集成测试涉及 ESM-only 包：确认 `jest.config.js` moduleNameMapper 仍指向有效 dist 入口）
5. Dependabot 重扫：升级后无新增 open 告警

## 四、升级记录（追加式台账）

| 日期 | 包/依赖 | 从 → 到 | 触发 | 回归 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 2026-11-20 | openai（宿主 devDep） | 未装 → 7.61.0 | ai-hub peer 缺口（M1 前整改） | jest 242/242 | 见验收整改报告 §9.1 P0-2 |
| 2026-11-20 | next | 15.5.28 → 15.5.29 | Dependabot 6 条 medium（含 Edge HttpOnly 暴露） | jest 308/308 + tsc 0 + build | R6 执行项；GitHub 重扫后告警关闭 |
| 2026-11-20 | esbuild | 0.27.7 → 0.28.2 | pnpm.overrides | 锁文件确认 | 见闭环验收执行报告 §七 |

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| --- | --- | --- | --- |
| v1.0.0 | 2026-11-20 | 首次发布：file: 包升级流程、ai-hub peer 核对表（openai ✓ / ollama 缺口标注）、回归门禁、升级台账 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
