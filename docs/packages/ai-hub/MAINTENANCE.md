# MAINTENANCE.md - 维护指南

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*

---

## 目录

- [版本发布流程](#版本发布流程)
- [问题排查指南](#问题排查指南)
- [性能优化建议](#性能优化建议)
- [安全更新流程](#安全更新流程)
- [依赖管理策略](#依赖管理策略)
- [监控与告警](#监控与告警)
- [紧急修复程序](#紧急修复程序)
- [维护检查清单](#维护检查清单)

---

## 版本发布流程

### 发布前准备清单

```bash
# 1. 更新版本号 (遵循SemVer)
# 编辑 package.json 的 version 字段

# 2. 运行完整测试套件
pnpm test && pnpm typecheck && pnpm lint

# 3. 更新CHANGELOG.md
# 添加本次发布的变更记录

# 4. 构建验证
pnpm build

# 5. 本地pack测试
npm pack --dry-run

# 6. Exports路径验证
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
# 正式发布到NPM
npm publish --access public

# 或使用pnpm (推荐)
pnpm publish --access public
```

### 发布后验证

```bash
# 1. 验证NPM包可安装
cd /tmp && npm pack @yyc3/ai-hub
mkdir test-install && cd test-install
npm init -y
npm install ../yyc3-ai-hub-*.tgz

# 2. 测试导入
node -e "const hub = require('@yyc3/ai-hub'); console.log('✅ Import OK');"

# 3. 清理
cd /tmp && rm -rf test-install yyc3-ai-hub-*.tgz
```

---

## 问题排查指南

### 常见问题及解决方案

#### ❌ Issue 1: Module not found 错误

**症状**: `Error: Cannot find module '@yyc3/ai-hub/family'`

**原因**: 
- 子路径导入配置错误
- 构建产物缺失

**解决方案**:
```bash
# 1. 检查dist目录是否存在
ls -la dist/

# 2. 重新构建
pnpm clean && pnpm build

# 3. 验证exports配置
cat package.json | grep -A 20 '"exports"'
```

#### ❌ Issue 2: Ollama连接失败

**症状**: `Error: Failed to connect to Ollama at http://localhost:11434`

**原因**: 
- Ollama服务未启动
- 端口配置错误
- 防火墙阻止

**解决方案**:
```bash
# 1. 检查Ollama状态
ollama list

# 2. 启动Ollama服务
ollama serve

# 3. 验证连接
curl http://localhost:11434/api/tags

# 4. 配置自定义端口
const hub = new YYC3AIHub({
  authType: 'ollama',
  ollamaHost: 'http://localhost:11435' // 自定义端口
});
```

#### ❌ Issue 3: OpenAI API认证失败

**症状**: `Error: Incorrect API key provided`

**原因**: 
- API Key无效或过期
- 环境变量未设置

**解决方案**:
```bash
# 1. 设置环境变量
export OPENAI_API_KEY='sk-your-key-here'

# 2. 或在代码中传入
const hub = new YYC3AIHub({
  authType: 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY
});

# 3. 验证Key有效性
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### ❌ Issue 4: TypeScript类型错误

**症状**: `TS2307: Cannot find module '@yyc3/ai-hub' or its corresponding type declarations.`

**原因**: 
- 未安装@types声明
- node_modules未正确链接

**解决方案**:
```bash
# 1. 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 2. 检查tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}

# 3. 清除TypeScript缓存
rm -rf *.tsbuildinfo
```

---

## 性能优化建议

### 1. Tree Shaking优化

```typescript
// ❌ 不推荐: 导入整个库
import { YYC3AIHub } from '@yyc3/ai-hub';

// ✅ 推荐: 按需导入
import { createFamilyCompass } from '@yyc3/ai-hub/family-compass';
```

**效果**: 减少打包体积约60%（从25KB降至10KB）

### 2. 缓存策略

```typescript
// 启用缓存减少API调用
const hub = new YYC3AIHub({
  authType: 'openai',
  enableCache: true,
  cacheTTL: 3600000 // 1小时缓存
});
```

### 3. 并发控制

```typescript
// 使用Promise.all进行并行任务处理
const results = await Promise.all([
  workSystem.executeTask(taskId1),
  workSystem.executeTask(taskId2),
  workSystem.executeTask(taskId3)
]);
```

### 4. 内存管理

```typescript
// 及时销毁实例释放资源
hub.destroy(); // 断开所有连接，清除缓存
```

---

## 安全更新流程

### 定期安全审计

```bash
# 1. 检查已知漏洞
npm audit

# 2. 自动修复低风险问题
npm audit fix

# 3. 手动审查高风险漏洞
npm audit --json
```

### 敏感信息保护

⚠️ **禁止事项**:
- ❌ 在代码中硬编码API Key
- ❌ 将.env文件提交到Git
- ❌ 在日志中输出敏感信息

✅ **推荐做法**:
```typescript
// 使用环境变量
const config = {
  apiKey: process.env.OPENAI_API_KEY,
};

// Zod运行时验证防止注入
const UserInput = z.object({
  message: z.string().max(1000).refine(
    val => !val.includes('<script>'),
    { message: 'Invalid input' }
  );
}
```

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

| 包名 | 版本 | 用途 | 许可证 |
|------|------|------|--------|
| zod | ^3.22.0 | Schema验证 | MIT |
| eventemitter3 | ^5.0.1 | 事件系统 | MIT |

#### Peer依赖 (可选)

| 包名 | 版本 | 用途 | 必需性 |
|------|------|------|--------|
| openai | >=4.0.0 | OpenAI模型调用 | 可选 |
| ollama | >=0.5.0 | 本地模型运行 | 可选 |

#### 开发依赖 (devDependencies)

| 包名 | 版本 | 用途 |
|------|------|------|
| typescript | ^5.3.0 | TypeScript编译器 |
| tsup | ^8.0.0 | 打包构建工具 |
| vitest | ^1.0.0 | 单元测试框架 |
| eslint | ^10.x | 代码质量检查 |

### 依赖升级流程

```bash
# 1. 检查过时依赖
pnpm outdated

# 2. 更新到最新版本(谨慎)
pnpm update <package-name>

# 3. 运行测试确认兼容性
pnpm test

# 4. 如有问题回退
pnpm install <package-name>@<previous-version>
```

---

## 监控与告警

### 推荐监控指标

| 指标 | 目标值 | 告警阈值 | 监控方式 |
|------|--------|----------|----------|
| API响应时间 | <200ms | >500ms | 性能日志 |
| 内存使用 | <100MB | >200MB | 进程监控 |
| 错误率 | <0.1% | >1% | 异常捕获 |
| 并发连接数 | <50 | >80 | 连接池状态 |

### 日志规范

```typescript
import { logger } from '@yyc3/ai-hub';

logger.info('Hub initialized', { provider: 'ollama' });
logger.warn('Retry attempt', { attempt: 2, maxRetries: 3 });
logger.error('API call failed', { error: err.message });
```

---

## 紧急修复程序

### Hotfix流程

```bash
# 1. 创建hotfix分支
git checkout -b hotfix/critical-fix-1.0.1

# 2. 修复问题
# ... 编写修复代码 ...

# 3. 仅运行相关测试
pnpm test -- --grep "affected-module"

# 4. 快速发布Patch版本
npm version patch
npm publish --access public

# 5. 合并回main分支
git checkout main
git merge hotfix/critical-fix-1.0.1
```

### 回滚方案

```bash
# 如果发布后发现问题，立即回滚
npm deprecate "@yyc3/ai-hub@1.0.1" "Critical bug, please use 1.0.0"

# 发布修复版本
npm version patch  # 1.0.2
npm publish --access public
```

---

## 维护检查清单

### 每周检查项
- [ ] 运行完整测试套件 `pnpm test`
- [ ] 检查GitHub Issues并响应
- [ ] Review待处理的PR
- [ ] 检查依赖安全漏洞 `npm audit`

### 每月检查项
- [ ] 更新依赖至最新稳定版
- [ ] 分析NPM下载量趋势
- [ ] Review文档准确性
- [ ] 性能基准测试

### 每季度检查项
- [ ] 代码架构Review
- [ ] 技术债务清理计划
- [ ] 社区反馈整合
- [ ] 路线图(Roadmap)更新

### 发布前必查项
- [ ] 所有测试通过 (100% pass rate)
- [ ] TypeScript零错误 (`tsc --noEmit`)
- [ ] ESLint零警告
- [ ] CHANGELOG已更新
- [ ] 版本号符合SemVer
- [ ] exports路径验证通过
- [ ] 文档(README)同步更新
- [ ] 无敏感信息泄露
- [ ] npm pack测试成功
- [ ] License文件包含

---

## 联系维护团队

- **Issue报告**: [GitHub Issues](https://github.com/YanYuCloudCube/Family-PAI/issues)
- **安全漏洞**: [Security Advisory](mailto:admin@0379.email?subject=Security%20Report)
- **一般咨询**: [Discussions](https://github.com/YanYuCloudCube/Family-PAI/discussions)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***言启象限 \| 语枢未来***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
**Last Updated: 2026-04-24**

</div>
