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

/** 供应商适配器注册表（POC 第 1 周随 SDK 接入填充） */
const VENDOR_ADAPTERS: Record<string, AsrRecognize> = {
  // volcengine: (audio, sample) => import('../lib/voice/asr-volcengine').then(m => m.recognize(audio, sample)),
  // iflytek:     (audio, sample) => import('../lib/voice/asr-iflytek').then(m => m.recognize(audio, sample)),
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

async function main() {
  const args = process.argv.slice(2);
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

  console.log(`🧪 POC 评测开始 | vendor=${vendor} | samples=${ASR_SAMPLES.length}`);
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
    console.log(JSON.stringify({ poc, latencySnapshot: snapshot }, null, 2));
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
