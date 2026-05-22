import { musicEventBus } from "../event-bus/index.js";
import type { EmotionType, EmotionState, UserBehavior, EmotionMusicMapping } from "../types.js";

export type { EmotionType, EmotionState, UserBehavior, EmotionMusicMapping };

export const EMOTION_MUSIC_MAPPINGS: Record<EmotionType, EmotionMusicMapping> = {
  happy: {
    emotion: "happy",
    preferredGenres: ["pop", "dance", "electronic"],
    tempoRange: [100, 140],
    energyRange: [60, 90],
    valenceRange: [70, 100],
    color: "#FFD700",
    description: "欢快愉悦",
  },
  sad: {
    emotion: "sad",
    preferredGenres: ["ballad", "classical", "ambient"],
    tempoRange: [60, 90],
    energyRange: [20, 50],
    valenceRange: [20, 45],
    color: "#1E90FF",
    description: "舒缓治愈",
  },
  anxious: {
    emotion: "anxious",
    preferredGenres: ["ambient", "meditation", "nature"],
    tempoRange: [50, 80],
    energyRange: [15, 40],
    valenceRange: [40, 60],
    color: "#FFA07A",
    description: "平静放松",
  },
  confused: {
    emotion: "confused",
    preferredGenres: ["focus", "instrumental", "lo-fi"],
    tempoRange: [70, 100],
    energyRange: [30, 50],
    valenceRange: [45, 65],
    color: "#9370DB",
    description: "清晰思路",
  },
  angry: {
    emotion: "angry",
    preferredGenres: ["rock", "metal", "electronic"],
    tempoRange: [120, 180],
    energyRange: [70, 100],
    valenceRange: [30, 60],
    color: "#FF6347",
    description: "宣泄释放",
  },
  neutral: {
    emotion: "neutral",
    preferredGenres: ["pop", "indie", "alternative"],
    tempoRange: [80, 120],
    energyRange: [40, 60],
    valenceRange: [50, 70],
    color: "#808080",
    description: "轻松聆听",
  },
  excited: {
    emotion: "excited",
    preferredGenres: ["electronic", "dance", "hip-hop"],
    tempoRange: [120, 160],
    energyRange: [75, 100],
    valenceRange: [75, 100],
    color: "#FF4500",
    description: "激情澎湃",
  },
  calm: {
    emotion: "calm",
    preferredGenres: ["classical", "ambient", "jazz"],
    tempoRange: [50, 80],
    energyRange: [20, 45],
    valenceRange: [55, 75],
    color: "#32CD32",
    description: "宁静祥和",
  },
  relaxed: {
    emotion: "relaxed",
    preferredGenres: ["lo-fi", "chill", "acoustic"],
    tempoRange: [60, 100],
    energyRange: [25, 50],
    valenceRange: [50, 70],
    color: "#9370DB",
    description: "悠闲自在",
  },
};

const POSITIVE_KEYWORDS = [
  "开心", "高兴", "快乐", "棒", "好", "喜欢", "爱", "兴奋", "满足",
  "happy", "good", "great", "love", "excited", "wonderful",
];

const NEGATIVE_KEYWORDS = [
  "难过", "伤心", "痛苦", "坏", "讨厌", "恨", "失望", "沮丧",
  "sad", "bad", "hate", "angry", "disappointed",
];

const ANXIETY_KEYWORDS = [
  "焦虑", "紧张", "担心", "害怕", "压力", "不安",
  "anxious", "worried", "scared", "stressed", "nervous",
];

const CONFUSION_KEYWORDS = [
  "困惑", "不懂", "不明白", "迷茫", "犹豫",
  "confused", "don't understand", "lost", "uncertain",
];

export class EmotionMusicBridge {
  private currentEmotion: EmotionState | null = null;
  private emotionHistory: EmotionState[] = [];
  private maxHistorySize = 50;

  getCurrentEmotion(): EmotionState | null {
    return this.currentEmotion;
  }

  getEmotionHistory(): EmotionState[] {
    return [...this.emotionHistory];
  }

  analyzeSentiment(text: string): number {
    if (!text || typeof text !== "string") return 0;

    let score = 0;
    const lowerText = text.toLowerCase();

    for (const keyword of POSITIVE_KEYWORDS) {
      if (lowerText.includes(keyword)) score += 0.2;
    }
    for (const keyword of NEGATIVE_KEYWORDS) {
      if (lowerText.includes(keyword)) score -= 0.2;
    }
    for (const keyword of ANXIETY_KEYWORDS) {
      if (lowerText.includes(keyword)) score -= 0.15;
    }
    for (const keyword of CONFUSION_KEYWORDS) {
      if (lowerText.includes(keyword)) score -= 0.1;
    }

    return Math.max(-1, Math.min(1, score));
  }

  analyzeBehavior(behavior: UserBehavior): {
    isImpatient: boolean;
    isHesitant: boolean;
    isRushed: boolean;
    isTypingFast: boolean;
  } {
    return {
      isImpatient: behavior.clickFrequency > 10,
      isHesitant: behavior.dwellTime > 30,
      isRushed: behavior.scrollSpeed > 100,
      isTypingFast: behavior.typingSpeed !== undefined && behavior.typingSpeed > 100,
    };
  }

  detectEmotion(text: string, behavior?: UserBehavior): EmotionState {
    const sentiment = this.analyzeSentiment(text);
    const behaviorPattern = behavior ? this.analyzeBehavior(behavior) : null;

    let emotion: EmotionType = "neutral";
    let confidence = 0.6;
    let intensity = Math.abs(sentiment);

    if (sentiment > 0.3) {
      if (behaviorPattern?.isRushed || behaviorPattern?.isTypingFast) {
        emotion = "excited";
        intensity = Math.max(intensity, 0.8);
      } else {
        emotion = "happy";
        intensity = Math.max(intensity, 0.7);
      }
      confidence = 0.75;
    } else if (sentiment < -0.3) {
      if (behaviorPattern?.isImpatient) {
        emotion = "angry";
        intensity = Math.max(intensity, 0.8);
      } else {
        emotion = "sad";
        intensity = Math.max(intensity, 0.6);
      }
      confidence = 0.7;
    } else if (sentiment < -0.1 && sentiment >= -0.3) {
      emotion = "anxious";
      intensity = 0.6;
      confidence = 0.65;
    } else if (behaviorPattern?.isHesitant) {
      emotion = "confused";
      intensity = 0.5;
      confidence = 0.6;
    } else if (sentiment >= 0.1 && sentiment <= 0.3) {
      emotion = "calm";
      intensity = 0.4;
      confidence = 0.65;
    }

    const emotionState: EmotionState = {
      type: emotion,
      confidence,
      intensity,
      timestamp: Date.now(),
    };

    this.updateEmotion(emotionState);
    return emotionState;
  }

  private updateEmotion(emotion: EmotionState): void {
    const previousEmotion = this.currentEmotion;
    this.currentEmotion = emotion;

    this.emotionHistory.push(emotion);
    if (this.emotionHistory.length > this.maxHistorySize) {
      this.emotionHistory.shift();
    }

    musicEventBus.emitEmotionDetected(emotion.type, emotion.confidence, emotion.intensity);

    if (previousEmotion && previousEmotion.type !== emotion.type) {
      musicEventBus.emitEmotionChanged(previousEmotion.type, emotion.type, emotion.confidence);
    }
  }

  getMusicRecommendation(emotion: EmotionType): EmotionMusicMapping {
    return EMOTION_MUSIC_MAPPINGS[emotion] || EMOTION_MUSIC_MAPPINGS.neutral;
  }

  getRecommendedTracksForEmotion(
    emotion: EmotionType,
    tracks: Array<{
      id: string | number;
      title: string;
      genre?: string;
      tempo?: number;
      energy?: number;
      valence?: number;
    }>
  ): Array<{ id: string | number; score: number; reason: string }> {
    const mapping = this.getMusicRecommendation(emotion);

    const scoredTracks = tracks.map((track) => {
      let score = 0;
      const reasons: string[] = [];

      if (track.genre && mapping.preferredGenres.includes(track.genre)) {
        score += 0.4;
        reasons.push(`适合${mapping.description}的音乐风格`);
      }

      if (track.tempo !== undefined) {
        const [minTempo, maxTempo] = mapping.tempoRange;
        if (track.tempo >= minTempo && track.tempo <= maxTempo) {
          score += 0.25;
          reasons.push("节奏匹配当前心情");
        }
      }

      if (track.energy !== undefined) {
        const [minEnergy, maxEnergy] = mapping.energyRange;
        if (track.energy >= minEnergy && track.energy <= maxEnergy) {
          score += 0.2;
          reasons.push("能量水平合适");
        }
      }

      if (track.valence !== undefined) {
        const [minValence, maxValence] = mapping.valenceRange;
        if (track.valence >= minValence && track.valence <= maxValence) {
          score += 0.15;
          reasons.push("情感基调契合");
        }
      }

      return {
        id: track.id,
        score,
        reason: reasons.length > 0 ? reasons.join("，") : "推荐曲目",
      };
    });

    return scoredTracks.sort((a, b) => b.score - a.score);
  }

  suggestMusicAction(emotion: EmotionType): {
    action: "play" | "pause" | "change_playlist";
    reason: string;
    playlistType?: string;
  } {
    const mapping = this.getMusicRecommendation(emotion);

    switch (emotion) {
      case "sad":
      case "anxious":
        return {
          action: "change_playlist",
          reason: `检测到您可能需要一些${mapping.description}的音乐`,
          playlistType: "healing",
        };
      case "angry":
        return {
          action: "change_playlist",
          reason: "为您推荐一些宣泄情绪的音乐",
          playlistType: "release",
        };
      case "happy":
      case "excited":
        return {
          action: "play",
          reason: "继续保持好心情！为您播放欢快的音乐",
        };
      case "confused":
        return {
          action: "change_playlist",
          reason: "为您推荐有助于集中注意力的音乐",
          playlistType: "focus",
        };
      case "calm":
      case "relaxed":
        return {
          action: "play",
          reason: "享受宁静时光",
        };
      default:
        return {
          action: "play",
          reason: "为您播放音乐",
        };
    }
  }
}

export const emotionMusicBridge = new EmotionMusicBridge();
