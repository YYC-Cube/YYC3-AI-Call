import * as react_jsx_runtime from 'react/jsx-runtime';
import React__default, { ButtonHTMLAttributes, HTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}
declare function Button({ children, variant, size, loading, leftIcon, rightIcon, className, disabled, ...props }: ButtonProps): react_jsx_runtime.JSX.Element;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outlined' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}
declare function Card({ children, variant, padding, className, ...props }: CardProps): react_jsx_runtime.JSX.Element;
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
}
declare function CardHeader({ children, className, ...props }: CardHeaderProps): react_jsx_runtime.JSX.Element;
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
}
declare function CardBody({ children, className, ...props }: CardBodyProps): react_jsx_runtime.JSX.Element;
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
}
declare function CardFooter({ children, className, ...props }: CardFooterProps): react_jsx_runtime.JSX.Element;

/**
 * file input.tsx
 * description Input 输入框组件
 * module @yyc3/ui
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.1
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ui]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Input 输入框组件
 */

interface InputProps extends React__default.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React__default.ReactNode;
    rightIcon?: React__default.ReactNode;
}
declare const Input: React__default.ForwardRefExoticComponent<InputProps & React__default.RefAttributes<HTMLInputElement>>;

/**
 * file modal.tsx
 * description Modal 弹窗组件
 * module @yyc3/ui
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.1
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ui]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Modal 弹窗组件
 */

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    children: React__default.ReactNode;
}
declare function Modal({ isOpen, onClose, title, size, closeOnOverlayClick, closeOnEscape, children, }: ModalProps): React__default.ReactPortal | null;

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
declare function Container({ children, maxWidth, className, ...props }: ContainerProps): react_jsx_runtime.JSX.Element;
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: 'row' | 'column';
    spacing?: 'none' | 'sm' | 'md' | 'lg';
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}
declare function Stack({ children, direction, spacing, align, justify, className, ...props }: StackProps): react_jsx_runtime.JSX.Element;
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
    cols?: 1 | 2 | 3 | 4 | 6 | 12;
    gap?: 'none' | 'sm' | 'md' | 'lg';
}
declare function Grid({ children, cols, gap, className, ...props }: GridProps): react_jsx_runtime.JSX.Element;

export { Button, type ButtonProps, Card, CardBody, type CardBodyProps, CardFooter, type CardFooterProps, CardHeader, type CardHeaderProps, type CardProps, Container, type ContainerProps, Grid, type GridProps, Input, type InputProps, Modal, type ModalProps, Stack, type StackProps };
