/**
 * @jest-environment node
 *
 * 延迟观测薄封装单测：observeTtft / observeLatency / trackStreamTtft
 * node 环境（ReadableStream/TransformStream 为 Node 22 全局）
 */
import {
  metrics,
  METRICS,
  observeTtft,
  observeLatency,
  trackStreamTtft,
} from '@/lib/observability';

/** 消费流到结束并收集透传 chunk */
async function drain(stream: ReadableStream<unknown>): Promise<unknown[]> {
  const reader = stream.getReader();
  const chunks: unknown[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return chunks;
}

function makeSource(chunks: unknown[], delayMs: number): ReadableStream<unknown> {
  return new ReadableStream<unknown>({
    start(controller) {
      chunks.forEach((c, i) => {
        setTimeout(() => controller.enqueue(c), delayMs * (i + 1));
      });
      setTimeout(() => controller.close(), delayMs * (chunks.length + 1));
    },
  });
}

beforeEach(() => {
  metrics.reset();
});

describe('observeTtft / observeLatency', () => {
  it('observeTtft 按 channel 标签记录 histogram，P95 可查', () => {
    observeTtft('chat_stream', 120);
    observeTtft('chat_stream', 180);
    observeTtft('chat_stream', 260);
    const stats = metrics.getHistogramStats(METRICS.CHAT_TTFT_MS, { channel: 'chat_stream' });
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(3);
    expect(stats!.max).toBe(260);
  });

  it('observeLatency 通用直通记录指定指标', () => {
    observeLatency('yyc3_audio_processing_ms', 800, { task: 'transcribe' });
    const stats = metrics.getHistogramStats('yyc3_audio_processing_ms', { task: 'transcribe' });
    expect(stats!.count).toBe(1);
    expect(stats!.avg).toBe(800);
  });
});

describe('trackStreamTtft', () => {
  it('原样透传全部 chunk（零改写）', async () => {
    const wrapped = trackStreamTtft(makeSource(['a', 'b', 'c'], 5), 'chat_stream');
    const out = await drain(wrapped);
    expect(out).toEqual(['a', 'b', 'c']);
  });

  it('首 chunk 触发 TTFT 记录，流结束记录总耗时', async () => {
    const wrapped = trackStreamTtft(makeSource([1, 2], 20), 'chat_stream');
    await drain(wrapped);

    const ttft = metrics.getHistogramStats(METRICS.CHAT_TTFT_MS, { channel: 'chat_stream' });
    expect(ttft).not.toBeNull();
    expect(ttft!.count).toBe(1); // 首字节只记一次
    expect(ttft!.min).toBeGreaterThanOrEqual(0);
    expect(ttft!.min).toBeLessThan(2000); // 合理窗口

    const total = metrics.getHistogramStats(METRICS.CHAT_STREAM_TOTAL_MS, {
      channel: 'chat_stream',
    });
    expect(total).not.toBeNull();
    expect(total!.min).toBeGreaterThanOrEqual(ttft!.min); // 总耗时 ≥ TTFT
  });

  it('空流不产生任何指标', async () => {
    const wrapped = trackStreamTtft(makeSource([], 1), 'chat_stream');
    await drain(wrapped);
    expect(metrics.getHistogramStats(METRICS.CHAT_TTFT_MS, { channel: 'chat_stream' })).toBeNull();
    expect(
      metrics.getHistogramStats(METRICS.CHAT_STREAM_TOTAL_MS, { channel: 'chat_stream' })
    ).toBeNull();
  });
});

describe('Prometheus 导出', () => {
  it('histogram 以 summary 输出 quantile 0.5/0.95/0.99', () => {
    observeTtft('chat_stream', 100);
    observeTtft('chat_stream', 300);
    const text = metrics.exportPrometheusFormat();
    expect(text).toContain('# TYPE yyc3_chat_ttft_ms summary');
    expect(text).toContain('quantile="0.95"');
    expect(text).toContain('quantile="0.5"');
    expect(text).toMatch(/yyc3_chat_ttft_ms(\{[^}]*\})?_count \d+/);
  });
});
