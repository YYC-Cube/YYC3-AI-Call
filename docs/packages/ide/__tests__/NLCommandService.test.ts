import { beforeEach, describe, expect, it } from 'vitest'
import { NLCommandService, type CommandTemplate, type NLCommandResult } from '../services/NLCommandService'

describe('NLCommandService', () => {
  let service: NLCommandService

  beforeEach(() => {
    service = new NLCommandService()
  })

  describe('内置模板', () => {
    it('应该加载内置命令模板', () => {
      const templates = service.listTemplates()
      expect(templates.length).toBeGreaterThan(0)
    })

    it('应该包含文件操作模板', () => {
      const templates = service.listTemplates()
      const fileTemplates = templates.filter(t => t.category === 'file')
      expect(fileTemplates.length).toBeGreaterThan(0)
    })

    it('每个模板应该有必需字段', () => {
      const templates = service.listTemplates()
      for (const t of templates) {
        expect(t.id).toBeDefined()
        expect(t.name).toBeDefined()
        expect(t.patterns.length).toBeGreaterThan(0)
        expect(t.template).toBeDefined()
        expect(t.category).toBeDefined()
      }
    })
  })

  describe('命令分类', () => {
    it('应该返回所有分类', () => {
      const categories = service.listCategories()
      expect(categories.length).toBeGreaterThan(0)
    })

    it('每个分类应该有必需字段', () => {
      const categories = service.listCategories()
      for (const c of categories) {
        expect(c.id).toBeDefined()
        expect(c.name).toBeDefined()
        expect(c.icon).toBeDefined()
      }
    })
  })

  describe('getTemplate', () => {
    it('存在的模板应该返回', () => {
      const templates = service.listTemplates()
      if (templates.length > 0) {
        const found = service.getTemplate(templates[0].id)
        expect(found).toBeDefined()
        expect(found!.id).toBe(templates[0].id)
      }
    })

    it('不存在的模板应该返回undefined', () => {
      expect(service.getTemplate('nonexistent-xyz')).toBeUndefined()
    })
  })

  describe('类型验证', () => {
    it('CommandTemplate 应该有正确的结构', () => {
      const template: CommandTemplate = {
        id: 'test-cmd',
        name: '测试命令',
        description: '用于测试',
        patterns: ['测试', 'test'],
        template: 'echo {{message}}',
        params: ['message'],
        category: 'system',
        examples: ['测试消息'],
      }
      expect(template.patterns).toHaveLength(2)
      expect(template.category).toBe('system')
    })

    it('NLCommandResult 应该有正确的结构', () => {
      const success: NLCommandResult = {
        success: true,
        command: 'ls -la',
        explanation: '列出所有文件',
        confidence: 0.9,
      }
      expect(success.success).toBe(true)
      expect(success.command).toBeDefined()
    })

    it('NLCommandResult 失败时应该有error', () => {
      const failure: NLCommandResult = {
        success: false,
        error: '无法识别命令',
      }
      expect(failure.success).toBe(false)
      expect(failure.error).toBeDefined()
    })
  })

  describe('addTemplate', () => {
    it('应该添加自定义模板', () => {
      service.addTemplate({
        id: 'custom-test',
        name: '自定义测试',
        description: '测试添加',
        patterns: ['自定义测试'],
        template: 'echo test',
        params: [],
        category: 'system',
        examples: [],
      })
      const found = service.getTemplate('custom-test')
      expect(found).toBeDefined()
      expect(found!.name).toBe('自定义测试')
    })
  })
})
