---
file: YYC3-团队通用-标头标尾.md
title: YYC³ 团队标头标尾规范 — 品牌 · 代码 · 文档 · 页脚
description: YYC³ 标头标尾规范 — 品牌元素、各语言代码标头、文档标头与页脚模板及选用矩阵
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-01
updated: 2026-11-01
status: stable
tags: [standard, header, footer, brand, template]
category: policy
language: zh-CN
audience: developers,managers
complexity: basic
---

# YYC³ 团队标头标尾规范 — 品牌 · 代码 · 文档 · 页脚

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

## 一、核心品牌元素

统一符号集，所有标头标尾均从此处取值：

| 元素 | 取值 |
| ---- | ---- |
| **主品牌** | `YYC³`（YanYuCloudCube™，已完成商标注册） |
| **中文标语 1** | `言启象限 \| 语枢未来`（表格内须转义竖线） |
| **英文标语 1** | `Words Initiate Quadrants, Language Serves as Core for Future` |
| **中文标语 2** | `万象归元于云枢 \| 深栈智启新纪元` |
| **英文标语 2** | `All things converge in cloud pivot; Deep stacks ignite a new era of intelligence` |
| **官方邮箱** | `admin@0379.email` |
| **版权主体** | `YanYuCloudCube™（YYC³）` |
| **团队署名** | `YYC³ Team` |
| **可替换变量** | `{YEAR}`、`{PROJECT}`、`{FILE_NAME}`、`{DOC_TITLE}`、`{VERSION}`、`{AUTHOR}`、`{LICENSE}` |

### 1.1 品牌写法规则（强制）

| 场景 | 写法 | 示例 |
| ---- | ---- | ---- |
| 正文、标题、示例名称 | `YYC³` | `YYC³ 部署运维与 CI/CD 指南` |
| 首次出现（标头标语行、版权行） | `YYC³（YanYuCloudCube™ 注册商标）` | 见 §二 标准标头 |
| 文件名、目录名、包名、代码标识 | `YYC3`（ASCII） | `YYC3-开发者-部署运维.md`、`@yyc3/shell` |
| 作者与版权 | `YYC³ Team` / `© 2026 YanYuCloudCube™（YYC³）` | front matter `author`、标尾 |

- 示例名称一律使用 `YYC³`，禁止使用带序号或后缀的品牌变体（如 `YanYuCloudCube 02`）
- 路径中禁止使用上标字符：不得创建名为 `YYC³-xxx.md` 的真实文件

---

## 二、Markdown 文档标头（本团队唯一标准）

`YYC3-团队通用-标规文档` 与 `YYC3-团队通用-开发指南` 两个目录下的全部文档，一律使用以下标头：

```markdown
---
file: {FILE_NAME}
title: {DOC_TITLE}
description: {DOC_DESCRIPTION}
author: YYC³ Team <admin@0379.email>
version: {VERSION}
created: {CREATE_DATE}
updated: {UPDATE_DATE}
status: {STATUS}
tags: [标签1, 标签2, 标签3]
category: {CATEGORY}
language: zh-CN
audience: {AUDIENCE}
complexity: {COMPLEXITY}
---

# {DOC_TITLE}

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---
```

### 2.1 字段顺序与约束

1. 字段顺序固定，不得增删必填字段
2. `file` 必须与磁盘文件名完全一致（ASCII `YYC3` 形式）
3. `title` 必须与正文 H1 一致
4. `created` / `updated` 使用 `YYYY-MM-DD`；一次性批量修订时两者可同日
5. 分类扩展字段（`project`、`phase`、`design_type`、`review_status` 等）追加在 `complexity` 之后
6. `tags` 必须写成合法 YAML 流式序列 `[a, b, c]`；**禁止** `[a],[b],[c]` 写法（该写法会导致 front matter 解析失败）
7. 字段取值定义见《YYC³ 团队通用-开发标准.md》§1.3 ~ §1.6

---

## 三、代码文件标头模板

### 3.1 脚本类（Python / Ruby / Shell / Perl）

**注释符**：`#`

**▸ 极简版**

```python
# YYC³ · 言启象限
# Copyright (c) 2026 YanYuCloudCube™（YYC³）. All rights reserved.
```

**▸ 标准版（推荐日常开发）**

```python
# ============================================================
# YYC³（YanYuCloudCube™ · 注册商标）
# 言启象限 | 语枢未来
# Words Initiate Quadrants, Language Serves as Core for Future
# ============================================================
# 万象归元于云枢 | 深栈智启新纪元
# All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
# ============================================================
# Copyright (c) 2026 YanYuCloudCube™（YYC³）
# Contact: admin@0379.email
# ============================================================
```

**▸ 完整版（带模块描述与作者）**

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ==============================================================================
# YYC³（YanYuCloudCube™ · 注册商标）— 言启象限 · 语枢未来
# Words Initiate Quadrants, Language Serves as Core for Future
# 万象归元于云枢 | 深栈智启新纪元
# All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
# ==============================================================================
# @Project : {PROJECT_NAME}
# @File    : {FILE_NAME}
# @Author  : YYC³ Team
# @Date    : {DATE}
# @Email   : admin@0379.email
# @License : {LICENSE}
# @Desc    : {MODULE_DESCRIPTION}
# ==============================================================================
```

### 3.2 前端与类 C 语言（JavaScript / TypeScript / Java / C / C++ / C# / Go / Rust / PHP）

**注释符**：`//` 或 `/* */`

**▸ JavaScript / TypeScript 标准版**

```javascript
// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
```

**▸ Java / C++ 风格块注释**

```java
/*
 * ============================================================
 * YYC³（YanYuCloudCube™ · 注册商标）
 * 言启象限 | 语枢未来
 * Words Initiate Quadrants, Language Serves as Core for Future
 * 万象归元于云枢 | 深栈智启新纪元
 * All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
 * ============================================================
 * Copyright (c) 2026 YanYuCloudCube™（YYC³）
 * Contact: admin@0379.email
 * ============================================================
 */
```

### 3.3 标记与样式语言（HTML / XML / CSS / SCSS）

**HTML / XML 注释符**：`<!-- -->`

```html
<!--
  ============================================================
  YYC³（YanYuCloudCube™ · 注册商标）— 言启象限 | 语枢未来
  Words Initiate Quadrants, Language Serves as Core for Future
  万象归元于云枢 | 深栈智启新纪元
  All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
  ============================================================
  Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
  ============================================================
-->
```

**CSS / SCSS**：使用 `/* */`，块体与 Java 风格一致。

### 3.4 数据库与查询语言（SQL）

```sql
-- ============================================================
-- YYC³（YanYuCloudCube™ · 注册商标）· 言启象限 | 语枢未来
-- 万象归元于云枢 | 深栈智启新纪元
-- ============================================================
-- Copyright (c) 2026 YanYuCloudCube™（YYC³）
-- ============================================================
```

### 3.5 配置文件（YAML / TOML / JSON）

严格 JSON 无注释能力，标头信息写入同级 `README.md` 或由构建工具注入；YAML / TOML 可在首行添加：

```yaml
# ============================================================
# YYC³ Configuration（YanYuCloudCube™ · 注册商标）
# 言启象限 | 语枢未来
# ============================================================
```

---

## 四、标尾模板（代码与文档通用）

### 4.1 极简标尾（库文件、工具脚本）

```python
# --- YYC³ End of File ---
```

### 4.2 标准标尾（代码文件）

```python
# ============================================================
# End of {FILE_NAME} | YYC³（YanYuCloudCube™ · 注册商标）
# 万象归元于云枢 · 深栈智启新纪元
# All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
# (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
# ============================================================
```

### 4.3 完整标尾（Markdown 文档，本团队唯一标准）

```markdown
## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| {VERSION} | {UPDATE_DATE} | {CHANGE_SUMMARY} | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© {YEAR} YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
```

文档标尾约束：

1. 标尾前必须有且仅有一条 `---` 分隔线
2. 变更历史表放在标尾 `<p align="center">` 块之前
3. 不再使用 `<div align="center">` 包裹标语——标头统一用引用块，标尾统一用 HTML 居中块
4. 正文内不得重复出现第二处标语块

---

## 五、场景选用矩阵

| 应用场景 | 推荐组合 | 说明 |
| -------- | -------- | ---- |
| 内部微服务 / 工具脚本 | 极简标头 + 极简标尾 | 单行品牌 + `End of File` |
| 日常业务代码 | 标准标头 + 标准标尾 | 分隔线 + 联系方式 |
| 核心基础库 / SDK | 完整标头 + 标准标尾 | 含模块描述、作者、许可证 |
| 开源项目 / 对外发布 | 完整标头 + 完整标尾 | 强调品牌、链接与版权 |
| API / 架构文档 | Markdown 标头 + 完整标尾 | front matter + 居中页脚 |
| 团队标准规范文档 | Markdown 标头（§二）+ 完整标尾（§4.3） | 本文档目录全部文档强制执行 |

---

## 六、校验方法

```bash
# 1. 标头字段完整性（必填字段是否齐全）
grep -L "^file: " docs/**/*.md

# 2. file 字段与磁盘文件名是否一致
for f in docs/**/*.md; do basename "$f"; grep -m1 "^file: " "$f"; done

# 3. 品牌写法残留检查（应为空）
grep -rn "YanYuCloudCube-\|yanyucloud.com" docs/

# 4. 标尾一致性（每篇文档应命中 1 次居中页脚）
grep -c '<p align="center">' docs/**/*.md
```

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.1.0 | 2026-11-01 | 品牌标识统一为 YYC³（YanYuCloudCube™ 注册商标）、邮箱统一为 admin@0379.email、新增本目录唯一标头/标尾标准与校验方法 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
