export const cssKeyframes = {
  ripple: `@keyframes yyc3-ripple {
  from { transform: scale(0); opacity: 1; }
  to { transform: scale(2); opacity: 0; }
}`,
  pulseGlow: `@keyframes yyc3-pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
}`,
  slideInBottom: `@keyframes yyc3-slide-in-bottom {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`,
  fadeInScale: `@keyframes yyc3-fade-in-scale {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}`,
  shimmer: `@keyframes yyc3-shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}`,
  float: `@keyframes yyc3-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}`,
  rotateSlow: `@keyframes yyc3-rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
  gradientShift: `@keyframes yyc3-gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}`,
} as const;

export function injectKeyframes(): void {
  if (typeof document === 'undefined') return;
  const id = 'yyc3-motion-keyframes';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = Object.values(cssKeyframes).join('\n\n');
  document.head.appendChild(style);
}
