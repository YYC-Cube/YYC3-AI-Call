/**
 * file audio-processor.ts
 * description 音频处理器
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
 * brief 音频处理器
 */
import type {
  AudioInput,
  AudioTranscriptionOptions,
  AudioTranscriptionResult,
  TextToSpeechOptions,
  TextToSpeechResult
} from './types.js'

/**
 * 音频处理器配置
 */
export interface AudioProcessorConfig {
  openaiApiKey?: string
  openaiBaseUrl?: string
  ollamaBaseUrl?: string
  defaultModel?: string
}

/**
 * 音频处理器
 */
export class AudioProcessor {
  private config: AudioProcessorConfig

  constructor(config: AudioProcessorConfig) {
    this.config = config
  }

  /**
   * 转录音频
   */
  async transcribe(
    audio: AudioInput,
    options: AudioTranscriptionOptions = {}
  ): Promise<AudioTranscriptionResult> {
    try {
      const formData = new FormData()

      let audioBlob: Blob
      if (typeof audio.data === 'string') {
        const binaryString = atob(audio.data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        audioBlob = new Blob([bytes], { type: `audio/${audio.format}` })
      } else {
        audioBlob = new Blob([new Uint8Array(audio.data as unknown as ArrayBuffer)], { type: `audio/${audio.format}` })
      }

      formData.append('file', audioBlob, `audio.${audio.format}`)
      formData.append('model', options.model || 'whisper-1')

      if (options.language) {
        formData.append('language', options.language)
      }
      if (options.prompt) {
        formData.append('prompt', options.prompt)
      }
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString())
      }

      const baseUrl = this.config.openaiBaseUrl || 'https://api.openai.com/v1'
      const response = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`转录失败: ${response.statusText}`)
      }

      const data = await response.json() as AudioTranscriptionResult

      return {
        text: data.text,
        language: data.language,
        duration: audio.duration,
        segments: data.segments,
        words: data.words,
      }
    } catch (error) {
      throw new Error(`音频转录失败: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
    }
  }

  /**
   * 语音合成
   */
  async synthesize(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<TextToSpeechResult> {
    try {
      const baseUrl = this.config.openaiBaseUrl || 'https://api.openai.com/v1'
      const response = await fetch(`${baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'tts-1',
          input: text,
          voice: options.voice || 'alloy',
          speed: options.speed || 1.0,
          response_format: options.format || 'mp3',
        }),
      })

      if (!response.ok) {
        throw new Error(`语音合成失败: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audio = Buffer.from(arrayBuffer)

      return {
        audio,
        format: options.format || 'mp3',
        duration: this.estimateDuration(text, options.speed || 1.0),
      }
    } catch (error) {
      throw new Error(`语音合成失败: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
    }
  }

  /**
   * 估算音频时长
   */
  private estimateDuration(text: string, speed: number): number {
    const wordsPerMinute = 150
    const words = text.split(/\s+/).length
    return (words / wordsPerMinute) * 60 / speed
  }
}
