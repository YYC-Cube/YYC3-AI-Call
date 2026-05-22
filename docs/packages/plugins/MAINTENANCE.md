# @yyc3/plugins 维护指南

> **企业级长期维护与运营指南** — 确保插件集合的可持续性、稳定性与可扩展性

---

## 📋 目录

- [维护概览](#-维护概览)
- [版本发布流程](#-版本发布流程)
- [日常维护任务](#-日常维护任务)
- [插件管理](#-插件管理)
- [测试策略](#-测试策略)
- [构建与部署](#-构建与部署)
- [依赖管理](#-依赖管理)
- [故障排查](#-故障排查)
- [文档维护](#-文档维护)
- [社区支持](#-社区支持)

---

## 🎯 维护概览

### 维护目标

| 目标 | 指标 | 当前状态 | 目标值 |
|------|------|----------|--------|
| **插件数量** | LSP + Content 插件总数 | 8 (4+4) | 持续增长 |
| **测试通过率** | 用例通过率 | 100% (5/5) | ≥99.5% |
| **代码覆盖率** | 行覆盖率 | ~95% | ≥90% |
| **文档完整度** | 闭环完成度 | 100% | 100% |
| **类型安全** | TypeScript 编译错误数 | 0 | 0 |
| **响应时间** | Issue 响应 | - | <48h |

### 维护团队职责

| 角色 | 职责 | 频率 | SLA |
|------|------|------|-----|
| **核心维护者** | 版本发布、架构决策、新插件审核 | 按需 | - |
| **LSP 专家** | 语言服务器配置更新、能力评估 | 每季度 | - |
| **内容专家** | 内容处理器版本更新、功能验证 | 每月 | - |
| **测试工程师** | 测试用例维护、CI/CD 监控 | 每日 | - |
| **文档工程师** | 文档更新、API 参考同步 | 每周 | - |

---

## 📦 版本发布流程

### 发布前准备清单 (必做)

```bash
#!/bin/bash
# pre-release-checklist.sh

echo "=== @yyc3/plugins Pre-Release Checklist ==="

# 1. 更新版本号 (遵循 SemVer)
# 编辑 package.json 的 version 字段
# 格式: MAJOR.MINOR.PATCH (如: 1.2.0)
# 同时更新 src/index.ts 中的 PLUGIN_VERSION 常量

# 2. 运行完整测试套件
echo "🧪 Running tests..."
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Abort release."
  exit 1
fi
echo "✅ All 5 tests passed"

# 3. 类型检查
echo "🔍 Running typecheck..."
pnpm typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type errors found! Abort release."
  exit 1
fi
echo "✅ Type check passed"

# 4. 更新 CHANGELOG.md
# 添加本次发布的变更记录 (遵循 Keep a Changelog 格式)

# 5. 构建验证
echo "🏗️ Building..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Abort release."
  exit 1
fi
echo "✅ Build successful"

# 6. 本地 pack 测试
echo "📦 Testing npm pack..."
npm pack --dry-run
if [ $? -ne 0 ]; then
  echo "❌ Pack failed! Abort release."
  exit 1
fi
echo "✅ Pack successful"

# 7. Exports 路径验证
echo "🔗 Validating exports..."
node -e "
const pkg = require('./package.json');
const fs = require('fs');
let allValid = true;
Object.keys(pkg.exports || {}).forEach(exp => {
  const path = pkg.exports[exp].import || pkg.exports[exp];
  if (!fs.existsSync(path)) {
    console.error('❌ Missing export:', exp, '->', path);
    allValid = false;
  }
});
if (!allValid) process.exit(1);
console.log('✅ All exports valid');
"
if [ $? -ne 0 ]; then
  echo "❌ Exports validation failed!"
  exit 1
fi

# 8. 插件数量检查
echo "🔢 Checking plugin count..."
node -e "
import { getAllLSPPlugins, getAllContentPlugins } from './dist/index.js';
const lspCount = getAllLSPPlugins().length;
const contentCount = getAllContentPlugins().length;
console.log('LSP Plugins:', lspCount);
console.log('Content Plugins:', contentCount);
if (lspCount === 0 || contentCount === 0) {
  console.error('❌ No plugins found!');
  process.exit(1);
}
"
if [ $? -ne 0 ]; then
  echo "❌ Plugin count check failed!"
  exit 1
fi

echo ""
echo "=== ✅ All checks passed! Ready to release ==="
```

### 发布步骤

```bash
# 1. 提交所有更改
git add .
git commit -m "release: @yyc3/plugins v1.2.0"

# 2. 创建 Git Tag
git tag plugins-v1.2.0

# 3. 推送到远程
git push origin main
git push origin plugins-v1.2.0

# 4. 发布到 npm
npm publish --access public

# 5. 验证发布
npm view @yyc3/plugins version
npm info @yyc3/plugins

# 6. 创建 GitHub Release
# 在 GitHub 上基于 tag 创建 Release，附上 CHANGELOG 摘要
```

### 版本号规则 (SemVer 严格遵循)

| 类型 | 场景 | 示例 | 影响范围 |
|------|------|------|----------|
| **MAJOR** | 不兼容的 API 变更（接口重命名、模块移除） | 1.0.0 → 2.0.0 | 全体用户 |
| **MINOR** | 向后兼容的新增（新增插件、新增导出） | 1.1.0 → 1.2.0 | 可选升级 |
| **PATCH** | Bug 修复、文档更新、配置修正 | 1.2.0 → 1.2.1 | 建议升级 |

### Breaking Changes 发布检查清单

当发布 MAJOR 版本时：

- [ ] Migration Guide 已更新
- [ ] 所有 Deprecated API 标注清楚
- [ ] 插件接口变更说明详细列出
- [ ] CHANGELOG 详细列出所有 breaking changes
- [ ] 通知渠道已准备：GitHub Discussions / 邮件列表

---

## 🔧 日常维护任务

### 每日任务 (自动化)

```yaml
# .github/workflows/daily.yml (示例)
name: Daily Health Check

on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      
      # 运行全量测试
      - name: Run Tests
        run: pnpm test
        
      # 类型检查
      - name: Type Check
        run: pnpm typecheck
        
      # 构建验证
      - name: Build
        run: pnpm build
```

### 每周任务

```bash
# 1. 检查依赖更新
pnpm outdated

# 2. 审查并处理 Issues
# 访问 GitHub Issues 页面

# 3. Review 待合并的 PRs
# 访问 GitHub Pull Requests 页面

# 4. 更新文档（如有必要）
# - 检查插件配置是否需要更新
# - 验证示例代码是否可运行
```

### 每月任务

```bash
# 1. 插件版本追踪
# - 检查各插件的最新版本号是否需要更新
# - Emmet / Marked / Handlebars / Ionic 版本监控
# - Pyright / ruby-lsp / rust-analyzer / sourcekit-lsp 版本监控

# 2. 新语言/工具调研
# - 是否有新的 LSP 服务器值得支持？
# - 是否有新的内容处理器值得集成？

# 3. 文档全面审查
# - README 示例可运行性
# - API 文档与实际 TypeScript 类型一致
```

### 每季度任务

```bash
# 1. 依赖大版本升级规划
# - TypeScript 升级路径
# - tsup 升级路径
# - React Peer Dependency 升级路径

# 2. 插件生态扩展规划
# - 规划下一批要支持的 LSP 语言 (Go/Java/PHP/...)
# - 规划下一批要集成的内容工具 (Pug/EJS/...)

# 3. 技术债务清理
# - 移除废弃的插件定义
# - 统一插件配置格式
# - 改善类型定义质量
```

---

## 🔌 插件管理

### 当前插件矩阵

#### LSP 语言服务器 (4个)

| # | 插件 | 语言 | 服务器 | 状态 | 最后更新 |
|---|------|------|--------|------|----------|
| 1 | PythonLSP | Python | Pyright | ✅ Active | 2026-04-23 |
| 2 | RubyLSP | Ruby | ruby-lsp | ✅ Active | 2026-04-23 |
| 3 | RustLSP | Rust | rust-analyzer | ✅ Active | 2026-04-23 |
| 4 | SwiftLSP | Swift | sourcekit-lsp | ✅ Active | 2026-04-23 |

#### 内容处理器 (4个)

| # | 插件 | 用途 | 版本 | 状态 | 最后更新 |
|---|------|------|------|------|----------|
| 5 | Emmet | HTML/CSS 缩写 | v2.0.0 | ✅ Active | 2026-04-23 |
| 6 | Marked | Markdown 解析 | v12.0.0 | ✅ Active | 2026-04-23 |
| 7 | Handlebars | 模板引擎 | v4.7.8 | ✅ Active | 2026-04-23 |
| 8 | Ionic | 跨平台框架 | v7.0.0 | ✅ Active | 2026-04-23 |

### 添加新插件流程

#### Step 1: 评估需求

```markdown
## 插件提案模板

### 基本信息
- **名称**: GoLSP
- **类型**: LSP / Content
- **优先级**: High / Medium / Low
- **提议者**: @username
- **日期**: YYYY-MM-DD

### 动机
为什么需要这个插件？解决了什么问题？

### 技术方案
- 服务器/包名: gopls / @yyc3/lsp-go
- 安装方式: go install ...
- 能力列表: [...]
- 配置项: {...}

### 影响分析
- 对现有用户的影响: 无Breaking Change
- 包体积增加: ~200B gzipped
- 测试用例: 需新增 X 个
```

#### Step 2: 实现插件

参考 README.md 中的「开发指南」章节，按照标准格式实现。

#### Step 3: 测试覆盖

```typescript
// 必须添加的测试用例
describe('NewPlugin', () => {
  it('should be exported from main entry', () => {
    expect(NewPlugin).toBeDefined()
  })

  it('should have correct id and name', () => {
    expect(NewPlugin.id).toBe('xxx')
    expect(NewPlugin.name).toBe('Xxx')
  })

  it('should have required fields', () => {
    expect(NewPlugin.capabilities).toBeInstanceOf(Array)
    expect(NewPlugin.installation).toHaveProperty('command')
    expect(NewPlugin.configuration).toBeInstanceOf(Object)
  })
})
```

#### Step 4: 文档更新

- [ ] README.md: 添加到插件清单表格
- [ ] README.md: 更新架构图
- [ ] CHANGELOG.md: 记录变更
- [ ] MAINTENANCE.md: 更新插件矩阵表

#### Step 5: Code Review & Merge

```bash
# PR 标题示例
feat(lsp): add Go language server plugin support

# PR 描述
## 变更摘要
- 新增 GoLSPPlugin 定义
- 更新 LSPPluginDefinitions 映射
- 更新 getLSPPluginByLanguage 查询函数
- 更新 index.ts 导出
- 新增 5 个测试用例

## 测试结果
✅ 全部通过 (10/10)

## 文档影响
- README.md: 架构图 + 插件清单
- CHANGELOG.md: v1.x.0 记录
```

### 插件弃用流程

当某个插件不再维护时：

1. **标记为 Deprecated**
   ```typescript
   export const OldLSPPlugin: LSPPluginConfig = {
     // ...existing config
     deprecated: true,
     deprecationMessage: '请使用 NewLSPPlugin 替代',
     replacement: 'NewLSPPlugin',
   }
   ```

2. **通知周期**: 至少保留 2 个 MINOR 版本

3. **最终移除**: 在下一个 MAJOR 版本中移除

---

## 🧪 测试策略

### 测试架构总览

```
src/__tests__/
└── index.test.ts          # 主入口测试 (5 cases)
    ├── PLUGIN_VERSION / PLUGIN_NAME 导出验证
    ├── getAllLSPPlugins() 返回数量验证
    ├── getAllContentPlugins() 返回数量验证
    ├── getLSPPluginByLanguage() 查询验证
    └── getContentPluginByName() 查询验证
```

### 覆盖率目标与现状

| 模块 | 目标 | 当前 | 状态 |
|------|------|------|------|
| **Lines** | ≥90% | ~95% | ✅ 超标 |
| **Functions** | ≥85% | 100% | ✅ 超标 |

### 运行测试命令

```bash
# 全量测试 (5 个用例)
pnpm test

# 监听模式 (开发时使用)
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# 单个测试文件
pnpm test -- index.test.ts

# 匹配测试名
pnpm test -- -t "should export correct version"
```

### 新增测试指南

当添加新插件或修改现有逻辑时：

1. **定位测试文件**: `src/__tests__/index.test.ts`
2. **命名约定**: 使用 describe/it 结构
3. **必须覆盖的场景**:
   - 新插件被正确导出
   - 插件字段完整性验证
   - 查询函数能找到新插件
   - 边界情况 (undefined 返回值)
4. **确保覆盖率**: 新增代码覆盖率不低于目标值

---

## 🏗️ 构建与部署

### 构建配置

本包使用 **tsup** 进行构建。

```bash
# 开发构建 (监听模式)
pnpm dev

# 生产构建
pnpm build

# 清理构建产物
rm -rf dist/
```

### 构建输出结构

```
dist/
├── index.js              # 主入口 (~2KB gzipped)
├── index.d.ts            # 主入口类型定义
├── lsp.js                # LSP 子路径 (~1KB gzipped)
├── lsp.d.ts              # LSP 类型定义
├── content.js            # Content 子路径 (~1KB gzipped)
└── content.d.ts          # Content 类型定义
```

### CI/CD 流水线 (推荐配置)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          
      - run: pnpm install
      - run: pnpm test
      - run: pnpm typecheck
      - run: pnpm build
      
  publish:
    needs: test
    if: github.ref == 'refs/heads/main' && startsWith(github.event.head_commit.message, 'release:')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install && pnpm build
      - uses: JS-DevTools/npm-publish@v3
        with:
          token: ${{ secrets.NPM_TOKEN }}
```

---

## 📦 依赖管理

### 当前依赖状态

```
@yyc3/plugins (v1.2.0)
├── Production Dependencies:
│   └── @yyc3/core ^1.1.0  ← 核心引擎
│
├── Peer Dependencies:
│   ├── react >=18.0.0      ← UI框架 (可选)
│   └── react-dom >=18.0.0  ← DOM渲染 (可选)
│
└── Development Dependencies:
    ├── typescript ^5.0.0         ← 编译器
    ├── tsup ^8.0.0              ← 打包器
    ├── vitest ^1.0.0            ← 测试框架
    ├── @types/react ^18.3.1     ← React 类型
    ├── @types/react-dom ^18.3.0 ← ReactDOM 类型
    └── eslint                   ← 代码规范
```

### 依赖更新策略

| 类别 | 策略 | 频率 | 注意事项 |
|------|------|------|----------|
| **Prod (@yyc3/core)** | 跟随主仓库版本 | 同步 | 保持兼容性 |
| **Peer (React)** | 跟随 LTS 版本 | 每年 | 关注 breaking changes |
| **DevDeps (TypeScript)** | 跟随最新 LTS | 每季度 | 关注类型系统变更 |
| **DevDeps (tsup)** | 跟随 minor 版本 | 每月 | 关注构建配置变化 |
| **DevDeps (Vitest)** | 跟随 minor 版本 | 每月 | 关注 API 变更 |

### 安全扫描

```bash
# 定期安全审计
npm audit

# 查看详细信息
npm audit --json

# 生成安全报告
npm audit --audit-level=moderate
```

---

## 🔍 故障排查

### 常见问题诊断

#### 问题1: 找不到插件

**症状**: `getLSPPluginByLanguage('go')` 返回 `undefined`

**诊断步骤**:
```typescript
// 1. 检查支持的插件列表
import { getAllLSPPlugins } from '@yyc3/plugins'
console.log(getAllLSPPlugins().map(p => p.language))
// → ['python', 'ruby', 'rust', 'swift']

// 2. 确认大小写正确
// 函数内部会 toLowerCase()，所以 'Python' 和 'python' 都可以
```

**解决方案**:
- 该语言暂不支持，等待官方添加
- 或自行 fork 并按开发指南添加

#### 问题2: 插件配置不完整

**症状**: 访问 `plugin.configuration` 时某些字段缺失

**诊断**:
```typescript
// 检查插件对象结构
import { PythonLSPPlugin } from '@yyc3/plugins'
console.log(Object.keys(PythonLSPPlugin))
// → ['id', 'name', 'displayName', 'language', 'server', 
//     'package', 'description', 'capabilities', 'installation', 'configuration']
```

**解决方案**:
- 所有必需字段都已包含在定义中
- 如需额外字段，考虑提交 Feature Request

#### 问题3: Tree Shaking 不生效

**症状**: 打包体积未减小

**诊断**:
```bash
# 检查打包输出
npx vite build --mode production
# 查看 dist/output.js 大小
```

**解决方案**:
```typescript
// ❌ 错误: 引入全部功能
import { getAllLSPPlugins } from '@yyc3/plugins'

// ✅ 正确: 仅引入需要的子路径
import { PythonLSPPlugin } from '@yyc3/plugins/lsp'
```

#### 问题4: 类型推断失败

**症状**: TypeScript 报错 `Cannot find module`

**诊断**:
```bash
# 检查类型文件是否存在
ls dist/*.d.ts
# 应该看到: index.d.ts, lsp.d.ts, content.d.ts
```

**解决方案**:
```bash
# 重新构建
pnpm build

# 如果仍然失败，清理 node_modules 后重新安装
rm -rf node_modules && pnpm install && pnpm build
```

### 日志与调试

由于本包是纯声明式数据结构，没有复杂的运行时行为。如需调试：

```typescript
// 导出所有插件查看详情
import {
  getAllLSPPlugins,
  getAllContentPlugins,
} from '@yyc3/plugins'

console.table(
  getAllLSPPlugins().map(p => ({
    ID: p.id,
    Language: p.language,
    Server: p.server,
    Capabilities: p.capabilities.length,
  }))
)

console.table(
  getAllContentPlugins().map(p => ({
    ID: p.id,
    Name: p.name,
    Version: p.version,
    Capabilities: p.capabilities.length,
  }))
)
```

---

## 📖 文档维护

### 文档更新触发条件

- 新增或移除插件
- 插件配置变更 (版本号/安装命令/能力列表)
- API 接口变更
- 版本发布 (必须)
- 收到用户文档相关 issue
- 每季度例行审查

### 文档质量标准

| 文档 | 要求 | 更新频率 | 负责人 |
|------|------|----------|--------|
| **README.md** | 示例可运行，API 完整，< 1200 行 | 每次发布 | 文档工程师 |
| **CHANGELOG.md** | Keep a Changelog 格式，详细变更记录 | 每次发布 | 核心维护者 |
| **MAINTENANCE.md** | 流程准确，链接有效 | 每季度 | 维护团队 |

### 文档审查清单

- [ ] 所有示例代码可复制运行
- [ ] API 文档与实际 TypeScript 类型一致
- [ ] 外部链接有效且可访问
- [ ] 版本号和日期已更新
- [ ] 安装命令经过验证
- [ ] 插件清单表格与代码一致
- [ ] 表格格式正确渲染
- [ ] 代码块语法高亮正确

---

## 👥 社区支持

### 支持渠道

| 渠道 | 用途 | 响应时间 |
|------|------|----------|
| **[GitHub Issues](https://github.com/YanYuCloudCube/Family-PAI/issues)** | Bug 报告、Feature Request | <48h |
| **[GitHub Discussions](https://github.com/YanYuCloudCube/Family-PAI/discussions)** | 问答、讨论 | <72h |
| **Email: admin@0379.email** | 安全漏洞、商务合作 | <24h |

### Issue 模板

```markdown
## Bug Report

**描述**
清晰描述问题...

**复现步骤**
1. 执行 '...'
2. 期望看到 '...'
3. 实际看到 '...'

**环境信息**
- OS: [e.g., macOS 14.0]
- Node.js: [e.g., 20.10.0]
- @yyc3/plugins: [e.g., 1.2.0]

**期望行为**
...

**截图/日志**
...
```

### Feature Request 模板

```markdown
## 新插件提案

**插件名称**: XxxLSP / XxxPlugin
**类型**: LSP / Content
**动机**: 为什么需要这个插件？
**技术细节**:
- 服务器/包名: ...
- 安装方式: ...
- 能力列表: [...]
- 配置项: {...}
**替代方案**: 目前如何解决？
**附加信息**: 参考资料、截图等
```

---

*YYC³ AI Family — 八位拟人化AI家人的智能中枢*

**五高 · 五标 · 五化 · 五维**

---

*维护指南版本: 1.2.0 | 最后更新: 2026-04-24*
