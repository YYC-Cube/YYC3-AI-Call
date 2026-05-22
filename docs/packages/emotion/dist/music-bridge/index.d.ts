import { E as EmotionType, c as EmotionMusicMapping, d as EmotionState, U as UserBehavior } from '../types-Dg9wODui.js';

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

export { EMOTION_MUSIC_MAPPINGS, EmotionMusicBridge, EmotionMusicMapping, EmotionState, EmotionType, UserBehavior, emotionMusicBridge };
