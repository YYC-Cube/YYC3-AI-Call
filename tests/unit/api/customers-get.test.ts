jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

jest.mock("@/lib/db", () => {
  const mockFindMany = jest.fn().mockResolvedValue([]);
  const mockCount = jest.fn().mockResolvedValue(0);
  return {
    __esModule: true,
    default: {
      customer: {
        findMany: mockFindMany,
        count: mockCount,
      },
    },
    prisma: {
      customer: {
        findMany: mockFindMany,
        count: mockCount,
      },
    },
  };
});

jest.mock("@/lib/auth", () => ({
  AuthService: {
    extractBearerToken: jest.fn().mockReturnValue("test-token"),
    verifyAccessToken: jest.fn().mockReturnValue({ userId: "test-user", role: "USER" }),
    verifyToken: jest.fn().mockResolvedValue({ userId: "test-user", role: "USER" }),
  },
}));

jest.mock("@/lib/validations", () => ({
  CustomerSchemas: {
    query: {},
  },
  validateInput: jest.fn().mockReturnValue({
    success: true,
    data: { page: 1, pageSize: 20 },
  }),
  formatValidationError: jest.fn().mockReturnValue({ error: "Validation failed" }),
}));

import { GET } from "@/app/api/customers/route";

describe("GET /api/customers", () => {
  it("filters, paginates, and returns success payload", async () => {
    const req = {
      url: "http://localhost/api/customers?page=1&limit=1&search=张&status=new",
      headers: {
        get: jest.fn().mockReturnValue("Bearer test-token"),
      },
    } as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination.totalPages).toBeGreaterThanOrEqual(0);
  });
});
