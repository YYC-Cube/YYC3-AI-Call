import { beforeEach, describe, expect, it } from 'vitest'
import { BaseFamilyMember } from '../family/base-member'
import type {
  ConversationContext,
  ConversationTurn,
  EmotionState,
  FamilyMemberConfig,
  MultimodalInput,
  MultimodalResponse,
  TaskContext,
  UserProfile,
} from '../family/types'

class TestableMember extends BaseFamilyMember {
  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    return {
      text: `Hello from ${this.name}`,
      emotion: this.senseEmotion(context),
    }
  }
}

const createTestConfig = (): FamilyMemberConfig => ({
  id: 'test-member',
  name: 'TestMember',
  displayName: 'Test Member',
  role: 'teacher',
  description: 'A test member',
  capabilities: ['teaching', 'mentoring'],
  personality: {
    tone: 'warm',
    proactivity: 0.8,
    empathy: 0.9,
    patience: 0.85,
  },
  triggers: ['帮助', '学习'],
  collaborationPreferences: {
    preferredPartners: ['wanwu'],
    preferredModes: ['sequential'],
  },
})

const createTestTurn = (emotion?: EmotionState): ConversationTurn => ({
  id: 'turn-1',
  timestamp: new Date(),
  speaker: 'user',
  content: { text: '你好' },
  emotion,
})

const createTestContext = (overrides?: Partial<ConversationContext>): ConversationContext => ({
  userId: 'user-1',
  sessionId: 'session-1',
  history: [],
  currentEmotion: undefined,
  activeGoals: [],
  relevantKnowledge: [],
  ...overrides,
})

const createTestTask = (): TaskContext => ({
  taskId: 'task-1',
  description: 'test task',
  type: 'learning',
  complexity: 'simple',
  urgency: 'low',
  requiredCapabilities: ['teaching'],
  userContext: createTestContext(),
})

const createTestProfile = (): UserProfile => ({
  id: 'user-1',
  name: 'Test User',
  capabilities: {
    skills: new Map([['coding', 0.5]]),
    knowledgeAreas: new Map([['typescript', 0.3]]),
    growthRate: 0.1,
  },
  interests: {
    domains: ['programming'],
    learningStyle: 'visual',
    interactionMode: 'proactive',
  },
  emotions: {
    patterns: [],
    stressLevel: 0.3,
    supportNeeds: [],
  },
  growth: {
    goals: [],
    milestones: [],
    achievements: [],
    stage: 'sapling',
  },
  preferences: {
    communicationStyle: 'casual',
    responseLength: 'detailed',
    proactivityLevel: 0.7,
  },
})

describe('BaseFamilyMember', () => {
  let member: TestableMember

  beforeEach(() => {
    member = new TestableMember(createTestConfig())
  })

  it('should set id from config', () => {
    expect(member.id).toBe('test-member')
  })

  it('should set name from config displayName', () => {
    expect(member.name).toBe('Test Member')
  })

  it('should set role from config', () => {
    expect(member.role).toBe('teacher')
  })

  it('should initialize with active status', () => {
    const status = member.getStatus()
    expect(status.isActive).toBe(true)
    expect(status.id).toBe('test-member')
    expect(status.name).toBe('Test Member')
  })

  it('should have initial performance score of 1.0', () => {
    const status = member.getStatus()
    expect(status.performanceScore).toBe(1.0)
  })

  it('should have initial currentLoad of 0', () => {
    const status = member.getStatus()
    expect(status.currentLoad).toBe(0)
  })

  it('should set capabilities in status', () => {
    const status = member.getStatus()
    expect(status.capabilities).toEqual(['teaching', 'mentoring'])
  })

  it('should re-initialize with new config', async () => {
    const newConfig = { ...createTestConfig(), id: 'updated-id' }
    await member.initialize(newConfig)
    const status = member.getStatus()
    expect(status).toBeDefined()
  })

  it('should process input and return response', async () => {
    const context = createTestContext()
    const input: MultimodalInput = { text: '你好' }
    const response = await member.processInput(input, context)
    expect(response.text).toBe('Hello from Test Member')
    expect(response.emotion).toBeDefined()
  })

  it('should sense emotion from context history', () => {
    const emotion: EmotionState = {
      type: 'joy',
      intensity: 0.8,
      confidence: 0.9,
      timestamp: new Date(),
    }
    const context = createTestContext({
      history: [createTestTurn(emotion)],
    })
    const sensed = member.senseEmotion(context)
    expect(sensed.type).toBe('joy')
    expect(sensed.intensity).toBe(0.8)
  })

  it('should return default emotion when no history', () => {
    const context = createTestContext()
    const sensed = member.senseEmotion(context)
    expect(sensed.type).toBe('peace')
    expect(sensed.intensity).toBe(0.5)
    expect(sensed.confidence).toBe(0.7)
  })

  it('should return default emotion for empty history', () => {
    const context = createTestContext({ history: [] })
    const sensed = member.senseEmotion(context)
    expect(sensed.type).toBe('peace')
  })

  it('should personalize response', () => {
    const response: MultimodalResponse = {
      text: '原始回复',
      emotion: { type: 'peace', intensity: 0.5, confidence: 0.7, timestamp: new Date() },
    }
    const profile = createTestProfile()
    const personalized = member.personalizeResponse(response, profile)
    expect(personalized).toBeDefined()
    expect(personalized.text).toBeDefined()
  })

  it('should get recommended actions', () => {
    const context = createTestContext()
    const actions = member.getRecommendedActions(context)
    expect(Array.isArray(actions)).toBe(true)
  })

  it('should update profile with feedback', () => {
    member.updateProfile({
      userId: 'user-1',
      memberId: 'test-member',
      rating: 5,
      helpful: true,
      timestamp: new Date(),
    })
    const status = member.getStatus()
    expect(status).toBeDefined()
  })

  it('should canHandle return boolean', () => {
    const task = createTestTask()
    const result = member.canHandle(task)
    expect(typeof result).toBe('boolean')
  })
})
