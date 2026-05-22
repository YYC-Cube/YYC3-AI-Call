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
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { classNames } from '../core/utils'
import { useClickOutside } from '../core/hooks'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  children: React.ReactNode
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  useClickOutside(modalRef, () => {
    if (closeOnOverlayClick) {
      onClose()
    }
  })

  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen) return null

  return createPortal(
    <div className="family-modal-overlay">
      <div
        ref={modalRef}
        className={classNames('family-modal', `family-modal--${size}`)}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="family-modal__header">
            <h2 className="family-modal__title">{title}</h2>
            <button
              className="family-modal__close"
              onClick={onClose}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        )}
        <div className="family-modal__body">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
