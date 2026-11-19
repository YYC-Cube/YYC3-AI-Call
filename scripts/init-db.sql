-- ============================================
-- YYC³ AI Intelligent Calling - 数据库初始化脚本
-- 仅负责扩展初始化；表结构与种子数据由 Prisma 管理
-- 执行顺序：init-db.sql → prisma migrate deploy → prisma db seed
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 注意：
-- 1. 不要在此脚本中创建业务表或写入种子数据，避免与 prisma/schema.prisma 漂移。
-- 2. 默认管理员账号由 `pnpm db:seed` 创建，禁止在仓库中硬编码密码。
-- 3. 生产环境请通过环境变量注入数据库凭据，勿使用示例默认值。
