/**
 * @fileoverview POC 评测引擎（选型方案 §5.2 口径）
 * @description CER 计算（字符错误率：编辑距离 / 参考长度——中文按字计）、
 *              延迟采集钩子（直通 M2 观测指标）、评测报告生成
 *              （复用 buildLatencySnapshot 三态判定）。
 *              纯函数无 IO，供应商适配器由 POC runner 注入。
 * @module lib/voice/eval
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { metrics, METRICS, observeLatency } from '@/lib/observability';
import type { AsrSample } from './eval-dataset';

/** POC 门槛（选型方案 §5.2；上线前收紧至 SLO 原值） */
export const POC_THRESHOLDS = {
  /** ASR 流式首字（ms） */
  asrFirstTokenMs: 500,
  /** TTS 首包（ms） */
  ttsFirstByteMs: 300,
  /** E2E 合成（ms） */
  e2eMs: 800,
  /** barge-in 响应（ms） */
  bargeinMs: 250,
  /** 字符错误率上限 */
  cerMax: 0.08,
} as const;

/** 编辑距离（O(n·m) DP；中文按字符计，UTF-16 码元对中文一字一码足够） */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1, // 删除
        curr[j - 1] + 1, // 插入
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // 替换
      );
    }
    prev = curr;
  }
  return prev[n];
}

/** CER = 编辑距离 / 参考文本长度（参考为空时返回 null，不产生误导数值） */
export function cer(reference: string, hypothesis: string): number | null {
  if (reference.length === 0) return null;
  return editDistance(reference, hypothesis) / reference.length;
}

/** 单条 ASR 评测结果 */
export interface AsrEvalResult {
  sampleId: string;
  scenario: AsrSample['scenario'];
  tier: AsrSample['tier'];
  hypothesis: string;
  cer: number | null;
  /** 是否满足 CER 门槛（cer 为 null 时记 false） */
  cerMet: boolean;
  /** ASR 流式首字延迟（ms） */
  firstTokenMs: number;
}

/** 单供应商 ASR 评测聚合 */
export interface AsrVendorReport {
  vendor: string;
  samples: number;
  /** 平均 CER（null 样本剔除后） */
  avgCer: number | null;
  /** CER 达标率（cer ≤ POC 门槛的比例） */
  cerPassRate: number;
  /** 首字延迟 P95（ms，直方图分位） */
  firstTokenP95Ms: number | null;
  passed: boolean;
}

/** ASR 识别函数签名（供应商适配器按此注入） */
export type AsrRecognize = (audio: Buffer | string, sample: AsrSample) => Promise<string>;

/**
 * 运行 ASR 评测：逐样本调用 recognize，CER 离线比对，
 * 首字延迟经 observeLatency 直通 M2 指标（POC 数据即 V1 埋点预演）。
 * @param vendor 供应商标识（标签化到指标 channel）
 * @param recognize 适配器（音频 → 转写文本）
 * @param loadAudio 音频加载器（评测集音频未挂载时抛错，由 runner 捕获）
 */
export async function runAsrEval(
  vendor: string,
  recognize: AsrRecognize,
  loadAudio: (sample: AsrSample) => Promise<Buffer | string>,
  samples: AsrSample[]
): Promise<AsrVendorReport> {
  const results: AsrEvalResult[] = [];

  for (const sample of samples) {
    const audio = await loadAudio(sample);
    const startedAt = performance.now();
    // 首字延迟由适配器经 onFirstToken 回调更精确记录；此处以完成时间近似兜底
    const hypothesis = await recognize(audio, sample);
    const firstTokenMs = performance.now() - startedAt;
    observeLatency(METRICS.ASR_FIRST_TOKEN_MS, firstTokenMs, { vendor });

    const c = cer(sample.reference, hypothesis);
    results.push({
      sampleId: sample.id,
      scenario: sample.scenario,
      tier: sample.tier,
      hypothesis,
      cer: c,
      cerMet: c !== null && c <= POC_THRESHOLDS.cerMax,
      firstTokenMs,
    });
  }

  const cerValues = results.map((r) => r.cer).filter((c): c is number => c !== null);
  const avgCer =
    cerValues.length > 0 ? cerValues.reduce((a, b) => a + b, 0) / cerValues.length : null;
  const cerPassRate =
    results.length > 0 ? results.filter((r) => r.cerMet).length / results.length : 0;
  const sorted = results.map((r) => r.firstTokenMs).sort((a, b) => a - b);
  const firstTokenP95Ms = sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
    : null;

  return {
    vendor,
    samples: results.length,
    avgCer,
    cerPassRate,
    firstTokenP95Ms,
    passed:
      results.length > 0 &&
      (avgCer ?? 1) <= POC_THRESHOLDS.cerMax &&
      (firstTokenP95Ms ?? Infinity) <= POC_THRESHOLDS.asrFirstTokenMs,
  };
}

/** 评测汇总报告（附 M2 快照，三态判定与选型方案 §5.2 对齐） */
export interface PocEvalReport {
  generatedAt: string;
  asr: AsrVendorReport[];
  /** TTS/MOS 等人工项由评测员补录后合入 */
  manualItems: { mosTarget: number; note: string };
}

/** 汇总多供应商报告并附观测快照 */
export function buildPocReport(vendorReports: AsrVendorReport[]): PocEvalReport {
  void metrics; // 指标直方图随 runAsrEval 已写入；快照由调用方按需 buildLatencySnapshot()
  return {
    generatedAt: new Date().toISOString(),
    asr: vendorReports,
    manualItems: {
      mosTarget: 4.0,
      note: 'MOS 5 人主观听测 + TTS 自然度人工评分，评测员补录后合入本报告',
    },
  };
}
