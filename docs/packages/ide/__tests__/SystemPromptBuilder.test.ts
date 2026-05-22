import { describe, expect, it } from 'vitest'
import { detectIntent, type UserIntent } from '../ai/SystemPromptBuilder'

describe('SystemPromptBuilder', () => {
  describe('detectIntent', () => {
    const cases: Array<{ input: string; expected: UserIntent }> = [
      { input: '创建一个新的登录组件', expected: 'generate' },
      { input: 'generate a new button component', expected: 'generate' },
      { input: '修改这个函数的逻辑', expected: 'modify' },
      { input: 'change the color to blue', expected: 'modify' },
      { input: '修复这个bug，代码报错了', expected: 'fix' },
      { input: 'fix the error in line 10', expected: 'fix' },
      { input: '解释一下这段代码怎么工作', expected: 'explain' },
      { input: 'explain how this code works', expected: 'explain' },
      { input: '重构这个模块的性能', expected: 'refactor' },
      { input: 'refactor the data layer', expected: 'refactor' },
      { input: '生成这个函数的单元测试', expected: 'test' },
      { input: 'write unit tests for this component', expected: 'test' },
      { input: '帮我review一下这个PR', expected: 'review' },
      { input: 'code review for this file', expected: 'review' },
      { input: '今天天气怎么样', expected: 'general' },
      { input: 'hello world', expected: 'general' },
    ]

    for (const { input, expected } of cases) {
      it(`"${input.slice(0, 20)}..." → ${expected}`, () => {
        expect(detectIntent(input)).toBe(expected)
      })
    }

    it('空字符串应该返回 general', () => {
      expect(detectIntent('')).toBe('general')
    })

    it('纯空格应该返回 general', () => {
      expect(detectIntent('   ')).toBe('general')
    })

    it('混合中英文关键词应该匹配', () => {
      expect(detectIntent('请optimize这段code')).toBe('refactor')
    })
  })
})
