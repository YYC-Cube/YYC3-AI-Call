import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FamilyProvider, useFamilyConfig } from '../core/context'
import React from 'react'

describe('FamilyProvider', () => {
  it('should render children', () => {
    render(
      <FamilyProvider config={{ theme: 'dark' }}>
        <div data-testid="child">Hello</div>
      </FamilyProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should provide config to children', () => {
    const TestConsumer = () => {
      const config = useFamilyConfig()
      return <div data-testid="theme">{config.theme}</div>
    }

    render(
      <FamilyProvider config={{ theme: 'dark' }}>
        <TestConsumer />
      </FamilyProvider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('should throw when useFamilyConfig called outside provider', () => {
    const TestConsumer = () => {
      useFamilyConfig()
      return null
    }

    const consoleError = console.error
    console.error = vi.fn()

    expect(() => render(<TestConsumer />)).toThrow(
      'useFamilyConfig must be used within FamilyProvider'
    )

    console.error = consoleError
  })

  it('should pass locale config', () => {
    const TestConsumer = () => {
      const config = useFamilyConfig()
      return <div data-testid="locale">{config.locale}</div>
    }

    render(
      <FamilyProvider config={{ locale: 'zh-CN' }}>
        <TestConsumer />
      </FamilyProvider>
    )
    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN')
  })

  it('should pass auth config', () => {
    const TestConsumer = () => {
      const config = useFamilyConfig()
      return (
        <div data-testid="auth">{config.auth ? 'has-auth' : 'no-auth'}</div>
      )
    }

    render(
      <FamilyProvider config={{ auth: { provider: 'openai' } }}>
        <TestConsumer />
      </FamilyProvider>
    )
    expect(screen.getByTestId('auth')).toHaveTextContent('has-auth')
  })
})

import { vi } from 'vitest'
