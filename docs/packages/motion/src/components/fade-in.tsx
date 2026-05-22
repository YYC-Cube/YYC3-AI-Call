import { useEffect, useState, type ReactNode, type MouseEvent } from 'react';
import { getFadeInStyle, type Direction } from '../css/fade-in';

export interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  duration?: number;
  distance?: number;
  className?: string;
  style?: Record<string, string | number>;
  onClick?: (e: MouseEvent) => void;
  as?: keyof HTMLElementTagNameMap;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.5,
  distance = 12,
  className,
  style,
  onClick,
}: FadeInProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), Math.min(delay * 1000, 1200));
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={className}
      onClick={onClick}
      style={{ ...style, ...getFadeInStyle(show, { delay: 0, direction, duration, distance }) }}
    >
      {children}
    </div>
  );
}
