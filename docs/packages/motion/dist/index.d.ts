import * as react from 'react';
import { ReactNode, MouseEvent, LazyExoticComponent, ComponentType } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';
interface FadeInStyleOptions {
    delay?: number;
    direction?: Direction;
    duration?: number;
    distance?: number;
}
declare function getFadeInStyle(visible: boolean, options?: FadeInStyleOptions): Record<string, string | number>;

interface RippleOptions {
    color?: string;
    duration?: number;
}
declare function createRipple(event: {
    clientX: number;
    clientY: number;
    currentTarget: HTMLElement;
}, options?: RippleOptions): void;

declare function animateNumber(element: HTMLElement, start: number, end: number, duration?: number, decimals?: number): () => void;

declare const cssKeyframes: {
    readonly ripple: "@keyframes yyc3-ripple {\n  from { transform: scale(0); opacity: 1; }\n  to { transform: scale(2); opacity: 0; }\n}";
    readonly pulseGlow: "@keyframes yyc3-pulse-glow {\n  0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.3); }\n  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }\n}";
    readonly slideInBottom: "@keyframes yyc3-slide-in-bottom {\n  from { transform: translateY(100%); opacity: 0; }\n  to { transform: translateY(0); opacity: 1; }\n}";
    readonly fadeInScale: "@keyframes yyc3-fade-in-scale {\n  from { transform: scale(0.9); opacity: 0; }\n  to { transform: scale(1); opacity: 1; }\n}";
    readonly shimmer: "@keyframes yyc3-shimmer {\n  0% { background-position: -1000px 0; }\n  100% { background-position: 1000px 0; }\n}";
    readonly float: "@keyframes yyc3-float {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-10px); }\n}";
    readonly rotateSlow: "@keyframes yyc3-rotate-slow {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}";
    readonly gradientShift: "@keyframes yyc3-gradient-shift {\n  0%, 100% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n}";
};
declare function injectKeyframes(): void;

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

declare const easings: {
    readonly easeInQuad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)";
    readonly easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    readonly easeInOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)";
    readonly easeInCubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)";
    readonly easeOutCubic: "cubic-bezier(0.215, 0.61, 0.355, 1)";
    readonly easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)";
    readonly easeOutBack: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    readonly easeInOutBack: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
};

declare function useAnimation(): {
    animate: (el: HTMLElement, preset: PresetName, overrides?: Partial<KeyframeAnimationOptions>) => Animation;
    onScroll: (el: HTMLElement, preset: PresetName, opts?: {
        threshold?: number;
        rootMargin?: string;
        once?: boolean;
    }) => void;
    onHover: (el: HTMLElement, enter: PresetName, leave?: PresetName) => () => void;
    engine: AnimationEngine;
};

declare function useScrollReveal(options?: {
    threshold?: number;
    rootMargin?: string;
}): {
    ref: react.MutableRefObject<HTMLElement | null>;
    visible: boolean;
};

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    direction?: Direction;
    duration?: number;
    distance?: number;
    className?: string;
    style?: Record<string, string | number>;
    onClick?: (e: MouseEvent) => void;
    as?: keyof HTMLElementTagNameMap;
}
declare function FadeIn({ children, delay, direction, duration, distance, className, style, onClick, }: FadeInProps): react_jsx_runtime.JSX.Element;

interface LazyWrapProps {
    Component: LazyExoticComponent<ComponentType>;
    fallback?: ReactNode;
}
declare function LazyWrap({ Component, fallback }: LazyWrapProps): react_jsx_runtime.JSX.Element;

export { AnimationEngine, type Direction, FadeIn, type FadeInProps, type FadeInStyleOptions, LazyWrap, type LazyWrapProps, PRESETS, type PresetDefinition, type PresetName, type RippleOptions, type SequenceStep, animateNumber, createRipple, cssKeyframes, easings, getAnimationEngine, getFadeInStyle, injectKeyframes, useAnimation, useScrollReveal };
