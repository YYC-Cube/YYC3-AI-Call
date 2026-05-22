/**
 * @fileoverview Prisma 数据库客户端
 * @description 全局 Prisma 客户端实例，用于数据库操作
 * @module lib/db
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
