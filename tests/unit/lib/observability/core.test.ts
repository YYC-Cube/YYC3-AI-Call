/**
 * @jest-environment node
 *
 * observability 核心单测：Logger / MetricsCollector / HealthChecker /
 * createRequestLogger / trackError（延迟封装见 latency.test.ts）
 */
import { logger, metrics, healthChecker, createRequestLogger, trackError } from '@/lib/observability';

beforeEach(() => {
  metrics.reset();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.restoreAllMocks();
  // 恢复默认 console 后重新静音（restoreAllMocks 先还原再重静音）
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Logger', () => {
  it('低于设定级别的日志不输出（shouldLog 阈值）', () => {
    const spy = jest.spyOn(console, 'log');
    logger.setLevel('error');
    logger.debug('不应出现');
    expect(spy).not.toHaveBeenCalled();
    logger.error('应出现', new Error('x'));
    expect(spy).toHaveBeenCalled();
    logger.setLevel('info');
  });

  it('error 日志携带 Error 结构化信息', () => {
    const spy = jest.spyOn(console, 'log');
    logger.error('出错了', new Error('boom'));
    const payload = JSON.stringify(spy.mock.calls[0]);
    expect(payload).toContain('boom');
  });
});

describe('MetricsCollector 补充', () => {
  it('increment/getCounter 计数累加', () => {
    metrics.increment('evt', { kind: 'a' });
    metrics.increment('evt', { kind: 'a' }, 3);
    expect(metrics.getCounter('evt', { kind: 'a' })).toBe(4);
  });

  it('gauge/getGauge 返回最新值（保留最近 100 点）', () => {
    for (let i = 1; i <= 101; i++) metrics.gauge('g', i);
    expect(metrics.getGauge('g')).toBe(101);
  });

  it('timing 记录耗时直方图（ms）', () => {
    const start = Date.now() - 50;
    metrics.timing('op', start);
    const stats = metrics.getHistogramStats('op_duration_ms');
    expect(stats).not.toBeNull();
    expect(stats!.min).toBeGreaterThanOrEqual(40);
  });

  it('getHistogramStats 无样本返回 null', () => {
    expect(metrics.getHistogramStats('nope')).toBeNull();
  });
});

describe('HealthChecker', () => {
  it('全部通过 → healthy', async () => {
    healthChecker.register('ok-check', async () => true);
    const r = await healthChecker.runChecks();
    expect(r.checks.find((c) => c.name === 'ok-check')!.status).toBe('pass');
    healthChecker.unregister('ok-check');
  });

  it('部分失败 → degraded；抛异常 → fail 并带 message', async () => {
    healthChecker.register('bad', async () => false);
    healthChecker.register('boom', async () => {
      throw new Error('conn refused');
    });
    const r = await healthChecker.runChecks();
    expect(['degraded', 'unhealthy']).toContain(r.status);
    expect(r.checks.find((c) => c.name === 'boom')!.message).toContain('conn refused');
    healthChecker.unregister('bad');
    healthChecker.unregister('boom');
  });

  it('unregister 后不再执行', async () => {
    healthChecker.register('gone', async () => false);
    healthChecker.unregister('gone');
    const r = await healthChecker.runChecks();
    expect(r.checks.find((c) => c.name === 'gone')).toBeUndefined();
  });
});

describe('createRequestLogger', () => {
  it('生成 requestId 并在 onComplete 记录 HTTP 直方图', () => {
    const request = {
      headers: {
        get: (k: string) => (k === 'x-forwarded-for' ? '10.0.0.1, proxy' : 'UA-test'),
      },
      method: 'GET',
      url: 'http://localhost/api/health',
    } as never;

    const rl = createRequestLogger(request);
    expect(rl.requestId).toBeTruthy();
    expect(rl.context.path).toBe('/api/health');

    rl.onComplete(200);
    const stats = metrics.getHistogramStats('http_request_duration_ms', {
      method: 'GET',
      path: '/api/health',
      status: '200',
    });
    expect(stats).not.toBeNull();
    expect(
      metrics.getCounter('http_requests_total', { method: 'GET', path: '/api/health' })
    ).toBe(1);
  });
});

describe('trackError', () => {
  it('未配置 Sentry 时仅记录计数与日志', async () => {
    delete process.env.SENTRY_DSN;
    const before = metrics.getCounter('errors_total', { type: 'Error' });
    await trackError(new Error('tracked'), { path: '/x' });
    expect(metrics.getCounter('errors_total', { type: 'Error' })).toBe(before + 1);
  });
});
