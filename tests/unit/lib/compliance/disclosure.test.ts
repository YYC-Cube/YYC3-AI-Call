/**
 * AI 生成内容标识单测：显式播报 + 隐式元数据（办法 §4/§5）
 * 并覆盖 audio-processor.synthesizeSpeech 的双标识注入
 */
import '@testing-library/jest-dom';
import {
  AI_DISCLOSURE_TEXT,
  AI_PROVIDER_NAME,
  AI_PROVIDER_CODE,
  applyExplicitDisclosure,
  buildDisclosureMetadata,
} from '@/lib/compliance/disclosure';
import { audioProcessor } from '@/lib/multimodal/audio-processor';
import { MediaType, AudioProcessingTask } from '@/lib/multimodal/types';

describe('disclosure 显式/隐式标识', () => {
  it('显式标识默认文案存在且包含 AI 声明', () => {
    expect(AI_DISCLOSURE_TEXT).toContain('智能语音助手');
  });

  it('applyExplicitDisclosure 在起始位置添加提示', () => {
    const out = applyExplicitDisclosure('我们的产品价格是…');
    expect(out.startsWith(AI_DISCLOSURE_TEXT)).toBe(true);
    expect(out.endsWith('我们的产品价格是…')).toBe(true);
  });

  it('applyExplicitDisclosure 幂等（不重复叠加前缀）', () => {
    const once = applyExplicitDisclosure('你好');
    const twice = applyExplicitDisclosure(once);
    expect(twice).toBe(once);
    expect(twice.match(new RegExp(AI_DISCLOSURE_TEXT, 'g'))).toHaveLength(1);
  });

  it('buildDisclosureMetadata 齐全（aiGenerated 恒 true + 提供者 + 内容编号）', () => {
    const m = buildDisclosureMetadata('call-123');
    expect(m.aiGenerated).toBe(true);
    expect(m.provider).toBe(AI_PROVIDER_NAME);
    expect(m.providerCode).toBe(AI_PROVIDER_CODE);
    expect(m.contentId).toBe('call-123');
    expect(m.basis).toContain('标识办法');
  });
});

describe('synthesizeSpeech 标识注入', () => {
  it('TTS 输出带显式播报头 + 隐式元数据（contentId 透传）', async () => {
    const result = await audioProcessor.processAudio(
      {
        type: MediaType.AUDIO,
        format: 'mp3',
        // MediaInput.data 声明为 Buffer|string，TTS 链路运行时传 { text }（audio-processor 内部断言）
        data: { text: '产品报价为每坐席每月 199 元。' } as unknown as string,
        metadata: { contentId: 'call-abc' },
      },
      AudioProcessingTask.SYNTHESIZE_SPEECH
    );

    expect(result.success).toBe(true);
    expect(result.data?.text?.startsWith(AI_DISCLOSURE_TEXT)).toBe(true);
    expect(result.data?.features?.aiGenerated).toBe(true);
    expect(result.data?.features?.providerCode).toBe(AI_PROVIDER_CODE);
    expect(result.data?.features?.contentId).toBe('call-abc');
  });

  it('未提供 contentId 时使用 tts- 前缀兜底编号', async () => {
    const result = await audioProcessor.processAudio(
      { type: MediaType.AUDIO, format: 'mp3', data: { text: '测试' } as unknown as string },
      AudioProcessingTask.SYNTHESIZE_SPEECH
    );
    expect(result.data?.features?.contentId).toMatch(/^tts-/);
  });
});
