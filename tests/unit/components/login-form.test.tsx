/**
 * 登录表单测试：提交/成功回调/错误提示/加载态 + axe 无障碍
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoginForm from '@/components/login-form';

expect.extend(toHaveNoViolations);

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  fetchMock.mockReset();
});

/** jsdom 对 submit 按钮派发不稳：以 fireEvent.submit 直发表单 */
async function submitFilled(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('邮箱'), 'agent@yyc3.com');
  await user.type(screen.getByLabelText('密码'), 'password123');
  fireEvent.submit(screen.getByRole('form'));
}

describe('LoginForm', () => {
  it('登录成功：调用 onLogin 回调且不发令牌存储请求', async () => {
    const user = userEvent.setup();
    const onLogin = jest.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { user: { id: 'u1', email: 'agent@yyc3.com', name: 't', role: 'AGENT' } },
      }),
    });
    render(<LoginForm onLogin={onLogin} />);
    await submitFilled(user);
    

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' })));
    const [, init] = fetchMock.mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(sent.action).toBe('login');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('登录失败：展示 role=alert 错误提示且不回调', async () => {
    const user = userEvent.setup();
    const onLogin = jest.fn();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: '邮箱或密码错误' }),
    });
    render(<LoginForm onLogin={onLogin} />);
    await submitFilled(user);
    

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('邮箱或密码错误');
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('网络异常：展示兜底提示', async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<LoginForm />);
    await submitFilled(user);
    
    expect((await screen.findByRole('alert')).textContent).toContain('网络异常');
  });

  it('加载态：提交后按钮禁用并显示登录中', async () => {
    const user = userEvent.setup();
    let resolveFetch: (v: unknown) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );
    render(<LoginForm />);
    await submitFilled(user);
    
    expect(screen.getByRole('button', { name: '登录中…' })).toBeDisabled();
    resolveFetch({ ok: false, json: async () => ({ error: 'x' }) });
    await screen.findByRole('alert');
  });

  it('通过 axe 无障碍扫描', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
