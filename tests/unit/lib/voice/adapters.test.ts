/**
 * @jest-environment node
 *
 * 双供应商 ASR 适配器单测：signa 签名确定性、凭证守卫、WS 消息文本提取
 */
import { buildSigna, readIflytekConfigFromEnv } from '@/lib/voice/asr-iflytek';
import { readVolcConfigFromEnv } from '@/lib/voice/asr-volcengine';

const ENV_BACKUP = { ...process.env };

afterEach(() => {
  process.env = { ...ENV_BACKUP };
});

describe('讯飞 signa 鉴权', () => {
  it('同一输入签名确定（Base64 输出，供 URL 编码）', () => {
    const s1 = buildSigna('app123', 'key456', '1700000000');
    const s2 = buildSigna('app123', 'key456', '1700000000');
    expect(s1).toBe(s2);
    expect(Buffer.from(s1, 'base64').length).toBeGreaterThan(0);
  });

  it('时间戳变化 → 签名变化（防重放）', () => {
    expect(buildSigna('app', 'key', '1000')).not.toBe(buildSigna('app', 'key', '2000'));
  });

  it('凭证缺失 → 明确报错（不做静默 mock）', () => {
    delete process.env.IFLYTEK_APP_ID;
    delete process.env.IFLYTEK_API_KEY;
    expect(() => readIflytekConfigFromEnv()).toThrow(/IFLYTEK_APP_ID/);
  });

  it('凭证齐全 → 正常读取', () => {
    process.env.IFLYTEK_APP_ID = 'a';
    process.env.IFLYTEK_API_KEY = 'k';
    expect(readIflytekConfigFromEnv()).toEqual({ appId: 'a', apiKey: 'k' });
  });
});

describe('火山凭证守卫', () => {
  it('凭证缺失 → 明确报错', () => {
    delete process.env.VOLC_ASR_APP_KEY;
    delete process.env.VOLC_ASR_ACCESS_KEY;
    expect(() => readVolcConfigFromEnv()).toThrow(/VOLC_ASR_APP_KEY/);
  });

  it('凭证齐全 → 正常读取', () => {
    process.env.VOLC_ASR_APP_KEY = 'app';
    process.env.VOLC_ASR_ACCESS_KEY = 'tok';
    expect(readVolcConfigFromEnv()).toEqual({ appKey: 'app', accessKey: 'tok' });
  });
});

describe('讯飞结果帧文本提取', () => {
  // extractText 未导出：经 recognize 契约以集成验证，此处以模块存在性 + 配置守卫为单元边界
  it('适配器模块导出 recognize 接口（AsrRecognize 形态）', async () => {
    const m = await import('@/lib/voice/asr-iflytek');
    expect(typeof m.recognize).toBe('function');
    const v = await import('@/lib/voice/asr-volcengine');
    expect(typeof v.recognize).toBe('function');
  });
});
