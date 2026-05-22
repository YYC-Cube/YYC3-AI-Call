import { useCallback, useEffect, useRef } from 'react';
import { getAnimationEngine, type PresetName } from '../waapi/index';

export function useAnimation() {
  const engine = useRef(getAnimationEngine());

  useEffect(() => () => engine.current.cleanup(), []);

  const animate = useCallback(
    (el: HTMLElement, preset: PresetName, overrides?: Partial<KeyframeAnimationOptions>) =>
      engine.current.animateWithPreset(el, preset, overrides),
    [],
  );

  const onScroll = useCallback(
    (el: HTMLElement, preset: PresetName, opts?: { threshold?: number; rootMargin?: string; once?: boolean }) =>
      engine.current.onScroll(el, preset, opts),
    [],
  );

  const onHover = useCallback(
    (el: HTMLElement, enter: PresetName, leave?: PresetName) =>
      engine.current.onHover(el, enter, leave),
    [],
  );

  return { animate, onScroll, onHover, engine: engine.current };
}
