/**
 * @fileoverview AI 生成内容标识（显式播报 + 隐式元数据）
 * @description 依据《人工智能生成合成内容标识办法》（2025-09-01 施行）：
 *              §4 显式标识——文本起始位置添加提示；§5 隐式标识——元数据写入
 *              服务提供者名称/编码、内容编号等制作要素。
 *              显式标识文案可按场景定制，但不可关闭（无开关）。
 * @module lib/compliance/disclosure
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

/** 显式标识默认播报文本（置于语音/文本内容起始，不可关闭） */
export const AI_DISCLOSURE_TEXT = '您好，本次通话由 YYC³ 智能语音助手为您服务。';

/** 隐式标识：服务提供者名称（办法 §5） */
export const AI_PROVIDER_NAME = 'YYC³ AI Intelligent Calling';

/** 隐式标识：服务提供者编码（办法 §5） */
export const AI_PROVIDER_CODE = 'YYC3-VOICE-01';

/** 隐式标识元数据结构（办法 §5 制作要素） */
export interface AIDisclosureMetadata {
  /** 是否 AI 生成（恒为 true，无关闭开关） */
  aiGenerated: true;
  /** 服务提供者名称 */
  provider: string;
  /** 服务提供者编码 */
  providerCode: string;
  /** 内容编号（关联外呼任务/通话，审计可追溯） */
  contentId: string;
  /** 标识依据（便于审计溯源） */
  basis: string;
}

/**
 * 构建隐式标识元数据。
 * @param contentId 内容编号（通话 ID 或外呼任务 ID）
 */
export function buildDisclosureMetadata(contentId: string): AIDisclosureMetadata {
  return {
    aiGenerated: true,
    provider: AI_PROVIDER_NAME,
    providerCode: AI_PROVIDER_CODE,
    contentId,
    basis: '人工智能生成合成内容标识办法 §4/§5',
  };
}

/**
 * 为播报文本添加显式标识（置于起始位置）。
 * 幂等：若已含标识前缀则不重复添加。
 */
export function applyExplicitDisclosure(text: string): string {
  if (text.startsWith(AI_DISCLOSURE_TEXT)) return text;
  return AI_DISCLOSURE_TEXT + text;
}
