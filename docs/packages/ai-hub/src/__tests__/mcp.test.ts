/**
 * file mcp.test.ts
 * description @yyc3/ai-hub mcp.ts 单元测试
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[mcp],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub mcp.ts 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPManager } from '../../src/mcp.js';
import type { MCPServerConfig } from '../../src/types.js';

describe('MCPManager', () => {
  let mcpManager: MCPManager;

  beforeEach(() => {
    mcpManager = new MCPManager();
  });

  describe('constructor', () => {
    it('should instantiate without error', () => {
      expect(mcpManager).toBeDefined();
    });
    it('should start empty', () => {
      expect(mcpManager.list()).toHaveLength(0);
      expect(mcpManager.count()).toBe(0);
    });
  });

  describe('register', () => {
    const testConfig: MCPServerConfig = {
      command: 'node',
      args: ['server.js'],
      env: { PORT: '3000' },
      metadata: { displayName: 'Test Server', category: 'testing', vendor: 'YYC3' },
    };

    it('should register a new server', () => {
      mcpManager.register('test-server', testConfig);
      expect(mcpManager.count()).toBe(1);
      expect(mcpManager.list()).toContain('test-server');
    });

    it('should get registered server by id with full config', () => {
      mcpManager.register('test-server', testConfig);
      const server = mcpManager.get('test-server');
      expect(server?.id).toBe('test-server');
      expect(server?.config.command).toBe('node');
      expect(server?.config.metadata?.displayName).toBe('Test Server');
      expect(server?.status).toBe('stopped');
    });

    it('should overwrite existing server with same id', () => {
      mcpManager.register('test-server', testConfig);
      mcpManager.register('test-server', { command: 'python', args: ['main.py'] });
      expect(mcpManager.count()).toBe(1);
      expect(mcpManager.get('test-server')?.config.command).toBe('python');
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent server', () => {
      expect(mcpManager.get('non-existent')).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should return all registered server ids in order', () => {
      mcpManager.register('s1', { command: 'node' });
      mcpManager.register('s2', { command: 'python' });
      mcpManager.register('s3', { command: 'go' });
      const ids = mcpManager.list();
      expect(ids).toHaveLength(3);
      expect(ids).toEqual(['s1', 's2', 's3']);
    });
  });

  describe('getByCategory', () => {
    beforeEach(() => {
      mcpManager.register('cat-dev', { command: 'node', metadata: { category: 'development' } });
      mcpManager.register('cat-sec', { command: 'python', metadata: { category: 'security' } });
      mcpManager.register('cat-dev-2', { command: 'go', metadata: { category: 'development' } });
    });

    it('should filter servers by category', () => {
      const devServers = mcpManager.getByCategory('development');
      expect(devServers).toHaveLength(2);
    });

    it('should return empty array for non-existent category', () => {
      expect(mcpManager.getByCategory('non-existent')).toHaveLength(0);
    });

    it('should handle servers without metadata gracefully', () => {
      mcpManager.register('no-meta', { command: 'rust' });
      // no-meta has no category, should not appear in development results
      expect(mcpManager.getByCategory('development')).toHaveLength(2);
    });
  });

  describe('startServer / stopServer (mocked)', () => {
    let originalSpawn: typeof import('child_process').spawn;
    
    beforeEach(() => {
      originalSpawn = require('child_process').spawn;
    });

    afterEach(() => {
      require('child_process').spawn = originalSpawn;
    });

    it('should start server and update status to running', async () => {
      mcpManager.register('echo-server', { command: 'echo', args: ['hello'] });

      require('child_process').spawn = (() => {
        const emitter: any = new (require('events').EventEmitter)();
        setTimeout(() => emitter.emit('spawn'), 10);
        emitter.pid = 12345;
        return emitter;
      }) as any;

      await mcpManager.startServer('echo-server');
      expect(mcpManager.get('echo-server')?.status).toBe('running');
      expect(mcpManager.get('echo-server')?.process).toBeDefined();
    }, 5000);

    it('should stop running server and clean up process ref', async () => {
      mcpManager.register('stop-server', { command: 'echo' });
      
      let capturedProcess: any = null;
      const mockKill = vi.fn();

      require('child_process').spawn = (() => {
        const emitter: any = new (require('events').EventEmitter)();
        const proc = { kill: mockKill };
        emitter.process = proc;
        capturedProcess = proc;
        setTimeout(() => emitter.emit('spawn'), 10);
        return emitter;
      }) as any;

      await mcpManager.startServer('stop-server');
      // Verify process was stored
      expect(capturedProcess).toBeDefined();
      await mcpManager.stopServer('stop-server');

      expect(mcpManager.get('stop-server')?.status).toBe('stopped');
      expect(mcpManager.get('stop-server')?.process).toBeUndefined();
    }, 5000);

    it('should set status to error on start failure', async () => {
      mcpManager.register('fail-server', { command: 'nonexistent-cmd' });

      require('child_process').spawn = (() => {
        const emitter: any = new (require('events').EventEmitter)();
        setTimeout(() => emitter.emit('error', new Error('ENOENT')), 10);
        return emitter;
      }) as any;

      try {
        await mcpManager.startServer('fail-server');
        throw new Error('Should have rejected');
      } catch (err) {
        expect(err).toBeDefined();
      }
      expect(mcpManager.get('fail-server')?.status).toBe('error');
    }, 5000);
  });

  describe('startAll / stopAll', () => {
    let originalSpawn: typeof import('child_process').spawn;
    
    beforeEach(() => {
      originalSpawn = require('child_process').spawn;
      mcpManager.register('s1', { command: 'echo' });
      mcpManager.register('s2', { command: 'echo' });
    });

    afterEach(() => {
      require('child_process').spawn = originalSpawn;
    });

    it('should start all servers concurrently', async () => {
      require('child_process').spawn = (() => {
        const emitter: any = new (require('events').EventEmitter)();
        setTimeout(() => emitter.emit('spawn'), 5);
        return emitter;
      }) as any;

      await mcpManager.startAll();
      expect(mcpManager.get('s1')?.status).toBe('running');
      expect(mcpManager.get('s2')?.status).toBe('running');
    }, 5000);

    it('should stop all servers and verify status', async () => {
      require('child_process').spawn = (() => {
        const emitter: any = new (require('events').EventEmitter)();
        setTimeout(() => emitter.emit('spawn'), 5);
        return emitter;
      }) as any;

      await mcpManager.startAll();
      expect(mcpManager.get('s1')?.status).toBe('running');
      expect(mcpManager.get('s2')?.status).toBe('running');

      await mcpManager.stopAll();
      // After stopAll, all servers should be stopped
      expect(mcpManager.get('s1')?.status).toBe('stopped');
      expect(mcpManager.get('s2')?.status).toBe('stopped');
    }, 5000);
  });
});
