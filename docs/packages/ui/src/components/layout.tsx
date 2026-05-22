/**
 * file layout.tsx
 * description Layout 布局组件
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
 * brief Layout 布局组件
 */
import type { HTMLAttributes } from 'react'
import { classNames } from '../core/utils'

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Container({
  children,
  maxWidth = 'lg',
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={classNames(
        'family-container',
        `family-container--${maxWidth}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}

export function Stack({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className,
  ...props
}: StackProps) {
  return (
    <div
      className={classNames(
        'family-stack',
        `family-stack--${direction}`,
        `family-stack--spacing-${spacing}`,
        `family-stack--align-${align}`,
        `family-stack--justify-${justify}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg'
}

export function Grid({
  children,
  cols = 3,
  gap = 'md',
  className,
  ...props
}: GridProps) {
  return (
    <div
      className={classNames(
        'family-grid',
        `family-grid--cols-${cols}`,
        `family-grid--gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
