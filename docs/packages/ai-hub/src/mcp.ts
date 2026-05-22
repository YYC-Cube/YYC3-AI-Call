/**
 * file mcp.ts
 * description MCP 协议实现
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 协议实现
 */
import { MCPServerConfig } from './types.js';
import { logger } from './logger.js';
import { validate, MCPServerConfigSchema } from './schemas/index.js';
import { YYC3Error, YYC3ErrorCode } from './errors/index.js';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

export interface MCPServer {
  id: string;
  config: MCPServerConfig;
  process?: ChildProcess;
  status: 'stopped' | 'running' | 'error';
  start(): Promise<void>;
  stop(): Promise<void>;
}

class MCPServerImpl implements MCPServer {
  process?: ChildProcess;
  status: 'stopped' | 'running' | 'error' = 'stopped';

  constructor(
    public id: string,
    public config: MCPServerConfig
  ) {}

  async start(): Promise<void> {
    this.process = spawn(this.config.command, this.config.args || [], {
      env: { ...process.env, ...this.config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return new Promise((resolve, reject) => {
      this.process!.on('spawn', () => {
        this.status = 'running';
        resolve();
      });
      this.process!.on('error', (err) => {
        this.status = 'error';
        reject(new YYC3Error(YYC3ErrorCode.MCP_START_FAILED, { id: this.id, reason: err.message }, err));
      });
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
      this.status = 'stopped';
    }
  }
}

export class MCPManager {
  private servers: Map<string, MCPServer> = new Map();

  async load(paths: string[]): Promise<void> {
    for (const p of paths) {
      await this.loadFromPath(p);
    }
  }

  private async loadFromPath(p: string): Promise<void> {
    if (!fs.existsSync(p)) {
      logger.warn(`MCP配置路径不存在: ${p}`);
      return;
    }

    const content = fs.readFileSync(p, 'utf-8');
    const config = JSON.parse(content);

    if (config.mcpServers) {
      for (const [id, serverConfig] of Object.entries(config.mcpServers)) {
        const cfg = serverConfig as MCPServerConfig;
        if (cfg.command && !id.startsWith('$') && id !== '_comment') {
          this.servers.set(id, new MCPServerImpl(id, cfg));
        }
      }
    }
  }

  register(id: string, config: MCPServerConfig): void {
    const validated = validate(MCPServerConfigSchema, config);
    this.servers.set(id, new MCPServerImpl(id, validated));
  }

  get(id: string): MCPServer | undefined {
    return this.servers.get(id);
  }

  list(): string[] {
    return Array.from(this.servers.keys());
  }

  async startServer(id: string): Promise<void> {
    const server = this.servers.get(id);
    if (server) {
      await server.start();
    }
  }

  async stopServer(id: string): Promise<void> {
    const server = this.servers.get(id);
    if (server) {
      await server.stop();
    }
  }

  async startAll(): Promise<void> {
    await Promise.all(
      Array.from(this.servers.values()).map(s => s.start())
    );
  }

  async stopAll(): Promise<void> {
    await Promise.all(
      Array.from(this.servers.values()).map(s => s.stop())
    );
  }

  count(): number {
    return this.servers.size;
  }

  getByCategory(category: string): MCPServer[] {
    return Array.from(this.servers.values())
      .filter(s => s.config.metadata?.category === category);
  }
}
