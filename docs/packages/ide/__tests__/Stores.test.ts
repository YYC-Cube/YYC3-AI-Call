import { describe, it, expect, beforeEach } from 'vitest'
import { useAIFixStore } from '../stores/useAIFixStore'

describe('useAIFixStore', () => {
  beforeEach(() => {
    useAIFixStore.getState().clearRequest()
  })

  it('初始状态应该没有挂起请求', () => {
    const state = useAIFixStore.getState()
    expect(state.pendingRequest).toBeNull()
  })

  it('requestFix 应该创建修复请求', () => {
    useAIFixStore.getState().requestFix('修复这个bug', 'src/App.tsx')
    const state = useAIFixStore.getState()
    expect(state.pendingRequest).not.toBeNull()
    expect(state.pendingRequest!.prompt).toBe('修复这个bug')
    expect(state.pendingRequest!.filepath).toBe('src/App.tsx')
    expect(state.pendingRequest!.id).toMatch(/^fix-/)
  })

  it('consumeRequest 应该消费并清除请求', () => {
    useAIFixStore.getState().requestFix('test', 'test.ts')
    const consumed = useAIFixStore.getState().consumeRequest()
    expect(consumed).not.toBeNull()
    expect(consumed!.prompt).toBe('test')
    expect(useAIFixStore.getState().pendingRequest).toBeNull()
  })

  it('consumeRequest 无请求时应该返回null', () => {
    const consumed = useAIFixStore.getState().consumeRequest()
    expect(consumed).toBeNull()
  })

  it('clearRequest 应该清除请求', () => {
    useAIFixStore.getState().requestFix('test', 'test.ts')
    useAIFixStore.getState().clearRequest()
    expect(useAIFixStore.getState().pendingRequest).toBeNull()
  })
})
