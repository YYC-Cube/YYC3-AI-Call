export interface RippleOptions {
  color?: string;
  duration?: number;
}

export function createRipple(
  event: { clientX: number; clientY: number; currentTarget: HTMLElement },
  options: RippleOptions = {},
): void {
  const { color = 'rgba(99, 102, 241, 0.4)', duration = 600 } = options;
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = color;
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'scale(0)';
  ripple.style.opacity = '1';
  ripple.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  requestAnimationFrame(() => {
    ripple.style.transform = 'scale(2)';
    ripple.style.opacity = '0';
  });

  setTimeout(() => ripple.remove(), duration);
}
