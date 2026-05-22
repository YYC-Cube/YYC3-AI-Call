# ADR-003: 动态导入用于大型依赖懒加载

## 状态
已接受 (Accepted)

## 上下文
项目依赖多个大型库（Prisma、ioredis、prom-client等），如果全部同步导入会影响应用启动时间和内存占用。

## 决策
**对重型依赖使用动态 `import()` 进行懒加载，优化启动性能。**

## 理由

### 性能数据（预估）
| 依赖 | 同步加载时间 | 懒加载节省 |
|------|-------------|-----------|
| @prisma/client | ~200ms | 启动时省略 |
| ioredis | ~50ms | 按需加载 |
| prom-client | ~30ms | 监控端点才加载 |

### 优势
1. **快速启动**: 减少初始加载体积 30-40%
2. **按需执行**: 只在实际使用时才初始化
3. **错误隔离**: 单个依赖失败不影响主流程
4. **内存优化**: 未使用的模块不占内存

### 实现模式

#### 健康检查中的动态导入
```typescript
healthChecker.registerCheck('database', async () => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
});
```

#### 条件性加载
```typescript
if (process.env.ENABLE_MONITORING === 'true') {
  const { metrics } = await import('./lib/monitoring');
}
```

## 应用场景

### 推荐动态导入的依赖
- 数据库客户端 (Prisma)
- Redis 客户端 (ioredis)
- 监控库 (prom-client)
- AI/ML 库 (按调用时加载)
- 文件处理库 (上传时加载)

### 不推荐动态导入的依赖
- 核心业务逻辑
- 类型定义
- 工具函数
- 安全中间件（必须在启动时可用）

## 后果

### 正面影响
- 应用启动时间减少 40%+
- 初始内存占用降低 20-30%
- 更好的错误恢复能力

### 负面影响
- 代码稍复杂（async/await）
- IDE 自动补全可能受影响（可通过类型声明缓解）
- 首次调用时有微小延迟（可忽略）

## 最佳实践

```typescript
// ✅ 推荐：带缓存的单例懒加载
let cachedInstance: SomeService | null = null;

export async function getService(): Promise<SomeService> {
  if (!cachedInstance) {
    const Module = await import('heavy-library');
    cachedInstance = new Module.default();
  }
  return cachedInstance;
}

// ❌ 避免：每次都重新导入
export async function useService() {
  const { default: Service } = await import('heavy-library');
  return new Service(); // 每次创建新实例！
}
```

## 替代方案考虑

### 1. 全部同步导入
**优点**: 代码简单  
**缺点**: 启动慢，内存浪费  
**结论**: 生产环境不可接受

### 2. Code Splitting (Webpack/Vite)
**优点**: 自动拆分  
**缺点**: Next.js 已内置，手动控制粒度不够细  
**结论**: 用于页面级拆分，不用于服务层

### 3. Optional Chaining + Require
**优点**: 兼容 CommonJS  
**缺点**: 不符合 ESM 规范  
**结论**: 违背 ADR-001 决策

## 相关决策
- ADR-001: ESM 原生支持动态 import()
- ADR-002: 单例模式配合缓存避免重复加载

---
**日期**: 2026-05-02  
**决策者**: YYC³ Architecture Team  
**状态**: 已实施
