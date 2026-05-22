/**
 * file stdio-transport.ts
 * description MCP 标准传输层
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 标准传输层
 */
import { Readable, Writable } from "node:stream";
import type { MCPMessage, MCPTransport } from "./types.js";
import { logger } from "../infra/logger.js";

export class StdioTransport implements MCPTransport {
  private _connected = false;
  private stdin: Readable | null = null;
  private stdout: Writable | null = null;
  private messageHandler: ((message: MCPMessage) => void) | null = null;
  private buffer = "";

  constructor(
    private config?: {
      stdin?: Readable;
      stdout?: Writable;
    }
  ) {}

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    this.stdin = this.config?.stdin ?? process.stdin;
    this.stdout = this.config?.stdout ?? process.stdout;
    this._connected = true;

    this.stdin.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString("utf-8");
      this.processBuffer();
    });

    this.stdin.on("end", () => {
      this._connected = false;
    });

    logger.info("Stdio transport connected");
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this.stdout) throw new Error("Transport not connected");
    const json = JSON.stringify(message);
    const content = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
    this.stdout.write(content);
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandler = handler;
  }

  async close(): Promise<void> {
    this._connected = false;
    this.stdin = null;
    this.stdout = null;
    this.buffer = "";
    logger.info("Stdio transport closed");
  }

  private processBuffer(): void {
    while (this.buffer.length > 0) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;

      const header = this.buffer.substring(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.buffer = this.buffer.substring(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(match[1]!, 10);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + contentLength;

      if (this.buffer.length < bodyEnd) break;

      const body = this.buffer.substring(bodyStart, bodyEnd);
      this.buffer = this.buffer.substring(bodyEnd);

      try {
        const message = JSON.parse(body) as MCPMessage;
        if (this.messageHandler) {
          this.messageHandler(message);
        }
      } catch (error) {
        logger.warn(`Failed to parse MCP message: ${error}`);
      }
    }
  }
}
