/**
 * @fileoverview 预呼合规校验 API
 * @description 外呼发起前的统一校验入口：
 *              POST —— 执行五道闸校验（lib/compliance/precall），通过返回
 *              taskId + 快照，阻断返回 gate/reason 且任务置 BLOCKED；
 *              GET?taskId= —— 查询校验快照。
 *              鉴权：requireAuth（任何已认证角色可发起校验）。
 * @module app/api/compliance/precall-check
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

/** POST /api/compliance/precall-check */
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

    const result = await runPrecallCheck({
      lineNumber,
      customerPhone,
      customerId: typeof customerId === 'string' ? customerId : undefined,
      userId: gate.userId,
    });

    if (!result.ok) {
      // 422：语义化拒绝（可重试但当前不满足外呼条件）
      return NextResponse.json(
        {
          success: false,
          gate: result.gate,
          reason: result.reason,
          taskId: result.taskId ?? null,
          code: 'PRECALL_BLOCKED',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId: result.taskId,
        status: result.status,
        snap: result.snap,
      },
    });
  } catch (error) {
    console.error('❌ 预呼校验失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/** GET /api/compliance/precall-check?taskId= */
export async function GET(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId 必填', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const task = await prisma.outboundTask.findUnique({
      where: { id: taskId },
      include: { phoneNumber: { select: { number: true, status: true } } },
    });
    if (!task) {
      return NextResponse.json(
        { success: false, error: '任务不存在', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('❌ 查询校验快照失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
