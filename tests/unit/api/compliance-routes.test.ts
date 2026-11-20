/**
 * 合规 API 路由单测：鉴权/角色门禁 + precall-check 通过与阻断两态
 * 鉴权由 tests/unit/lib/api-auth.test.ts 专门覆盖，此处以 bypass mock 放行
 */
import '@testing-library/jest-dom';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    phoneNumber: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dncEntry: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
    outboundTask: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

import prisma from '@/lib/db';

const mockPrisma = prisma as unknown as {
  phoneNumber: Record<string, jest.Mock>;
  dncEntry: Record<string, jest.Mock>;
  outboundTask: Record<string, jest.Mock>;
  auditLog: Record<string, jest.Mock>;
};

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  CacheService: { increment: jest.fn().mockResolvedValue(1) },
}));

// 管理员上下文放行（角色门禁由 403 用例单独覆盖）
jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(() => ({
    ok: true,
    userId: 'user-1',
    email: 'admin@yyc3.com',
    role: 'ADMIN',
  })),
}));

jest.mock('@/lib/compliance/precall', () => ({
  runPrecallCheck: jest.fn(),
}));

import { GET as numbersGet, POST as numbersPost, PATCH as numbersPatch } from '@/app/api/compliance/numbers/route';
import { POST as dncPost } from '@/app/api/compliance/dnc/route';
import { POST as precallPost } from '@/app/api/compliance/precall-check/route';
import { runPrecallCheck } from '@/lib/compliance/precall';
import { requireAuth } from '@/lib/api-auth';

function makeReq(url: string, body?: unknown, role?: string): unknown {
  // role 注入：临时改写 requireAuth mock 返回值
  if (role) {
    (requireAuth as jest.Mock).mockReturnValueOnce({
      ok: true,
      userId: 'user-1',
      email: 'op@yyc3.com',
      role,
    });
  }
  return {
    url,
    headers: { get: jest.fn().mockReturnValue(null) },
    json: jest.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // 清除后重设默认放行（makeReq 的 role 注入用 mockReturnValueOnce 覆盖）
  (requireAuth as jest.Mock).mockImplementation(
    () => ({ ok: true, userId: 'user-1', email: 'admin@yyc3.com', role: 'ADMIN' })
  );
});

describe('GET /api/compliance/numbers', () => {
  it('返回号码列表与分页', async () => {
    const res = await numbersGet(makeReq('http://localhost/api/compliance/numbers?page=1&pageSize=20') as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pagination).toMatchObject({ page: 1, pageSize: 20 });
  });
});

describe('POST /api/compliance/numbers', () => {
  it('非法号码 → 400', async () => {
    const res = await numbersPost(makeReq('http://localhost/x', { number: 'abc' }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_NUMBER');
  });

  it('非 MANAGER 角色 → 403', async () => {
    const res = await numbersPost(
      makeReq('http://localhost/x', { number: '10001' }, 'AGENT') as never
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN');
  });

  it('合法号码登记成功 → 201', async () => {
    mockPrisma.phoneNumber.create.mockResolvedValue({ id: 'pn-1', number: '10001' });
    const res = await numbersPost(
      makeReq('http://localhost/x', { number: '10001', carrier: '电信', authorization: 'AUTH-1' }) as never
    );
    expect(res.status).toBe(201);
    expect(mockPrisma.phoneNumber.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ number: '10001' }) })
    );
  });
});

describe('PATCH /api/compliance/numbers', () => {
  it('无凭证转 AVAILABLE → 422（合规硬约束）', async () => {
    mockPrisma.phoneNumber.findUnique.mockResolvedValue({
      id: 'pn-1',
      status: 'SUSPENDED',
      authorization: null,
    });
    const res = await numbersPatch(
      makeReq('http://localhost/x', { id: 'pn-1', status: 'AVAILABLE' }) as never
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('AUTHORIZATION_REQUIRED');
    expect(mockPrisma.phoneNumber.update).not.toHaveBeenCalled();
  });

  it('带凭证转 AVAILABLE 成功', async () => {
    mockPrisma.phoneNumber.findUnique.mockResolvedValue({
      id: 'pn-1',
      status: 'SUSPENDED',
      authorization: null,
    });
    mockPrisma.phoneNumber.update.mockResolvedValue({ id: 'pn-1', status: 'AVAILABLE' });
    const res = await numbersPatch(
      makeReq('http://localhost/x', { id: 'pn-1', status: 'AVAILABLE', authorization: 'AUTH-9' }) as never
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.phoneNumber.update).toHaveBeenCalled();
  });
});

describe('POST /api/compliance/dnc', () => {
  it('批量新增成功 → 201 返回计数', async () => {
    mockPrisma.dncEntry.createMany.mockResolvedValue({ count: 2 });
    const res = await dncPost(
      makeReq('http://localhost/x', {
        items: [
          { phone: '13800000001', reason: 'COMPLAINT' },
          { phone: '13800000002', reason: 'OPT_OUT' },
        ],
      }) as never
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.count).toBe(2);
  });

  it('非法 reason → 400', async () => {
    const res = await dncPost(
      makeReq('http://localhost/x', { phone: '13800000001', reason: 'OTHER' }) as never
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/compliance/precall-check', () => {
  it('非法被叫号码 → 400', async () => {
    const res = await precallPost(
      makeReq('http://localhost/x', { lineNumber: '10001', customerPhone: 'abc' }) as never
    );
    expect(res.status).toBe(400);
  });

  it('校验通过 → 200 返回 taskId 与快照', async () => {
    (runPrecallCheck as jest.Mock).mockResolvedValue({
      ok: true,
      taskId: 'task-1',
      status: 'COMPLIANCE_PASSED',
      snap: { gates: [] },
    });
    const res = await precallPost(
      makeReq('http://localhost/x', { lineNumber: '10001', customerPhone: '13800000001' }) as never
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.taskId).toBe('task-1');
    expect(body.data.snap).toBeDefined();
  });

  it('校验阻断 → 422 返回 gate 与 reason', async () => {
    (runPrecallCheck as jest.Mock).mockResolvedValue({
      ok: false,
      gate: 'DNC',
      reason: '被叫号码在禁拨名单（原因：COMPLAINT）',
      taskId: 'task-2',
    });
    const res = await precallPost(
      makeReq('http://localhost/x', { lineNumber: '10001', customerPhone: '19999990001' }) as never
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.gate).toBe('DNC');
    expect(body.code).toBe('PRECALL_BLOCKED');
  });
});
