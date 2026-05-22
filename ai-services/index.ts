/**
 * @fileoverview AI 核心服务模块
 * @description 集成 Whisper ASR、VITS TTS、GPT-4 意图识别等 AI 服务
 * @module ai-services
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

export { WhisperASRService } from './asr/whisper-service';
export { VITSTTSService } from './tts/vits-service';
export { IntentRecognitionService } from './nlp/intent-service';
export { SentimentService } from './nlp/sentiment-service';
export { AIServiceManager } from './ai-manager';
