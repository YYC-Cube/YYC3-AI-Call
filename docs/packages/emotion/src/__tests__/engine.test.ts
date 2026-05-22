import { beforeEach, describe, expect, it } from "vitest";
import { MultimodalEmotionEngine } from "../engine/index.js";
import type { BehaviorModalityData, VoiceModalityData } from "../types.js";

describe("MultimodalEmotionEngine", () => {
  let engine: MultimodalEmotionEngine;

  beforeEach(() => {
    engine = new MultimodalEmotionEngine();
  });

  describe("analyzeTextModality", () => {
    it("应该分析文本情感（正面）", () => {
      const result = engine.analyzeTextModality({ text: "太开心了非常高兴好棒好喜欢爱", source: "chat" });
      expect(result.confidence).toBeGreaterThan(0);
      expect(["happy", "calm"]).toContain(result.emotion);
    });

    it("应该识别悲伤文本", () => {
      const result = engine.analyzeTextModality({ text: "难过伤心痛苦好失望好沮丧", source: "chat" });
      expect(result.emotion).toBe("sad");
    });
  });

  describe("analyzeVoiceModality", () => {
    it("应该分析语音语调（高音=兴奋）", () => {
      const data: VoiceModalityData = { transcript: "开心", pitch: 1.5, rate: 1.0 };
      const result = engine.analyzeVoiceModality(data);
      expect(result.emotion).toBe("excited");
    });

    it("应该分析语音语调（低音=悲伤）", () => {
      const data: VoiceModalityData = { transcript: "难过", pitch: 0.6, rate: 1.0 };
      const result = engine.analyzeVoiceModality(data);
      expect(result.emotion).toBe("sad");
    });

    it("应该分析语速（快=焦虑）", () => {
      const data: VoiceModalityData = { transcript: "普通", pitch: 1.0, rate: 1.5 };
      const result = engine.analyzeVoiceModality(data);
      expect(result.emotion).toBe("anxious");
    });

    it("应该分析停顿（多=困惑）", () => {
      const data: VoiceModalityData = { transcript: "普通", pauses: [1, 2, 3, 4] };
      const result = engine.analyzeVoiceModality(data);
      expect(result.emotion).toBe("confused");
    });
  });

  describe("analyzeBehaviorModality", () => {
    it("高频点击=焦虑", () => {
      const data: BehaviorModalityData = { clickFrequency: 20, dwellTime: 10, scrollSpeed: 50 };
      const result = engine.analyzeBehaviorModality(data);
      expect(result.emotion).toBe("anxious");
    });

    it("低频点击=平静", () => {
      const data: BehaviorModalityData = { clickFrequency: 2, dwellTime: 10, scrollSpeed: 20 };
      const result = engine.analyzeBehaviorModality(data);
      expect(result.emotion).toBe("calm");
    });

    it("长停留=困惑", () => {
      const data: BehaviorModalityData = { clickFrequency: 5, dwellTime: 70, scrollSpeed: 50 };
      const result = engine.analyzeBehaviorModality(data);
      expect(result.emotion).toBe("confused");
    });
  });

  describe("analyzePhysiologicalModality", () => {
    it("高心率=兴奋", () => {
      const result = engine.analyzePhysiologicalModality({ heartRate: 120 });
      expect(result.emotion).toBe("excited");
    });

    it("低心率=平静", () => {
      const result = engine.analyzePhysiologicalModality({ heartRate: 55 });
      expect(result.emotion).toBe("calm");
    });

    it("面部表情=快乐", () => {
      const result = engine.analyzePhysiologicalModality({ facialExpression: "smile" });
      expect(result.emotion).toBe("happy");
    });
  });

  describe("processText", () => {
    it("应该处理文本并返回融合结果", () => {
      const result = engine.processText("太开心了，非常高兴！好棒！");
      expect(result.emotion.type).toBe("happy");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it("FusedEmotionResult包含contributions", () => {
      const result = engine.processText("测试文本");
      expect(result.contributions).toHaveProperty("text");
      expect(result.contributions).toHaveProperty("voice");
      expect(result.contributions).toHaveProperty("behavior");
      expect(result.contributions).toHaveProperty("physiological");
    });
  });

  describe("processMultimodal", () => {
    it("应该融合多模态输入", () => {
      const result = engine.processMultimodal(
        "开心",
        { transcript: "开心", pitch: 1.3 },
        { clickFrequency: 5, dwellTime: 10, scrollSpeed: 50 }
      );
      expect(result.emotion.type).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("无输入返回neutral", () => {
      const result = engine.processMultimodal();
      expect(result.emotion.type).toBe("neutral");
    });
  });

  describe("fusionHistory", () => {
    it("getFusionHistory初始为空", () => {
      expect(engine.getFusionHistory().length).toBe(0);
    });

    it("处理后历史增加", () => {
      engine.processText("开心");
      engine.processText("难过");
      expect(engine.getFusionHistory().length).toBe(2);
    });

    it("getCurrentFusedEmotion返回最新", () => {
      engine.processText("太开心了，非常高兴！好棒！");
      const current = engine.getCurrentFusedEmotion();
      expect(current).not.toBeNull();
      expect(current!.emotion.type).toBe("happy");
    });
  });

  describe("setModalityWeight", () => {
    it("应该更新模态权重", () => {
      engine.setModalityWeight("text", 0.5, 0.9);
      const weights = engine.getModalityWeights();
      expect(weights.get("text")!.weight).toBe(0.5);
      expect(weights.get("text")!.reliability).toBe(0.9);
    });
  });
});
