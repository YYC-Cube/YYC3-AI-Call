/**
 * file multimodal.test.ts
 * description @yyc3/core multimodal.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[multimodal],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core multimodal.ts 单元测试
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UnifiedAuthManager } from '../auth/unified-auth.js'
import { AudioProcessor } from '../multimodal/audio-processor.js'
import { DocumentProcessor } from '../multimodal/document-processor.js'
import { ImageProcessor } from '../multimodal/image-processor.js'
import { MultimodalManager } from '../multimodal/manager.js'
import type { AudioInput, DocumentInput, ImageInput } from '../multimodal/types.js'

describe('MultimodalManager', () => {
  let manager: MultimodalManager
  let mockAuthManager: UnifiedAuthManager

  beforeEach(() => {
    mockAuthManager = {
      chat: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"result": "test"}' } }],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      }),
    } as unknown as UnifiedAuthManager

    manager = new MultimodalManager(mockAuthManager)
  })

  describe('构造函数', () => {
    it('应该创建管理器实例', () => {
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(MultimodalManager)
    })
  })

  describe('getImageProcessor', () => {
    it('应该返回图像处理器', () => {
      const processor = manager.getImageProcessor()
      expect(processor).toBeDefined()
      expect(processor).toBeInstanceOf(ImageProcessor)
    })
  })

  describe('getAudioProcessor', () => {
    it('应该返回音频处理器', () => {
      const processor = manager.getAudioProcessor()
      expect(processor).toBeDefined()
      expect(processor).toBeInstanceOf(AudioProcessor)
    })
  })

  describe('getDocumentProcessor', () => {
    it('应该返回文档处理器', () => {
      const processor = manager.getDocumentProcessor()
      expect(processor).toBeDefined()
      expect(processor).toBeInstanceOf(DocumentProcessor)
    })
  })
})

describe('ImageProcessor', () => {
  let processor: ImageProcessor
  let mockAuthManager: UnifiedAuthManager

  beforeEach(() => {
    mockAuthManager = {
      chat: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '图像描述: 这是一张测试图片' } }],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      }),
    } as unknown as UnifiedAuthManager

    processor = new ImageProcessor(mockAuthManager)
  })

  describe('analyze', () => {
    it('应该分析图像', async () => {
      const image: ImageInput = {
        type: 'image',
        format: 'png',
        data: Buffer.from('test-image'),
      }

      const result = await processor.analyze(image, {
        tasks: ['describe'],
      })

      expect(result).toHaveProperty('description')
    })
  })

  describe('analyzeBatch', () => {
    it('应该批量分析图像', async () => {
      const images: ImageInput[] = [
        { type: 'image', format: 'png', data: Buffer.from('img1') },
        { type: 'image', format: 'png', data: Buffer.from('img2') },
      ]

      const results = await processor.analyzeBatch(images, {
        tasks: ['describe'],
      })

      expect(results.length).toBe(2)
    })
  })
})

describe('AudioProcessor', () => {
  let processor: AudioProcessor

  beforeEach(() => {
    processor = new AudioProcessor({
      openaiApiKey: 'test-api-key',
    })
  })

  describe('transcribe', () => {
    it('应该转录音频', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: '转录文本内容', language: 'zh' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const audio: AudioInput = {
        type: 'audio',
        format: 'mp3',
        data: Buffer.from('test-audio'),
      }

      const result = await processor.transcribe(audio)
      expect(result).toHaveProperty('text')
      expect(result.text).toBe('转录文本内容')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      vi.restoreAllMocks()
    })
  })

  describe('synthesize', () => {
    it('应该合成语音', async () => {
      const mockAudioBuffer = new ArrayBuffer(8)
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await processor.synthesize('Hello world')
      expect(result).toHaveProperty('audio')
      expect(result).toHaveProperty('format')
      expect(result.format).toBe('mp3')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      vi.restoreAllMocks()
    })
  })
})

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor
  let mockAuthManager: UnifiedAuthManager

  beforeEach(() => {
    mockAuthManager = {
      chat: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '文档摘要内容' } }],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      }),
    } as unknown as UnifiedAuthManager

    processor = new DocumentProcessor(mockAuthManager)
  })

  describe('parse', () => {
    it('应该解析文档', async () => {
      const document: DocumentInput = {
        type: 'document',
        format: 'txt',
        data: Buffer.from('test document content'),
      }

      const result = await processor.parse(document)

      expect(result).toHaveProperty('text')
    })
  })

  describe('summarize', () => {
    it('应该摘要文档', async () => {
      const document: DocumentInput = {
        type: 'document',
        format: 'txt',
        data: Buffer.from('test document content for summarization'),
      }

      const result = await processor.summarize(document)

      expect(typeof result).toBe('string')
    })
  })

  describe('extractKeyInfo', () => {
    it('应该提取关键信息', async () => {
      const document: DocumentInput = {
        type: 'document',
        format: 'txt',
        data: Buffer.from('姓名: 张三, 年龄: 25'),
      }

      const result = await processor.extractKeyInfo(document, ['姓名', '年龄'])

      expect(result).toHaveProperty('姓名')
      expect(result).toHaveProperty('年龄')
    })
  })

  describe('compare', () => {
    it('应该对比文档', async () => {
      const doc1: DocumentInput = {
        type: 'document',
        format: 'txt',
        data: Buffer.from('document 1 content'),
      }

      const doc2: DocumentInput = {
        type: 'document',
        format: 'txt',
        data: Buffer.from('document 2 content'),
      }

      const result = await processor.compare(doc1, doc2)

      expect(result).toHaveProperty('similarities')
      expect(result).toHaveProperty('differences')
      expect(result).toHaveProperty('summary')
    })
  })
})

describe('Multimodal Types', () => {
  it('ImageInput 应该有正确的结构', () => {
    const image: ImageInput = {
      type: 'image',
      format: 'png',
      data: Buffer.from('test'),
      width: 100,
      height: 100,
    }

    expect(image.type).toBe('image')
    expect(image.format).toBe('png')
    expect(image.width).toBe(100)
  })

  it('AudioInput 应该有正确的结构', () => {
    const audio: AudioInput = {
      type: 'audio',
      format: 'mp3',
      data: Buffer.from('test'),
      duration: 60,
    }

    expect(audio.type).toBe('audio')
    expect(audio.format).toBe('mp3')
    expect(audio.duration).toBe(60)
  })

  it('DocumentInput 应该有正确的结构', () => {
    const doc: DocumentInput = {
      type: 'document',
      format: 'pdf',
      data: Buffer.from('test'),
      pageCount: 10,
    }

    expect(doc.type).toBe('document')
    expect(doc.format).toBe('pdf')
    expect(doc.pageCount).toBe(10)
  })
})
