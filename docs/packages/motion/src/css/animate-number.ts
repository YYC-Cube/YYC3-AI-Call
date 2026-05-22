export function animateNumber(
  element: HTMLElement,
  start: number,
  end: number,
  duration = 1000,
  decimals = 0,
): () => void {
  const startTime = Date.now();
  const range = end - start;
  let cancelled = false;

  const tick = () => {
    if (cancelled) return;
    const progress = Math.min((Date.now() - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = (start + range * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  return () => { cancelled = true; };
}
