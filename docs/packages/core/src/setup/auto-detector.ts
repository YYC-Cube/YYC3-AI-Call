/**
 * file auto-detector.ts
 * description 自动检测器
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
 * brief 自动检测器
 */
import { exec } from 'child_process'
import { promisify } from 'util'

promisify(exec)

/**
 * 提供商类型
 */
export type ProviderType = 'openai' | 'ollama' | 'anthropic' | 'azure' | 'custom'

/**
 * 提供商状态
 */
export interface ProviderStatus {
  type: ProviderType
  available: boolean
  configured: boolean
  healthy: boolean
  models?: string[]
  endpoint?: string
  error?: string
  priority: number
}

/**
 * 环境检测结果
 */
export interface EnvironmentDetectionResult {
  providers: ProviderStatus[]
  recommended: ProviderType
  environment: {
    node: string
    platform: string
    arch: string
    memory: number
    cpus: number
  }
  config: {
    needsSetup: boolean
    missingKeys: string[]
    recommendations: string[]
  }
}

/**
 * 自动环境检测器
 * 自动检测可用的AI提供商和环境配置
 */
export class AutoDetector {
  private cachedProviders: Map<ProviderType, ProviderStatus> = new Map()
  private lastDetection: Date | null = null
  private cacheTimeout: number = 60000

  /**
   * 执行完整的环境检测
   */
  async detect(): Promise<EnvironmentDetectionResult> {
    console.log('🔍 开始环境检测...\n')

    const environment = await this.detectEnvironment()
    const providers = await this.detectProviders()
    const recommended = this.recommendProvider(providers)
    const config = this.analyzeConfig(providers)

    this.lastDetection = new Date()

    return {
      providers,
      recommended,
      environment,
      config,
    }
  }

  /**
   * 检测运行环境
   */
  private async detectEnvironment(): Promise<EnvironmentDetectionResult['environment']> {
    const os = await import('os')
    
    return {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      cpus: os.cpus().length,
    }
  }

  /**
   * 检测所有提供商
   */
  private async detectProviders(): Promise<ProviderStatus[]> {
    const providers: ProviderStatus[] = []

    providers.push(await this.detectOpenAI())
    providers.push(await this.detectOllama())
    providers.push(await this.detectAnthropic())
    providers.push(await this.detectAzure())

    return providers.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 检测 OpenAI
   */
  private async detectOpenAI(): Promise<ProviderStatus> {
    const status: ProviderStatus = {
      type: 'openai',
      available: false,
      configured: false,
      healthy: false,
      priority: 100,
    }

    try {
      const apiKey = process.env.OPENAI_API_KEY
      status.configured = !!apiKey

      if (apiKey) {
        status.available = true
        
        const healthy = await this.checkOpenAIHealth(apiKey)
        status.healthy = healthy

        if (healthy) {
          status.models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
          console.log('✅ OpenAI API 可用')
        } else {
          status.error = 'API密钥无效或服务不可用'
          console.log('⚠️  OpenAI API 密钥无效')
        }
      } else {
        console.log('❌ OpenAI API 密钥未配置')
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error)
      console.log('❌ OpenAI 检测失败:', status.error)
    }

    this.cachedProviders.set('openai', status)
    return status
  }

  /**
   * 检测 Ollama
   */
  private async detectOllama(): Promise<ProviderStatus> {
    const status: ProviderStatus = {
      type: 'ollama',
      available: false,
      configured: false,
      healthy: false,
      endpoint: 'http://localhost:11434',
      priority: 90,
    }

    try {
      const endpoint = process.env.OLLAMA_HOST || 'http://localhost:11434'
      status.endpoint = endpoint

      const healthy = await this.checkOllamaHealth(endpoint)
      status.healthy = healthy
      status.configured = healthy
      status.available = healthy

      if (healthy) {
        status.models = await this.getOllamaModels(endpoint)
        console.log('✅ Ollama 服务可用')
      } else {
        console.log('❌ Ollama 服务未运行')
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error)
      console.log('❌ Ollama 检测失败:', status.error)
    }

    this.cachedProviders.set('ollama', status)
    return status
  }

  /**
   * 检测 Anthropic
   */
  private async detectAnthropic(): Promise<ProviderStatus> {
    const status: ProviderStatus = {
      type: 'anthropic',
      available: false,
      configured: false,
      healthy: false,
      priority: 80,
    }

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY
      status.configured = !!apiKey

      if (apiKey) {
        status.available = true
        status.healthy = true
        status.models = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
        console.log('✅ Anthropic API 可用')
      } else {
        console.log('❌ Anthropic API 密钥未配置')
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error)
      console.log('❌ Anthropic 检测失败:', status.error)
    }

    this.cachedProviders.set('anthropic', status)
    return status
  }

  /**
   * 检测 Azure OpenAI
   */
  private async detectAzure(): Promise<ProviderStatus> {
    const status: ProviderStatus = {
      type: 'azure',
      available: false,
      configured: false,
      healthy: false,
      priority: 70,
    }

    try {
      const apiKey = process.env.AZURE_OPENAI_API_KEY
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT
      
      status.configured = !!(apiKey && endpoint)

      if (status.configured) {
        status.available = true
        status.healthy = true
        status.endpoint = endpoint
        console.log('✅ Azure OpenAI 可用')
      } else {
        console.log('❌ Azure OpenAI 未配置')
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error)
      console.log('❌ Azure 检测失败:', status.error)
    }

    this.cachedProviders.set('azure', status)
    return status
  }

  /**
   * 检查 OpenAI 健康状态
   */
  private async checkOpenAIHealth(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 检查 Ollama 健康状态
   */
  private async checkOllamaHealth(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 获取 Ollama 模型列表
   */
  private async getOllamaModels(endpoint: string): Promise<string[]> {
    try {
      const response = await fetch(`${endpoint}/api/tags`)
      const data = await response.json() as { models?: Array<{ name: string }> }
      
      return data.models?.map((m) => m.name) || []
    } catch {
      return []
    }
  }

  /**
   * 推荐最佳提供商
   */
  private recommendProvider(providers: ProviderStatus[]): ProviderType {
    const available = providers.filter(p => p.available && p.healthy)
    
    if (available.length === 0) {
      return 'ollama'
    }

    const sorted = available.sort((a, b) => b.priority - a.priority)
    return sorted[0].type
  }

  /**
   * 分析配置状态
   */
  private analyzeConfig(providers: ProviderStatus[]): EnvironmentDetectionResult['config'] {
    const missingKeys: string[] = []
    const recommendations: string[] = []
    let needsSetup = true

    const hasProvider = providers.some(p => p.available && p.healthy)

    if (!hasProvider) {
      missingKeys.push('OPENAI_API_KEY')
      missingKeys.push('OLLAMA_HOST')
      
      recommendations.push('设置 OPENAI_API_KEY 环境变量以使用 OpenAI')
      recommendations.push('或启动 Ollama 服务以使用本地模型')
      recommendations.push('运行: ollama serve')
    } else {
      needsSetup = false
    }

    if (!providers.find(p => p.type === 'openai')?.configured) {
      recommendations.push('建议配置 OPENAI_API_KEY 以获得最佳体验')
    }

    return {
      needsSetup,
      missingKeys,
      recommendations,
    }
  }

  /**
   * 快速检测（使用缓存）
   */
  async quickDetect(): Promise<ProviderType> {
    if (this.lastDetection && 
        Date.now() - this.lastDetection.getTime() < this.cacheTimeout) {
      const cached = Array.from(this.cachedProviders.values())
        .filter(p => p.available && p.healthy)
        .sort((a, b) => b.priority - a.priority)
      
      return cached[0]?.type || 'ollama'
    }

    const result = await this.detect()
    return result.recommended
  }

  /**
   * 获取缓存的提供商状态
   */
  getCachedProvider(type: ProviderType): ProviderStatus | undefined {
    return this.cachedProviders.get(type)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedProviders.clear()
    this.lastDetection = null
  }

  /**
   * 打印检测报告
   */
  printReport(result: EnvironmentDetectionResult): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 环境检测报告')
    console.log('='.repeat(60))
    
    console.log('\n🖥️  系统环境:')
    console.log(`   Node.js: ${result.environment.node}`)
    console.log(`   平台: ${result.environment.platform} (${result.environment.arch})`)
    console.log(`   内存: ${result.environment.memory}GB`)
    console.log(`   CPU: ${result.environment.cpus} 核心`)

    console.log('\n🔌 AI 提供商:')
    for (const provider of result.providers) {
      const icon = provider.available && provider.healthy ? '✅' : 
                   provider.configured ? '⚠️ ' : '❌'
      console.log(`   ${icon} ${provider.type.toUpperCase()}`)
      
      if (provider.models && provider.models.length > 0) {
        console.log(`      模型: ${provider.models.slice(0, 3).join(', ')}${provider.models.length > 3 ? '...' : ''}`)
      }
      
      if (provider.error) {
        console.log(`      错误: ${provider.error}`)
      }
    }

    console.log('\n💡 推荐:')
    console.log(`   最佳提供商: ${result.recommended.toUpperCase()}`)
    
    if (result.config.needsSetup) {
      console.log('\n⚠️  需要配置:')
      for (const rec of result.config.recommendations) {
        console.log(`   • ${rec}`)
      }
    } else {
      console.log('\n✅ 环境配置完成，可以开始使用！')
    }

    console.log('\n' + '='.repeat(60))
  }
}
