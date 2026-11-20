/**
 * @fileoverview 预呼合规校验管线（五道闸）
 * @description 外呼发起前必须通过五道闸，任一不通过即阻断：
 *              1. 号码状态闸——线路号码须 AVAILABLE 且带运营商授权凭证
 *              2. 禁拨名单闸——被叫号码不得命中 DncEntry（含未过期的有期禁拨）
 *              3. 禁拨时段闸——不得落在营销禁拨时段（默认 21:00-09:00）
 *              4. 频次闸——线路当日呼出次数 < dailyLimit（Redis 计数，降级时放行）
 *              5. AI 标识闸——生成通话级显式播报与隐式元数据上下文
 *
 *              校验快照写入 OutboundTask.complianceSnap（事件维可追溯）；
 *              阻断写 AuditLog（守门审计）。
 * @module lib/compliance/precall
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import prisma from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { CacheService } from '@/lib/redis';
import { COMPLIANCE_CONFIG } from './config';
import { AI_DISCLOSURE_TEXT, buildDisclosureMetadata, AIDisclosureMetadata } from './disclosure';

/** 五道闸名称 */
export type PrecallGate =
  | 'NUMBER_STATUS'
  | 'DNC'
  | 'TIME_WINDOW'
  | 'FREQUENCY'
  | 'AI_DISCLOSURE';

/** 预呼校验入参：lineNumber 为外呼线路号码，customerPhone 为被叫客户号码 */
export interface PrecallInput {
  lineNumber: string;
  customerPhone: string;
  customerId?: string;
  userId: string;
  tenantId?: string;
  /** 可注入时间（测试用），默认当前时间 */
  now?: Date;
}

/** 单道闸结果 */
export interface GateResult {
  gate: PrecallGate;
  ok: boolean;
  detail?: string;
}

/** 校验快照（写入 OutboundTask.complianceSnap） */
export interface ComplianceSnapshot {
  checkedAt: string;
  lineNumber: string;
  customerPhone: string;
  gates: GateResult[];
  /** AI 标识上下文（第五道闸产物，供通话链路直接使用） */
  disclosure: {
    explicitText: string;
    metadata: AIDisclosureMetadata;
  };
}

export type PrecallResult =
  | { ok: true; taskId: string; status: 'COMPLIANCE_PASSED'; snap: ComplianceSnapshot }
  | { ok: false; gate: PrecallGate; reason: string; taskId?: string };

/** 判定给定时刻是否落在禁拨时段（支持跨午夜窗口） */
export function isInQuietHours(now: Date, config = COMPLIANCE_CONFIG): boolean {
  // 用 Intl 提取目标时区的 HH:MM，避免依赖服务器本地时区
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [hh, mm] = fmt.format(now).split(':');
  const minutes = parseInt(hh, 10) * 60 + parseInt(mm, 10);
  const [sh, sm] = config.quietHours.start.split(':');
  const [eh, em] = config.quietHours.end.split(':');
  const start = parseInt(sh, 10) * 60 + parseInt(sm, 10);
  const end = parseInt(eh, 10) * 60 + parseInt(em, 10);
  return start > end
    ? minutes >= start || minutes < end // 跨午夜：[21:00, 次日 09:00)
    : minutes >= start && minutes < end;
}

/** 频次 Redis 键：按线路号码 + 自然日（站点时区） */
function frequencyKey(lineNumber: string, now: Date): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPLIANCE_CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return `yyc3:precall:freq:${lineNumber}:${fmt.format(now)}`;
}

/**
 * 预呼合规校验入口。
 *
 * 用法（外呼发起入口）：
 * ```ts
 * const result = await runPrecallCheck({ lineNumber, customerPhone, userId });
 * if (!result.ok) {
 *   // result.gate / result.reason 回执调用方；任务已置 BLOCKED（若已建）
 * }
 * ```
 */
export async function runPrecallCheck(input: PrecallInput): Promise<PrecallResult> {
  const now = input.now ?? new Date();
  const gates: GateResult[] = [];

  // ── 闸 1：号码状态（无有效线路则直接拒绝，无法建任务）──
  const line = await prisma.phoneNumber.findUnique({
    where: { number: input.lineNumber },
  });

  if (!line || line.status !== 'AVAILABLE' || !line.authorization) {
    const detail = !line
      ? '线路号码未登记'
      : line.status !== 'AVAILABLE'
        ? `线路状态为 ${line.status}`
        : '线路缺少运营商授权凭证';
    gates.push({ gate: 'NUMBER_STATUS', ok: false, detail });
    // 无法关联 phoneNumberId，仅返回阻断结果（审计由调用方路由补记）
    return { ok: false, gate: 'NUMBER_STATUS', reason: detail };
  }
  gates.push({ gate: 'NUMBER_STATUS', ok: true, detail: `线路 ${line.number} 可用` });

  // 线路有效：建立任务承接后续闸结果
  const task = await prisma.outboundTask.create({
    data: {
      phoneNumberId: line.id,
      customerId: input.customerId,
      status: 'DRAFT',
    },
  });

  const failFast = async (
    gate: PrecallGate,
    reason: string
  ): Promise<PrecallResult> => {
    gates.push({ gate, ok: false, detail: reason });
    const snap: ComplianceSnapshot = {
      checkedAt: now.toISOString(),
      lineNumber: input.lineNumber,
      customerPhone: input.customerPhone,
      gates,
      disclosure: {
        explicitText: AI_DISCLOSURE_TEXT,
        metadata: buildDisclosureMetadata(task.id),
      },
    };
    await prisma.outboundTask.update({
      where: { id: task.id },
      data: {
        status: 'BLOCKED',
        // ComplianceSnapshot 无索引签名，Prisma Json 输入需显式断言
        complianceSnap: snap as unknown as Prisma.InputJsonObject,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: 'PRECALL_BLOCKED',
        resourceType: 'OutboundTask',
        resourceId: task.id,
        details: { gate, reason, lineNumber: input.lineNumber, customerPhone: input.customerPhone },
      },
    });
    return { ok: false, gate, reason, taskId: task.id };
  };

  // ── 闸 2：禁拨名单（含未过期的有期禁拨）──
  const dnc = await prisma.dncEntry.findUnique({
    where: { phone: input.customerPhone },
  });
  const dncActive = dnc && (!dnc.expiresAt || dnc.expiresAt > now);
  if (dncActive) {
    return failFast('DNC', `被叫号码在禁拨名单（原因：${dnc!.reason}）`);
  }
  gates.push({ gate: 'DNC', ok: true });

  // ── 闸 3：禁拨时段 ──
  if (isInQuietHours(now)) {
    return failFast(
      'TIME_WINDOW',
      `处于营销禁拨时段 ${COMPLIANCE_CONFIG.quietHours.start}-${COMPLIANCE_CONFIG.quietHours.end}`
    );
  }
  gates.push({ gate: 'TIME_WINDOW', ok: true });

  // ── 闸 4：频次（Redis 计数；连接失败时 increment 返回 0 放行——
  //    与仓库既有 CacheService 降级口径一致，避免 Redis 故障阻断全部业务）──
  const key = frequencyKey(input.lineNumber, now);
  const count = await CacheService.increment(key, COMPLIANCE_CONFIG.frequencyKeyTtlSeconds);
  const dailyLimit = line.dailyLimit ?? COMPLIANCE_CONFIG.defaultDailyLimit;
  if (count > dailyLimit) {
    return failFast('FREQUENCY', `线路当日呼出 ${count} 次已超上限 ${dailyLimit}`);
  }
  gates.push({ gate: 'FREQUENCY', ok: true, detail: `当日第 ${count}/${dailyLimit} 次` });

  // ── 闸 5：AI 标识上下文 ──
  const metadata = buildDisclosureMetadata(task.id);
  gates.push({ gate: 'AI_DISCLOSURE', ok: true, detail: `内容编号 ${metadata.contentId}` });

  const snap: ComplianceSnapshot = {
    checkedAt: now.toISOString(),
    lineNumber: input.lineNumber,
    customerPhone: input.customerPhone,
    gates,
    disclosure: { explicitText: AI_DISCLOSURE_TEXT, metadata },
  };

  await prisma.outboundTask.update({
    where: { id: task.id },
    data: {
      status: 'COMPLIANCE_PASSED',
      complianceSnap: snap as unknown as Prisma.InputJsonObject,
    },
  });

  return { ok: true, taskId: task.id, status: 'COMPLIANCE_PASSED', snap };
}
