import { describe, it, expect } from 'vitest'
import { isTauriEnvironment, getPlatform, type PlatformType } from '../adapters/TauriBridge'

describe('TauriBridge', () => {
  describe('isTauriEnvironment', () => {
    it('Web 环境应该返回 false', () => {
      expect(isTauriEnvironment()).toBe(false)
    })
  })

  describe('getPlatform', () => {
    it('Web 环境应该返回 web', () => {
      expect(getPlatform()).toBe('web')
    })
  })

  describe('PlatformType 类型', () => {
    it('应该包含所有平台类型', () => {
      const platforms: PlatformType[] = [
        'tauri-windows',
        'tauri-macos',
        'tauri-linux',
        'web',
      ]
      expect(platforms).toHaveLength(4)
    })
  })
})
