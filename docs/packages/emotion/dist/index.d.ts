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

declare class MultimodalEmotionEngine {
    private modalityWeights;
    private recentInputs;
    private maxInputsPerModality;
    private fusionHistory;
    private maxHistorySize;
    constructor();
    setModalityWeight(modality: ModalityType, weight: number, reliability?: number): void;
    getModalityWeights(): Map<ModalityType, ModalityWeight>;
    addInput(input: ModalityInput): void;
    analyzeTextModality(data: TextModalityData): {
        emotion: EmotionType;
        confidence: number;
    };
    analyzeVoiceModality(data: VoiceModalityData): {
        emotion: EmotionType;
        confidence: number;
    };
    analyzeBehaviorModality(data: BehaviorModalityData): {
        emotion: EmotionType;
        confidence: number;
    };
    analyzePhysiologicalModality(data: PhysiologicalData): {
        emotion: EmotionType;
        confidence: number;
    };
    fuse(inputs: ModalityInput[]): FusedEmotionResult;
    getFusionHistory(): FusedEmotionResult[];
    getCurrentFusedEmotion(): FusedEmotionResult | null;
    processText(text: string, source?: TextModalityData["source"]): FusedEmotionResult;
    processVoice(data: VoiceModalityData): FusedEmotionResult;
    processBehavior(data: BehaviorModalityData): FusedEmotionResult;
    processMultimodal(text?: string, voice?: VoiceModalityData, behavior?: BehaviorModalityData): FusedEmotionResult;
}
declare const multimodalEmotionEngine: MultimodalEmotionEngine;

declare const EMOTION_MUSIC_MAPPINGS: Record<EmotionType, EmotionMusicMapping>;
declare class EmotionMusicBridge {
    private currentEmotion;
    private emotionHistory;
    private maxHistorySize;
    getCurrentEmotion(): EmotionState | null;
    getEmotionHistory(): EmotionState[];
    analyzeSentiment(text: string): number;
    analyzeBehavior(behavior: UserBehavior): {
        isImpatient: boolean;
        isHesitant: boolean;
        isRushed: boolean;
        isTypingFast: boolean;
    };
    detectEmotion(text: string, behavior?: UserBehavior): EmotionState;
    private updateEmotion;
    getMusicRecommendation(emotion: EmotionType): EmotionMusicMapping;
    getRecommendedTracksForEmotion(emotion: EmotionType, tracks: Array<{
        id: string | number;
        title: string;
        genre?: string;
        tempo?: number;
        energy?: number;
        valence?: number;
    }>): Array<{
        id: string | number;
        score: number;
        reason: string;
    }>;
    suggestMusicAction(emotion: EmotionType): {
        action: "play" | "pause" | "change_playlist";
        reason: string;
        playlistType?: string;
    };
}
declare const emotionMusicBridge: EmotionMusicBridge;

type MusicCommand = "play" | "pause" | "toggle" | "next" | "previous" | "volume_up" | "volume_down" | "mute" | "unmute" | "like" | "unlike" | "shuffle" | "repeat" | "seek" | "play_index";
type MusicEventType = "music:command" | "music:state_change" | "music:track_change" | "music:volume_change" | "music:progress_update" | "music:error" | "voice:command_detected" | "voice:transcript" | "emotion:detected" | "emotion:changed";
interface MusicState {
    isPlaying: boolean;
    currentTrackIndex: number;
    progress: number;
    volume: number;
    muted: boolean;
    likedTracks: Set<number>;
    shuffle: boolean;
    repeat: boolean;
}
interface Track {
    id: number;
    title: string;
    artist: string;
    duration: string;
    color: string;
    suitableEmotions?: string[];
}
interface MusicEvent {
    type: MusicEventType;
    payload: Record<string, unknown>;
}
type MusicEventListener = (event: MusicEvent) => void;
declare class MusicEventBus {
    private listeners;
    private eventHistory;
    private maxHistorySize;
    subscribe(eventType: MusicEventType, listener: MusicEventListener): () => void;
    subscribeAll(listener: MusicEventListener): () => void;
    emit(event: MusicEvent): void;
    emitCommand(command: MusicCommand, source?: string, params?: Record<string, unknown>): void;
    emitEmotionDetected(emotion: string, confidence: number, intensity: number, source?: string): void;
    emitEmotionChanged(previousEmotion: string, currentEmotion: string, confidence: number): void;
    emitError(error: string, code?: string): void;
    getHistory(): MusicEvent[];
    getRecentEvents(count?: number): MusicEvent[];
    clearHistory(): void;
    getListenerCount(eventType?: MusicEventType): number;
}
declare const musicEventBus: MusicEventBus;

/**
 * file sentiment-provider.ts
 * description 情感分析 Provider — 支持关键词规则和 LLM 两种分析模式
 * module @yyc3/emotion
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-27
 * updated 2026-04-27
 * status active
 * tags [module],[sentiment]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 情感分析 Provider
 */

interface SentimentProvider {
    readonly name: string;
    analyze(text: string): Promise<{
        emotion: EmotionType;
        confidence: number;
        intensity: number;
    }>;
    isAvailable(): boolean;
}
interface LLMSentimentConfig {
    provider: 'openai' | 'ollama' | 'anthropic';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}
declare class LLMSentimentProvider implements SentimentProvider {
    readonly name = "llm";
    private config;
    constructor(config: LLMSentimentConfig);
    isAvailable(): boolean;
    analyze(text: string): Promise<{
        emotion: EmotionType;
        confidence: number;
        intensity: number;
    }>;
    private callLLM;
    private callOllama;
    private callOpenAICompatible;
    private callAnthropic;
    private validateEmotion;
}
declare class RuleBasedSentimentProvider implements SentimentProvider {
    readonly name = "rule-based";
    private positiveKeywords;
    private negativeKeywords;
    private anxietyKeywords;
    isAvailable(): boolean;
    analyze(text: string): Promise<{
        emotion: EmotionType;
        confidence: number;
        intensity: number;
    }>;
}

export { type BehaviorModalityData, EMOTION_MUSIC_MAPPINGS, type EmotionType as Emotion, EmotionMusicBridge, type EmotionMusicMapping, type EmotionState, type EmotionState as EmotionStateType, type EmotionType, type FusedEmotionResult, type LLMSentimentConfig, LLMSentimentProvider, type ModalityInput, type ModalityType, type ModalityWeight, MultimodalEmotionEngine, type MusicCommand, type MusicEvent, MusicEventBus, type MusicEventListener, type MusicEventType, type MusicState, type PhysiologicalData, RuleBasedSentimentProvider, type SentimentProvider, type TextModalityData, type Track, type UserBehavior, type VoiceModalityData, emotionMusicBridge, multimodalEmotionEngine, musicEventBus };
