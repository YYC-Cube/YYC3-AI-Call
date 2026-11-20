/**
 * AIChatComponent AI 对话组件测试
 *
 * 覆盖：
 * 1. 渲染正确性：标题、健康状态、输入区
 * 2. 交互可靠性：发送消息 → 意图/情感标注 → 助手回复
 * 3. 无障碍合规：jest-axe 全量扫描
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { AIChatComponent } from "@/components/ai-chat";

// jsdom 不实现 scrollIntoView（ai-chat 挂载后自动滚动）
Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/lib/hooks/useAI", () => ({
  useAI: () => ({
    loading: false,
    error: null,
    chat: jest.fn().mockResolvedValue({
      choices: [{ message: { content: "您好，我是 YYC³ 智能助手" } }],
    }),
    classifyIntent: jest
      .fn()
      .mockResolvedValue({ intent: "consultation", confidence: 0.92 }),
    analyzeSentiment: jest
      .fn()
      .mockResolvedValue({ sentiment: "positive", score: 0.85 }),
    healthCheck: jest.fn().mockResolvedValue({ healthy: true }),
  }),
}));

describe("AIChatComponent AI 对话", () => {
  it("健康检查通过后应显示已连接并启用输入", async () => {
    render(<AIChatComponent />);

    expect(screen.getByText("YYC³ AI Chat")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Type a message...")).not.toBeDisabled();
    // 空输入时 Send 按钮保持禁用（组件防误触设计），启用态由发送用例覆盖
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("发送消息应产生带意图/情感标注的用户消息与助手回复", async () => {
    const user = userEvent.setup();
    render(<AIChatComponent />);

    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "我想了解智能外呼方案");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("我想了解智能外呼方案")).toBeInTheDocument();
    expect(await screen.findByText(/Intent: consultation/)).toBeInTheDocument();
    expect(await screen.findByText(/Sentiment: positive/)).toBeInTheDocument();
    expect(
      await screen.findByText("您好，我是 YYC³ 智能助手"),
    ).toBeInTheDocument();
  });

  it("应通过无障碍扫描（jest-axe）", async () => {
    const { container } = render(<AIChatComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
