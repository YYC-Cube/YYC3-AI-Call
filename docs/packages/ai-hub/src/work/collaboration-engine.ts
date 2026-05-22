/**
 * file collaboration-engine.ts
 * description 协作引擎
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 协作引擎
 */
import {
  Task,
  CollaborationMode,
  CollaborationSession,
  CollaborationMemberState,
  CollaborationMessage,
  FamilyMemberWorkProfile,
  WorkStatus,
} from './types';

export class CollaborationEngine {
  private activeSessions: Map<string, CollaborationSession>;
  private memberProfiles: Map<string, FamilyMemberWorkProfile>;

  constructor() {
    this.activeSessions = new Map();
    this.memberProfiles = new Map();
    this.initializeMemberProfiles();
  }

  private initializeMemberProfiles(): void {
    const members: FamilyMemberWorkProfile[] = [
      {
        id: 'qianxing',
        name: '言启·千行',
        role: '导航员',
        roleIcon: '🧭',
        workResponsibilities: [
          '需求理解与意图解析',
          '任务类型识别与分类',
          '智能路由与成员分配',
          '上下文管理与维护',
          '用户沟通桥梁'
        ],
        specialties: ['NLP', '意图识别', '对话管理', '上下文理解'],
        currentStatus: 'idle',
        todayStats: { tasksCompleted: 5, hoursWorked: 3.5, contributionScore: 78, satisfactionRate: 94 },
        weeklyStats: { totalTasks: 23, avgRating: 95, trustLevel: 4 },
      },
      {
        id: 'wanwu',
        name: '语枢·万物',
        role: '思考者',
        roleIcon: '🤔',
        workResponsibilities: [
          '数据分析与报表生成',
          '商业洞察提取',
          '文档智能处理',
          '假设推演与验证',
          '知识图谱构建'
        ],
        specialties: ['数据分析', '文档处理', '逻辑推理', '知识图谱'],
        currentStatus: 'working',
        currentTaskId: 'TASK-023',
        todayStats: { tasksCompleted: 4, hoursWorked: 4.2, contributionScore: 85, satisfactionRate: 96 },
        weeklyStats: { totalTasks: 19, avgRating: 93, trustLevel: 4 },
      },
      {
        id: 'xianzhi',
        name: '预见·先知',
        role: '预言家',
        roleIcon: '🔮',
        workResponsibilities: [
          '时间序列预测分析',
          '异常检测与预警',
          '趋势分析与前瞻建议',
          '风险评估与管理',
          '情景模拟推演'
        ],
        specialties: ['预测模型', '时间序列', '异常检测', '风险管理'],
        currentStatus: 'idle',
        todayStats: { tasksCompleted: 3, hoursWorked: 2.8, contributionScore: 72, satisfactionRate: 91 },
        weeklyStats: { totalTasks: 15, avgRating: 92, trustLevel: 3 },
      },
      {
        id: 'bole',
        name: '知遇·伯乐',
        role: '推荐官',
        roleIcon: '🎯',
        workResponsibilities: [
          '用户画像构建与分析',
          '个性化内容推荐',
          '成长路径规划',
          '能力匹配与优化',
          '潜能发掘与引导'
        ],
        specialties: ['推荐系统', '用户画像', '个性化', '成长规划'],
        currentStatus: 'idle',
        todayStats: { tasksCompleted: 6, hoursWorked: 3.1, contributionScore: 82, satisfactionRate: 97 },
        weeklyStats: { totalTasks: 28, avgRating: 96, trustLevel: 4 },
      },
      {
        id: 'tianshu',
        name: '元启·天枢',
        role: '总指挥',
        roleIcon: '🧠',
        workResponsibilities: [
          '全局任务编排协调',
          '资源分配与调度',
          '冲突解决与仲裁',
          '质量把控与审核',
          '系统级决策支持'
        ],
        specialties: ['任务编排', '资源调度', '质量控制', '决策支持'],
        currentStatus: 'busy',
        currentTaskId: 'TASK-025',
        todayStats: { tasksCompleted: 2, hoursWorked: 5.5, contributionScore: 95, satisfactionRate: 98 },
        weeklyStats: { totalTasks: 12, avgRating: 97, trustLevel: 5 },
      },
      {
        id: 'shouhu',
        name: '智云·守护',
        role: '安全官',
        roleIcon: '🛡️',
        workResponsibilities: [
          '代码安全审查',
          '漏洞检测与修复',
          '合规性检查审计',
          '威胁响应与防护',
          '安全策略制定'
        ],
        specialties: ['安全审计', '漏洞扫描', '合规检查', '威胁建模'],
        currentStatus: 'working',
        currentTaskId: 'TASK-021',
        todayStats: { tasksCompleted: 7, hoursWorked: 4.8, contributionScore: 88, satisfactionRate: 93 },
        weeklyStats: { totalTasks: 32, avgRating: 94, trustLevel: 4 },
      },
      {
        id: 'zongshi',
        name: '格物·宗师',
        role: '质量官',
        roleIcon: '📚',
        workResponsibilities: [
          '代码质量深度分析',
          '性能瓶颈诊断优化',
          '技术债管理追踪',
          '最佳实践推荐指导',
          '代码审查与重构建议'
        ],
        specialties: ['代码质量', '性能优化', '技术债管理', '架构评审'],
        currentStatus: 'working',
        currentTaskId: 'TASK-023',
        todayStats: { tasksCompleted: 5, hoursWorked: 4.1, contributionScore: 86, satisfactionRate: 95 },
        weeklyStats: { totalTasks: 24, avgRating: 96, trustLevel: 4 },
      },
      {
        id: 'lingyun',
        name: '创想·灵韵',
        role: '创意官',
        roleIcon: '🎨',
        workResponsibilities: [
          '创意文案内容生成',
          '设计方案创作输出',
          '营销内容策划制作',
          '多模态内容生成',
          '创意灵感激发引导'
        ],
        specialties: ['创意写作', '设计思维', '多模态生成', '品牌策划'],
        currentStatus: 'idle',
        todayStats: { tasksCompleted: 4, hoursWorked: 3.3, contributionScore: 79, satisfactionRate: 92 },
        weeklyStats: { totalTasks: 18, avgRating: 91, trustLevel: 3 },
      },
    ];

    members.forEach(member => {
      this.memberProfiles.set(member.id, member);
    });
  }

  getMemberProfile(memberId: string): FamilyMemberWorkProfile | undefined {
    return this.memberProfiles.get(memberId);
  }

  getAllMemberProfiles(): FamilyMemberWorkProfile[] {
    return Array.from(this.memberProfiles.values());
  }

  getOnlineMembers(): FamilyMemberWorkProfile[] {
    return Array.from(this.memberProfiles.values())
      .filter(m => m.currentStatus !== 'offline');
  }

  updateMemberStatus(memberId: string, status: WorkStatus, taskId?: string): boolean {
    const member = this.memberProfiles.get(memberId);
    if (!member) return false;

    member.currentStatus = status;
    if (taskId) {
      member.currentTaskId = taskId;
    }
    
    return true;
  }

  decideCollaborationMode(task: Task): CollaborationMode {
    if (task.assignee.length === 1) {
      return 'independent';
    }

    switch (task.category) {
      case 'content_creation':
        return task.priority === 'urgent' ? 'parallel' : 'sequential';
      
      case 'analysis_research':
        return 'parallel';
      
      case 'development_engineering':
        return task.priority === 'high' || task.priority === 'urgent' 
          ? 'parallel' 
          : 'sequential';
      
      case 'management_decision':
        return 'democratic';
      
      case 'personal_growth':
        return 'sequential';
      
      default:
        return 'sequential';
    }
  }

  startCollaboration(task: Task): CollaborationSession {
    const mode = this.decideCollaborationMode(task);
    
    const memberStates: CollaborationMemberState[] = task.assignee.map(memberId => ({
      memberId,
      memberName: this.memberProfiles.get(memberId)?.name || memberId,
      role: this.memberProfiles.get(memberId)?.role || 'member',
      status: mode === 'parallel' ? 'working' : 'waiting' as const,
      progress: 0,
    }));

    if (mode === 'sequential' && memberStates.length > 0) {
      memberStates[0].status = 'working';
    }

    const session: CollaborationSession = {
      id: `SESSION-${Date.now()}`,
      taskId: task.id,
      mode,
      members: memberStates,
      startTime: new Date(),
      messages: [],
      outputs: [],
    };

    this.activeSessions.set(session.id, session);

    task.assignee.forEach(memberId => {
      this.updateMemberStatus(memberId, 'working', task.id);
    });

    return session;
  }

  addSessionMessage(
    sessionId: string,
    message: Omit<CollaborationMessage, 'id' | 'timestamp'>
  ): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.messages.push({
      id: `MSG-${Date.now()}`,
      ...message,
      timestamp: new Date(),
    });

    return true;
  }

  updateMemberProgress(sessionId: string, memberId: string, progress: number): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const member = session.members.find(m => m.memberId === memberId);
    if (!member) return false;

    member.progress = Math.min(100, Math.max(0, progress));

    if (progress >= 100) {
      member.status = 'completed';
      this.handleSequentialHandoff(session, memberId);
    }

    return true;
  }

  private handleSequentialHandoff(session: CollaborationSession, completedMemberId: string): void {
    if (session.mode !== 'sequential') return;

    const currentIndex = session.members.findIndex(m => m.memberId === completedMemberId);
    if (currentIndex < session.members.length - 1) {
      const nextMember = session.members[currentIndex + 1];
      nextMember.status = 'working';
      
      this.addSessionMessage(session.id, {
        from: completedMemberId,
        to: nextMember.memberId,
        content: `任务交接完成，请${nextMember.memberName}继续工作`,
        type: 'handoff',
      });
    }
  }

  endCollaboration(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.endTime = new Date();
    session.members.forEach(member => {
      this.updateMemberStatus(member.memberId, 'idle');
    });

    return true;
  }

  getActiveSession(taskId?: string): CollaborationSession | undefined {
    if (taskId) {
      return Array.from(this.activeSessions.values()).find(s => s.taskId === taskId);
    }
    return Array.from(this.activeSessions.values()).find(s => !s.endTime);
  }
}
