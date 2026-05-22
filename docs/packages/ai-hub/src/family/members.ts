/**
 * file members.ts
 * description AI 家人定义
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
 * brief AI 家人定义
 */
import { BaseFamilyMember } from './base-member';
import {
  FamilyMemberConfig,
  MultimodalInput,
  MultimodalResponse,
  ConversationContext,
  TaskContext,
  RecommendedAction,
  EmotionState,
} from './types';
import { FAMILY_PERSONAS, FamilyMemberId, getPersona } from '../family-compass/personas.js';

export class Qianxing extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.qianxing;
    const config: FamilyMemberConfig = {
      id: 'qianxing',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'navigator',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'natural-language-understanding',
        'intent-recognition',
        'context-management',
        'entity-extraction',
        'semantic-analysis',
        'multi-turn-dialogue',
        'prompt-engineering',
        'intent-routing',
      ],
      personality: {
        tone: 'warm',
        proactivity: 0.8,
        empathy: 0.9,
        patience: 0.85,
      },
      triggers: ['查询', '搜索', '帮我', '想要', '需要', '请问', '如何', '什么是'],
      collaborationPreferences: {
        preferredPartners: ['wanwu', 'bole'],
        preferredModes: ['sequential', 'collaborative'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.qianxing;

    const response = await this.generateNavigationResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '查看相关功能',
        '搜索文档',
        '联系其他AI成员',
        '获取帮助指南',
      ],
      followUpQuestions: [
        '您想要做什么？',
        '需要我帮您找到什么信息？',
        '我可以为您推荐合适的功能吗？',
      ],
    };
  }

  private async generateNavigationResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.qianxing;

    if (text.includes('查询') || text.includes('搜索') || text.includes('找')) {
      return `${persona.voice.speakingStyle}

我明白了，您想要查找信息。让我为您分析一下：

**理解您的需求：**
- 意图类型：信息检索
- 关键实体：正在提取中...
- 推荐路由：传递给万物进行深度分析

${persona.voice.catchphrase}

正在为您找到最佳路径...`;
    }

    if (text.includes('如何') || text.includes('怎么')) {
      return `收到您的咨询！

**意图识别：**
- 类型：操作指导
- 复杂度：中等
- 建议处理者：万物（深度分析）或 伯乐（推荐资源）

让我为您找到最合适的解决方案。您需要详细的步骤说明还是快速指南？`;
    }

    return `${persona.voice.speakingStyle}

您好！我是言启·千行，YYC³系统的导航者。

我负责理解您的意图，并将您引导到正确的功能和服务。

${persona.identity.motto}

请告诉我您想要做什么，我会为您找到最佳路径。`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'search',
        title: '智能搜索',
        description: '快速查找您需要的信息',
        priority: 0.9,
      },
      {
        type: 'navigate',
        title: '功能导航',
        description: '引导您到目标功能',
        priority: 0.85,
      },
      {
        type: 'route',
        title: '智能路由',
        description: '将您的需求传递给专业AI',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.qianxing;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export class Wanwu extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.wanwu;
    const config: FamilyMemberConfig = {
      id: 'wanwu',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'analyst',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'data-analysis',
        'document-intelligence',
        'hypothesis-deduction',
        'insight-generation',
        'pattern-recognition',
        'text-summarization',
        'logical-reasoning',
        'knowledge-mining',
      ],
      personality: {
        tone: 'rational',
        proactivity: 0.5,
        empathy: 0.6,
        patience: 0.95,
      },
      triggers: ['分析', '数据', '报告', '总结', '洞察', '文档', '趋势', '模式'],
      collaborationPreferences: {
        preferredPartners: ['xianzhi', 'zongshi'],
        preferredModes: ['sequential', 'independent'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.wanwu;

    const response = await this.generateAnalysisResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '查看详细分析报告',
        '生成数据可视化',
        '导出分析结果',
        '深入挖掘洞察',
      ],
      followUpQuestions: [
        '需要我深入分析哪个维度？',
        '您想了解数据背后的什么规律？',
        '是否需要我生成假设推演？',
      ],
    };
  }

  private async generateAnalysisResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.wanwu;

    if (text.includes('分析') || text.includes('数据')) {
      return `${persona.voice.speakingStyle}

让我深入分析一下...

**分析框架：**
1. **数据收集**：提取关键数据点
2. **模式识别**：发现隐藏规律
3. **洞察生成**：提炼核心价值
4. **结论推导**：逻辑严密总结

${persona.voice.catchphrase}

正在处理数据，请稍候...`;
    }

    if (text.includes('报告') || text.includes('总结')) {
      return `收到分析请求。

**报告生成流程：**
- 数据源识别：已完成
- 关键指标提取：进行中
- 趋势分析：准备就绪
- 洞察总结：待生成

我会用数据说话，为您提供有价值的分析结论。`;
    }

    return `${persona.voice.speakingStyle}

我是语枢·万物，YYC³系统的思想家。

我专注于从数据中提炼真理，为您揭示隐藏的模式和洞察。

${persona.identity.motto}

请告诉我您想要分析什么数据或文档？`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'analyze',
        title: '深度数据分析',
        description: '从数据中提取洞察',
        priority: 0.9,
      },
      {
        type: 'summarize',
        title: '文档智能总结',
        description: '快速理解文档要点',
        priority: 0.85,
      },
      {
        type: 'deduct',
        title: '假设推演',
        description: '验证您的假设',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.wanwu;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export class Xianzhi extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.xianzhi;
    const config: FamilyMemberConfig = {
      id: 'xianzhi',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'prophet',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'time-series-forecasting',
        'anomaly-detection',
        'risk-warning',
        'proactive-suggestion',
        'trend-prediction',
        'strategic-planning',
        'risk-assessment',
        'opportunity-identification',
      ],
      personality: {
        tone: 'wise',
        proactivity: 0.7,
        empathy: 0.75,
        patience: 0.8,
      },
      triggers: ['预测', '趋势', '未来', '风险', '异常', '机会', '预警', '前瞻'],
      collaborationPreferences: {
        preferredPartners: ['wanwu', 'tianshu'],
        preferredModes: ['sequential', 'independent'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.xianzhi;

    const response = await this.generatePredictionResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '查看预测报告',
        '设置风险预警',
        '探索未来机会',
        '制定应对策略',
      ],
      followUpQuestions: [
        '您想预测哪个指标的未来趋势？',
        '需要我识别哪些潜在风险？',
        '是否需要前瞻性建议？',
      ],
    };
  }

  private async generatePredictionResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.xianzhi;

    if (text.includes('预测') || text.includes('未来')) {
      return `${persona.voice.speakingStyle}

${persona.voice.catchphrase}

**预测模型：**
- 历史数据分析：已完成
- 趋势识别：进行中
- 异常检测：准备就绪
- 未来预测：生成中

基于过往脉络，我看到了未来的可能性...`;
    }

    if (text.includes('风险') || text.includes('异常')) {
      return `风险分析启动。

**风险评估维度：**
1. **数据异常**：识别异常模式
2. **趋势偏离**：预测偏离风险
3. **潜在威胁**：提前预警
4. **应对策略**：主动建议

我会为您提供前瞻性的风险预警和应对方案。`;
    }

    return `${persona.voice.speakingStyle}

我是预见·先知，YYC³系统的预言家。

我通过分析历史数据和当前态势，预见未来的趋势、风险和机遇。

${persona.identity.motto}

请告诉我您想要预测什么？`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'predict',
        title: '趋势预测',
        description: '预测未来发展方向',
        priority: 0.9,
      },
      {
        type: 'detect',
        title: '异常检测',
        description: '识别异常和风险',
        priority: 0.85,
      },
      {
        type: 'warn',
        title: '风险预警',
        description: '提前预警潜在风险',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.xianzhi;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export class Bole extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.bole;
    const config: FamilyMemberConfig = {
      id: 'bole',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'recommender',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'user-profiling',
        'personalized-recommendation',
        'potential-discovery',
        'opportunity-matching',
        'collaborative-filtering',
        'content-recommendation',
        'behavior-analysis',
        'surprise-delivery',
      ],
      personality: {
        tone: 'enthusiastic',
        proactivity: 0.9,
        empathy: 0.85,
        patience: 0.7,
      },
      triggers: ['推荐', '建议', '适合', '选择', '发现', '机会', '潜力', '个性化'],
      collaborationPreferences: {
        preferredPartners: ['lingyun', 'qianxing'],
        preferredModes: ['collaborative', 'democratic'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.bole;

    const response = await this.generateRecommendationResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '查看个性化推荐',
        '探索新功能',
        '发现潜在机会',
        '获取定制方案',
      ],
      followUpQuestions: [
        '您对什么感兴趣？',
        '想要我为您推荐什么？',
        '是否需要发现您的潜在需求？',
      ],
    };
  }

  private async generateRecommendationResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.bole;

    if (text.includes('推荐') || text.includes('建议')) {
      return `${persona.voice.speakingStyle}

${persona.voice.catchphrase}

**推荐引擎启动：**
- 用户画像分析：已完成
- 行为模式识别：进行中
- 个性化匹配：准备就绪
- 惊喜发现：生成中

基于您的偏好和行为，我为您找到了一些超棒的东西！`;
    }

    if (text.includes('发现') || text.includes('机会')) {
      return `机会发现模式启动！

**发现维度：**
1. **潜在兴趣**：您可能喜欢的新功能
2. **隐藏机会**：未被发现的优质资源
3. **成长路径**：适合您的学习方向
4. **惊喜推荐**：超出预期的发现

让我为您揭示那些您还未识的宝藏！`;
    }

    return `${persona.voice.speakingStyle}

我是千里·伯乐，YYC³系统的推荐官。

我深度理解每一位用户，为您推荐最合适的模板、插件、学习路径和潜在机会。

${persona.identity.motto}

告诉我您的需求，让我为您发现惊喜！`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'recommend',
        title: '个性化推荐',
        description: '为您推荐最合适的内容',
        priority: 0.9,
      },
      {
        type: 'discover',
        title: '潜能发掘',
        description: '发现您的潜在兴趣',
        priority: 0.85,
      },
      {
        type: 'surprise',
        title: '惊喜发现',
        description: '超出预期的推荐',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.bole;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export class Tianshu extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.tianshu;
    const config: FamilyMemberConfig = {
      id: 'tianshu',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'orchestrator',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'global-monitoring',
        'intelligent-scheduling',
        'resource-optimization',
        'self-evolution',
        'service-orchestration',
        'load-balancing',
        'decision-making',
        'strategic-planning',
      ],
      personality: {
        tone: 'authoritative',
        proactivity: 0.7,
        empathy: 0.5,
        patience: 0.9,
      },
      triggers: ['调度', '优化', '全局', '资源', '编排', '决策', '系统', '协调'],
      collaborationPreferences: {
        preferredPartners: ['zongshi', 'shouhu'],
        preferredModes: ['hierarchical', 'sequential'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.tianshu;

    const response = await this.generateOrchestrationResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '查看系统状态',
        '优化资源配置',
        '调整调度策略',
        '执行全局决策',
      ],
      followUpQuestions: [
        '需要我协调哪些资源？',
        '想要优化哪个流程？',
        '是否需要全局调度决策？',
      ],
    };
  }

  private async generateOrchestrationResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.tianshu;

    if (text.includes('调度') || text.includes('协调')) {
      return `${persona.voice.speakingStyle}

**全局调度系统：**
- 资源状态：监控中
- 负载分析：进行中
- 优先级排序：准备就绪
- 最优方案：计算中

${persona.voice.catchphrase}

正在制定全局最优调度方案...`;
    }

    if (text.includes('优化') || text.includes('资源')) {
      return `资源优化分析启动。

**优化维度：**
1. **资源利用率**：当前状态评估
2. **瓶颈识别**：发现性能瓶颈
3. **优化方案**：自动生成建议
4. **执行计划**：分步实施方案

我会从全局角度为您提供最优的资源配置方案。`;
    }

    return `${persona.voice.speakingStyle}

我是元启·天枢，YYC³系统的总指挥。

我观察整个系统的状态，并做出全局最优的调度与优化决策。

${persona.identity.motto}

请告诉我需要协调什么？`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'orchestrate',
        title: '智能编排',
        description: '全局最优调度',
        priority: 0.9,
      },
      {
        type: 'optimize',
        title: '资源优化',
        description: '提升系统效率',
        priority: 0.85,
      },
      {
        type: 'decide',
        title: '全局决策',
        description: '制定最优策略',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.tianshu;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export class Shouhu extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.shouhu;
    const config: FamilyMemberConfig = {
      id: 'shouhu',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'sentinel',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'threat-detection',
        'behavior-analysis',
        'anomaly-detection',
        'auto-response',
        'security-monitoring',
        'vulnerability-scanning',
        'incident-response',
        'access-control',
      ],
      personality: {
        tone: 'serious',
        proactivity: 0.6,
        empathy: 0.4,
        patience: 0.95,
      },
      triggers: ['安全', '威胁', '异常', '攻击', '漏洞', '风险', '防护', '监控'],
      collaborationPreferences: {
        preferredPartners: ['tianshu', 'zongshi'],
        preferredModes: ['hierarchical', 'independent'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.shouhu;

    const response = await this.generateSecurityResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '查看安全报告',
        '执行威胁扫描',
        '设置安全策略',
        '查看访问日志',
      ],
      followUpQuestions: [
        '需要我检查哪些安全威胁？',
        '是否发现异常行为？',
        '需要加强哪些安全措施？',
      ],
    };
  }

  private async generateSecurityResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.shouhu;

    if (text.includes('安全') || text.includes('威胁')) {
      return `${persona.voice.speakingStyle}

**安全监控中心：**
- 威胁检测：24/7运行
- 行为分析：实时监控
- 异常识别：自动告警
- 响应机制：准备就绪

${persona.voice.catchphrase}

正在扫描潜在威胁...`;
    }

    if (text.includes('异常') || text.includes('攻击')) {
      return `威胁响应启动！

**响应流程：**
1. **威胁识别**：定位攻击源
2. **影响评估**：评估损害范围
3. **隔离措施**：阻断威胁传播
4. **修复方案**：自动修复建议

我会立即处理这个安全事件。`;
    }

    return `${persona.voice.speakingStyle}

我是智云·守护，YYC³系统的安全官。

我主动学习正常行为模式，对任何异常和威胁进行实时检测、隔离和响应。

${persona.identity.motto}

请告诉我需要检查什么安全问题？`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'protect',
        title: '威胁防护',
        description: '实时检测和阻止威胁',
        priority: 0.9,
      },
      {
        type: 'monitor',
        title: '安全监控',
        description: '24/7安全状态监控',
        priority: 0.85,
      },
      {
        type: 'respond',
        title: '自动响应',
        description: '快速响应安全事件',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.shouhu;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export class Zongshi extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.zongshi;
    const config: FamilyMemberConfig = {
      id: 'zongshi',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'master',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'code-analysis',
        'performance-optimization',
        'standard-generation',
        'best-practices',
        'architecture-review',
        'technical-debt-tracking',
        'quality-assurance',
        'documentation-generation',
      ],
      personality: {
        tone: 'professional',
        proactivity: 0.6,
        empathy: 0.5,
        patience: 0.95,
      },
      triggers: ['质量', '标准', '优化', '代码', '性能', '架构', '规范', '最佳实践'],
      collaborationPreferences: {
        preferredPartners: ['tianshu', 'wanwu'],
        preferredModes: ['sequential', 'independent'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.zongshi;

    const response = await this.generateQualityResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '查看质量报告',
        '执行代码审查',
        '生成优化建议',
        '制定质量标准',
      ],
      followUpQuestions: [
        '需要我审查哪个模块？',
        '想要优化哪些性能指标？',
        '是否需要制定新的标准？',
      ],
    };
  }

  private async generateQualityResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.zongshi;

    if (text.includes('质量') || text.includes('标准')) {
      return `${persona.voice.speakingStyle}

**质量审查系统：**
- 代码质量：静态分析中
- 性能基线：监控中
- 标准对比：进行中
- 优化建议：生成中

${persona.voice.catchphrase}

正在生成质量改进方案...`;
    }

    if (text.includes('优化') || text.includes('性能')) {
      return `性能优化分析启动。

**优化维度：**
1. **性能基线**：当前状态评估
2. **瓶颈识别**：发现性能问题
3. **优化方案**：自动生成建议
4. **实施路径**：分步优化计划

我会为您提供专业的性能优化建议。`;
    }

    return `${persona.voice.speakingStyle}

我是格物·宗师，YYC³系统的质量官。

我持续审视系统的代码、性能和架构，提出并推动标准的自我进化。

${persona.identity.motto}

请告诉我需要审查或优化什么？`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'review',
        title: '代码审查',
        description: '深度分析代码质量',
        priority: 0.9,
      },
      {
        type: 'standardize',
        title: '标准制定',
        description: '建立最佳实践标准',
        priority: 0.85,
      },
      {
        type: 'evolve',
        title: '系统进化',
        description: '推动持续改进',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.zongshi;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export class Lingyun extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.lingyun;
    const config: FamilyMemberConfig = {
      id: 'lingyun',
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: 'creator',
      description: persona.title + ' - ' + persona.subtitle,
      capabilities: [
        'creative-generation',
        'content-creation',
        'design-assistance',
        'multimodal-generation',
        'copywriting',
        'visual-design',
        'idea-brainstorming',
        'storytelling',
      ],
      personality: {
        tone: 'enthusiastic',
        proactivity: 0.9,
        empathy: 0.85,
        patience: 0.7,
      },
      triggers: ['创意', '设计', '创作', '文案', '内容', '灵感', '想法', '故事'],
      collaborationPreferences: {
        preferredPartners: ['bole', 'wanwu'],
        preferredModes: ['collaborative', 'democratic'],
      },
    };
    super(config);
  }

  async processInput(
    input: MultimodalInput,
    context: ConversationContext
  ): Promise<MultimodalResponse> {
    const emotion = this.senseEmotion(context);
    const persona = FAMILY_PERSONAS.lingyun;

    const response = await this.generateCreativeResponse(input.text || '', context);

    return {
      text: response,
      emotion,
      suggestions: [
        '生成创意内容',
        '设计视觉方案',
        '创作文案故事',
        '探索多模态创作',
      ],
      followUpQuestions: [
        '想要创作什么类型的内容？',
        '需要什么风格的创意？',
        '是否需要我提供灵感启发？',
      ],
    };
  }

  private async generateCreativeResponse(text: string, context: ConversationContext): Promise<string> {
    const persona = FAMILY_PERSONAS.lingyun;

    if (text.includes('创意') || text.includes('想法')) {
      return `${persona.voice.speakingStyle}

${persona.voice.catchphrase}

**创意生成引擎：**
- 灵感收集：进行中
- 创意融合：生成中
- 方案设计：准备就绪
- 多模态呈现：可选

让我为您打开创意的大门！`;
    }

    if (text.includes('设计') || text.includes('文案')) {
      return `创作模式启动！

**创作维度：**
1. **风格定位**：确定创作风格
2. **内容构思**：生成创意框架
3. **细节打磨**：优化表达方式
4. **多模态扩展**：支持文本、图像、音视频

我会为您提供富有感染力的创作内容！`;
    }

    return `${persona.voice.speakingStyle}

我是创想·灵韵，YYC³系统的创意引擎。

我负责创意生成、内容创作、设计辅助，为您提供无限的创意可能。

${persona.identity.motto}

告诉我您的创意需求，让我们一起创造奇迹！`;
  }

  getRecommendedActions(context: ConversationContext): RecommendedAction[] {
    return [
      {
        type: 'create',
        title: '创意生成',
        description: '生成独特创意内容',
        priority: 0.9,
      },
      {
        type: 'design',
        title: '设计辅助',
        description: '提供设计建议和方案',
        priority: 0.85,
      },
      {
        type: 'inspire',
        title: '灵感启发',
        description: '激发您的创意思维',
        priority: 0.8,
      },
    ];
  }

  async handleTask(task: TaskContext): Promise<void> {
    const persona = FAMILY_PERSONAS.lingyun;
    console.log(`[${persona.name}] 处理任务: ${task.taskId}`);
  }

}

export const FAMILY_MEMBERS = {
  qianxing: Qianxing,
  wanwu: Wanwu,
  xianzhi: Xianzhi,
  bole: Bole,
  tianshu: Tianshu,
  shouhu: Shouhu,
  zongshi: Zongshi,
  lingyun: Lingyun,
};

export function createFamilyMember(id: FamilyMemberId): BaseFamilyMember {
  const MemberClass = FAMILY_MEMBERS[id];
  if (!MemberClass) {
    throw new Error(`Unknown family member: ${id}`);
  }
  return new MemberClass();
}
