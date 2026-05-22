/**
 * file skills.test.ts
 * description @yyc3/ai-hub skills.ts 单元测试
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[ai],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub skills.ts 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillManager } from '../../src/skills.js';
import type { SkillDefinition } from '../../src/types.js';

describe('SkillManager', () => {
  let skillManager: SkillManager;

  beforeEach(() => {
    skillManager = new SkillManager();
  });

  describe('constructor', () => {
    it('should instantiate without error', () => {
      expect(skillManager).toBeDefined();
    });
    it('should start empty', () => {
      expect(skillManager.list()).toHaveLength(0);
      expect(skillManager.count()).toBe(0);
    });
  });

  describe('register', () => {
    const testSkill: SkillDefinition = {
      id: 'test-skill',
      name: 'Test Skill',
      description: 'A test skill',
      trigger: 'test',
      prompt: 'You are a test skill.',
    };

    it('should register a new skill', () => {
      skillManager.register(testSkill);
      expect(skillManager.count()).toBe(1);
      expect(skillManager.list()).toContain('test-skill');
    });

    it('should get registered skill by id', () => {
      skillManager.register(testSkill);
      const skill = skillManager.get('test-skill');
      expect(skill?.id).toBe('test-skill');
      expect(skill?.definition.name).toBe('Test Skill');
    });

    it('should overwrite existing skill with same id', () => {
      skillManager.register(testSkill);
      skillManager.register({ ...testSkill, name: 'Updated Skill' });
      expect(skillManager.count()).toBe(1);
      expect(skillManager.get('test-skill')?.definition.name).toBe('Updated Skill');
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent skill', () => {
      expect(skillManager.get('non-existent')).toBeUndefined();
    });
  });

  describe('matches - string trigger (includes)', () => {
    it('should match when input contains trigger string exactly', () => {
      skillManager.register({
        id: 'code-review',
        name: 'Code Review',
        description: '',
        trigger: 'review code',
        prompt: '',
      });
      const skill = skillManager.get('code-review')!;
      // input.includes(trigger) - exact substring match
      expect(skill.matches('Please review code this')).toBe(true);
      expect(skill.matches('Write some code')).toBe(false);
    });

    it('should be case-sensitive for string triggers', () => {
      skillManager.register({
        id: 'case-test',
        name: 'Case Test',
        description: '',
        trigger: 'Hello',
        prompt: '',
      });
      const skill = skillManager.get('case-test')!;
      expect(skill.matches('Say Hello')).toBe(true);
      expect(skill.matches('say hello')).toBe(false);
    });
  });

  describe('matches - regex trigger', () => {
    it('should match regex pattern with flags', () => {
      skillManager.register({
        id: 'regex-test',
        name: 'Regex Test',
        description: '',
        trigger: /bug|error|issue/i,
        prompt: '',
      });
      const skill = skillManager.get('regex-test')!;
      expect(skill.matches('There is a bug')).toBe(true);
      expect(skill.matches('Found an ERROR')).toBe(true);
      expect(skill.matches('No issues here')).toBe(true);
      expect(skill.matches('All good')).toBe(false);
    });
  });

  describe('apply', () => {
    it('should return prompt with context', async () => {
      skillManager.register({
        id: 'apply-test',
        name: 'Apply Test',
        description: '',
        trigger: 'test',
        prompt: 'Analyze this:',
      });
      const skill = skillManager.get('apply-test')!;
      const result = await skill.apply('Some context text');
      expect(result).toContain('Analyze this:');
      expect(result).toContain('Some context text');
    });
  });

  describe('findMatching', () => {
    beforeEach(() => {
      skillManager.register({ id: 's1', name: 'S1', description: '', trigger: 'code', prompt: '' });
      skillManager.register({ id: 's2', name: 'S2', description: '', trigger: /bug|fix/i, prompt: '' });
      skillManager.register({ id: 's3', name: 'S3', description: '', trigger: 'design', prompt: '' });
    });

    it('should find matching skills for input', () => {
      const matches = skillManager.findMatching('Fix the code bug');
      expect(matches.length).toBeGreaterThanOrEqual(1);
      const ids = matches.map(s => s.id);
      expect(ids).toContain('s1'); // contains "code"
      expect(ids).toContain('s2'); // matches /bug|fix/i
    });

    it('should return empty array when no matches', () => {
      const matches = skillManager.findMatching('Just a random sentence');
      expect(matches).toHaveLength(0);
    });
  });

  describe('parseSkillMarkdown (private method)', () => {
    it('should parse SKILL markdown format with all fields', () => {
      const mdContent = `## Code Review Skill\n**描述**: Review code quality\n**触发**: review code\n\nThis is the full prompt content.`;
      const parsed = (skillManager as any).parseSkillMarkdown(mdContent);
      
      expect(parsed).not.toBeNull();
      expect(parsed!.id).toBe('code-review-skill');
      expect(parsed!.name).toBe('Code Review Skill');
      expect(parsed!.description).toBe('Review code quality');
      expect(parsed!.trigger).toBe('review code');
      expect(parsed!.prompt).toContain('This is the full prompt content');
    });

    it('should return null for invalid markdown without heading', () => {
      const parsed = (skillManager as any).parseSkillMarkdown('No heading here');
      expect(parsed).toBeNull();
    });

    it('should handle missing optional fields gracefully', () => {
      const mdContent = `## Simple Skill\nNo description or trigger here.`;
      const parsed = (skillManager as any).parseSkillMarkdown(mdContent);
      
      expect(parsed).not.toBeNull();
      expect(parsed!.description).toBe('');
      expect(parsed!.trigger).toBe('');
    });
  });
});
