/**
 * file hub.test.ts
 * description @yyc3/ai-hub hub.ts 单元测试
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub hub.ts 单元测试
 */
import { describe, it, expect } from 'vitest';
import { YYC3AIHub } from '../../src/hub.js';
import {
  FAMILY_PERSONAS,
  getPersona,
  getAllPersonas,
  getPersonaByHour,
  getNextDutyMember,
} from '../../src/family-compass/index.js';

describe('YYC3AIHub', () => {
  it('should instantiate without error', () => {
    const hub = new YYC3AIHub();
    expect(hub).toBeDefined();
  });

  it('should expose agent manager', () => {
    const hub = new YYC3AIHub();
    expect(hub.getAgentManager()).toBeDefined()
  })

  it('should expose skill manager', () => {
    const hub = new YYC3AIHub()
    expect(hub.getSkillManager()).toBeDefined()
  })

  it('should expose MCP manager', () => {
    const hub = new YYC3AIHub()
    expect(hub.getMCPManager()).toBeDefined()
  })

  it('should expose auth', () => {
    const hub = new YYC3AIHub()
    expect(hub.getAuth()).toBeDefined()
  })

  it('should get agents list', () => {
    const hub = new YYC3AIHub()
    const agents = hub.getAgents()
    expect(Array.isArray(agents)).toBe(true)
  })

  it('should get skills list', () => {
    const hub = new YYC3AIHub()
    const skills = hub.getSkills()
    expect(Array.isArray(skills)).toBe(true)
  })

  it('should get MCP servers list', () => {
    const hub = new YYC3AIHub()
    const servers = hub.getMCPServers()
    expect(Array.isArray(servers)).toBe(true)
  })
});

describe('Family Compass - Personas', () => {
  it('FAMILY_PERSONAS should have 8 members', () => {
    const personas = FAMILY_PERSONAS;
    expect(Object.keys(personas)).toHaveLength(8);
  });

  it('getPersona should return a valid persona', () => {
    const qianxing = getPersona('qianxing');
    expect(qianxing).toBeDefined();
    expect(qianxing?.name).toBe('言启·千行');
  });

  it('getAllPersonas should return all 8 members', () => {
    const all = getAllPersonas();
    expect(all).toHaveLength(8);
  });

  it('getPersonaByHour should return a member for any hour (0-23)', () => {
    for (let h = 0; h < 24; h++) {
      const member = getPersonaByHour(h);
      expect(member).toBeDefined();
      expect(member?.id).toBeTruthy();
    }
  });

  it('getNextDutyMember should return next scheduled member', () => {
    const at6 = getNextDutyMember(6);
    const at8 = getNextDutyMember(8);
    expect(at6).toBeDefined();
    expect(at8).toBeDefined();
    if (at6 && at8) {
      expect(at6.id).toBe('wanwu');
      expect(at8.id).toBe('wanwu');
    }
    
    const at9 = getNextDutyMember(9);
    expect(at9?.id).toBe('xianzhi');
    
    const at21 = getNextDutyMember(21);
    expect(at21?.id).toBe('qianxing');
  });
});
