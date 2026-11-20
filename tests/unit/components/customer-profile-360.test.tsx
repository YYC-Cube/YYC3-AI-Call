/**
 * CustomerProfile360 客户画像组件测试
 *
 * 覆盖：
 * 1. 渲染正确性：六维画像标签完整
 * 2. 交互可靠性：Tab 切换与面板联动
 * 3. 无障碍合规：jest-axe 全量扫描
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import CustomerProfile360 from "@/components/customer-profile-360";

const TAB_LABELS = ["总览", "行为分析", "偏好分析", "社交画像", "财务画像", "风险评估"];

describe("CustomerProfile360 客户画像", () => {
  it("应渲染六维画像标签", () => {
    render(<CustomerProfile360 />);

    for (const label of TAB_LABELS) {
      expect(screen.getByRole("tab", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("默认应选中总览面板", () => {
    render(<CustomerProfile360 />);

    expect(screen.getByRole("tab", { name: /总览/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("点击行为分析标签应切换面板", async () => {
    const user = userEvent.setup();
    render(<CustomerProfile360 />);

    await user.click(screen.getByRole("tab", { name: /行为分析/ }));

    const tab = screen.getByRole("tab", { name: /行为分析/ });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: /行为分析/ })).toBeInTheDocument();
  });

  it("应通过无障碍扫描（jest-axe）", async () => {
    const { container } = render(<CustomerProfile360 />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
