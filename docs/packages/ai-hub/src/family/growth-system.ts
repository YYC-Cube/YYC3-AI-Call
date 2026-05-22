/**
 * file growth-system.ts
 * description 成长系统
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 成长系统
 */
import {
  UserProfile,
  Goal,
  Milestone,
  Achievement,
  GrowthReport,
  RecommendedAction,
  GrowthStage,
} from './types';
import { logger } from '../logger.js';

export interface GrowthPath {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'knowledge' | 'project' | 'life';
  stages: GrowthStage[];
  estimatedDuration: number;
  prerequisites: string[];
  outcomes: string[];
}

export interface DailyCompanion {
  greeting: string;
  progressUpdate: string;
  encouragement: string;
  dailyGoal?: Goal;
  tip: string;
}

export interface WeeklyReview {
  summary: string;
  achievements: Achievement[];
  challenges: string[];
  learnings: string[];
  nextWeekGoals: Goal[];
}

export class PersonalizedGrowthSystem {
  private userProfiles: Map<string, UserProfile>;
  private growthPaths: Map<string, GrowthPath>;
  private achievements: Achievement[];
  
  constructor() {
    this.userProfiles = new Map();
    this.growthPaths = new Map();
    this.achievements = this.initializeAchievements();
    this.initializeGrowthPaths();
  }
  
  private initializeAchievements(): Achievement[] {
    return [
      {
        id: 'first_step',
        title: '第一步',
        description: '完成第一个目标',
        icon: '🎯',
        unlockedAt: new Date(),
        rarity: 'common',
      },
      {
        id: 'quick_learner',
        title: '快速学习者',
        description: '一周内完成3个学习目标',
        icon: '📚',
        unlockedAt: new Date(),
        rarity: 'rare',
      },
      {
        id: 'persistent',
        title: '坚持不懈',
        description: '连续7天保持学习',
        icon: '🔥',
        unlockedAt: new Date(),
        rarity: 'epic',
      },
      {
        id: 'breakthrough',
        title: '突破自我',
        description: '完成一个高难度目标',
        icon: '🚀',
        unlockedAt: new Date(),
        rarity: 'legendary',
      },
    ];
  }
  
  private initializeGrowthPaths(): void {
    const paths: GrowthPath[] = [
      {
        id: 'programming_basics',
        title: '编程基础',
        description: '从零开始学习编程',
        category: 'skill',
        stages: ['seed', 'sprout', 'sapling', 'tree'],
        estimatedDuration: 90,
        prerequisites: [],
        outcomes: ['掌握编程基础', '能够编写简单程序', '理解编程思维'],
      },
      {
        id: 'data_analysis',
        title: '数据分析',
        description: '学习数据分析技能',
        category: 'skill',
        stages: ['seed', 'sprout', 'sapling', 'tree'],
        estimatedDuration: 60,
        prerequisites: ['programming_basics'],
        outcomes: ['掌握数据分析工具', '能够进行数据可视化', '理解数据驱动决策'],
      },
      {
        id: 'ai_engineer',
        title: 'AI工程师',
        description: '成为AI工程师',
        category: 'skill',
        stages: ['seed', 'sprout', 'sapling', 'tree', 'forest'],
        estimatedDuration: 180,
        prerequisites: ['programming_basics', 'data_analysis'],
        outcomes: ['掌握AI/ML基础', '能够构建AI应用', '理解AI伦理'],
      },
    ];
    
    for (const path of paths) {
      this.growthPaths.set(path.id, path);
    }
  }
  
  createProfile(userId: string, name: string): UserProfile {
    const profile: UserProfile = {
      id: userId,
      name,
      capabilities: {
        skills: new Map(),
        knowledgeAreas: new Map(),
        growthRate: 0.5,
      },
      interests: {
        domains: [],
        learningStyle: 'visual',
        interactionMode: 'balanced',
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
        stage: 'seed',
      },
      preferences: {
        communicationStyle: 'adaptive',
        responseLength: 'adaptive',
        proactivityLevel: 0.5,
      },
    };
    
    this.userProfiles.set(userId, profile);
    return profile;
  }
  
  getProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }
  
  setGoal(userId: string, goal: Omit<Goal, 'id' | 'status' | 'progress'>): Goal {
    const profile = this.userProfiles.get(userId);
    if (!profile) throw new Error('用户档案不存在');
    
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
      status: 'not_started',
      progress: 0,
    };
    
    profile.growth.goals.push(newGoal);
    this.userProfiles.set(userId, profile);
    
    return newGoal;
  }
  
  updateGoalProgress(userId: string, goalId: string, progress: number): Goal | undefined {
    const profile = this.userProfiles.get(userId);
    if (!profile) return undefined;
    
    const goal = profile.growth.goals.find(g => g.id === goalId);
    if (!goal) return undefined;
    
    goal.progress = Math.min(100, Math.max(0, progress));
    
    if (goal.progress === 0) {
      goal.status = 'not_started';
    } else if (goal.progress === 100) {
      goal.status = 'completed';
      this.checkAndUnlockAchievement(userId, goal);
    } else {
      goal.status = 'in_progress';
    }
    
    this.userProfiles.set(userId, profile);
    return goal;
  }
  
  private checkAndUnlockAchievement(userId: string, goal: Goal): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;
    
    const completedGoals = profile.growth.goals.filter(g => g.status === 'completed');
    
    if (completedGoals.length === 1) {
      this.unlockAchievement(userId, 'first_step');
    }
    
    if (goal.priority === 'high' && goal.status === 'completed') {
      this.unlockAchievement(userId, 'breakthrough');
    }
  }
  
  private unlockAchievement(userId: string, achievementId: string): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;
    
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    const alreadyUnlocked = profile.growth.achievements.some(a => a.id === achievementId);
    if (alreadyUnlocked) return;
    
    profile.growth.achievements.push({
      ...achievement,
      unlockedAt: new Date(),
    });
    
    this.userProfiles.set(userId, profile);
    
    logger.info(`成就解锁: ${achievement.title} - ${achievement.description}`);
  }
  
  addMilestone(userId: string, milestone: Omit<Milestone, 'id' | 'achievedAt'>): Milestone {
    const profile = this.userProfiles.get(userId);
    if (!profile) throw new Error('用户档案不存在');
    
    const newMilestone: Milestone = {
      ...milestone,
      id: `milestone_${Date.now()}`,
      achievedAt: new Date(),
    };
    
    profile.growth.milestones.push(newMilestone);
    this.userProfiles.set(userId, profile);
    
    return newMilestone;
  }
  
  generateDailyCompanion(userId: string): DailyCompanion {
    const profile = this.userProfiles.get(userId);
    if (!profile) throw new Error('用户档案不存在');
    
    const hour = new Date().getHours();
    let greeting: string;
    
    if (hour < 12) {
      greeting = `早上好，${profile.name}！新的一天，新的开始。`;
    } else if (hour < 18) {
      greeting = `下午好，${profile.name}！继续加油！`;
    } else {
      greeting = `晚上好，${profile.name}！今天辛苦了。`;
    }
    
    const inProgressGoals = profile.growth.goals.filter(g => g.status === 'in_progress');
    const progressUpdate = inProgressGoals.length > 0
      ? `你正在进行${inProgressGoals.length}个目标，继续保持！`
      : '今天还没有开始的目标，要开始一个吗？';
    
    const encouragements = [
      '每一步都是进步，相信自己！',
      '你的努力终将开花结果。',
      '保持好奇心，世界充满可能。',
      '今天的付出，明天的收获。',
    ];
    
    const tips = [
      '建议：尝试番茄工作法，25分钟专注，5分钟休息。',
      '建议：学习新知识时，尝试教给别人，加深理解。',
      '建议：定期回顾目标，保持方向正确。',
      '建议：遇到困难时，先休息一下，换个角度思考。',
    ];
    
    return {
      greeting,
      progressUpdate,
      encouragement: encouragements[Math.floor(Math.random() * encouragements.length)],
      dailyGoal: inProgressGoals[0],
      tip: tips[Math.floor(Math.random() * tips.length)],
    };
  }
  
  generateWeeklyReview(userId: string): WeeklyReview {
    const profile = this.userProfiles.get(userId);
    if (!profile) throw new Error('用户档案不存在');
    
    const thisWeekAchievements = profile.growth.achievements.filter(
      a => a.unlockedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const completedGoals = profile.growth.goals.filter(
      g => g.status === 'completed'
    );
    
    const inProgressGoals = profile.growth.goals.filter(
      g => g.status === 'in_progress'
    );
    
    return {
      summary: `本周你完成了${completedGoals.length}个目标，解锁了${thisWeekAchievements.length}个成就。`,
      achievements: thisWeekAchievements,
      challenges: ['保持学习动力', '时间管理优化'],
      learnings: ['持续学习的重要性', '目标分解的价值'],
      nextWeekGoals: inProgressGoals.slice(0, 3),
    };
  }
  
  generateGrowthReport(userId: string, period: { start: Date; end: Date }): GrowthReport {
    const profile = this.userProfiles.get(userId);
    if (!profile) throw new Error('用户档案不存在');
    
    const goalsInPeriod = profile.growth.goals.filter(g => {
      const deadline = g.deadline;
      return deadline && deadline >= period.start && deadline <= period.end;
    });
    
    const completedInPeriod = goalsInPeriod.filter(g => g.status === 'completed');
    const goalsProgress = goalsInPeriod.length > 0
      ? (completedInPeriod.length / goalsInPeriod.length) * 100
      : 0;
    
    const skillsImproved: string[] = [];
    for (const [skill, level] of profile.capabilities.skills) {
      if (level > 0.5) {
        skillsImproved.push(skill);
      }
    }
    
    const achievementsInPeriod = profile.growth.achievements.filter(
      a => a.unlockedAt >= period.start && a.unlockedAt <= period.end
    );
    
    return {
      userId,
      period,
      summary: {
        goalsProgress,
        skillsImproved,
        achievementsUnlocked: achievementsInPeriod,
        emotionalGrowth: '情绪稳定性有所提升',
        overallGrowth: (goalsProgress + skillsImproved.length * 10) / 2,
      },
      insights: [
        '你在技术领域展现出较强的学习能力',
        '建议增加实践项目的比重',
        '保持当前的学习节奏，效果良好',
      ],
      recommendations: [
        '尝试更具挑战性的目标',
        '加入学习社区，与他人交流',
        '定期回顾和总结学习成果',
      ],
      nextSteps: [
        {
          type: 'learn',
          title: '深入学习当前技能',
          description: '巩固已学知识，拓展深度',
          priority: 0.8,
        },
        {
          type: 'practice',
          title: '实践项目',
          description: '将知识应用到实际项目中',
          priority: 0.9,
        },
      ],
    };
  }
  
  recommendGrowthPath(userId: string): GrowthPath[] {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];
    
    const recommendations: GrowthPath[] = [];
    
    for (const path of this.growthPaths.values()) {
      const hasPrerequisites = path.prerequisites.every(pre =>
        profile.growth.goals.some(g => 
          g.title.toLowerCase().includes(pre.toLowerCase()) && g.status === 'completed'
        )
      );
      
      if (hasPrerequisites) {
        recommendations.push(path);
      }
    }
    
    return recommendations.slice(0, 3);
  }
  
  updateGrowthStage(userId: string): GrowthStage {
    const profile = this.userProfiles.get(userId);
    if (!profile) return 'seed';
    
    const completedGoals = profile.growth.goals.filter(g => g.status === 'completed').length;
    const achievements = profile.growth.achievements.length;
    
    const score = completedGoals * 10 + achievements * 20;
    
    let stage: GrowthStage;
    if (score < 30) {
      stage = 'seed';
    } else if (score < 60) {
      stage = 'sprout';
    } else if (score < 100) {
      stage = 'sapling';
    } else if (score < 150) {
      stage = 'tree';
    } else {
      stage = 'forest';
    }
    
    profile.growth.stage = stage;
    this.userProfiles.set(userId, profile);
    
    return stage;
  }
}
