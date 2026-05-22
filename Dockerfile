# ============================================
# YYC³ AI Intelligent Calling - Dockerfile
# 多阶段构建：优化镜像大小和安全性
# ============================================

# --------------------------------------------
# 阶段1: 基础依赖安装
# --------------------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache \
    libc6-compat \
    tini \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# --------------------------------------------
# 阶段2: 依赖安装
# --------------------------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# 安装pnpm并安装依赖
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --frozen-lockfile --prod=false

# --------------------------------------------
# 阶段3: 构建应用
# --------------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建Next.js应用
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm run build

# --------------------------------------------
# 阶段4: 生产依赖提取
# --------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 安全性：非root用户运行
USER nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动命令（使用tini作为PID 1）
ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]

# 元数据标签
LABEL maintainer="YYC³ AI Team <admin@0379.email>"
LABEL version="1.0.0"
LABEL description="YYC³ AI智能呼叫系统 - 生产环境镜像"
LABEL org.opencontainers.image.source="https://github.com/YY-Nexus/YYC-AI-Intelligent-Calling"
