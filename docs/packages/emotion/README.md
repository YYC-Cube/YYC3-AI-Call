# 🎭 @yyc3/emotion

<p align="center">
  <strong>YYC³ AI Family 情感引擎</strong><br/>
  <em>多模态情感融合 · 情绪音乐桥接 · 事件总线</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@yyc3/emotion"><img src="https://img.shields.io/npm/v/@yyc3/emotion.svg?style=flat-square" alt="npm version"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"/></a>
  <a href="https://github.com/YanYuCloudCube/YYC3-pi3"><img src="https://img.shields.io/badge/GitHub-YYC3--pi3-black?style=flat-square&logo=github" alt="GitHub"/></a>
</p>

---

## 核心特性

- **多模态情感融合引擎** — 融合文本、语音、行为、生理等多维度情感信号
- **情绪音乐桥接** — 根据情感状态智能推荐音乐，实现情绪调节
- **事件总线** — 音乐播放/暂停/切换等事件驱动的松耦合通信
- **情感分析提供者** — 支持 LLM 驱动和规则驱动的双模式情感分析
- **零外部依赖** — 仅依赖 eventemitter3，轻量高效

## 安装

```bash
npm install @yyc3/emotion
# or
pnpm add @yyc3/emotion
```

## 快速开始

```typescript
import {
  multimodalEmotionEngine,
  emotionMusicBridge,
  musicEventBus,
} from '@yyc3/emotion';

// 情感融合分析
const result = await multimodalEmotionEngine.fuse({
  text: { content: '今天心情很好！', weight: 0.6 },
  voice: { pitch: 0.8, energy: 0.7, weight: 0.4 },
});

console.log(result.dominantEmotion); // 'joy'
console.log(result.confidence); // 0.85

// 情绪音乐桥接
const recommendation = emotionMusicBridge.recommend(result.dominantEmotion);
musicEventBus.play(recommendation.track);
```

## 子路径导入

```typescript
// 情感融合引擎
import { multimodalEmotionEngine } from '@yyc3/emotion/engine';

// 音乐桥接
import { emotionMusicBridge } from '@yyc3/emotion/music-bridge';

// 事件总线
import { musicEventBus } from '@yyc3/emotion/event-bus';
```

## API

| 模块 | 导出 | 说明 |
|------|------|------|
| engine | `MultimodalEmotionEngine` | 多模态情感融合 |
| music-bridge | `EmotionMusicBridge` | 情绪音乐映射 |
| event-bus | `MusicEventBus` | 音乐事件总线 |
| sentiment-provider | `LLMSentimentProvider` / `RuleBasedSentimentProvider` | 情感分析 |

## 许可证

MIT License - see [LICENSE](./LICENSE)
