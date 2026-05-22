/**
 * file orchestrator.ts
 * description AI 家人调度器
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
 * brief AI 家人调度器
 */
import {
  TaskContext,
  CollaborationSession,
  CollaborationMode,
  FamilyMemberState,
  CollaborationOutput,
  FamilyMemberConfig,
} from './types';
import { IFamilyMember, MemberStatus } from './base-member';
import { Qianxing as Navigator, Wanwu as Thinker, Xianzhi as Prophet, Bole as Bolero } from './members';
import { logger } from '../logger.js';

export class FamilyOrchestrator {
  private members: Map<string, IFamilyMember>;
  private activeSessions: Map<string, CollaborationSession>;
  private config: {
    maxActiveMembers: number;
    defaultCollaborationMode: CollaborationMode;
    emotionSensitivity: number;
  };
  
  constructor() {
    this.members = new Map();
    this.activeSessions = new Map();
    this.config = {
      maxActiveMembers: 5,
      defaultCollaborationMode: 'hierarchical',
      emotionSensitivity: 0.8,
    };
    
    this.initializeMembers();
  }
  
  private initializeMembers(): void {
    const coreMembers: IFamilyMember[] = [
      new Navigator(),
      new Thinker(),
      new Prophet(),
      new Bolero(),
    ];
    
    for (const member of coreMembers) {
      this.members.set(member.id, member);
    }
    
    logger.info(`Family初始化完成，共${this.members.size}位成员`);
  }
  
  async orchestrate(task: TaskContext): Promise<CollaborationSession> {
    const sessionId = `session_${Date.now()}`;
    
    const selectedMembers = this.selectMembers(task);
    const collaborationMode = this.decideCollaborationMode(selectedMembers, task);
    const memberStates = this.initializeMemberStates(selectedMembers);
    
    const session: CollaborationSession = {
      id: sessionId,
      task,
      members: memberStates,
      mode: collaborationMode,
      startTime: new Date(),
      status: 'planning',
      outputs: [],
    };
    
    this.activeSessions.set(sessionId, session);
    
    await this.executeCollaboration(session);
    
    return session;
  }
  
  private selectMembers(task: TaskContext): IFamilyMember[] {
    const candidates: Array<{ member: IFamilyMember; score: number }> = [];
    
    for (const member of this.members.values()) {
      if (member.canHandle(task)) {
        const score = this.calculateRelevanceScore(member, task);
        candidates.push({ member, score });
      }
    }
    
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates
      .slice(0, this.config.maxActiveMembers)
      .map(c => c.member);
  }
  
  private calculateRelevanceScore(member: IFamilyMember, task: TaskContext): number {
    const status = member.getStatus();
    let score = status.performanceScore;
    
    score += (1 - status.currentLoad) * 0.3;
    
    if (task.urgency === 'high' && status.performanceScore > 0.8) {
      score += 0.2;
    }
    
    return score;
  }
  
  private decideCollaborationMode(
    members: IFamilyMember[],
    task: TaskContext
  ): CollaborationMode {
    if (members.length === 1) {
      return 'sequential';
    }
    
    if (task.complexity === 'complex') {
      return 'hierarchical';
    }
    
    if (task.type === 'creating' || task.type === 'exploring') {
      return 'democratic';
    }
    
    if (task.urgency === 'high') {
      return 'parallel';
    }
    
    return this.config.defaultCollaborationMode;
  }
  
  private initializeMemberStates(members: IFamilyMember[]): FamilyMemberState[] {
    return members.map(member => ({
      memberId: member.id,
      role: member.role,
      assignedTasks: [],
      contributions: [],
      performance: {
        accuracy: 1.0,
        relevance: 1.0,
        timeliness: 1.0,
        userSatisfaction: 1.0,
        growthContribution: 1.0,
      },
    }));
  }
  
  private async executeCollaboration(session: CollaborationSession): Promise<void> {
    session.status = 'executing';
    
    switch (session.mode) {
      case 'sequential':
        await this.executeSequential(session);
        break;
      case 'parallel':
        await this.executeParallel(session);
        break;
      case 'hierarchical':
        await this.executeHierarchical(session);
        break;
      case 'democratic':
        await this.executeDemocratic(session);
        break;
    }
    
    session.status = 'completed';
  }
  
  private async executeSequential(session: CollaborationSession): Promise<void> {
    for (const memberState of session.members) {
      const member = this.members.get(memberState.memberId);
      if (member) {
        const output = await member.processInput(
          { text: session.task.description },
          session.task.userContext
        );
        
        session.outputs.push({
          memberId: member.id,
          type: 'insight',
          content: output,
          confidence: 0.9,
        });
      }
    }
  }
  
  private async executeParallel(session: CollaborationSession): Promise<void> {
    const promises = session.members.map(async memberState => {
      const member = this.members.get(memberState.memberId);
      if (member) {
        return member.processInput(
          { text: session.task.description },
          session.task.userContext
        );
      }
      return null;
    });
    
    const results = await Promise.all(promises);
    
    results.forEach((output, index) => {
      if (output) {
        session.outputs.push({
          memberId: session.members[index].memberId,
          type: 'insight',
          content: output,
          confidence: 0.85,
        });
      }
    });
  }
  
  private async executeHierarchical(session: CollaborationSession): Promise<void> {
    const leader = session.members[0];
    const leaderMember = this.members.get(leader.memberId);
    
    if (leaderMember) {
      const leaderOutput = await leaderMember.processInput(
        { text: session.task.description },
        session.task.userContext
      );
      
      session.outputs.push({
        memberId: leader.memberId,
        type: 'insight',
        content: leaderOutput,
        confidence: 0.95,
      });
      
      for (let i = 1; i < session.members.length; i++) {
        const member = this.members.get(session.members[i].memberId);
        if (member) {
          const output = await member.processInput(
            { text: JSON.stringify(leaderOutput) },
            session.task.userContext
          );
          
          session.outputs.push({
            memberId: session.members[i].memberId,
            type: 'feedback',
            content: output,
            confidence: 0.8,
          });
        }
      }
    }
  }
  
  private async executeDemocratic(session: CollaborationSession): Promise<void> {
    const allOutputs: CollaborationOutput[] = [];
    
    for (const memberState of session.members) {
      const member = this.members.get(memberState.memberId);
      if (member) {
        const output = await member.processInput(
          { text: session.task.description },
          session.task.userContext
        );
        
        allOutputs.push({
          memberId: member.id,
          type: 'suggestion',
          content: output,
          confidence: 0.8,
        });
      }
    }
    
    const consensus = this.findConsensus(allOutputs);
    session.outputs.push(...allOutputs, consensus);
  }
  
  private findConsensus(outputs: CollaborationOutput[]): CollaborationOutput {
    return {
      memberId: 'consensus',
      type: 'recommendation',
      content: '综合所有Family成员的建议，我们达成以下共识...',
      confidence: 0.9,
    };
  }
  
  getMemberStatus(memberId: string): MemberStatus | undefined {
    const member = this.members.get(memberId);
    return member?.getStatus();
  }
  
  getAllMembersStatus(): MemberStatus[] {
    return Array.from(this.members.values()).map(m => m.getStatus());
  }
  
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.activeSessions.get(sessionId);
  }
}
