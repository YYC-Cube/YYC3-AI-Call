/**
 * @jest-environment node
 *
 * 合规闭环集成测试：外呼发起链路（真实 precall 管线 + DB/Redis mock）
 * 覆盖 DoD：禁拨号码外呼被拒且任务状态 BLOCKED；合规号码放行进入 DIALING
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
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    dncEntry: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
    outboundTask: {
      create: jest.fn().mockResolvedValue({ id: 'task-int-1' }),
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  CacheService: { increment: jest.fn().mockResolvedValue(1) },
}));

// 鉴权由 tests/unit/lib/api-auth.test.ts 专门覆盖，此处放行
jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(() => ({
    ok: true,
    userId: 'user-int-1',
    email: 'agent@yyc3.com',
    role: 'AGENT',
  })),
}));

import prisma from '@/lib/db';
import { POST as outboundCallsPost } from '@/app/api/compliance/outbound-calls/route';

const phoneNumberFindUnique = prisma.phoneNumber.findUnique as jest.Mock;
const dncEntryFindUnique = prisma.dncEntry.findUnique as jest.Mock;
const outboundTaskUpdate = prisma.outboundTask.update as jest.Mock;
const auditLogCreate = prisma.auditLog.create as jest.Mock;

const AVAILABLE_LINE = {
  id: 'line-int-1',
  number: '10001',
  status: 'AVAILABLE',
  authorization: 'AUTH-DEMO-001',
  dailyLimit: 3,
};

function makeReq(body: unknown): unknown {
  return {
    url: 'http://localhost/api/x',
    headers: { get: jest.fn().mockReturnValue(null) },
    json: jest.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  phoneNumberFindUnique.mockResolvedValue({ ...AVAILABLE_LINE });
  dncEntryFindUnique.mockResolvedValue(null);
  outboundTaskUpdate.mockResolvedValue({});
  auditLogCreate.mockResolvedValue({});
});

describe('外呼发起合规闭环（集成）', () => {
  it('禁拨号码外呼 → 422 拒绝（gate=DNC）且任务置 BLOCKED + 审计', async () => {
    dncEntryFindUnique.mockResolvedValue({
      phone: '19999990001',
      reason: 'COMPLAINT',
      expiresAt: null,
    });

    const res = await outboundCallsPost(
      makeReq({ lineNumber: '10001', customerPhone: '19999990001' }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.code).toBe('CALL_BLOCKED');
    expect(body.gate).toBe('DNC');
    expect(body.taskId).toBe('task-int-1');

    // 任务状态 BLOCKED + PRECALL_BLOCKED 审计留痕
    expect(outboundTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-int-1' },
        data: expect.objectContaining({ status: 'BLOCKED' }),
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'PRECALL_BLOCKED' }),
      })
    );
  });

  it('合规号码外呼 → 200 进入 DIALING 并下发 AI 标识上下文', async () => {
    const res = await outboundCallsPost(
      makeReq({ lineNumber: '10001', customerPhone: '13800000001' }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('DIALING');
    expect(body.data.disclosure.explicitText).toContain('智能语音助手');
    expect(body.data.disclosure.metadata.aiGenerated).toBe(true);
    expect(outboundTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DIALING' }) })
    );
  });

  it('未登记线路 → 422 gate=NUMBER_STATUS（不建任务）', async () => {
    phoneNumberFindUnique.mockResolvedValue(null);
    const res = await outboundCallsPost(
      makeReq({ lineNumber: '99999', customerPhone: '13800000001' }) as never
    );
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.gate).toBe('NUMBER_STATUS');
    expect(body.taskId).toBeNull();
  });
  // 注：TIME_WINDOW（禁拨时段）已由 tests/unit/lib/compliance/precall.test.ts
  // 以注入 now 的方式覆盖（含 21:00/09:00 跨午夜边界），集成层不再重复。
});
