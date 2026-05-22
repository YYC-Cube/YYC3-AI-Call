# YYC³ AI Intelligent Calling - 安全策略

## 支持版本

| 版本 | 支持状态 |
| ------- | ------------------ |
| 1.0.x | :white_check_mark: |

## 安全特性

- **JWT 认证**：Access Token + Refresh Token 双令牌机制
- **RBAC 权限控制**：USER / AGENT / MANAGER / ADMIN 四级角色
- **输入验证**：Zod Schema 全接口输入验证
- **速率限制**：Redis 支持的 API 速率限制
- **安全头部**：X-Frame-Options, X-Content-Type-Options, CSP 等
- **密码安全**：bcryptjs 哈希存储

## 报告安全漏洞

如果您发现安全漏洞，请通过以下方式报告：

- **邮箱**：security@0379.email
- **GitHub Issues**：请勿在公开 Issue 中报告安全漏洞
- **响应时间**：我们将在 48 小时内确认收到，7 天内提供初步评估

### 报告内容

请包含以下信息：
1. 漏洞类型（XSS、SQL 注入、CSRF 等）
2. 受影响的版本和组件
3. 复现步骤
4. 潜在影响评估
