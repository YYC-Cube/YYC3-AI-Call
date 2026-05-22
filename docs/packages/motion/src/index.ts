export { getFadeInStyle, type Direction, type FadeInStyleOptions } from './css/fade-in';
export { createRipple, type RippleOptions } from './css/ripple';
export { animateNumber } from './css/animate-number';
export { cssKeyframes, injectKeyframes } from './css/keyframes';

export { AnimationEngine, getAnimationEngine, type SequenceStep } from './waapi/engine';
export { PRESETS, type PresetName, type PresetDefinition } from './waapi/presets';
export { easings } from './waapi/index';

export { useAnimation } from './hooks/use-animation';
export { useScrollReveal } from './hooks/use-scroll-reveal';

export { FadeIn, type FadeInProps } from './components/fade-in';
export { LazyWrap, type LazyWrapProps } from './components/lazy-wrap';
