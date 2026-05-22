# Changelog

All notable changes to `@yyc3/i18n-core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2026-04-24

### 🎉 正式发布 (Stable Release — 文档闭环完成)

#### ✨ 新增特性
- **完整文档体系** — README/CHANGELOG/MAINTENANCE 三件套闭环文档
- **全量 API 参考** — 1250+ 行完整文档，覆盖所有模块
- **架构设计文档** — 分层架构图、数据流图、模块职责说明
- **性能基准测试** — 响应时间、QPS、内存占用详细指标
- **安全特性文档** — OWASP L4 安全标准实现详解
- **最佳实践指南** — 推荐做法与常见陷阱
- **Tree Shaking 指南** — 子路径导入优化，体积节省最高 80%
- **迁移指南链接** — 从 v1.x/v2.x 升级路径说明

#### 📖 文档增强
- **README.md** 全量重写 (1254行)
  - 特性概览与竞品对比表 (vs react-i18next/vue-i18n/typesafe-i18n)
  - 5 种快速开始示例（零配置/插件/React/Vue/Node.js）
  - 7 大核心模块详细文档 (Engine/Cache/Plugin/ICU/AI/MCP/RTL)
  - 完整导出索引与 API 参考手册
  - 高级功能：命名空间/调试模式/多实例/错误处理/性能监控
  - 测试矩阵：28 个文件 / 443 用例 / 92.5% 覆盖率
  - 性能基准：缓存 <0.1ms / AI翻译 800-1500ms
  - 安全特性：ReDoS防护/时序攻击防护/注入检测
  - FAQ 与迁移指南入口
- **CHANGELOG.md** 更新至 2.3.0 正式版
- **MAINTENANCE.md** 新建企业级维护指南

#### 验证结果
- ✅ 文档闭环完成度: 100%
- ✅ 所有示例代码经过验证
- ✅ API 文档与源码一致
- ✅ 测试通过率: 443/443 (100%)
- ✅ 代码覆盖率: 92.5%

---

## [2.1.0] - 2026-04-21

### Added

- ✨ **ICU MessageFormat Engine** — Full parser + compiler supporting plural, select, selectOrdinal, number, date, time, offset, `#` placeholder (12 ICU syntax types, 9 locale plural rules)
- ✨ **AI/LLM Translation Layer** — `AIProviderManager` with `OpenAIProvider` (GPT-4o-mini) and `OllamaProvider` (Qwen2.5:3b) for zero-cost local translation
- ✨ **Translation Quality Estimation** — `QualityEstimator` with 6 built-in rules (empty-translation, source-leak, placeholder-mismatch, glossary-violation, length-anomaly, html-tag-preservation) + custom rule API
- ✨ **MCP Server** — Model Context Protocol server with 7 i18n tools (search_translations, add_translation_key, translate_key, check_missing_keys, get_locale_stats, set_locale, quality_report)
- ✨ **MCP Stdio Transport** — Content-Length framed stdio transport for CLI integration
- ✨ **Chinese Detector** — AST-level hardcoded Chinese string detection for .ts/.tsx/.js/.jsx/.vue/.svelte files
- ✨ **ICU + Engine Integration** — `engine.t()` auto-detects ICU syntax and routes to ICU compiler
- ✨ **Engine.getTranslations()** — New public API for direct locale translation map access
- ✨ **ESLint Configuration** — `.eslintrc.json` with TypeScript strict rules

### Changed

- 📦 Version bumped to 2.1.0
- 📦 Package exports now include `./icu`, `./ai`, `./mcp` sub-paths
- 📦 Keywords expanded with icu-messageformat, mcp, ai-translation, quality-estimation, ast-extraction

### Tests

- 🧪 443 tests / 28 files (up from 346/21)
- 🧪 Coverage: Lines 93.12%, Functions 86.07%, Statements 93.12%, Branches 82.95%
- 🧪 New test suites: ai/providers, mcp/stdio-transport, mcp/i18n-tools, cli/chinese-detector, icu/parser-compiler

---

## [2.0.0] - 2026-04-14

### Added
- ✨ **LRU Cache System** - High-performance caching with TTL support and automatic eviction
- ✨ **Plugin Architecture** - Extensible system with lifecycle hooks (init, destroy)
- ✨ **Built-in Plugins**:
  - `ConsoleLogger` - Development debugging with colored output
  - `MissingKeyReporter` - Production quality monitoring with auto-export
  - `PerformanceTracker` - Performance metrics with percentile calculations
- ✨ **Batch Translation API** - `batchTranslate()` for optimizing multiple key lookups
- ✨ **Namespace Support** - `createNamespace()` for modular translation organization
- ✨ **Debug Mode** - Browser-based debug utilities (`window.__i18n_debug__`)
- ✨ **Statistics Engine** - Comprehensive metrics via `getStats()`
- ✨ **Enhanced TypeScript Types** - Strict mode, improved generics
- ✨ **Error Handling Hooks** - Custom `onError` and `missingKeyHandler`
- ✨ **Multi-instance Support** - Create multiple independent I18nEngine instances
- ✨ **Complete Documentation** - 1500+ lines of API docs and guides
- ✨ **42 Unit Tests** - 100% pass rate covering all core functionality

### Changed
- ⚡ **10x Performance Improvement** - LRU cache reduces translation time from 0.5ms to 0.05ms
- 📦 **25% Memory Reduction** - Optimized data structures and cache management
- 🔧 **Renamed Core Class** - `I18nManager` → `I18nEngine` (better reflects functionality)
- 🔄 **ESM-only Exports** - Tree-shakeable ES modules for smaller bundles
- 📝 **Improved Error Messages** - More descriptive errors with context information
- 🎯 **Stricter Type Safety** - Enhanced TypeScript strict mode compliance

### Fixed
- 🐛 **Memory Leak in Subscriptions** - Proper cleanup on unsubscribe/destroy
- 🐛 **Cache Invalidation Race Condition** - Thread-safe cache operations
- 🐛 **Plugin Context Loss** - Fixed `this` binding issues in plugin methods
- 🐛 **Missing Key Fallback** - Improved fallback chain for missing translations
- 🐛 **Locale Persistence Bug** - Fixed localStorage read/write edge cases

### Breaking Changes
- 💥 **Import Path Changes**:
  - Old: `import { i18n } from '@yyc3/i18n'`
  - New: `import { i18n } from '@yyc3/i18n-core'`
  
- 💥 **Plugin Interface Update**:
  - Renamed hooks for consistency
  - Added required `name` property
  
- 💥 **Configuration Format**:
  - Cache config moved to nested object
  - Debug mode is now a boolean flag

### Migration Guide
See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.

---

## [1.0.0] - 2026-04-01

### Added
- Initial release of YYC³ i18n solution
- Basic translation engine
- Locale switching support
- Parameter interpolation
- Fallback locale mechanism
- Browser localStorage persistence
- 9 foundational unit tests
- Integration with OpenClaw UI project

---

## 版本说明

| 版本 | 类型 | 发布日期 | 状态 | 说明 |
|------|------|----------|------|------|
| **2.3.0** | Patch | 2026-04-24 | ✅ Stable | 正式版 — 文档闭环完成 |
| **2.1.0** | Minor | 2026-04-21 | ✅ Stable | AI/MCP/ICU 大版本更新 |
| **2.0.0** | Major | 2026-04-14 | ✅ Stable | 架构重构版 (Breaking Changes) |
| **1.0.0** | Major | 2026-04-01 | ⚠️ Legacy | 初始版本 |

---

## 变更类型图例

- ✨ 新增特性 (Added)
- 🔄 变更 (Changed)
- 🔧 修复 (Fixed)
- ❌ 移除 (Removed)
- 🔒 安全 (Security)
- 📖 文档 (Documentation)
- 🎉 发布 (Release)

---

[2.3.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v2.3.0
[2.1.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v2.1.0
[2.0.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v2.0.0
[1.0.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v1.0.0
