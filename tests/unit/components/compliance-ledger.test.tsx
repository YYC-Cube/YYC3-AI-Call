/**
 * 合规台账组件测试：渲染 / Tab 切换 / RBAC 操作列可见性 / axe 无障碍
 */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import ComplianceLedger from '@/components/compliance-ledger';

expect.extend(toHaveNoViolations);

const sampleNumbers = [
  {
    id: 'pn-1',
    number: '10001',
    status: 'AVAILABLE' as const,
    carrier: '电信',
    hasAuthorization: true,
    dailyLimit: 3,
  },
  {
    id: 'pn-2',
    number: '10016',
    status: 'SUSPENDED' as const,
    carrier: '联通',
    hasAuthorization: false,
    dailyLimit: 3,
  },
];

const sampleDnc = [
  { id: 'dnc-1', phone: '19999990001', reason: 'COMPLAINT' as const, expiresAt: null },
];

const sampleTasks = [
  {
    id: 'task-1',
    lineNumber: '10001',
    customerPhone: '13800000001',
    status: 'BLOCKED',
    blockedGate: 'DNC',
    checkedAt: '2026-11-20 14:00',
  },
];

describe('ComplianceLedger', () => {
  it('渲染三表标签页与号码数据', () => {
    render(
      <ComplianceLedger
        role="ADMIN"
        numbers={sampleNumbers}
        dncEntries={sampleDnc}
        tasks={sampleTasks}
      />
    );
    expect(screen.getByRole('heading', { name: '合规台账' })).toBeInTheDocument();
    expect(screen.getByText('10001')).toBeInTheDocument();
    expect(screen.getByText('已备案')).toBeInTheDocument();
  });

  it('切换到禁拨名单 Tab 显示 aria-selected 与对应表内容', async () => {
    const user = userEvent.setup();
    render(<ComplianceLedger dncEntries={sampleDnc} />);
    const dncTab = screen.getByRole('tab', { name: '禁拨名单' });
    await user.click(dncTab);
    expect(dncTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('19999990001')).toBeInTheDocument();
    expect(screen.getByText('投诉')).toBeInTheDocument();
  });

  it('MANAGER 角色可见操作列（暂停/恢复按钮）', () => {
    render(<ComplianceLedger role="MANAGER" numbers={sampleNumbers} />);
    expect(screen.getByRole('button', { name: '恢复号码 10016' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '暂停号码 10001' })).toBeInTheDocument();
  });

  it('AGENT 角色无操作列（RBAC 隐藏管理动作）', () => {
    render(<ComplianceLedger role="AGENT" numbers={sampleNumbers} />);
    expect(screen.queryByRole('button', { name: /号码 10001/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /号码 10016/ })).not.toBeInTheDocument();
  });

  it('校验记录表展示阻断闸与状态', async () => {
    const user = userEvent.setup();
    render(<ComplianceLedger tasks={sampleTasks} />);
    const tasksTab = screen.getByRole('tab', { name: '校验记录' });
    await user.click(tasksTab);
    // Radix 隐藏面板仍在 DOM，按可见 tabpanel 查询
    const panel = screen.getByRole('tabpanel', { hidden: false });
    expect(within(panel).getByText('已阻断')).toBeInTheDocument();
    expect(within(panel).getByText('DNC')).toBeInTheDocument();
  });

  it('通过 axe 无障碍扫描', async () => {
    const { container } = render(
      <ComplianceLedger
        role="ADMIN"
        numbers={sampleNumbers}
        dncEntries={sampleDnc}
        tasks={sampleTasks}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
