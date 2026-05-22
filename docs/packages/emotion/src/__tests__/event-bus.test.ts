import { describe, it, expect, beforeEach } from "vitest";
import { MusicEventBus } from "../event-bus/index.js";

describe("MusicEventBus", () => {
  let bus: MusicEventBus;

  beforeEach(() => {
    bus = new MusicEventBus();
  });

  describe("subscribe/emit", () => {
    it("应该订阅并接收事件", () => {
      let received: any = null;
      bus.subscribe("emotion:detected", (e) => { received = e; });
      bus.emitEmotionDetected("happy", 0.9, 0.8);
      expect(received).not.toBeNull();
      expect((received as any).payload.emotion).toBe("happy");
    });

    it("应该支持取消订阅", () => {
      let count = 0;
      const unsub = bus.subscribe("emotion:detected", () => { count++; });
      bus.emitEmotionDetected("happy", 0.9, 0.8);
      expect(count).toBe(1);
      unsub();
      bus.emitEmotionDetected("sad", 0.8, 0.7);
      expect(count).toBe(1);
    });
  });

  describe("subscribeAll", () => {
    it("应该订阅所有事件类型", () => {
      let count = 0;
      bus.subscribeAll(() => { count++; });
      bus.emitCommand("play");
      bus.emitEmotionDetected("happy", 0.9, 0.8);
      expect(count).toBe(2);
    });
  });

  describe("emitCommand", () => {
    it("应该发送音乐命令", () => {
      let received: any = null;
      bus.subscribe("music:command", (e) => { received = e; });
      bus.emitCommand("play", "voice");
      expect((received as any).payload.command).toBe("play");
      expect((received as any).payload.source).toBe("voice");
    });
  });

  describe("emitEmotionChanged", () => {
    it("应该发送情绪变化事件", () => {
      let received: any = null;
      bus.subscribe("emotion:changed", (e) => { received = e; });
      bus.emitEmotionChanged("happy", "sad", 0.8);
      expect((received as any).payload.previousEmotion).toBe("happy");
      expect((received as any).payload.currentEmotion).toBe("sad");
    });
  });

  describe("history", () => {
    it("getHistory返回事件历史", () => {
      bus.emitCommand("play");
      bus.emitCommand("pause");
      expect(bus.getHistory().length).toBe(2);
    });

    it("getRecentEvents返回最近N个", () => {
      for (let i = 0; i < 15; i++) bus.emitCommand("play");
      expect(bus.getRecentEvents(5).length).toBe(5);
    });

    it("clearHistory清空历史", () => {
      bus.emitCommand("play");
      bus.clearHistory();
      expect(bus.getHistory().length).toBe(0);
    });
  });

  describe("getListenerCount", () => {
    it("应该返回特定事件监听器数", () => {
      bus.subscribe("music:command", () => {});
      bus.subscribe("music:command", () => {});
      expect(bus.getListenerCount("music:command")).toBe(2);
    });

    it("应该返回总监听器数", () => {
      bus.subscribe("music:command", () => {});
      bus.subscribe("emotion:detected", () => {});
      expect(bus.getListenerCount()).toBe(2);
    });
  });
});
