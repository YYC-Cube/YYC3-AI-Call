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
type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'reviewing' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskCategory = 'content_creation' | 'analysis_research' | 'development_engineering' | 'management_decision' | 'personal_growth' | 'security_auditing' | 'ux_design' | 'product_management';
type CollaborationMode = 'independent' | 'sequential' | 'parallel' | 'democratic';
type WorkStatus = 'idle' | 'busy' | 'working' | 'break' | 'offline';
interface FamilyMemberWorkProfile {
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
type TrustLevel = 1 | 2 | 3 | 4 | 5;
interface Task {
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
interface WorkLogEntry {
    id: string;
    memberId: string;
    memberName: string;
    timestamp: Date;
    action: string;
    details: string;
    status: WorkStatus;
}
interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    timestamp: Date;
    type: 'user' | 'member' | 'system';
}
interface Attachment {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedBy: string;
    uploadedAt: Date;
}
interface TaskResult {
    output: string;
    format: 'text' | 'code' | 'markdown' | 'json' | 'html';
    confidence: number;
    quality: number;
    reviewedBy?: string;
    reviewedAt?: Date;
    feedback?: string;
}
interface CollaborationSession {
    id: string;
    taskId: string;
    mode: CollaborationMode;
    members: CollaborationMemberState[];
    startTime: Date;
    endTime?: Date;
    messages: CollaborationMessage[];
    outputs: TaskResult[];
}
interface CollaborationMemberState {
    memberId: string;
    memberName: string;
    role: string;
    status: 'waiting' | 'working' | 'completed' | 'blocked';
    progress: number;
    currentAction?: string;
}
interface CollaborationMessage {
    id: string;
    from: string;
    to: string | 'all';
    content: string;
    timestamp: Date;
    type: 'status_update' | 'request' | 'response' | 'handoff' | 'complete';
}
interface WorkDashboardData {
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
interface ActivityFeedItem {
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
interface TrustRecord {
    userId: string;
    familyMemberId: string;
    level: TrustLevel;
    history: TrustEvent[];
    lastUpdated: Date;
}
interface TrustEvent {
    taskId: string;
    action: 'positive' | 'negative';
    rating: number;
    feedback: string;
    timestamp: Date;
}

/**
 * file task-manager.ts
 * description 任务管理器
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
 * brief 任务管理器
 */

declare class TaskManager {
    private tasks;
    private activityFeed;
    constructor();
    createTask(params: {
        title: string;
        description: string;
        category: TaskCategory;
        priority: TaskPriority;
        assignee: string[];
        deadline?: Date;
        collaborationMode?: CollaborationMode;
    }): Task;
    getTask(taskId: string): Task | undefined;
    updateTaskStatus(taskId: string, status: TaskStatus): boolean;
    addWorkLog(taskId: string, entry: Omit<WorkLogEntry, 'id' | 'timestamp'>): boolean;
    addComment(taskId: string, comment: Omit<Comment, 'id' | 'timestamp'>): boolean;
    getTasksByStatus(status: TaskStatus): Task[];
    getTasksByAssignee(memberId: string): Task[];
    getRecentTasks(limit?: number): Task[];
    getActivityFeed(limit?: number): ActivityFeedItem[];
    private addActivity;
    getDashboardSummary(): {
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
}

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

declare class CollaborationEngine {
    private activeSessions;
    private memberProfiles;
    constructor();
    private initializeMemberProfiles;
    getMemberProfile(memberId: string): FamilyMemberWorkProfile | undefined;
    getAllMemberProfiles(): FamilyMemberWorkProfile[];
    getOnlineMembers(): FamilyMemberWorkProfile[];
    updateMemberStatus(memberId: string, status: WorkStatus, taskId?: string): boolean;
    decideCollaborationMode(task: Task): CollaborationMode;
    startCollaboration(task: Task): CollaborationSession;
    addSessionMessage(sessionId: string, message: Omit<CollaborationMessage, 'id' | 'timestamp'>): boolean;
    updateMemberProgress(sessionId: string, memberId: string, progress: number): boolean;
    private handleSequentialHandoff;
    endCollaboration(sessionId: string): boolean;
    getActiveSession(taskId?: string): CollaborationSession | undefined;
}

/**
 * file trust-system.ts
 * description 信任系统
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
 * brief 信任系统
 */

declare class TrustSystem {
    private trustRecords;
    private accessOrder;
    private readonly maxRecords;
    private readonly maxHistoryPerRecord;
    constructor(maxRecords?: number);
    getTrustLevel(userId: string, memberId: string): TrustLevel;
    recordTrustEvent(userId: string, memberId: string, event: Omit<TrustEvent, 'timestamp'>): void;
    private updateAccessOrder;
    private evictOldestRecord;
    private recalculateTrustLevel;
    getTrustPermissions(level: TrustLevel): string[];
    getMemberTrustSummary(memberId: string): {
        avgLevel: number;
        totalInteractions: number;
        satisfactionRate: number;
    };
}

/**
 * file index.ts
 * description @yyc3/ai-hub 模块入口
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub 模块入口
 */

declare class FamilyWorkSystem {
    private taskManager;
    private collaborationEngine;
    private trustSystem;
    constructor();
    getTaskManager(): TaskManager;
    getCollaborationEngine(): CollaborationEngine;
    getTrustSystem(): TrustSystem;
    createAndStartTask(params: {
        userId: string;
        title: string;
        description: string;
        category: TaskCategory;
        priority: TaskPriority;
        preferredMembers?: string[];
        deadline?: Date;
    }): Promise<{
        task: Task;
        sessionId: string;
    }>;
    suggestMembersForTask(category: TaskCategory): string[];
    getDashboardData(userId: string): WorkDashboardData;
    submitTaskFeedback(userId: string, taskId: string, memberId: string, rating: number, feedback: string): void;
    getFamilyMemberWorkStatus(): Array<{
        id: string;
        name: string;
        role: string;
        roleIcon: string;
        status: string;
        currentTask?: string;
        todayCompleted: number;
    }>;
}
declare function createFamilyWorkSystem(): FamilyWorkSystem;

export { type ActivityFeedItem as A, type CollaborationMemberState as C, type FamilyMemberWorkProfile as F, type Task as T, type WorkDashboardData as W, type Attachment as a, type CollaborationMessage as b, type CollaborationMode as c, type CollaborationSession as d, type Comment as e, FamilyWorkSystem as f, type TaskCategory as g, type TaskPriority as h, type TaskStatus as i, type TrustEvent as j, type TrustLevel as k, type TrustRecord as l, type WorkLogEntry as m, type WorkStatus as n, createFamilyWorkSystem as o };
