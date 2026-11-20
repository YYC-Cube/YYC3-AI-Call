/**
 * @fileoverview 合规引擎集中配置（监管口径单点收敛）
 * @description 所有随监管口径变动的参数（留存天数、禁拨时段、频次上限）
 *              只允许在此处配置；变更须同步写入 AuditLog 与文档变更历史。
 *
 *              口径依据：
 *              - 营销外呼官方号码：工信部 2025-08-01 三大运营商规范（10001/10085/10016）
 *              - AI 内容标识：《人工智能生成合成内容标识办法》2025-09-01 施行
 *              - 录音留存 ≥30 日：行业执法口径（待验证项，单点收敛于此）
 * @module lib/compliance/config
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

export interface ComplianceConfig {
  /** 录音留存天数（≥30 日口径；到期由清理任务置空 recordingUrl） */
  recordingRetentionDays: number;
  /** 营销外呼禁拨时段（本地时区闭开区间 [start, end)，支持跨午夜） */
  quietHours: { start: string; end: string };
  /** 时段判定所用 IANA 时区 */
  timezone: string;
  /** 单号码日呼上限默认值（PhoneNumber.dailyLimit 未设置时的兜底） */
  defaultDailyLimit: number;
  /** 频次计数 Redis 键 TTL（秒），覆盖跨天窗口 */
  frequencyKeyTtlSeconds: number;
}

export const COMPLIANCE_CONFIG: ComplianceConfig = {
  recordingRetentionDays: 30,
  quietHours: { start: '21:00', end: '09:00' },
  timezone: 'Asia/Shanghai',
  defaultDailyLimit: 3,
  frequencyKeyTtlSeconds: 25 * 60 * 60,
};

/** 合规配置不可变（防止运行时误改绕过单点管理） */
export function getComplianceConfig(): Readonly<ComplianceConfig> {
  return COMPLIANCE_CONFIG;
}
