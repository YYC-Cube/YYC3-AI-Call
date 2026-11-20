/**
 * R3 令牌存储升级单测：HttpOnly Cookie 签发 / Refresh 轮换 / logout 清除
 */
import '@testing-library/jest-dom';

jest.mock('next/server', () => ({
  NextResponse: Object.assign(
    jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      headers: { append: jest.fn(), get: jest.fn() },
      body,
    })),
    {
      json: jest.fn((data: unknown, init?: { status?: number }) => {
        const append = jest.fn();
        return {
          status: init?.status ?? 200,
          headers: { append, get: jest.fn() },
          json: async () => data,
          __append: append,
        };
      }),
    }
  ),
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}), create: jest.fn() },
  },
}));

import prisma from '@/lib/db';
const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
};

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  CacheService: {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(undefined),
  },
}));

import { CacheService } from '@/lib/redis';
const mockCache = CacheService as unknown as {
  set: jest.Mock;
  get: jest.Mock;
  del: jest.Mock;
};

jest.mock('@/lib/auth', () => ({
  AuthService: {
    hashPassword: jest.fn().mockResolvedValue('hashed'),
    verifyPassword: jest.fn(),
    generateTokenPair: jest.fn(() => ({
      accessToken: 'acc-new',
      refreshToken: 'ref-new',
    })),
    verifyRefreshToken: jest.fn(),
  },
}));

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/auth/route';
import { AuthService } from '@/lib/auth';

const NextResponseMock = NextResponse as unknown as {
  json: jest.Mock;
  mock: { results: Array<{ value: { headers: { append: jest.Mock } } }> };
};

const USER = {
  id: 'u1',
  email: 'agent@yyc3.com',
  name: 't',
  role: 'AGENT',
  isActive: true,
  passwordHash: 'hashed',
  avatar: null,
};

function makeReq(body: unknown, cookie?: string): never {
  return {
    url: 'http://localhost/api/auth',
    headers: { get: (k: string) => (k === 'cookie' ? (cookie ?? null) : null) },
    json: async () => body,
  } as never;
}

const setCookies = (res: unknown) =>
  ((res as { __append?: jest.Mock }).__append as jest.Mock).mock.calls.map((c) =>
    String(c[1])
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockCache.get.mockResolvedValue(null);
  mockPrisma.user.findUnique.mockResolvedValue({ ...USER });
  mockPrisma.user.update.mockResolvedValue({});
});

describe('login → HttpOnly Cookie 签发', () => {
  it('密码校验通过后 Set-Cookie 含 HttpOnly/SameSite/双令牌', async () => {
    (AuthService.verifyPassword as jest.Mock).mockResolvedValue(true);
    const res = await POST(makeReq({ action: 'login', email: USER.email, password: 'password123' }));
    const cookies = setCookies(res);
    expect(cookies).toHaveLength(2);
    expect(cookies.some((c) => c.startsWith('access_token=') && c.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token=') && c.includes('SameSite=Lax'))).toBe(true);
    expect(cookies.every((c) => c.includes('Max-Age='))).toBe(true);
    const body = await res.json();
    expect(body.data.tokens.accessToken).toBe('acc-new');
  });

  it('密码错误 → 401 且无 Set-Cookie', async () => {
    (AuthService.verifyPassword as jest.Mock).mockResolvedValue(false);
    const res = await POST(makeReq({ action: 'login', email: USER.email, password: 'bad' }));
    expect(res.status).toBe(401);
    expect(setCookies(res)).toHaveLength(0);
  });
});

describe('refresh → Cookie 通道 + 轮换', () => {
  it('Cookie 携带 refresh 即可刷新（无需 body），轮换下发新 Cookie', async () => {
    (AuthService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'u1' });
    mockCache.get.mockResolvedValue('ref-old');
    const res = await POST(
      makeReq({ action: 'refresh' }, 'refresh_token=ref-old; other=1')
    );
    const body = await res.json();
    expect(body.data.tokens.refreshToken).toBe('ref-new');
    const cookies = setCookies(res);
    expect(cookies.some((c) => c.includes('ref-new'))).toBe(true);
    // 轮换：缓存更新为新令牌
    expect(mockCache.set).toHaveBeenCalledWith('refresh:u1', 'ref-new', 7 * 24 * 60 * 60);
  });

  it('Cookie 与缓存不一致 → 401 TOKEN_REVOKED', async () => {
    (AuthService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'u1' });
    mockCache.get.mockResolvedValue('ref-rotated');
    const res = await POST(
      makeReq({ action: 'refresh' }, 'refresh_token=ref-stale')
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('TOKEN_REVOKED');
  });

  it('无 Cookie 且无 body → 400 TOKEN_MISSING', async () => {
    const res = await POST(makeReq({ action: 'refresh' }));
    expect(res.status).toBe(400);
  });
});

describe('logout → 撤销 + 清除', () => {
  it('撤销缓存刷新令牌并下发 Max-Age=0 清除 Cookie', async () => {
    (AuthService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'u1' });
    const res = await POST(
      makeReq({ action: 'logout' }, 'refresh_token=ref-old')
    );
    expect(mockCache.del).toHaveBeenCalledWith('refresh:u1');
    const cookies = setCookies(res);
    expect(cookies).toHaveLength(2);
    expect(cookies.every((c) => c.includes('Max-Age=0'))).toBe(true);
  });
});
