/**
 * file manager.ts
 * description 管理器核心
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 管理器核心
 */
import { EventEmitter } from 'eventemitter3'
import type { UnifiedAuthManager } from '../auth/unified-auth.js'
import { ImageProcessor } from './image-processor.js'
import { AudioProcessor } from './audio-processor.js'
import { DocumentProcessor } from './document-processor.js'
import type {
  MultimodalInput,
  MultimodalResult,
  ImageInput,
  ImageAnalysisOptions,
  ImageAnalysisResult,
  AudioInput,
  AudioTranscriptionOptions,
  AudioTranscriptionResult,
  TextToSpeechOptions,
  TextToSpeechResult,
  DocumentInput,
  DocumentParseOptions,
  DocumentParseResult,
  MultimodalProcessorConfig,
} from './types.js'

/**
 * 多模态管理器事件
 */
export interface MultimodalEvents {
  processing_started: { type: string; input: MultimodalInput }
  processing_completed: { type: string; result: MultimodalResult }
  processing_failed: { type: string; error: string }
}

/**
 * 多模态管理器
 */
export class MultimodalManager extends EventEmitter<MultimodalEvents> {
  private _authManager: UnifiedAuthManager
  private _config: MultimodalProcessorConfig
  private imageProcessor: ImageProcessor
  private audioProcessor: AudioProcessor
  private documentProcessor: DocumentProcessor

  constructor(authManager: UnifiedAuthManager, config: MultimodalProcessorConfig = {}) {
    super()
    this._authManager = authManager
    this._config = config

    this.imageProcessor = new ImageProcessor(
      authManager,
      config.visionModel
    )

    this.audioProcessor = new AudioProcessor({
      openaiApiKey: config.openai?.apiKey,
      openaiBaseUrl: config.openai?.baseUrl,
      ollamaBaseUrl: config.ollama?.baseUrl,
      defaultModel: config.audioModel,
    })

    this.documentProcessor = new DocumentProcessor(authManager)
  }

  /**
   * 获取认证管理器
   */
  get authManager(): UnifiedAuthManager {
    return this._authManager
  }

  /**
   * 获取配置
   */
  get config(): MultimodalProcessorConfig {
    return this._config
  }

  /**
   * 处理多模态输入
   */
  async process(input: MultimodalInput): Promise<MultimodalResult> {
    const startTime = Date.now()
    
    this.emit('processing_started', { type: input.type, input })

    try {
      let result: MultimodalResult['result']

      switch (input.type) {
        case 'image':
          result = await this.processImage(input as ImageInput)
          break
        case 'audio':
          result = await this.processAudio(input as AudioInput)
          break
        case 'document':
          result = await this.processDocument(input as DocumentInput)
          break
        case 'video':
          result = await this.processVideo(input)
          break
        default:
          throw new Error(`不支持的多模态类型: ${input.type}`)
      }

      const multimodalResult: MultimodalResult = {
        success: true,
        type: input.type,
        result,
        duration: Date.now() - startTime,
      }

      this.emit('processing_completed', { type: input.type, result: multimodalResult })
      
      return multimodalResult
    } catch (error) {
      const result: MultimodalResult = {
        success: false,
        type: input.type,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      }

      this.emit('processing_failed', { 
        type: input.type, 
        error: result.error! 
      })

      return result
    }
  }

  /**
   * 处理图像
   */
  async processImage(
    image: ImageInput,
    options: ImageAnalysisOptions = {}
  ): Promise<ImageAnalysisResult> {
    return this.imageProcessor.analyze(image, options)
  }

  /**
   * 处理音频
   */
  async processAudio(
    audio: AudioInput,
    options: AudioTranscriptionOptions = {}
  ): Promise<AudioTranscriptionResult> {
    return this.audioProcessor.transcribe(audio, options)
  }

  /**
   * 处理文档
   */
  async processDocument(
    document: DocumentInput,
    options: DocumentParseOptions = {}
  ): Promise<DocumentParseResult> {
    return this.documentProcessor.parse(document, options)
  }

  /**
   * 处理视频
   */
  private async processVideo(video: MultimodalInput): Promise<unknown> {
    return {
      message: '视频处理功能即将推出',
      format: video.format,
    }
  }

  /**
   * 分析图像
   */
  async analyzeImage(
    image: ImageInput,
    options?: ImageAnalysisOptions
  ): Promise<ImageAnalysisResult> {
    return this.imageProcessor.analyze(image, options)
  }

  /**
   * 转录音频
   */
  async transcribeAudio(
    audio: AudioInput,
    options?: AudioTranscriptionOptions
  ): Promise<AudioTranscriptionResult> {
    return this.audioProcessor.transcribe(audio, options)
  }

  /**
   * 语音合成
   */
  async synthesizeSpeech(
    text: string,
    options?: TextToSpeechOptions
  ): Promise<TextToSpeechResult> {
    return this.audioProcessor.synthesize(text, options)
  }

  /**
   * 解析文档
   */
  async parseDocument(
    document: DocumentInput,
    options?: DocumentParseOptions
  ): Promise<DocumentParseResult> {
    return this.documentProcessor.parse(document, options)
  }

  /**
   * 摘要文档
   */
  async summarizeDocument(
    document: DocumentInput,
    maxLength?: number
  ): Promise<string> {
    return this.documentProcessor.summarize(document, maxLength)
  }

  /**
   * 批量处理
   */
  async processBatch(
    inputs: MultimodalInput[]
  ): Promise<MultimodalResult[]> {
    return Promise.all(inputs.map(input => this.process(input)))
  }

  /**
   * 获取处理器
   */
  getImageProcessor(): ImageProcessor {
    return this.imageProcessor
  }

  getAudioProcessor(): AudioProcessor {
    return this.audioProcessor
  }

  getDocumentProcessor(): DocumentProcessor {
    return this.documentProcessor
  }
}
