import { M as ModalityType, a as ModalityWeight, b as ModalityInput, T as TextModalityData, E as EmotionType, V as VoiceModalityData, B as BehaviorModalityData, P as PhysiologicalData, F as FusedEmotionResult } from '../types-Dg9wODui.js';

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

export { BehaviorModalityData, EmotionType, FusedEmotionResult, ModalityInput, ModalityType, ModalityWeight, MultimodalEmotionEngine, PhysiologicalData, TextModalityData, VoiceModalityData, multimodalEmotionEngine };
