/**
 * file quick-starter.ts
 * description 快速启动器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[setup]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 快速启动器
 */
import { AutoDetector } from './auto-detector.js'
import { SmartSelector } from './smart-selector.js'
import type { ProviderType, ProviderStatus } from './auto-detector.js'

/**
 * 启动配置
 */
export interface QuickStartConfig {
  provider?: ProviderType
  autoDetect?: boolean
  fallback?: boolean
  silent?: boolean
}

/**
 * 启动结果
 */
export interface QuickStartResult {
  success: boolean
  provider: ProviderType
  status: ProviderStatus
  message: string
  setup?: {
    needsConfig: boolean
    steps: string[]
  }
}

/**
 * 系统状态
 */
export interface SystemStatus {
  initialized: boolean
  provider: ProviderType
  agents: {
    total: number
    active: number
  }
  skills: {
    total: number
    loaded: number
  }
  uptime: number
}

/**
 * 快速启动器
 * 提供零配置的快速启动功能
 */
export class QuickStarter {
  private detector: AutoDetector
  private _selector: SmartSelector
  private initialized: boolean = false
  private startTime: Date | null = null
  private currentProvider: ProviderType | null = null

  constructor() {
    this.detector = new AutoDetector()
    this._selector = new SmartSelector()
  }

  get selector(): SmartSelector {
    return this._selector
  }

  /**
   * 快速启动
   */
  async start(config: QuickStartConfig = {}): Promise<QuickStartResult> {
    const {
      provider,
      autoDetect = true,
      fallback = true,
      silent = false,
    } = config

    if (!silent) {
      console.log('\n🚀 YYC³ Family AI 快速启动\n')
    }

    try {
      let selectedProvider: ProviderType

      if (provider) {
        selectedProvider = provider
        if (!silent) {
          console.log(`📌 使用指定提供商: ${provider.toUpperCase()}`)
        }
      } else if (autoDetect) {
        if (!silent) {
          console.log('🔍 自动检测可用提供商...')
        }
        selectedProvider = await this.detector.quickDetect()
      } else {
        selectedProvider = 'ollama'
      }

      const providerStatus = this.detector.getCachedProvider(selectedProvider)
      
      if (!providerStatus?.available || !providerStatus?.healthy) {
        if (fallback) {
          const result = await this.tryFallback(selectedProvider, silent)
          if (result) {
            return result
          }
        }

        return {
          success: false,
          provider: selectedProvider,
          status: providerStatus || this.createEmptyStatus(selectedProvider),
          message: `提供商 ${selectedProvider} 不可用`,
          setup: {
            needsConfig: true,
            steps: this.getSetupSteps(selectedProvider),
          },
        }
      }

      this.currentProvider = selectedProvider
      this.initialized = true
      this.startTime = new Date()

      if (!silent) {
        this.printSuccessMessage(selectedProvider, providerStatus)
      }

      return {
        success: true,
        provider: selectedProvider,
        status: providerStatus,
        message: '启动成功',
      }
    } catch (error) {
      return {
        success: false,
        provider: provider || 'ollama',
        status: this.createEmptyStatus(provider || 'ollama'),
        message: `启动失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 尝试回退到其他提供商
   */
  private async tryFallback(
    failedProvider: ProviderType,
    silent: boolean
  ): Promise<QuickStartResult | null> {
    if (!silent) {
      console.log(`⚠️  ${failedProvider} 不可用，尝试其他提供商...`)
    }

    const result = await this.detector.detect()
    const available = result.providers.filter(p => p.available && p.healthy)

    if (available.length === 0) {
      return null
    }

    const fallback = available[0]
    
    this.currentProvider = fallback.type
    this.initialized = true
    this.startTime = new Date()

    if (!silent) {
      console.log(`✅ 回退到 ${fallback.type.toUpperCase()}`)
      this.printSuccessMessage(fallback.type, fallback)
    }

    return {
      success: true,
      provider: fallback.type,
      status: fallback,
      message: `已回退到 ${fallback.type}`,
    }
  }

  /**
   * 创建空状态
   */
  private createEmptyStatus(type: ProviderType): ProviderStatus {
    return {
      type,
      available: false,
      configured: false,
      healthy: false,
      priority: 0,
    }
  }

  /**
   * 获取设置步骤
   */
  private getSetupSteps(provider: ProviderType): string[] {
    const steps: Record<ProviderType, string[]> = {
      openai: [
        '1. 获取 OpenAI API Key: https://platform.openai.com/api-keys',
        '2. 设置环境变量: export OPENAI_API_KEY=your-key',
        '3. 重新运行启动命令',
      ],
      ollama: [
        '1. 安装 Ollama: https://ollama.ai',
        '2. 启动服务: ollama serve',
        '3. 拉取模型: ollama pull llama2',
        '4. 重新运行启动命令',
      ],
      anthropic: [
        '1. 获取 Anthropic API Key: https://console.anthropic.com',
        '2. 设置环境变量: export ANTHROPIC_API_KEY=your-key',
        '3. 重新运行启动命令',
      ],
      azure: [
        '1. 创建 Azure OpenAI 资源',
        '2. 设置环境变量:',
        '   export AZURE_OPENAI_API_KEY=your-key',
        '   export AZURE_OPENAI_ENDPOINT=your-endpoint',
        '3. 重新运行启动命令',
      ],
      custom: [
        '1. 配置自定义提供商',
        '2. 设置必要的环境变量',
        '3. 重新运行启动命令',
      ],
    }

    return steps[provider] || steps.custom
  }

  /**
   * 打印成功消息
   */
  private printSuccessMessage(provider: ProviderType, status: ProviderStatus): void {
    console.log('\n' + '='.repeat(60))
    console.log('✅ 启动成功！')
    console.log('='.repeat(60))
    console.log(`\n📡 提供商: ${provider.toUpperCase()}`)
    
    if (status.models && status.models.length > 0) {
      console.log(`🤖 可用模型: ${status.models.slice(0, 3).join(', ')}${status.models.length > 3 ? '...' : ''}`)
    }
    
    console.log('\n💡 快速开始:')
    console.log('   • 发送消息: yyc3 chat "你好"')
    console.log('   • 执行任务: yyc3 task "分析这段代码"')
    console.log('   • 查看状态: yyc3 status')
    console.log('\n' + '='.repeat(60))
  }

  /**
   * 获取系统状态
   */
  getStatus(): SystemStatus {
    return {
      initialized: this.initialized,
      provider: this.currentProvider || 'ollama',
      agents: {
        total: 8,
        active: this.initialized ? 8 : 0,
      },
      skills: {
        total: 20,
        loaded: this.initialized ? 20 : 0,
      },
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider(): ProviderType | null {
    return this.currentProvider
  }

  /**
   * 关闭系统
   */
  async shutdown(): Promise<void> {
    this.initialized = false
    this.currentProvider = null
    this.startTime = null
    console.log('\n👋 YYC³ Family AI 已关闭')
  }

  /**
   * 重启系统
   */
  async restart(config: QuickStartConfig = {}): Promise<QuickStartResult> {
    await this.shutdown()
    return this.start(config)
  }
}
