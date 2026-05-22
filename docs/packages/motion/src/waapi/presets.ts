export type PresetName =
  | 'fadeIn' | 'fadeOut'
  | 'scaleIn' | 'scaleOut'
  | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown'
  | 'rotateIn'
  | 'bounce'
  | 'shake'
  | 'pulse'
  | 'spin'
  | 'heartbeat';

export interface PresetDefinition {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

export const PRESETS: Record<PresetName, PresetDefinition> = {
  fadeIn: {
    keyframes: [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    options: { duration: 300, easing: 'ease-out', fill: 'forwards' },
  },
  fadeOut: {
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-20px)' },
    ],
    options: { duration: 300, easing: 'ease-in', fill: 'forwards' },
  },
  scaleIn: {
    keyframes: [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    options: { duration: 200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' },
  },
  scaleOut: {
    keyframes: [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.8)' },
    ],
    options: { duration: 200, easing: 'ease-in', fill: 'forwards' },
  },
  slideInLeft: {
    keyframes: [
      { opacity: 0, transform: 'translateX(-100%)' },
      { opacity: 1, transform: 'translateX(0)' },
    ],
    options: { duration: 400, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' },
  },
  slideInRight: {
    keyframes: [
      { opacity: 0, transform: 'translateX(100%)' },
      { opacity: 1, transform: 'translateX(0)' },
    ],
    options: { duration: 400, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' },
  },
  slideInUp: {
    keyframes: [
      { opacity: 0, transform: 'translateY(100%)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    options: { duration: 400, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' },
  },
  slideInDown: {
    keyframes: [
      { opacity: 0, transform: 'translateY(-100%)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    options: { duration: 400, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' },
  },
  rotateIn: {
    keyframes: [
      { opacity: 0, transform: 'rotate(-180deg) scale(0.8)' },
      { opacity: 1, transform: 'rotate(0deg) scale(1)' },
    ],
    options: { duration: 500, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' },
  },
  bounce: {
    keyframes: [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-10px)' },
      { transform: 'translateY(0)' },
      { transform: 'translateY(-5px)' },
      { transform: 'translateY(0)' },
    ],
    options: { duration: 600, easing: 'ease-out', fill: 'forwards' },
  },
  shake: {
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' },
    ],
    options: { duration: 500, easing: 'ease-in-out', fill: 'forwards' },
  },
  pulse: {
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    options: { duration: 1000, easing: 'ease-in-out', fill: 'forwards' },
  },
  spin: {
    keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    options: { duration: 1000, easing: 'linear', fill: 'forwards', iterations: Infinity } as KeyframeAnimationOptions,
  },
  heartbeat: {
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.3)' },
      { transform: 'scale(1)' },
      { transform: 'scale(1.3)' },
      { transform: 'scale(1)' },
    ],
    options: { duration: 1300, easing: 'ease-in-out', fill: 'forwards' },
  },
};
