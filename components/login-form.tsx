'use client';

/**
 * @fileoverview 登录表单（R4）
 * @description 提交 /api/auth {action:'login'}；服务端经 HttpOnly Cookie 下发
 *              令牌（R3），前端不落任何令牌存储。成功后回调 onLogin(user)。
 * @module components/login-form
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface LoginUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function LoginForm({
  onLogin,
}: {
  onLogin?: (user: LoginUser) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? '登录失败，请稍后重试');
        return;
      }
      onLogin?.(body.data.user as LoginUser);
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="login-title" className="space-y-3">
      <h2 id="login-title" className="text-xl font-semibold">
        登录 YYC³ 智能外呼平台
      </h2>
      <div>
        <label htmlFor="login-email" className="block text-sm">
          邮箱
        </label>
        <Input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm">
          密码
        </label>
        <Input
          id="login-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? '登录中…' : '登录'}
      </Button>
    </form>
  );
}
