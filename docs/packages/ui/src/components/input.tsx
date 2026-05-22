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
import React, { forwardRef } from 'react'
import { classNames } from '../core/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="family-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="family-input__label">
            {label}
          </label>
        )}
        <div className="family-input-container">
          {leftIcon && <span className="family-input__icon family-input__icon--left">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={classNames(
              'family-input',
              error && 'family-input--error',
              leftIcon && 'family-input--has-left-icon',
              rightIcon && 'family-input--has-right-icon',
              className
            )}
            {...props}
          />
          {rightIcon && <span className="family-input__icon family-input__icon--right">{rightIcon}</span>}
        </div>
        {error && <span className="family-input__error">{error}</span>}
        {helperText && !error && <span className="family-input__helper">{helperText}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
