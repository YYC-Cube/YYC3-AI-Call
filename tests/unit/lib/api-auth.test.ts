/**
 * @fileoverview API 鉴权网关单元测试
 * @description 覆盖 requireAuth 的 Bearer/Cookie 双通道、无效令牌、缺失令牌
 * @module tests/unit/lib/api-auth
 */
import "@testing-library/jest-dom";
import { requireAuth } from "@/lib/api-auth";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

jest.mock("@/lib/auth", () => ({
  AuthService: {
    extractBearerToken: (header?: string) =>
      header && header.startsWith("Bearer ") ? header.slice(7) : null,
    verifyAccessToken: jest.fn((token: string) =>
      token === "valid-token"
        ? { userId: "u1", email: "u1@yyc3.ai", role: "ADMIN" }
        : null
    ),
  },
}));

function makeRequest(headers: Record<string, string> = {}): Request {
  // jsdom 环境无全局 Request，用最小 Request 形状替代（requireAuth 只读 headers.get）
  return {
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  } as unknown as Request;
}

describe("requireAuth 鉴权网关", () => {
  it("合法 Bearer 令牌应放行并携带身份", () => {
    const gate = requireAuth(
      makeRequest({ authorization: "Bearer valid-token" }),
    );

    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.userId).toBe("u1");
      expect(gate.role).toBe("ADMIN");
    }
  });

  it("无令牌应返回 401 响应", () => {
    const gate = requireAuth(makeRequest());

    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.response.status).toBe(401);
    }
  });

  it("无效令牌应返回 401 TOKEN_INVALID", async () => {
    const gate = requireAuth(makeRequest({ authorization: "Bearer bad-token" }));

    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.response.status).toBe(401);
      const body = await gate.response.json();
      expect(body.code).toBe("TOKEN_INVALID");
    }
  });

  it("access_token Cookie 应作为回退通道放行", () => {
    const gate = requireAuth(makeRequest({ cookie: "access_token=valid-token" }));

    expect(gate.ok).toBe(true);
  });
});
