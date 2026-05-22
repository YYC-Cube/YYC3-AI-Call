import { describe, it, expect, beforeEach } from 'vitest'
import { useScrollSyncStore } from '../stores/useScrollSyncStore'

describe('useScrollSyncStore', () => {
  beforeEach(() => {
    useScrollSyncStore.getState().clearSource()
  })

  it('初始状态应该为 0', () => {
    expect(useScrollSyncStore.getState().editorScrollRatio).toBe(0)
    expect(useScrollSyncStore.getState().previewScrollRatio).toBe(0)
    expect(useScrollSyncStore.getState().scrollSource).toBeNull()
  })

  it('publishEditorScroll 应该更新编辑器滚动', () => {
    useScrollSyncStore.getState().publishEditorScroll(0.5)
    expect(useScrollSyncStore.getState().editorScrollRatio).toBe(0.5)
    expect(useScrollSyncStore.getState().scrollSource).toBe('editor')
  })

  it('publishPreviewScroll 应该更新预览滚动', () => {
    useScrollSyncStore.getState().publishPreviewScroll(0.3)
    expect(useScrollSyncStore.getState().previewScrollRatio).toBe(0.3)
    expect(useScrollSyncStore.getState().scrollSource).toBe('preview')
  })

  it('clearSource 应该清除滚动源', () => {
    useScrollSyncStore.getState().publishEditorScroll(0.5)
    useScrollSyncStore.getState().clearSource()
    expect(useScrollSyncStore.getState().scrollSource).toBeNull()
  })
})
