import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  classNames,
  formatBytes,
  formatDate,
  sleep,
  debounce,
  throttle,
} from '../core/utils'

describe('classNames', () => {
  it('should merge multiple class names', () => {
    expect(classNames('a', 'b', 'c')).toBe('a b c')
  })

  it('should filter falsy values', () => {
    expect(classNames('a', '', null, undefined, false, 0, 'b')).toBe('a b')
  })

  it('should return empty string for no arguments', () => {
    expect(classNames()).toBe('')
  })

  it('should handle single class', () => {
    expect(classNames('single')).toBe('single')
  })
})

describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('should format bytes', () => {
    expect(formatBytes(500)).toBe('500 Bytes')
  })

  it('should format KB', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('should format MB', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })

  it('should format GB', () => {
    expect(formatBytes(1073741824)).toBe('1 GB')
  })

  it('should respect decimals parameter', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB')
    expect(formatBytes(1536, 3)).toBe('1.5 KB')
  })

  it('should handle negative decimals as 0', () => {
    const result = formatBytes(1536, -1)
    expect(result).toBe('2 KB')
  })

  it('should format TB', () => {
    expect(formatBytes(1099511627776)).toBe('1 TB')
  })
})

describe('formatDate', () => {
  it('should format Date object', () => {
    const result = formatDate(new Date('2024-06-15T12:00:00'))
    expect(result).toContain('2024')
  })

  it('should format string date', () => {
    const result = formatDate('2024-06-15')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should format timestamp number', () => {
    const result = formatDate(1718409600000)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('sleep', () => {
  it('should resolve after specified ms', async () => {
    vi.useFakeTimers()
    const promise = sleep(1000)
    vi.advanceTimersByTime(1000)
    await expect(promise).resolves.toBeUndefined()
    vi.useRealTimers()
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should delay function execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced('a')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('should only execute once for rapid calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced('a')
    debounced('b')
    debounced('c')

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should execute immediately on first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 300)

    throttled('a')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('should not execute again within throttle period', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 300)

    throttled('a')
    throttled('b')
    throttled('c')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should execute again after throttle period', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 300)

    throttled('a')
    vi.advanceTimersByTime(300)
    throttled('b')

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'a')
    expect(fn).toHaveBeenNthCalledWith(2, 'b')
  })
})
