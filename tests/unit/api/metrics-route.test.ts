/**
 * GET /api/metrics 单测：鉴权 + 角色门禁 + Prometheus 格式
 */
import '@testing-library/jest-dom';

jest.mock('next/server', () => {
  const NextResponse = jest.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
    status: init?.status ?? 200,
    headers: init?.headers ?? {},
    text: async () => String(body),
  }));
  // 保留静态 json 方法供 401/403 分支使用
  (NextResponse as unknown as { json: unknown }).json = (
    data: unknown,
    init?: { status?: number }
  ) => ({
    status: init?.status ?? 200,
    json: async () => data,
  });
  return { NextResponse };
});

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/observability', () => {
  const actual = jest.requireActual('@/lib/observability');
  return {
    __esModule: true,
    ...actual,
    // 复用真实 collector，测试前 reset
  };
});

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/metrics/route';
import { requireAuth } from '@/lib/api-auth';
import { metrics, observeTtft } from '@/lib/observability';

const mockGate = requireAuth as jest.Mock;

function makeReq(): unknown {
  return {
    url: 'http://localhost/api/metrics',
    headers: { get: jest.fn().mockReturnValue(null) },
  };
}

beforeEach(() => {
  metrics.reset();
  mockGate.mockReset();
});

describe('GET /api/metrics', () => {
  it('未认证 → 401', async () => {
    mockGate.mockReturnValue({
      ok: false,
      response: NextResponse.json({ success: false }, { status: 401 }),
    });
    const res = await GET(makeReq() as never);
    expect(res.status).toBe(401);
  });

  it('AGENT 角色 → 403（指标限管理角色）', async () => {
    mockGate.mockReturnValue({ ok: true, userId: 'u1', email: 'a@b.c', role: 'AGENT' });
    const res = await GET(makeReq() as never);
    expect(res.status).toBe(403);
  });

  it('ADMIN 角色 → 200 返回 Prometheus 文本（含已观测指标）', async () => {
    mockGate.mockReturnValue({ ok: true, userId: 'u1', email: 'a@b.c', role: 'ADMIN' });
    observeTtft('chat_stream', 150);

    const res = await GET(makeReq() as never);
    expect(res.status).toBe(200);
    const contentType = (res.headers as unknown as { get?: (k: string) => string }).get?.('Content-Type')
      ?? (res.headers as unknown as Record<string, string>)['Content-Type'];
    expect(contentType).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('yyc3_chat_ttft_ms');
  });
});
