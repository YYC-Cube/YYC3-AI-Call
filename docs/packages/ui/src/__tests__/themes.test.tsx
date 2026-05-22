import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { darkTheme } from '../themes/dark-theme'
import { lightTheme } from '../themes/light-theme'
import { ThemeProvider, useTheme } from '../themes/theme-provider'
import { themeTokens } from '../themes/theme-tokens'

describe('ThemeProvider', () => {
  it('should provide light theme by default', () => {
    const TestConsumer = () => {
      const { theme } = useTheme()
      return <div data-testid="theme-name">{theme.name}</div>
    }

    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme-name')).toHaveTextContent(lightTheme.name)
  })

  it('should provide dark theme when defaultMode is dark', () => {
    const TestConsumer = () => {
      const { theme } = useTheme()
      return <div data-testid="theme-name">{theme.name}</div>
    }

    render(
      <ThemeProvider defaultMode="dark">
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme-name')).toHaveTextContent(darkTheme.name)
  })

  it('should allow switching mode', () => {
    const TestConsumer = () => {
      const { mode, setMode } = useTheme()
      return (
        <div>
          <span data-testid="mode">{mode}</span>
          <button data-testid="toggle" onClick={() => setMode('dark')}>
            Toggle
          </button>
        </div>
      )
    }

    render(
      <ThemeProvider defaultMode="light">
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('light')

    act(() => {
      screen.getByTestId('toggle').click()
    })

    expect(screen.getByTestId('mode')).toHaveTextContent('dark')
  })

  it('should throw when useTheme called outside provider', () => {
    const TestConsumer = () => {
      useTheme()
      return null
    }

    const consoleError = console.error
    console.error = vi.fn()

    expect(() => render(<TestConsumer />)).toThrow(
      'useTheme must be used within ThemeProvider'
    )

    console.error = consoleError
  })

  it('should set CSS custom properties on document root', () => {
    const TestConsumer = () => {
      const { theme } = useTheme()
      return <div data-testid="check">{theme.colors.primary}</div>
    }

    render(
      <ThemeProvider defaultMode="light">
        <TestConsumer />
      </ThemeProvider>
    )

    const root = document.documentElement
    expect(root.style.getPropertyValue('--family-color-primary')).toBeTruthy()
  })
})

describe('lightTheme', () => {
  it('should have all required color properties', () => {
    const requiredKeys = [
      'primary', 'secondary', 'background', 'surface',
      'text', 'textSecondary', 'border',
      'error', 'success', 'warning',
    ]
    requiredKeys.forEach(key => {
      expect(lightTheme.colors[key as keyof typeof lightTheme.colors]).toBeDefined()
    })
  })

  it('should have a name property', () => {
    expect(lightTheme.name).toBeDefined()
    expect(typeof lightTheme.name).toBe('string')
  })
})

describe('darkTheme', () => {
  it('should have all required color properties', () => {
    const requiredKeys = [
      'primary', 'secondary', 'background', 'surface',
      'text', 'textSecondary', 'border',
      'error', 'success', 'warning',
    ]
    requiredKeys.forEach(key => {
      expect(darkTheme.colors[key as keyof typeof darkTheme.colors]).toBeDefined()
    })
  })

  it('should have a name property', () => {
    expect(darkTheme.name).toBeDefined()
    expect(typeof darkTheme.name).toBe('string')
  })
})

describe('themeTokens', () => {
  it('should have spacing tokens', () => {
    expect(themeTokens.spacing).toBeDefined()
    expect(themeTokens.spacing.xs).toBe('0.25rem')
    expect(themeTokens.spacing.xl).toBe('2rem')
  })

  it('should have borderRadius tokens', () => {
    expect(themeTokens.borderRadius).toBeDefined()
    expect(themeTokens.borderRadius.full).toBe('9999px')
  })

  it('should have fontSize tokens', () => {
    expect(themeTokens.fontSize).toBeDefined()
    expect(themeTokens.fontSize.xs).toBe('0.75rem')
  })

  it('should have fontWeight tokens', () => {
    expect(themeTokens.fontWeight).toBeDefined()
    expect(themeTokens.fontWeight.bold).toBe('700')
  })

  it('should have lineHeight tokens', () => {
    expect(themeTokens.lineHeight).toBeDefined()
  })

  it('should have shadows tokens', () => {
    expect(themeTokens.shadows).toBeDefined()
    expect(themeTokens.shadows.sm).toContain('rgb')
  })

  it('should have transitions tokens', () => {
    expect(themeTokens.transitions).toBeDefined()
    expect(themeTokens.transitions.fast).toBe('150ms')
  })
})
