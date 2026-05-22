/**
 * file card.tsx
 * description Card 卡片组件
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
 * brief Card 卡片组件
 */
import type { HTMLAttributes } from 'react'
import { classNames } from '../core/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={classNames(
        'family-card',
        `family-card--${variant}`,
        `family-card--padding-${padding}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={classNames('family-card__header', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={classNames('family-card__body', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={classNames('family-card__footer', className)} {...props}>
      {children}
    </div>
  )
}

export default Card
