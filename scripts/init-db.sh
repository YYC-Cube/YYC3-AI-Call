#!/bin/bash
# ============================================
# YYC³ AI Intelligent Calling - 数据库初始化
# 单一事实来源：prisma/schema.prisma + prisma/migrations
# 用法：DATABASE_URL=... bash scripts/init-db.sh [--seed]
# ============================================

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL 未设置"
  echo "   YYC3 主备环境示例（请勿将真实密码写入仓库）："
  echo "   export DATABASE_URL=\"postgresql://<user>:<password>@<NAS_HOST>:5433/yyc3_ai_call?schema=yyc3_v2\""
  exit 1
fi

echo "🚀 应用 Prisma 迁移..."
pnpm exec prisma migrate deploy

if [ "$1" = "--seed" ]; then
  echo "🌱 写入种子数据..."
  pnpm db:seed
fi

echo "✅ 数据库初始化完成"
echo "   下一步：pnpm db:verify"
