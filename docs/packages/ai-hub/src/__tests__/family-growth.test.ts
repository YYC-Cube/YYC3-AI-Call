import { describe, expect, it } from 'vitest'
import { PersonalizedGrowthSystem } from '../family/growth-system'

describe('PersonalizedGrowthSystem', () => {
  it('should create instance', () => {
    const gs = new PersonalizedGrowthSystem()
    expect(gs).toBeDefined()
  })

  it('should create user profile', () => {
    const gs = new PersonalizedGrowthSystem()
    const profile = gs.createProfile('user-1', 'Test User')
    expect(profile).toBeDefined()
    expect(profile.id).toBe('user-1')
    expect(profile.name).toBe('Test User')
    expect(profile.growth.stage).toBe('seed')
  })

  it('should get profile after creation', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const profile = gs.getProfile('user-1')
    expect(profile).toBeDefined()
    expect(profile!.id).toBe('user-1')
  })

  it('should return undefined for non-existent profile', () => {
    const gs = new PersonalizedGrowthSystem()
    const profile = gs.getProfile('nonexistent')
    expect(profile).toBeUndefined()
  })

  it('should set goal for user', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const goal = gs.setGoal('user-1', {
      title: '学习 TypeScript',
      description: '掌握 TypeScript 基础',
      category: 'skill',
      priority: 'high',
    })
    expect(goal).toBeDefined()
    expect(goal.id).toContain('goal_')
    expect(goal.status).toBe('not_started')
    expect(goal.progress).toBe(0)
  })

  it('should throw when setting goal for non-existent user', () => {
    const gs = new PersonalizedGrowthSystem()
    expect(() => gs.setGoal('nonexistent', {
      title: 'Test',
      description: 'Test',
      category: 'skill',
      priority: 'medium',
    })).toThrow('用户档案不存在')
  })

  it('should update goal progress', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const goal = gs.setGoal('user-1', {
      title: '学习 TypeScript',
      description: '掌握 TypeScript 基础',
      category: 'skill',
      priority: 'medium',
    })
    const updated = gs.updateGoalProgress('user-1', goal.id, 50)
    expect(updated!.progress).toBe(50)
    expect(updated!.status).toBe('in_progress')
  })

  it('should complete goal at 100% progress', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const goal = gs.setGoal('user-1', {
      title: '学习 TypeScript',
      description: '掌握 TypeScript 基础',
      category: 'skill',
      priority: 'medium',
    })
    const updated = gs.updateGoalProgress('user-1', goal.id, 100)
    expect(updated!.progress).toBe(100)
    expect(updated!.status).toBe('completed')
  })

  it('should clamp progress between 0 and 100', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const goal = gs.setGoal('user-1', {
      title: 'Test',
      description: 'Test',
      category: 'skill',
      priority: 'low',
    })
    const over = gs.updateGoalProgress('user-1', goal.id, 200)
    expect(over!.progress).toBe(100)
    const under = gs.updateGoalProgress('user-1', goal.id, -50)
    expect(under!.progress).toBe(0)
  })

  it('should return undefined when updating non-existent goal', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const result = gs.updateGoalProgress('user-1', 'fake-goal', 50)
    expect(result).toBeUndefined()
  })

  it('should generate daily companion', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const companion = gs.generateDailyCompanion('user-1')
    expect(companion).toBeDefined()
    expect(companion.greeting).toContain('Test User')
    expect(companion.tip).toBeDefined()
    expect(companion.encouragement).toBeDefined()
    expect(companion.progressUpdate).toBeDefined()
  })

  it('should throw daily companion for non-existent user', () => {
    const gs = new PersonalizedGrowthSystem()
    expect(() => gs.generateDailyCompanion('nonexistent')).toThrow('用户档案不存在')
  })

  it('should generate weekly review', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const review = gs.generateWeeklyReview('user-1')
    expect(review).toBeDefined()
    expect(review.summary).toBeDefined()
    expect(Array.isArray(review.achievements)).toBe(true)
    expect(Array.isArray(review.challenges)).toBe(true)
    expect(Array.isArray(review.learnings)).toBe(true)
  })

  it('should generate growth report', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const report = gs.generateGrowthReport('user-1', {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    })
    expect(report).toBeDefined()
    expect(report.userId).toBe('user-1')
    expect(report.summary).toBeDefined()
    expect(Array.isArray(report.recommendations)).toBe(true)
    expect(Array.isArray(report.nextSteps)).toBe(true)
  })

  it('should recommend growth paths', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const paths = gs.recommendGrowthPath('user-1')
    expect(Array.isArray(paths)).toBe(true)
  })

  it('should recommend empty for non-existent user', () => {
    const gs = new PersonalizedGrowthSystem()
    const paths = gs.recommendGrowthPath('nonexistent')
    expect(paths).toEqual([])
  })

  it('should update growth stage', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const stage = gs.updateGrowthStage('user-1')
    expect(['seed', 'sprout', 'sapling', 'tree', 'forest']).toContain(stage)
  })

  it('should add milestone', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const milestone = gs.addMilestone('user-1', {
      title: 'First Commit',
      description: 'Made first code commit',
      significance: 'minor',
    })
    expect(milestone).toBeDefined()
    expect(milestone.id).toContain('milestone_')
    expect(milestone.title).toBe('First Commit')
    expect(milestone.achievedAt).toBeDefined()
  })

  it('should unlock first_step achievement on first goal completion', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')
    const goal = gs.setGoal('user-1', {
      title: 'Test',
      description: 'Test',
      category: 'skill',
      priority: 'medium',
    })
    gs.updateGoalProgress('user-1', goal.id, 100)
    const profile = gs.getProfile('user-1')
    expect(profile!.growth.achievements.length).toBeGreaterThan(0)
    expect(profile!.growth.achievements.some(a => a.id === 'first_step')).toBe(true)
  })

  it('should update growth stage based on progress', () => {
    const gs = new PersonalizedGrowthSystem()
    gs.createProfile('user-1', 'Test User')

    for (let i = 0; i < 5; i++) {
      const goal = gs.setGoal('user-1', {
        title: `Goal ${i}`,
        description: `Description ${i}`,
        category: 'skill',
        priority: 'low',
      })
      gs.updateGoalProgress('user-1', goal.id, 100)
    }

    const stage = gs.updateGrowthStage('user-1')
    expect(['sprout', 'sapling', 'tree', 'forest']).toContain(stage)
  })
})
