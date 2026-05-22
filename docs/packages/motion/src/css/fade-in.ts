export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export interface FadeInStyleOptions {
  delay?: number;
  direction?: Direction;
  duration?: number;
  distance?: number;
}

const DIRECTION_MAP: Record<Direction, (d: number) => string> = {
  up: (d) => `translateY(${d}px)`,
  down: (d) => `translateY(-${d}px)`,
  left: (d) => `translateX(${d}px)`,
  right: (d) => `translateX(-${d}px)`,
  none: () => 'none',
};

export function getFadeInStyle(visible: boolean, options: FadeInStyleOptions = {}): Record<string, string | number> {
  const { delay = 0, direction = 'up', duration = 0.5, distance = 12 } = options;
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : DIRECTION_MAP[direction](distance),
    transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`,
  };
}
