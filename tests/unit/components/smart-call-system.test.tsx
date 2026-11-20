/**
 * SmartCallSystem 智能外呼系统组件测试
 *
 * 覆盖（对应验收文档第 4 阶段组件测试标准）：
 * 1. 渲染正确性：核心元素存在
 * 2. 交互可靠性：外呼发起、录音状态切换
 * 3. 无障碍合规：jest-axe 全量扫描
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import SmartCallSystem from "@/components/smart-call-system";

describe("SmartCallSystem 智能外呼系统", () => {
  it("应渲染外呼控制台核心元素", () => {
    render(<SmartCallSystem />);

    expect(screen.getByText("智能外呼控制台")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入客户电话号码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /开始外呼/ })).toBeInTheDocument();
    expect(screen.getByText("选择外呼类型")).toBeInTheDocument();
  });

  it("点击开始外呼应进入通话状态", async () => {
    const user = userEvent.setup();
    render(<SmartCallSystem />);

    await user.click(screen.getByRole("button", { name: /开始外呼/ }));

    expect(screen.getByText("正在通话")).toBeInTheDocument();
  });

  it("通话中录音按钮应切换录音状态", async () => {
    const user = userEvent.setup();
    render(<SmartCallSystem />);

    await user.click(screen.getByRole("button", { name: /开始外呼/ }));
    await user.click(screen.getByRole("button", { name: /开始录音/ }));

    expect(screen.getByRole("button", { name: /停止录音/ })).toBeInTheDocument();
  });

  it("应通过无障碍扫描（jest-axe）", async () => {
    const { container } = render(<SmartCallSystem />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
