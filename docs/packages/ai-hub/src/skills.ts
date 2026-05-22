/**
 * file skills.ts
 * description 技能系统实现
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 技能系统实现
 */
import { SkillDefinition } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

export interface Skill {
  id: string;
  definition: SkillDefinition;
  apply(context: string): Promise<string>;
  matches(input: string): boolean;
}

class SkillImpl implements Skill {
  id: string;

  constructor(public definition: SkillDefinition) {
    this.id = definition.id;
  }

  async apply(context: string): Promise<string> {
    return `${this.definition.prompt}\n\n## Context\n${context}`;
  }

  matches(input: string): boolean {
    if (typeof this.definition.trigger === 'string') {
      return input.includes(this.definition.trigger);
    }
    return this.definition.trigger.test(input);
  }
}

export class SkillManager {
  private skills: Map<string, Skill> = new Map();

  async load(paths: string[]): Promise<void> {
    for (const p of paths) {
      await this.loadFromPath(p);
    }
  }

  private async loadFromPath(p: string): Promise<void> {
    if (!fs.existsSync(p)) {
      console.warn(`Skill路径不存在: ${p}`);
      return;
    }

    const stats = fs.statSync(p);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(p, { recursive: true }) as string[];
      for (const file of files) {
        if (file.endsWith('.md') && file.includes('SKILL')) {
          const content = fs.readFileSync(path.join(p, file), 'utf-8');
          const skill = this.parseSkillMarkdown(content);
          if (skill) {
            this.skills.set(skill.id, new SkillImpl(skill));
          }
        }
      }
    }
  }

  private parseSkillMarkdown(content: string): SkillDefinition | null {
    const idMatch = content.match(/##\s+(.+)/);
    const descMatch = content.match(/\*\*描述\*\*[：:]\s*(.+)/);
    const triggerMatch = content.match(/\*\*触发\*\*[：:]\s*(.+)/);

    if (!idMatch) return null;

    return {
      id: idMatch[1].toLowerCase().replace(/\s+/g, '-'),
      name: idMatch[1],
      description: descMatch?.[1] || '',
      trigger: triggerMatch?.[1] || '',
      prompt: content
    };
  }

  register(definition: SkillDefinition): void {
    this.skills.set(definition.id, new SkillImpl(definition));
  }

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  list(): string[] {
    return Array.from(this.skills.keys());
  }

  findMatching(input: string): Skill[] {
    return Array.from(this.skills.values())
      .filter(skill => skill.matches(input));
  }

  count(): number {
    return this.skills.size;
  }
}
