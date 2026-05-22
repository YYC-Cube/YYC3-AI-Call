/**
 * @file useTouchGestures.ts
 * @description 移动端触摸手势 Hook - 支持滑动返回、右滑打开菜单等手势
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags touch,gestures,mobile,hooks
 */

import { useEffect, useState, useCallback } from "react";

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // 滑动距离阈值 (px)
  enabled?: boolean;
}

interface TouchPosition {
  x: number;
  y: number;
}

export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true,
}: TouchGestureOptions) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);

  // 检查是否满足滑动条件
  const isSwipeValid = useCallback(() => {
    if (!touchStart || !touchEnd) return false;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // 确保滑动距离足够
    return Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold;
  }, [touchStart, touchEnd, threshold]);

  // 获取滑动方向
  const getSwipeDirection = useCallback(() => {
    if (!touchStart || !touchEnd) return null;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // 判断是水平滑动还是垂直滑动
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (deltaX > threshold) return "right";
      if (deltaX < -threshold) return "left";
    } else {
      // 垂直滑动
      if (deltaY > threshold) return "down";
      if (deltaY < -threshold) return "up";
    }

    return null;
  }, [touchStart, touchEnd, threshold]);

  // 触摸开始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  }, []);

  // 触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart) return;

    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  }, [touchStart]);

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!isSwipeValid()) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const direction = getSwipeDirection();

    switch (direction) {
      case "left":
        onSwipeLeft?.();
        break;
      case "right":
        onSwipeRight?.();
        break;
      case "up":
        onSwipeUp?.();
        break;
      case "down":
        onSwipeDown?.();
        break;
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [isSwipeValid, getSwipeDirection, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // 注册事件监听
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    touchStart,
    touchEnd,
    isSwiping: touchStart !== null && touchEnd !== null,
  };
}

export default useTouchGestures;
