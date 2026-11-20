/**
 * @fileoverview POC 评测集样本（选型方案 §5.1）
 * @description ASR 评测 20 句：三类呼叫场景（产品咨询/价格谈判/投诉安抚）×
 *              语气档（清晰/日常/含混），覆盖数字、日期、金额、专有名词
 *              四类易错要素；嘈杂样本 5 段为录制规格清单（SNR 递减），
 *              音频文件由 POC 第 1 天按清单录制/合成后挂载。
 *              TTS 评测 6 句：显式标识播报头（复用 disclosure 常量）+
 *              三类话术各 2 句，验证标识文本合成后的自然度。
 *              CER 评测口径与延迟门槛见选型方案 §5.2。
 * @module lib/voice/eval-dataset
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { AI_DISCLOSURE_TEXT } from '@/lib/compliance/disclosure';

/** 呼叫场景 */
export type CallScenario = 'product_inquiry' | 'price_negotiation' | 'complaint_relief';

/** 语气档：清晰（标准播报）/ 日常（口语化）/ 含混（连读弱化） */
export type ClarityTier = 'clear' | 'casual' | 'slurred';

/** ASR 评测句（reference = 期望转写文本，逐字精确） */
export interface AsrSample {
  id: string;
  scenario: CallScenario;
  tier: ClarityTier;
  /** 覆盖的易错要素标签 */
  features: Array<'number' | 'date' | 'amount' | 'proper_noun' | 'homophone'>;
  /** 参考文本（CER 分母基准，须与朗读稿逐字一致） */
  reference: string;
}

/** ASR 评测集：20 句（产品咨询 7 / 价格谈判 7 / 投诉安抚 6） */
export const ASR_SAMPLES: AsrSample[] = [
  // ── 产品咨询 product_inquiry（7）──
  {
    id: 'asr-001',
    scenario: 'product_inquiry',
    tier: 'clear',
    features: ['number', 'proper_noun'],
    reference: '请问你们的外呼平台支持多少个并发坐席，接入抖音和企业微信的客户线索吗？',
  },
  {
    id: 'asr-002',
    scenario: 'product_inquiry',
    tier: 'clear',
    features: ['number', 'date'],
    reference: '我们公司大概有五十个坐席，计划在下个月十五号之前完成系统上线。',
  },
  {
    id: 'asr-003',
    scenario: 'product_inquiry',
    tier: 'casual',
    features: ['amount', 'number'],
    reference: '那个话术知识库是怎么收费的，按坐席还是按条数，一万条大概要多少钱？',
  },
  {
    id: 'asr-004',
    scenario: 'product_inquiry',
    tier: 'casual',
    features: ['proper_noun', 'homophone'],
    reference: '你们这个意图识别的准确率能到多少，跟阿里云那个语音助手比怎么样？',
  },
  {
    id: 'asr-005',
    scenario: 'product_inquiry',
    tier: 'slurred',
    features: ['number', 'date'],
    reference: '试用版的话，我记得是可以免费用三十天吧，到期之后数据还在不在？',
  },
  {
    id: 'asr-006',
    scenario: 'product_inquiry',
    tier: 'clear',
    features: ['proper_noun'],
    reference: 'WebSocket 实时推送和 MCP 服务这两个能力，是可以同时开启的吗？',
  },
  {
    id: 'asr-007',
    scenario: 'product_inquiry',
    tier: 'casual',
    features: ['number'],
    reference: '一天打八百到一千通电话的话，每天大概会消耗多少个 token？',
  },

  // ── 价格谈判 price_negotiation（7）──
  {
    id: 'asr-008',
    scenario: 'price_negotiation',
    tier: 'clear',
    features: ['amount'],
    reference: '你们报价是每坐席每月一百九十九元，二十个坐席的话总价是多少？',
  },
  {
    id: 'asr-009',
    scenario: 'price_negotiation',
    tier: 'casual',
    features: ['amount', 'number'],
    reference: '如果我们签三年，这个价格能不能打个七五折，首付要付百分之多少？',
  },
  {
    id: 'asr-010',
    scenario: 'price_negotiation',
    tier: 'slurred',
    features: ['amount'],
    reference: '四万九千八这个数有点超预算了，能不能给到三万九千八以内？',
  },
  {
    id: 'asr-011',
    scenario: 'price_negotiation',
    tier: 'clear',
    features: ['date', 'amount'],
    reference: '发票在十二月三十一号之前开出来，付款走对公账户，分三期结清。',
  },
  {
    id: 'asr-012',
    scenario: 'price_negotiation',
    tier: 'casual',
    features: ['homophone', 'amount'],
    reference: '友商那边报的是九万八全包，你们这边的实施费和培训费还另外算吗？',
  },
  {
    id: 'asr-013',
    scenario: 'price_negotiation',
    tier: 'slurred',
    features: ['number'],
    reference: '先上一百个坐席试试效果，跑通了明年再扩到五百个。',
  },
  {
    id: 'asr-014',
    scenario: 'price_negotiation',
    tier: 'clear',
    features: ['amount'],
    reference: '预算就这么多，八万八封顶了，超出的部分今年真的批不下来。',
  },

  // ── 投诉安抚 complaint_relief（6）──
  {
    id: 'asr-015',
    scenario: 'complaint_relief',
    tier: 'slurred',
    features: ['number', 'date'],
    reference: '我三天前就提交了工单，到现在都没有人回复，这已经不是第一次了。',
  },
  {
    id: 'asr-016',
    scenario: 'complaint_relief',
    tier: 'casual',
    features: ['homophone', 'proper_noun'],
    reference: '你们外呼机器人半夜十一点还在给我客户打电话，这个投诉我要正式提上去。',
  },
  {
    id: 'asr-017',
    scenario: 'complaint_relief',
    tier: 'clear',
    features: ['date'],
    reference: '今天是一月八号，按照你们承诺的四十八小时响应，早就超时了。',
  },
  {
    id: 'asr-018',
    scenario: 'complaint_relief',
    tier: 'slurred',
    features: ['number', 'homophone'],
    reference: '转接了四次人工，等了二十多分钟，每一次都要我重复一遍问题。',
  },
  {
    id: 'asr-019',
    scenario: 'complaint_relief',
    tier: 'casual',
    features: ['proper_noun'],
    reference: '把你们负责人电话给我，或者让你们经理直接联系我，号码是一三九开头的那个。',
  },
  {
    id: 'asr-020',
    scenario: 'complaint_relief',
    tier: 'clear',
    features: ['date', 'amount'],
    reference: '这单涉及两万三千块的争议金额，请务必在周五下班前给我处理方案。',
  },
];

/** 嘈杂样本录制规格（SNR 递减；音频由 POC 第 1 天按此清单录制/合成挂载） */
export interface NoiseSampleSpec {
  id: string;
  /** 基于 which 基准句叠加噪声 */
  basedOn: string;
  /** 信噪比（dB），递减模拟真实线路劣化 */
  snrDb: number;
  /** 噪声类型（录制说明） */
  noise: string;
}

export const NOISE_SAMPLE_SPECS: NoiseSampleSpec[] = [
  { id: 'noise-01', basedOn: 'asr-008', snrDb: 15, noise: '办公室键盘与交谈底噪' },
  { id: 'noise-02', basedOn: 'asr-002', snrDb: 10, noise: '街道车流环境声' },
  { id: 'noise-03', basedOn: 'asr-010', snrDb: 6, noise: '商场/餐厅人声嘈杂' },
  { id: 'noise-04', basedOn: 'asr-018', snrDb: 3, noise: '移动网络通话压缩劣化（8kHz 重采样叠加）' },
  { id: 'noise-05', basedOn: 'asr-016', snrDb: 0, noise: '极端场景：嘈杂 + 口音偏移' },
];

/** TTS 评测句（显式播报头 + 三类话术各 2 句） */
export interface TtsSample {
  id: string;
  scenario: CallScenario;
  /** 是否已含显式标识播报头（tts-open 系列由评测脚本注入 AI_DISCLOSURE_TEXT） */
  withDisclosure: boolean;
  text: string;
}

/** 显式标识播报头（复用 M1 disclosure 常量，保证与生产链路同源） */
export const TTS_DISCLOSURE_PREFIX = AI_DISCLOSURE_TEXT;

export const TTS_SAMPLES: TtsSample[] = [
  // 开场（含标识头）：验证「您好，本次通话由 YYC³ 智能语音助手为您服务。」合成后的自然度与节奏
  {
    id: 'tts-open-1',
    scenario: 'product_inquiry',
    withDisclosure: true,
    text: '感谢您接听来电，想用三分钟为您介绍我们的智能外呼平台，现在方便吗？',
  },
  {
    id: 'tts-open-2',
    scenario: 'complaint_relief',
    withDisclosure: true,
    text: '您好，这里是客户服务中心，关于您反馈的问题我们这边已经记录，马上为您核实处理。',
  },

  // 产品咨询话术
  {
    id: 'tts-consult-1',
    scenario: 'product_inquiry',
    withDisclosure: false,
    text: '平台支持电话、企业微信、短信多通道触达，客户画像会在通话结束后十分钟内自动更新。',
  },
  {
    id: 'tts-consult-2',
    scenario: 'product_inquiry',
    withDisclosure: false,
    text: '意向客户的判断标准可以自定义，比如提及价格、询问功能、约定时间三类信号都会自动标记。',
  },

  // 价格谈判话术
  {
    id: 'tts-price-1',
    scenario: 'price_negotiation',
    withDisclosure: false,
    text: '年度合约可以享受八五折优惠，折算下来每坐席每月一百六十九元，比月付节省百分之十五。',
  },
  {
    id: 'tts-price-2',
    scenario: 'price_negotiation',
    withDisclosure: false,
    text: '这笔预算建议分两期申报，第一期先覆盖五十个坐席，第二期根据使用数据再扩容。',
  },

  // 投诉安抚话术
  {
    id: 'tts-relief-1',
    scenario: 'complaint_relief',
    withDisclosure: false,
    text: '非常抱歉给您带来了不好的体验，我已经将您的问题标记为最高优先级，两小时内会有专员与您联系。',
  },
  {
    id: 'tts-relief-2',
    scenario: 'complaint_relief',
    withDisclosure: false,
    text: '您反馈的情况我们逐条核实过了，补偿方案会在三个工作日内以短信形式发送给您。',
  },
];

/** 嘈杂样本音频挂载目录约定（POC 第 1 天填充 wav/mp3 后由评测脚本读取） */
export const AUDIO_ASSET_DIR = 'lib/voice/eval-assets';
