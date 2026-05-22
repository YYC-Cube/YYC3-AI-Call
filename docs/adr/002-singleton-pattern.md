# ADR-002: 单例模式用于服务实例管理

## 状态
已接受 (Accepted)

## 上下文
项目中有多个全局服务（数据库连接、缓存、监控、安全中间件等），需要确定如何管理这些服务的生命周期和实例。

## 决策
**采用单例模式 (Singleton Pattern) 管理所有核心服务实例。**

## 理由

### 为什么使用单例
1. **资源控制**: 数据库连接池、Redis 连接等资源有限，必须共享
2. **状态一致性**: 避免多个实例导致状态不一致（如缓存数据）
3. **性能优化**: 避免重复初始化开销
4. **依赖注入友好**: 方便测试时替换实现
5. **内存效率**: 减少不必要的对象创建

### 实现方式
```typescript
class MetricsCollector {
  private static instance: MetricsCollector;
  
  private constructor() {}
  
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }
}

export const metrics = MetricsCollector.getInstance();
```

## 应用范围

### 使用单例的服务
| 服务 | 原因 |
|------|------|
| PrismaClient | 数据库连接池管理 |
| Redis Client | 连接复用 |
| MetricsCollector | 统一指标收集 |
| SecurityMiddleware | 共享配置和状态 |
| RBACService | 权限规则缓存 |
| RateLimiter | 限流计数器 |

### 不使用单例的场景
- 请求级别的对象（如 Request、Response）
- 无状态的工具函数
- 测试中的 mock 对象

## 后果

### 正面影响
- 资源使用高效，避免连接泄漏
- 全局访问点，代码简洁
- 易于统一配置和管理

### 风险与缓解
- **测试隔离**: 通过 `resetAll()` 方法或依赖注入解决
- **并发安全**: Node.js 单线程特性天然支持
- **循环依赖**: 通过延迟导入 (`import()`) 解决

## 替代方案考虑

### 1. 依赖注入容器 (DI Container)
**优点**: 更灵活，易于测试  
**缺点**: 增加复杂度，过度工程化  
**结论**: 项目规模不需要，保持简单

### 2. 全局变量/模块级实例
**优点**: 最简单  
**缺点**: 无法控制初始化时机，难以测试  
**结论**: 不够灵活，放弃

### 3. 工厂模式 + 实例池
**优点**: 可管理多个实例  
**缺点**: 复杂度高，本项目不需要多实例  
**结论**: 过度设计，放弃

## 相关决策
- ADR-001: ESM 模块系统支持静态单例导出
- ADR-003: 动态导入用于懒加载重型服务

---
**日期**: 2026-05-02  
**决策者**: YYC³ Architecture Team  
**状态**: 已实施
