/**
 * file types.ts
 * description @yyc3/ai-hub 类型定义
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
 * brief @yyc3/ai-hub 类型定义
 */
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'reviewing' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory =
  | 'content_creation'
  | 'analysis_research'
  | 'development_engineering'
  | 'management_decision'
  | 'personal_growth'
  | 'security_auditing'
  | 'ux_design'
  | 'product_management';

export type CollaborationMode = 
  | 'independent'
  | 'sequential'
  | 'parallel'
  | 'democratic';

export type WorkStatus = 
  | 'idle'
  | 'busy'
  | 'working'
  | 'break'
  | 'offline';

export interface FamilyMemberWorkProfile {
  id: string;
  name: string;
  role: string;
  roleIcon: string;
  workResponsibilities: string[];
  specialties: string[];
  currentStatus: WorkStatus;
  currentTaskId?: string;
  todayStats: {
    tasksCompleted: number;
    hoursWorked: number;
    contributionScore: number;
    satisfactionRate: number;
  };
  weeklyStats: {
    totalTasks: number;
    avgRating: number;
    trustLevel: TrustLevel;
  };
}

export type TrustLevel = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  
  assignee: string[];
  collaborators: Map<string, string[]>;
  collaborationMode: CollaborationMode;
  
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  completedAt?: Date;
  
  progress: number;
  
  workLog: WorkLogEntry[];
  comments: Comment[];
  attachments: Attachment[];
  
  result?: TaskResult;
  metadata: Record<string, unknown>;
}

export interface WorkLogEntry {
  id: string;
  memberId: string;
  memberName: string;
  timestamp: Date;
  action: string;
  details: string;
  status: WorkStatus;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'member' | 'system';
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskResult {
  output: string;
  format: 'text' | 'code' | 'markdown' | 'json' | 'html';
  confidence: number;
  quality: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  feedback?: string;
}

export interface CollaborationSession {
  id: string;
  taskId: string;
  mode: CollaborationMode;
  members: CollaborationMemberState[];
  startTime: Date;
  endTime?: Date;
  messages: CollaborationMessage[];
  outputs: TaskResult[];
}

export interface CollaborationMemberState {
  memberId: string;
  memberName: string;
  role: string;
  status: 'waiting' | 'working' | 'completed' | 'blocked';
  progress: number;
  currentAction?: string;
}

export interface CollaborationMessage {
  id: string;
  from: string;
  to: string | 'all';
  content: string;
  timestamp: Date;
  type: 'status_update' | 'request' | 'response' | 'handoff' | 'complete';
}

export interface WorkDashboardData {
  summary: {
    todayTasks: {
      pending: number;
      inProgress: number;
      completed: number;
    };
    weekStats: {
      totalCompleted: number;
      successRate: number;
      avgCompletionTime: number;
    };
  };
  activeMembers: FamilyMemberWorkProfile[];
  recentTasks: Task[];
  liveActivity: ActivityFeedItem[];
}

export interface ActivityFeedItem {
  id: string;
  type: 'task_created' | 'task_started' | 'task_completed' | 'member_status_change' | 'collaboration_event';
  memberId?: string;
  memberName?: string;
  taskId?: string;
  taskTitle?: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TrustRecord {
  userId: string;
  familyMemberId: string;
  level: TrustLevel;
  history: TrustEvent[];
  lastUpdated: Date;
}

export interface TrustEvent {
  taskId: string;
  action: 'positive' | 'negative';
  rating: number;
  feedback: string;
  timestamp: Date;
}
