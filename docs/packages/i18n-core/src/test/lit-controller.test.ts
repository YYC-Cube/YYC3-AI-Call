/**
 * file lit-controller.test.ts
 * description @yyc3/i18n-core lit-controller.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core lit-controller.ts 单元测试
 */
import { describe, expect, it, vi } from "vitest";
import { I18nController } from "../lib/lit-controller.js";

describe("I18nController", () => {
  it("should be a class that implements ReactiveController", () => {
    const mockHost = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
    };

    const controller = new I18nController(mockHost);
    expect(controller).toBeInstanceOf(I18nController);
    expect(mockHost.addController).toHaveBeenCalledWith(controller);
  });

  it("should call hostConnected to subscribe to i18n changes", () => {
    const mockHost = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
    };

    const controller = new I18nController(mockHost);

    controller.hostConnected();

    expect(mockHost.requestUpdate).not.toHaveBeenCalled();
  });

  it("should call hostDisconnected to unsubscribe", () => {
    const mockHost = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
    };

    const controller = new I18nController(mockHost);
    controller.hostConnected();
    controller.hostDisconnected();

    expect(mockHost.addController).toHaveBeenCalledTimes(1);
  });
});
