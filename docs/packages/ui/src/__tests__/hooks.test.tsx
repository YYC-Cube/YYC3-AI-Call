/**
 * file hooks.test.tsx
 * description @yyc3/ui hooks.tsx 单元测试
 * module @yyc3/ui
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.1
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[ui],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ui hooks.tsx 单元测试
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme, ThemeProvider } from '../themes/theme-provider'
import { classNames, formatDate, formatBytes } from '../core/utils'

const createThemeWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  )
}

describe('useTheme Hook', () => {
  it('应该返回当前主题', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createThemeWrapper(),
    })

    expect(result.current.theme).toBeDefined()
    expect(result.current.theme.name).toBeDefined()
    expect(result.current.mode).toBeDefined()
  })

  it('应该提供主题切换方法', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createThemeWrapper(),
    })

    expect(typeof result.current.setMode).toBe('function')
    expect(['light', 'dark', 'auto']).toContain(result.current.mode)
  })

  it('切换主题模式应该生效', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createThemeWrapper(),
    })

    const initialMode = result.current.mode

    act(() => {
      result.current.setMode('dark')
    })

    expect(result.current.mode).toBe('dark')
    expect(result.current.mode).not.toBe(initialMode)
  })

  it('应该包含完整的主题颜色配置', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createThemeWrapper(),
    })

    const { colors } = result.current.theme
    
    expect(colors.primary).toBeDefined()
    expect(colors.secondary).toBeDefined()
    expect(colors.background).toBeDefined()
    expect(colors.text).toBeDefined()
    expect(colors.border).toBeDefined()
  })
})

describe('工具函数测试', () => {
  describe('classNames', () => {
    it('应该正确合并类名', () => {
      const result = classNames('base-class', 'active')
      expect(result).toBe('base-class active')
    })

    it('应该过滤 falsy 值', () => {
      const result = classNames('base-class', undefined as unknown as string, null as unknown as string, undefined as unknown as string, 'visible')
      expect(result).toBe('base-class visible')
    })

    it('应该处理空参数', () => {
      const result = classNames()
      expect(result).toBe('')
    })
  })

  describe('formatDate', () => {
    it('格式化日期应该返回字符串', () => {
      const date = new Date('2024-01-01T12:00:00')
      const formatted = formatDate(date)
      expect(typeof formatted).toBe('string')
      expect(formatted).toContain('2024')
      expect(formatted).toContain('01')
      expect(formatted).toContain('01')
    })

    it('应该处理字符串日期', () => {
      const formatted = formatDate('2024-06-15')
      expect(typeof formatted).toBe('string')
    })

    it('应该处理时间戳', () => {
      const formatted = formatDate(1718409600000)
      expect(typeof formatted).toBe('string')
    })
  })

  describe('formatBytes', () => {
    it('应该格式化字节大小', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('应该支持自定义小数位数', () => {
      const result = formatBytes(1536, 0)
      expect(result).toBe('2 KB')
    })
  })
})
