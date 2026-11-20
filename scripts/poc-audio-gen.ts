/**
 * @fileoverview POC 音频资产合成（选型方案 §5.1 / eval-assets README 规格落地）
 * @description 用 macOS `say`（zh_CN 语音）合成 ASR 评测 20 句基准音频，
 *              ffmpeg 统一转 16kHz/单声道 wav；嘈杂 5 段按 SNR 规格用
 *              ffmpeg anoisesrc 混噪生成。POC_AUDIO_DIR 可自定义（默认 ./poc-assets）。
 *              录制式真人样本可后续替换同名文件，评测管线不变。
 *              用法：pnpm tsx scripts/poc-audio-gen.ts [--out ./poc-assets]
 * @module scripts/poc-audio-gen
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ASR_SAMPLES, NOISE_SAMPLE_SPECS } from '../lib/voice/eval-dataset';

const ZH_VOICE = 'Eddy'; // macOS 内置 zh_CN 语音（Tingting 等本机可用语音亦可，--voice 覆盖）

function run(cmd: string, args: string[]) {
  execFileSync(cmd, args, { stdio: 'pipe' });
}

function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const voiceIdx = args.indexOf('--voice');
  const outDir = outIdx !== -1 ? args[outIdx + 1] : './poc-assets/asr';
  const voice = voiceIdx !== -1 ? args[voiceIdx + 1] : ZH_VOICE;

  const tmpDir = fs.mkdtempSync('/tmp/poc-tts-');
  fs.mkdirSync(outDir, { recursive: true });

  // ── 1) 20 句基准合成：say → aiff，ffmpeg → 16kHz 单声道 wav ──
  let ok = 0;
  for (const s of ASR_SAMPLES) {
    const aiff = path.join(tmpDir, `${s.id}.aiff`);
    const wav = path.join(outDir, `${s.id}.wav`);
    try {
      run('say', ['-v', voice, '-r', s.tier === 'slurred' ? '190' : s.tier === 'casual' ? '220' : '180', '-o', aiff, s.reference]);
      // 含混档提速模拟连读弱化；日常档中速
      run('ffmpeg', ['-y', '-i', aiff, '-ar', '16000', '-ac', '1', '-sample_fmt', 's16', wav]);
      ok++;
    } catch (e) {
      console.error(`⚠️ ${s.id} 合成失败:`, e instanceof Error ? e.message.slice(0, 120) : e);
    }
  }
  console.log(`✅ 基准音频 ${ok}/${ASR_SAMPLES.length} → ${outDir}`);

  // ── 2) 嘈杂 5 段：基准句 + anoisesrc 按 SNR 混噪 ──
  //    SNR(dB) → 噪声音量系数：noise_gain = signal_rms / 10^(snr/20)，以 0.08 近似归一
  let noiseOk = 0;
  for (const n of NOISE_SAMPLE_SPECS) {
    const base = path.join(outDir, `${n.basedOn}.wav`);
    const out = path.join(outDir, `${n.id}.wav`);
    if (!fs.existsSync(base)) {
      console.error(`⚠️ ${n.id} 跳过：基准 ${n.basedOn} 缺失`);
      continue;
    }
    const gain = (0.08 / Math.pow(10, n.snrDb / 20)).toFixed(4);
    try {
      run('ffmpeg', [
        '-y',
        '-i', base,
        '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=1:duration=30',
        '-filter_complex',
        `[1:a]volume=${gain}[n];[0:a][n]amix=inputs=2:duration=first:dropout_transition=0[out]`,
        '-map', '[out]',
        '-ar', '16000', '-ac', '1', '-sample_fmt', 's16',
        out,
      ]);
      noiseOk++;
    } catch (e) {
      console.error(`⚠️ ${n.id} 混噪失败:`, e instanceof Error ? e.message.slice(0, 120) : e);
    }
  }
  console.log(`✅ 嘈杂音频 ${noiseOk}/${NOISE_SAMPLE_SPECS.length} → ${outDir}`);

  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (ok < ASR_SAMPLES.length || noiseOk < NOISE_SAMPLE_SPECS.length) {
    console.error('❌ 存在合成失败项，请检查上方 ⚠️ 输出');
    process.exitCode = 1;
  } else {
    console.log(`🎉 POC 音频就绪（${ok + noiseOk} 个文件），可运行：pnpm tsx scripts/poc-eval.ts --vendor <vendor> --audio-dir ${outDir}`);
  }
}

main();
