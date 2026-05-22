type PresetName = 'fadeIn' | 'fadeOut' | 'scaleIn' | 'scaleOut' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' | 'rotateIn' | 'bounce' | 'shake' | 'pulse' | 'spin' | 'heartbeat';
interface PresetDefinition {
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
}
declare const PRESETS: Record<PresetName, PresetDefinition>;

interface SequenceStep {
    element: HTMLElement;
    preset?: PresetName;
    keyframes?: Keyframe[];
    options?: KeyframeAnimationOptions;
    delay?: number;
}
declare class AnimationEngine {
    private animations;
    private observers;
    animate(element: HTMLElement, keyframes: Keyframe[], options?: KeyframeAnimationOptions): Animation;
    animateWithPreset(element: HTMLElement, preset: PresetName, overrides?: Partial<KeyframeAnimationOptions>): Animation;
    sequence(steps: SequenceStep[]): Promise<void>;
    parallel(steps: Omit<SequenceStep, 'delay'>[]): Promise<void>;
    onScroll(element: HTMLElement, preset: PresetName, options?: {
        threshold?: number;
        rootMargin?: string;
        once?: boolean;
    }): void;
    onHover(element: HTMLElement, enterPreset: PresetName, leavePreset?: PresetName): () => void;
    onClick(element: HTMLElement, preset: PresetName): () => void;
    stopAll(): void;
    cleanup(): void;
    get stats(): {
        activeAnimations: number;
        activeObservers: number;
    };
    private delay;
}
declare function getAnimationEngine(): AnimationEngine;

export { AnimationEngine as A, PRESETS as P, type SequenceStep as S, type PresetDefinition as a, type PresetName as b, getAnimationEngine as g };
