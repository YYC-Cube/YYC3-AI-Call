export { D as Direction, F as FadeInStyleOptions, g as getFadeInStyle } from '../fade-in-BXZJzvA7.js';

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

export { type RippleOptions, animateNumber, createRipple, cssKeyframes, injectKeyframes };
