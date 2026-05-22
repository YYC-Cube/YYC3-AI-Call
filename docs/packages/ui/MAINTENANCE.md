# @yyc3/ui 维护指南

> **长期维护与运营指南** — 确保包的可持续性与稳定性

---

## 📋 目录

- [维护概览](#-维护概览)
- [版本发布流程](#-版本发布流程)
- [日常维护任务](#-日常维护任务)
- [依赖管理](#-依赖管理)
- [测试策略](#-测试策略)
- [构建与部署](#-构建与部署)
- [故障排查](#-故障排查)
- [安全更新](#-安全更新)
- [性能监控](#-性能监控)
- [文档维护](#-文档维护)

---

## 🎯 维护概览

### 维护目标

| 目标 | 指标 | 当前状态 |
|------|------|----------|
| **稳定性** | 测试通过率 100% | ✅ 25/25 |
| **文档完整度** | README/CHANGELOG/MAINTENANCE | ✅ 100% |
| **依赖健康** | 无已知漏洞 | ✅ 良好 |
| **构建成功率** | CI/CD 通过率 | ✅ 100% |
| **响应时间** | Issue 响应 < 48h | 📊 待建立 |

### 维护团队职责

| 角色 | 职责 | 频率 |
|------|------|------|
| **核心维护者** | 版本发布、重大决策 | 按需 |
| **代码审查者** | PR 审查、代码质量 | 每日 |
| **文档维护者** | 文档更新、FAQ 维护 | 每周 |
| **安全专员** | 安全审计、漏洞修复 | 每月 |

---

## 📦 版本发布流程

### 发布前准备清单

```bash
# 1. 更新版本号 (遵循 SemVer)
# 编辑 package.json 的 version 字段
# 格式: MAJOR.MINOR.PATCH (如: 1.2.0)

# 2. 运行完整测试套件
pnpm test && pnpm typecheck && pnpm lint

# 3. 更新 CHANGELOG.md
# 添加本次发布的变更记录 (遵循 Keep a Changelog 格式)

# 4. 更新 README.md (如有必要)
# 同步新功能、API 变更、示例代码

# 5. 构建验证
pnpm build

# 6. 本地 pack 测试
npm pack --dry-run

# 7. Exports 路径验证
node -e "
const pkg = require('./package.json');
Object.keys(pkg.exports || {}).forEach(exp => {
  const path = pkg.exports[exp].import || pkg.exports[exp];
  if (!require('fs').existsSync(path)) {
    console.error('❌ Missing export:', exp, '->', path);
    process.exit(1);
  }
});
console.log('✅ All exports valid');
"
```

### 发布步骤

```bash
# 1. 提交所有更改
git add .
git commit -m "release: @yyc3/ui v1.2.0"

# 2. 创建 Git Tag
git tag ui-v1.2.0

# 3. 推送到远程
git push origin main
git push origin ui-v1.2.0

# 4. 发布到 npm
npm publish --access public

# 5. 验证发布
npm view @yyc3/ui version
```

### 版本号规则 (SemVer)

| 类型 | 场景 | 示例 |
|------|------|------|
| **MAJOR** | 不兼容的 API 变更 | 1.0.0 → 2.0.0 |
| **MINOR** | 向后兼容的功能新增 | 1.0.0 → 1.1.0 |
| **PATCH** | 向后兼容的问题修复 | 1.0.0 → 1.0.1 |

### 发布检查清单

- [ ] 版本号已正确更新
- [ ] CHANGELOG.md 已更新
- [ ] 所有测试通过 (`pnpm test`)
- [ ] 类型检查通过 (`pnpm typecheck`)
- [ ] 代码检查通过 (`pnpm lint`)
- [ ] 构建成功 (`pnpm build`)
- [ ] Exports 路径验证通过
- [ ] npm pack 文件列表正确
- [ ] Git Tag 已创建并推送
- [ ] npm publish 成功

---

## 🔧 日常维护任务

### 每周任务

```bash
# 1. 检查依赖更新
pnpm outdated

# 2. 运行完整测试套件
pnpm test

# 3. 检查 TypeScript 错误
pnpm typecheck

# 4. 检查代码规范
pnpm lint
```

### 每月任务

```bash
# 1. 安全审计
npm audit

# 2. 依赖更新 (谨慎)
pnpm update

# 3. 文档审查
# - 检查 README 示例是否可用
# - 更新 FAQ
# - 检查过期链接

# 4. 性能基准测试
# - 构建体积对比
# - Tree Shaking 效果验证
```

### 每季度任务

```bash
# 1. 全面依赖升级
# - 升级 React peerDependency 版本范围
# - 升级 @yyc3/core 依赖
# - 升级开发工具链

# 2. 代码重构
# - 移除废弃 API
# - 优化性能瓶颈
# - 改善类型定义

# 3. 文档大修
# - 重写过时示例
# - 补充缺失 API 文档
# - 更新架构图
```

---

## 📦 依赖管理

### 当前依赖图谱

```
@yyc3/ui (v1.1.1)
├── Production Dependencies
│   └── @yyc3/core ^1.1.0          ← 核心引擎
├── Peer Dependencies (必须自行安装)
│   ├── react >=18.0.0              ← React 框架
│   └── react-dom >=18.0.0          ← ReactDOM
└── Development Dependencies
    ├── typescript ^5.0.0           ← 编译器
    ├── tsup ^8.0.0                 ← 打包工具
    ├── vitest ^1.0.0               ← 测试框架
    ├── @testing-library/react       ← React 测试工具
    ├── @testing-library/jest-dom   ← DOM 断言库
    └── @vitejs/plugin-react        ← Vite React 插件
```

### 依赖更新策略

| 依赖类型 | 更新策略 | 频率 |
|----------|----------|------|
| **@yyc3/core** | 同步主版本，跟随补丁版本 | 每次发布时检查 |
| **React (peer)** | 扩展支持范围，不收紧 | 每季度评估 |
| **DevDependencies** | 保持最新，关注 breaking changes | 每月 |

### 依赖安全扫描

```bash
# 定期安全审计
npm audit

# 修复漏洞
npm audit fix

# 强制修复 (可能引入 breaking changes)
npm audit fix --force
```

---

## 🧪 测试策略

### 测试架构

```
__tests__/
├── components.test.tsx     # 组件渲染测试 (15 tests)
├── hooks.test.tsx          # Hooks 逻辑测试 (10 tests)
└── setup.ts                # 测试环境配置
```

### 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|-----------|----------|
| **Core** | 80%+ | ✅ 达标 |
| **Components** | 85%+ | ✅ 达标 |
| **Family** | 75%+ | ✅ 达标 |
| **Themes** | 70%+ | ✅ 达标 |
| **总体** | 80%+ | ✅ 25/25 passed |

### 运行测试命令

```bash
# 全量测试
pnpm test

# 监听模式 (开发时使用)
pnpm test --watch

# 覆盖率报告
pnpm test --coverage

# 单个测试文件
pnpm test components.test.tsx

# 匹配特定测试名
pnpm test -t "Button renders correctly"
```

### 新增测试指南

当添加新组件或功能时：

1. 在 `src/__tests__/` 下创建对应测试文件
2. 使用 `@testing-library/react` 编写测试
3. 覆盖主要用户场景：
   - 正常渲染
   - Props 传递
   - 事件处理
   - 边界情况
4. 确保覆盖率不低于目标值

---

## 🏗️ 构建与部署

### 构建配置

本包使用 **tsup** 进行构建，配置位于 `tsup.config.ts`。

```bash
# 开发构建 (监听模式)
pnpm dev

# 生产构建
pnpm build

# 清理构建产物
rm -rf dist/
```

### 构建输出

```
dist/
├── index.js              # 主入口 (~45KB gzipped)
├── index.d.ts            # 主入口类型定义
├── core.js               # Core 模块 (~12KB gzipped)
├── core.d.ts             # Core 类型定义
├── components.js         # Components 模块 (~18KB gzipped)
├── components.d.ts       # Components 类型定义
├── family.js             # Family 模块 (~15KB gzipped)
├── family.d.ts           # Family 类型定义
├── themes.js             # Themes 模块 (~8KB gzipped)
└── themes.d.ts           # Themes 类型定义
```

### 构建优化要点

1. **Tree Shaking**: 使用 ESM 格式，确保未使用代码可被移除
2. **TypeScript**: 输出 `.d.ts` 类型定义文件
3. **Source Maps**: 生成 `.js.map` 方便调试
4. **Minification**: 生产构建自动压缩

### CI/CD 流水线 (建议)

```yaml
# .github/workflows/ci.yml (示例)
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm build
```

---

## 🔍 故障排查

### 常见问题诊断

#### 问题1: 导入路径错误

**症状**: `Cannot find module '@yyc3/ui/family'`

**解决方案**:
```bash
# 1. 检查 exports 配置
cat package.json | grep '"exports"'

# 2. 验证文件存在
ls -la dist/family.js dist/family.d.ts

# 3. 重新构建
pnpm build
```

#### 问题2: TypeScript 类型错误

**症状**: `TS2307: Cannot find module '@yyc3/core' or its corresponding type declarations`

**解决方案**:
```bash
# 1. 安装类型依赖
pnpm add @yyc3/core

# 2. 检查 tsconfig.json paths 配置
# 确保 @yyc3/* 映射正确

# 3. 清除缓存
rm -rf node_modules/.cache
pnpm typecheck
```

#### 问题3: ThemeProvider 报错

**症状**: `Error: useTheme must be used within ThemeProvider`

**解决方案**:
```tsx
// 确保组件树被包裹
<ThemeProvider>
  <App />  {/* 使用 useTheme 的组件 */}
</ThemeProvider>
```

#### 问题4: 构建产物过大

**症状**: 包体积超过预期 (>50KB gzipped)

**诊断步骤**:
```bash
# 分析打包体积
npm pack
# 解压 .tgz 并分析 dist/ 大小

# 使用 rollup-plugin-visualizer (可选)
pnpm build --analyze
```

**优化方案**:
- 使用子路径导入替代全量导入
- 检查是否有不必要的重导出
- 优化第三方依赖引用

#### 问题5: 测试失败

**症状**: `pnpm test` 返回非零退出码

**诊断步骤**:
```bash
# 查看详细错误
pnpm test --reporter=verbose

# 单独运行失败测试
pnpm test -- -t "test name"

# 更新快照 (如有 UI 变化)
pnpm test --update
```

### 日志与调试

启用调试模式:

```bash
# 设置环境变量
DEBUG=@yyc3/ui:* pnpm test

# 或在代码中
if (process.env.DEBUG) {
  console.log('[@yyc3/ui] Debug info:', data)
}
```

---

## 🔒 安全更新

### 安全最佳实践

1. **最小权限原则**
   - 组件不应请求不必要的浏览器权限
   - 避免使用 `dangerouslySetInnerHTML`
   - 对用户输入进行 sanitize

2. **依赖安全**
   ```bash
   # 定期审计
   npm audit
   
   # 自动修复低风险漏洞
   npm audit fix
   ```

3. **XSS 防护**
   - React 默认转义 JSX 中的内容
   - 避免直接操作 innerHTML
   - 使用 CSP (Content Security Policy)

4. **版本固定**
   - lockfile 确保依赖版本一致性
   - 定期更新依赖但需充分测试

### 安全事件响应流程

1. **发现漏洞** → 立即评估影响范围
2. **修复漏洞** → 编写补丁并测试
3. **发布修复** → 遵循 SemVer 发布 PATCH 版本
4. **通知用户** → 更新 CHANGELOG 和 SECURITY.md
5. **监控反馈** -> 关注 issue 和讨论区

---

## 📊 性能监控

### 关键指标

| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| **构建时间** | < 30s | CI 日志 |
| **包大小 (gzipped)** | < 50KB (主入口) | bundlephobia.com |
| **Tree Shaking 率** | > 60% | 构建对比 |
| **测试执行时间** | < 10s | vitest 输出 |
| **安装时间** | < 15s | pnpm install 计时 |

### 性能基准测试脚本

```bash
#!/bin/bash
# performance-benchmark.sh

echo "=== @yyc3/ui Performance Benchmark ==="

# 1. 构建时间
start=$(date +%s%N)
pnpm build > /dev/null 2>&1
end=$(date +%s%N)
build_time=$(( (end - start) / 1000000 ))
echo "Build time: ${build_time}ms"

# 2. 包大小
size=$(du -sh dist/ | cut -f1)
echo "Dist size: $size"

# 3. 测试时间
start=$(date +%s%N)
pnpm test > /dev/null 2>&1
end=$(date +%s%N)
test_time=$(( (end - start) / 1000000 ))
echo "Test time: ${test_time}ms"

echo "=== Benchmark Complete ==="
```

### 性能优化建议

1. **按需加载**: 引导用户使用子路径导入
2. **代码分割**: 利用动态 import() 实现懒加载
3. **CSS 优化**: 考虑 CSS-in-JS 或 CSS Modules
4. **图标优化**: 使用 SVG Icon 替代图片资源

---

## 📖 文档维护

### 文档更新触发条件

- 新增功能或 API 变更
- 修复重要 bug
- 版本发布
- 收到用户文档相关 issue
- 每季度例行审查

### 文档质量标准

| 文档 | 要求 | 更新频率 |
|------|------|----------|
| **README.md** | 示例可运行，API 完整 | 每次发布 |
| **CHANGELOG.md** | 遵循 Keep a Changelog | 每次发布 |
| **MAINTENANCE.md** | 流程准确，链接有效 | 每季度 |
| **代码注释** | 公共 API 有 JSDoc | 持续 |

### 文档审查清单

- [ ] 所有示例代码可复制运行
- [ ] API 文档与实际代码一致
- [ ] 外部链接有效且可访问
- [ ] 版本号和日期已更新
- [ ] 安装命令经过验证
- [ ] FAQ 覆盖常见问题

---

## 📞 联系方式

遇到问题时，请通过以下渠道获取帮助：

- **Issues**: [GitHub Issues](https://github.com/YanYuCloudCube/Family-PAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YanYuCloudCube/Family-PAI/discussions)
- **Email**: admin@0379.email

---

*YYC³ AI Family — 八位拟人化AI家人的智能中枢*

**五高 · 五标 · 五化 · 五维**

---

*维护指南版本: 1.1.1 | 最后更新: 2026-04-24*
