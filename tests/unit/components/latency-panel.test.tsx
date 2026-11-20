/**
 * 延迟观测面板测试：三态渲染 + axe 无障碍 + buildLatencySnapshot 数据源判定
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LatencyPanel from '@/components/latency-panel';
import { buildLatencySnapshot, metrics, observeTtft } from '@/lib/observability';

expect.extend(toHaveNoViolations);

beforeEach(() => {
  metrics.reset();
});

describe('buildLatencySnapshot', () => {
  it('有样本：P50/P95 取整并给出达标判定', () => {
    observeTtft('chat_stream', 100);
    observeTtft('chat_stream', 150);
    observeTtft('chat_stream', 180);
    const snap = buildLatencySnapshot();
    const ttft = snap.metrics.find((m) => m.metric === 'yyc3_chat_ttft_ms')!;
    expect(ttft.count).toBe(3);
    expect(ttft.p95).toBeLessThanOrEqual(200);
    expect(ttft.sloMet).toBe(true);
  });

  it('超标样本 → sloMet false', () => {
    observeTtft('chat_stream', 500);
    const snap = buildLatencySnapshot();
    const ttft = snap.metrics.find((m) => m.metric === 'yyc3_chat_ttft_ms')!;
    expect(ttft.sloMet).toBe(false);
  });

  it('无样本 → sloMet null（不误判）且端到端指标为空', () => {
    const snap = buildLatencySnapshot();
    const ttft = snap.metrics.find((m) => m.metric === 'yyc3_chat_ttft_ms')!;
    const e2e = snap.metrics.find((m) => m.metric === 'yyc3_call_e2e_latency_ms')!;
    expect(ttft.sloMet).toBeNull();
    expect(e2e.count).toBe(0);
  });
});

describe('LatencyPanel 组件', () => {
  it('渲染达标/超标/暂无数据三态', () => {
    render(
      <LatencyPanel
        snapshot={{
          capturedAt: '2026-11-20T15:00:00+08:00',
          metrics: [
            {
              metric: 'yyc3_chat_ttft_ms',
              label: '对话首字节延迟',
              count: 3,
              p50: 150,
              p95: 180,
              sloMet: true,
              sloTargetMs: 200,
            },
            {
              metric: 'yyc3_tts_processing_ms',
              label: '语音合成处理耗时',
              count: 2,
              p50: 300,
              p95: 450,
              sloMet: false,
              sloTargetMs: 200,
            },
            {
              metric: 'yyc3_call_e2e_latency_ms',
              label: '通话端到端延迟',
              count: 0,
              p50: null,
              p95: null,
              sloMet: null,
              sloTargetMs: 800,
            },
          ],
        }}
      />
    );
    expect(screen.getByRole('heading', { name: '延迟观测' })).toBeInTheDocument();
    expect(screen.getByText('达标')).toBeInTheDocument();
    expect(screen.getByText('超标')).toBeInTheDocument();
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
  });

  it('通过 axe 无障碍扫描', async () => {
    const { container } = render(
      <LatencyPanel
        snapshot={{
          capturedAt: '2026-11-20T15:00:00+08:00',
          metrics: [
            {
              metric: 'yyc3_chat_ttft_ms',
              label: '对话首字节延迟',
              count: 1,
              p50: 100,
              p95: 120,
              sloMet: true,
              sloTargetMs: 200,
            },
          ],
        }}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
