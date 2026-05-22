/**
 * file types.ts
 * description @yyc3/core 类型定义
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
 * brief @yyc3/core 类型定义
 */
/**
 * 多模态类型
 */
export type MultimodalType = 'image' | 'audio' | 'document' | 'video'

/**
 * 图像格式
 */
export type ImageFormat = 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp'

/**
 * 音频格式
 */
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a'

/**
 * 文档格式
 */
export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'md' | 'html'

/**
 * 视频格式
 */
export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv'

/**
 * 多模态输入
 */
export interface MultimodalInput {
  type: MultimodalType
  data: string | Buffer
  format?: string
  metadata?: Record<string, unknown>
}

/**
 * 图像输入
 */
export interface ImageInput extends MultimodalInput {
  type: 'image'
  format: ImageFormat
  width?: number
  height?: number
}

/**
 * 音频输入
 */
export interface AudioInput extends MultimodalInput {
  type: 'audio'
  format: AudioFormat
  duration?: number
  sampleRate?: number
  channels?: number
}

/**
 * 文档输入
 */
export interface DocumentInput extends MultimodalInput {
  type: 'document'
  format: DocumentFormat
  pageCount?: number
  language?: string
}

/**
 * 视频输入
 */
export interface VideoInput extends MultimodalInput {
  type: 'video'
  format: VideoFormat
  duration?: number
  width?: number
  height?: number
  fps?: number
}

/**
 * 图像分析选项
 */
export interface ImageAnalysisOptions {
  tasks?: ImageAnalysisTask[]
  detail?: 'low' | 'high' | 'auto'
  maxTokens?: number
}

/**
 * 图像分析任务
 */
export type ImageAnalysisTask = 
  | 'describe'      // 描述图像内容
  | 'ocr'           // 文字识别
  | 'classify'      // 分类
  | 'detect'        // 目标检测
  | 'segment'       // 图像分割
  | 'face'          // 人脸识别
  | 'caption'       // 生成标题

/**
 * 图像分析结果
 */
export interface ImageAnalysisResult {
  description?: string
  text?: string
  labels?: Array<{ label: string; confidence: number }>
  objects?: Array<{ name: string; bbox: [number, number, number, number]; confidence: number }>
  faces?: Array<{ bbox: [number, number, number, number]; attributes?: Record<string, unknown> }>
  caption?: string
  tokens?: { input: number; output: number }
}

/**
 * 音频转录选项
 */
export interface AudioTranscriptionOptions {
  language?: string
  model?: string
  prompt?: string
  temperature?: number
  timestampGranularities?: ('word' | 'segment')[]
}

/**
 * 音频转录结果
 */
export interface AudioTranscriptionResult {
  text: string
  language?: string
  duration?: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
  words?: Array<{
    word: string
    start: number
    end: number
  }>
}

/**
 * 语音合成选项
 */
export interface TextToSpeechOptions {
  voice?: string
  model?: string
  speed?: number
  format?: AudioFormat
}

/**
 * 语音合成结果
 */
export interface TextToSpeechResult {
  audio: Buffer
  format: AudioFormat
  duration: number
}

/**
 * 文档解析选项
 */
export interface DocumentParseOptions {
  extractText?: boolean
  extractImages?: boolean
  extractTables?: boolean
  extractMetadata?: boolean
  ocrLanguage?: string
}

/**
 * 文档解析结果
 */
export interface DocumentParseResult {
  text?: string
  pages?: Array<{
    number: number
    text: string
    images?: Array<{ data: Buffer; format: string }>
    tables?: Array<{ data: string[][] }>
  }>
  images?: Array<{ data: Buffer; format: string; page?: number }>
  tables?: Array<{ data: string[][]; page?: number }>
  metadata?: {
    title?: string
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
    producer?: string
    creationDate?: Date
    modificationDate?: Date
    pageCount?: number
  }
}

/**
 * 多模态处理结果
 */
export interface MultimodalResult {
  success: boolean
  type: MultimodalType
  result?: ImageAnalysisResult | AudioTranscriptionResult | DocumentParseResult | unknown
  error?: string
  duration: number
}

/**
 * 多模态处理器配置
 */
export interface MultimodalProcessorConfig {
  openai?: {
    apiKey?: string
    baseUrl?: string
  }
  ollama?: {
    baseUrl?: string
  }
  visionModel?: string
  audioModel?: string
}
