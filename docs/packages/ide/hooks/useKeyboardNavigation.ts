/**
 * @file useKeyboardNavigation.ts
 * @description 键盘导航 Hook - 支持 Tab 键导航、快捷键、焦点管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags keyboard,navigation,accessibility,hook
 */

import { useEffect, useCallback, useRef } from "react";

interface KeyboardNavigationOptions {
  enabled?: boolean;
  shortcuts?: Record<string, () => void>;
  focusTrap?: boolean;
}

/**
 * 键盘导航 Hook
 */
export function useKeyboardNavigation({
  enabled = true,
  shortcuts = {},
  focusTrap = false,
}: KeyboardNavigationOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);

  // 注册快捷键
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, shiftKey, altKey, metaKey } = event;

      // 构建快捷键标识
      const modifiers = [];
      if (ctrlKey) modifiers.push("Ctrl");
      if (shiftKey) modifiers.push("Shift");
      if (altKey) modifiers.push("Alt");
      if (metaKey) modifiers.push("Meta");

      const shortcutKey = [...modifiers, key].join("+");

      // 检查是否匹配快捷键
      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
        return;
      }

      // 检查单键快捷键
      if (!ctrlKey && !shiftKey && !altKey && !metaKey && shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, shortcuts]);

  // 焦点陷阱 (用于模态框等)
  useEffect(() => {
    if (!focusTrap || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);

    // 初始聚焦
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, [focusTrap]);

  // 工具函数
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements[0]?.focus();
  }, []);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements[focusableElements.length - 1]?.focus();
  }, []);

  const focusElement = useCallback((selector: string) => {
    if (!containerRef.current) return;

    const element = containerRef.current.querySelector<HTMLElement>(selector);
    element?.focus();
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusElement,
  };
}

export default useKeyboardNavigation;
