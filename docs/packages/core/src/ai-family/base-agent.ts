/**
 * file base-agent.ts
 * description Agent 基类
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
 * brief Agent 基类
 */
import { EventEmitter } from 'eventemitter3'
import type { 
  AgentDefinition, 
  AgentState, 
  AgentStatus,
  AgentTask,
  TaskContext,
  TaskResult,
} from './types.js'
import type { UnifiedAuthManager } from '../auth/unified-auth.js'

/**
 * 智能体事件类型
 */
export interface AgentEvents {
  status_changed: { status: AgentStatus }
  task_started: { taskId: string }
  task_completed: { taskId: string; result: TaskResult }
  task_failed: { taskId: string; error: string }
  error: { error: Error }
}

/**
 * 智能体配置
 */
export interface BaseAgentConfig {
  definition: AgentDefinition
  authManager: UnifiedAuthManager
}

/**
 * 基础智能体类
 */
export abstract class BaseAgent extends EventEmitter<AgentEvents> {
  protected definition: AgentDefinition
  protected authManager: UnifiedAuthManager
  protected state: AgentState
  protected currentTasks: Map<string, AgentTask> = new Map()

  constructor(config: BaseAgentConfig) {
    super()
    this.definition = config.definition
    this.authManager = config.authManager
    this.state = {
      status: 'idle',
      totalTasksCompleted: 0,
      averageResponseTime: 0,
      errorCount: 0,
    }
  }

  /**
   * 获取智能体定义
   */
  getDefinition(): AgentDefinition {
    return this.definition
  }

  /**
   * 获取智能体状态
   */
  getState(): AgentState {
    return { ...this.state }
  }

  /**
   * 获取智能体ID
   */
  getId(): string {
    return this.definition.id
  }

  /**
   * 获取智能体名称
   */
  getName(): string {
    return this.definition.displayName
  }

  /**
   * 是否可以接受新任务
   */
  canAcceptTask(): boolean {
    return (
      this.state.status !== 'offline' &&
      this.currentTasks.size < this.definition.maxConcurrentTasks
    )
  }

  /**
   * 执行任务
   */
  async execute(task: AgentTask): Promise<TaskResult> {
    if (!this.canAcceptTask()) {
      return {
        success: false,
        error: '智能体当前无法接受新任务',
        duration: 0,
      }
    }

    const startTime = Date.now()
    this.currentTasks.set(task.id, task)
    this.state.status = 'busy'
    this.state.currentTask = task.id
    this.emit('status_changed', { status: 'busy' })
    this.emit('task_started', { taskId: task.id })

    try {
      const result = await this.executeTask(task)
      
      result.duration = Date.now() - startTime
      
      this.state.totalTasksCompleted++
      this.updateAverageResponseTime(result.duration)
      
      this.emit('task_completed', { taskId: task.id, result })
      
      return result
    } catch (error) {
      const result: TaskResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      }
      
      this.state.errorCount++
      this.emit('task_failed', { taskId: task.id, error: result.error! })
      this.emit('error', { error: error instanceof Error ? error : new Error(String(error)) })
      
      return result
    } finally {
      this.currentTasks.delete(task.id)
      this.state.currentTask = undefined
      this.state.status = this.currentTasks.size > 0 ? 'busy' : 'idle'
      this.state.lastActiveTime = new Date()
      this.emit('status_changed', { status: this.state.status })
    }
  }

  /**
   * 执行具体任务（子类实现）
   */
  protected abstract executeTask(task: AgentTask): Promise<TaskResult>

  /**
   * 估算能力匹配度
   */
  async estimateCapability(task: AgentTask, _context: TaskContext): Promise<{ score: number }> {
    const capabilities = this.definition.capabilities
    let matchScore = 0
    
    for (const capability of capabilities) {
      if (task.type.includes(capability.name.toLowerCase())) {
        matchScore += 0.3
      }
    }
    
    return {
      score: Math.min(1, matchScore + 0.4)
    }
  }

  /**
   * 构建系统提示
   */
  protected buildSystemPrompt(): string {
    return this.definition.systemPrompt
  }

  /**
   * 构建消息
   */
  protected buildMessages(task: AgentTask): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: this.buildSystemPrompt() },
    ]

    if (task.context.conversationHistory.length > 0) {
      const history = task.context.conversationHistory
        .filter(m => m.role !== 'tool')
        .slice(-10)
        .map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        }))
      messages.push(...history)
    }

    messages.push({
      role: 'user',
      content: this.formatTaskInput(task),
    })

    return messages
  }

  /**
   * 格式化任务输入
   */
  protected formatTaskInput(task: AgentTask): string {
    return JSON.stringify(task.input, null, 2)
  }

  /**
   * 更新平均响应时间
   */
  private updateAverageResponseTime(duration: number): void {
    const total = this.state.totalTasksCompleted
    this.state.averageResponseTime = 
      (this.state.averageResponseTime * (total - 1) + duration) / total
  }

  /**
   * 设置状态
   */
  setStatus(status: AgentStatus): void {
    this.state.status = status
    this.emit('status_changed', { status })
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalTasks: number
    averageResponseTime: number
    errorRate: number
  } {
    return {
      totalTasks: this.state.totalTasksCompleted,
      averageResponseTime: this.state.averageResponseTime,
      errorRate: this.state.totalTasksCompleted > 0
        ? this.state.errorCount / this.state.totalTasksCompleted
        : 0,
    }
  }
}
