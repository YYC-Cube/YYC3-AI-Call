/**
 * @fileoverview POC 评测 runner（选型方案 §六 第 1 周执行入口）
 * @description 骨架：音频资产就位 + 供应商适配器实现后即可运行。
 *              用法：
 *              pnpm tsx scripts/poc-eval.ts --vendor volcengine --audio-dir ./poc-assets/asr
 *              供应商适配器（lib/voice/asr-<vendor>.ts）实现 AsrRecognize 接口后，
 *              在 VENDOR_ADAPTERS 注册即可；未注册/音频缺失时给出明确指引退出。
 * @module scripts/poc-eval
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ASR_SAMPLES } from '../lib/voice/eval-dataset';
import { runAsrEval, buildPocReport, type AsrRecognize } from '../lib/voice/eval';
import { buildLatencySnapshot } from '../lib/observability';

/** 供应商适配器注册表（选型方案 §三 双主线；mock 供全链冒烟） */
const VENDOR_ADAPTERS: Record<string, AsrRecognize> = {
  volcengine: (audio, sample) =>
    import('../lib/voice/asr-volcengine').then((m) => m.recognize(audio, sample)),
  iflytek: (audio, sample) =>
    import('../lib/voice/asr-iflytek').then((m) => m.recognize(audio, sample)),
  // mock：评测链路冒烟（返回参考文本 90% 截断，产出非零 CER 的真实评测流）
  mock: (audio, sample) => {
    void audio;
    return Promise.resolve(sample.reference.slice(0, Math.max(1, Math.floor(sample.reference.length * 0.9))));
  },
};

/** 音频加载：${audioDir}/${sampleId}.wav */
function makeAudioLoader(audioDir: string) {
  return async (sampleId: string): Promise<string> => {
    const file = path.join(audioDir, `${sampleId}.wav`);
    if (!fs.existsSync(file)) {
      throw new Error(
        `音频未挂载: ${file}（规格与目录约定见 lib/voice/eval-assets/README.md）`
      );
    }
    return file; // 适配器自读（多数云 SDK 收文件路径/URL）
  };
}

/** JSON 报告落盘（五维评分决策会输入）：docs/.../reports/poc/ */
function persistReport(mode: string, vendor: string, payload: unknown): string {
  const dir = path.resolve('docs/YYC3-项目闭环-验收系统/reports/poc');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const file = path.join(dir, `poc-${mode}-${vendor}-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

async function runTtsEval(ttsDir: string): Promise<number> {
  const { synthesize, readCosyVoiceConfigFromEnv } = await import('../lib/voice/tts-cosyvoice');
  const { TTS_SAMPLES, TTS_DISCLOSURE_PREFIX } = await import('../lib/voice/eval-dataset');
  const { metrics, METRICS, observeLatency } = await import('../lib/observability');

  readCosyVoiceConfigFromEnv(); // 凭证守卫（缺失即抛）
  metrics.reset();
  const results: Array<Record<string, unknown>> = [];

  for (const s of TTS_SAMPLES) {
    const text = s.withDisclosure ? TTS_DISCLOSURE_PREFIX + s.text : s.text;
    const out = path.join(ttsDir, `${s.id}.mp3`);
    const r = await synthesize(text, out);
    observeLatency(METRICS.TTS_PROCESSING_MS, r.totalMs, { sample: s.id });
    results.push({
      sampleId: s.id,
      scenario: s.scenario,
      withDisclosure: s.withDisclosure,
      file: out,
      firstByteMs: Math.round(r.firstByteMs),
      totalMs: Math.round(r.totalMs),
      bytes: r.bytes,
    });
    console.log(`  🔈 ${s.id} 首包 ${Math.round(r.firstByteMs)}ms / 总耗时 ${Math.round(r.totalMs)}ms`);
  }

  const firstBytes = results.map((r) => r.firstByteMs as number).sort((a, b) => a - b);
  const report = {
    vendor: 'cosyvoice',
    samples: results.length,
    firstByteP95Ms: firstBytes[Math.min(firstBytes.length - 1, Math.floor(firstBytes.length * 0.95))],
    firstByteAvgMs: Math.round(firstBytes.reduce((a, b) => a + b, 0) / firstBytes.length),
    thresholdFirstByteMs: 300,
    passed: firstBytes.every((ms) => ms <= 300),
    results,
    manualItems: {
      mosTarget: 4.0,
      note: '音频已落盘 poc-assets/tts/，5 人主观听测（自然度/标识头节奏）后补录评分',
    },
  };
  const snapshot = buildLatencySnapshot();
  const file = persistReport('tts', 'cosyvoice', { report, latencySnapshot: snapshot });
  console.log(JSON.stringify({ report }, null, 2));
  console.log(`📄 报告已落盘: ${file}`);
  console.log(
    report.passed
      ? '✅ CosyVoice 通过 TTS 门槛（首包 ≤300ms）；MOS 听测后合入决策材料'
      : '❌ CosyVoice 未通过 TTS 门槛（首包 >300ms）'
  );
  return report.passed ? 0 : 2;
}

async function main() {
  const args = process.argv.slice(2);
  const modeIdx = args.indexOf('--mode');
  const mode = modeIdx !== -1 ? args[modeIdx + 1] : 'asr';

  if (mode === 'tts') {
    try {
      process.exitCode = await runTtsEval('./poc-assets/tts');
    } catch (error) {
      console.error('❌ TTS 评测中断:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
    return;
  }

  const vendorIdx = args.indexOf('--vendor');
  const audioIdx = args.indexOf('--audio-dir');
  const vendor = vendorIdx !== -1 ? args[vendorIdx + 1] : undefined;
  const audioDir = audioIdx !== -1 ? args[audioIdx + 1] : './poc-assets/asr';

  if (!vendor || !VENDOR_ADAPTERS[vendor]) {
    console.error(
      `❌ 供应商适配器未注册: ${vendor ?? '(缺失)'}。已注册: ${Object.keys(VENDOR_ADAPTERS).join(', ') || '（无）'}\n` +
        '   接入指引：实现 AsrRecognize 接口后在 VENDOR_ADAPTERS 注册（选型方案 §5.3）'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`🧪 POC 评测开始 | mode=asr | vendor=${vendor} | samples=${ASR_SAMPLES.length}`);
  const loaderBase = makeAudioLoader(audioDir);
  try {
    const report = await runAsrEval(
      vendor,
      VENDOR_ADAPTERS[vendor],
      (sample) => loaderBase(sample.id),
      ASR_SAMPLES
    );
    const poc = buildPocReport([report]);
    const snapshot = buildLatencySnapshot();
    const file = persistReport('asr', vendor, { poc, latencySnapshot: snapshot });
    console.log(JSON.stringify({ poc, latencySnapshot: snapshot }, null, 2));
    console.log(`📄 报告已落盘: ${file}`);
    console.log(
      report.passed
        ? `✅ ${vendor} 通过 POC 门槛（CER ≤8%、首字 ≤500ms）`
        : `❌ ${vendor} 未通过 POC 门槛，详见上方报告`
    );
    process.exitCode = report.passed ? 0 : 2;
  } catch (error) {
    console.error('❌ 评测中断:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
