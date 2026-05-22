import { b as PresetName, A as AnimationEngine } from '../engine-CndCDvy8.js';
import * as react from 'react';

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

export { useAnimation, useScrollReveal };
