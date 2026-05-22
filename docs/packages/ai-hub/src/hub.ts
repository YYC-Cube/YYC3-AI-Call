/**
 * file hub.ts
 * description AI Hub 核心实现
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
 * brief AI Hub 核心实现
 */
import { UnifiedAuthManager } from '@yyc3/core/auth';
import { AgentRouter } from './agent-router.js';
import { AgentManager } from './agents.js';
import { YYC3Auth } from './auth.js';
import { YYC3Error, YYC3ErrorCode } from './errors/index.js';
import { logger } from './logger.js';
import { MCPManager } from './mcp.js';
import { SkillManager } from './skills.js';
import { HubConfig, TaskContext, TaskResult } from './types.js';

interface AnalysisContext {
  task: string;
  matchingSkills: string[];
  suggestedAgents: string[];
}

interface ExecutionPlan {
  steps: Array<{
    type: 'analyze' | 'execute' | 'validate';
    context?: AnalysisContext;
    agent?: string;
    skills?: string[];
  }>;
}

export class YYC3AIHub {
  private coreAuth: UnifiedAuthManager;
  private auth: YYC3Auth;
  private agents: AgentManager;
  private skills: SkillManager;
  private mcp: MCPManager;
  private initialized = false;

  constructor(private config: HubConfig = {}) {
    this.coreAuth = new UnifiedAuthManager({
      preferLocal: false,
      autoDetect: true,
      openai: config.apiKey ? { apiKey: config.apiKey } : undefined,
      anthropic: config.anthropicApiKey ? { apiKey: config.anthropicApiKey } : undefined,
    })
    this.auth = new YYC3Auth(config);
    this.agents = new AgentManager(this.auth);
    this.skills = new SkillManager();
    this.mcp = new MCPManager();
  }

  async initialize(): Promise<void> {
    logger.init('YYC³ AI Hub 初始化中...');

    logger.step(1, '认证初始化 (core UnifiedAuthManager)');
    const providers = await this.coreAuth.autoDetect()
    logger.stat('Core Providers', String(providers.length))

    logger.step(2, '认证初始化 (hub auth)');
    await this.auth.initialize();

    logger.step(3, '加载Agents');
    await this.agents.load([
      './agents'
    ]);

    logger.step(4, '加载Skills');
    await this.skills.load([
      './skills'
    ]);

    logger.step(5, '加载MCP服务器');
    await this.mcp.load([
      './config/mcp-servers.json',
      './config/vscode-mcp.json'
    ]);

    this.initialized = true;
    logger.done('YYC³ AI Hub 初始化完成');
    logger.stat('Agents', String(this.agents.count()));
    logger.stat('Skills', String(this.skills.count()));
    logger.stat('MCP Servers', String(this.mcp.count()));
  }

  async execute(task: string, options: TaskContext = { task }): Promise<TaskResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      const context = await this.analyzeContext(task);
      const plan = await this.createPlan(context);
      const output = await this.executePlan(plan, options);

      return {
        success: true,
        output,
        metrics: {
          tokensUsed: 0,
          duration: Date.now() - startTime,
          agentCalls: plan.steps.length
        }
      };
    } catch (error) {
      const yyc3Error = YYC3Error.fromError(error, YYC3ErrorCode.HUB_EXECUTE_FAILED);
      return {
        success: false,
        output: '',
        errors: [yyc3Error.message],
        metrics: {
          tokensUsed: 0,
          duration: Date.now() - startTime,
          agentCalls: 0
        }
      };
    }
  }

  private async analyzeContext(task: string): Promise<AnalysisContext> {
    const matchingSkills = this.skills.findMatching(task);

    return {
      task,
      matchingSkills: matchingSkills.map(s => s.id),
      suggestedAgents: this.suggestAgents(task)
    };
  }

  private suggestAgents(task: string): string[] {
    return AgentRouter.route(task);
  }

  private async createPlan(context: AnalysisContext): Promise<ExecutionPlan> {
    return {
      steps: [
        { type: 'analyze', context },
        { type: 'execute', agent: context.suggestedAgents[0] || 'general' },
        { type: 'validate', skills: context.matchingSkills }
      ]
    };
  }

  private async executePlan(plan: ExecutionPlan, options: TaskContext): Promise<string> {
    const results: string[] = [];

    for (const step of plan.steps) {
      if (step.type === 'execute' && step.agent) {
        const agent = this.agents.get(step.agent);
        if (agent) {
          const result = await agent.execute(options.task, options);
          results.push(result.output);
        }
      }

      if (step.type === 'validate' && step.skills?.length) {
        const skillIds = step.skills;
        for (const skillId of skillIds) {
          const skill = this.skills.get(skillId);
          if (skill) {
            const result = await skill.apply(options.task);
            results.push(`[Skill: ${skillId}] ${result}`);
          }
        }
      }
    }

    return results.join('\n\n');
  }

  getAgents(): string[] {
    return this.agents.list();
  }

  getSkills(): string[] {
    return this.skills.list();
  }

  getMCPServers(): string[] {
    return this.mcp.list();
  }

  getAgentManager(): AgentManager {
    return this.agents;
  }

  getSkillManager(): SkillManager {
    return this.skills;
  }

  getMCPManager(): MCPManager {
    return this.mcp;
  }

  getAuth(): YYC3Auth {
    return this.auth;
  }
}
