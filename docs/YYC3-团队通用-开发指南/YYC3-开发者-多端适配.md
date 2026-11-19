---
file: YYC3-开发者-多端适配.md
title: YYC³ 开发者多端适配指南 — Web · 桌面 · 经典三端
description: YYC³ 多端适配指南 — 三端矩阵、响应式与主题一致性、存储隔离、Electron 红线与验证清单
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-01
updated: 2026-11-01
status: stable
tags: [guide, multi-platform, responsive, electron, theme]
category: guide
language: zh-CN
audience: developers
complexity: advanced
project: yyc3-ai-dev
phase: development
---

# YYC³ 开发者多端适配指南 — Web · 桌面 · 经典三端

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

## 一、五高五标映射

| 维度 | 多端落地 |
| ---- | -------- |
| **高可用** | 单端异常不扩散：ErrorBoundary 按端隔离，降级到 Shell 兜底页 |
| **高性能** | 按端裁剪产物：独立版应用只打自身插件包，合并版按需懒加载 |
| **高安全** | 各端沿用同一套沙箱 / IPC 安全根 / 凭据密文规范 |
| **高扩展** | 新端接入只新增构建入口，禁止在插件层分支判断终端 |
| **高智能** | 端能力（语音、文件、网络）通过统一能力契约封装 |

| 五标 | 落地方式 |
| ---- | -------- |
| 标准化 | 三端共用一份 `packages/` 源码，端差异只允许出现在 `apps/` 与 `electron/` |
| 规范化 | 端能力差异集中在一处判定（`useMobileView` 等模式 Hook），禁止散落 |
| 自动化 | 三端同源测试一致性由 CI `test-sync` 步骤校验 |
| 可视化 | 主题变量统一取自 `@yyc3/shell` 的 `theme`，禁止端内私自定义色值 |
| 智能化 | 依据端能力自动降级（无文件系统时隐藏相关入口） |

---

## 二、三端矩阵

| 端 | 构建入口 | 运行形态 | 能力边界 |
| ---- | ---- | ---- | ---- |
| **web-full（合并版）** | `apps/full` | 浏览器 SPA，静态托管 / 容器部署 | 全插件包；无本地文件系统直写 |
| **desktop（桌面版）** | `apps/*` + `electron/` | Electron 容器，`contextIsolation: true`、`nodeIntegration: false` | 具备文件 / 数据库 IPC，受安全根校验约束 |
| **classic（经典版）** | `apps/standalone-*` | 各系统独立应用（如 AI Family 独立版） | 仅本系统插件包，产物最小 |

> **三端同源红线**：`electron/` 层改动必须三端字节级同步，由 CI `test-sync` 校验同源一致性；不允许只改一端。

---

## 三、响应式与断点约定

### 3.1 判定方式

- 布局判定统一走模式 Hook（如 `useMobileView`），禁止在组件内散写 `window.innerWidth` 判断
- 端能力判定统一走能力契约，禁止 `navigator.userAgent` 字符串匹配分支

### 3.2 断点约定

| 区间 | 形态 | 侧边栏 | 面板 |
| ---- | ---- | ------ | ---- |
| `< 768px` | 单列移动视图 | 抽屉式（Drawer） | 全屏浮层 |
| `768 - 1279px` | 双列紧凑 | 可折叠（`sidebarCollapsed`） | 右滑面板 |
| `≥ 1280px` | 三列完整 | 常驻展开 | 常驻侧栏 |

> 上表为团队约定值，具体像素值以项目 `tailwind.config` 断点配置为准（待确认：断点是否与默认 `sm/md/lg/xl` 一致）。

---

## 四、主题与视觉一致性

| 主题 | 常量 | 适用端 |
| ---- | ---- | ------ |
| 现代深空 | `THEME_MODERN` | web-full / desktop 默认 |
| 古文化鎏金 | `THEME_ANCIENT` | 全端可选备用主题 |

- 色值一律取自 `getTheme()` / `THEME_*` 常量，禁止各端硬编码十六进制色
- 新增组件必须在双主题下各截图一次，作为 PR 附件
- 图标统一使用 `lucide-react`，端差异只允许尺寸与密度不同

---

## 五、存储与离线

### 5.1 存储分层

| 层 | 用途 | 隔离规则 |
| -- | ---- | -------- |
| `localStorage` | 配置与轻量状态 | `yyc3:{systemId}:{key}`，一律经 `createSystemStorage(id)` |
| `IndexedDB` | 离线大数据集 | 按系统 ID 建库，禁止跨系统共享库名 |
| `BroadcastChannel` | 跨标签页同步 | 单例工厂，禁止各端各自 new |

### 5.2 端差异处理

- 桌面端可用本地文件 / SQLite 能力；Web 端缺失能力时必须隐藏或降级，而不是报错
- 离线态由 `useOfflineMode` 统一判定，两端共用同一降级策略
- 敏感数据（密钥、Token）任何端都不得落 `localStorage`，见《YYC³ 开发者-安全合规手册》§三

---

## 六、桌面端（Electron）适配红线

- 渲染进程一律 `contextIsolation: true`、`nodeIntegration: false`，仅通过 preload 暴露白名单 API
- 文件 / 数据库 IPC 必须经 `isPathWithinSafeRoots()` 前缀校验（`userData` ∪ 对话框授权路径）
- `SHELL_OPEN` 仅允许 http/https/mailto；`SHELL_EXECUTE` 白名单不得包含 `open` / `xdg-open` / `start`
- 预览 iframe 与 Web 端保持同一沙箱策略：`allow-scripts allow-popups allow-forms allow-modals`，**永不叠加 `allow-same-origin`**

---

## 七、构建与产物

```bash
# 合并版（web-full）
cd apps/full && pnpm build          # → dist/

# 独立版（classic，以 AI Family 为例）
cd apps/standalone-ai-family && pnpm build   # → dist/

# 桌面版（desktop）
pnpm build && pnpm electron:package
```

- 三端产物目录隔离，禁止互相复用 `dist/`
- 部署目标与镜像模板见《YYC³ 开发者-部署运维与 CI/CD 指南》§五、§六

---

## 八、适配验证清单

| # | 检查项 | 验证方式 |
| - | ------ | -------- |
| 1 | 三端构建均成功 | 三个入口各执行一次 `pnpm build` |
| 2 | 三端 `tsc --noEmit` 零错误 | 全量类型检查 |
| 3 | 断点三档布局无溢出 | 移动 / 平板 / 桌面三档截图 |
| 4 | 双主题渲染正常 | `THEME_MODERN` + `THEME_ANCIENT` 各验一次 |
| 5 | 端能力缺失时优雅降级 | Web 端验证文件类入口是否隐藏 |
| 6 | `electron/` 三端同源 | CI `test-sync` 通过 |
| 7 | 存储 Key 带命名空间 | `grep -r "localStorage.setItem" src/` 无裸调用 |

---

## 九、常见问题

**Q：插件里需要区分 Web / 桌面，怎么写？**
A：不在插件内判断终端。由 Shell 通过能力契约下发能力集合，插件只消费能力。

**Q：独立版应用需要引用其他插件包吗？**
A：允许通过 `peerDependencies` + `workspace:*` 声明，但禁止直接 import 其内部组件，通信一律走 `EventBus`。

**Q：移动端是否单独维护一套组件？**
A：不维护。同一组件通过布局容器与断点类切换形态，避免双份代码漂移。

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.0.0 | 2026-11-01 | 由失效指针存根重写为完整多端适配指南：三端矩阵、响应式约定、主题一致性、存储隔离、Electron 红线与验证清单 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
