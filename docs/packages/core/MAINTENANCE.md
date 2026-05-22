---
@file: MAINTENANCE.md
@description: @yyc3/core 维护指南 — 版本发布/故障排查/安全更新/依赖管理
@author: YanYuCloudCube Team <admin@0379.email>
@version: v1.0.0
@created: 2026-04-24
@updated: 2026-04-24
@status: published
@tags: [维护],[发布],[安全],[依赖]
---

# @yyc3/core 维护指南

**包名**: @yyc3/core | **版本**: v1.4.0 | **最后更新**: 2026-04-26

---

## 目录

- [版本发布流程](#版本发布流程)
- [问题排查指南](#问题排查指南)
- [性能优化建议](#性能优化建议)
- [安全更新流程](#安全更新流程)
- [依赖管理策略](#依赖管理策略)
- [维护检查清单](#维护检查清单)

---

## 版本发布流程

### 发布前准备清单

```bash
# 1. 更新版本号 (遵循 SemVer)
# 编辑 package.json 的 version 字段
# 同步更新 src/index.ts 中的 VERSION 常量

# 2. 运行完整测试套件
pnpm test && pnpm typecheck && pnpm lint

# 3. 更新 CHANGELOG.md
# 添加本次发布的变更记录

# 4. 构建验证
pnpm build

# 5. 本地 pack 测试
npm pack --dry-run

# 6. Exports 路径验证
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

### 发布命令

```bash
# 正式发布到 NPM
npm publish --access public
```

### 发布后验证

```bash
# 验证可安装
cd /tmp && npm pack @yyc3/core
mkdir test-install && cd test-install
npm init -y && npm install ../yyc3-core-*.tgz
node -e "const { VERSION } = require('@yyc3/core'); console.log('✅ Version:', VERSION);"
cd /tmp && rm -rf test-install yyc3-core-*.tgz
```

---

## 问题排查指南

### ❌ Issue 1: Module not found 错误

**症状**: `Error: Cannot find module '@yyc3/core/auth'`

**解决方案**:
```bash
# 1. 检查 dist 目录
ls -la dist/auth/

# 2. 重新构建
pnpm clean && pnpm build

# 3. 验证 exports 配置
cat package.json | grep -A 20 '"exports"'
```

### ❌ Issue 2: Provider 连接失败

**症状**: `Error: Failed to connect to Ollama`

**解决方案**:
```bash
# 检查 Ollama 状态
ollama list

# 启动 Ollama
ollama serve

# 验证连接
curl http://localhost:11434/api/tags
```

### ❌ Issue 3: TypeScript 类型错误

**症状**: `TS2307: Cannot find module '@yyc3/core'`

**解决方案**:
```bash
# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 清除 TypeScript 缓存
rm -rf *.tsbuildinfo
```

### ❌ Issue 4: quickStart() 失败

**症状**: 所有 Provider 不可用

**解决方案**:
```typescript
import { AutoDetector } from '@yyc3/core';

const detector = new AutoDetector();
const status = await detector.detectAll();
console.log(status);
// 查看哪些 Provider 可用
```

---

## 性能优化建议

### 1. Tree Shaking 优化

```typescript
// ❌ 不推荐: 导入整个库
import { UnifiedAuthManager } from '@yyc3/core';

// ✅ 推荐: 按需导入
import { UnifiedAuthManager } from '@yyc3/core/auth';
```

### 2. 认证缓存

```typescript
const auth = new UnifiedAuthManager({
  providers: [...],
  autoSwitch: true,
  healthCheckInterval: 60000,
});
```

### 3. 技能系统预加载

```typescript
const manager = new SkillManager();
await manager.preloadBuiltins();
```

---

## 安全更新流程

### 定期安全审计

```bash
# 检查已知漏洞
npm audit

# 自动修复
npm audit fix

# 手动审查高风险
npm audit --json
```

### 敏感信息保护

- ❌ 禁止在代码中硬编码 API Key
- ❌ 禁止将 .env 文件提交到 Git
- ✅ 使用环境变量管理密钥
- ✅ 使用 Zod Schema 进行运行时输入验证

### 依赖更新策略

| 依赖类型 | 更新频率 | 流程 |
|----------|----------|------|
| 生产依赖 | 月度审查 | `pnpm update` |
| 开发依赖 | 季度审查 | `pnpm update -D` |
| 安全补丁 | 即时更新 | `npm audit fix` |

---

## 依赖管理策略

### 当前依赖清单

#### 运行时依赖 (dependencies)

| 包名 | 版本 | 用途 |
|------|------|------|
| eventemitter3 | ^5.0.1 | 事件系统 |
| zod | ^3.25.76 | Schema 验证 |

#### 开发依赖 (devDependencies)

| 包名 | 版本 | 用途 |
|------|------|------|
| typescript | ^5.0.0 | 编译器 |
| tsup | ^8.0.0 | 打包工具 |
| vitest | ^1.0.0 | 测试框架 |
| eslint | ^10.1.0 | 代码检查 |
| typescript-eslint | ^8.58.0 | TS ESLint 插件 |

### 依赖升级流程

```bash
# 1. 检查过时依赖
pnpm outdated

# 2. 更新
pnpm update <package-name>

# 3. 运行测试
pnpm test && pnpm typecheck
```

---

## 维护检查清单

### 每周检查项
- [ ] 运行完整测试套件 `pnpm test`
- [ ] 检查 GitHub Issues
- [ ] 检查依赖安全漏洞 `npm audit`

### 每月检查项
- [ ] 更新依赖
- [ ] 审查文档准确性
- [ ] 性能基准测试

### 发布前必查项
- [ ] 所有测试通过
- [ ] TypeScript 零错误
- [ ] CHANGELOG 已更新
- [ ] 版本号符合 SemVer
- [ ] exports 路径验证通过
- [ ] npm pack 测试成功
- [ ] 无敏感信息泄露

---

## 联系维护团队

- **Issue 报告**: [GitHub Issues](https://github.com/YanYuCloudCube/Family-PAI/issues)
- **安全漏洞**: [admin@0379.email](mailto:admin@0379.email?subject=Security%20Report)
- **一般咨询**: [GitHub Discussions](https://github.com/YanYuCloudCube/Family-PAI/discussions)

---

<div align="center">

**© 2025-2026 YanYuCloudCube Team. All Rights Reserved.**

</div>
