import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimationEngine } from './engine';
import { PRESETS } from './presets';

describe('AnimationEngine', () => {
  let engine: AnimationEngine;

  beforeEach(() => {
    engine = new AnimationEngine();
  });

  it('animates with preset', () => {
    const el = document.createElement('div');
    const mockAnimate = vi.fn(() => ({
      addEventListener: vi.fn(),
      finished: Promise.resolve(),
    }));
    el.animate = mockAnimate;
    engine.animateWithPreset(el, 'fadeIn');
    expect(mockAnimate).toHaveBeenCalledWith(
      PRESETS.fadeIn.keyframes,
      expect.objectContaining({ duration: 300 }),
    );
  });

  it('runs sequence', async () => {
    const el = document.createElement('div');
    el.animate = vi.fn(() => ({
      addEventListener: vi.fn((_: string, cb: () => void) => cb()),
      finished: Promise.resolve(),
    }));
    await engine.sequence([
      { element: el, preset: 'fadeIn' },
      { element: el, preset: 'scaleIn' },
    ]);
    expect(el.animate).toHaveBeenCalledTimes(2);
  });

  it('runs parallel', async () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    el1.animate = vi.fn(() => ({ addEventListener: vi.fn(), finished: Promise.resolve() }));
    el2.animate = vi.fn(() => ({ addEventListener: vi.fn(), finished: Promise.resolve() }));
    await engine.parallel([
      { element: el1, preset: 'fadeIn' },
      { element: el2, preset: 'scaleIn' },
    ]);
    expect(el1.animate).toHaveBeenCalled();
    expect(el2.animate).toHaveBeenCalled();
  });

  it('cleanup clears all', () => {
    const el = document.createElement('div');
    const anim = { cancel: vi.fn(), addEventListener: vi.fn() };
    el.animate = vi.fn(() => anim);
    engine.animateWithPreset(el, 'fadeIn');
    engine.cleanup();
    expect(anim.cancel).toHaveBeenCalled();
  });

  it('reports stats', () => {
    const stats = engine.stats;
    expect(stats).toHaveProperty('activeAnimations');
    expect(stats).toHaveProperty('activeObservers');
  });
});

describe('PRESETS', () => {
  it('has all expected presets', () => {
    const names = Object.keys(PRESETS);
    expect(names).toContain('fadeIn');
    expect(names).toContain('fadeOut');
    expect(names).toContain('scaleIn');
    expect(names).toContain('bounce');
    expect(names).toContain('shake');
    expect(names).toContain('pulse');
    expect(names).toContain('spin');
    expect(names.length).toBeGreaterThanOrEqual(13);
  });
});
