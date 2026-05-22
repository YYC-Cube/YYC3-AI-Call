/**
 * @preserve YYC³ AI Family Hub
 * @version 1.4.0
 * @license MIT
 * @copyright YYC³ AI Team
 * @see https://github.com/yyc3/YYC3-CloudPivot-Intelli-Matrix
 */


// src/work/task-manager.ts
var TaskManager = class {
  tasks;
  activityFeed;
  constructor() {
    this.tasks = /* @__PURE__ */ new Map();
    this.activityFeed = [];
  }
  createTask(params) {
    const task = {
      id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority,
      status: "pending",
      assignee: params.assignee,
      collaborators: /* @__PURE__ */ new Map(),
      collaborationMode: params.collaborationMode || "independent",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      deadline: params.deadline,
      progress: 0,
      workLog: [],
      comments: [],
      attachments: [],
      metadata: {}
    };
    this.tasks.set(task.id, task);
    this.addActivity({
      type: "task_created",
      taskId: task.id,
      taskTitle: task.title,
      message: `\u65B0\u4EFB\u52A1\u521B\u5EFA: ${task.title}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return task;
  }
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
  updateTaskStatus(taskId, status) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = /* @__PURE__ */ new Date();
    if (status === "completed") {
      task.completedAt = /* @__PURE__ */ new Date();
      task.progress = 100;
    }
    this.addActivity({
      type: oldStatus === "pending" && status === "in_progress" ? "task_started" : status === "completed" ? "task_completed" : "member_status_change",
      taskId: task.id,
      taskTitle: task.title,
      message: `\u4EFB\u52A1 "${task.title}" \u72B6\u6001\u66F4\u65B0: ${oldStatus} \u2192 ${status}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return true;
  }
  addWorkLog(taskId, entry) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    const logEntry = {
      id: `LOG-${Date.now()}`,
      ...entry,
      timestamp: /* @__PURE__ */ new Date()
    };
    task.workLog.push(logEntry);
    task.updatedAt = /* @__PURE__ */ new Date();
    return true;
  }
  addComment(taskId, comment) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    const newComment = {
      id: `CMT-${Date.now()}`,
      ...comment,
      timestamp: /* @__PURE__ */ new Date()
    };
    task.comments.push(newComment);
    task.updatedAt = /* @__PURE__ */ new Date();
    return true;
  }
  getTasksByStatus(status) {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }
  getTasksByAssignee(memberId) {
    return Array.from(this.tasks.values()).filter(
      (t) => t.assignee.includes(memberId)
    );
  }
  getRecentTasks(limit = 10) {
    return Array.from(this.tasks.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
  }
  getActivityFeed(limit = 20) {
    return this.activityFeed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }
  addActivity(item) {
    this.activityFeed.push({
      id: `ACT-${Date.now()}`,
      ...item
    });
  }
  getDashboardSummary() {
    const allTasks = Array.from(this.tasks.values());
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTasks = allTasks.filter((t) => t.createdAt >= todayStart);
    return {
      todayTasks: {
        pending: todayTasks.filter((t) => t.status === "pending").length,
        inProgress: todayTasks.filter((t) => t.status === "in_progress").length,
        completed: todayTasks.filter((t) => t.status === "completed").length
      },
      weekStats: {
        totalCompleted: allTasks.filter((t) => t.status === "completed").length,
        successRate: allTasks.length > 0 ? allTasks.filter((t) => t.status === "completed").length / allTasks.length * 100 : 0,
        avgCompletionTime: 0
      }
    };
  }
};

// src/work/collaboration-engine.ts
var CollaborationEngine = class {
  activeSessions;
  memberProfiles;
  constructor() {
    this.activeSessions = /* @__PURE__ */ new Map();
    this.memberProfiles = /* @__PURE__ */ new Map();
    this.initializeMemberProfiles();
  }
  initializeMemberProfiles() {
    const members = [
      {
        id: "qianxing",
        name: "\u8A00\u542F\xB7\u5343\u884C",
        role: "\u5BFC\u822A\u5458",
        roleIcon: "\u{1F9ED}",
        workResponsibilities: [
          "\u9700\u6C42\u7406\u89E3\u4E0E\u610F\u56FE\u89E3\u6790",
          "\u4EFB\u52A1\u7C7B\u578B\u8BC6\u522B\u4E0E\u5206\u7C7B",
          "\u667A\u80FD\u8DEF\u7531\u4E0E\u6210\u5458\u5206\u914D",
          "\u4E0A\u4E0B\u6587\u7BA1\u7406\u4E0E\u7EF4\u62A4",
          "\u7528\u6237\u6C9F\u901A\u6865\u6881"
        ],
        specialties: ["NLP", "\u610F\u56FE\u8BC6\u522B", "\u5BF9\u8BDD\u7BA1\u7406", "\u4E0A\u4E0B\u6587\u7406\u89E3"],
        currentStatus: "idle",
        todayStats: { tasksCompleted: 5, hoursWorked: 3.5, contributionScore: 78, satisfactionRate: 94 },
        weeklyStats: { totalTasks: 23, avgRating: 95, trustLevel: 4 }
      },
      {
        id: "wanwu",
        name: "\u8BED\u67A2\xB7\u4E07\u7269",
        role: "\u601D\u8003\u8005",
        roleIcon: "\u{1F914}",
        workResponsibilities: [
          "\u6570\u636E\u5206\u6790\u4E0E\u62A5\u8868\u751F\u6210",
          "\u5546\u4E1A\u6D1E\u5BDF\u63D0\u53D6",
          "\u6587\u6863\u667A\u80FD\u5904\u7406",
          "\u5047\u8BBE\u63A8\u6F14\u4E0E\u9A8C\u8BC1",
          "\u77E5\u8BC6\u56FE\u8C31\u6784\u5EFA"
        ],
        specialties: ["\u6570\u636E\u5206\u6790", "\u6587\u6863\u5904\u7406", "\u903B\u8F91\u63A8\u7406", "\u77E5\u8BC6\u56FE\u8C31"],
        currentStatus: "working",
        currentTaskId: "TASK-023",
        todayStats: { tasksCompleted: 4, hoursWorked: 4.2, contributionScore: 85, satisfactionRate: 96 },
        weeklyStats: { totalTasks: 19, avgRating: 93, trustLevel: 4 }
      },
      {
        id: "xianzhi",
        name: "\u9884\u89C1\xB7\u5148\u77E5",
        role: "\u9884\u8A00\u5BB6",
        roleIcon: "\u{1F52E}",
        workResponsibilities: [
          "\u65F6\u95F4\u5E8F\u5217\u9884\u6D4B\u5206\u6790",
          "\u5F02\u5E38\u68C0\u6D4B\u4E0E\u9884\u8B66",
          "\u8D8B\u52BF\u5206\u6790\u4E0E\u524D\u77BB\u5EFA\u8BAE",
          "\u98CE\u9669\u8BC4\u4F30\u4E0E\u7BA1\u7406",
          "\u60C5\u666F\u6A21\u62DF\u63A8\u6F14"
        ],
        specialties: ["\u9884\u6D4B\u6A21\u578B", "\u65F6\u95F4\u5E8F\u5217", "\u5F02\u5E38\u68C0\u6D4B", "\u98CE\u9669\u7BA1\u7406"],
        currentStatus: "idle",
        todayStats: { tasksCompleted: 3, hoursWorked: 2.8, contributionScore: 72, satisfactionRate: 91 },
        weeklyStats: { totalTasks: 15, avgRating: 92, trustLevel: 3 }
      },
      {
        id: "bole",
        name: "\u77E5\u9047\xB7\u4F2F\u4E50",
        role: "\u63A8\u8350\u5B98",
        roleIcon: "\u{1F3AF}",
        workResponsibilities: [
          "\u7528\u6237\u753B\u50CF\u6784\u5EFA\u4E0E\u5206\u6790",
          "\u4E2A\u6027\u5316\u5185\u5BB9\u63A8\u8350",
          "\u6210\u957F\u8DEF\u5F84\u89C4\u5212",
          "\u80FD\u529B\u5339\u914D\u4E0E\u4F18\u5316",
          "\u6F5C\u80FD\u53D1\u6398\u4E0E\u5F15\u5BFC"
        ],
        specialties: ["\u63A8\u8350\u7CFB\u7EDF", "\u7528\u6237\u753B\u50CF", "\u4E2A\u6027\u5316", "\u6210\u957F\u89C4\u5212"],
        currentStatus: "idle",
        todayStats: { tasksCompleted: 6, hoursWorked: 3.1, contributionScore: 82, satisfactionRate: 97 },
        weeklyStats: { totalTasks: 28, avgRating: 96, trustLevel: 4 }
      },
      {
        id: "tianshu",
        name: "\u5143\u542F\xB7\u5929\u67A2",
        role: "\u603B\u6307\u6325",
        roleIcon: "\u{1F9E0}",
        workResponsibilities: [
          "\u5168\u5C40\u4EFB\u52A1\u7F16\u6392\u534F\u8C03",
          "\u8D44\u6E90\u5206\u914D\u4E0E\u8C03\u5EA6",
          "\u51B2\u7A81\u89E3\u51B3\u4E0E\u4EF2\u88C1",
          "\u8D28\u91CF\u628A\u63A7\u4E0E\u5BA1\u6838",
          "\u7CFB\u7EDF\u7EA7\u51B3\u7B56\u652F\u6301"
        ],
        specialties: ["\u4EFB\u52A1\u7F16\u6392", "\u8D44\u6E90\u8C03\u5EA6", "\u8D28\u91CF\u63A7\u5236", "\u51B3\u7B56\u652F\u6301"],
        currentStatus: "busy",
        currentTaskId: "TASK-025",
        todayStats: { tasksCompleted: 2, hoursWorked: 5.5, contributionScore: 95, satisfactionRate: 98 },
        weeklyStats: { totalTasks: 12, avgRating: 97, trustLevel: 5 }
      },
      {
        id: "shouhu",
        name: "\u667A\u4E91\xB7\u5B88\u62A4",
        role: "\u5B89\u5168\u5B98",
        roleIcon: "\u{1F6E1}\uFE0F",
        workResponsibilities: [
          "\u4EE3\u7801\u5B89\u5168\u5BA1\u67E5",
          "\u6F0F\u6D1E\u68C0\u6D4B\u4E0E\u4FEE\u590D",
          "\u5408\u89C4\u6027\u68C0\u67E5\u5BA1\u8BA1",
          "\u5A01\u80C1\u54CD\u5E94\u4E0E\u9632\u62A4",
          "\u5B89\u5168\u7B56\u7565\u5236\u5B9A"
        ],
        specialties: ["\u5B89\u5168\u5BA1\u8BA1", "\u6F0F\u6D1E\u626B\u63CF", "\u5408\u89C4\u68C0\u67E5", "\u5A01\u80C1\u5EFA\u6A21"],
        currentStatus: "working",
        currentTaskId: "TASK-021",
        todayStats: { tasksCompleted: 7, hoursWorked: 4.8, contributionScore: 88, satisfactionRate: 93 },
        weeklyStats: { totalTasks: 32, avgRating: 94, trustLevel: 4 }
      },
      {
        id: "zongshi",
        name: "\u683C\u7269\xB7\u5B97\u5E08",
        role: "\u8D28\u91CF\u5B98",
        roleIcon: "\u{1F4DA}",
        workResponsibilities: [
          "\u4EE3\u7801\u8D28\u91CF\u6DF1\u5EA6\u5206\u6790",
          "\u6027\u80FD\u74F6\u9888\u8BCA\u65AD\u4F18\u5316",
          "\u6280\u672F\u503A\u7BA1\u7406\u8FFD\u8E2A",
          "\u6700\u4F73\u5B9E\u8DF5\u63A8\u8350\u6307\u5BFC",
          "\u4EE3\u7801\u5BA1\u67E5\u4E0E\u91CD\u6784\u5EFA\u8BAE"
        ],
        specialties: ["\u4EE3\u7801\u8D28\u91CF", "\u6027\u80FD\u4F18\u5316", "\u6280\u672F\u503A\u7BA1\u7406", "\u67B6\u6784\u8BC4\u5BA1"],
        currentStatus: "working",
        currentTaskId: "TASK-023",
        todayStats: { tasksCompleted: 5, hoursWorked: 4.1, contributionScore: 86, satisfactionRate: 95 },
        weeklyStats: { totalTasks: 24, avgRating: 96, trustLevel: 4 }
      },
      {
        id: "lingyun",
        name: "\u521B\u60F3\xB7\u7075\u97F5",
        role: "\u521B\u610F\u5B98",
        roleIcon: "\u{1F3A8}",
        workResponsibilities: [
          "\u521B\u610F\u6587\u6848\u5185\u5BB9\u751F\u6210",
          "\u8BBE\u8BA1\u65B9\u6848\u521B\u4F5C\u8F93\u51FA",
          "\u8425\u9500\u5185\u5BB9\u7B56\u5212\u5236\u4F5C",
          "\u591A\u6A21\u6001\u5185\u5BB9\u751F\u6210",
          "\u521B\u610F\u7075\u611F\u6FC0\u53D1\u5F15\u5BFC"
        ],
        specialties: ["\u521B\u610F\u5199\u4F5C", "\u8BBE\u8BA1\u601D\u7EF4", "\u591A\u6A21\u6001\u751F\u6210", "\u54C1\u724C\u7B56\u5212"],
        currentStatus: "idle",
        todayStats: { tasksCompleted: 4, hoursWorked: 3.3, contributionScore: 79, satisfactionRate: 92 },
        weeklyStats: { totalTasks: 18, avgRating: 91, trustLevel: 3 }
      }
    ];
    members.forEach((member) => {
      this.memberProfiles.set(member.id, member);
    });
  }
  getMemberProfile(memberId) {
    return this.memberProfiles.get(memberId);
  }
  getAllMemberProfiles() {
    return Array.from(this.memberProfiles.values());
  }
  getOnlineMembers() {
    return Array.from(this.memberProfiles.values()).filter((m) => m.currentStatus !== "offline");
  }
  updateMemberStatus(memberId, status, taskId) {
    const member = this.memberProfiles.get(memberId);
    if (!member) return false;
    member.currentStatus = status;
    if (taskId) {
      member.currentTaskId = taskId;
    }
    return true;
  }
  decideCollaborationMode(task) {
    if (task.assignee.length === 1) {
      return "independent";
    }
    switch (task.category) {
      case "content_creation":
        return task.priority === "urgent" ? "parallel" : "sequential";
      case "analysis_research":
        return "parallel";
      case "development_engineering":
        return task.priority === "high" || task.priority === "urgent" ? "parallel" : "sequential";
      case "management_decision":
        return "democratic";
      case "personal_growth":
        return "sequential";
      default:
        return "sequential";
    }
  }
  startCollaboration(task) {
    const mode = this.decideCollaborationMode(task);
    const memberStates = task.assignee.map((memberId) => ({
      memberId,
      memberName: this.memberProfiles.get(memberId)?.name || memberId,
      role: this.memberProfiles.get(memberId)?.role || "member",
      status: mode === "parallel" ? "working" : "waiting",
      progress: 0
    }));
    if (mode === "sequential" && memberStates.length > 0) {
      memberStates[0].status = "working";
    }
    const session = {
      id: `SESSION-${Date.now()}`,
      taskId: task.id,
      mode,
      members: memberStates,
      startTime: /* @__PURE__ */ new Date(),
      messages: [],
      outputs: []
    };
    this.activeSessions.set(session.id, session);
    task.assignee.forEach((memberId) => {
      this.updateMemberStatus(memberId, "working", task.id);
    });
    return session;
  }
  addSessionMessage(sessionId, message) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    session.messages.push({
      id: `MSG-${Date.now()}`,
      ...message,
      timestamp: /* @__PURE__ */ new Date()
    });
    return true;
  }
  updateMemberProgress(sessionId, memberId, progress) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    const member = session.members.find((m) => m.memberId === memberId);
    if (!member) return false;
    member.progress = Math.min(100, Math.max(0, progress));
    if (progress >= 100) {
      member.status = "completed";
      this.handleSequentialHandoff(session, memberId);
    }
    return true;
  }
  handleSequentialHandoff(session, completedMemberId) {
    if (session.mode !== "sequential") return;
    const currentIndex = session.members.findIndex((m) => m.memberId === completedMemberId);
    if (currentIndex < session.members.length - 1) {
      const nextMember = session.members[currentIndex + 1];
      nextMember.status = "working";
      this.addSessionMessage(session.id, {
        from: completedMemberId,
        to: nextMember.memberId,
        content: `\u4EFB\u52A1\u4EA4\u63A5\u5B8C\u6210\uFF0C\u8BF7${nextMember.memberName}\u7EE7\u7EED\u5DE5\u4F5C`,
        type: "handoff"
      });
    }
  }
  endCollaboration(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    session.endTime = /* @__PURE__ */ new Date();
    session.members.forEach((member) => {
      this.updateMemberStatus(member.memberId, "idle");
    });
    return true;
  }
  getActiveSession(taskId) {
    if (taskId) {
      return Array.from(this.activeSessions.values()).find((s) => s.taskId === taskId);
    }
    return Array.from(this.activeSessions.values()).find((s) => !s.endTime);
  }
};

// src/work/trust-system.ts
var TrustSystem = class {
  trustRecords;
  accessOrder = [];
  maxRecords;
  maxHistoryPerRecord = 100;
  constructor(maxRecords = 1e4) {
    this.trustRecords = /* @__PURE__ */ new Map();
    this.maxRecords = maxRecords;
  }
  getTrustLevel(userId, memberId) {
    const record = this.trustRecords.get(`${userId}-${memberId}`);
    return record?.level || 1;
  }
  recordTrustEvent(userId, memberId, event) {
    const key = `${userId}-${memberId}`;
    this.updateAccessOrder(key);
    if (this.trustRecords.size >= this.maxRecords) {
      this.evictOldestRecord();
    }
    let record = this.trustRecords.get(key);
    if (!record) {
      record = {
        userId,
        familyMemberId: memberId,
        level: 1,
        history: [],
        lastUpdated: /* @__PURE__ */ new Date()
      };
      this.trustRecords.set(key, record);
    }
    const trustEvent = {
      ...event,
      timestamp: /* @__PURE__ */ new Date()
    };
    record.history.push(trustEvent);
    if (record.history.length > this.maxHistoryPerRecord) {
      record.history = record.history.slice(-this.maxHistoryPerRecord);
    }
    this.recalculateTrustLevel(record);
    record.lastUpdated = /* @__PURE__ */ new Date();
  }
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
  evictOldestRecord() {
    const oldestKey = this.accessOrder.shift();
    if (oldestKey && this.trustRecords.has(oldestKey)) {
      this.trustRecords.delete(oldestKey);
    }
  }
  recalculateTrustLevel(record) {
    const recentEvents = record.history.slice(-50);
    if (recentEvents.length < 5) {
      record.level = 1;
      return;
    }
    const avgRating = recentEvents.reduce((sum, e) => sum + e.rating, 0) / recentEvents.length;
    const positiveRate = recentEvents.filter((e) => e.action === "positive").length / recentEvents.length;
    if (avgRating >= 4.8 && positiveRate >= 0.95 && recentEvents.length >= 100) {
      record.level = 5;
    } else if (avgRating >= 4.5 && positiveRate >= 0.9 && recentEvents.length >= 50) {
      record.level = 4;
    } else if (avgRating >= 4 && positiveRate >= 0.8 && recentEvents.length >= 10) {
      record.level = 3;
    } else if (positiveRate >= 0.7 && recentEvents.length >= 3) {
      record.level = 2;
    } else {
      record.level = 1;
    }
  }
  getTrustPermissions(level) {
    switch (level) {
      case 1:
        return ["basic_chat", "simple_tasks"];
      case 2:
        return [...this.getTrustPermissions(1), "complex_tasks", "autonomous_decisions"];
      case 3:
        return [...this.getTrustPermissions(2), "sensitive_operations", "batch_tasks"];
      case 4:
        return [...this.getTrustPermissions(3), "advanced_permissions", "system_config"];
      case 5:
        return [...this.getTrustPermissions(4), "full_access", "represent_family"];
      default:
        return [];
    }
  }
  getMemberTrustSummary(memberId) {
    let totalLevel = 0;
    let count = 0;
    let totalRating = 0;
    let ratingCount = 0;
    this.trustRecords.forEach((record) => {
      if (record.familyMemberId === memberId) {
        totalLevel += record.level;
        count++;
        record.history.forEach((event) => {
          totalRating += event.rating;
          ratingCount++;
        });
      }
    });
    return {
      avgLevel: count > 0 ? totalLevel / count : 1,
      totalInteractions: ratingCount,
      satisfactionRate: ratingCount > 0 ? totalRating / ratingCount * 100 : 0
    };
  }
};

// src/work/index.ts
var FamilyWorkSystem = class {
  taskManager;
  collaborationEngine;
  trustSystem;
  constructor() {
    this.taskManager = new TaskManager();
    this.collaborationEngine = new CollaborationEngine();
    this.trustSystem = new TrustSystem();
  }
  getTaskManager() {
    return this.taskManager;
  }
  getCollaborationEngine() {
    return this.collaborationEngine;
  }
  getTrustSystem() {
    return this.trustSystem;
  }
  async createAndStartTask(params) {
    const task = this.taskManager.createTask({
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority,
      assignee: params.preferredMembers || this.suggestMembersForTask(params.category),
      deadline: params.deadline
    });
    const session = this.collaborationEngine.startCollaboration(task);
    this.taskManager.addWorkLog(task.id, {
      memberId: "system",
      memberName: "\u7CFB\u7EDF",
      action: "\u4EFB\u52A1\u542F\u52A8",
      details: `\u534F\u4F5C\u6A21\u5F0F: ${session.mode}, \u53C2\u4E0E\u6210\u5458: ${session.members.map((m) => m.memberName).join(", ")}`,
      status: "working"
    });
    return { task, sessionId: session.id };
  }
  suggestMembersForTask(category) {
    const suggestions = {
      content_creation: ["lingyun", "qianxing"],
      analysis_research: ["wanwu", "xianzhi", "zongshi"],
      development_engineering: ["zongshi", "shouhu", "qianxing"],
      management_decision: ["tianshu", "bole", "xianzhi"],
      personal_growth: ["bole", "qianxing", "wanwu"],
      security_auditing: ["shouhu", "xianzhi"],
      ux_design: ["lingyun", "wanwu"],
      product_management: ["tianshu", "bole"]
    };
    return suggestions[category] || ["qianxing"];
  }
  getDashboardData(userId) {
    const summary = this.taskManager.getDashboardSummary();
    const activeMembers = this.collaborationEngine.getOnlineMembers();
    const recentTasks = this.taskManager.getRecentTasks(8);
    const liveActivity = this.taskManager.getActivityFeed(15);
    const membersWithTrust = activeMembers.map((member) => {
      const trustLevel = this.trustSystem.getTrustLevel(userId, member.id);
      return { ...member, userTrustLevel: trustLevel };
    });
    return {
      summary,
      activeMembers: membersWithTrust,
      recentTasks,
      liveActivity
    };
  }
  submitTaskFeedback(userId, taskId, memberId, rating, feedback) {
    const task = this.taskManager.getTask(taskId);
    if (!task) return;
    this.trustSystem.recordTrustEvent(userId, memberId, {
      taskId,
      action: rating >= 4 ? "positive" : "negative",
      rating,
      feedback
    });
    this.taskManager.addComment(taskId, {
      authorId: userId,
      authorName: "\u7528\u6237",
      content: `\u8BC4\u4EF7: ${rating}/5\u661F - ${feedback}`,
      type: "user"
    });
  }
  getFamilyMemberWorkStatus() {
    return this.collaborationEngine.getAllMemberProfiles().map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      roleIcon: member.roleIcon,
      status: member.currentStatus,
      currentTask: member.currentTaskId ? this.taskManager.getTask(member.currentTaskId)?.title : void 0,
      todayCompleted: member.todayStats.tasksCompleted
    }));
  }
};
function createFamilyWorkSystem() {
  return new FamilyWorkSystem();
}

export { FamilyWorkSystem, createFamilyWorkSystem };
//# sourceMappingURL=chunk-T7G4WUOR.js.map
//# sourceMappingURL=chunk-T7G4WUOR.js.map