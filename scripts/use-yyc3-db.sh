#!/bin/bash
# ============================================
# YYC³ AI Intelligent Calling - 主备/Tailscale 数据库连接
# 用法：. scripts/use-yyc3-db.sh
# 说明：从环境变量/本地密钥文件构造 DATABASE_URL，不把凭证写入仓库。
# ============================================

: "${YYC3_NAS_PG_HOST:?YYC3_NAS_PG_HOST is required (NAS MagicDNS name or LAN host)}"

# 主备库统一使用 5433；若外部环境仍为 5432，则显式纠正并提示
YYC3_NAS_PG_PORT="${YYC3_NAS_PG_PORT:-5433}"
if [ "$YYC3_NAS_PG_PORT" != "5433" ]; then
  echo "[yyc3-db] WARN: YYC3_NAS_PG_PORT=$YYC3_NAS_PG_PORT, using 5433" >&2
  YYC3_NAS_PG_PORT=5433
fi

YYC3_APP_DB_USER="${YYC3_APP_DB_USER:-yyc3_ai_call_app}"

if [ -z "${YYC3_APP_DB_PASSWORD:-}" ] && [ -f "$HOME/yyc3-secrets/yyc3_ai_call_app.password" ]; then
  YYC3_APP_DB_PASSWORD="$(cat "$HOME/yyc3-secrets/yyc3_ai_call_app.password")"
fi

if [ -z "${YYC3_APP_DB_PASSWORD:-}" ]; then
  echo "[yyc3-db] ERROR: set YYC3_APP_DB_PASSWORD or create ~/yyc3-secrets/yyc3_ai_call_app.password" >&2
  return 1 2>/dev/null || exit 1
fi

export YYC3_NAS_PG_PORT
export YYC3_APP_DB_USER
export DATABASE_URL="postgresql://${YYC3_APP_DB_USER}:${YYC3_APP_DB_PASSWORD}@${YYC3_NAS_PG_HOST}:${YYC3_NAS_PG_PORT}/yyc3_ai_call?schema=yyc3_v2&connect_timeout=15"

echo "[yyc3-db] DATABASE_URL ready | db=yyc3_ai_call schema=yyc3_v2 user=${YYC3_APP_DB_USER} port=${YYC3_NAS_PG_PORT}"
