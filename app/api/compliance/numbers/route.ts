/**
 * @fileoverview 外呼号码台账 API
 * @description 号码状态机管理：登记、列表、状态流转。SUSPENDED→AVAILABLE
 *              必须携带运营商授权凭证（authorization 非空）。
 *              鉴权：requireAuth；写操作需 MANAGER/ADMIN（与 customers 路由口径一致）。
 * @module app/api/compliance/numbers
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const PHONE_RE = /^[0-9]{3,20}$/;
const CARRIER_VALUES = ['电信', '移动', '联通'];

/** 校验写操作角色（MANAGER+） */
function requireManagerRole(role: string): NextResponse | null {
  if (!['MANAGER', 'ADMIN'].includes(role)) {
    return NextResponse.json(
      { success: false, error: '权限不足，需要 MANAGER 或更高角色', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  return null;
}

/** GET /api/compliance/numbers?status=&page=&pageSize= */
export async function GET(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    const where: Record<string, unknown> = {};
    if (status && ['AVAILABLE', 'SUSPENDED', 'BLOCKED'].includes(status)) {
      where.status = status;
    }

    const [numbers, total] = await Promise.all([
      prisma.phoneNumber.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.phoneNumber.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: numbers,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('❌ 查询号码台账失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/** POST /api/compliance/numbers —— 登记号码（默认 SUSPENDED 待审） */
export async function POST(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;
  const forbidden = requireManagerRole(gate.role);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const { number, carrier, authorization, dailyLimit } = body || {};

    if (typeof number !== 'string' || !PHONE_RE.test(number)) {
      return NextResponse.json(
        { success: false, error: 'number 必须为 3-20 位数字', code: 'INVALID_NUMBER' },
        { status: 400 }
      );
    }
    if (carrier !== undefined && carrier !== null && !CARRIER_VALUES.includes(carrier)) {
      return NextResponse.json(
        { success: false, error: 'carrier 仅支持 电信/移动/联通', code: 'INVALID_CARRIER' },
        { status: 400 }
      );
    }

    const created = await prisma.phoneNumber.create({
      data: {
        number,
        carrier: carrier ?? null,
        authorization: authorization ?? null,
        dailyLimit: typeof dailyLimit === 'number' && dailyLimit > 0 ? Math.floor(dailyLimit) : 3,
        // 状态恒为 SUSPENDED（默认）：转 AVAILABLE 走 PATCH 且必须带凭证
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { success: false, error: '号码已登记', code: 'DUPLICATE_NUMBER' },
        { status: 409 }
      );
    }
    console.error('❌ 登记号码失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/** PATCH /api/compliance/numbers —— 状态流转与信息更新 */
export async function PATCH(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;
  const forbidden = requireManagerRole(gate.role);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const { id, status, authorization, dailyLimit } = body || {};

    if (typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'id 必填', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await prisma.phoneNumber.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '号码不存在', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const nextAuth = authorization !== undefined ? authorization : existing.authorization;

    // SUSPENDED → AVAILABLE 必须携带运营商授权凭证（合规硬约束）
    if (status === 'AVAILABLE' && !nextAuth) {
      return NextResponse.json(
        {
          success: false,
          error: '转 AVAILABLE 必须提供运营商授权凭证（authorization）',
          code: 'AUTHORIZATION_REQUIRED',
        },
        { status: 422 }
      );
    }
    if (status !== undefined && !['AVAILABLE', 'SUSPENDED', 'BLOCKED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'status 取值非法', code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const updated = await prisma.phoneNumber.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(authorization !== undefined ? { authorization: authorization ?? null } : {}),
        ...(typeof dailyLimit === 'number' && dailyLimit > 0
          ? { dailyLimit: Math.floor(dailyLimit) }
          : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ 更新号码失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
