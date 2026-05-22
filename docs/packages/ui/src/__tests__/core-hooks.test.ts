import { act, renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useClickOutside,
  useDebounce,
  useLocalStorage,
  useMediaQuery,
} from '../core/hooks'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    expect(result.current[0]).toBe('initial')
  })

  it('should return stored value if exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    expect(result.current[0]).toBe('stored')
  })

  it('should update stored value on set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated')
  })

  it('should handle function updater', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10))

    act(() => {
      result.current[1]((prev: number) => prev + 5)
    })

    expect(result.current[0]).toBe(15)
  })

  it('should fallback to initial on localStorage error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage error')
    })

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))
    expect(result.current[0]).toBe('fallback')

    vi.restoreAllMocks()
  })
})

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } }
    )

    rerender({ value: 'world', delay: 300 })
    expect(result.current).toBe('hello')

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('world')
  })
})

describe('useClickOutside', () => {
  it('should call handler on outside click', () => {
    const handler = vi.fn()
    renderHook(() => {
      const ref = useRef(document.createElement('div'))
      useClickOutside(ref, handler)
      return ref
    })

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when clicking inside element', () => {
    const handler = vi.fn()
    const innerElement = document.createElement('div')

    renderHook(() => {
      const ref = useRef(innerElement)
      useClickOutside(ref, handler)
      return ref
    })

    innerElement.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true })
    )
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('useMediaQuery', () => {
  it.skip('should return boolean result (jsdom matchMedia limitation)', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(typeof result.current).toBe('boolean')
  })
})
