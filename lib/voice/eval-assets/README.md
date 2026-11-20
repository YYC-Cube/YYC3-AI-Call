# POC 评测资产挂载说明

> 选型方案 §5.1/§5.3：本目录存放 POC 第 1 天录制的音频资产，评测脚本（`lib/voice/eval.ts`）
> 按 `eval-dataset.ts` 的 ID 约定读取。**本目录不入库音频文件本体**（体积与版权考量），
> 仅本说明随仓库维护；实际录制产物放本地或对象存储，由 `POC_AUDIO_DIR` 环境变量指认。

## 目录约定

```
${POC_AUDIO_DIR:-./poc-assets}/
├── asr/                  # ASR 评测音频（20 句清晰/日常/含混 + 5 段嘈杂）
│   ├── asr-001.wav       # 与 AsrSample.id 一一对应（16kHz/单声道/wav 优先）
│   ├── ...
│   └── noise-01.wav      # 嘈杂样本：基于 basedOn 基准句按 SNR 混噪（规格见 eval-dataset）
└── tts/                  # TTS 输出留存（评测脚本合成后写入，供 MOS 听测归档）
    ├── tts-open-1.mp3
    └── ...
```

## 录制规格（嘈杂样本 5 段，SNR 递减）

| ID | 基准句 | SNR (dB) | 噪声说明 |
|---|---|---|---|
| noise-01 | asr-008 | 15 | 办公室键盘与交谈底噪 |
| noise-02 | asr-002 | 10 | 街道车流环境声 |
| noise-03 | asr-010 | 6 | 商场/餐厅人声嘈杂 |
| noise-04 | asr-018 | 3 | 移动网络通话压缩劣化（8kHz 重采样叠加） |
| noise-05 | asr-016 | 0 | 极端场景：嘈杂 + 口音偏移 |

混噪工具建议：ffmpeg `amix` / `anoisesrc`；统一 16kHz 单声道后输出。

## 运行评测

```bash
# 1. 音频就位后（双供应商适配器实现 lib/voice/asr-<vendor>.ts 接口后）
pnpm tsx scripts/poc-eval.ts --vendor volcengine --audio-dir ./poc-assets/asr
pnpm tsx scripts/poc-eval.ts --vendor iflytek --audio-dir ./poc-assets/asr
# 2. 报告：buildPocReport 聚合 + buildLatencySnapshot 三态判定，落 docs/reports/
```

> 适配器占位与 runner 骨架见 `scripts/poc-eval.ts`（本批交付）；供应商 SDK 接入随
> POC 第 1 周进行（选型方案 §六）。
