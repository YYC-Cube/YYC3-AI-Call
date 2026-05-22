import { PRESETS, type PresetName } from './presets';

export interface SequenceStep {
  element: HTMLElement;
  preset?: PresetName;
  keyframes?: Keyframe[];
  options?: KeyframeAnimationOptions;
  delay?: number;
}

export class AnimationEngine {
  private animations = new Map<string, Animation>();
  private observers = new Map<string, IntersectionObserver>();

  animate(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {},
  ): Animation {
    const animation = element.animate(keyframes, {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards',
      ...options,
    });
    const id = `${Date.now()}_${Math.random()}`;
    this.animations.set(id, animation);
    animation.addEventListener('finish', () => this.animations.delete(id));
    return animation;
  }

  animateWithPreset(
    element: HTMLElement,
    preset: PresetName,
    overrides?: Partial<KeyframeAnimationOptions>,
  ): Animation {
    const p = PRESETS[preset];
    return this.animate(element, p.keyframes, { ...p.options, ...overrides });
  }

  async sequence(steps: SequenceStep[]): Promise<void> {
    for (const step of steps) {
      if (step.delay) await this.delay(step.delay);
      let anim: Animation;
      if (step.preset) {
        anim = this.animateWithPreset(step.element, step.preset, step.options);
      } else if (step.keyframes) {
        anim = this.animate(step.element, step.keyframes, step.options);
      } else {
        continue;
      }
      await anim.finished;
    }
  }

  async parallel(steps: Omit<SequenceStep, 'delay'>[]): Promise<void> {
    await Promise.all(
      steps.map((step) => {
        if (step.preset) return this.animateWithPreset(step.element, step.preset, step.options).finished;
        if (step.keyframes) return this.animate(step.element, step.keyframes, step.options).finished;
        return Promise.resolve();
      }),
    );
  }

  onScroll(
    element: HTMLElement,
    preset: PresetName,
    options?: { threshold?: number; rootMargin?: string; once?: boolean },
  ): void {
    const { threshold = 0.1, rootMargin = '0px', once = true } = options ?? {};
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.animateWithPreset(element, preset);
            if (once) observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    this.observers.set(`scroll_${Date.now()}`, observer);
  }

  onHover(
    element: HTMLElement,
    enterPreset: PresetName,
    leavePreset?: PresetName,
  ): () => void {
    let current: Animation | null = null;
    const onEnter = () => { current?.cancel(); current = this.animateWithPreset(element, enterPreset); };
    const onLeave = () => { current?.cancel(); if (leavePreset) current = this.animateWithPreset(element, leavePreset); };
    element.addEventListener('mouseenter', onEnter);
    element.addEventListener('mouseleave', onLeave);
    return () => {
      element.removeEventListener('mouseenter', onEnter);
      element.removeEventListener('mouseleave', onLeave);
    };
  }

  onClick(element: HTMLElement, preset: PresetName): () => void {
    const handler = () => this.animateWithPreset(element, preset);
    element.addEventListener('click', handler);
    return () => element.removeEventListener('click', handler);
  }

  stopAll(): void {
    this.animations.forEach((a) => a.cancel());
    this.animations.clear();
  }

  cleanup(): void {
    this.stopAll();
    this.observers.forEach((o) => o.disconnect());
    this.observers.clear();
  }

  get stats() {
    return { activeAnimations: this.animations.size, activeObservers: this.observers.size };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

let _instance: AnimationEngine | null = null;
export function getAnimationEngine(): AnimationEngine {
  if (!_instance) _instance = new AnimationEngine();
  return _instance;
}
