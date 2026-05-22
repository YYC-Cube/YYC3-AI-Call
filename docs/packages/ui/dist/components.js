import { jsxs, jsx } from 'react/jsx-runtime';
import React2, { forwardRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// src/core/utils.ts
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: classNames(
        "family-button",
        `family-button--${variant}`,
        `family-button--${size}`,
        loading && "family-button--loading",
        className
      ),
      disabled: disabled || loading,
      ...props,
      children: [
        loading && /* @__PURE__ */ jsx("span", { className: "family-button__spinner" }),
        leftIcon && /* @__PURE__ */ jsx("span", { className: "family-button__icon family-button__icon--left", children: leftIcon }),
        /* @__PURE__ */ jsx("span", { className: "family-button__content", children }),
        rightIcon && /* @__PURE__ */ jsx("span", { className: "family-button__icon family-button__icon--right", children: rightIcon })
      ]
    }
  );
}
function Card({
  children,
  variant = "default",
  padding = "md",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-card",
        `family-card--${variant}`,
        `family-card--padding-${padding}`,
        className
      ),
      ...props,
      children
    }
  );
}
function CardHeader({ children, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("family-card__header", className), ...props, children });
}
function CardBody({ children, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("family-card__body", className), ...props, children });
}
function CardFooter({ children, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("family-card__footer", className), ...props, children });
}
var Input = forwardRef(
  ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    return /* @__PURE__ */ jsxs("div", { className: "family-input-wrapper", children: [
      label && /* @__PURE__ */ jsx("label", { htmlFor: inputId, className: "family-input__label", children: label }),
      /* @__PURE__ */ jsxs("div", { className: "family-input-container", children: [
        leftIcon && /* @__PURE__ */ jsx("span", { className: "family-input__icon family-input__icon--left", children: leftIcon }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref,
            id: inputId,
            className: classNames(
              "family-input",
              error && "family-input--error",
              leftIcon && "family-input--has-left-icon",
              rightIcon && "family-input--has-right-icon",
              className
            ),
            ...props
          }
        ),
        rightIcon && /* @__PURE__ */ jsx("span", { className: "family-input__icon family-input__icon--right", children: rightIcon })
      ] }),
      error && /* @__PURE__ */ jsx("span", { className: "family-input__error", children: error }),
      helperText && !error && /* @__PURE__ */ jsx("span", { className: "family-input__helper", children: helperText })
    ] });
  }
);
Input.displayName = "Input";
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}
function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children
}) {
  const modalRef = React2.useRef(null);
  useClickOutside(modalRef, () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  });
  useEffect(() => {
    if (!closeOnEscape) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, closeOnEscape]);
  if (!isOpen) return null;
  return createPortal(
    /* @__PURE__ */ jsx("div", { className: "family-modal-overlay", children: /* @__PURE__ */ jsxs(
      "div",
      {
        ref: modalRef,
        className: classNames("family-modal", `family-modal--${size}`),
        role: "dialog",
        "aria-modal": "true",
        children: [
          title && /* @__PURE__ */ jsxs("div", { className: "family-modal__header", children: [
            /* @__PURE__ */ jsx("h2", { className: "family-modal__title", children: title }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "family-modal__close",
                onClick: onClose,
                "aria-label": "\u5173\u95ED",
                children: "\xD7"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "family-modal__body", children })
        ]
      }
    ) }),
    document.body
  );
}
function Container({
  children,
  maxWidth = "lg",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-container",
        `family-container--${maxWidth}`,
        className
      ),
      ...props,
      children
    }
  );
}
function Stack({
  children,
  direction = "column",
  spacing = "md",
  align = "stretch",
  justify = "start",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-stack",
        `family-stack--${direction}`,
        `family-stack--spacing-${spacing}`,
        `family-stack--align-${align}`,
        `family-stack--justify-${justify}`,
        className
      ),
      ...props,
      children
    }
  );
}
function Grid({
  children,
  cols = 3,
  gap = "md",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-grid",
        `family-grid--cols-${cols}`,
        `family-grid--gap-${gap}`,
        className
      ),
      ...props,
      children
    }
  );
}

export { Button, Card, CardBody, CardFooter, CardHeader, Container, Grid, Input, Modal, Stack };
//# sourceMappingURL=components.js.map
//# sourceMappingURL=components.js.map