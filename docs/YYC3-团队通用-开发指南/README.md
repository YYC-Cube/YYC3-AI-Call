---
file: README.md
title: YYC³ 团队通用开发指南 — 目录索引
description: YYC³ 开发者指南目录索引 — 快速入门、架构、插件、编码、测试、安全、多端与部署运维
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-01
updated: 2026-11-01
status: stable
tags: [index, guide, onboarding, navigation]
category: general
language: zh-CN
audience: developers,devops
complexity: basic
project: yyc3-ai-dev
phase: development
---

# YYC³ 团队通用开发指南 — 目录索引

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

## 一、目录职责

本目录存放**面向开发者的落地指南**：把《YYC³ 团队通用-标规文档》中的强制规范，落到具体技术栈（Next.js / React / TypeScript / pnpm / Vitest / Electron）的可执行步骤。

## 二、文档清单

| 序号 | 文档 | 说明 | 版本 | 状态 |
| ---- | ---- | ---- | ---- | ---- |
| 01 | [YYC³ 开发者-快速入门](./YYC3-开发者-快速入门.md) | 环境搭建、Monorepo 认知、首个插件开发 | v1.1.0 | stable |
| 02 | [YYC³ 开发者-架构总纲](./YYC3-开发者-架构总纲.md) | Shell + 插件体系、EventBus、存储、安全加固 | v1.3.0 | stable |
| 03 | [YYC³ 开发者-插件开发](./YYC3-开发者-插件开发.md) | 插件骨架、注册、引擎、事件与 FamilySkill | v1.2.0 | stable |
| 04 | [YYC³ 开发者-编码规范](./YYC3-开发者-编码规范.md) | TypeScript / React / 命名 / 标头 / 样式标准 | v1.1.0 | stable |
| 05 | [YYC³ 开发者-测试策略](./YYC3-开发者-测试策略.md) | Vitest 配置、测试分层、覆盖率与 TDD | v1.1.0 | stable |
| 06 | [YYC³ 开发者-多端适配](./YYC3-开发者-多端适配.md) | Web / 桌面 / 经典三端矩阵与适配红线 | v1.0.0 | stable |
| 07 | [YYC³ 开发者-安全合规](./YYC3-开发者-安全合规.md) | 数据安全、密钥管理、XSS、依赖与权限 | v1.2.0 | stable |
| 08 | [YYC³ 开发者-部署运维](./YYC3-开发者-部署运维.md) | 构建流程、Docker、CI/CD、监控与告警 | v1.1.0 | stable |

## 三、阅读顺序建议

| 场景 | 建议顺序 |
| ---- | -------- |
| 新人入职第一天 | 01 → 02 → 04 |
| 要写一个插件 | 03 → 02 → 05 |
| 要发版 | 05 → 08 → 07 |
| 要接新端 | 06 → 02 → 08 |

## 四、目录不变量

1. 文件名统一为 `YYC3-开发者-{主题}.md`（ASCII 前缀 + 中文主题）
2. 全部文档使用《标头标尾》§二 的 Markdown 标头与 §4.3 的标尾
3. 工程命令统一 `pnpm`，禁止 `npm` / `yarn`
4. 质量门禁统一：`tsc --noEmit` 零错误 + `vitest run` 全绿
5. 开发服务器端口自 3030 起分配
6. 正文品牌统一写作 `YYC³`；包名 / 路径使用 ASCII `yyc3-*`

## 五、配套目录

- [YYC³ 团队通用-标规文档](../YYC3-团队通用-标规文档/README.md) — 团队强制标准与红线条款

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.0.0 | 2026-11-01 | 新建目录索引，纳入 8 篇开发者指南与不变量清单 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
