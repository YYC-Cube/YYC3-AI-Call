export type EmotionType =
  | "happy"
  | "sad"
  | "anxious"
  | "confused"
  | "angry"
  | "neutral"
  | "excited"
  | "calm"
  | "relaxed";

export interface EmotionState {
  type: EmotionType;
  confidence: number;
  intensity: number;
  timestamp: number;
}

export interface UserBehavior {
  clickFrequency: number;
  dwellTime: number;
  scrollSpeed: number;
  typingSpeed?: number;
}

export interface EmotionMusicMapping {
  emotion: EmotionType;
  preferredGenres: string[];
  tempoRange: [number, number];
  energyRange: [number, number];
  valenceRange: [number, number];
  color: string;
  description: string;
}

export type ModalityType = "text" | "voice" | "behavior" | "physiological";

export interface ModalityInput {
  type: ModalityType;
  data: unknown;
  confidence: number;
  timestamp: number;
}

export interface TextModalityData {
  text: string;
  source: "chat" | "voice_transcript" | "search" | "comment";
}

export interface VoiceModalityData {
  transcript: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  pauses?: number[];
  energy?: number;
}

export interface BehaviorModalityData {
  clickFrequency: number;
  dwellTime: number;
  scrollSpeed: number;
  typingSpeed?: number;
  mouseMovements?: number;
  sessionDuration?: number;
}

export interface PhysiologicalData {
  heartRate?: number;
  skinConductance?: number;
  facialExpression?: string;
}

export interface ModalityWeight {
  modality: ModalityType;
  weight: number;
  reliability: number;
}

export interface FusedEmotionResult {
  emotion: EmotionState;
  contributions: Record<ModalityType, number>;
  confidence: number;
  timestamp: number;
}
