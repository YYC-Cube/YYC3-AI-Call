import type { Transition, TargetAndTransition } from 'framer-motion';

export const fadeInUp: TargetAndTransition = { opacity: 0, y: 20 };
export const fadeIn: TargetAndTransition = { opacity: 0 };
export const scaleIn: TargetAndTransition = { opacity: 0, scale: 0.9 };
export const slideInFromLeft: TargetAndTransition = { opacity: 0, x: -50 };
export const slideInFromRight: TargetAndTransition = { opacity: 0, x: 50 };
export const staggerItem: TargetAndTransition = { opacity: 0, y: 20 };

export const staggerContainer = {
  transition: { staggerChildren: 0.1 },
} as const;

export const springTransition: Transition = { type: 'spring', stiffness: 300, damping: 30 };
export const smoothTransition: Transition = { duration: 0.3, ease: 'easeInOut' };
export const fastTransition: Transition = { duration: 0.15, ease: 'easeOut' };

export const hoverScale: TargetAndTransition = { scale: 1.05 };
export const hoverLift: TargetAndTransition = { y: -4 };
export const tapScale: TargetAndTransition = { scale: 0.95 };

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
};

export const spinAnimation = {
  rotate: 360,
  transition: { duration: 1, repeat: Infinity, ease: 'linear' as const },
};

export const pageEnterSequence = {
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  variants: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
    exit: { opacity: 0 },
  },
};

export const cardEnterAnimation = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as number[] },
  },
};

export const modalAnimation = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as number[] },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

export const backgroundAnimation = {
  animate: {
    backgroundPosition: ['0% 0%', '100% 100%'],
    transition: { duration: 20, repeat: Infinity, repeatType: 'reverse' as const, ease: 'linear' },
  },
};

export function listItemAnimation(index: number) {
  return {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { delay: index * 0.05, duration: 0.3 } },
  };
}
