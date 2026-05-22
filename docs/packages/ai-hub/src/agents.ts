/**
 * file agents.ts
 * description Agent 管理实现
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
 * brief Agent 管理实现
 */
import { AgentDefinition, TaskContext, AgentExecutionResult } from './types.js';
import { YYC3Auth } from './auth.js';
import * as fs from 'fs';
import * as path from 'path';

export interface Agent {
  id: string;
  definition: AgentDefinition;
  execute(task: string, context?: TaskContext): Promise<AgentExecutionResult>;
}

class AgentImpl implements Agent {
  id: string;

  constructor(
    public definition: AgentDefinition,
    private auth: YYC3Auth
  ) {
    this.id = definition.id;
  }

  async execute(task: string, context?: TaskContext): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const provider = this.auth.getProvider();
    const model = this.auth.getModel(this.definition.model);

    try {
      let output = '';

      if (provider.type === 'openai' && provider.client) {
        const response = await provider.client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: this.definition.systemPrompt },
            { role: 'user', content: task }
          ]
        });
        output = response.choices[0]?.message?.content || '';
      }

      if (provider.type === 'ollama' && provider.host) {
        const response = await fetch(`${provider.host}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: this.definition.systemPrompt },
              { role: 'user', content: task }
            ],
            stream: false
          })
        });
        const data = await response.json() as { message?: { content?: string } };
        output = data.message?.content || '';
      }

      if (provider.type === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: this.definition.systemPrompt,
            messages: [{ role: 'user', content: task }]
          })
        });
        const data = await response.json() as { content?: Array<{ text?: string }> };
        output = data.content?.[0]?.text || '';
      }

      return {
        success: true,
        output,
        duration: Date.now() - startTime,
        tokensUsed: output.length
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private auth: YYC3Auth;

  constructor(auth: YYC3Auth) {
    this.auth = auth;
  }

  async load(paths: string[]): Promise<void> {
    for (const p of paths) {
      await this.loadFromPath(p);
    }
  }

  private async loadFromPath(p: string): Promise<void> {
    if (!fs.existsSync(p)) {
      console.warn(`Agent路径不存在: ${p}`);
      return;
    }

    const stats = fs.statSync(p);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(p);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(p, file), 'utf-8');
          const definitions: AgentDefinition[] = JSON.parse(content);
          definitions.forEach(def => {
            this.agents.set(def.id, new AgentImpl(def, this.auth));
          });
        }
      }
    }
  }

  register(definition: AgentDefinition): void {
    this.agents.set(definition.id, new AgentImpl(definition, this.auth));
  }

  get(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  list(): string[] {
    return Array.from(this.agents.keys());
  }

  getByCategory(category: string): Agent[] {
    return Array.from(this.agents.values())
      .filter(a => a.definition.category === category || a.definition.id.startsWith(category));
  }

  count(): number {
    return this.agents.size;
  }
}
