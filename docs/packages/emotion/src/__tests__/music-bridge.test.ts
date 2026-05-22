import { beforeEach, describe, expect, it } from "vitest";
import { EmotionMusicBridge } from "../music-bridge/index.js";

describe("EmotionMusicBridge", () => {
  let bridge: EmotionMusicBridge;

  beforeEach(() => {
    bridge = new EmotionMusicBridge();
  });

  describe("analyzeSentiment", () => {
    it("应该识别正面情绪", () => {
      const score = bridge.analyzeSentiment("今天非常开心，棒极了！");
      expect(score).toBeGreaterThan(0);
    });

    it("应该识别负面情绪", () => {
      const score = bridge.analyzeSentiment("好难过，很伤心");
      expect(score).toBeLessThan(0);
    });

    it("应该识别焦虑情绪", () => {
      const score = bridge.analyzeSentiment("好焦虑，压力很大");
      expect(score).toBeLessThan(0);
    });

    it("应该识别困惑情绪", () => {
      const score = bridge.analyzeSentiment("我很困惑，不明白");
      expect(score).toBeLessThan(0);
    });

    it("空文本返回0", () => {
      expect(bridge.analyzeSentiment("")).toBe(0);
      expect(bridge.analyzeSentiment("普通文本没有情绪关键词")).toBe(0);
    });
  });

  describe("detectEmotion", () => {
    it("应该检测到快乐情绪", () => {
      const state = bridge.detectEmotion("太开心了，非常高兴！");
      expect(state.type).toBe("happy");
      expect(state.confidence).toBeGreaterThan(0.5);
    });

    it("应该检测到悲伤情绪", () => {
      const state = bridge.detectEmotion("难过伤心痛苦，好失望好沮丧");
      expect(state.type).toBe("sad");
    });

    it("应该检测到焦虑情绪", () => {
      const state = bridge.detectEmotion("焦虑紧张");
      expect(state.type).toBe("anxious");
    });

    it("中性文本返回neutral", () => {
      const state = bridge.detectEmotion("今天的天气不错");
      expect(state.type).toBe("neutral");
    });

    it("结合行为数据检测excited", () => {
      const state = bridge.detectEmotion("开心高兴快乐喜欢爱兴奋满足", {
        clickFrequency: 5,
        dwellTime: 10,
        scrollSpeed: 150,
        typingSpeed: 120,
      });
      expect(state.type).toBe("excited");
    });

    it("EmotionState包含正确字段", () => {
      const state = bridge.detectEmotion("测试");
      expect(state).toHaveProperty("type");
      expect(state).toHaveProperty("confidence");
      expect(state).toHaveProperty("intensity");
      expect(state).toHaveProperty("timestamp");
    });
  });

  describe("getMusicRecommendation", () => {
    it("应该返回正确的音乐映射", () => {
      const rec = bridge.getMusicRecommendation("happy");
      expect(rec.preferredGenres).toContain("pop");
      expect(rec.color).toBe("#FFD700");
    });

    it("未知情绪返回neutral映射", () => {
      const rec = bridge.getMusicRecommendation("neutral" as any);
      expect(rec.preferredGenres).toBeDefined();
    });

    it("所有9种情绪都有映射", () => {
      const emotions = ["happy", "sad", "anxious", "confused", "angry", "neutral", "excited", "calm", "relaxed"];
      for (const e of emotions) {
        const rec = bridge.getMusicRecommendation(e as any);
        expect(rec.preferredGenres.length).toBeGreaterThan(0);
      }
    });
  });

  describe("suggestMusicAction", () => {
    it("sad建议change_playlist", () => {
      const action = bridge.suggestMusicAction("sad");
      expect(action.action).toBe("change_playlist");
      expect(action.playlistType).toBe("healing");
    });

    it("happy建议play", () => {
      const action = bridge.suggestMusicAction("happy");
      expect(action.action).toBe("play");
    });

    it("angry建议change_playlist", () => {
      const action = bridge.suggestMusicAction("angry");
      expect(action.action).toBe("change_playlist");
      expect(action.playlistType).toBe("release");
    });
  });

  describe("getRecommendedTracksForEmotion", () => {
    it("应该按分数排序推荐曲目", () => {
      const tracks = [
        { id: "1", title: "A", genre: "pop", tempo: 120, energy: 70, valence: 80 },
        { id: "2", title: "B", genre: "metal", tempo: 170, energy: 95, valence: 30 },
        { id: "3", title: "C", genre: "ballad", tempo: 70, energy: 30, valence: 30 },
      ];
      const result = bridge.getRecommendedTracksForEmotion("happy", tracks);
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    });
  });

  describe("emotionHistory", () => {
    it("getCurrentEmotion初始为null", () => {
      expect(bridge.getCurrentEmotion()).toBeNull();
    });

    it("检测后getCurrentEmotion有值", () => {
      bridge.detectEmotion("开心高兴快乐喜欢爱兴奋满足");
      expect(bridge.getCurrentEmotion()).not.toBeNull();
      expect(["happy", "excited"]).toContain(bridge.getCurrentEmotion()!.type);
    });

    it("getEmotionHistory记录历史", () => {
      bridge.detectEmotion("开心高兴快乐");
      bridge.detectEmotion("难过伤心痛苦");
      const history = bridge.getEmotionHistory();
      expect(history.length).toBe(2);
    });
  });
});
