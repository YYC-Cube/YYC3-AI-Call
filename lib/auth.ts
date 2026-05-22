/**
 * @fileoverview 认证工具库
 * @description 提供 JWT 令牌生成/验证、密码加密/验证等认证相关功能
 * @module lib/auth
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * 加密密码
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 生成访问令牌（JWT）
   */
  static generateAccessToken(payload: JWTPayload): string {
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
    return jwt.sign(payload, secret, {
      expiresIn,
      algorithm: 'HS256',
    } as jwt.SignOptions);
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
    return jwt.sign(
      { userId, type: 'refresh' },
      secret,
      { expiresIn: '7d', algorithm: 'HS256' } as jwt.SignOptions
    );
  }

  /**
   * 生成令牌对（访问令牌 + 刷新令牌）
   */
  static generateTokenPair(user: {
    id: string;
    email: string;
    role: Role;
  }): TokenPair {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(user.id),
    };
  }

  /**
   * 验证访问令牌
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('❌ JWT 验证失败:', error);
      return null;
    }
  }

  /**
   * 验证刷新令牌
   */
  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new Error('无效的刷新令牌类型');
      }

      return { userId: decoded.userId };
    } catch (error) {
      console.error('❌ 刷新令牌验证失败:', error);
      return null;
    }
  }

  /**
   * 从请求头中提取 Bearer Token
   */
  static extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
