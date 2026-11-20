/**
 * @fileoverview 外呼发起入口（合规前置）
 * @description 所有外呼（现役通道与后续 SIP/语音管线）必须先过预呼五道闸：
 *              通过 → 任务置 DIALING 并返回 AI 标识上下文（播报头 + 元数据，
 *              语音管线直接使用）；阻断 → 422 回执 gate/reason，任务已置
 *              BLOCKED（lib/compliance/precall 内完成）并留审计。
 * @module app/api/compliance/outbound-calls
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { runPrecallCheck } from '@/lib/compliance/precall';

const PHONE_RE = /^[0-9]{3,20}$/;

/** POST /api/compliance/outbound-calls —— 发起外呼（合规前置） */
export async function POST(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const { lineNumber, customerPhone, customerId } = body || {};

    if (typeof lineNumber !== 'string' || !PHONE_RE.test(lineNumber)) {
      return NextResponse.json(
        { success: false, error: 'lineNumber 必须为 3-20 位数字', code: 'INVALID_LINE' },
        { status: 400 }
      );
    }
    if (typeof customerPhone !== 'string' || !PHONE_RE.test(customerPhone)) {
      return NextResponse.json(
        { success: false, error: 'customerPhone 必须为 3-20 位数字', code: 'INVALID_PHONE' },
        { status: 400 }
      );
    }

    // ── 合规前置：五道闸（阻断时任务已置 BLOCKED + 审计）──
    const check = await runPrecallCheck({
      lineNumber,
      customerPhone,
      customerId: typeof customerId === 'string' ? customerId : undefined,
      userId: gate.userId,
    });

    if (!check.ok) {
      return NextResponse.json(
        {
          success: false,
          gate: check.gate,
          reason: check.reason,
          taskId: check.taskId ?? null,
          code: 'CALL_BLOCKED',
        },
        { status: 422 }
      );
    }

    // ── 通过：任务进入拨号态，向语音管线下发标识上下文 ──
    await prisma.outboundTask.update({
      where: { id: check.taskId },
      data: { status: 'DIALING' },
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId: check.taskId,
        status: 'DIALING',
        disclosure: check.snap.disclosure,
      },
    });
  } catch (error) {
    console.error('❌ 外呼发起失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
