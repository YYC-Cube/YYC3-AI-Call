/**
 * file agent-layers.ts
 * description Agent 层级定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Agent 层级定义
 */
import { EventEmitter } from 'eventemitter3'
import type { BaseAgent } from './base-agent.js'
import type { UnifiedAuthManager } from '../auth/unified-auth.js'
import type {
  AgentRole,
  AgentTask,
  TaskContext,
  TaskResult,
} from './types.js'

/**
 * Agent层级
 */
export type AgentLayer = 'commander' | 'executor' | 'supporter'

/**
 * 层级配置
 */
export interface LayerConfig {
  name: string
  description: string
  agents: AgentRole[]
  responsibilities: string[]
  maxConcurrency: number
}

/**
 * 三层架构配置
 */
export interface ThreeLayerArchitectureConfig {
  authManager: UnifiedAuthManager
  enableAutoRouting?: boolean
  enableQualityGates?: boolean
  maxTaskQueueSize?: number
}

/**
 * 层级架构事件
 */
export interface ArchitectureEvents {
  layer_activated: { layer: AgentLayer; agents: AgentRole[] }
  layer_deactivated: { layer: AgentLayer }
  task_routed: { taskId: string; from: AgentRole; to: AgentRole }
  quality_gate_passed: { taskId: string; layer: AgentLayer }
  quality_gate_failed: { taskId: string; layer: AgentLayer; reason: string }
}

/**
 * Agent三层架构
 * 实现指挥层、执行层、支持层的多层协同架构
 */
export class AgentLayers extends EventEmitter<ArchitectureEvents> {
  private layers: Map<AgentLayer, LayerConfig> = new Map()
  private agents: Map<AgentRole, BaseAgent> = new Map()
  private activeLayer: AgentLayer = 'commander'
  private config: Required<ThreeLayerArchitectureConfig>

  constructor(config: ThreeLayerArchitectureConfig) {
    super()
    this.config = {
      authManager: config.authManager,
      enableAutoRouting: config.enableAutoRouting ?? true,
      enableQualityGates: config.enableQualityGates ?? true,
      maxTaskQueueSize: config.maxTaskQueueSize ?? 100,
    }

    this.initializeLayers()
  }

  /**
   * 初始化三层架构
   */
  private initializeLayers(): void {
    this.layers.set('commander', {
      name: '指挥层',
      description: '总指挥层，负责整体规划和决策',
      agents: ['commander'],
      responsibilities: [
        '任务分析和规划',
        '资源分配和调度',
        '决策制定',
        '全局协调',
      ],
      maxConcurrency: 1,
    })

    this.layers.set('executor', {
      name: '执行层',
      description: '执行层，负责具体任务执行',
      agents: ['coder', 'multimodal', 'predictor', 'matcher'],
      responsibilities: [
        '代码生成和修改',
        '多模态处理',
        '预测和分析',
        '匹配和推荐',
      ],
      maxConcurrency: 4,
    })

    this.layers.set('supporter', {
      name: '支持层',
      description: '支持层，提供质量保障和创意支持',
      agents: ['security', 'quality', 'creative'],
      responsibilities: [
        '安全检查和防护',
        '质量保证和验证',
        '创意生成和优化',
      ],
      maxConcurrency: 3,
    })
  }

  /**
   * 注册Agent
   */
  registerAgent(role: AgentRole, agent: BaseAgent): void {
    this.agents.set(role, agent)
    
    const layer = this.getLayerByRole(role)
    if (layer) {
      this.emit('layer_activated', {
        layer,
        agents: Array.from(this.agents.keys()).filter(r => this.getLayerByRole(r) === layer),
      })
    }
  }

  /**
   * 获取Agent所在层级
   */
  private getLayerByRole(role: AgentRole): AgentLayer | undefined {
    for (const [layer, config] of this.layers) {
      if (config.agents.includes(role)) {
        return layer
      }
    }
    return undefined
  }

  /**
   * 获取层级配置
   */
  getLayerConfig(layer: AgentLayer): LayerConfig | undefined {
    return this.layers.get(layer)
  }

  /**
   * 获取层级中的所有Agent
   */
  getLayerAgents(layer: AgentLayer): BaseAgent[] {
    const config = this.layers.get(layer)
    if (!config) return []

    return config.agents
      .map(role => this.agents.get(role))
      .filter((agent): agent is BaseAgent => agent !== undefined)
  }

  /**
   * 激活层级
   */
  activateLayer(layer: AgentLayer): void {
    this.activeLayer = layer
    const config = this.layers.get(layer)
    if (config) {
      this.emit('layer_activated', {
        layer,
        agents: config.agents,
      })
    }
  }

  /**
   * 获取当前活跃层级
   */
  getActiveLayer(): AgentLayer {
    return this.activeLayer
  }

  /**
   * 按层级执行任务
   */
  async executeByLayer(
    layer: AgentLayer,
    task: AgentTask,
    _context: TaskContext
  ): Promise<TaskResult[]> {
    const agents = this.getLayerAgents(layer)
    const config = this.layers.get(layer)

    if (!config || agents.length === 0) {
      return [{
        success: false,
        error: `层级 ${layer} 没有可用的Agent`,
        agentId: 'meta-oracle',
        duration: 0,
      }]
    }

    const results: TaskResult[] = []
    const concurrency = Math.min(config.maxConcurrency, agents.length)

    for (let i = 0; i < agents.length; i += concurrency) {
      const batch = agents.slice(i, i + concurrency)
      const batchResults = await Promise.all(
        batch.map(agent => agent.execute(task))
      )
      results.push(...batchResults)
    }

    if (this.config.enableQualityGates) {
      const passed = await this.checkQualityGate(layer, task, results)
      if (!passed) {
        this.emit('quality_gate_failed', {
          taskId: task.id,
          layer,
          reason: '质量门检查未通过',
        })
      } else {
        this.emit('quality_gate_passed', {
          taskId: task.id,
          layer,
        })
      }
    }

    return results
  }

  /**
   * 三层协同执行
   */
  async collaborativeExecute(
    task: AgentTask,
    context: TaskContext
  ): Promise<TaskResult> {
    const commanderResults = await this.executeByLayer('commander', task, context)
    
    if (!commanderResults[0]?.success) {
      return commanderResults[0] || {
        success: false,
        error: '指挥层执行失败',
        agentId: 'commander',
        duration: 0,
      }
    }

    const plan = commanderResults[0].data as { plan?: unknown } | undefined
    if (!plan?.plan) {
      return {
        success: false,
        error: '未能生成执行计划',
        agentId: 'commander',
        duration: 0,
      }
    }

    const executorResults = await this.executeByLayer('executor', task, context)
    
    const supporterResults = await this.executeByLayer('supporter', task, context)

    const finalResult = this.aggregateResults(commanderResults, executorResults, supporterResults)

    return finalResult
  }

  /**
   * 聚合结果
   */
  private aggregateResults(
    commanderResults: TaskResult[],
    executorResults: TaskResult[],
    supporterResults: TaskResult[]
  ): TaskResult {
    const allResults = [...commanderResults, ...executorResults, ...supporterResults]
    const successCount = allResults.filter(r => r.success).length
    const success = successCount === allResults.length

    return {
      success,
      data: {
        commander: commanderResults,
        executor: executorResults,
        supporter: supporterResults,
        summary: {
          total: allResults.length,
          successful: successCount,
          failed: allResults.length - successCount,
        },
      },
      agentId: 'meta-oracle',
      duration: 0,
    }
  }

  /**
   * 质量门检查
   */
  private async checkQualityGate(
    layer: AgentLayer,
    _task: AgentTask,
    results: TaskResult[]
  ): Promise<boolean> {
    const successRate = results.filter(r => r.success).length / results.length
    const threshold = layer === 'commander' ? 1.0 : layer === 'executor' ? 0.8 : 0.7

    return successRate >= threshold
  }

  /**
   * 获取架构统计
   */
  getStats(): {
    layers: number
    totalAgents: number
    activeAgents: number
    layerStats: Map<AgentLayer, { agents: number; active: boolean }>
  } {
    const layerStats = new Map<AgentLayer, { agents: number; active: boolean }>()

    for (const [layer, config] of this.layers) {
      const activeAgents = config.agents.filter(role => this.agents.has(role))
      layerStats.set(layer, {
        agents: config.agents.length,
        active: activeAgents.length === config.agents.length,
      })
    }

    return {
      layers: this.layers.size,
      totalAgents: this.agents.size,
      activeAgents: this.agents.size,
      layerStats,
    }
  }
}
