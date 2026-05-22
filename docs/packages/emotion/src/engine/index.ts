import { emotionMusicBridge } from "../music-bridge/index.js";
import { musicEventBus } from "../event-bus/index.js";
import type {
  EmotionType,
  ModalityType,
  ModalityInput,
  TextModalityData,
  VoiceModalityData,
  BehaviorModalityData,
  PhysiologicalData,
  ModalityWeight,
  FusedEmotionResult,
} from "../types.js";

export type {
  EmotionType,
  ModalityType,
  ModalityInput,
  TextModalityData,
  VoiceModalityData,
  BehaviorModalityData,
  PhysiologicalData,
  ModalityWeight,
  FusedEmotionResult,
};

const DEFAULT_MODALITY_WEIGHTS: ModalityWeight[] = [
  { modality: "text", weight: 0.35, reliability: 0.8 },
  { modality: "voice", weight: 0.30, reliability: 0.75 },
  { modality: "behavior", weight: 0.25, reliability: 0.6 },
  { modality: "physiological", weight: 0.10, reliability: 0.9 },
];

export class MultimodalEmotionEngine {
  private modalityWeights: Map<ModalityType, ModalityWeight> = new Map();
  private recentInputs: Map<ModalityType, ModalityInput[]> = new Map();
  private maxInputsPerModality = 10;
  private fusionHistory: FusedEmotionResult[] = [];
  private maxHistorySize = 50;

  constructor() {
    for (const mw of DEFAULT_MODALITY_WEIGHTS) {
      this.modalityWeights.set(mw.modality, mw);
    }
  }

  setModalityWeight(modality: ModalityType, weight: number, reliability?: number): void {
    const current = this.modalityWeights.get(modality);
    this.modalityWeights.set(modality, {
      modality,
      weight,
      reliability: reliability ?? current?.reliability ?? 0.5,
    });
  }

  getModalityWeights(): Map<ModalityType, ModalityWeight> {
    return new Map(this.modalityWeights);
  }

  addInput(input: ModalityInput): void {
    if (!this.recentInputs.has(input.type)) {
      this.recentInputs.set(input.type, []);
    }
    const inputs = this.recentInputs.get(input.type)!;
    inputs.push(input);
    if (inputs.length > this.maxInputsPerModality) {
      inputs.shift();
    }
  }

  analyzeTextModality(data: TextModalityData): { emotion: EmotionType; confidence: number } {
    const emotion = emotionMusicBridge.detectEmotion(data.text);
    return {
      emotion: emotion.type,
      confidence: emotion.confidence * emotion.intensity,
    };
  }

  analyzeVoiceModality(data: VoiceModalityData): { emotion: EmotionType; confidence: number } {
    let emotion: EmotionType = "neutral";
    let confidence = 0.5;

    if (data.transcript) {
      const textResult = this.analyzeTextModality({
        text: data.transcript,
        source: "voice_transcript",
      });
      emotion = textResult.emotion;
      confidence = textResult.confidence * 0.6;
    }

    if (data.pitch !== undefined) {
      if (data.pitch > 1.2) {
        emotion = "excited";
        confidence += 0.1;
      } else if (data.pitch < 0.8) {
        emotion = "sad";
        confidence += 0.1;
      }
    }

    if (data.rate !== undefined) {
      if (data.rate > 1.3) {
        emotion = "anxious";
        confidence += 0.05;
      } else if (data.rate < 0.7) {
        emotion = "calm";
        confidence += 0.05;
      }
    }

    if (data.pauses && data.pauses.length > 3) {
      emotion = "confused";
      confidence += 0.05;
    }

    return { emotion, confidence: Math.min(1, confidence) };
  }

  analyzeBehaviorModality(data: BehaviorModalityData): { emotion: EmotionType; confidence: number } {
    let emotion: EmotionType = "neutral";
    let confidence = 0.4;

    if (data.clickFrequency > 15) {
      emotion = "anxious";
      confidence += 0.15;
    } else if (data.clickFrequency < 3) {
      emotion = "calm";
      confidence += 0.1;
    }

    if (data.dwellTime > 60) {
      emotion = "confused";
      confidence += 0.05;
    } else if (data.dwellTime < 5) {
      emotion = "anxious";
      confidence += 0.05;
    }

    if (data.scrollSpeed > 150) {
      emotion = "anxious";
    } else if (data.scrollSpeed < 30) {
      emotion = "calm";
    }

    if (data.typingSpeed !== undefined) {
      if (data.typingSpeed > 100) emotion = "excited";
      else if (data.typingSpeed < 30) emotion = "sad";
    }

    return { emotion, confidence: Math.min(1, confidence) };
  }

  analyzePhysiologicalModality(data: PhysiologicalData): { emotion: EmotionType; confidence: number } {
    let emotion: EmotionType = "neutral";
    let confidence = 0.5;

    if (data.heartRate !== undefined) {
      if (data.heartRate > 100) {
        emotion = "excited";
        confidence += 0.2;
      } else if (data.heartRate < 60) {
        emotion = "calm";
        confidence += 0.15;
      }
    }

    if (data.skinConductance !== undefined && data.skinConductance > 0.5) {
      emotion = "anxious";
      confidence += 0.1;
    }

    if (data.facialExpression) {
      const expressionMap: Record<string, EmotionType> = {
        smile: "happy",
        frown: "sad",
        surprise: "excited",
        anger: "angry",
        neutral: "neutral",
      };
      emotion = expressionMap[data.facialExpression] || emotion;
      confidence += 0.15;
    }

    return { emotion, confidence: Math.min(1, confidence) };
  }

  fuse(inputs: ModalityInput[]): FusedEmotionResult {
    const emotionScores: Map<EmotionType, number> = new Map();
    const contributions: Record<ModalityType, number> = {
      text: 0,
      voice: 0,
      behavior: 0,
      physiological: 0,
    };

    let totalWeight = 0;

    for (const input of inputs) {
      const weightConfig = this.modalityWeights.get(input.type);
      if (!weightConfig) continue;

      const { weight, reliability } = weightConfig;
      const effectiveWeight = weight * reliability * input.confidence;
      totalWeight += effectiveWeight;

      let result: { emotion: EmotionType; confidence: number } | null = null;

      switch (input.type) {
        case "text":
          result = this.analyzeTextModality(input.data as TextModalityData);
          break;
        case "voice":
          result = this.analyzeVoiceModality(input.data as VoiceModalityData);
          break;
        case "behavior":
          result = this.analyzeBehaviorModality(input.data as BehaviorModalityData);
          break;
        case "physiological":
          result = this.analyzePhysiologicalModality(input.data as PhysiologicalData);
          break;
      }

      if (result) {
        const currentScore = emotionScores.get(result.emotion) || 0;
        emotionScores.set(result.emotion, currentScore + effectiveWeight * result.confidence);
        contributions[input.type] = effectiveWeight / totalWeight;
      }
    }

    let dominantEmotion: EmotionType = "neutral";
    let maxScore = 0;

    emotionScores.forEach((score, emotion) => {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    });

    const confidence = totalWeight > 0 ? maxScore / totalWeight : 0.5;

    const fusedResult: FusedEmotionResult = {
      emotion: {
        type: dominantEmotion,
        confidence,
        intensity: Math.min(1, maxScore),
        timestamp: Date.now(),
      },
      contributions,
      confidence,
      timestamp: Date.now(),
    };

    this.fusionHistory.push(fusedResult);
    if (this.fusionHistory.length > this.maxHistorySize) {
      this.fusionHistory.shift();
    }

    musicEventBus.emitEmotionDetected(
      dominantEmotion,
      confidence,
      fusedResult.emotion.intensity,
      "multimodal"
    );

    return fusedResult;
  }

  getFusionHistory(): FusedEmotionResult[] {
    return [...this.fusionHistory];
  }

  getCurrentFusedEmotion(): FusedEmotionResult | null {
    return this.fusionHistory.length > 0
      ? this.fusionHistory[this.fusionHistory.length - 1]
      : null;
  }

  processText(text: string, source: TextModalityData["source"] = "chat"): FusedEmotionResult {
    const input: ModalityInput = {
      type: "text",
      data: { text, source },
      confidence: 0.8,
      timestamp: Date.now(),
    };
    this.addInput(input);
    return this.fuse([input]);
  }

  processVoice(data: VoiceModalityData): FusedEmotionResult {
    const input: ModalityInput = {
      type: "voice",
      data,
      confidence: 0.75,
      timestamp: Date.now(),
    };
    this.addInput(input);
    return this.fuse([input]);
  }

  processBehavior(data: BehaviorModalityData): FusedEmotionResult {
    const input: ModalityInput = {
      type: "behavior",
      data,
      confidence: 0.6,
      timestamp: Date.now(),
    };
    this.addInput(input);
    return this.fuse([input]);
  }

  processMultimodal(
    text?: string,
    voice?: VoiceModalityData,
    behavior?: BehaviorModalityData
  ): FusedEmotionResult {
    const inputs: ModalityInput[] = [];

    if (text) {
      inputs.push({
        type: "text",
        data: { text, source: "chat" },
        confidence: 0.8,
        timestamp: Date.now(),
      });
    }

    if (voice) {
      inputs.push({
        type: "voice",
        data: voice,
        confidence: 0.75,
        timestamp: Date.now(),
      });
    }

    if (behavior) {
      inputs.push({
        type: "behavior",
        data: behavior,
        confidence: 0.6,
        timestamp: Date.now(),
      });
    }

    for (const input of inputs) this.addInput(input);
    return this.fuse(inputs);
  }
}

export const multimodalEmotionEngine = new MultimodalEmotionEngine();
