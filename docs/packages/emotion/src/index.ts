export { MultimodalEmotionEngine, multimodalEmotionEngine } from "./engine/index.js";
export type {
  BehaviorModalityData, FusedEmotionResult, ModalityInput, ModalityType, ModalityWeight, PhysiologicalData, TextModalityData,
  VoiceModalityData
} from "./engine/index.js";

export { EMOTION_MUSIC_MAPPINGS, EmotionMusicBridge, emotionMusicBridge } from "./music-bridge/index.js";
export type { EmotionMusicMapping, EmotionState, EmotionType, UserBehavior } from "./music-bridge/index.js";

export { MusicEventBus, musicEventBus } from "./event-bus/index.js";
export type { MusicCommand, MusicEvent, MusicEventListener, MusicEventType, MusicState, Track } from "./event-bus/index.js";

export type {
  EmotionType as Emotion,
  EmotionState as EmotionStateType
} from "./types.js";

export {
  LLMSentimentProvider,
  RuleBasedSentimentProvider
} from "./sentiment-provider.js";

export type {
  LLMSentimentConfig, SentimentProvider
} from "./sentiment-provider.js";
