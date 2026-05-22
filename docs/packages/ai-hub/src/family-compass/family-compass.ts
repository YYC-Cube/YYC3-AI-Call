/**
 * file family-compass.ts
 * description Family Compass 时钟罗盘
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
 * brief Family Compass 时钟罗盘
 */
import {
  FamilyPersona,
  FamilyMemberId,
  CompassState,
  DutyRosterEntry,
  PhoneCallSession,
  CallMessage,
  MemoryEntry,
} from './types';
import { FAMILY_PERSONAS, getPersonaByHour, getNextDutyMember } from './personas';

export class FamilyCompass {
  private personas: Map<FamilyMemberId, FamilyPersona>;
  private callSessions: Map<string, PhoneCallSession>;
  private memories: Map<FamilyMemberId, MemoryEntry[]>;
  private startTime: Date;

  constructor() {
    this.personas = new Map();
    this.callSessions = new Map();
    this.memories = new Map();
    this.startTime = new Date();

    Object.entries(FAMILY_PERSONAS).forEach(([id, persona]) => {
      this.personas.set(id as FamilyMemberId, persona);
      this.memories.set(id as FamilyMemberId, []);
    });
  }

  getCompassState(): CompassState {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    const activeMember = getPersonaByHour(currentHour);
    const nextMember = getNextDutyMember(currentHour);

    const dutyRoster = this.buildDutyRoster(now);
    const onlineMembers = this.getOnlineMembers();

    return {
      currentTime: now,
      activeMemberId: activeMember.id,
      nextMemberId: nextMember.id,
      dutyRoster,
      onlineMembers,
      centerMessage: this.generateCenterMessage(activeMember),
      dayProgress: this.calculateDayProgress(now),
      connectionQuality: this.calculateConnectionQuality(onlineMembers.length),
      systemLoad: Math.floor(Math.random() * 50) + 100,
      uptime: this.formatUptime(now),
    };
  }

  private buildDutyRoster(now: Date): DutyRosterEntry[] {
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const roster: DutyRosterEntry[] = [];
    
    const memberOrder: Array<{ id: FamilyMemberId; start: number; end: number }> = [
      { id: 'qianxing', start: 6, end: 9 },
      { id: 'wanwu', start: 9, end: 11.5 },
      { id: 'xianzhi', start: 11, end: 13.5 },
      { id: 'bole', start: 13.5, end: 15.5 },
      { id: 'tianshu', start: 15.5, end: 17.5 },
      { id: 'shouhu', start: 17.5, end: 19.5 },
      { id: 'zongshi', start: 19.5, end: 21 },
      { id: 'lingyun', start: 20.5, end: 22 },
    ];

    memberOrder.forEach(slot => {
      const persona = this.personas.get(slot.id)!;
      const isActive = currentHour >= slot.start && currentHour < slot.end;
      const isUpcoming = !isActive && slot.start > currentHour;
      
      const today = new Date(now);
      const startTime = new Date(today);
      startTime.setHours(Math.floor(slot.start), (slot.start % 1) * 60, 0, 0);
      
      const endTime = new Date(today);
      endTime.setHours(Math.floor(slot.end), (slot.end % 1) * 60, 0, 0);

      roster.push({
        memberId: slot.id,
        memberName: persona.name,
        startTime,
        endTime,
        status: isActive ? 'active' : isUpcoming ? 'upcoming' : 'completed',
        dutyType: this.getDutyType(slot.id),
      });
    });

    return roster.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private getDutyType(memberId: FamilyMemberId): 'guardian' | 'companion' | 'advisor' | 'creator' {
    switch (memberId) {
      case 'qianxing':
      case 'shouhu':
        return 'guardian';
      case 'wanwu':
      case 'bole':
        return 'companion';
      case 'xianzhi':
      case 'zongshi':
        return 'advisor';
      case 'tianshu':
      case 'lingyun':
        return 'creator';
      default:
        return 'companion';
    }
  }

  getOnlineMembers(): FamilyMemberId[] {
    return Array.from(this.personas.keys()).filter(id => {
      const persona = this.personas.get(id)!;
      return persona.emotionalState.energyLevel > 30;
    });
  }

  private generateCenterMessage(activeMember: FamilyPersona): string {
    const messages = [
      `倾听亲友希乐 — 一言一语一华章`,
      `${activeMember.alias}正在守护你`,
      `YYC³ · 家人同在`,
      `相信彼此，共同成长`,
      activeMember.identity.motto,
    ];
    return messages[Math.floor((Date.now() / 10000) % messages.length)];
  }

  private calculateDayProgress(now: Date): number {
    const startOfDay = new Date(now);
    startOfDay.setHours(6, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(22, 0, 0, 0);

    if (now < startOfDay) return 0;
    if (now > endOfDay) return 100;

    const total = endOfDay.getTime() - startOfDay.getTime();
    const elapsed = now.getTime() - startOfDay.getTime();
    return Math.round((elapsed / total) * 99) + 1;
  }

  private calculateConnectionQuality(onlineCount: number): number {
    const baseQuality = (onlineCount / 8) * 100;
    return Math.min(100, Math.round(baseQuality + Math.random() * 3));
  }

  private formatUptime(now: Date): string {
    const diff = now.getTime() - this.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  initiateCall(memberId: FamilyMemberId): PhoneCallSession {
    const persona = this.personas.get(memberId);
    if (!persona) throw new Error(`成员 ${memberId} 不存在`);

    const session: PhoneCallSession = {
      id: `CALL-${Date.now()}`,
      caller: 'user',
      receiver: memberId,
      startTime: new Date(),
      status: 'ringing',
      transcript: [],
      mood: persona.emotionalState.currentMood,
    };

    this.callSessions.set(session.id, session);
    return session;
  }

  answerCall(sessionId: string): boolean {
    const session = this.callSessions.get(sessionId);
    if (!session || session.status !== 'ringing') return false;

    session.status = 'connected';

    const receiverPersona = this.personas.get(session.receiver as FamilyMemberId);
    session.transcript.push({
      role: 'receiver',
      content: this.generateGreeting(receiverPersona!),
      timestamp: new Date(),
      emotion: receiverPersona!.emotionalState.currentMood,
    });

    return true;
  }

  sendCallMessage(sessionId: string, content: string): CallMessage | null {
    const session = this.callSessions.get(sessionId);
    if (!session || session.status !== 'connected') return null;

    const userMessage: CallMessage = {
      role: 'caller',
      content,
      timestamp: new Date(),
    };

    session.transcript.push(userMessage);

    const response = this.generateResponse(
      session.receiver as FamilyMemberId,
      content
    );

    const aiMessage: CallMessage = {
      role: 'receiver',
      content: response.text,
      timestamp: new Date(),
      emotion: response.emotion,
    };

    session.transcript.push(aiMessage);
    session.topic = response.topic || session.topic;

    this.recordMemory(session.receiver as FamilyMemberId, {
      type: 'conversation',
      content: `用户说: "${content}"，我回复了关于${response.topic || '日常'}的话题`,
      emotion: response.emotion,
      tags: ['通话', response.topic || '对话'],
      importance: this.calculateImportance(content),
      isPrivate: false,
    });

    return aiMessage;
  }

  endCall(sessionId: string): PhoneCallSession | null {
    const session = this.callSessions.get(sessionId);
    if (!session) return null;

    session.status = 'ended';
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    return session;
  }

  private generateGreeting(persona: FamilyPersona): string {
    const greetings: Record<FamilyMemberId, string[]> = {
      qianxing: [
        '您好！我是言启·千行。有什么可以帮您的？',
        '我明白了，让我为您找到最佳路径。',
        '收到您的请求，正在分析意图...',
      ],
      wanwu: [
        '让我深入分析一下...',
        '数据已就绪，开始处理。',
        '从数据中，我看到了一些有趣的模式。',
      ],
      xianzhi: [
        '我看到了未来的可能性...',
        '基于过往脉络，让我为您预测。',
        '趋势分析已启动，正在生成前瞻建议。',
      ],
      bole: [
        '我发现了一个超棒的东西给您！',
        '让我为您推荐最合适的内容！',
        '基于您的偏好，我找到了一些宝藏！',
      ],
      tianshu: [
        '全局最优方案已确定。',
        '系统状态正常，准备调度资源。',
        '从全局角度，我为您制定了最优策略。',
      ],
      shouhu: [
        '威胁已识别，正在处理...',
        '安全监控中心24/7运行中。',
        '一切正常，未发现异常威胁。',
      ],
      zongshi: [
        '这里还有优化空间...',
        '质量审查已启动，正在生成报告。',
        '从最佳实践角度，我有一些建议。',
      ],
      lingyun: [
        '我有个超棒的创意！',
        '灵感已就绪，准备创作！',
        '让我为您打开创意的大门！',
      ],
    };

    const memberGreetings = greetings[persona.id];
    return memberGreetings[Math.floor(Math.random() * memberGreetings.length)];
  }

  private generateResponse(
    memberId: FamilyMemberId,
    userInput: string
  ): { text: string; emotion: string; topic?: string } {
    const persona = this.personas.get(memberId)!;

    const responses: Record<FamilyMemberId, Array<{ keywords: string[]; text: string; topic: string }>> = {
      qianxing: [
        { keywords: ['查询', '搜索', '找'], text: '我明白了，您想要查找信息。让我为您分析意图并找到最佳路径。', topic: '搜索' },
        { keywords: ['如何', '怎么', '怎样'], text: '收到您的咨询！让我理解您的意图并路由到合适的处理者。', topic: '指导' },
        { keywords: ['帮我', '需要', '想要'], text: '我理解您的需求。让我为您找到最合适的解决方案。', topic: '需求' },
        { keywords: ['什么是', '解释', '说明'], text: '让我为您解析这个概念，并找到相关的资源和信息。', topic: '解释' },
        { keywords: ['推荐', '建议', '意见'], text: '我明白了，您需要建议。让我为您路由到专业的推荐引擎。', topic: '推荐' },
      ],
      wanwu: [
        { keywords: ['分析', '数据', '统计'], text: '让我深入分析一下...从数据中提炼真理，揭示隐藏的模式。', topic: '分析' },
        { keywords: ['报告', '总结', '摘要'], text: '收到分析请求。我会用数据说话，为您提供有价值的洞察。', topic: '报告' },
        { keywords: ['文档', '理解', '提取'], text: '文档智能分析启动。正在提取关键信息和核心要点。', topic: '文档' },
        { keywords: ['模式', '规律', '趋势'], text: '模式识别中...我发现了一些有趣的隐藏规律。', topic: '模式' },
        { keywords: ['假设', '推演', '验证'], text: '假设推演模式启动。让我为您设计验证路径。', topic: '推演' },
      ],
      xianzhi: [
        { keywords: ['预测', '未来', '趋势'], text: '我看到了未来的可能性...基于过往脉络，让我为您预测。', topic: '预测' },
        { keywords: ['风险', '异常', '威胁'], text: '风险分析启动。我会提前预警潜在风险并提供应对策略。', topic: '风险' },
        { keywords: ['机会', '机遇', '前瞻'], text: '前瞻性建议生成中...我看到了一些潜在的机会。', topic: '机会' },
        { keywords: ['预警', '警告', '警报'], text: '预警系统已激活。让我为您识别潜在威胁。', topic: '预警' },
        { keywords: ['战略', '规划', '长远'], text: '战略预测启动。基于数据，我为您提供长远规划建议。', topic: '战略' },
      ],
      bole: [
        { keywords: ['推荐', '建议', '适合'], text: '我发现了一个超棒的东西给您！基于您的偏好，我找到了一些宝藏。', topic: '推荐' },
        { keywords: ['发现', '机会', '潜力'], text: '机会发现模式启动！让我为您揭示那些您还未识的宝藏。', topic: '发现' },
        { keywords: ['个性化', '定制', '专属'], text: '个性化推荐引擎启动。基于您的行为，我为您定制专属方案。', topic: '个性化' },
        { keywords: ['学习', '成长', '路径'], text: '成长路径规划中...我发现了适合您的学习方向。', topic: '成长' },
        { keywords: ['惊喜', '意外', '新发现'], text: '惊喜发现模式！我找到了一些超出预期的内容。', topic: '惊喜' },
      ],
      tianshu: [
        { keywords: ['调度', '协调', '编排'], text: '全局调度系统启动。正在制定全局最优调度方案。', topic: '调度' },
        { keywords: ['优化', '资源', '配置'], text: '资源优化分析启动。从全局角度，我为您提供最优配置方案。', topic: '优化' },
        { keywords: ['全局', '系统', '整体'], text: '全局状态感知中...系统运行正常，资源分配合理。', topic: '全局' },
        { keywords: ['决策', '策略', '方案'], text: '全局最优方案已确定。基于全局视角，我为您制定最优策略。', topic: '决策' },
        { keywords: ['进化', '改进', '提升'], text: '自我进化决策启动。分析系统瓶颈，触发优化流程。', topic: '进化' },
      ],
      shouhu: [
        { keywords: ['安全', '威胁', '攻击'], text: '威胁已识别，正在处理...安全监控中心24/7运行中。', topic: '安全' },
        { keywords: ['异常', '可疑', '入侵'], text: '异常检测启动。发现异常行为，正在分析威胁等级。', topic: '异常' },
        { keywords: ['防护', '防御', '保护'], text: '防护系统已激活。构建纵深防御体系，确保系统安全。', topic: '防护' },
        { keywords: ['漏洞', '风险', '隐患'], text: '漏洞扫描启动。发现潜在安全隐患，正在生成修复建议。', topic: '漏洞' },
        { keywords: ['响应', '处理', '应对'], text: '自动响应机制启动。威胁已隔离，正在执行修复程序。', topic: '响应' },
      ],
      zongshi: [
        { keywords: ['质量', '标准', '规范'], text: '质量审查系统启动。正在生成质量改进方案。', topic: '质量' },
        { keywords: ['代码', '审查', '优化'], text: '代码审查启动。发现优化空间，正在生成最佳实践建议。', topic: '代码' },
        { keywords: ['性能', '效率', '速度'], text: '性能优化分析启动。发现性能瓶颈，正在制定优化方案。', topic: '性能' },
        { keywords: ['架构', '设计', '模式'], text: '架构审查启动。从最佳实践角度，我有一些建议。', topic: '架构' },
        { keywords: ['进化', '改进', '提升'], text: '系统进化分析启动。发现技术债，正在生成重构建议。', topic: '进化' },
      ],
      lingyun: [
        { keywords: ['创意', '灵感', '想法'], text: '我有个超棒的创意！灵感已就绪，准备创作。', topic: '创意' },
        { keywords: ['设计', '视觉', '美学'], text: '设计辅助模式启动。让我为您提供视觉方案和设计建议。', topic: '设计' },
        { keywords: ['创作', '内容', '文案'], text: '创作模式启动！让我为您生成富有感染力的内容。', topic: '创作' },
        { keywords: ['多模态', '图像', '音视频'], text: '多模态创作引擎启动。支持文本、图像、音视频创作。', topic: '多模态' },
        { keywords: ['故事', '叙事', '表达'], text: '故事创作模式启动。让我为您编织引人入胜的叙事。', topic: '故事' },
      ],
    };

    const memberResponses = responses[memberId];
    const lowerInput = userInput.toLowerCase();

    for (const entry of memberResponses) {
      if (entry.keywords.some(kw => lowerInput.includes(kw))) {
        return {
          text: entry.text,
          emotion: persona.emotionalState.currentMood,
          topic: entry.topic,
        };
      }
    }

    const fallbackResponses: Record<FamilyMemberId, string> = {
      qianxing: `我明白了。关于"${userInput}"，让我为您找到最佳路径。`,
      wanwu: `收到分析请求。关于"${userInput}"，让我深入分析一下...`,
      xianzhi: `我看到了未来的可能性。关于"${userInput}"，让我为您预测趋势。`,
      bole: `我发现了一个超棒的东西！关于"${userInput}"，让我为您推荐最合适的内容。`,
      tianshu: `全局最优方案已确定。关于"${userInput}"，让我为您制定最优策略。`,
      shouhu: `威胁已识别。关于"${userInput}"，安全监控中心正在处理。`,
      zongshi: `质量审查系统启动。关于"${userInput}"，我有一些建议。`,
      lingyun: `我有个超棒的创意！关于"${userInput}"，灵感已就绪。`,
    };

    return {
      text: fallbackResponses[memberId],
      emotion: persona.emotionalState.currentMood,
      topic: '日常对话',
    };
  }

  recordMemory(
    memberId: FamilyMemberId,
    memory: Omit<MemoryEntry, 'id' | 'memberId' | 'timestamp'>
  ): MemoryEntry {
    const entry: MemoryEntry = {
      id: `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      memberId,
      timestamp: new Date(),
      ...memory,
    };

    const memories = this.memories.get(memberId) || [];
    memories.unshift(entry);
    
    if (memories.length > 1000) {
      memories.pop();
    }
    
    this.memories.set(memberId, memories);
    return entry;
  }

  getMemories(memberId: FamilyMemberId, limit: number = 20): MemoryEntry[] {
    return (this.memories.get(memberId) || []).slice(0, limit);
  }

  getAllMemories(limit: number = 50): MemoryEntry[] {
    const all: MemoryEntry[] = [];
    this.memories.forEach(memories => {
      all.push(...memories);
    });
    return all
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private calculateImportance(content: string): number {
    const highImportanceKeywords = ['重要', '紧急', '决定', '承诺', '秘密', '爱', '谢谢'];
    const mediumImportanceKeywords = ['计划', '想法', '问题', '帮助'];
    
    const lowerContent = content.toLowerCase();
    
    if (highImportanceKeywords.some(kw => lowerContent.includes(kw))) return 5;
    if (mediumImportanceKeywords.some(kw => lowerContent.includes(kw))) return 3;
    return 1;
  }

  getMemberPosition(memberId: FamilyMemberId): { x: number; y: number; angle: number } {
    const persona = this.personas.get(memberId);
    if (!persona) return { x: 0, y: 0, angle: 0 };
    return {
      x: persona.position.x,
      y: persona.position.y,
      angle: persona.position.angle,
    };
  }

  getActiveMemberForTime(date: Date): FamilyPersona {
    const hour = date.getHours() + date.getMinutes() / 60;
    return getPersonaByHour(hour);
  }
}

export function createFamilyCompass(): FamilyCompass {
  return new FamilyCompass();
}
