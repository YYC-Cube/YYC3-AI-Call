/**
 * 录音留存合规单测：attachRecording 到期时间计算 + purge 幂等与审计
 */
import prisma from '@/lib/db';
import { attachRecording, purgeExpiredRecordings } from '@/lib/compliance/recording';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    call: { update: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

const callUpdate = prisma.call.update as jest.Mock;
const callFindMany = prisma.call.findMany as jest.Mock;
const auditLogCreate = prisma.auditLog.create as jest.Mock;

/** 固定基准：2026-11-20T10:00:00+08:00 */
const NOW = new Date('2026-11-20T10:00:00+08:00');

beforeEach(() => {
  jest.clearAllMocks();
  callUpdate.mockResolvedValue({});
  callFindMany.mockResolvedValue([]);
  auditLogCreate.mockResolvedValue({});
});

describe('attachRecording', () => {
  it('写入 recordingUrl 并按 30 日口径计算 recordingExpiresAt', async () => {
    await attachRecording('call-1', 'https://storage.example/call-1.mp3', NOW);
    expect(callUpdate).toHaveBeenCalledWith({
      where: { id: 'call-1' },
      data: {
        recordingUrl: 'https://storage.example/call-1.mp3',
        recordingExpiresAt: new Date('2026-12-20T10:00:00+08:00'),
      },
    });
  });
});

describe('purgeExpiredRecordings', () => {
  it('到期记录置空 URL 并逐条写 RECORDING_PURGED 审计', async () => {
    callFindMany.mockResolvedValue([{ id: 'call-1', recordingUrl: 'https://s/a.mp3' }]);
    const summary = await purgeExpiredRecordings(NOW);
    expect(callFindMany).toHaveBeenCalledWith({
      where: { recordingExpiresAt: { lt: NOW }, recordingUrl: { not: null } },
      select: { id: true, recordingUrl: true },
    });
    expect(callUpdate).toHaveBeenCalledWith({
      where: { id: 'call-1' },
      data: { recordingUrl: null },
    });
    expect(auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'RECORDING_PURGED',
        resourceType: 'Call',
        resourceId: 'call-1',
      }),
    });
    expect(summary).toEqual({ scanned: 1, purged: 1 });
  });

  it('幂等：重跑时已置空记录不再被匹配（第二次零副作用）', async () => {
    callFindMany
      .mockResolvedValueOnce([{ id: 'call-1', recordingUrl: 'https://s/a.mp3' }])
      .mockResolvedValueOnce([]);
    await purgeExpiredRecordings(NOW);
    const second = await purgeExpiredRecordings(NOW);
    expect(second).toEqual({ scanned: 0, purged: 0 });
    expect(callUpdate).toHaveBeenCalledTimes(1); // 仅首轮执行过一次置空
  });

  it('无到期记录时零副作用', async () => {
    const summary = await purgeExpiredRecordings(NOW);
    expect(summary).toEqual({ scanned: 0, purged: 0 });
    expect(callUpdate).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });
});
