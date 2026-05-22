import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode, MouseEvent, LazyExoticComponent, ComponentType } from 'react';
import { D as Direction } from '../fade-in-BXZJzvA7.js';

interface FadeInProps {
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
declare function FadeIn({ children, delay, direction, duration, distance, className, style, onClick, }: FadeInProps): react_jsx_runtime.JSX.Element;

interface LazyWrapProps {
    Component: LazyExoticComponent<ComponentType>;
    fallback?: ReactNode;
}
declare function LazyWrap({ Component, fallback }: LazyWrapProps): react_jsx_runtime.JSX.Element;

export { FadeIn, type FadeInProps, LazyWrap, type LazyWrapProps };
