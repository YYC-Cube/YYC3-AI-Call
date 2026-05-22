# @yyc3/emotion — MAINTENANCE

## 构建

```bash
pnpm build       # 生产构建
pnpm dev         # 开发构建 (watch)
pnpm clean       # 清理 dist
```

## 测试

```bash
pnpm test              # 运行测试
pnpm test:watch        # 监听模式
pnpm test:coverage     # 覆盖率报告
```

### 覆盖率目标

| 指标 | 目标 | 当前 |
|------|------|------|
| Statements | ≥90% | ~85% |
| Branches | ≥80% | ~80% |
| Functions | ≥80% | ~85% |
| Lines | ≥90% | ~85% |

## 发布

```bash
pnpm prepublishOnly  # 自动执行 clean + build + test
```
