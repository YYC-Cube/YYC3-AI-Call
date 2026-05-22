import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFadeInStyle } from './fade-in';
import { createRipple } from './ripple';
import { animateNumber } from './animate-number';

describe('getFadeInStyle', () => {
  it('returns hidden style when not visible', () => {
    const style = getFadeInStyle(false);
    expect(style.opacity).toBe(0);
    expect(style.transform).toContain('translateY');
  });

  it('returns visible style when visible', () => {
    const style = getFadeInStyle(true);
    expect(style.opacity).toBe(1);
    expect(style.transform).toBe('none');
  });

  it('respects direction', () => {
    const left = getFadeInStyle(false, { direction: 'left' });
    expect(left.transform).toContain('translateX');

    const none = getFadeInStyle(false, { direction: 'none' });
    expect(none.transform).toBe('none');
  });

  it('respects distance', () => {
    const style = getFadeInStyle(false, { direction: 'up', distance: 20 });
    expect(style.transform).toBe('translateY(20px)');
  });
});

describe('createRipple', () => {
  it('creates a ripple element', () => {
    const el = document.createElement('button');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;
    createRipple({ clientX: 50, clientY: 25, currentTarget: el });
    const ripple = el.querySelector('span');
    expect(ripple).toBeTruthy();
  });

  it('removes ripple after duration', () => {
    vi.useFakeTimers();
    const el = document.createElement('button');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;
    createRipple({ clientX: 50, clientY: 25, currentTarget: el }, { duration: 100 });
    expect(el.querySelector('span')).toBeTruthy();
    vi.advanceTimersByTime(150);
    expect(el.querySelector('span')).toBeFalsy();
    vi.useRealTimers();
  });
});

describe('animateNumber', () => {
  it('cancels animation', () => {
    vi.useFakeTimers();
    const el = document.createElement('span');
    el.textContent = '0';
    const cancel = animateNumber(el, 0, 100, 1000);
    cancel();
    vi.advanceTimersByTime(2000);
    expect(el.textContent).toBe('0');
    vi.useRealTimers();
  });
});
