/**
 * file stdio-transport.test.ts
 * description @yyc3/i18n-core stdio-transport.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[mcp],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core stdio-transport.ts 单元测试
 */
import { describe, expect, it, beforeEach } from "vitest";
import { StdioTransport } from "../../lib/mcp/stdio-transport.js";
import type { MCPMessage } from "../../lib/mcp/types.js";
import { Readable, Writable } from "node:stream";

describe("StdioTransport", () => {
  let transport: StdioTransport;
  let mockStdin: Readable;
  let mockStdout: Writable;
  let writtenData: string[];

  beforeEach(() => {
    transport = new StdioTransport();
    writtenData = [];

    mockStdin = new Readable({ read() {} });
    mockStdout = new Writable({
      write(chunk: Buffer, _encoding: string, callback: () => void) {
        writtenData.push(chunk.toString());
        callback();
      },
    });
  });

  it("should initialize with default state", () => {
    expect(transport.connected).toBe(false);
  });

  it("should connect with custom streams", async () => {
    const customTransport = new StdioTransport({
      stdin: mockStdin,
      stdout: mockStdout,
    });
    await customTransport.connect();
    expect(customTransport.connected).toBe(true);
    await customTransport.close();
  });

  it("should send messages with Content-Length header", async () => {
    const customTransport = new StdioTransport({
      stdin: mockStdin,
      stdout: mockStdout,
    });
    await customTransport.connect();

    const message: MCPMessage = {
      jsonrpc: "2.0",
      id: 1,
      result: { status: "ok" },
    };
    await customTransport.send(message);

    expect(writtenData.length).toBe(1);
    expect(writtenData[0]).toContain("Content-Length:");
    expect(writtenData[0]).toContain('"jsonrpc":"2.0"');
    expect(writtenData[0]).toContain('"status":"ok"');

    await customTransport.close();
  });

  it("should receive and parse messages", async () => {
    const received: MCPMessage[] = [];
    const customTransport = new StdioTransport({
      stdin: mockStdin,
      stdout: mockStdout,
    });
    await customTransport.connect();
    customTransport.onMessage((msg) => received.push(msg));

    const message = { jsonrpc: "2.0", id: 1, method: "test" };
    const json = JSON.stringify(message);
    const framed = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
    mockStdin.push(framed);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(received.length).toBe(1);
    expect(received[0].method).toBe("test");

    await customTransport.close();
  });

  it("should handle multiple messages in buffer", async () => {
    const received: MCPMessage[] = [];
    const customTransport = new StdioTransport({
      stdin: mockStdin,
      stdout: mockStdout,
    });
    await customTransport.connect();
    customTransport.onMessage((msg) => received.push(msg));

    const msg1 = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "a" });
    const msg2 = JSON.stringify({ jsonrpc: "2.0", id: 2, method: "b" });
    const framed =
      `Content-Length: ${Buffer.byteLength(msg1)}\r\n\r\n${msg1}` +
      `Content-Length: ${Buffer.byteLength(msg2)}\r\n\r\n${msg2}`;
    mockStdin.push(framed);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(received.length).toBe(2);

    await customTransport.close();
  });

  it("should handle invalid JSON gracefully", async () => {
    const received: MCPMessage[] = [];
    const customTransport = new StdioTransport({
      stdin: mockStdin,
      stdout: mockStdout,
    });
    await customTransport.connect();
    customTransport.onMessage((msg) => received.push(msg));

    const invalidJson = "not-valid-json";
    const framed = `Content-Length: ${Buffer.byteLength(invalidJson)}\r\n\r\n${invalidJson}`;
    mockStdin.push(framed);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(received.length).toBe(0);

    await customTransport.close();
  });

  it("should throw when sending without connection", async () => {
    await expect(transport.send({ jsonrpc: "2.0", id: 1 })).rejects.toThrow("not connected");
  });

  it("should close cleanly", async () => {
    const customTransport = new StdioTransport({
      stdin: mockStdin,
      stdout: mockStdout,
    });
    await customTransport.connect();
    expect(customTransport.connected).toBe(true);
    await customTransport.close();
    expect(customTransport.connected).toBe(false);
  });

  it("should handle stdin end event", async () => {
    const customTransport = new StdioTransport({
      stdin: mockStdin,
      stdout: mockStdout,
    });
    await customTransport.connect();
    mockStdin.push(null);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(customTransport.connected).toBe(false);
  });
});
