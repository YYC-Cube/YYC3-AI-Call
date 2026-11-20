/**
 * @fileoverview 阿里云 CosyVoice TTS 适配器（Model Studio·非实时 HTTP API）
 * @description 选型方案 §三 TTS 首选（cosyvoice-v3.5-flash，$0.116/万字）。
 *              DashScope REST：POST /api/v1/services/audio/tts/SpeechSynthesizer，
 *              Authorization: Bearer <DASHSCOPE_API_KEY>（文档：help.aliyun.com/
 *              zh/model-studio/cosyvoice-tts-http-api）。
 *              环境变量：DASHSCOPE_API_KEY（百炼控制台 API-KEY）。
 *              凭证缺失时抛出明确错误；不做静默 mock。
 *              合规：调用方（评测脚本/语音管线）在文本入参前经
 *              applyExplicitDisclosure 注入显式标识，元数据由结果组装层写入
 *              （M1-C3 隔离设计：供应商替换不动标识代码）。
 * @module lib/voice/tts-cosyvoice
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer';

export interface CosyVoiceConfig {
  apiKey: string;
}

export function readCosyVoiceConfigFromEnv(): CosyVoiceConfig {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'CosyVoice 凭证缺失：请设置 DASHSCOPE_API_KEY（阿里云百炼控制台 → API-KEY）'
    );
  }
  return { apiKey };
}

export interface SynthesizeOptions {
  /** 默认 cosyvoice-v3.5-flash（POC 首选档） */
  model?: string;
  /** 音色（flash 档内置音色，POC 用 longwan） */
  voice?: string;
  /** 输出格式 */
  format?: 'mp3' | 'wav';
}

export interface SynthesizeResult {
  /** 音频文件路径 */
  file: string;
  /** 合成总耗时（ms，含网络） */
  totalMs: number;
  /** 首字节耗时（ms）——对标 TTS 首包 ≤300ms 预算 */
  firstByteMs: number;
  bytes: number;
}

/**
 * 合成一段文本为音频文件。
 * @param text 待合成文本（含显式标识播报头的完整话术）
 * @param outPath 输出音频路径（poc-assets/tts/<id>.mp3）
 */
export async function synthesize(
  text: string,
  outPath: string,
  opts: SynthesizeOptions = {}
): Promise<SynthesizeResult> {
  const cfg = readCosyVoiceConfigFromEnv();
  const startedAt = performance.now();
  let firstByteMs: number | null = null;

  const resp = (await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model ?? 'cosyvoice-v3.5-flash',
      input: { text },
      parameters: {
        voice: opts.voice ?? 'longwan',
        format: opts.format ?? 'mp3',
      },
    }),
  })) as unknown as Response;

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`CosyVoice 合成失败 HTTP ${resp.status}: ${body.slice(0, 200)}`);
  }
  if (!resp.body) throw new Error('CosyVoice 响应无 body');

  const reader = resp.body.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (firstByteMs === null && value) {
      firstByteMs = performance.now() - startedAt;
    }
    chunks.push(Buffer.from(value));
  }

  const audio = Buffer.concat(chunks);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, audio);

  return {
    file: outPath,
    totalMs: performance.now() - startedAt,
    firstByteMs: firstByteMs ?? 0,
    bytes: audio.length,
  };
}
