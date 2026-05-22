# ADR-001: 使用ESM (ECMAScript Modules) 作为模块系统

## 状态
已接受 (Accepted)

## 上下文
YYC³ AI Calling 项目需要选择模块系统来组织代码。Node.js 历史上使用 CommonJS (`require`/`module.exports`)，但现代 JavaScript 标准采用 ESM (`import`/`export`)。

## 决策
**采用 ESM (ECMAScript Modules) 作为项目的唯一模块系统。**

## 理由

### 优势
1. **标准化**: ESM 是 JavaScript 官方标准，获得所有现代浏览器和运行时支持
2. **Tree Shaking**: 支持静态分析，可消除未使用的代码，减小打包体积
3. **Top-level await**: 支持顶层异步操作，简化异步初始化逻辑
4. **类型安全**: 与 TypeScript 的 `isolatedModules` 配合更好
5. **未来兼容**: Node.js、Deno、Bun 都原生支持 ESM
6. **开发体验**: IDE 自动补全和重构支持更完善

### 劣势（已缓解）
- CommonJS 兼容性：通过构建工具转换解决
- 某些旧库不支持：大多数主流库已提供 ESM 入口

## 后果

### 正面影响
- 代码更现代化，符合行业最佳实践
- 打包体积优化（预计减少15-20%）
- 更好的 TypeScript 集成
- 统一的导入导出语法

### 负面影响
- 需要配置 `"type": "module"` 在 package.json
- 不能使用 `require()` 动态导入（改用动态 `import()`）
- 某些工具库需要特殊处理

## 替代方案考虑
1. **CommonJS**: 传统方案，但已被淘汰趋势
2. **混合模式**: 导致混乱，增加维护成本
3. **UMD**: 主要用于库发布，不适合应用项目

## 相关决策
- ADR-002: 单例模式用于服务实例管理
- ADR-003: 动态导入用于大型依赖懒加载

---
**日期**: 2026-05-02  
**决策者**: YYC³ Architecture Team  
**状态**: 已实施
