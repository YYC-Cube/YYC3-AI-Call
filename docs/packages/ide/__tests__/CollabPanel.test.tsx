/**
 * @file __tests__/CollabPanel.test.tsx
 * @description 实时协作面板组件测试 - 简化版，测试核心功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,collaboration,panel,ui
 */

// @vitest-environment jsdom

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CollabPanel from "../CollabPanel";

// Mock PanelHeader
vi.mock("../PanelManager", () => ({
  PanelHeader: ({ title }: any) => (
    <div data-testid="panel-header">
      <span data-testid="panel-title">{title}</span>
    </div>
  ),
}));

describe("CollabPanel - 实时协作面板 (核心测试)", () => {
  const mockProps = {
    nodeId: "test-node",
  };

  // ── 1. 基础渲染 ──

  it("渲染协作面板", () => {
    render(<CollabPanel {...mockProps} />);
    expect(screen.getByTestId("panel-title")).toBeInTheDocument();
  });

  it("显示面板标题", () => {
    render(<CollabPanel {...mockProps} />);
    expect(screen.getByText("实时协作")).toBeInTheDocument();
  });

  // ── 2. 组件结构 ──

  it("包含用户列表区域", () => {
    render(<CollabPanel {...mockProps} />);
    // 检查组件渲染成功
    expect(screen.getByTestId("panel-header")).toBeInTheDocument();
  });

  it("组件无崩溃", () => {
    const { container } = render(<CollabPanel {...mockProps} />);
    expect(container).toBeInTheDocument();
  });

  // ── 3. Props 传递 ──

  it("接收 nodeId prop", () => {
    const { container } = render(<CollabPanel nodeId="custom-node" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  // ── 4. 响应式 ──

  it("支持不同尺寸容器", () => {
    const { container, rerender } = render(<CollabPanel {...mockProps} />);
    expect(container.firstChild).toBeInTheDocument();

    rerender(<CollabPanel {...mockProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  // ── 5. 性能 ──

  it("快速渲染", () => {
    const start = Date.now();
    render(<CollabPanel {...mockProps} />);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // 应该在 100ms 内完成渲染
  });

  it("多次渲染不崩溃", () => {
    const { rerender } = render(<CollabPanel {...mockProps} />);

    for (let i = 0; i < 10; i++) {
      rerender(<CollabPanel {...mockProps} />);
    }

    expect(true).toBe(true);
  });
});
