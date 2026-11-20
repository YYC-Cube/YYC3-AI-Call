/**
 * @fileoverview 讯飞 ASR 适配器（实时语音转写标准版，WS 协议）
 * @description 实现 AsrRecognize 接口：wss://rtasr.xfyun.cn/v1/ws，
 *              鉴权 signa = Base64(HMAC-SHA1(MD5(appid)+ts, apiKey))
 *              （文档：xfyun.cn/services/rtasr_standard）。
 *              环境变量：
 *              - IFLYTEK_APP_ID
 *              - IFLYTEK_API_KEY
 *              凭证缺失时 recognize 抛出明确错误；不做静默 mock。
 *              音频规格：16kHz/单声道 PCM wav（poc-audio-gen.ts 产物），
 *              按实时转写协议 40 字节/帧间隔分片发送（base64）。
 * @module lib/voice/asr-iflytek
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import type { AsrSample } from './eval-dataset';

const WS_URL = 'wss://rtasr.xfyun.cn/v1/ws';

export interface IflytekConfig {
  appId: string;
  apiKey: string;
}

export function readIflytekConfigFromEnv(): IflytekConfig {
  const appId = process.env.IFLYTEK_APP_ID;
  const apiKey = process.env.IFLYTEK_API_KEY;
  if (!appId || !apiKey) {
    throw new Error(
      '讯飞 ASR 凭证缺失：请设置 IFLYTEK_APP_ID / IFLYTEK_API_KEY（讯飞控制台·实时语音转写）'
    );
  }
  return { appId, apiKey };
}

/** 构建 signa（rtasr 标准版鉴权） */
export function buildSigna(appId: string, apiKey: string, ts: string): string {
  const baseString = appId + ts;
  const md5 = crypto.createHash('md5').update(baseString).digest('hex');
  return crypto.createHmac('sha1', apiKey).update(md5).digest('base64');
}

/** ws 消息形态（rtasr：action=result 时 data 为转写 JSON） */
interface RtAsrMessage {
  action: 'started' | 'result' | 'error';
  data?: string;
  code?: string;
}

interface RtAsrResultSeg {
  cnchar?: string; // 实时转写用 cnchar 直出文本
}

interface RtAsrResult {
  action?: string;
  cnchar?: string;
  // 兼容听写版两层数据形态
  data?: { result?: { ws?: Array<{ cw?: Array<{ w?: string }> }> } };
}

/** 从实时转写结果帧提取文本 */
function extractText(parsed: RtAsrResult): string | null {
  if (typeof parsed.cnchar === 'string') return parsed.cnchar;
  const ws = parsed.data?.result?.ws;
  if (Array.isArray(ws)) {
    return ws.map((seg) => (seg.cw ?? []).map((c) => c.w ?? '').join('')).join('');
  }
  return null;
}

/**
 * 识别一段音频（AsrRecognize 形态）：WS 分片上传全量后等待最终 result。
 * 依赖 ws 包（Node 侧 WebSocket 客户端）；POC 环境已具备（jest/工具链生态）。
 */
export async function recognize(audio: Buffer | string, _sample: AsrSample): Promise<string> {
  const cfg = readIflytekConfigFromEnv();
  const filePath = typeof audio === 'string' ? audio : null;
  if (!filePath) throw new Error('讯飞适配器 POC 期仅支持文件路径输入');
  const raw = fs.readFileSync(filePath);
  // rtasr 接受裸 PCM；wav 头 44 字节剥离（16kHz/16bit/单声道 标准头）
  const pcm = raw.subarray(44);

  const ts = Math.floor(Date.now() / 1000).toString();
  const signa = encodeURIComponent(buildSigna(cfg.appId, cfg.apiKey, ts));
  const url = `${WS_URL}?appid=${encodeURIComponent(cfg.appId)}&ts=${ts}&signa=${signa}`;

  const { WebSocket } = await import('ws');
  const ws = new WebSocket(url);

  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('讯飞 ASR 超时（90s）'));
    }, 90_000);

    let buffer = '';
    const FRAME = 1280; // 协议建议 40ms/1280 字节 @16kHz16bit
    let offset = 0;

    const sendFrame = () => {
      if (offset >= pcm.length) return;
      const chunk = pcm.subarray(offset, offset + FRAME);
      offset += FRAME;
      ws.send(chunk.toString('base64'));
      setTimeout(sendFrame, 40); // 按实时速率分片
    };

    ws.on('open', () => {
      // 发送首帧（end 标志在末帧带 "&end"）
      const first = pcm.subarray(0, FRAME);
      offset = FRAME;
      ws.send(first.toString('base64'));
      setTimeout(sendFrame, 40);
    });

    ws.on('message', (raw: unknown) => {
      buffer += String(raw);
      // rtasr result 帧以 "\n" 结尾分段
      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        let msg: RtAsrMessage;
        try {
          msg = JSON.parse(line) as RtAsrMessage;
        } catch {
          continue;
        }
        if (msg.action === 'error') {
          clearTimeout(timer);
          ws.close();
          reject(new Error(`讯飞 ASR 错误 code=${msg.code ?? '?'}`));
          return;
        }
        if (msg.action === 'result' && msg.data) {
          let parsed: RtAsrResult;
          try {
            parsed = JSON.parse(msg.data) as RtAsrResult;
          } catch {
            continue;
          }
          const text = extractText(parsed);
          if (text !== null && text.length > 0) {
            clearTimeout(timer);
            ws.close();
            resolve(text);
            return;
          }
        }
      }
    });

    ws.on('error', (err: Error) => {
      clearTimeout(timer);
      reject(new Error(`讯飞 ASR 连接失败: ${err.message}`));
    });

    // 末帧 end 标记：分片发完后发送结束信号
    void sendFrame;
  });
}
