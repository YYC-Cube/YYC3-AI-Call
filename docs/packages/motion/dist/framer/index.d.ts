import { TargetAndTransition, Transition } from 'framer-motion';

declare const fadeInUp: TargetAndTransition;
declare const fadeIn: TargetAndTransition;
declare const scaleIn: TargetAndTransition;
declare const slideInFromLeft: TargetAndTransition;
declare const slideInFromRight: TargetAndTransition;
declare const staggerItem: TargetAndTransition;
declare const staggerContainer: {
    readonly transition: {
        readonly staggerChildren: 0.1;
    };
};
declare const springTransition: Transition;
declare const smoothTransition: Transition;
declare const fastTransition: Transition;
declare const hoverScale: TargetAndTransition;
declare const hoverLift: TargetAndTransition;
declare const tapScale: TargetAndTransition;
declare const pulseAnimation: {
    scale: number[];
    opacity: number[];
    transition: {
        duration: number;
        repeat: number;
        ease: "easeInOut";
    };
};
declare const spinAnimation: {
    rotate: number;
    transition: {
        duration: number;
        repeat: number;
        ease: "linear";
    };
};
declare const pageEnterSequence: {
    initial: string;
    animate: string;
    exit: string;
    variants: {
        initial: {
            opacity: number;
        };
        animate: {
            opacity: number;
            transition: {
                staggerChildren: number;
                delayChildren: number;
            };
        };
        exit: {
            opacity: number;
        };
    };
};
declare const cardEnterAnimation: {
    initial: {
        opacity: number;
        y: number;
        scale: number;
    };
    animate: {
        opacity: number;
        y: number;
        scale: number;
        transition: {
            duration: number;
            ease: number[];
        };
    };
};
declare const modalAnimation: {
    initial: {
        opacity: number;
        scale: number;
        y: number;
    };
    animate: {
        opacity: number;
        scale: number;
        y: number;
        transition: {
            duration: number;
            ease: number[];
        };
    };
    exit: {
        opacity: number;
        scale: number;
        y: number;
        transition: {
            duration: number;
        };
    };
};
declare const backgroundAnimation: {
    animate: {
        backgroundPosition: string[];
        transition: {
            duration: number;
            repeat: number;
            repeatType: "reverse";
            ease: string;
        };
    };
};
declare function listItemAnimation(index: number): {
    initial: {
        opacity: number;
        x: number;
    };
    animate: {
        opacity: number;
        x: number;
        transition: {
            delay: number;
            duration: number;
        };
    };
};

export { backgroundAnimation, cardEnterAnimation, fadeIn, fadeInUp, fastTransition, hoverLift, hoverScale, listItemAnimation, modalAnimation, pageEnterSequence, pulseAnimation, scaleIn, slideInFromLeft, slideInFromRight, smoothTransition, spinAnimation, springTransition, staggerContainer, staggerItem, tapScale };
