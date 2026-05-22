import { beforeEach, describe, expect, it } from 'vitest'
import { AIAgentWorkflow, type AgentCapability, type WorkflowExecution, type WorkflowStep } from '../services/AIAgentWorkflow'

describe('AIAgentWorkflow', () => {
  let workflow: AIAgentWorkflow

  beforeEach(() => {
    workflow = new AIAgentWorkflow()
  })

  describe('内置Agent', () => {
    it('应该注册5个内置Agent', () => {
      const agents = workflow.listAgents()
      expect(agents.length).toBe(5)
    })

    it('应该包含分析师Agent', () => {
      const agents = workflow.listAgents()
      const analyst = agents.find((a: any) => a.id === 'analyst')
      expect(analyst).toBeDefined()
      expect(analyst!.name).toBe('需求分析师')
    })

    it('应该包含工程师Agent', () => {
      const agents = workflow.listAgents()
      const engineer = agents.find((a: any) => a.id === 'engineer')
      expect(engineer).toBeDefined()
    })

    it('每个Agent应该有描述', () => {
      const agents = workflow.listAgents()
      for (const cap of agents) {
        expect(cap.name).toBeDefined()
        expect(cap.description).toBeDefined()
      }
    })
  })

  describe('createWorkflow', () => {
    it('应该创建工作流', () => {
      const execution = workflow.createWorkflow('实现登录功能', [
        { name: '需求分析', type: 'analyze', agent: 'analyst', input: '分析登录需求' },
        { name: '代码实现', type: 'execute', agent: 'engineer', input: '实现登录组件' },
        { name: '测试验证', type: 'review', agent: 'tester', input: '测试登录功能' },
      ])
      expect(execution).toBeDefined()
      expect(execution.id).toMatch(/^workflow-/)
      expect(execution.status).toBe('pending')
      expect(execution.steps).toHaveLength(3)
    })

    it('步骤应该自动获得pending状态', () => {
      const execution = workflow.createWorkflow('test', [
        { name: 'step1', type: 'analyze', agent: 'analyst', input: 'test' },
      ])
      expect(execution.steps[0].status).toBe('pending')
    })

    it('步骤应该自动获得id', () => {
      const execution = workflow.createWorkflow('test', [
        { name: 'step1', type: 'analyze', agent: 'analyst', input: 'test' },
        { name: 'step2', type: 'execute', agent: 'engineer', input: 'test' },
      ])
      expect(execution.steps[0].id).toBe('step-1')
      expect(execution.steps[1].id).toBe('step-2')
    })
  })

  describe('listExecutions', () => {
    it('初始状态应该为空', () => {
      expect(workflow.listExecutions()).toHaveLength(0)
    })

    it('创建后应该包含工作流', () => {
      workflow.createWorkflow('test', [
        { name: 'step1', type: 'analyze', agent: 'analyst', input: 'test' },
      ])
      expect(workflow.listExecutions()).toHaveLength(1)
    })
  })

  describe('类型验证', () => {
    it('WorkflowStep 应该有正确的结构', () => {
      const step: WorkflowStep = {
        id: 'step-1',
        name: '分析',
        type: 'analyze',
        agent: 'analyst',
        input: 'test input',
        status: 'pending',
      }
      expect(step.type).toBe('analyze')
      expect(step.status).toBe('pending')
    })

    it('WorkflowExecution 应该有正确的结构', () => {
      const exec: WorkflowExecution = {
        id: 'workflow-1',
        name: '测试工作流',
        goal: '完成测试',
        steps: [],
        status: 'pending',
        createdAt: Date.now(),
      }
      expect(exec.goal).toBe('完成测试')
    })

    it('AgentCapability 应该有正确的结构', () => {
      const cap: AgentCapability = {
        name: '测试Agent',
        description: '用于测试',
        tools: ['tool1', 'tool2'],
      }
      expect(cap.tools).toHaveLength(2)
    })
  })
})
