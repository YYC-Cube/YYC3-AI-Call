/**
 * 预呼合规校验管线（五道闸）单测
 * 覆盖：每道闸通过/阻断、跨午夜时段边界、Redis 降级放行、快照与审计断言
 */
import prisma from '@/lib/db';
import { CacheService } from '@/lib/redis';
import { runPrecallCheck, isInQuietHours } from '@/lib/compliance/precall';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    phoneNumber: { findUnique: jest.fn() },
    outboundTask: { create: jest.fn(), update: jest.fn() },
    dncEntry: { findUnique: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  CacheService: { increment: jest.fn().mockResolvedValue(1) },
}));

const phoneNumberFindUnique = prisma.phoneNumber.findUnique as jest.Mock;
const outboundTaskCreate = prisma.outboundTask.create as jest.Mock;
const outboundTaskUpdate = prisma.outboundTask.update as jest.Mock;
const dncEntryFindUnique = prisma.dncEntry.findUnique as jest.Mock;
const auditLogCreate = prisma.auditLog.create as jest.Mock;
const increment = CacheService.increment as jest.Mock;

/** 可用线路桩 */
const AVAILABLE_LINE = {
  id: 'line-1',
  number: '10001',
  status: 'AVAILABLE',
  authorization: 'AUTH-DEMO-001',
  dailyLimit: 3,
};

/** 14:00（上海）—— 非禁拨时段 */
const baseInput = {
  lineNumber: '10001',
  customerPhone: '13800000001',
  userId: 'user-1',
  now: new Date('2026-11-20T14:00:00+08:00'),
};

beforeEach(() => {
  jest.clearAllMocks();
  phoneNumberFindUnique.mockResolvedValue({ ...AVAILABLE_LINE });
  outboundTaskCreate.mockResolvedValue({ id: 'task-1' });
  outboundTaskUpdate.mockResolvedValue({});
  dncEntryFindUnique.mockResolvedValue(null);
  increment.mockResolvedValue(1);
});

describe('闸 1：号码状态', () => {
  it('线路未登记 → NUMBER_STATUS 阻断且不建任务', async () => {
    phoneNumberFindUnique.mockResolvedValue(null);
    const r = await runPrecallCheck(baseInput);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.gate).toBe('NUMBER_STATUS');
      expect(r.taskId).toBeUndefined();
    }
    expect(outboundTaskCreate).not.toHaveBeenCalled();
  });

  it('线路 SUSPENDED → 阻断', async () => {
    phoneNumberFindUnique.mockResolvedValue({ ...AVAILABLE_LINE, status: 'SUSPENDED' });
    const r = await runPrecallCheck(baseInput);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.gate).toBe('NUMBER_STATUS');
  });

  it('线路缺少授权凭证 → 阻断', async () => {
    phoneNumberFindUnique.mockResolvedValue({ ...AVAILABLE_LINE, authorization: null });
    const r = await runPrecallCheck(baseInput);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('授权');
  });
});

describe('闸 2：禁拨名单', () => {
  it('永久禁拨命中 → DNC 阻断 + 任务 BLOCKED + 审计日志', async () => {
    dncEntryFindUnique.mockResolvedValue({ phone: baseInput.customerPhone, reason: 'COMPLAINT', expiresAt: null });
    const r = await runPrecallCheck(baseInput);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.gate).toBe('DNC');
      expect(r.taskId).toBe('task-1');
    }
    expect(outboundTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'task-1' }, data: expect.objectContaining({ status: 'BLOCKED' }) })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'PRECALL_BLOCKED' }) })
    );
  });

  it('有期禁拨已过期 → 放行', async () => {
    dncEntryFindUnique.mockResolvedValue({
      phone: baseInput.customerPhone,
      reason: 'OPT_OUT',
      expiresAt: new Date('2026-11-01T00:00:00+08:00'),
    });
    const r = await runPrecallCheck(baseInput);
    expect(r.ok).toBe(true);
  });
});

describe('闸 3：禁拨时段', () => {
  it('22:00 处于禁拨窗口 → TIME_WINDOW 阻断', async () => {
    const r = await runPrecallCheck({ ...baseInput, now: new Date('2026-11-20T22:00:00+08:00') });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.gate).toBe('TIME_WINDOW');
  });

  it('08:59 禁拨 / 09:01 放行（跨午夜边界闭开区间）', async () => {
    const blocked = await runPrecallCheck({ ...baseInput, now: new Date('2026-11-21T08:59:00+08:00') });
    const allowed = await runPrecallCheck({ ...baseInput, now: new Date('2026-11-21T09:01:00+08:00') });
    expect(blocked.ok).toBe(false);
    expect(allowed.ok).toBe(true);
  });
});

describe('闸 4：频次', () => {
  it('当日呼出超上限 → FREQUENCY 阻断', async () => {
    increment.mockResolvedValue(4); // dailyLimit 3
    const r = await runPrecallCheck(baseInput);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.gate).toBe('FREQUENCY');
  });

  it('Redis 降级（increment 返 0）→ 放行（与仓库降级口径一致）', async () => {
    increment.mockResolvedValue(0);
    const r = await runPrecallCheck(baseInput);
    expect(r.ok).toBe(true);
  });
});

describe('全链通过：快照与标识', () => {
  it('COMPLIANCE_PASSED：五道闸全 ok + 快照含 AI 标识上下文', async () => {
    const r = await runPrecallCheck({ ...baseInput, customerId: 'cust-1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.taskId).toBe('task-1');
      expect(r.snap.gates).toHaveLength(5);
      expect(r.snap.gates.every((g) => g.ok)).toBe(true);
      expect(r.snap.disclosure.explicitText).toContain('智能语音助手');
      expect(r.snap.disclosure.metadata.aiGenerated).toBe(true);
      expect(r.snap.disclosure.metadata.contentId).toBe('task-1');
      expect(outboundTaskUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLIANCE_PASSED', complianceSnap: r.snap }),
        })
      );
    }
    expect(auditLogCreate).not.toHaveBeenCalled();
  });
});

describe('isInQuietHours 纯函数', () => {
  it('21:00 起进入禁拨；09:00 整点解除', () => {
    expect(isInQuietHours(new Date('2026-11-20T21:00:00+08:00'))).toBe(true);
    expect(isInQuietHours(new Date('2026-11-20T20:59:00+08:00'))).toBe(false);
    expect(isInQuietHours(new Date('2026-11-21T09:00:00+08:00'))).toBe(false);
    expect(isInQuietHours(new Date('2026-11-20T14:00:00+08:00'))).toBe(false);
  });
});
