export type MusicCommand =
  | "play"
  | "pause"
  | "toggle"
  | "next"
  | "previous"
  | "volume_up"
  | "volume_down"
  | "mute"
  | "unmute"
  | "like"
  | "unlike"
  | "shuffle"
  | "repeat"
  | "seek"
  | "play_index";

export type MusicEventType =
  | "music:command"
  | "music:state_change"
  | "music:track_change"
  | "music:volume_change"
  | "music:progress_update"
  | "music:error"
  | "voice:command_detected"
  | "voice:transcript"
  | "emotion:detected"
  | "emotion:changed";

export interface MusicState {
  isPlaying: boolean;
  currentTrackIndex: number;
  progress: number;
  volume: number;
  muted: boolean;
  likedTracks: Set<number>;
  shuffle: boolean;
  repeat: boolean;
}

export interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  color: string;
  suitableEmotions?: string[];
}

export interface MusicEvent {
  type: MusicEventType;
  payload: Record<string, unknown>;
}

export type MusicEventListener = (event: MusicEvent) => void;

const ALL_EVENT_TYPES: MusicEventType[] = [
  "music:command",
  "music:state_change",
  "music:track_change",
  "music:volume_change",
  "music:progress_update",
  "music:error",
  "voice:command_detected",
  "voice:transcript",
  "emotion:detected",
  "emotion:changed",
];

export class MusicEventBus {
  private listeners: Map<MusicEventType, Set<MusicEventListener>> = new Map();
  private eventHistory: MusicEvent[] = [];
  private maxHistorySize = 100;

  subscribe(eventType: MusicEventType, listener: MusicEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  subscribeAll(listener: MusicEventListener): () => void {
    const unsubscribers = ALL_EVENT_TYPES.map((type) => this.subscribe(type, listener));
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  emit(event: MusicEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch {
          // swallow listener errors
        }
      });
    }
  }

  emitCommand(command: MusicCommand, source: string = "ui", params?: Record<string, unknown>): void {
    this.emit({
      type: "music:command",
      payload: { command, params, source, timestamp: Date.now() },
    });
  }

  emitEmotionDetected(emotion: string, confidence: number, intensity: number, source: string = "multimodal"): void {
    this.emit({
      type: "emotion:detected",
      payload: { emotion, confidence, intensity, source, timestamp: Date.now() },
    });
  }

  emitEmotionChanged(previousEmotion: string, currentEmotion: string, confidence: number): void {
    this.emit({
      type: "emotion:changed",
      payload: { previousEmotion, currentEmotion, confidence, timestamp: Date.now() },
    });
  }

  emitError(error: string, code?: string): void {
    this.emit({
      type: "music:error",
      payload: { error, code, timestamp: Date.now() },
    });
  }

  getHistory(): MusicEvent[] {
    return [...this.eventHistory];
  }

  getRecentEvents(count: number = 10): MusicEvent[] {
    return this.eventHistory.slice(-count);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  getListenerCount(eventType?: MusicEventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size || 0;
    }
    let total = 0;
    this.listeners.forEach((set) => {
      total += set.size;
    });
    return total;
  }
}

export const musicEventBus = new MusicEventBus();
