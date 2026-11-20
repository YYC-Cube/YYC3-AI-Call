/**
 * @fileoverview 延迟与业务指标暴露端点（Prometheus 文本格式）
 * @description GET /api/metrics —— 输出 MetricsCollector 的 Prometheus 格式
 *              指标（counter/gauge/histogram summary，含 TTFT/TTS/E2E 延迟）。
 *              鉴权：requireAuth + MANAGER/ADMIN（指标含业务量信息，不对普通角色开放）。
 * @module app/api/metrics
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { metrics } from '@/lib/observability';

/** GET /api/metrics */
export async function GET(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;

  // 指标含业务量与延迟分布，限管理角色
  if (!['MANAGER', 'ADMIN'].includes(gate.role)) {
    return NextResponse.json(
      { success: false, error: '权限不足，需要 MANAGER 或更高角色', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  return new NextResponse(metrics.exportPrometheusFormat(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
