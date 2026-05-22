-- ============================================
-- YYC³ AI Intelligent Calling - 数据库初始化脚本
-- 在PostgreSQL容器首次启动时自动执行
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建应用用户（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolename = 'yyc3_app') THEN
        CREATE ROLE yyc3_app WITH LOGIN PASSWORD 'app_password_change_me';
    END IF;
END
$$;

-- 授予必要权限
GRANT CONNECT ON DATABASE yyc3_ai_calling TO yyc3_app;
GRANT USAGE ON SCHEMA public TO yyc3_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO yyc3_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yyc3_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yyc3_app;

-- 创建默认管理员账户
INSERT INTO "User" (
    id,
    email,
    name,
    password,
    role,
    status,
    "createdAt",
    "updatedAt"
) VALUES (
    uuid_generate_v4(),
    'admin@yyc3.ai',
    '系统管理员',
    crypt('Admin@2024Secure!', gen_salt('bf')),
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 创建示例客户数据（可选）
INSERT INTO "Customer" (
    id,
    name,
    phone,
    email,
    company,
    status,
    "createdAt",
    "updatedAt"
) VALUES 
    (
        uuid_generate_v4(),
        '测试客户',
        '+8613800138000',
        'test@example.com',
        '测试公司',
        'ACTIVE',
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;

-- 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_calls_customer_id ON "Call"("customerId");
CREATE INDEX IF NOT EXISTS idx_calls_status ON "Call"(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON "Call"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_call_analyses_call_id ON "CallAnalysis"("callId");
CREATE INDEX IF NOT EXISTS idx_tasks_status ON "Task"(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "AuditLog"(action);

-- 输出初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '✅ YYC³ AI Calling 数据库初始化完成';
    RAISE NOTICE '   管理员账号: admin@yyc3.ai';
    RAISE NOTICE '   默认密码: Admin@2024Secure!';
    RAISE NOTICE '   ⚠️  请立即修改默认密码！';
END
$$;
