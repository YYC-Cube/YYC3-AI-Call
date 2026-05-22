import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkspaceStore } from '../stores/useWorkspaceStore'

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    const { workspaces } = useWorkspaceStore.getState()
    for (const ws of workspaces) {
      useWorkspaceStore.getState().deleteWorkspace(ws.id)
    }
  })

  it('初始状态应该为空', () => {
    const state = useWorkspaceStore.getState()
    expect(state.workspaces).toHaveLength(0)
    expect(state.activeWorkspaceId).toBeNull()
  })

  it('createWorkspace 应该创建工作区', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('测试项目', 'frontend')
    expect(ws).toBeDefined()
    expect(ws.name).toBe('测试项目')
    expect(ws.type).toBe('frontend')
    expect(ws.id).toBeDefined()
    expect(ws.sessionIds).toEqual([])
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(1)
  })

  it('activateWorkspace 应该激活工作区', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('测试', 'frontend')
    useWorkspaceStore.getState().activateWorkspace(ws.id)
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(ws.id)
  })

  it('deleteWorkspace 应该删除工作区', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('测试', 'frontend')
    useWorkspaceStore.getState().deleteWorkspace(ws.id)
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(0)
  })

  it('duplicateWorkspace 应该复制工作区', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('原项目', 'frontend')
    const dup = useWorkspaceStore.getState().duplicateWorkspace(ws.id)
    expect(dup.name).toContain('副本')
    expect(dup.id).not.toBe(ws.id)
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(2)
  })

  it('updateWorkspace 应该更新工作区', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('测试', 'frontend')
    useWorkspaceStore.getState().updateWorkspace(ws.id, { name: '更新后' })
    const updated = useWorkspaceStore.getState().workspaces.find((w: any) => w.id === ws.id)
    expect(updated!.name).toBe('更新后')
  })

  it('exportWorkspace 应该返回 JSON 字符串', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('测试', 'frontend')
    const json = useWorkspaceStore.getState().exportWorkspace(ws.id)
    expect(typeof json).toBe('string')
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('测试')
  })

  it('addSessionToWorkspace 应该添加会话ID', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('测试', 'frontend')
    useWorkspaceStore.getState().addSessionToWorkspace(ws.id, 'session-1')
    const updated = useWorkspaceStore.getState().workspaces.find((w: any) => w.id === ws.id)
    expect(updated!.sessionIds).toContain('session-1')
  })

  it('removeSessionFromWorkspace 应该移除会话ID', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('测试', 'frontend')
    useWorkspaceStore.getState().addSessionToWorkspace(ws.id, 'session-1')
    useWorkspaceStore.getState().removeSessionFromWorkspace(ws.id, 'session-1')
    const updated = useWorkspaceStore.getState().workspaces.find((w: any) => w.id === ws.id)
    expect(updated!.sessionIds).not.toContain('session-1')
  })

  it('getFilteredWorkspaces 应该按类型过滤', () => {
    useWorkspaceStore.getState().createWorkspace('前端', 'frontend')
    useWorkspaceStore.getState().createWorkspace('后端', 'backend')
    useWorkspaceStore.getState().updateFilter({ type: 'frontend' })
    const filtered = useWorkspaceStore.getState().getFilteredWorkspaces()
    expect(filtered).toHaveLength(1)
    expect(filtered[0].type).toBe('frontend')
  })

  it('importWorkspace 应该导入工作区', () => {
    const ws = useWorkspaceStore.getState().createWorkspace('导出', 'frontend')
    const json = useWorkspaceStore.getState().exportWorkspace(ws.id)
    const imported = useWorkspaceStore.getState().importWorkspace(json)
    expect(imported.name).toBe('导出')
    expect(imported.id).not.toBe(ws.id)
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(2)
  })
})
