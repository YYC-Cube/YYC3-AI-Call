# POC 供应商开通与执行手册（五维评分决策会前置）

> 上游：《[YYC3-语音供应商-选型方案](./YYC3-语音供应商-选型方案.md)》§六。
> 分工：**开通（人工，约 30 分钟）→ 本手册命令（自动化）→ 报告 JSON 落盘 → 决策会**。
> 所有评测命令可复跑；报告按时间戳归档，不入库主观材料。

## 一、控制台开通清单（人工，逐家；信息核实日 2026-11-20）

### 1. 火山引擎·豆包语音（ASR 主线）——约 10 分钟

前置：火山引擎账号（注册 https://www.volcengine.com ）+ 企业/个人实名认证（控制台账号中心办理，付费服务必需）。

| 步骤 | 操作 | 核验点 |
|---|---|---|
| 1.1 | 登录控制台 → 搜索「豆包语音」或直达 https://console.volcengine.com/speech/app | 进入「语音技术-豆包语音」应用列表 |
| 1.2 | 「开通管理」中开通**录音文件识别极速版**（bigmodel 模型）——旧版控制台路径；新版控制台在「开通管理」勾选对应模型能力 | 应用列表出现已开通服务标识 |
| 1.3 | 创建应用（名称随意，如 `yyc3-poc`） | 应用详情页可访问 |
| 1.4 | 获取凭证：**旧版控制台**取 `APP ID` + `Access Token`（适配器 Header：`X-Api-App-Key` / `X-Api-Access-Key`）；**新版控制台**取 `API Key`（仅 `X-Api-Key` 单头即可） | 两个值可复制 |
| 1.5 | 记录「极速版」`X-Api-Resource-Id`（适配器默认 `volc.bigasr.auc_turbo`，如控制台显示不同需同步改 [asr-volcengine.ts](../../lib/voice/asr-volcengine.ts)） | 与适配器常量一致 |

> 凭证对应关系（[火山控制台 FAQ](https://docs.volcengine.com/docs/6561/196768)、[极速版 API](https://www.volcengine.com/docs/6561/1631584)）：旧版 `X-Api-App-Key=APP ID`、`X-Api-Access-Key=Access Token`；新版简化为单 `X-Api-Key`。

### 2. 讯飞开放平台·实时语音转写（ASR 对照）——约 10 分钟

前置：讯飞账号（https://www.xfyun.cn 注册）+ **实名认证**（个人即可，领取试用必备）。

| 步骤 | 操作 | 核验点 |
|---|---|---|
| 2.1 | 进入 https://www.xfyun.cn/services/rtasr_standard → 「免费试用 15 天」领取 | 每账号可领 **1 路授权 / 24 小时时长 / 15 天有效**（[试用规则](https://wuhan.xfyun.cn/doc/asr/rtasr/API.html)）——POC 25 句约 5 分钟音频，试用额度充足 |
| 2.2 | 控制台「我的应用」→ 创建应用（如 `yyc3-poc`，接入方式选 WebAPI） | 应用创建成功 |
| 2.3 | 在应用的「实时语音转写」服务页获取 `APPID` + 该服务的 `APIKey` | 两值可复制；**APIKey 必须是实时语音转写服务的**（非语音听写等其他服务，否则 signa 校验 401） |
| 2.4 | 核对 WS 端点 `wss://rtasr.xfyun.cn/v1/ws`（与适配器常量一致） | — |

> [快速配置指南](https://www.xfyun.cn/site/1963.html)明确三凭证为 AppId/APIKey/APISecret；本适配器（rtasr 标准版）仅用前两项。

### 3. 阿里云百炼·CosyVoice（TTS 主线）——约 10 分钟

前置：阿里云账号 + 实名认证（**未实名不发放免费额度**）。

| 步骤 | 操作 | 核验点 |
|---|---|---|
| 3.1 | 直达 https://bailian.console.aliyun.com → 首次进入阅读协议 → 「开通服务」 | 开通自动发放**新人免费额度**（[规则](https://help.aliyun.com/zh/model-studio/new-free-quota)：仅**华北2 北京**地域、90 天有效期、每模型独立额度） |
| 3.2 | 确认地域为**北京**（其他地域无免费额度；适配器端点 `dashscope.aliyuncs.com` 主站默认北京） | 控制台右上地域显示华北2 |
| 3.3 | 「模型广场」搜索 `cosyvoice-v3.5-flash` → 开通/查看（免费额度覆盖后按 $0.116/万字计费） | 模型详情页可调用 |
| 3.4 | 「API-KEY」管理页创建 Key（可能需先授权） | `sk-` 开头字符串可复制 |
| 3.5 | （可选）开启「用完即停」开关——免费额度耗尽不自动转付费（POC 阶段建议开启） | 计费页开关状态 |

### 通用注意事项（三家）

- 实名认证是三家共同前置（火山/讯飞/阿里均需），个人认证即可满足 POC；
- 所有 Key 仅写入 `.env.poc`（已 gitignore），禁止提交仓库或写入代码；
- POC 评测音频总量约 5 分钟，三家均在免费/试用额度内（火山极速版按次计费以控制台显示为准，讯飞 24 小时时长充裕，百炼免费额度覆盖万字符级文本）。

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
