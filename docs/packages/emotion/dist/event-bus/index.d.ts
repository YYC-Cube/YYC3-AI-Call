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

export { type MusicCommand, type MusicEvent, MusicEventBus, type MusicEventListener, type MusicEventType, type MusicState, type Track, musicEventBus };
