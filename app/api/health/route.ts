import { NextResponse } from 'next/server';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
    ai: boolean;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    nodeVersion: string;
    environment: string;
  };
}

async function checkDatabase(): Promise<boolean> {
  try {
    const { default: prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const { CacheService } = await import('@/lib/redis');
    await CacheService.set('__health_check__', 'ok', 10);
    const value = await CacheService.get<string>('__health_check__');
    return value === 'ok';
  } catch {
    return false;
  }
}

async function checkAI(): Promise<boolean> {
  try {
    const { getAIClient } = await import('@/lib/ai-client');
    const client = getAIClient();
    return await client.healthCheck();
  } catch {
    return false;
  }
}

export async function GET() {
  const startTime = Date.now();

  const [dbOk, redisOk, aiOk] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkAI(),
  ]);

  const services = {
    database: dbOk,
    redis: redisOk,
    ai: aiOk,
  };

  const healthyCount = Object.values(services).filter(Boolean).length;

  let status: HealthCheckResult['status'];
  if (healthyCount === 3) {
    status = 'healthy';
  } else if (healthyCount >= 1) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  const result: HealthCheckResult = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    services,
    system: {
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    },
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(result, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
