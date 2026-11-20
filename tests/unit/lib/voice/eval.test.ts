/**
 * @jest-environment node
 *
 * POC 评测集与评测引擎单测：CER 正确性、样本集结构完整性、报告聚合与门槛判定
 */
import { metrics, METRICS } from '@/lib/observability';
import {
  editDistance,
  cer,
  runAsrEval,
  buildPocReport,
  POC_THRESHOLDS,
} from '@/lib/voice/eval';
import {
  ASR_SAMPLES,
  NOISE_SAMPLE_SPECS,
  TTS_SAMPLES,
  TTS_DISCLOSURE_PREFIX,
  AUDIO_ASSET_DIR,
} from '@/lib/voice/eval-dataset';
import { AI_DISCLOSURE_TEXT } from '@/lib/compliance/disclosure';

beforeEach(() => {
  metrics.reset();
});

describe('CER 计算', () => {
  it('完全一致 → 0', () => {
    expect(cer('你好世界', '你好世界')).toBe(0);
  });

  it('单字替换 → 1/长度', () => {
    // 「报价」→「保价」：1 替换 / 4 字
    expect(cer('今天报价', '今天保价')).toBeCloseTo(0.25, 5);
  });

  it('插入与删除计入编辑距离', () => {
    expect(editDistance('一百九十九', '一百九十九块')).toBe(1);
    expect(editDistance('abc', 'ac')).toBe(1);
  });

  it('空参考返回 null（不产生误导数值）', () => {
    expect(cer('', '任何文本')).toBeNull();
  });

  it('全错 → 1', () => {
    expect(editDistance('啊啊', '哦哦')).toBe(2);
    expect(cer('啊啊', '哦哦')).toBe(1);
  });
});

describe('评测集结构完整性（POC 前置校验）', () => {
  it('ASR 样本 20 句：三场景 7/7/6、三档位齐备、ID 唯一', () => {
    expect(ASR_SAMPLES).toHaveLength(20);
    const byScenario = ASR_SAMPLES.reduce(
      (acc, s) => ({ ...acc, [s.scenario]: (acc[s.scenario] ?? 0) + 1 }),
      {} as Record<string, number>
    );
    expect(byScenario).toEqual({
      product_inquiry: 7,
      price_negotiation: 7,
      complaint_relief: 6,
    });
    const tiers = new Set(ASR_SAMPLES.map((s) => s.tier));
    expect(tiers).toEqual(new Set(['clear', 'casual', 'slurred']));
    expect(new Set(ASR_SAMPLES.map((s) => s.id)).size).toBe(20);
  });

  it('四类易错要素全覆盖且每类至少 4 句', () => {
    const all = new Set(ASR_SAMPLES.flatMap((s) => s.features));
    expect(all).toEqual(new Set(['number', 'date', 'amount', 'proper_noun', 'homophone']));
    for (const f of ['number', 'date', 'amount'] as const) {
      expect(ASR_SAMPLES.filter((s) => s.features.includes(f)).length).toBeGreaterThanOrEqual(4);
    }
  });

  it('参考文本非空且无首尾空白（朗读稿逐字基准）', () => {
    for (const s of ASR_SAMPLES) {
      expect(s.reference.length).toBeGreaterThan(5);
      expect(s.reference).toBe(s.reference.trim());
    }
  });

  it('嘈杂样本 5 段 SNR 递减且基准句存在于 ASR 集', () => {
    expect(NOISE_SAMPLE_SPECS).toHaveLength(5);
    const snrs = NOISE_SAMPLE_SPECS.map((n) => n.snrDb);
    expect([...snrs].sort((a, b) => b - a)).toEqual(snrs);
    const ids = new Set(ASR_SAMPLES.map((s) => s.id));
    for (const n of NOISE_SAMPLE_SPECS) expect(ids.has(n.basedOn)).toBe(true);
  });

  it('TTS 样本 6+ 句：含标识头 2 句（复用 disclosure 常量）+ 三场景各 2 句', () => {
    expect(TTS_DISCLOSURE_PREFIX).toBe(AI_DISCLOSURE_TEXT); // 与生产链路同源
    expect(TTS_SAMPLES.filter((s) => s.withDisclosure)).toHaveLength(2);
    for (const sc of ['product_inquiry', 'price_negotiation', 'complaint_relief'] as const) {
      expect(TTS_SAMPLES.filter((s) => s.scenario === sc).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('音频挂载目录约定存在（评测资产路径导出）', () => {
    expect(AUDIO_ASSET_DIR).toBe('lib/voice/eval-assets');
  });
});

describe('runAsrEval 引擎', () => {
  const mockLoad = async () => 'fake-audio';

  it('完美识别 → avgCer 0、passed true、指标写入 M2 直方图', async () => {
    const report = await runAsrEval(
      'vendorA',
      async (_audio, sample) => sample.reference,
      mockLoad,
      ASR_SAMPLES.slice(0, 4)
    );
    expect(report.avgCer).toBe(0);
    expect(report.cerPassRate).toBe(1);
    expect(report.firstTokenP95Ms).toBeLessThan(POC_THRESHOLDS.asrFirstTokenMs);
    expect(report.passed).toBe(true);
    expect(
      metrics.getHistogramStats(METRICS.ASR_FIRST_TOKEN_MS, { vendor: 'vendorA' })
    ).not.toBeNull();
  });

  it('高错误识别 → 门槛判定 passed false', async () => {
    const report = await runAsrEval(
      'vendorB',
      async () => '完全无关的转写内容',
      mockLoad,
      ASR_SAMPLES.slice(0, 3)
    );
    expect(report.avgCer).toBeGreaterThan(POC_THRESHOLDS.cerMax);
    expect(report.passed).toBe(false);
  });

  it('分档指标按 vendor 标签隔离', async () => {
    await runAsrEval('vX', async (_a, s) => s.reference, mockLoad, ASR_SAMPLES.slice(0, 2));
    await runAsrEval('vY', async (_a, s) => s.reference, mockLoad, ASR_SAMPLES.slice(0, 2));
    expect(
      metrics.getHistogramStats(METRICS.ASR_FIRST_TOKEN_MS, { vendor: 'vX' })!.count
    ).toBe(2);
    expect(
      metrics.getHistogramStats(METRICS.ASR_FIRST_TOKEN_MS, { vendor: 'vY' })!.count
    ).toBe(2);
  });
});

describe('buildPocReport', () => {
  it('聚合多供应商报告并携带 MOS 人工项说明', () => {
    const report = buildPocReport([
      { vendor: 'A', samples: 20, avgCer: 0.05, cerPassRate: 0.95, firstTokenP95Ms: 420, passed: true },
      { vendor: 'B', samples: 20, avgCer: 0.09, cerPassRate: 0.7, firstTokenP95Ms: 610, passed: false },
    ]);
    expect(report.asr).toHaveLength(2);
    expect(report.asr[0].passed).toBe(true);
    expect(report.manualItems.mosTarget).toBe(4.0);
    expect(report.generatedAt).toBeTruthy();
  });
});
