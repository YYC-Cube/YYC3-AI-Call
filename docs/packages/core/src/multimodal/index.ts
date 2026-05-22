/**
 * file index.ts
 * description @yyc3/core 模块入口
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 模块入口
 */
export { MultimodalManager, type MultimodalEvents } from './manager.js'
export { ImageProcessor } from './image-processor.js'
export { AudioProcessor, type AudioProcessorConfig } from './audio-processor.js'
export { DocumentProcessor } from './document-processor.js'
export type {
  MultimodalType,
  ImageFormat,
  AudioFormat,
  DocumentFormat,
  VideoFormat,
  MultimodalInput,
  ImageInput,
  AudioInput,
  DocumentInput,
  VideoInput,
  ImageAnalysisOptions,
  ImageAnalysisTask,
  ImageAnalysisResult,
  AudioTranscriptionOptions,
  AudioTranscriptionResult,
  TextToSpeechOptions,
  TextToSpeechResult,
  DocumentParseOptions,
  DocumentParseResult,
  MultimodalResult,
  MultimodalProcessorConfig,
} from './types.js'
