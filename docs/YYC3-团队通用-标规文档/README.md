---
file: README.md
title: YYC³ 团队通用标规文档 — 目录索引
description: YYC³ 团队标准规范目录索引 — 五维驱动、开发标准、命名规范、标头标尾、文档闭环与 AI 协同开发
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-01
updated: 2026-11-01
status: stable
tags: [index, standard, policy, navigation]
category: general
language: zh-CN
audience: developers,managers,stakeholders
complexity: basic
---

# YYC³ 团队通用标规文档 — 目录索引

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

本目录存放**团队级强制规范**：所有项目、所有文档与代码都必须遵循的底线条款。修订本目录内容等同于修订团队标准，须走规范的变更评审。

## 二、文档清单

| 序号 | 文档 | 说明 | 版本 | 状态 |
| ---- | ---- | ---- | ---- | ---- |
| 01 | [YYC³ 团队通用-五维驱动](./YYC3-团队通用-五维驱动.md) | 五高 / 五标 / 五化 / 五维 核心机制与度量指标 | v2.1.0 | stable |
| 02 | [YYC³ 团队通用-开发标准](./YYC3-团队通用-开发标准.md) | 文档规范、代码标头、命名、项目结构与质量门禁 | v2.1.0 | stable |
| 03 | [YYC³ 团队通用-命名规范](./YYC3-团队通用-命名规范.md) | 目录 / 文件 / 代码标识命名与品牌写法 | v3.1.0 | stable |
| 04 | [YYC³ 团队通用-标头标尾](./YYC3-团队通用-标头标尾.md) | 品牌元素、各语言代码标头、文档标头与页脚模板 | v1.1.0 | stable |
| 05 | [YYC³ 团队通用-文档闭环](./YYC3-团队通用-文档闭环.md) | 模版体系、追溯机制、迭代演进与工具支撑 | v2.1.0 | stable |
| 06 | [YYC³ 团队通用-开发文档](./YYC3-团队通用-开发文档.md) | AI 协同开发流程：入职、存档、衔接与收尾 | v2.1.0 | stable |

## 三、阅读顺序建议

| 角色 | 建议顺序 |
| ---- | -------- |
| 首次接触项目 | 05 → 06 → 02 |
| 日常编码 | 02 → 03 → 04 |
| 文档编写 | 04 → 03 → 05 |
| 机制对齐 | 01 → 02 |

## 四、目录不变量

1. 文件名统一为 `YYC3-团队通用-{主题}.md`（ASCII 前缀 + 中文主题）
2. 全部文档使用《标头标尾》§二 的 Markdown 标头与 §4.3 的标尾
3. `file` 字段必须与磁盘文件名一致，`title` 必须与 H1 一致
4. 正文品牌统一写作 `YYC³`；路径与代码标识使用 ASCII `YYC3`
5. 日期统一基准：2026-11-01（批量规范化后同日对齐）
6. 文档 `tags` 必须为合法 YAML 序列，禁止 `[a],[b],[c]`

## 五、配套目录

- [YYC³ 团队通用-开发指南](../YYC3-团队通用-开发指南/README.md) — 面向开发者的落地指南

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.0.0 | 2026-11-01 | 新建目录索引，纳入 6 篇标规文档与不变量清单 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
