import { describe, expect, it } from 'vitest'
import { cn } from '../lib/utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'visible')).toBe('base visible')
  })

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toContain('px-4')
    expect(cn('px-2 py-1', 'px-4')).toContain('py-1')
  })

  it('should handle object-style classes', () => {
    const result = cn({ active: true, disabled: false })
    expect(result).toContain('active')
    expect(result).not.toContain('disabled')
  })
})
