---
file: YYC3-团队通用-命名规范.md
title: YYC³ 团队命名规范 — 目录 · 文件 · 代码 · 文档
description: YYC³ 团队命名规范 — 文档目录、文件、代码标识与品牌写法统一标准
author: YYC³ Team <admin@0379.email>
version: v3.1.0
created: 2026-11-01
updated: 2026-11-01
status: stable
tags: [standard, naming, document, directory]
category: policy
language: zh-CN
audience: developers,managers
complexity: basic
---

# YYC³ 团队命名规范 — 目录 · 文件 · 代码 · 文档

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

## 📋 命名规范

### 项目级文档 (`/docs/`)

#### 目录命名规范

**格式**: `{序号}-{阶段}-{功能}-{子功能}`

**示例**:

```
00-YYC3-项目总览-目录索引/
01-YYC3-项目规划-启动阶段/
02-YYC3-项目规划-设计阶段/
03-YYC3-项目开发-实施阶段/
04-YYC3-项目测试-审核阶段/
05-YYC3-项目部署-文档闭环/
06-YYC3-项目运营-维护阶段/
07-YYC3-项目合规-安全保障/
08-YYC3-项目整合-实施阶段/
09-YYC3-项目资产-知识管理/
10-YYC3-项目模版-标准规范/
11-YYC3-智能演进-优化阶段/
12-YYC3-用户指南-操作手册/
```

**规则**:

- 序号: 2 位数字（00-99）
- 阶段: 项目规划、项目开发、项目测试、项目部署、项目运营、项目合规、项目整合、项目资产、项目模版、智能演进、用户指南
- 功能: 简短描述（中文）
- 子功能: 可选，进一步细分

#### 文件命名规范

**格式**: `{序号}-{项目}-{功能}-{描述}.md`

**示例**:

```
001-项目总览索引-项目总览手册.md
002-项目总览索引-快速开始指南.md
003-代码标头规范标准.md
004-项目多维检测审查报告.md
```

**规则**:

- 序号: 3 位数字（001-999）
- 项目: YYC³（文件名与目录名统一使用 ASCII 形式 `YYC3`，避免全角与上标字符）
- 功能: 简短描述（中文）
- 描述: 详细描述（中文）

#### 标准规范文档命名

**格式**: `YYC3-{功能}-{描述}.md`

**示例**:

```
YYC3-代码标头规范标准.md
YYC3-代码标头规范化最终总结报告.md
YYC3-项目多维检测审查报告.md
YYC3-文档架构整理报告.md
YYC3-封装文档更新指南.md
```

---

### 应用级文档 (`/src/app/docs/`)

#### 文件命名规范

**格式**: `{功能}-{类型}.ts`

**示例**:

```
API-REFERENCE.ts
COMPONENT-REFERENCE.ts
DEVELOPER-HANDOFF.ts
TESTING-GUIDE.ts
ALIGNMENT-PLAN.ts
FINAL-AUDIT-REPORT.ts
HA-ARCHITECTURE-TEST.ts
LOCAL-DESIGN-GUIDE.ts
STORAGE-AUDIT.ts
```

**规则**:

- 功能: 大写字母，单词用连字符分隔
- 类型: REFERENCE, GUIDE, HANDOFF, REPORT, TEST, PLAN, AUDIT

---

## 📊 文档类型分类

### 项目级文档类型

| 类型 | 说明 | 示例 |
| ---- | ---- | ---- |
| 项目总览 | 项目介绍、快速开始 | 00-YYC3-项目总览-目录索引/ |
| 项目规划 | 启动、设计 | 01-YYC3-项目规划-启动阶段/ |
| 项目开发 | 实施阶段 | 03-YYC3-项目开发-实施阶段/ |
| 项目测试 | 审核阶段 | 04-YYC3-项目测试-审核阶段/ |
| 项目部署 | 文档闭环 | 05-YYC3-项目部署-文档闭环/ |
| 项目运营 | 维护阶段 | 06-YYC3-项目运营-维护阶段/ |
| 项目合规 | 安全保障 | 07-YYC3-项目合规-安全保障/ |
| 项目整合 | 实施阶段 | 08-YYC3-项目整合-实施阶段/ |
| 项目资产 | 知识管理 | 09-YYC3-项目资产-知识管理/ |
| 项目模版 | 标准规范 | 10-YYC3-项目模版-标准规范/ |
| 智能演进 | 优化阶段 | 11-YYC3-智能演进-优化阶段/ |
| 用户指南 | 操作手册 | 12-YYC3-用户指南-操作手册/ |
| 标准规范 | 代码规范、审查报告 | YYC3-*.md |

### 应用级文档类型

| 类型 | 说明 | 示例 |
| ---- | ---- | ---- |
| API 参考 | API 接口文档 | API-REFERENCE.ts |
| 组件参考 | 组件使用文档 | COMPONENT-REFERENCE.ts |
| 开发者交接 | 开发协作规范 | DEVELOPER-HANDOFF.ts |
| 测试指南 | 测试规范和最佳实践 | TESTING-GUIDE.ts |
| 对齐计划 | 项目对齐计划 | ALIGNMENT-PLAN.ts |
| 审核报告 | 最终审核报告 | FINAL-AUDIT-REPORT.ts |
| 架构测试 | 高可用架构测试 | HA-ARCHITECTURE-TEST.ts |
| 设计指南 | 本地设计指南 | LOCAL-DESIGN-GUIDE.ts |
| 存储审计 | 存储审计报告 | STORAGE-AUDIT.ts |

---

## 🎯 命名原则

### 1. 一致性

- 所有文档使用统一的命名格式
- 相同类型的文档使用相同的后缀
- 序号保持连续性

### 2. 可读性

- 使用中文描述，便于理解
- 使用连字符分隔，便于解析
- 避免使用特殊字符

### 3. 可扩展性

- 预留足够的序号空间
- 支持多层子目录
- 支持新类型的文档

### 4. 标准化

- 遵循行业最佳实践
- 符合 YYC³ 标准化要求
- 便于自动化处理

### 5. 品牌写法（强制）

统一品牌标识：**YYC³**（YanYuCloudCube™ 已完成商标注册）。

| 使用场景 | 写法 | 示例 |
| -------- | ---- | ---- |
| 正文品牌、标题、示例名称 | `YYC³` | `YYC³ 部署运维与 CI/CD 指南` |
| 首次出现的品牌定义 | `YYC³（YanYuCloudCube™ 注册商标）` | 标头标语行、版权行 |
| 文件名、目录名、包名、变量名 | `YYC3`（ASCII） | `YYC3-开发者-部署运维.md`、`@yyc3/shell` |
| 版权与作者 | `YYC³ Team` / `© 2026 YanYuCloudCube™（YYC³）` | 标尾、`author` 字段 |

- 禁止在正文与示例中使用带序号或后缀的品牌变体（如 `YanYuCloudCube 02`）
- 禁止混用全角/上标字符写入路径：`YYC³-xxx.md` 不得作为真实文件名

---

## 📝 文档模板

### 项目级文档模板

```markdown
# {序号}-{项目}-{功能}-{描述}

## 📋 文档说明

{文档说明}

## 📄 文档内容

{文档内容}

---

**最后更新**: {日期}
**维护者**: {维护者}
```

### 应用级文档模板

```typescript
/**
 * {功能}-{类型}
 * ================
 * {描述}
 */

// 文档内容
```

---

## 🔗 相关文档

- [YYC³ 团队通用-开发标准](./YYC3-团队通用-开发标准.md)
- [YYC³ 团队通用-标头标尾](./YYC3-团队通用-标头标尾.md)
- [YYC³ 团队通用-文档闭环](./YYC3-团队通用-文档闭环.md)
- [YYC³ 开发者-编码规范](../YYC3-团队通用-开发指南/YYC3-开发者-编码规范.md)

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v3.1.0 | 2026-11-01 | 统一标头标尾 · 品牌标识统一为 YYC³ · 排版与语法规范化 · 时间基准统一为 2026-11-01 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
