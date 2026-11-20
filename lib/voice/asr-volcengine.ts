/**
 * @fileoverview 火山引擎 ASR 适配器（豆包·录音文件识别极速版）
 * @description 实现 AsrRecognize 接口（选型方案 §5.3）：REST + Header 鉴权
 *              （X-Api-App-Key = APP ID / X-Api-Access-Key = Access Token，
 *              文档：volcengine.com/docs/6561/1631584）。
 *              环境变量：
 *              - VOLC_ASR_APP_KEY（APP ID）
 *              - VOLC_ASR_ACCESS_KEY（Access Token）
 *              凭证缺失时 recognize 抛出明确错误（POC runner 捕获退出），
 *              不做静默 mock（真实评测数据必须来自真实供应商）。
 *              音频规格：16kHz/单声道/wav（poc-audio-gen.ts 产物）。
 * @module lib/voice/asr-volcengine
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import * as fs from 'node:fs';
import type { AsrSample } from './eval-dataset';

/** 极速版 REST 端点（大模型录音文件极速版识别 API） */
const ENDPOINT =
  'https://openspeech.bytedance.com/api/v3/auc_turbo/submit';

export interface VolcAsrConfig {
  appKey: string;
  accessKey: string;
}

export function readVolcConfigFromEnv(): VolcAsrConfig {
  const appKey = process.env.VOLC_ASR_APP_KEY;
  const accessKey = process.env.VOLC_ASR_ACCESS_KEY;
  if (!appKey || !accessKey) {
    throw new Error(
      '火山 ASR 凭证缺失：请设置 VOLC_ASR_APP_KEY / VOLC_ASR_ACCESS_KEY（火山控制台·豆包语音）'
    );
  }
  return { appKey, accessKey };
}

/** 极速版提交响应（异步任务 id） */
interface VolcSubmitResp {
  id?: string;
  message?: string;
}

/** 极速版查询响应（audio_info.text 或 result） */
interface VolcQueryResp {
  status?: number;
  message?: string;
  audio_info?: { text?: string };
  result?: { text?: string };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 识别一段音频（AsrRecognize 形态）。
 * 极速版为 submit+query 两段式：提交后轮询直至出文本或超时（POC 预算 60s/句）。
 */
export async function recognize(audio: Buffer | string, _sample: AsrSample): Promise<string> {
  const cfg = readVolcConfigFromEnv();
  const filePath = typeof audio === 'string' ? audio : null;
  if (!filePath) throw new Error('火山适配器 POC 期仅支持文件路径输入');
  const data = fs.readFileSync(filePath);

  const headers = {
    'Content-Type': 'application/json',
    'X-Api-App-Key': cfg.appKey,
    'X-Api-Access-Key': cfg.accessKey,
    'X-Api-Resource-Id': 'volc.bigasr.auc_turbo', // 极速版资源 ID（控制台开通后核对）
  };

  // ── submit：音频 base64 + 请求体 ──
  const submitResp = (await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user: { uid: 'yyc3-poc' },
      audio: {
        format: 'wav',
        data: data.toString('base64'),
      },
      request: { model_name: 'bigmodel' },
    }),
  })) as unknown as Response;

  if (!submitResp.ok) {
    const text = await submitResp.text().catch(() => '');
    throw new Error(`火山 ASR submit 失败 HTTP ${submitResp.status}: ${text.slice(0, 200)}`);
  }
  const submitted = (await submitResp.json()) as VolcSubmitResp;
  if (!submitted.id) {
    throw new Error(`火山 ASR submit 无任务 id: ${JSON.stringify(submitted).slice(0, 200)}`);
  }

  // ── query：轮询（2s 间隔，上限 30 次 = 60s）──
  const queryUrl = `${ENDPOINT.replace('/submit', '')}/query?id=${encodeURIComponent(submitted.id)}`;
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const q = (await fetch(queryUrl, { headers })) as unknown as Response;
    if (!q.ok) continue; // 瞬时错误重试
    const body = (await q.json()) as VolcQueryResp;
    const text = body.audio_info?.text ?? body.result?.text;
    if (typeof text === 'string') return text;
  }
  throw new Error(`火山 ASR 查询超时（60s）：taskId=${submitted.id}`);
}
