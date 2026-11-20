---
file: YYC3-语音供应商-选型方案.md
description: V1 语音管线级联埋点与 V2 客户端上报的前置供应商选型方案 — 路线决策、候选矩阵（带来源价格）、五维评估、POC 评测口径（复用 M2 延迟指标）与双供应商主备决策流程
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-20
updated: 2026-11-20
status: stable
tags: [供应商选型, 语音管线, ASR, TTS, POC评测]
category: implementation-plan
language: zh-CN
audience: developers,devops,managers,stakeholders
complexity: intermediate
project: yyc3-ai-dev
phase: production
---

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_

# YYC³ 语音供应商选型方案（V1/V2 前置）

> 上游：《[YYC3-合规引擎-延迟埋点-落地方案](./YYC3-合规引擎-延迟埋点-落地方案.md)》§四 V1（语音管线级联埋点）/ V2（客户端上报通道）——均以「真实语音供应商接入」为启动条件，本方案补齐该前置决策。
> 原则：**只写实测与带来源数据**；延迟口径直接复用 M2 已落地的埋点指标，POC 结论可量化、可复跑。

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 一、选型目标与约束

### 1.1 V1/V2 回顾（摘自落地方案 §四）

| 任务 | 交付 | 启动条件 |
|---|---|---|
| V1 | ASR 首字 / 通话 E2E / barge-in 三指标随真实 ASR/TTS 接入落地；各段直方图 + 预算分配校验 | **ASR/TTS 供应商选定** |
| V2 | `lib/telemetry/latency-client.ts` + `/api/telemetry/latency` + Redis 缓冲 | 语音客户端存在（依赖 V1） |

### 1.2 硬约束（来自既有闭环）

| 约束 | 来源 | 对选型的含义 |
|---|---|---|
| 延迟预算：ASR 首字 ≤300ms + LLM TTFT ≤200ms + TTS 首包 ≤200ms + 网络 ≤100ms = **E2E ≤800ms** | M2 指标体系（对标 Retell 600ms） | 各段供应商必须提供**流式接口**与可实测首包延迟 |
| barge-in 响应 ≤200ms | Retell 140ms / PolyAI 190ms 对标 | ASR 流式 + TTS 可中断（或供应商侧打断信号） |
| AI 双标识：显式播报头（不可关闭）+ 隐式元数据（provider/providerCode/contentId） | M1-C3（办法 §4/§5） | TTS 输出链路必须保留元数据写入口；供应商变更**不动标识代码**（已按结果组装层隔离） |
| 录音留存 30 日 + 五道闸预呼 | M1-C5/C2 | 通话音频落存储由本项目管理，供应商不承担留存合规 |
| LLM 复用现有链路：`AI_BASE_URL` OpenAI 兼容端点（ChatGLM 生态）+ ai-hub 1.4.0 抽象（peer: openai/ollama） | lib/ai-client.ts / ai-hub package.json 实测 | **路线 B（自组级联）只需选 ASR+TTS**，LLM 段复用现有投资 |

### 1.3 现状挂接点（已核实）

- `lib/multimodal/audio-processor.ts`：`transcribeAudio`/`synthesizeSpeech` 为模拟实现，接口形状已定型（`MediaInput`/`AudioProcessingResult`）——供应商适配器实现同接口即可热替换；
- `lib/observability`：`yyc3_asr_first_token_ms`/`yyc3_call_e2e_latency_ms`/`yyc3_bargein_response_ms` 指标名与 SLO 常量已就绪，POC 直接用 `buildLatencySnapshot` 出分；
- `@yyc3/*` 为 file: 本地包（升级流程见[运维 166 号清单](../YYC3-AI-Call-运维阶段/166-YYC3-AI-Call-运维阶段-依赖升级核对清单.md)）。

---

## 二、路线决策：端到端平台 vs 自组级联

| 维度 | 路线 A：端到端平台 | 路线 B：自组级联（ASR + 现有 LLM + TTS） |
|---|---|---|
| 代表 | Deepgram Voice Agent API（$4.50/h 打包）、OpenAI Realtime（$32/1M 音频输入 token）、PolyAI（$0.02/min + 文本 token） | 火山豆包流式 ASR + ChatGLM + CosyVoice/豆包 TTS |
| 延迟 | 平台内调优（Deepgram 主打低延迟；Retell 600ms 为行业标杆） | 取决于分段选型，**预算分配可测可控** |
| 成本 | 打包价简单但绑定深（OpenAI token 计费对长通话偏贵） | 按段议价，**LLM 段复用现有 GPU 端点零边际成本** |
| 合规 | 数据出境/驻留需逐家核查（国内商用风险） | 国内云厂商（火山/阿里/讯飞）数据驻留明确；**AI 标识元数据自有管线直写** |
| 与现有架构 | ai-hub 抽象面向 ASR/LLM/TTS 分段接口，平台路线需整层适配 | 与 ai-hub「多供应商路由」演进方向（落地方案 §八-8）**同构** |
| 锁定风险 | 高（对话状态、打断逻辑在平台侧） | 低（各段可替换，天然支撑双供应商主备） |

**决策：主路线 B（自组级联），路线 A 作为 POC 对标基线**。理由：①LLM 段复用既有 ChatGLM 端点（落地方案 §八-8 成本透明化路径）；②AI 标识/录音留存等合规件在自有管线内闭环；③供应商可插拔与双供应商主备（五高-高可用演进项 1）是既定方向。路线 A 数值（Retell 600ms/Deepgram $4.50/h）作为评分锚点。

---

## 三、候选供应商矩阵（价格均带来源，检索日 2026-11-20）

### 3.1 ASR 档（流式语音识别）

| 供应商/产品 | 计费 | 关键能力 | 数据驻留 | 来源 |
|---|---|---|---|---|
| **火山引擎·豆包流式语音识别**（首选候选） | 模型定价 4.5 元/小时；2.0 资源包折算 **0.88 元/小时**（万小时包） | 流式识别、录音文件识别 2.0（0.8 元/小时、多模态理解） | 国内（火山方舟北京区） | [AI Hub 模型页](https://ai.volcengine.com/model)、[豆包语音计费](https://www.volcengine.com/docs/6561/1359370?lang=en) |
| 讯飞开放平台·在线流式识别 | 套餐制（语音合成 50 万次 ¥1400 档参考；ASR 套餐同构） | 中文识别强项、电话 8k 采样专用模型（**待验证**具体流式首字延迟） | 国内 | [讯飞活动页](https://www.xfyun.cn/activities/promotion) |
| Deepgram Nova-3 streaming | **$0.0077/min** PAYG（Growth $0.0065） | 低延迟 turn-taking、Keyterm 提示词 | 境外（对标锚点，非国内首选） | [Deepgram vs AssemblyAI](https://idealogic.io/blog/deepgram-vs-assemblyai) |

### 3.2 TTS 档（语音合成）

| 供应商/产品 | 计费 | 关键能力 | 数据驻留 | 来源 |
|---|---|---|---|---|
| **阿里云·CosyVoice v3.5-flash**（首选候选） | **$0.116/万字**（≈0.83 元/万字，北京区） | 高性能流式合成、flash 档主打低首包 | 国内（北京）+ 新加坡双区 | [Model Studio 模型页](https://www.alibabacloud.com/help/en/model-studio/cosyvoice-v3-5-flash) |
| 阿里云·CosyVoice v3-plus | $0.287/万字 | 更高质量档（音色克隆方向） | 同上 | [v3-plus 模型页](https://www.alibabacloud.com/help/en/model-studio/cosyvoice-v3-plus) |
| 阿里云 ISI·流式文本语音合成 | 1.00 元/万字（无梯度） | 老牌流式合成、与 ISI 生态互通 | 国内 | [ISI 计费](https://help.aliyun.com/zh/isi/product-overview/billing-10) |
| ElevenLabs（对标锚点） | $0.10/min + LLM（订阅 $6–990/月） | voice cloning、多语言真实度标杆 | 境外；SOC2/HIPAA/GDPR | 复测报告 §5.2（来源 5/6） |

### 3.3 端到端档（POC 对标基线，非主流选）

| 平台 | 打包价 | 备注 | 来源 |
|---|---|---|---|
| Deepgram Voice Agent API | **$4.50/h**（STT+LLM 编排+TTS 一口价，$200 免费额度） | 低延迟预算口径锚点 | [Sciencx 2026 对比](https://www.scien.cx/2026/06/26/voice-agent-apis-in-2026-compared-which-one-actually-hears-your-users/) |
| OpenAI GPT-Realtime-2 | $32/1M 音频输入 token（缓存 $0.40）+ $64/1M 输出；Translate $0.034/min | 端到端语音大模型路线样本 | [OpenAI 官宣](https://openai.com/zh-Hans-CN/index/advancing-voice-intelligence-with-new-models-in-the-api/) |
| PolyAI Dialog-RSN-1 | $0.02/min connected + 文本 token | audio-native turn-taking（barge-in 190ms） | [Cekura 2026 榜](https://www.cekura.ai/blogs/best-voice-ai-apis-real-time-audio-processing) |

### 3.4 LLM 段（不重选，复用）

`AI_BASE_URL`（OpenAI 兼容）指向现有 ChatGLM 端点；POC 期间 LLM 段延迟即为 M2 已埋 `yyc3_chat_ttft_ms` 现网数据，无需另测。

---

## 四、五维评估与权重

| 维度 | 权重 | 评分要点 | 数据来源 |
|---|---|---|---|
| **时间维（性能）** | 35% | ASR 流式首字实测、TTS 首包实测、E2E 合成延迟、断线重连恢复 | POC 实测（§五） |
| **属性维（质量）** | 25% | ASR 字错率 CER（评测集）、TTS MOS 主观评分（≥4.0 目标）、中文数字/日期读法正确性 | POC 实测 |
| **空间维（部署与数据）** | 20% | 国内区可用性、数据驻留承诺、SLA 与限流（QPS） | 官方文档核对 |
| **事件维（交互）** | 12% | barge-in 打断信号支持、中间结果（partial）粒度、时间戳/端点检测 | POC 实测 + 文档 |
| **关联维（集成）** | 8% | WebSocket/SDK 与 Next.js 服务端适配度、计费透明度、与 ai-hub 适配器工作量 | 工程评估 |

---

## 五、POC 评测方案（两周，口径复用 M2）

### 5.1 评测集

- 中文呼叫场景 20 句（产品咨询/价格谈判/投诉安抚各档），含数字、日期、金额、专有名词；
- 嘈杂环境样本 5 段（SNR 递减）；
- TTS 评测文本 = 显式标识播报头 + 3 类话术各 2 句（验证标识文本合成后的自然度）。

### 5.2 实测口径（直接落 V1 埋点，POC 结束即 V1 交付一半）

| 指标 | 已就绪载体 | 通过门槛（POC） |
|---|---|---|
| ASR 流式首字 | `observeLatency(METRICS.ASR_FIRST_TOKEN_MS, ...)` | **≤500ms**（预算 300ms，POC 放宽一档；上线前收紧） |
| TTS 首包 | `METRICS.TTS_PROCESSING_MS`（已有） | **≤300ms**（同上） |
| E2E 合成 | `METRICS.CALL_E2E_LATENCY_MS` | ≤800ms（SLO 原值） |
| barge-in | `METRICS.BARGEIN_RESPONSE_MS` | ≤250ms（POC 档） |
| CER | 评测脚本离线比对 | ≤8%（电话场景中文行业常见区间；精确基线 POC 中建立） |
| MOS | 5 人主观听测 | ≥4.0 |

判定用 `buildLatencySnapshot` 出报告（三态：达标/超标/暂无数据），POC 数据随报告归档。

### 5.3 适配器工作量预估

- `lib/voice/asr-<vendor>.ts` / `lib/voice/tts-<vendor>.ts`：实现与 audio-processor 相同接口（约各 150 行）；
- V2 上报通道随 POC 客户端一并落地（`/api/telemetry/latency` + Redis 缓冲）。

---

## 六、决策流程与主备结构

```
第 1 周：两家候选并行接入（火山 ASR + 阿里 TTS 为主线；讯飞 ASR / ISI TTS 为对照组）
         → 各自跑评测集 → 延迟快照 + CER/MOS 报告
第 2 周：五维评分 → 主备定序（主：综合分最高；备：异构厂商，避免同云故障绑定）
         → 商务询价（资源包价对比 PAYG）→ 决策会（依据 §四 权重表）
出口门：主备两家均通过 POC 门槛；任一不达标则第三家顺位补位
```

主备切换设计对齐五高-高可用项 1：ai-hub 供应商抽象 + 健康探测，主供应商连续失败 N 次自动切备（复用 Redis 既有降级分支模式）。

---

## 七、V1/V2 启动条件确认（本方案输出后即满足）

| 条件 | 状态 |
|---|---|
| ASR/TTS 候选清单与定价（带来源） | ✅ 本方案 §三 |
| 评测口径与通过门槛 | ✅ 本方案 §五（复用 M2 指标） |
| 合规约束核对单 | ✅ 本方案 §1.2 |
| 决策流程与主备结构 | ✅ 本方案 §六 |
| 评测集样本 | ✅ **已构建（2026-11-20）**：[lib/voice/eval-dataset.ts](../../lib/voice/eval-dataset.ts)（ASR 20 句 7/7/6 × 三档位、五要素覆盖；嘈杂 5 段规格；TTS 标识头同源常量）+ [eval.ts](../../lib/voice/eval.ts)（CER 编辑距离/指标直通/门槛判定，15 用例）+ [runner 骨架](../../scripts/poc-eval.ts)（适配器注册表冒烟通过）+ [挂载规格](../../lib/voice/eval-assets/README.md) |

POC 启动后 V1 预估 1 周内交付（埋点已就绪，仅接真实 SDK），V2 随语音客户端同周交付。

---

## 八、数据来源清单（检索日 2026-11-20）

1. https://ai.volcengine.com/model （豆包流式语音识别 4.5 元/小时、录音识别 2.0 0.8 元/小时）
2. https://www.volcengine.com/docs/6561/1359370?lang=en （豆包流式 ASR 2.0 万小时包 0.88 元/小时）
3. https://www.alibabacloud.com/help/en/model-studio/cosyvoice-v3-5-flash （CosyVoice v3.5-flash $0.116/万字）
4. https://www.alibabacloud.com/help/en/model-studio/cosyvoice-v3-plus （v3-plus $0.287/万字）
5. https://help.aliyun.com/zh/isi/product-overview/billing-10 （ISI 流式合成 1 元/万字）
6. https://www.xfyun.cn/activities/promotion （讯飞套餐价；流式延迟待 POC 实测）
7. https://www.scien.cx/2026/06/26/voice-agent-apis-in-2026-compared-which-one-actually-hears-your-users/ （Deepgram Voice Agent $4.50/h）
8. https://idealogic.io/blog/deepgram-vs-assemblyai （Nova-3 streaming $0.0077/min）
9. https://openai.com/zh-Hans-CN/index/advancing-voice-intelligence-with-new-models-in-the-api/ （GPT-Realtime-2 token 计价）
10. https://www.cekura.ai/blogs/best-voice-ai-apis-real-time-audio-processing （PolyAI $0.02/min）
11. 上轮调研（复测报告 §5.3）：Retell 600ms/TTFT 180ms/barge-in 140ms、Vapi $0.05/min 编排费、ElevenLabs $0.10/min

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| --- | --- | --- | --- |
| v1.0.0 | 2026-11-20 | 首次发布：路线决策（主 B 级联/A 对标）、三档候选矩阵（带来源定价）、五维权重、POC 评测口径（复用 M2 指标）与双供应商主备流程；V1/V2 启动条件确认 | YYC³ Team |
| v1.1.0 | 2026-11-20 | **POC 评测集构建完成（§七 末项转 ✅）**：eval-dataset（ASR 20 句 7/7/6 三场景×三档位、数字/日期/金额/专名/谐音五要素、嘈杂 5 段 SNR 15→0 递减规格；TTS 标识头同源 disclosure 常量 + 三话术各 2）+ eval.ts（CER 编辑距离、延迟直通 M2 `asr_first_token_ms`、POC 门槛判定）+ poc-eval.ts runner 骨架（适配器注册表）+ eval-assets 挂载规格；评测引擎 15 用例全绿，tsc 0 / lint ≤450 预算 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
