import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AgentCard } from '../family/AgentCard'
import { AgentStatus } from '../family/AgentStatus'
import { AIFamilyPanel } from '../family/AIFamilyPanel'
import { FamilyLayout } from '../family/FamilyLayout'

const mockAgent = {
  id: 'test-agent',
  name: 'Test Agent',
  description: 'A test agent',
  systemPrompt: 'You are a test agent',
  model: 'gpt-4' as const,
  emoji: '🤖',
  displayName: 'Test Bot',
  role: 'Testing',
  capabilities: [
    { name: 'Test', description: 'Testing capability' },
    { name: 'Verify', description: 'Verify results' },
    { name: 'Report', description: 'Generate reports' },
  ],
  priority: 1,
  maxConcurrentTasks: 5,
}

describe('AgentCard', () => {
  it('should render agent name', () => {
    render(<AgentCard agent={mockAgent as any} />)
    expect(screen.getByText('Test Bot')).toBeInTheDocument()
  })

  it('should render agent emoji', () => {
    render(<AgentCard agent={mockAgent as any} />)
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('should render agent role', () => {
    render(<AgentCard agent={mockAgent as any} />)
    expect(screen.getByText('Testing')).toBeInTheDocument()
  })

  it('should show capabilities when showCapabilities is true', () => {
    render(<AgentCard agent={mockAgent as any} showCapabilities={true} />)
    expect(screen.getByText('核心能力')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should hide capabilities when showCapabilities is false', () => {
    render(<AgentCard agent={mockAgent as any} showCapabilities={false} />)
    expect(screen.queryByText('核心能力')).not.toBeInTheDocument()
  })

  it('should display priority and maxConcurrentTasks', () => {
    render(<AgentCard agent={mockAgent as any} />)
    expect(screen.getByText(/优先级: 1/)).toBeInTheDocument()
    expect(screen.getByText(/最大并发: 5/)).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<AgentCard agent={mockAgent as any} onClick={handleClick} />)
    fireEvent.click(screen.getByText('Test Bot').closest('.agent-card')!)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should use fallback emoji when not provided', () => {
    const agentWithoutEmoji = { ...mockAgent, emoji: undefined }
    render(<AgentCard agent={agentWithoutEmoji as any} />)
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('should use agent id as fallback name', () => {
    const agentWithoutName = { ...mockAgent, displayName: undefined }
    render(<AgentCard agent={agentWithoutName as any} />)
    expect(screen.getByText('test-agent')).toBeInTheDocument()
  })

  it('should limit capabilities to first 3', () => {
    const agentWithManyCaps = {
      ...mockAgent,
      capabilities: [
        { name: 'Cap1', description: 'D1' },
        { name: 'Cap2', description: 'D2' },
        { name: 'Cap3', description: 'D3' },
        { name: 'Cap4', description: 'D4' },
      ],
    }
    render(<AgentCard agent={agentWithManyCaps as any} showCapabilities={true} />)
    expect(screen.getByText('Cap1')).toBeInTheDocument()
    expect(screen.getByText('Cap3')).toBeInTheDocument()
    expect(screen.queryByText('Cap4')).not.toBeInTheDocument()
  })
})

describe('AgentStatus', () => {
  it('should render status header', () => {
    render(<AgentStatus />)
    expect(screen.getByText('智能体状态')).toBeInTheDocument()
  })

  it('should render all 8 agents', () => {
    render(<AgentStatus />)
    expect(screen.getByText('元启·天枢')).toBeInTheDocument()
    expect(screen.getByText('智云·守护')).toBeInTheDocument()
    expect(screen.getByText('格物·宗师')).toBeInTheDocument()
    expect(screen.getByText('创想·灵韵')).toBeInTheDocument()
    expect(screen.getByText('言启·千行')).toBeInTheDocument()
    expect(screen.getByText('语枢·万物')).toBeInTheDocument()
    expect(screen.getByText('预见·先知')).toBeInTheDocument()
    expect(screen.getByText('知遇·伯乐')).toBeInTheDocument()
  })

  it('should render status indicators', () => {
    const { container } = render(<AgentStatus />)
    const indicators = container.querySelectorAll('.agent-status__indicator')
    expect(indicators.length).toBe(8)
  })
})

describe('FamilyLayout', () => {
  it('should render header when showHeader is true', () => {
    render(<FamilyLayout showHeader={true} />)
    expect(screen.getByText('AI Family')).toBeInTheDocument()
  })

  it('should not render header when showHeader is false', () => {
    render(<FamilyLayout showHeader={false} />)
    expect(screen.queryByText('AI Family')).not.toBeInTheDocument()
  })

  it('should render navigation buttons', () => {
    render(<FamilyLayout showHeader={true} />)
    expect(screen.getByText('客厅')).toBeInTheDocument()
    expect(screen.getByText('家人档案')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })

  it('should switch to members view on button click', () => {
    render(<FamilyLayout showHeader={true} />)
    const navButtons = screen.getAllByText('家人档案')
    fireEvent.click(navButtons[0])
    const { container } = render(<FamilyLayout showHeader={true} defaultView="members" />)
    expect(container.querySelector('.family-members')).toBeInTheDocument()
  })

  it('should switch to settings view', () => {
    render(<FamilyLayout showHeader={true} />)
    fireEvent.click(screen.getByText('设置'))
    expect(screen.getByText('设置中心（开发中）')).toBeInTheDocument()
  })

  it('should render AgentStatus in content area', () => {
    render(<FamilyLayout />)
    expect(screen.getByText('智能体状态')).toBeInTheDocument()
  })
})

describe('AIFamilyPanel', () => {
  it('should render with default props', () => {
    const { container } = render(<AIFamilyPanel />)
    expect(container.querySelector('.ai-family-panel')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<AIFamilyPanel className="custom-class" />)
    expect(container.querySelector('.ai-family-panel')).toHaveClass('custom-class')
  })

  it('should pass showHeader prop', () => {
    render(<AIFamilyPanel showHeader={false} />)
    expect(screen.queryByText('AI Family')).not.toBeInTheDocument()
  })

  it('should pass defaultView prop to members', () => {
    const { container } = render(<AIFamilyPanel defaultView="members" showHeader={true} />)
    expect(container.querySelector('.family-members')).toBeInTheDocument()
  })
})
