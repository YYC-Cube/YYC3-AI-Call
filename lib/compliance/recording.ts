/**
 * @fileoverview 录音留存合规（写入助手 + 到期清理）
 * @description 通话录音统一写入口：写入 recordingUrl 的同时按合规配置
 *              （默认 ≥30 日口径，单点见 lib/compliance/config）计算
 *              recordingExpiresAt；到期由 purgeExpiredRecordings 置空 URL
 *              并逐条写 AuditLog（幂等：已置空记录不会被再次匹配）。
 *
 *              注意：对象存储侧的物理删除由存储生命周期规则兜底；本函数
 *              负责数据库指针回收与审计留痕。
 * @module lib/compliance/recording
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import prisma from '@/lib/db';
import { COMPLIANCE_CONFIG } from './config';

/**
 * 通话录音统一写入口（未来通话管线落录音时必须走此函数）。
 * @param callId 通话 ID
 * @param url 录音存储地址
 * @param now 注入时间（测试用），默认当前时间
 */
export async function attachRecording(
  callId: string,
  url: string,
  now: Date = new Date()
): Promise<void> {
  const expiresAt = new Date(now.getTime());
  expiresAt.setDate(expiresAt.getDate() + COMPLIANCE_CONFIG.recordingRetentionDays);

  await prisma.call.update({
    where: { id: callId },
    data: { recordingUrl: url, recordingExpiresAt: expiresAt },
  });
}

export interface PurgeSummary {
  scanned: number;
  purged: number;
}

/**
 * 清理到期录音：置空 recordingUrl + 逐条审计（RECORDING_PURGED）。
 * 幂等：recordingUrl 已为 null 的记录不会被匹配，可安全重跑。
 * @param now 注入时间（测试用），默认当前时间
 */
export async function purgeExpiredRecordings(now: Date = new Date()): Promise<PurgeSummary> {
  const expired = await prisma.call.findMany({
    where: { recordingExpiresAt: { lt: now }, recordingUrl: { not: null } },
    select: { id: true, recordingUrl: true },
  });

  for (const call of expired) {
    await prisma.call.update({
      where: { id: call.id },
      data: { recordingUrl: null },
    });
    await prisma.auditLog.create({
      data: {
        action: 'RECORDING_PURGED',
        resourceType: 'Call',
        resourceId: call.id,
        details: {
          purgedUrl: call.recordingUrl,
          retentionDays: COMPLIANCE_CONFIG.recordingRetentionDays,
        },
      },
    });
  }

  return { scanned: expired.length, purged: expired.length };
}
