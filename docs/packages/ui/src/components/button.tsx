/**
 * file button.tsx
 * description Button 按钮组件
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
 * brief Button 按钮组件
 */
import type { ButtonHTMLAttributes } from 'react'
import { classNames } from '../core/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'family-button',
        `family-button--${variant}`,
        `family-button--${size}`,
        loading && 'family-button--loading',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="family-button__spinner" />}
      {leftIcon && <span className="family-button__icon family-button__icon--left">{leftIcon}</span>}
      <span className="family-button__content">{children}</span>
      {rightIcon && <span className="family-button__icon family-button__icon--right">{rightIcon}</span>}
    </button>
  )
}

export default Button
