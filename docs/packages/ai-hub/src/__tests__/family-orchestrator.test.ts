import { describe, expect, it } from 'vitest'
import { FamilyOrchestrator } from '../family/orchestrator'
import type { ConversationContext, TaskContext } from '../family/types'

const createTestContext = (): ConversationContext => ({
  userId: 'user-1',
  sessionId: 'session-1',
  history: [],
  currentEmotion: undefined,
  activeGoals: [],
  relevantKnowledge: [],
})

const createTestTask = (overrides?: Partial<TaskContext>): TaskContext => ({
  taskId: 'task-1',
  description: '分析用户数据',
  type: 'working',
  complexity: 'moderate',
  urgency: 'medium',
  requiredCapabilities: ['data-analysis'],
  userContext: createTestContext(),
  ...overrides,
})

describe('FamilyOrchestrator', () => {
  it('should create instance', () => {
    const orchestrator = new FamilyOrchestrator()
    expect(orchestrator).toBeDefined()
  })

  it('should orchestrate a task', async () => {
    const orchestrator = new FamilyOrchestrator()
    const task = createTestTask()
    const session = await orchestrator.orchestrate(task)
    expect(session).toBeDefined()
    expect(session.id).toContain('session_')
    expect(session.task).toBe(task)
    expect(session.startTime).toBeDefined()
  })

  it('should set session status to completed after orchestration', async () => {
    const orchestrator = new FamilyOrchestrator()
    const task = createTestTask()
    const session = await orchestrator.orchestrate(task)
    expect(session.status).toBe('completed')
  })

  it('should select members for task', async () => {
    const orchestrator = new FamilyOrchestrator()
    const task = createTestTask()
    const session = await orchestrator.orchestrate(task)
    expect(session.members).toBeDefined()
    expect(Array.isArray(session.members)).toBe(true)
  })

  it('should set collaboration mode', async () => {
    const orchestrator = new FamilyOrchestrator()
    const task = createTestTask()
    const session = await orchestrator.orchestrate(task)
    expect(session.mode).toBeDefined()
    expect(typeof session.mode).toBe('string')
  })

  it('should handle exploration task', async () => {
    const orchestrator = new FamilyOrchestrator()
    const task = createTestTask({ type: 'exploring', requiredCapabilities: ['search'] })
    const session = await orchestrator.orchestrate(task)
    expect(session).toBeDefined()
  })

  it('should handle learning task', async () => {
    const orchestrator = new FamilyOrchestrator()
    const task = createTestTask({
      type: 'learning',
      requiredCapabilities: ['natural-language-understanding'],
    })
    const session = await orchestrator.orchestrate(task)
    expect(session).toBeDefined()
  })

  it('should produce outputs', async () => {
    const orchestrator = new FamilyOrchestrator()
    const task = createTestTask()
    const session = await orchestrator.orchestrate(task)
    expect(Array.isArray(session.outputs)).toBe(true)
  })
})
