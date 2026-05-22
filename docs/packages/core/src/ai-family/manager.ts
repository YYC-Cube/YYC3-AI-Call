/**
 * file manager.ts
 * description 管理器核心
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
 * brief 管理器核心
 */
import { EventEmitter } from 'eventemitter3'
import type { UnifiedAuthManager } from '../auth/unified-auth.js'
import { 
  BaseAgent, 
  AgentClasses,
} from './agents.js'
import { getAllAgentDefinitions } from './definitions.js'
import type {
  AgentRole,
  AgentTask,
  TaskContext,
  TaskResult,
  TaskPriority,
  CollaborationTask,
  AgentRecommendation,
} from './types.js'

/**
 * AI Family 管理器事件
 */
export interface AIFamilyEvents {
  agent_registered: { agentId: AgentRole }
  agent_status_changed: { agentId: AgentRole; status: string }
  task_queued: { taskId: string }
  task_started: { taskId: string; agentId: AgentRole }
  task_completed: { taskId: string; agentId: AgentRole; result: TaskResult }
  task_failed: { taskId: string; agentId: AgentRole; error: string }
  collaboration_started: { collaborationId: string }
  collaboration_completed: { collaborationId: string; results: TaskResult[] }
}

/**
 * AI Family 管理器配置
 */
export interface AIFamilyConfig {
  authManager: UnifiedAuthManager
  maxQueueSize?: number
  taskTimeout?: number
  enableCollaboration?: boolean
}

/**
 * AI Family 管理器
 */
export class AIFamilyManager extends EventEmitter<AIFamilyEvents> {
  private agents: Map<AgentRole, BaseAgent> = new Map()
  private taskQueue: AgentTask[] = []
  private runningTasks: Map<string, { task: AgentTask; agent: BaseAgent }> = new Map()
  private config: Required<AIFamilyConfig>

  constructor(config: AIFamilyConfig) {
    super()
    this.config = {
      authManager: config.authManager,
      maxQueueSize: config.maxQueueSize ?? 100,
      taskTimeout: config.taskTimeout ?? 60000,
      enableCollaboration: config.enableCollaboration ?? true,
    }
    
    this.initializeAgents()
  }

  /**
   * 初始化所有智能体
   */
  private initializeAgents(): void {
    const definitions = getAllAgentDefinitions()
    
    for (const definition of definitions) {
      const AgentClass = AgentClasses[definition.id]
      if (AgentClass) {
        const agent = new AgentClass({
          authManager: this.config.authManager,
        })
        
        this.agents.set(definition.id, agent)
        this.emit('agent_registered', { agentId: definition.id })
      }
    }
  }

  /**
   * 获取智能体
   */
  getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role)
  }

  /**
   * 获取所有智能体
   */
  getAllAgents(): Map<AgentRole, BaseAgent> {
    return new Map(this.agents)
  }

  /**
   * 获取智能体状态
   */
  getAgentStatus(role: AgentRole): string {
    const agent = this.agents.get(role)
    return agent?.getState().status || 'offline'
  }

  /**
   * 创建任务
   */
  createTask(
    type: string,
    input: unknown,
    context: Partial<TaskContext>,
    priority: TaskPriority = 'medium'
  ): AgentTask {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      input,
      context: {
        sessionId: context.sessionId || `session-${Date.now()}`,
        userId: context.userId,
        conversationHistory: context.conversationHistory || [],
        metadata: context.metadata || {},
        parentTaskId: context.parentTaskId,
      },
      status: 'pending',
      createdAt: new Date(),
    }
  }

  /**
   * 提交任务
   */
  async submitTask(task: AgentTask): Promise<TaskResult> {
    if (this.taskQueue.length >= this.config.maxQueueSize) {
      return {
        success: false,
        error: '任务队列已满',
        duration: 0,
      }
    }

    const recommendedAgents = this.recommendAgents(task)
    
    if (recommendedAgents.length === 0) {
      return {
        success: false,
        error: '没有可用的智能体处理此任务',
        duration: 0,
      }
    }

    task.assignedAgent = recommendedAgents[0].agentId
    task.status = 'queued'
    this.taskQueue.push(task)
    this.emit('task_queued', { taskId: task.id })

    return this.processTask(task)
  }

  /**
   * 处理任务
   */
  private async processTask(task: AgentTask): Promise<TaskResult> {
    const agent = this.agents.get(task.assignedAgent!)
    
    if (!agent) {
      return {
        success: false,
        error: `智能体 ${task.assignedAgent} 不存在`,
        duration: 0,
      }
    }

    if (!agent.canAcceptTask()) {
      return {
        success: false,
        error: `智能体 ${agent.getName()} 当前无法接受任务`,
        duration: 0,
      }
    }

    task.status = 'running'
    task.startedAt = new Date()
    this.runningTasks.set(task.id, { task, agent })
    this.emit('task_started', { taskId: task.id, agentId: task.assignedAgent! })

    try {
      const result = await Promise.race([
        agent.execute(task),
        new Promise<TaskResult>((_, reject) => {
          setTimeout(() => reject(new Error('任务超时')), this.config.taskTimeout)
        }),
      ])

      task.status = 'completed'
      task.completedAt = new Date()
      task.result = result
      
      this.emit('task_completed', { 
        taskId: task.id, 
        agentId: task.assignedAgent!, 
        result 
      })

      return result
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : String(error)
      
      this.emit('task_failed', { 
        taskId: task.id, 
        agentId: task.assignedAgent!, 
        error: task.error 
      })

      return {
        success: false,
        error: task.error,
        duration: 0,
      }
    } finally {
      this.runningTasks.delete(task.id)
      const index = this.taskQueue.indexOf(task)
      if (index > -1) {
        this.taskQueue.splice(index, 1)
      }
    }
  }

  /**
   * 推荐智能体
   */
  recommendAgents(task: AgentTask): AgentRecommendation[] {
    const recommendations: AgentRecommendation[] = []
    const taskType = task.type.toLowerCase()
    const inputStr = JSON.stringify(task.input).toLowerCase()

    for (const [role, agent] of this.agents) {
      let confidence = 0

      if (taskType.includes('orchestrat') || taskType.includes('coordination')) {
        if (role === 'meta-oracle') confidence = 0.9
      } else if (taskType.includes('security') || taskType.includes('threat')) {
        if (role === 'sentinel') confidence = 0.9
      } else if (taskType.includes('code') || taskType.includes('quality')) {
        if (role === 'master') confidence = 0.9
      } else if (taskType.includes('creative') || taskType.includes('design')) {
        if (role === 'creative') confidence = 0.9
      } else if (taskType.includes('intent') || taskType.includes('navigate')) {
        if (role === 'navigator') confidence = 0.9
      } else if (taskType.includes('analyze') || taskType.includes('insight')) {
        if (role === 'thinker') confidence = 0.9
      } else if (taskType.includes('predict') || taskType.includes('forecast')) {
        if (role === 'prophet') confidence = 0.9
      } else if (taskType.includes('recommend') || taskType.includes('match')) {
        if (role === 'bolero') confidence = 0.9
      }

      if (inputStr.includes('代码') || inputStr.includes('编程')) {
        if (role === 'master') confidence = Math.max(confidence, 0.7)
      }
      if (inputStr.includes('安全') || inputStr.includes('风险')) {
        if (role === 'sentinel') confidence = Math.max(confidence, 0.7)
      }
      if (inputStr.includes('创意') || inputStr.includes('设计')) {
        if (role === 'creative') confidence = Math.max(confidence, 0.7)
      }

      if (confidence > 0 && agent.canAcceptTask()) {
        recommendations.push({
          agentId: role,
          confidence,
          reason: `匹配任务类型: ${task.type}`,
        })
      }
    }

    if (recommendations.length === 0) {
      const navigator = this.agents.get('navigator')
      if (navigator?.canAcceptTask()) {
        recommendations.push({
          agentId: 'navigator',
          confidence: 0.5,
          reason: '默认导航员处理通用任务',
        })
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * 协同执行任务
   */
  async collaborate(collaboration: CollaborationTask): Promise<TaskResult[]> {
    if (!this.config.enableCollaboration) {
      return [{
        success: false,
        error: '协同功能未启用',
        duration: 0,
      }]
    }

    this.emit('collaboration_started', { collaborationId: collaboration.id })
    const results: TaskResult[] = []

    try {
      switch (collaboration.mode) {
        case 'sequential':
          for (const task of collaboration.tasks) {
            const result = await this.submitTask(task)
            results.push(result)
            if (!result.success && collaboration.aggregationStrategy !== 'merge') {
              break
            }
          }
          break

        case 'parallel': {
          const parallelResults = await Promise.all(
            collaboration.tasks.map(task => this.submitTask(task))
          )
          results.push(...parallelResults)
          break
        }

        case 'hierarchical': {
          const primaryTask = collaboration.tasks[0]
          const primaryResult = await this.submitTask(primaryTask)
          results.push(primaryResult)
          
          if (primaryResult.success && collaboration.tasks.length > 1) {
            const secondaryResults = await Promise.all(
              collaboration.tasks.slice(1).map(task => this.submitTask(task))
            )
            results.push(...secondaryResults)
          }
          break
        }

        case 'consensus': {
          const consensusResults = await Promise.all(
            collaboration.tasks.map(task => this.submitTask(task))
          )
          results.push(...consensusResults)
          break
        }
      }

      this.emit('collaboration_completed', { 
        collaborationId: collaboration.id, 
        results 
      })

      return results
    } catch (error) {
      return [{
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
      }]
    }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    queueLength: number
    runningTasks: number
    maxQueueSize: number
  } {
    return {
      queueLength: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      maxQueueSize: this.config.maxQueueSize,
    }
  }

  /**
   * 获取所有智能体统计
   */
  getAgentsStats(): Map<AgentRole, ReturnType<BaseAgent['getStats']>> {
    const stats = new Map<AgentRole, ReturnType<BaseAgent['getStats']>>()
    
    for (const [role, agent] of this.agents) {
      stats.set(role, agent.getStats())
    }
    
    return stats
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.taskQueue = []
    this.runningTasks.clear()
    this.agents.clear()
    this.removeAllListeners()
  }
}
