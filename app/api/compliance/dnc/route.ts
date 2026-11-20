/**
 * @fileoverview 禁拨名单 API
 * @description DNC（Do-Not-Call）名单维护：投诉/退订/监管下发三类来源，
 *              支持有期禁拨（expiresAt 为空表示永久）。POST 支持批量。
 *              鉴权：requireAuth；写操作需 MANAGER/ADMIN。
 * @module app/api/compliance/dnc
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextRequest, NextResponse } from 'next/server';
import { DncReason } from '@prisma/client';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const PHONE_RE = /^[0-9]{3,20}$/;
const REASON_VALUES = ['COMPLAINT', 'OPT_OUT', 'REGULATOR'];

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

/** GET /api/compliance/dnc?page=&pageSize=&phone= */
export async function GET(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const phone = searchParams.get('phone');

    const where: Record<string, unknown> = {};
    if (phone) where.phone = { contains: phone };

    const [entries, total] = await Promise.all([
      prisma.dncEntry.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dncEntry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('❌ 查询禁拨名单失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/** POST /api/compliance/dnc —— 新增（body 或 { items: [...] } 批量） */
export async function POST(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;
  const forbidden = requireManagerRole(gate.role);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const items: Array<Record<string, unknown>> = Array.isArray(body?.items)
      ? body.items
      : [body];

    const parsed: Array<{
      phone: string;
      reason: DncReason;
      source?: string;
      expiresAt?: Date | null;
    }> = [];

    for (const item of items) {
      const { phone, reason, source, expiresAt } = item || {};
      if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
        return NextResponse.json(
          { success: false, error: `phone 非法：${String(phone)}`, code: 'INVALID_PHONE' },
          { status: 400 }
        );
      }
      if (typeof reason !== 'string' || !REASON_VALUES.includes(reason)) {
        return NextResponse.json(
          { success: false, error: `reason 仅支持 ${REASON_VALUES.join('/')}`, code: 'INVALID_REASON' },
          { status: 400 }
        );
      }
      if (
        expiresAt !== undefined &&
        expiresAt !== null &&
        typeof expiresAt !== 'string' &&
        !(expiresAt instanceof Date)
      ) {
        return NextResponse.json(
          { success: false, error: 'expiresAt 须为 ISO 日期字符串', code: 'INVALID_EXPIRES_AT' },
          { status: 400 }
        );
      }
      parsed.push({
        phone,
        reason: reason as DncReason,
        ...(typeof source === 'string' ? { source } : { source: gate.email }),
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      });
    }

    const result = await prisma.dncEntry.createMany({
      data: parsed,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, data: { count: result.count } }, { status: 201 });
  } catch (error) {
    console.error('❌ 新增禁拨名单失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/** DELETE /api/compliance/dnc?id= —— 移除（解除禁拨须 MANAGER+ 并写审计） */
export async function DELETE(request: NextRequest) {
  const gate = requireAuth(request);
  if (!gate.ok) return gate.response;
  const forbidden = requireManagerRole(gate.role);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id 必填', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const removed = await prisma.dncEntry.delete({ where: { id } });

    // 解除禁拨属敏感操作，写审计日志
    await prisma.auditLog.create({
      data: {
        userId: gate.userId,
        action: 'DNC_REMOVED',
        resourceType: 'DncEntry',
        resourceId: id,
        details: { phone: removed.phone, reason: removed.reason },
      },
    });

    return NextResponse.json({ success: true, data: removed });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2025'
    ) {
      return NextResponse.json(
        { success: false, error: '记录不存在', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('❌ 移除禁拨名单失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
