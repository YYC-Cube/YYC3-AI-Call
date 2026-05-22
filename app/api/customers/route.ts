/**
 * @fileoverview 客户管理 API
 * @description 客户 CRUD 操作，包含完整的输入验证和权限控制
 * @module app/api/customers
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { CustomerSchemas, validateInput, formatValidationError } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    // 提取认证令牌
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractBearerToken(authHeader ?? undefined);

    if (!token) {
      return NextResponse.json(
        { error: '未提供认证令牌', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 验证令牌
    const payload = AuthService.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '无效或过期的令牌', code: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // 验证查询参数
    const validation = validateInput(CustomerSchemas.query, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationError(validation.error),
        { status: 400 }
      );
    }

    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      priority,
      assignedToId,
      startDate,
      endDate,
    } = validation.data;

    // 构建查询条件
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { company: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (startDate || endDate) {
      (where as any).createdAt = {};
      if (startDate) (where as any).createdAt.gte = startDate;
      if (endDate) (where as any).createdAt.lte = endDate;
    }

    // 权限控制：普通用户只能查看自己分配的客户
    if (payload.role === 'USER') {
      where.assignedToId = payload.userId;
    }

    // 查询数据
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          assignments: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: { calls: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ 获取客户列表失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 提取认证令牌
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractBearerToken(authHeader ?? undefined);

    if (!token) {
      return NextResponse.json(
        { error: '未提供认证令牌', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 验证令牌
    const payload = AuthService.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '无效或过期的令牌', code: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }

    // 检查权限：AGENT 及以上角色才能创建客户
    if (!['AGENT', 'MANAGER', 'ADMIN'].includes(payload.role)) {
      return NextResponse.json(
        { error: '权限不足，需要 AGENT 或更高角色', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();

    // 验证输入
    const validation = validateInput(CustomerSchemas.create, body);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationError(validation.error),
        { status: 400 }
      );
    }

    // 创建客户
    const customer = await prisma.customer.create({
      data: {
        ...validation.data,
        assignedToId: payload.role === 'USER' ? payload.userId : undefined,
      },
      include: {
        assignments: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: '客户创建成功',
        data: customer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ 创建客户失败:', error);

    // 处理唯一约束冲突
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '该手机号已被使用', code: 'DUPLICATE_PHONE' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
