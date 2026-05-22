import { beforeEach, describe, expect, it } from 'vitest'
import { useWindowStore } from '../stores/useWindowStore'

describe('useWindowStore', () => {
  beforeEach(() => {
    const state = useWindowStore.getState()
    const windowIds = state.instances.map((i: any) => i.windowId)
    for (const wid of windowIds) {
      state.closeWindow(wid)
    }
  })

  it('createWindow 应该创建窗口实例', () => {
    const inst = useWindowStore.getState().createWindow('editor')
    expect(inst).toBeDefined()
    expect(inst.windowType).toBe('editor')
    expect(inst.windowId).toBeDefined()
  })

  it('第一个窗口应该是 main', () => {
    const inst = useWindowStore.getState().createWindow('editor')
    expect(inst.isMain).toBe(true)
  })

  it('closeWindow 应该关闭窗口', () => {
    const inst = useWindowStore.getState().createWindow('editor')
    const before = useWindowStore.getState().instances.length
    useWindowStore.getState().closeWindow(inst.windowId)
    expect(useWindowStore.getState().instances).toHaveLength(before - 1)
  })

  it('activateWindow 应该激活窗口', () => {
    const inst = useWindowStore.getState().createWindow('editor')
    useWindowStore.getState().activateWindow(inst.windowId)
    expect(useWindowStore.getState().activeInstanceId).toBe(inst.id)
  })

  it('createWindow 应该支持自定义标题', () => {
    const inst = useWindowStore.getState().createWindow('editor', { title: '自定义标题' })
    expect(inst.title).toBe('自定义标题')
  })

  it('minimizeWindow 应该最小化窗口', () => {
    const inst = useWindowStore.getState().createWindow('editor')
    useWindowStore.getState().minimizeWindow(inst.windowId)
    const found = useWindowStore.getState().instances.find((i: any) => i.windowId === inst.windowId)
    expect(found!.isMinimized).toBe(true)
  })

  it('restoreWindow 应该恢复窗口', () => {
    const inst = useWindowStore.getState().createWindow('editor')
    useWindowStore.getState().minimizeWindow(inst.windowId)
    useWindowStore.getState().restoreWindow(inst.windowId)
    const found = useWindowStore.getState().instances.find((i: any) => i.windowId === inst.windowId)
    expect(found!.isMinimized).toBe(false)
  })
})
