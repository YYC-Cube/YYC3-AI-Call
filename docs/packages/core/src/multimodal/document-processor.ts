/**
 * file document-processor.ts
 * description 文档处理器
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
 * brief 文档处理器
 */
import type { 
  DocumentInput, 
  DocumentParseOptions, 
  DocumentParseResult 
} from './types.js'
import type { UnifiedAuthManager } from '../auth/unified-auth.js'

/**
 * 文档处理器
 */
export class DocumentProcessor {
  private authManager: UnifiedAuthManager

  constructor(authManager: UnifiedAuthManager) {
    this.authManager = authManager
  }

  /**
   * 解析文档
   */
  async parse(
    document: DocumentInput,
    options: DocumentParseOptions = {}
  ): Promise<DocumentParseResult> {
    try {
      const text = await this.extractText(document)
      
      const result: DocumentParseResult = {}

      if (options.extractText !== false) {
        result.text = text
      }

      if (options.extractMetadata) {
        result.metadata = this.extractMetadata(document)
      }

      return result
    } catch (error) {
      throw new Error(`文档解析失败: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
    }
  }

  /**
   * 提取文本
   */
  private async extractText(document: DocumentInput): Promise<string> {
    let content: string

    if (typeof document.data === 'string') {
      content = document.data
    } else {
      content = document.data.toString('utf-8')
    }

    switch (document.format) {
      case 'txt':
      case 'md':
        return content

      case 'html':
        return this.stripHtml(content)

      case 'pdf':
      case 'docx':
      case 'xlsx':
      case 'pptx':
        return await this.parseComplexDocument(document)

      default:
        return content
    }
  }

  /**
   * 去除 HTML 标签
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * 解析复杂文档
   */
  private async parseComplexDocument(document: DocumentInput): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: '你是一个专业的文档解析助手。请提取文档中的所有文本内容，保持原有的结构和层次。',
      },
      {
        role: 'user' as const,
        content: `请解析以下 ${document.format.toUpperCase()} 文档内容：\n\n${typeof document.data === 'string' ? document.data : document.data.toString('base64')}`,
      },
    ]

    const response = await this.authManager.chat(messages, {
      maxTokens: 4000,
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * 提取元数据
   */
  private extractMetadata(document: DocumentInput): DocumentParseResult['metadata'] {
    const metadata: DocumentParseResult['metadata'] = {}
    
    if (document.pageCount) {
      metadata.pageCount = document.pageCount
    }
    
    return metadata
  }

  /**
   * 摘要文档
   */
  async summarize(
    document: DocumentInput,
    maxLength: number = 500
  ): Promise<string> {
    const text = await this.extractText(document)

    const messages = [
      {
        role: 'system' as const,
        content: '你是一个专业的文档摘要助手。请生成简洁准确的文档摘要。',
      },
      {
        role: 'user' as const,
        content: `请为以下文档生成摘要（不超过 ${maxLength} 字）：\n\n${text.substring(0, 10000)}`,
      },
    ]

    const response = await this.authManager.chat(messages, {
      maxTokens: maxLength * 2,
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * 提取关键信息
   */
  async extractKeyInfo(
    document: DocumentInput,
    keys: string[]
  ): Promise<Record<string, string>> {
    const text = await this.extractText(document)

    const messages = [
      {
        role: 'system' as const,
        content: '你是一个信息提取助手。请从文档中提取指定的关键信息。',
      },
      {
        role: 'user' as const,
        content: `请从以下文档中提取这些信息：${keys.join('、')}\n\n文档内容：\n${text.substring(0, 10000)}`,
      },
    ]

    const response = await this.authManager.chat(messages, {
      maxTokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''
    return this.parseKeyInfo(content, keys)
  }

  /**
   * 解析关键信息
   */
  private parseKeyInfo(content: string, keys: string[]): Record<string, string> {
    const result: Record<string, string> = {}
    const lines = content.split('\n')

    for (const key of keys) {
      for (const line of lines) {
        if (line.includes(key) || line.includes(key.replace(/[:：]$/, ''))) {
          const match = line.match(/[:：]\s*(.+)/)
          if (match) {
            result[key] = match[1].trim()
            break
          }
        }
      }
      if (!result[key]) {
        result[key] = ''
      }
    }

    return result
  }

  /**
   * 对比文档
   */
  async compare(
    document1: DocumentInput,
    document2: DocumentInput
  ): Promise<{
    similarities: string[]
    differences: string[]
    summary: string
  }> {
    const text1 = await this.extractText(document1)
    const text2 = await this.extractText(document2)

    const messages = [
      {
        role: 'system' as const,
        content: '你是一个文档对比分析助手。请比较两份文档的异同。',
      },
      {
        role: 'user' as const,
        content: `请对比以下两份文档：

文档1：
${text1.substring(0, 5000)}

文档2：
${text2.substring(0, 5000)}

请列出：
1. 相似之处
2. 差异之处
3. 总体对比摘要`,
      },
    ]

    const response = await this.authManager.chat(messages, {
      maxTokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''
    
    return {
      similarities: this.extractList(content, '相似'),
      differences: this.extractList(content, '差异'),
      summary: content.substring(0, 500),
    }
  }

  /**
   * 提取列表
   */
  private extractList(content: string, keyword: string): string[] {
    const items: string[] = []
    const lines = content.split('\n')
    let inSection = false

    for (const line of lines) {
      if (line.includes(keyword)) {
        inSection = true
        continue
      }
      if (inSection && line.match(/^\d+\./)) {
        items.push(line.replace(/^\d+\.\s*/, '').trim())
      }
      if (inSection && line.match(/^[一二三四五六七八九十]+[、.．]/)) {
        items.push(line.replace(/^[一二三四五六七八九十]+[、.．]\s*/, '').trim())
      }
    }

    return items.slice(0, 10)
  }
}
