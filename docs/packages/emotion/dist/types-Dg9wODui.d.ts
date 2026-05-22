type EmotionType = "happy" | "sad" | "anxious" | "confused" | "angry" | "neutral" | "excited" | "calm" | "relaxed";
interface EmotionState {
    type: EmotionType;
    confidence: number;
    intensity: number;
    timestamp: number;
}
interface UserBehavior {
    clickFrequency: number;
    dwellTime: number;
    scrollSpeed: number;
    typingSpeed?: number;
}
interface EmotionMusicMapping {
    emotion: EmotionType;
    preferredGenres: string[];
    tempoRange: [number, number];
    energyRange: [number, number];
    valenceRange: [number, number];
    color: string;
    description: string;
}
type ModalityType = "text" | "voice" | "behavior" | "physiological";
interface ModalityInput {
    type: ModalityType;
    data: unknown;
    confidence: number;
    timestamp: number;
}
interface TextModalityData {
    text: string;
    source: "chat" | "voice_transcript" | "search" | "comment";
}
interface VoiceModalityData {
    transcript: string;
    pitch?: number;
    rate?: number;
    volume?: number;
    pauses?: number[];
    energy?: number;
}
interface BehaviorModalityData {
    clickFrequency: number;
    dwellTime: number;
    scrollSpeed: number;
    typingSpeed?: number;
    mouseMovements?: number;
    sessionDuration?: number;
}
interface PhysiologicalData {
    heartRate?: number;
    skinConductance?: number;
    facialExpression?: string;
}
interface ModalityWeight {
    modality: ModalityType;
    weight: number;
    reliability: number;
}
interface FusedEmotionResult {
    emotion: EmotionState;
    contributions: Record<ModalityType, number>;
    confidence: number;
    timestamp: number;
}

export type { BehaviorModalityData as B, EmotionType as E, FusedEmotionResult as F, ModalityType as M, PhysiologicalData as P, TextModalityData as T, UserBehavior as U, VoiceModalityData as V, ModalityWeight as a, ModalityInput as b, EmotionMusicMapping as c, EmotionState as d };
