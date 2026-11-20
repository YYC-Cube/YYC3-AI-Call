# POC 供应商开通与执行手册（五维评分决策会前置）

> 上游：《[YYC3-语音供应商-选型方案](./YYC3-语音供应商-选型方案.md)》§六。
> 分工：**开通（人工，约 30 分钟）→ 本手册命令（自动化）→ 报告 JSON 落盘 → 决策会**。
> 所有评测命令可复跑；报告按时间戳归档，不入库主观材料。

## 一、控制台开通清单（人工，逐家）

| # | 平台 | 开通路径 | 获取凭证 | 预估耗时 |
|---|---|---|---|---|
| 1 | 火山引擎·豆包语音 | https://console.volcengine.com/speech/app → 创建应用 → 勾选「录音文件识别极速版」 | 应用详情页 `APP ID` + `Access Token` | 10 分钟（含实名与试用开通） |
| 2 | 讯飞·实时语音转写 | https://console.xfyun.cn/services/rtasr → 领取免费试用包（或购买服务量） | 「我的应用」`APPID` + 该服务 `APIKey` | 10 分钟 |
| 3 | 阿里云百炼·CosyVoice | https://bailian.console.aliyun.com → 模型广场开通 `cosyvoice-v3.5-flash` → API-KEY 管理 | `DASHSCOPE_API_KEY` | 10 分钟 |

## 二、凭证配置

```bash
cp .env.poc.example .env.poc   # 填入三家凭证（模板含逐行注释与控制台路径）
set -a; source .env.poc; set +a
```

`.env.poc` 已被 `.gitignore` 排除；凭证不入仓库。

## 三、评测执行（全自动，报告落盘 docs/YYC3-项目闭环-验收系统/reports/poc/）

```bash
# ASR：火山主线（20 句 + 5 嘈杂，含 submit/query 轮询）
pnpm tsx scripts/poc-eval.ts --mode asr --vendor volcengine --audio-dir ./poc-assets/asr

# ASR：讯飞对照（WS 分片实时链路）
pnpm tsx scripts/poc-eval.ts --mode asr --vendor iflytek --audio-dir ./poc-assets/asr

# TTS：CosyVoice（8 句合成 → poc-assets/tts/ 落盘供 MOS 听测）
pnpm tsx scripts/poc-eval.ts --mode tts
```

报告文件命名：`poc-asr-volcengine-<YYYYMMDDHHmm>.json` / `poc-tts-cosyvoice-<ts>.json`，
含：avgCer / cerPassRate / 首字 P95 / 门槛判定（passed）/ 三态延迟快照。

## 四、评测后（决策会输入）

1. 三份 JSON 报告合入决策材料（脚本自动落盘，人工无搬运）；
2. TTS 音频（poc-assets/tts/*.mp3）发 5 位评测员做 MOS 听测（≥4.0 门槛），评分回填报告 manualItems；
3. 按《选型方案》§四 五维权重表打分 → §六 流程定主备 → 决策记录写入选型方案变更历史。

## 五、故障排查

| 症状 | 处置 |
|---|---|
| 「凭证缺失」 | `.env.poc` 未 source 或变量名拼错；`echo $VOLC_ASR_APP_KEY` 核验 |
| 火山 submit HTTP 401/403 | 应用未勾选「极速版」服务，或 Resource-Id 与控制台不符（适配器 `X-Api-Resource-Id` 可按控制台显示调整） |
| 讯飞 401（signa 校验失败） | APIKey 需为「实时语音转写」服务的 Key（非其他服务），APPID/APIKey 需同应用 |
| 首字延迟普遍超标 | 检查服务器区域与供应商Endpoint 同域（国内服务器访问国内端点）；POC 门槛为放宽档，区域一致后复测 |
