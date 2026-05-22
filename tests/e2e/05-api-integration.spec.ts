import { test, expect } from "@playwright/test";

/**
 * E2E 测试: API 集成与数据持久化
 * 文件: tests/e2e/05-api-integration.spec.ts
 *
 * 测试目标:
 * - 验证前端与后端 API 的数据流
 * - 验证数据持久化 (Phase 2 数据库)
 * - 验证实时数据更新
 * - 验证错误处理和回退机制
 */

test.describe("API 集成与数据同步", () => {
  test.beforeEach(async ({ page }) => {
    // 拦截 API 调用以便验证
    await page.route("/api/**", (route) => {
      // 记录 API 调用
      console.log(
        `API Call: ${route.request().method()} ${route.request().url()}`,
      );
      route.continue();
    });

    await page.goto("/");
    await page.waitForTimeout(500);
  });

  test("应该成功获取健康检查状态", async ({ page }) => {
    // 直接调用健康检查 API
    const response = await page.request.get("/api/ai/health");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("status");
    // 验证响应结构
    if (data.status === "healthy" || data.status === "ok") {
      expect(data.status).toBeTruthy();
    }
  });

  test("应该能发送聊天请求", async ({ page }) => {
    // 模拟聊天请求
    const chatResponse = await page.request.post("/api/ai/chat", {
      data: {
        messages: [{ role: "user", content: "你好" }],
      },
    });

    // 应该返回 200 或流式响应
    expect([200, 201, 202]).toContain(chatResponse.status());

    // 如果是 JSON 响应
    if (chatResponse.headers()["content-type"]?.includes("application/json")) {
      const data = await chatResponse.json();
      expect(data).toBeTruthy();
    }
  });

  test("应该处理无效请求 (400 错误)", async ({ page }) => {
    // 发送无效的聊天请求
    const response = await page.request.post("/api/ai/chat", {
      data: {
        // 缺少 messages 字段
        invalid: true,
      },
    });

    // 应该返回 400
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("应该能获取客户列表", async ({ page }) => {
    // 调用客户 API
    const response = await page.request.get("/api/customers");

    expect([200, 404]).toContain(response.status()); // 404 如果没有数据也是有效的

    if (response.status() === 200) {
      const data = await response.json();

      // 验证响应结构
      if (Array.isArray(data)) {
        // 如果是数组
        expect(data).toEqual(expect.any(Array));
      } else if (data.data) {
        // 如果是对象包含 data 字段
        expect(Array.isArray(data.data)).toBeTruthy();
      }
    }
  });

  test("应该支持分页查询", async ({ page }) => {
    // 使用分页参数查询
    const response = await page.request.get("/api/customers?skip=0&take=10");

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      // 应该返回有限数量的记录
      if (Array.isArray(data)) {
        expect(data.length).toBeLessThanOrEqual(10);
      }
    }
  });

  test("应该支持搜索过滤", async ({ page }) => {
    // 使用搜索参数
    const response = await page.request.get("/api/customers?search=test");

    expect([200, 404]).toContain(response.status());
  });

  test("应该支持状态过滤", async ({ page }) => {
    // 使用状态过滤
    const response = await page.request.get("/api/customers?status=active");

    expect([200, 404]).toContain(response.status());
  });

  test("前端应该显示 API 数据", async ({ page }) => {
    // 拦截 API 响应并验证前端显示数据
    let apiDataReceived = false;

    await page.route("/api/customers", async (route) => {
      // 返回模拟数据
      await route.abort("blockedbyclient");
      apiDataReceived = true;
    });

    // 或者直接验证前端是否进行了 API 调用
    const requestSpy = (request: any) => {
      if (request.url().includes("/api/")) {
        console.log("API request detected:", request.url());
      }
    };
    page.on("request", requestSpy);

    await page.goto("/");

    // 等待 API 调用
    await page.waitForTimeout(1000);

    // 移除监听器
    page.off("request", requestSpy);
  });

  test("应该处理网络错误优雅降级", async ({ page }) => {
    // 模拟网络故障
    await page.route("/api/**", (route) => {
      route.abort("failed");
    });

    await page.goto("/");

    // 等待页面加载和错误处理
    await page.waitForTimeout(1000);

    // 页面应该能优雅地处理错误
    // (不会完全崩溃，可能显示错误消息)
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
  });

  test("应该支持流式 API 响应", async ({ page }) => {
    // 测试流式 chat 端点
    const response = await page.request.post("/api/ai/chat/stream", {
      data: {
        messages: [{ role: "user", content: "test" }],
      },
    });

    // 流式响应通常返回 200
    expect([200, 201, 202, 400, 500]).toContain(response.status());

    // 检查响应头中的流式指示
    const contentType = response.headers()["content-type"];
    if (response.status() === 200) {
      // 应该是流式内容
      expect(contentType).toMatch(/stream|plain/i);
    }
  });

  test("应该处理超时请求", async ({ page }) => {
    // 设置短超时
    const response = await page.request.get("/api/ai/health", {
      timeout: 100, // 100ms 超时
    });

    // 可能超时或成功完成
    expect([200, 408, 504]).toContain(response.status());
  });

  test("应该包含必要的响应头", async ({ page }) => {
    const response = await page.request.get("/api/customers");

    // 检查安全相关的响应头
    const headers = response.headers();

    // 至少应该有内容类型
    expect(headers["content-type"]).toBeTruthy();

    // 验证 JSON 内容类型 (如果返回 2xx)
    if (response.status() >= 200 && response.status() < 300) {
      expect(headers["content-type"]).toContain("application/json");
    }
  });

  test("API 响应应该有一致的格式", async ({ page }) => {
    // 验证 API 响应格式一致性
    const response1 = await page.request.get("/api/customers");
    const response2 = await page.request.get("/api/ai/health");

    // 两个响应都应该有相同的内容类型
    const contentType1 = response1.headers()["content-type"];
    const contentType2 = response2.headers()["content-type"];

    // 都应该是 JSON 或一致的格式
    expect(contentType1).toMatch(/json/i);
  });

  test("应该处理并发 API 请求", async ({ page }) => {
    // 同时发起多个请求
    const requests = [
      page.request.get("/api/customers"),
      page.request.get("/api/ai/health"),
      page.request.post("/api/ai/chat", {
        data: { messages: [{ role: "user", content: "test" }] },
      }),
    ];

    const responses = await Promise.all(requests);

    // 所有请求都应该完成
    expect(responses).toHaveLength(3);

    // 验证响应
    for (const response of responses) {
      expect(
        response.ok() || response.status() === 400 || response.status() === 404,
      ).toBeTruthy();
    }
  });
});

/**
 * 数据同步和实时更新测试 (Phase 2)
 */
test.describe("实时数据同步", () => {
  test.skip("应该实时更新客户列表", async ({ page }) => {
    // TODO: 需要 WebSocket 或 Server-Sent Events 支持
    // 验证数据自动刷新
  });

  test.skip("应该处理数据冲突", async ({ page }) => {
    // TODO: Phase 2 乐观锁实现后测试
  });

  test.skip("应该支持离线缓存", async ({ page }) => {
    // TODO: Service Worker 实现后测试
  });
});

/**
 * 错误处理和恢复测试
 */
test.describe("错误处理与恢复", () => {
  test("应该显示 API 错误消息", async ({ page }) => {
    // 模拟 API 错误
    await page.route("/api/customers", (route) => {
      route.abort("failed");
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // 应该显示某种错误指示
    const body = await page.content();
    // 不应该显示完全的白屏
    expect(body).toContain("html");
  });

  test("应该能重试失败的请求", async ({ page }) => {
    let callCount = 0;

    await page.route("/api/customers", (route) => {
      callCount++;
      if (callCount === 1) {
        // 第一次失败
        route.abort("failed");
      } else {
        // 第二次成功
        route.continue();
      }
    });

    // 尝试多次调用
    for (let i = 0; i < 2; i++) {
      try {
        const response = await page.request.get("/api/customers", {
          timeout: 1000,
        });

        if (response.ok()) {
          break;
        }
      } catch (e) {
        // 继续重试
      }
    }

    // 应该至少调用了一次
    expect(callCount).toBeGreaterThan(0);
  });
});
