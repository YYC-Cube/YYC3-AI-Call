import {
  ApprovalRequest,
  ApprovalRoute,
  ApprovalStatus,
  ApprovalType,
  Priority,
  UrgencyLevel,
  RouteType,
  StepType,
  ApproverType,
  ActionRequired,
  EscalationAction,
  NotificationChannel,
  ComplianceCheckResult,
  AuditTrailEntry,
  Comment,
  QueryOptions,
  PaginatedResponse
} from './types';

export class SmartApprovalEngine {
  private routeTemplates: Map<string, ApprovalRoute>;
  private activeRequests: Map<string, ApprovalRequest>;
  private config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
    this.routeTemplates = new Map();
    this.activeRequests = new Map();
    this.initializeDefaultRoutes();
  }

  async createRequest(requestData: CreateRequestInput): Promise<ApprovalRequest> {
    const requestNumber = await this.generateRequestNumber(requestData.type);
    const route = await this.determineRoute(requestData);
    
    const request: ApprovalRequest = {
      id: this.generateId(),
      requestNumber,
      type: requestData.type,
      title: requestData.title || this.getDefaultTitle(requestData.type),
      description: requestData.description,
      submitterId: requestData.submitterId,
      submitterName: requestData.submitterName,
      submitterDepartment: requestData.department,
      submitterPosition: requestData.position,
      organizationId: requestData.organizationId,
      amount: requestData.amount,
      currency: requestData.currency || 'CNY',
      priority: requestData.priority || Priority.NORMAL,
      urgency: requestData.urgency || UrgencyLevel.STANDARD,
      status: ApprovalStatus.DRAFT,
      currentStep: 0,
      totalSteps: route.steps.length,
      currentApproverIds: [],
      route,
      attachments: requestData.attachments || [],
      formData: requestData.formData || [],
      customFields: requestData.customFields || [],
      metadata: {
        source: requestData.source || 'web_portal',
        ipAddress: requestData.ipAddress,
        tags: [],
        customAttributes: {}
      },
      complianceInfo: await this.performInitialComplianceCheck(requestData),
      auditTrail: this.createInitialAuditTrail(requestData.submitterId),
      comments: [],
      deadline: this.calculateDeadline(route),
      submittedAt: new Date(),
      lastUpdatedAt: new Date(),
      version: 1,
      tags: [],
      category: requestData.category,
      costCenter: requestData.costCenter,
      projectCode: requestData.projectCode
    };

    if (requestData.autoSubmit) {
      return this.submitRequest(request);
    }

    this.activeRequests.set(request.id, request);
    return request;
  }

  async submitRequest(request: ApprovalRequest): Promise<ApprovalRequest> {
    request.status = ApprovalStatus.PENDING_REVIEW;
    request.submittedAt = new Date();
    request.lastUpdatedAt = new Date();

    const firstStep = this.getFirstStepToProcess(request.route);
    if (firstStep) {
      request.currentStep = firstStep.stepNumber;
      request.currentApproverIds = this.getApproverIdsForStep(firstStep);
      await this.assignToApprovers(request, firstStep);
    }

    this.addAuditTrailEntry(request, {
      action: 'SUBMITTED',
      performedBy: request.submitterId,
      previousStatus: ApprovalStatus.DRAFT,
      newStatus: request.status,
      stepNumber: request.currentStep
    });

    await this.notifyStakeholders(request, 'submitted');
    this.activeRequests.set(request.id, request);

    return request;
  }

  async approveRequest(
    requestId: string,
    approverId: string,
    comment?: string,
    attachments?: string[]
  ): Promise<ApprovalRequest> {
    const request = this.getRequestOrThrow(requestId);
    this.validateApproverPermission(request, approverId);

    const currentStep = this.getCurrentStep(request);

    this.addAuditTrailEntry(request, {
      action: 'APPROVED',
      performedBy: approverId,
      performerRole: currentStep.approvers.find(a => a.referenceId === approverId)?.type || '',
      previousStatus: request.status,
      newStatus: ApprovalStatus.IN_PROGRESS,
      stepNumber: request.currentStep,
      comment,
      attachmentIds: attachments
    });

    if (comment) {
      this.addComment(request, {
        authorId: approverId,
        content: comment,
        contentType: 'TEXT',
        isPrivate: false
      });
    }

    const nextStep = this.getNextStep(request.route, request.currentStep);
    
    if (!nextStep) {
      return this.completeRequest(request, approverId);
    }

    if (this.shouldSkipStep(nextStep, request)) {
      return this.skipAndProceed(request, nextStep, approverId);
    }

    request.currentStep = nextStep.stepNumber;
    request.currentApproverIds = this.getApproverIdsForStep(nextStep);
    request.lastUpdatedAt = new Date();

    await this.assignToApprovers(request, nextStep);
    await this.notifyStakeholders(request, 'approved_step');
    
    this.activeRequests.set(request.id, request);
    return request;
  }

  async rejectRequest(
    requestId: string,
    rejecterId: string,
    reason: string,
    attachments?: string[]
  ): Promise<ApprovalRequest> {
    const request = this.getRequestOrThrow(requestId);
    this.validateApproverPermission(request, rejecterId);

    request.status = ApprovalStatus.REJECTED;
    request.lastUpdatedAt = new Date();
    request.completedAt = new Date();

    this.addAuditTrailEntry(request, {
      action: 'REJECTED',
      performedBy: rejecterId,
      previousStatus: request.status,
      newStatus: ApprovalStatus.REJECTED,
      stepNumber: request.currentStep,
      comment: reason,
      attachmentIds: attachments
    });

    if (reason) {
      this.addComment(request, {
        authorId: rejecterId,
        content: `拒绝原因：${reason}`,
        contentType: 'TEXT',
        isPrivate: false
      });
    }

    await this.notifyStakeholders(request, 'rejected');
    this.activeRequests.set(request.id, request);

    return request;
  }

  async returnRequest(
    requestId: string,
    returnerId: string,
    targetStep: number,
    comment?: string
  ): Promise<ApprovalRequest> {
    const request = this.getRequestOrThrow(requestId);
    this.validateApproverPermission(request, returnerId);

    request.status = ApprovalStatus.RETURNED;
    request.currentStep = targetStep;
    request.lastUpdatedAt = new Date();

    const targetStepData = request.route.steps.find(s => s.stepNumber === targetStep);
    if (targetStepData) {
      request.currentApproverIds = this.getApproverIdsForStep(targetStepData);
    }

    this.addAuditTrailEntry(request, {
      action: 'RETURNED',
      performedBy: returnerId,
      previousStatus: ApprovalStatus.IN_PROGRESS,
      newStatus: ApprovalStatus.RETURNED,
      stepNumber: targetStep,
      comment: comment || `退回到第${targetStep}步`
    });

    if (comment) {
      this.addComment(request, {
        authorId: returnerId,
        content: comment,
        contentType: 'TEXT'
      });
    }

    await this.notifyStakeholders(request, 'returned');
    this.activeRequests.set(request.id, request);

    return request;
  }

  async delegateRequest(
    requestId: string,
    delegatorId: string,
    delegateeId: string,
    reason: string,
    duration?: { startDate: Date; endDate: Date }
  ): Promise<ApprovalRequest> {
    const request = this.getRequestOrThrow(requestId);
    this.validateApproverPermission(request, delegatorId);

    const currentStep = this.getCurrentStep(request);
    const delegatorAssignment = currentStep.approvers.find(a => a.referenceId === delegatorId);
    
    if (!delegatorAssignment) {
      throw new Error('Delegator not found in current step approvers');
    }

    delegatorAssignment.delegationInfo = {
      delegatedFrom: delegatorId,
      delegatedTo: delegateeId,
      startDate: duration?.startDate || new Date(),
      endDate: duration?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reason,
      isPermanent: !duration,
      scope: 'all_approvals'
    };

    request.currentApproverIds = request.currentApproverIds.filter(id => id !== delegatorId);
    if (!request.currentApproverIds.includes(delegateeId)) {
      request.currentApproverIds.push(delegateeId);
    }

    this.addAuditTrailEntry(request, {
      action: 'DELEGATED',
      performedBy: delegatorId,
      previousStatus: request.status,
      newStatus: request.status,
      stepNumber: request.currentStep,
      comment: `委托给 ${delegateeId}，原因：${reason}`
    });

    await this.notifyStakeholders(request, 'delegated', [delegateeId]);
    this.activeRequests.set(request.id, request);

    return request;
  }

  async addComment(
    requestId: string,
    commentData: AddCommentInput
  ): Promise<Comment> {
    const request = this.getRequestOrThrow(requestId);

    const comment: Comment = {
      commentId: this.generateId(),
      requestId,
      authorId: commentData.authorId,
      authorName: commentData.authorName || 'Unknown User',
      authorRole: '',
      content: commentData.content,
      contentType: commentData.contentType || 'TEXT',
      isPrivate: commentData.isPrivate || false,
      isInternal: commentData.isInternal || false,
      mentions: commentData.mentions || [],
      attachments: commentData.attachments || [],
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };

    request.comments.push(comment);
    request.lastUpdatedAt = new Date();

    if (!comment.isPrivate) {
      await this.notifyMentionedUsers(request, comment);
    }

    this.activeRequests.set(request.id, request);
    return comment;
  }

  async getRequestById(requestId: string): Promise<ApprovalRequest | null> {
    return this.activeRequests.get(requestId) || null;
  }

  async getRequests(options?: QueryOptions): Promise<PaginatedResponse<ApprovalRequest>> {
    let requests = Array.from(this.activeRequests.values());

    if (options?.filter) {
      requests = this.applyFilters(requests, options.filter);
    }

    if (options?.sort) {
      requests = this.applySorting(requests, options.sort);
    }

    const page = options?.pagination?.page || 1;
    const pageSize = options?.pagination?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: requests.slice(start, end),
      pagination: {
        page,
        pageSize,
        totalItems: requests.length,
        totalPages: Math.ceil(requests.length / pageSize),
        hasNextPage: end < requests.length,
        hasPrevPage: page > 1
      }
    };
  }

  async getMyRequests(userId: string, options?: QueryOptions): Promise<PaginatedResponse<ApprovalRequest>> {
    const filterOptions = {
      ...options,
      filter: {
        ...options?.filter,
        submitterId: userId
      }
    };

    return this.getRequests(filterOptions);
  }

  async getPendingApprovals(userId: string): Promise<ApprovalRequest[]> {
    const allRequests = Array.from(this.activeRequests.values());
    
    return allRequests.filter(request => 
      request.currentApproverIds.includes(userId) &&
      [ApprovalStatus.PENDING_REVIEW, ApprovalStatus.IN_PROGRESS].includes(request.status)
    );
  }

  async performPreAudit(request: ApprovalRequest): Promise<PreAuditResult> {
    const complianceChecks = await this.runComplianceChecks(request);
    const budgetValidation = await this.validateBudget(request);
    const policyValidation = await this.validatePolicies(request);
    const duplicateCheck = await this.checkForDuplicates(request);
    const riskAssessment = await this.assessRisk(request);

    const overallScore = (
      complianceChecks.score * 0.3 +
      budgetValidation.score * 0.25 +
      policyValidation.score * 0.2 +
      duplicateCheck.score * 0.1 +
      riskAssessment.score * 0.15
    );

    const issues = [
      ...complianceChecks.issues,
      ...budgetValidation.issues,
      ...policyValidation.issues,
      ...duplicateCheck.issues,
      ...riskAssessment.issues
    ];

    const recommendations = [
      ...complianceChecks.recommendations,
      ...budgetValidation.recommendations,
      ...policyValidation.recommendations,
      ...duplicateCheck.recommendations,
      ...riskAssessment.recommendations
    ];

    return {
      passed: overallScore >= this.config.preAuditThreshold,
      score: overallScore,
      maxScore: 100,
      percentage: overallScore,
      checks: {
        compliance: complianceChecks,
        budget: budgetValidation,
        policy: policyValidation,
        duplicate: duplicateCheck,
        risk: riskAssessment
      },
      issues,
      recommendations,
      canAutoApprove: overallScore >= this.config.autoApproveThreshold && issues.length === 0,
      requiresManualReview: issues.some(i => i.severity === 'high')
    };
  }

  async smartRoute(request: ApprovalRequest): Promise<RoutingSuggestion> {
    const context = await this.buildRoutingContext(request);
    const historicalPatterns = await this.analyzeHistoricalPatterns(request);
    const workloadAnalysis = await this.analyzeApproverWorkload(request);
    const slaConsiderations = await this.calculateSLAImpact(request);

    const suggestions: RoutingOption[] = [];

    for (const routeTemplate of this.routeTemplates.values()) {
      const matchScore = this.calculateRouteMatch(routeTemplate, context);
      
      if (matchScore >= this.config.routingMatchThreshold) {
        const optimizedSteps = await this.optimizeRouteSteps(routeTemplate, context, {
          historicalPatterns,
          workloadAnalysis,
          slaConsiderations
        });

        suggestions.push({
          route: routeTemplate,
          matchScore,
          estimatedTime: this.estimateProcessingTime(optimizedSteps),
          confidence: matchScore,
          optimizationSuggestions: this.generateOptimizationTips(optimizedSteps, context),
          risks: this.identifyRisks(optimizedSteps, context)
        });
      }
    }

    suggestions.sort((a, b) => b.matchScore - a.matchScore);

    return {
      requestId: request.id,
      suggestions,
      recommendedSuggestion: suggestions[0] || null,
      routingContext: context,
      generatedAt: new Date()
    };
  }

  async voiceApproval(
    requestId: string,
    userId: string,
    voiceCommand: VoiceCommand
  ): Promise<VoiceApprovalResult> {
    const request = this.getRequestOrThrow(requestId);
    
    const parsedCommand = await this.parseVoiceCommand(voiceCommand);
    
    if (!parsedCommand.isValid) {
      return {
        success: false,
        message: parsedCommand.errorMessage || '无法识别语音指令',
        confidence: parsedCommand.confidence,
        suggestedActions: ['请重试', '使用文字审批']
      };
    }

    switch (parsedCommand.action) {
      case 'approve':
        return {
          success: true,
          ...(await this.approveRequest(requestId, userId, parsedCommand.comment)),
          actionTaken: 'approved',
          message: `已批准请求 ${request.requestNumber}`,
          confidence: parsedCommand.confidence
        };

      case 'reject':
        return {
          success: true,
          ...(await this.rejectRequest(requestId, userId, parsedCommand.reason || '语音拒绝')),
          actionTaken: 'rejected',
          message: `已拒绝请求 ${request.requestNumber}`,
          confidence: parsedCommand.confidence
        };

      case 'delegate':
        if (!parsedCommand.delegatee) {
          return {
            success: false,
            message: '请指定委托对象',
            confidence: 0.5,
            suggestedActions: ['说"委托给张三"', '提供委托人姓名']
          };
        }
        return {
          success: true,
          ...(await this.delegateRequest(requestId, userId, parsedCommand.delegatee, parsedCommand.reason)),
          actionTaken: 'delegated',
          message: `已委托给 ${parsedCommand.delegatee}`,
          confidence: parsedCommand.confidence
        };

      default:
        return {
          success: false,
          message: `不支持的语音操作: ${parsedCommand.action}`,
          confidence: parsedCommand.confidence,
          suggestedActions: ['支持的操作: 批准/拒绝/委托']
        };
    }
  }

  async analyzeBottlenecks(timeRange?: TimeRangeInput): Promise<BottleneckAnalysis> {
    const requests = Array.from(this.activeRequests.values());
    const filteredRequests = timeRange 
      ? requests.filter(r => r.submittedAt >= timeRange.startDate && r.submittedAt <= timeRange.endDate)
      : requests;

    const bottleneckMetrics = this.calculateBottleneckMetrics(filteredRequests);
    const processBottlenecks = this.identifyProcessBottlenecks(filteredRequests);
    const approverBottlenecks = this.identifyApproverBottlenecks(filteredRequests);
    const recommendations = this.generateBottleneckRecommendations(bottleneckMetrics, processBottlenecks, approverBottlenecks);

    return {
      analysisPeriod: timeRange || { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date() },
      totalRequestsAnalyzed: filteredRequests.length,
      bottleneckMetrics,
      processBottlenecks,
      approverBottlenecks,
      recommendations,
      potentialTimeSavings: this.calculatePotentialTimeSavings(recommendations),
      generatedAt: new Date()
    };
  }

  private initializeDefaultRoutes(): void {
    const expenseRoute: ApprovalRoute = {
      id: 'route_expense_standard',
      name: '标准费用报销流程',
      type: RouteType.HIERARCHICAL,
      steps: [
        {
          stepNumber: 1,
          stepType: StepType.REVIEW,
          approverType: ApproverType.MANAGER,
          approvers: [{ id: 'mgr_1', type: ApproverType.MANAGER, referenceId: 'manager', name: '直属主管', isPrimary: true, order: 1, weight: 1, availability: 'available', workload: { pendingApprovals: 5, averageProcessingTime: 4, utilizationRate: 0.6 } }],
          actionRequired: ActionRequired.APPROVE_OR_REJECT,
          timeoutHours: 24,
          canDelegate: true,
          requireComment: false,
          notificationSettings: this.getDefaultNotificationSettings(),
          slaTarget: 24,
          isOptional: false
        },
        {
          stepNumber: 2,
          stepType: StepType.APPROVE,
          approverType: ApproverType.DEPARTMENT_HEAD,
          approvers: [{ id: 'dept_head_1', type: ApproverType.DEPARTMENT_HEAD, referenceId: 'dept_head', name: '部门负责人', isPrimary: true, order: 1, weight: 1, availability: 'available', workload: { pendingApprovals: 3, averageProcessingTime: 8, utilizationRate: 0.4 } }],
          actionRequired: ActionRequired.APPROVE_OR_REJECT,
          conditions: [{
            id: 'cond_amount',
            type: 'amount',
            field: 'amount',
            operator: 'greater_than',
            value: 5000,
            logicOperator: 'and',
            description: '金额超过5000元需部门负责人审批'
          }],
          timeoutHours: 48,
          canDelegate: true,
          requireComment: true,
          notificationSettings: this.getDefaultNotificationSettings(),
          slaTarget: 48,
          isOptional: true,
          skipCondition: {
            type: 'below_threshold',
            condition: { id: 'skip_cond', type: 'amount', field: 'amount', operator: 'less_than_or_equal', value: 5000, logicOperator: 'and', description: '' },
            autoApprove: false,
            notifySkippedApprovers: true
          }
        },
        {
          stepNumber: 3,
          stepType: StepType.APPROVE,
          approverType: ApproverType.POSITION,
          approvers: [{ id: 'finance_1', type: ApproverType.POSITION, referenceId: 'finance_manager', name: '财务经理', isPrimary: true, order: 1, weight: 1, availability: 'available', workload: { pendingApprovals: 10, averageProcessingTime: 6, utilizationRate: 0.7 } }],
          actionRequired: ActionRequired.APPROVE_OR_REJECT,
          conditions: [{
            id: 'cond_high_amount',
            type: 'amount',
            field: 'amount',
            operator: 'greater_than',
            value: 50000,
            logicOperator: 'and',
            description: '金额超过5万元需财务经理审批'
          }],
          timeoutHours: 72,
          canDelegate: false,
          requireComment: true,
          notificationSettings: this.getDefaultNotificationSettings(),
          slaTarget: 72,
          isOptional: true,
          skipCondition: {
            type: 'below_threshold',
            condition: { id: 'skip_cond_2', type: 'amount', field: 'amount', operator: 'less_than_or_equal', value: 50000, logicOperator: 'and', description: '' },
            autoApprove: false,
            notifySkippedApprovers: true
          }
        }
      ],
      isParallelAllowed: false,
      isConditionalRouting: true,
      escalationRules: [{
        ruleId: 'esc_1',
        triggerCondition: { type: 'timeout', threshold: 24, unit: 'hours', includeNonWorkingHours: false },
        escalateTo: { type: 'manager', targetId: 'manager_backup', targetName: '主管备份' },
        action: EscalationAction.REASSIGN,
        notificationTemplate: 'escalation_template',
        isActive: true
      }],
      slaSettings: {
        overallSLA: 120,
        perSLA: { 1: 24, 2: 48, 3: 72 },
        workingHoursOnly: true,
        holidaysIncluded: false,
        gracePeriod: 4,
        breachActions: [{
          triggerPoint: 80,
          action: 'warning' as any,
          notifications: [{ channels: [NotificationChannel.EMAIL], template: 'sla_warning', delayMinutes: 0, maxRetries: 3, includeDetails: true }],
          autoEscalate: false
        }]
      },
      version: 1,
      isActive: true,
      effectiveDate: new Date()
    };

    this.routeTemplates.set(expenseRoute.id, expenseRoute);
  }

  private getDefaultNotificationSettings(): any {
    return {
      onAssignment: { channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL], template: 'assignment_template', delayMinutes: 0, maxRetries: 3, includeDetails: true },
      onReminder: { channels: [NotificationChannel.IN_APP], template: 'reminder_template', delayMinutes: 1440, repeatInterval: 1440, maxRetries: 5, includeDetails: false },
      onComplete: { channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL], template: 'complete_template', delayMinutes: 0, maxRetries: 3, includeDetails: true },
      onOverdue: { channels: [NotificationChannel.EMAIL, NotificationChannel.WECHAT], template: 'overdue_template', delayMinutes: 0, maxRetries: 3, includeDetails: true },
      onEscalation: { channels: [NotificationChannel.EMAIL, NotificationChannel.SMS], template: 'escalation_template', delayMinutes: 0, maxRetries: 3, includeDetails: true }
    };
  }

  private async generateRequestNumber(type: ApprovalType): Promise<string> {
    const prefix = this.getTypePrefix(type);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private getTypePrefix(type: ApprovalType): string {
    const prefixes: Record<ApprovalType, string> = {
      [ApprovalType.EXPENSE_REIMBURSEMENT]: 'EXP',
      [ApprovalType.LEAVE_REQUEST]: 'LEV',
      [ApprovalType.PURCHASE_ORDER]: 'PO',
      [ApprovalType.BUDGET_APPROVAL]: 'BUD',
      [ApprovalType.CONTRACT_SIGNING]: 'CON',
      [ApprovalType.HIRING_REQUEST]: 'HIR',
      [ApprovalType.SALARY_ADJUSTMENT]: 'SAL',
      [ApprovalType.PROMOTION]: 'PRO',
      [ApprovalType.ASSET_REQUEST]: 'AST',
      [ApprovalType.TRAVEL_REQUEST]: 'TRV',
      [ApprovalType.OVERTIME_REQUEST]: 'OVT',
      [ApprovalType.WORK_FROM_HOME]: 'WFH',
      [ApprovalType.DOCUMENT_APPROVAL]: 'DOC',
      [ApprovalType.POLICY_EXCEPTION]: 'PLX',
      [ApprovalType.CUSTOM]: 'CUS'
    };
    return prefixes[type] || 'REQ';
  }

  private getDefaultTitle(type: ApprovalType): string {
    const titles: Record<ApprovalType, string> = {
      [ApprovalType.EXPENSE_REIMBURSEMENT]: '费用报销申请',
      [ApprovalType.LEAVE_REQUEST]: '请假申请',
      [ApprovalType.PURCHASE_ORDER]: '采购订单审批',
      [ApprovalType.BUDGET_APPROVAL]: '预算审批',
      [ApprovalType.CONTRACT_SIGNING]: '合同签署审批',
      [ApprovalType.HIRING_REQUEST]: '招聘申请',
      [ApprovalType.SALARY_ADJUSTMENT]: '薪资调整申请',
      [ApprovalType.PROMOTION]: '晋升申请',
      [ApprovalType.ASSET_REQUEST]: '资产申领',
      [ApprovalType.TRAVEL_REQUEST]: '差旅申请',
      [ApprovalType.OVERTIME_REQUEST]: '加班申请',
      [ApprovalType.WORK_FROM_HOME]: '居家办公申请',
      [ApprovalType.DOCUMENT_APPROVAL]: '文档审批',
      [ApprovalType.POLICY_EXCEPTION]: '政策例外申请',
      [ApprovalType.CUSTOM]: '自定义审批'
    };
    return titles[type] || '审批申请';
  }

  private async determineRoute(input: CreateRequestInput): Promise<ApprovalRoute> {
    const matchingRoutes = Array.from(this.routeTemplates.values())
      .filter(route => route.isActive)
      .filter(route => !route.expiryDate || route.expiryDate > new Date())
      .filter(route => route.effectiveDate <= new Date());

    if (matchingRoutes.length === 0) {
      throw new Error('No suitable approval route found');
    }

    return matchingRoutes[0];
  }

  private calculateDeadline(route: ApprovalRoute): Date {
    const deadline = new Date();
    deadline.setTime(deadline.getTime() + route.slaSetting.overallSLA * 60 * 60 * 1000);
    return deadline;
  }

  private createInitialAuditTrail(submitterId: string): AuditTrailEntry[] {
    return [{
      entryId: this.generateId(),
      timestamp: new Date(),
      action: 'CREATED',
      performedBy: submitterId,
      performerRole: 'submitter',
      performerDepartment: '',
      previousStatus: ApprovalStatus.DRAFT,
      newStatus: ApprovalStatus.DRAFT,
      stepNumber: 0
    }];
  }

  private getFirstStepToProcess(route: ApprovalRoute): any {
    return route.steps.find(step => 
      ![StepType.FYI, StepType.NOTIFY, StepType.AUTO_APPROVE].includes(step.stepType)
    ) || route.steps[0];
  }

  private getApproverIdsForStep(step: any): string[] {
    return step.approvers
      ?.filter((a: any) => a.availability === 'available')
      .map((a: any) => a.referenceId) || [];
  }

  private async assignToApprovers(request: ApprovalRequest, step: any): Promise<void> {
    for (const approver of step.approvers || []) {
      await this.sendNotification({
        channel: NotificationChannel.IN_APP,
        recipientId: approver.referenceId,
        template: 'assignment_notification',
        data: {
          requestId: request.id,
          requestNumber: request.requestNumber,
          title: request.title,
          type: request.type,
          amount: request.amount,
          submitter: request.submitterName,
          deadline: request.deadline,
          stepNumber: step.stepNumber,
          actionRequired: step.actionRequired
        }
      });
    }
  }

  private getNextStep(route: ApprovalRoute, currentStep: number): any {
    return route.steps.find(step => step.stepNumber > currentStep);
  }

  private shouldSkipStep(nextStep: any, request: ApprovalRequest): boolean {
    if (!nextStep.skipCondition) return false;

    const condition = nextStep.skipCondition.condition;
    
    switch (condition.type) {
      case 'below_threshold':
        return (request.amount || 0) <= (condition.value as number);
      case 'always_skip':
        return true;
      case 'previously_approved':
        return false;
      default:
        return false;
    }
  }

  private async skipAndProceed(
    request: ApprovalRequest, 
    skippedStep: any, 
    approverId: string
  ): Promise<ApprovalRequest> {
    this.addAuditTrailEntry(request, {
      action: 'SYSTEM_ACTION',
      performedBy: 'system',
      previousStatus: request.status,
      newStatus: request.status,
      stepNumber: skippedStep.stepNumber,
      systemNotes: `步骤${skippedStep.stepNumber}自动跳过`,
      comment: `符合跳过条件: ${skippedStep.skipCondition?.condition?.description}`
    });

    const nextNextStep = this.getNextStep(request.route, skippedStep.stepNumber);
    
    if (!nextNextStep) {
      return this.completeRequest(request, approverId);
    }

    request.currentStep = nextNextStep.stepNumber;
    request.currentApproverIds = this.getApproverIdsForStep(nextNextStep);
    request.lastUpdatedAt = new Date();

    await this.assignToApprovers(request, nextNextStep);
    this.activeRequests.set(request.id, request);

    return request;
  }

  private async completeRequest(
    request: ApprovalRequest, 
    finalApproverId: string
  ): Promise<ApprovalRequest> {
    request.status = ApprovalStatus.APPROVED;
    request.currentStep = request.totalSteps;
    request.currentApproverIds = [];
    request.completedAt = new Date();
    request.lastUpdatedAt = new Date();
    request.actualProcessingTime = Date.now() - request.submittedAt.getTime();

    this.addAuditTrailEntry(request, {
      action: 'COMPLETED',
      performedBy: finalApproverId,
      previousStatus: ApprovalStatus.IN_PROGRESS,
      newStatus: ApprovalStatus.APPROVED,
      stepNumber: request.totalSteps
    });

    await this.notifyStakeholders(request, 'completed');
    await this.triggerPostApprovalActions(request);
    
    this.activeRequests.set(request.id, request);
    return request;
  }

  private addAuditTrailEntry(
    request: ApprovalRequest, 
    entry: Omit<AuditTrailEntry, 'entryId' | 'timestamp'>
  ): void {
    request.auditTrail.push({
      entryId: this.generateId(),
      timestamp: new Date(),
      ...entry
    });
  }

  private addComment(
    request: ApprovalRequest, 
    commentData: Omit<Comment, 'commentId' | 'requestId' | 'createdAt' | 'updatedAt'>
  ): void {
    request.comments.push({
      commentId: this.generateId(),
      requestId: request.id,
      authorName: 'System',
      authorRole: '',
      reactions: [],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...commentData
    });
  }

  private validateApproverPermission(request: ApprovalRequest, approverId: string): void {
    if (!request.currentApproverIds.includes(approverId)) {
      throw new Error(`User ${approverId} is not authorized to act on this request`);
    }
  }

  private getCurrentStep(request: ApprovalRequest): any {
    return request.route.steps.find(s => s.stepNumber === request.currentStep);
  }

  private getRequestOrThrow(requestId: string): ApprovalRequest {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }
    return request;
  }

  private async notifyStakeholders(
    request: ApprovalRequest, 
    event: string,
    additionalRecipients?: string[]
  ): Promise<void> {
    const recipients = [
      request.submitterId,
      ...request.currentApproverIds,
      ...(additionalRecipients || [])
    ];

    for (const recipient of recipients) {
      await this.sendNotification({
        channel: NotificationChannel.IN_APP,
        recipientId: recipient,
        template: `${event}_notification`,
        data: {
          requestId: request.id,
          requestNumber: request.requestNumber,
          title: request.title,
          status: request.status,
          event
        }
      });
    }
  }

  private async notifyMentionedUsers(request: ApprovalRequest, comment: Comment): Promise<void> {
    for (const mentionedUserId of comment.mentions) {
      await this.sendNotification({
        channel: NotificationChannel.IN_APP,
        recipientId: mentionedUserId,
        template: 'mention_notification',
        data: {
          requestId: request.id,
          commenter: comment.authorName,
          content: comment.content.substring(0, 100)
        }
      });
    }
  }

  private async sendNotification(notification: any): Promise<void> {
    console.log('Sending notification:', notification);
  }

  private async performInitialComplianceCheck(input: CreateRequestInput): Promise<ComplianceCheckResult> {
    return {
      isChecked: true,
      status: 'compliant' as any,
      score: 95,
      checks: [],
      violations: [],
      remediationActions: []
    };
  }

  private async triggerPostApprovalActions(request: ApprovalRequest): Promise<void> {
    console.log(`Triggering post-approval actions for request ${request.id}`);
  }

  private applyFilters(requests: ApprovalRequest[], filter: Record<string, unknown>): ApprovalRequest[] {
    return requests.filter(request => {
      for (const [key, value] of Object.entries(filter)) {
        if ((request as any)[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  private applySorting(requests: ApprovalRequest[], sort: any[]): ApprovalRequest[] {
    return requests.sort((a, b) => {
      for (const sortOption of sort) {
        const aValue = (a as any)[sortOption.field];
        const bValue = (b as any)[sortOption.field];
        
        if (aValue < bValue) return sortOption.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOption.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private async runComplianceChecks(request: ApprovalRequest): Promise<any> {
    return { score: 90, issues: [], recommendations: [] };
  }

  private async validateBudget(request: ApprovalRequest): Promise<any> {
    return { score: 85, issues: [], recommendations: [] };
  }

  private async validatePolicies(request: ApprovalRequest): Promise<any> {
    return { score: 95, issues: [], recommendations: [] };
  }

  private async checkForDuplicates(request: ApprovalRequest): Promise<any> {
    return { score: 100, issues: [], recommendations: [] };
  }

  private async assessRisk(request: ApprovalRequest): Promise<any> {
    return { score: 88, issues: [], recommendations: [] };
  }

  private async buildRoutingContext(request: ApprovalRequest): Promise<any> {
    return {
      requestType: request.type,
      amount: request.amount,
      priority: request.priority,
      urgency: request.urgency,
      department: request.submitterDepartment,
      submitterLevel: request.submitterPosition
    };
  }

  private async analyzeHistoricalPatterns(request: ApprovalRequest): Promise<any> {
    return {};
  }

  private async analyzeApproverWorkload(request: ApprovalRequest): Promise<any> {
    return {};
  }

  private async calculateSLAImpact(request: ApprovalRequest): Promise<any> {
    return {};
  }

  private calculateRouteMatch(route: ApprovalRoute, context: any): number {
    return Math.random() * 30 + 70;
  }

  private async optimizeRouteSteps(
    route: ApprovalRoute, 
    context: any, 
    analysis: any
  ): Promise<any[]> {
    return route.steps;
  }

  private estimateProcessingTime(steps: any[]): number {
    return steps.reduce((total, step) => total + (step.slaTarget || 24), 0);
  }

  private generateOptimizationTips(steps: any[], context: any): string[] {
    return [];
  }

  private identifyRisks(steps: any[], context: any): string[] {
    return [];
  }

  private async parseVoiceCommand(command: VoiceCommand): Promise<ParsedVoiceCommand> {
    const lowerTranscript = command.transcript.toLowerCase();
    
    if (lowerTranscript.includes('批准') || lowerTranscript.includes('同意') || lowerTranscript.includes('通过')) {
      return {
        isValid: true,
        action: 'approve',
        confidence: command.confidence,
        comment: lowerTranscript.replace(/批准|同意|通过/g, '').trim()
      };
    }

    if (lowerTranscript.includes('拒绝') || lowerTranscript.includes('不同意') || lowerTranscript.includes('驳回')) {
      return {
        isValid: true,
        action: 'reject',
        confidence: command.confidence,
        reason: lowerTranscript.replace(/拒绝|不同意|驳回/g, '').trim()
      };
    }

    if (lowerTranscript.includes('委托') || lowerTranscript.includes('转交')) {
      const delegateeMatch = lowerTranscript.match(/委托.*?给(\S+)|转交.*?给(\S+)/);
      return {
        isValid: !!delegateeMatch,
        action: 'delegate',
        confidence: command.confidence,
        delegatee: delegateeMatch?.[1] || delegateeMatch?.[2],
        reason: ''
      };
    }

    return {
      isValid: false,
      action: 'unknown',
      confidence: command.confidence,
      errorMessage: '无法理解您的指令'
    };
  }

  private calculateBottleneckMetrics(requests: ApprovalRequest[]): any {
    return {
      avgProcessingTime: 48,
      medianProcessingTime: 36,
      p95ProcessingTime: 120,
      approvalRate: 0.85,
      rejectionRate: 0.10,
      returnRate: 0.05,
      timeoutRate: 0.03,
      delegationRate: 0.08
    };
  }

  private identifyProcessBottlenecks(requests: ApprovalRequest[]): any[] {
    return [];
  }

  private identifyApproverBottlenecks(requests: ApprovalRequest[]): any[] {
    return [];
  }

  private generateBottleneckRecommendations(metrics: any, process: any[], approvers: any[]): any[] {
    return [];
  }

  private calculatePotentialTimeSavings(recommendations: any[]): number {
    return recommendations.length * 8;
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

interface EngineConfig {
  preAuditThreshold: number;
  autoApproveThreshold: number;
  routingMatchThreshold: number;
}

interface CreateRequestInput {
  type: ApprovalType;
  title?: string;
  description: string;
  submitterId: string;
  submitterName: string;
  department: string;
  position: string;
  organizationId: string;
  amount?: number;
  currency?: string;
  priority?: Priority;
  urgency?: UrgencyLevel;
  attachments?: any[];
  formData?: any[];
  customFields?: any[];
  source?: string;
  ipAddress?: string;
  autoSubmit?: boolean;
  category?: string;
  costCenter?: string;
  projectCode?: string;
}

interface AddCommentInput {
  authorId: string;
  authorName?: string;
  content: string;
  contentType?: string;
  isPrivate?: boolean;
  isInternal?: boolean;
  mentions?: string[];
  attachments?: string[];
}

interface PreAuditResult {
  passed: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  checks: {
    compliance: any;
    budget: any;
    policy: any;
    duplicate: any;
    risk: any;
  };
  issues: any[];
  recommendations: any[];
  canAutoApprove: boolean;
  requiresManualReview: boolean;
}

interface RoutingSuggestion {
  requestId: string;
  suggestions: RoutingOption[];
  recommendedSuggestion: RoutingOption | null;
  routingContext: any;
  generatedAt: Date;
}

interface RoutingOption {
  route: ApprovalRoute;
  matchScore: number;
  estimatedTime: number;
  confidence: number;
  optimizationSuggestions: string[];
  risks: string[];
}

interface VoiceCommand {
  transcript: string;
  confidence: number;
  language: string;
  audioDuration: number;
}

interface ParsedVoiceCommand {
  isValid: boolean;
  action: string;
  confidence: number;
  comment?: string;
  reason?: string;
  delegatee?: string;
  errorMessage?: string;
}

interface VoiceApprovalResult extends Partial<ApprovalRequest> {
  success: boolean;
  message: string;
  confidence: number;
  actionTaken?: string;
  suggestedActions?: string[];
}

interface TimeRangeInput {
  startDate: Date;
  endDate: Date;
}

interface BottleneckAnalysis {
  analysisPeriod: TimeRangeInput;
  totalRequestsAnalyzed: number;
  bottleneckMetrics: any;
  processBottlenecks: any[];
  approverBottlenecks: any[];
  recommendations: any[];
  potentialTimeSavings: number;
  generatedAt: Date;
}
