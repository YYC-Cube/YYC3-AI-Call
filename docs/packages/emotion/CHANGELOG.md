# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-24

### Added
- `MultimodalEmotionEngine` — 多模态情感融合引擎
- `EmotionMusicBridge` — 情绪音乐桥接，支持情感→音乐映射
- `MusicEventBus` — 音乐事件总线，支持播放/暂停/切换事件
- `LLMSentimentProvider` — LLM 驱动的情感分析
- `RuleBasedSentimentProvider` — 基于规则的情感分析
- 支持 `text`、`voice`、`behavior`、`physiological` 四种情感模态输入
- 支持可配置的模态权重
