/**
 * @fileoverview 用户认证 API
 * @description 处理用户注册、登录、令牌刷新等认证相关操作
 * @module app/api/auth
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { CacheService } from '@/lib/redis';
import { buildAuthCookies, buildClearedAuthCookies, readCookie, REFRESH_COOKIE } from '@/lib/auth-cookies';

// Zod 验证 schema
const RegisterSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码长度至少8个字符').max(100),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码').optional(),
});

const LoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'register':
        return handleRegister(body);
      case 'login':
        return handleLogin(body);
      case 'refresh':
        return handleRefreshToken(body, request);
      case 'logout':
        return handleLogout(request);
      default:
        return NextResponse.json(
          { error: '不支持的操作', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 认证请求处理失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

async function handleRegister(body: unknown) {
  // 验证输入
  const validated = RegisterSchema.parse(body);

  // 检查用户是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: '该邮箱已被注册', code: 'EMAIL_EXISTS' },
      { status: 409 }
    );
  }

  // 加密密码
  const passwordHash = await AuthService.hashPassword(validated.password);

  // 创建用户
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      phone: validated.phone,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // 生成令牌对
  const tokens = AuthService.generateTokenPair(user);

  // 缓存刷新令牌（用于后续验证）
  await CacheService.set(
    `refresh:${user.id}`,
    tokens.refreshToken,
    7 * 24 * 60 * 60 // 7天
  );

  // HttpOnly Cookie 下发（R3：令牌不再经 body 交前端明文存储）
  const response = NextResponse.json(
    {
      message: '注册成功',
      data: {
        user,
        tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      },
    },
    { status: 201 }
  );
  buildAuthCookies(tokens.accessToken, tokens.refreshToken).forEach((c) =>
    response.headers.append('Set-Cookie', c)
  );
  return response;
}

async function handleLogin(body: unknown) {
  // 验证输入
  const validated = LoginSchema.parse(body);

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: '邮箱或密码错误', code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    );
  }

  // 验证密码
  const isValidPassword = await AuthService.verifyPassword(
    validated.password,
    user.passwordHash
  );

  if (!isValidPassword) {
    return NextResponse.json(
      { error: '邮箱或密码错误', code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    );
  }

  // 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 生成令牌对
  const tokens = AuthService.generateTokenPair(user);

  // 缓存刷新令牌
  await CacheService.set(
    `refresh:${user.id}`,
    tokens.refreshToken,
    7 * 24 * 60 * 60 // 7天
  );

  // HttpOnly Cookie 下发（R3）
  const response = NextResponse.json({
    message: '登录成功',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    },
  });
  buildAuthCookies(tokens.accessToken, tokens.refreshToken).forEach((c) =>
    response.headers.append('Set-Cookie', c)
  );
  return response;
}

async function handleRefreshToken(body: unknown, request: NextRequest) {
  // 刷新令牌通道：HttpOnly Cookie 优先，body 兼容（R3 轮换入口）
  const cookieToken = readCookie(request.headers.get('cookie'), REFRESH_COOKIE);
  const bodyToken = (body as { refreshToken?: string })?.refreshToken;
  const presented = cookieToken ?? bodyToken;

  if (!presented) {
    return NextResponse.json(
      { error: '请提供刷新令牌', code: 'TOKEN_MISSING' },
      { status: 400 }
    );
  }

  // 验证刷新令牌
  const decoded = AuthService.verifyRefreshToken(presented);

  if (!decoded) {
    return NextResponse.json(
      { error: '无效或过期的刷新令牌', code: 'TOKEN_INVALID' },
      { status: 401 }
    );
  }

  // 从缓存中获取存储的刷新令牌进行比对
  const storedToken = await CacheService.get<string>(`refresh:${decoded.userId}`);

  if (!storedToken || storedToken !== presented) {
    return NextResponse.json(
      { error: '刷新令牌已失效，请重新登录', code: 'TOKEN_REVOKED' },
      { status: 401 }
    );
  }

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: '用户不存在或已被禁用', code: 'USER_NOT_FOUND' },
      { status: 401 }
    );
  }

  // 生成新的令牌对
  const newTokens = AuthService.generateTokenPair(user);

  // 更新缓存的刷新令牌
  await CacheService.set(
    `refresh:${user.id}`,
    newTokens.refreshToken,
    7 * 24 * 60 * 60 // 7天
  );

  // 轮换：新令牌对经 HttpOnly Cookie 下发（旧 refresh 即刻作废）
  const response = NextResponse.json({
    message: '令牌刷新成功',
    data: {
      tokens: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      },
    },
  });
  buildAuthCookies(newTokens.accessToken, newTokens.refreshToken).forEach((c) =>
    response.headers.append('Set-Cookie', c)
  );
  return response;
}

async function handleLogout(request: NextRequest) {
  // 撤销缓存的刷新令牌（存在即作废）
  const cookieToken = readCookie(request.headers.get('cookie'), REFRESH_COOKIE);
  if (cookieToken) {
    const decoded = AuthService.verifyRefreshToken(cookieToken);
    if (decoded) {
      await CacheService.del(`refresh:${decoded.userId}`);
    }
  }

  const response = NextResponse.json({ message: '已退出登录', data: {} });
  buildClearedAuthCookies().forEach((c) => response.headers.append('Set-Cookie', c));
  return response;
}
