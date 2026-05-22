import {
  AgentRole,
  AgentCapability,
  TaskPriority,
  CollaborationMode,
  AIFamilyTask,
  AgentDefinition,
} from '@/lib/ai-family/types';
import { AI_FAMILY_AGENTS } from '@/lib/ai-family/definitions';

describe('AI Family Types', () => {
  describe('AgentRole Enum', () => {
    it('should have all 8 agent roles defined', () => {
      expect(Object.keys(AgentRole).length).toBe(8);
      expect(AgentRole.MASTER).toBe('master');
      expect(AgentRole.SENTINEL).toBe('sentinel');
      expect(AgentRole.QUALITY).toBe('quality');
      expect(AgentRole.CREATIVE).toBe('creative');
      expect(AgentRole.NAVIGATOR).toBe('navigator');
      expect(AgentRole.THINKER).toBe('thinker');
      expect(AgentRole.PROPHET).toBe('prophet');
      expect(AgentRole.RECOMMENDER).toBe('recommender');
    });
  });

  describe('TaskPriority Enum', () => {
    it('should have correct priority levels', () => {
      expect(TaskPriority.CRITICAL).toBe('critical');
      expect(TaskPriority.HIGH).toBe('high');
      expect(TaskPriority.NORMAL).toBe('normal');
      expect(TaskPriority.LOW).toBe('low');
    });
  });

  describe('CollaborationMode Enum', () => {
    it('should have all collaboration modes', () => {
      expect(Object.keys(CollaborationMode).length).toBe(4);
      expect(CollaborationMode.SEQUENTIAL).toBe('sequential');
      expect(CollaborationMode.PARALLEL).toBe('parallel');
      expect(CollaborationMode.HIERARCHICAL).toBe('hierarchical');
      expect(CollaborationMode.CONSENSUS).toBe('consensus');
    });
  });

  describe('AgentDefinition Interface', () => {
    it('should create valid agent definition', () => {
      const definition: AgentDefinition = {
        id: 'test-agent',
        name: 'TestAgent',
        displayName: '测试智能体',
        role: AgentRole.MASTER,
        emoji: '🧪',
        description: 'Test agent for unit testing',
        capabilities: [
          {
            id: 'test-capability',
            name: 'Test Capability',
            description: 'A test capability',
            category: 'execution',
            inputTypes: ['text'],
            outputTypes: ['result'],
            confidence: 0.95,
          },
        ],
        maxConcurrentTasks: 5,
        defaultTimeout: 10000,
        version: '1.0.0',
      };

      expect(definition.id).toBe('test-agent');
      expect(definition.role).toBe(AgentRole.MASTER);
      expect(definition.capabilities.length).toBe(1);
      expect(definition.maxConcurrentTasks).toBe(5);
    });
  });

  describe('AIFamilyTask Interface', () => {
    it('should create valid task with default values', () => {
      const task: AIFamilyTask = {
        id: 'task-1',
        type: 'test-task',
        input: { type: 'text', data: { content: 'test' } },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: TaskPriority.NORMAL,
        retries: 0,
        maxRetries: 3,
      };

      expect(task.id).toBe('task-1');
      expect(task.status).toBe('pending');
      expect(task.retries).toBe(0);
      expect(task.maxRetries).toBe(3);
    });

    it('should support all task statuses', () => {
      const statuses = [
        'pending',
        'assigned',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ] as const;

      statuses.forEach((status) => {
        const task: Partial<AIFamilyTask> = { status };
        expect(task.status).toBeDefined();
      });
    });
  });
});

describe('AI Family Definitions', () => {
  describe('AI_FAMILY_AGENTS Registry', () => {
    it('should have exactly 8 agents registered', () => {
      expect(Object.keys(AI_FAMILY_AGENTS).length).toBe(8);
    });

    it('should have MetaOracle as master agent', () => {
      const metaOracle = AI_FAMILY_AGENTS['meta-oracle'];
      expect(metaOracle).toBeDefined();
      expect(metaOracle.role).toBe(AgentRole.MASTER);
      expect(metaOracle.id).toBe('meta-oracle');
      expect(metaOracle.name).toBe('MetaOracle');
      expect(metaOracle.displayName).toContain('元启');
    });

    it('should have CloudGuardian as sentinel agent', () => {
      const cloudGuardian = AI_FAMILY_AGENTS['cloud-guardian'];
      expect(cloudGuardian).toBeDefined();
      expect(cloudGuardian.role).toBe(AgentRole.SENTINEL);
      expect(cloudGuardian.displayName).toContain('智云');
    });

    it('all agents should have required properties', () => {
      Object.values(AI_FAMILY_AGENTS).forEach((agent) => {
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.displayName).toBeDefined();
        expect(agent.role).toBeDefined();
        expect(agent.emoji).toBeDefined();
        expect(agent.description).toBeDefined();
        expect(agent.capabilities).toBeDefined();
        expect(Array.isArray(agent.capabilities)).toBe(true);
        expect(agent.capabilities.length).toBeGreaterThan(0);
        expect(agent.maxConcurrentTasks).toBeGreaterThan(0);
        expect(agent.defaultTimeout).toBeGreaterThan(0);
        expect(agent.version).toBeDefined();
      });
    });

    it('all agents should have valid capabilities', () => {
      Object.values(AI_FAMILY_AGENTS).forEach((agent) => {
        agent.capabilities.forEach((cap) => {
          expect(cap.id).toBeDefined();
          expect(cap.name).toBeDefined();
          expect(cap.category).toBeDefined();
          expect(cap.confidence).toBeGreaterThanOrEqual(0);
          expect(cap.confidence).toBeLessThanOrEqual(1);
        });
      });
    });

    it('master agent should have valid maxConcurrentTasks', () => {
      const metaOracle = AI_FAMILY_AGENTS['meta-oracle'];
      expect(metaOracle.maxConcurrentTasks).toBeGreaterThan(0);
      expect(typeof metaOracle.maxConcurrentTasks).toBe('number');
    });
  });

  describe('Agent Role Distribution', () => {
    it('should have one agent per unique role', () => {
      const roles = Object.values(AI_FAMILY_AGENTS).map((a) => a.role);
      const uniqueRoles = new Set(roles);

      expect(uniqueRoles.size).toBe(roles.length);
    });

    it('should cover all 8 roles', () => {
      const roles = Object.values(AI_FAMILY_AGENTS).map((a) => a.role);
      const expectedRoles = Object.values(AgentRole);

      expectedRoles.forEach((role) => {
        expect(roles).toContain(role);
      });
    });
  });
});
