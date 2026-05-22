/**
 * file agent-collaboration.ts
 * description Agent 协作系统
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
 * brief Agent 协作系统
 */
import { EventEmitter } from 'eventemitter3'
import type { BaseAgent } from './base-agent.js'
import type {
  AgentRole,
  AgentTask,
  TaskContext,
  TaskResult,
  CollaborationTask,
} from './types.js'

/**
 * 协同消息类型
 */
export type CollaborationMessageType = 
  | 'request'
  | 'response'
  | 'notification'
  | 'broadcast'
  | 'delegation'

/**
 * 协同消息
 */
export interface CollaborationMessage {
  id: string
  type: CollaborationMessageType
  from: AgentRole
  to: AgentRole | AgentRole[]
  content: unknown
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  requiresResponse: boolean
  timeout?: number
}

/**
 * 协同会话
 */
export interface CollaborationSession {
  id: string
  participants: AgentRole[]
  leader: AgentRole
  task: CollaborationTask
  messages: CollaborationMessage[]
  status: 'active' | 'paused' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
}

/**
 * 协同策略
 */
export type CollaborationStrategy = 
  | 'sequential'
  | 'parallel'
  | 'hierarchical'
  | 'consensus'
  | 'auction'

/**
 * 协同配置
 */
export interface CollaborationConfig {
  maxConcurrentSessions: number
  messageTimeout: number
  retryAttempts: number
  enableLogging: boolean
}

/**
 * 协同事件
 */
export interface CollaborationEvents {
  session_started: { sessionId: string; participants: AgentRole[] }
  session_completed: { sessionId: string; result: TaskResult }
  message_sent: { message: CollaborationMessage }
  message_received: { message: CollaborationMessage }
  agent_joined: { sessionId: string; agent: AgentRole }
  agent_left: { sessionId: string; agent: AgentRole }
}

/**
 * Agent协同系统
 * 实现智能体间的协同通信和协作
 */
export class AgentCollaboration extends EventEmitter<CollaborationEvents> {
  private agents: Map<AgentRole, BaseAgent> = new Map()
  private sessions: Map<string, CollaborationSession> = new Map()
  private messageQueue: Map<string, CollaborationMessage[]> = new Map()
  private config: Required<CollaborationConfig>

  constructor(config: Partial<CollaborationConfig> = {}) {
    super()
    this.config = {
      maxConcurrentSessions: config.maxConcurrentSessions ?? 10,
      messageTimeout: config.messageTimeout ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      enableLogging: config.enableLogging ?? true,
    }
  }

  /**
   * 注册Agent
   */
  registerAgent(role: AgentRole, agent: BaseAgent): void {
    this.agents.set(role, agent)
    this.messageQueue.set(role, [])
  }

  /**
   * 创建协同会话
   */
  createSession(
    participants: AgentRole[],
    leader: AgentRole,
    task: CollaborationTask
  ): CollaborationSession {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const session: CollaborationSession = {
      id: sessionId,
      participants,
      leader,
      task,
      messages: [],
      status: 'active',
      startTime: new Date(),
    }

    this.sessions.set(sessionId, session)
    
    this.emit('session_started', {
      sessionId,
      participants,
    })

    return session
  }

  /**
   * 发送消息
   */
  async sendMessage(message: CollaborationMessage): Promise<void> {
    const session = this.findSessionByAgent(message.from)
    
    if (session) {
      session.messages.push(message)
    }

    const recipients = Array.isArray(message.to) ? message.to : [message.to]
    
    for (const recipient of recipients) {
      const queue = this.messageQueue.get(recipient)
      if (queue) {
        queue.push(message)
      }
    }

    this.emit('message_sent', { message })

    if (message.requiresResponse) {
      await this.waitForResponse(message)
    }
  }

  /**
   * 接收消息
   */
  receiveMessage(agentRole: AgentRole): CollaborationMessage | undefined {
    const queue = this.messageQueue.get(agentRole)
    if (queue && queue.length > 0) {
      const message = queue.shift()
      if (message) {
        this.emit('message_received', { message })
        return message
      }
    }
    return undefined
  }

  /**
   * 等待响应
   */
  private async waitForResponse(message: CollaborationMessage): Promise<void> {
    const timeout = message.timeout || this.config.messageTimeout
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`消息响应超时: ${message.id}`))
      }, timeout)

      this.once('message_received', (event) => {
        if (event.message.id === message.id) {
          clearTimeout(timer)
          resolve()
        }
      })
    })
  }

  /**
   * 协同执行任务
   */
  async collaborate(
    task: CollaborationTask,
    strategy: CollaborationStrategy,
    context: TaskContext
  ): Promise<TaskResult[]> {
    const session = this.createSession(task.participants || task.agents, task.leader || task.agents[0], task)
    
    try {
      let results: TaskResult[]

      switch (strategy) {
        case 'sequential':
          results = await this.executeSequential(session, task, context)
          break
        case 'parallel':
          results = await this.executeParallel(session, task, context)
          break
        case 'hierarchical':
          results = await this.executeHierarchical(session, task, context)
          break
        case 'consensus':
          results = await this.executeConsensus(session, task, context)
          break
        case 'auction':
          results = await this.executeAuction(session, task, context)
          break
        default:
          results = await this.executeParallel(session, task, context)
      }

      session.status = 'completed'
      session.endTime = new Date()

      const finalResult = this.aggregateResults(results)
      this.emit('session_completed', {
        sessionId: session.id,
        result: finalResult,
      })

      return results
    } catch (error) {
      session.status = 'failed'
      session.endTime = new Date()

      return [{
        success: false,
        error: error instanceof Error ? error.message : String(error),
        agentId: task.leader,
        duration: 0,
      }]
    }
  }

  /**
   * 顺序执行
   */
  private async executeSequential(
    session: CollaborationSession,
    task: CollaborationTask,
    _context: TaskContext
  ): Promise<TaskResult[]> {
    const results: TaskResult[] = []

    for (const participant of session.participants) {
      const agent = this.agents.get(participant)
      if (!agent) continue

      const message: CollaborationMessage = {
        id: `msg-${Date.now()}`,
        type: 'delegation',
        from: session.leader,
        to: participant,
        content: (task.subtasks as Record<string, unknown> | undefined)?.[participant] || task,
        priority: 'high',
        timestamp: new Date(),
        requiresResponse: true,
      }

      await this.sendMessage(message)
      
      const agentTask = task as unknown as AgentTask
      const result = await agent.execute(agentTask)
      results.push(result)
    }

    return results
  }

  /**
   * 并行执行
   */
  private async executeParallel(
    session: CollaborationSession,
    task: CollaborationTask,
    _context: TaskContext
  ): Promise<TaskResult[]> {
    const promises: Promise<TaskResult>[] = []

    for (const participant of session.participants) {
      const agent = this.agents.get(participant)
      if (!agent) continue

      const agentTask = task as unknown as AgentTask
      promises.push(agent.execute(agentTask))
    }

    return Promise.all(promises)
  }

  /**
   * 层级执行
   */
  private async executeHierarchical(
    session: CollaborationSession,
    task: CollaborationTask,
    context: TaskContext
  ): Promise<TaskResult[]> {
    const leader = this.agents.get(session.leader)
    if (!leader) {
      return [{
        success: false,
        error: '领导者Agent不存在',
        agentId: session.leader,
        duration: 0,
      }]
    }

    const agentTask = task as unknown as AgentTask
    const plan = await leader.execute(agentTask)
    
    const planData = plan.data as { assignments?: unknown } | undefined
    if (!plan.success || !planData?.assignments) {
      return [plan]
    }

    const subResults = await this.executeParallel(session, task, context)
    
    return [plan, ...subResults]
  }

  /**
   * 共识执行
   */
  private async executeConsensus(
    session: CollaborationSession,
    task: CollaborationTask,
    context: TaskContext
  ): Promise<TaskResult[]> {
    const results = await this.executeParallel(session, task, context)
    
    const voteMap = new Map<string, number>()
    for (const result of results) {
      if (result.success && result.data) {
        const resultData = result.data as { decision?: unknown }
        if (resultData.decision) {
          const decision = JSON.stringify(resultData.decision)
          voteMap.set(decision, (voteMap.get(decision) || 0) + 1)
        }
      }
    }

    let maxVotes = 0
    let consensus: string | undefined
    for (const [decision, votes] of voteMap) {
      if (votes > maxVotes) {
        maxVotes = votes
        consensus = decision
      }
    }

    return results.map(r => ({
      ...r,
      data: {
        ...(r.data as Record<string, unknown> || {}),
        consensus: consensus ? JSON.parse(consensus) : null,
        votes: maxVotes,
      },
    }))
  }

  /**
   * 拍卖执行
   */
  private async executeAuction(
    session: CollaborationSession,
    task: CollaborationTask,
    context: TaskContext
  ): Promise<TaskResult[]> {
    const bids: { agent: AgentRole; score: number }[] = []

    for (const participant of session.participants) {
      const agent = this.agents.get(participant)
      if (!agent) continue

      const agentTask = task as unknown as AgentTask
      const bid = await agent.estimateCapability(agentTask, context)
      bids.push({ agent: participant, score: bid.score })
    }

    bids.sort((a, b) => b.score - a.score)
    
    const winner = bids[0]?.agent
    if (!winner) {
      return [{
        success: false,
        error: '没有Agent竞标任务',
        agentId: session.leader,
        duration: 0,
      }]
    }

    const winnerAgent = this.agents.get(winner)
    if (!winnerAgent) {
      return [{
        success: false,
        error: '获胜Agent不存在',
        agentId: winner,
        duration: 0,
      }]
    }

    const agentTask = task as unknown as AgentTask
    const result = await winnerAgent.execute(agentTask)
    
    return [{
      ...result,
      data: {
        ...(result.data as Record<string, unknown> || {}),
        auctionWinner: winner,
        bidScore: bids[0].score,
      },
    }]
  }

  /**
   * 聚合结果
   */
  private aggregateResults(results: TaskResult[]): TaskResult {
    const successCount = results.filter(r => r.success).length
    const success = successCount > results.length / 2

    return {
      success,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
        },
      },
      agentId: 'meta-oracle',
      duration: 0,
    }
  }

  /**
   * 查找Agent所在会话
   */
  private findSessionByAgent(agentRole: AgentRole): CollaborationSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.participants.includes(agentRole)) {
        return session
      }
    }
    return undefined
  }

  /**
   * 获取活跃会话
   */
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active')
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSessions: number
    activeSessions: number
    totalMessages: number
    agentParticipation: Map<AgentRole, number>
  } {
    let totalMessages = 0
    const agentParticipation = new Map<AgentRole, number>()

    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length
      
      for (const participant of session.participants) {
        agentParticipation.set(participant, (agentParticipation.get(participant) || 0) + 1)
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions: this.getActiveSessions().length,
      totalMessages,
      agentParticipation,
    }
  }
}
