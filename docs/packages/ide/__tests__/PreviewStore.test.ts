import { describe, it, expect, beforeEach } from 'vitest'
import { usePreviewStore, DEVICE_PRESETS } from '../stores/usePreviewStore'

describe('usePreviewStore', () => {
  beforeEach(() => {
    usePreviewStore.getState().setMode('realtime')
  })

  it('初始 mode 应该是 realtime', () => {
    expect(usePreviewStore.getState().mode).toBe('realtime')
  })

  it('setMode 应该更新 mode', () => {
    usePreviewStore.getState().setMode('manual')
    expect(usePreviewStore.getState().mode).toBe('manual')
  })

  it('DEVICE_PRESETS 应该包含8个预设', () => {
    expect(DEVICE_PRESETS).toHaveLength(8)
  })

  it('DEVICE_PRESETS 应该包含桌面和移动设备', () => {
    const types = DEVICE_PRESETS.map(p => p.type)
    expect(types).toContain('desktop')
    expect(types).toContain('tablet')
    expect(types).toContain('mobile')
  })

  it('每个预设应该有必需字段', () => {
    for (const p of DEVICE_PRESETS) {
      expect(p.id).toBeDefined()
      expect(p.name).toBeDefined()
      expect(p.width).toBeGreaterThan(0)
      expect(p.height).toBeGreaterThan(0)
    }
  })
})
