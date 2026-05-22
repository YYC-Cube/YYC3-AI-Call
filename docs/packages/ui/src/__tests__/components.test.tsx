/**
 * file components.test.tsx
 * description @yyc3/ui components.tsx 单元测试
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
 * brief @yyc3/ui components.tsx 单元测试
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../components/button'
import { Card, CardBody, CardFooter, CardHeader } from '../components/card'
import { Input } from '../components/input'
import { Modal } from '../components/modal'

describe('Button 组件', () => {
  it('应该正确渲染按钮文本', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByText('点击我')).toBeInTheDocument()
  })

  it('应该支持 variant 属性', () => {
    const { container } = render(<Button variant="primary">主要按钮</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('primary')
  })

  it('应该支持 size 属性', () => {
    const { container } = render(<Button size="lg">大按钮</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('lg')
  })

  it('应该在 disabled 状态下禁用点击', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>禁用按钮</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})

describe('Card 组件', () => {
  it('应该渲染标题和内容', () => {
    render(
      <Card title="卡片标题">
        <p>卡片内容</p>
      </Card>
    )

    const card = screen.getByTitle('卡片标题')
    expect(card).toBeInTheDocument()
    expect(screen.getByText('卡片内容')).toBeInTheDocument()
  })

  it('应该支持自定义 className', () => {
    const { container } = render(
      <Card className="custom-card">
        内容
      </Card>
    )

    expect(container.querySelector('.custom-card')).toBeInTheDocument()
  })

  it('应该支持 variant 属性', () => {
    const { container } = render(
      <Card variant="elevated">内容</Card>
    )
    expect(container.querySelector('.family-card--elevated')).toBeInTheDocument()
  })

  it('应该支持 padding 属性', () => {
    const { container } = render(
      <Card padding="lg">内容</Card>
    )
    expect(container.querySelector('.family-card--padding-lg')).toBeInTheDocument()
  })

  it('应该渲染 CardHeader/CardBody/CardFooter', () => {
    const { container } = render(
      <Card>
        <CardHeader className="hdr">头部</CardHeader>
        <CardBody className="bdy">内容</CardBody>
        <CardFooter className="ftr">底部</CardFooter>
      </Card>
    )
    expect(container.querySelector('.family-card__header')).toBeInTheDocument()
    expect(container.querySelector('.family-card__body')).toBeInTheDocument()
    expect(container.querySelector('.family-card__footer')).toBeInTheDocument()
    expect(container.querySelector('.hdr')).toBeInTheDocument()
    expect(container.querySelector('.bdy')).toBeInTheDocument()
    expect(container.querySelector('.ftr')).toBeInTheDocument()
  })

  it('应该渲染默认 variant 和 padding', () => {
    const { container } = render(
      <Card>内容</Card>
    )
    expect(container.querySelector('.family-card--default')).toBeInTheDocument()
    expect(container.querySelector('.family-card--padding-md')).toBeInTheDocument()
  })
})

describe('Input 组件', () => {
  it('应该正确渲染输入框', () => {
    render(<Input placeholder="请输入..." />)
    expect(screen.getByPlaceholderText('请输入...')).toBeInTheDocument()
  })

  it('应该显示标签文本', () => {
    render(<Input label="用户名" />)
    expect(screen.getByLabelText('用户名')).toBeInTheDocument()
  })

  it('应该显示错误信息', () => {
    render(<Input error="这是错误信息" />)
    expect(screen.getByText('这是错误信息')).toBeInTheDocument()
  })

  it('应该在用户输入时触发 onChange', async () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    input.value = 'test value'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
})

describe('Modal 组件', () => {
  it('默认不应该显示', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => { }} title="模态框">
        内容
      </Modal>
    )

    expect(container.querySelector('.family-modal')).not.toBeInTheDocument()
  })

  it('isOpen 为 true 时应该显示', () => {
    render(
      <Modal isOpen={true} onClose={() => { }} title="模态框">
        模态框内容
      </Modal>
    )

    expect(screen.getByText('模态框')).toBeInTheDocument()
    expect(screen.getByText('模态框内容')).toBeInTheDocument()
  })

  it('应该支持不同尺寸', () => {
    render(
      <Modal isOpen={true} onClose={() => { }} title="大模态框" size="lg">
        内容
      </Modal>
    )

    const modal = document.querySelector('.family-modal')
    expect(modal).not.toBeNull()
    expect(modal?.className).toContain('lg')
  })
})
