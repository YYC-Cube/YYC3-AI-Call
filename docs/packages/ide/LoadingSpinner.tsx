/**
 * @file LoadingSpinner.tsx
 * @description 统一加载指示器组件，提供统一视觉风格，支持多尺寸和文字说明
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui,loading,spinner,component
 */

// ================================================================
// LoadingSpinner — 统一加载指示器
// ================================================================
//
// 替代各面板中自定义的 loading 实现，提供统一视觉风格。
//
// 用法:
//   <LoadingSpinner />                    — 默认尺寸 (md)，无文字
//   <LoadingSpinner size="lg" />          — 大尺寸
//   <LoadingSpinner label="加载中..." />   — 带文字说明
//   <LoadingSpinner fullScreen />          — 全屏居中
// ================================================================

import { useThemeTokens } from "./hooks/useThemeTokens";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps {
  /** Spinner size */
  size?: SpinnerSize;
  /** Optional text below spinner */
  label?: string;
  /** Center in full container height */
  fullScreen?: boolean;
  /** Additional className */
  className?: string;
}

const SIZE_MAP: Record<SpinnerSize, { ring: string; thickness: string }> = {
  xs: { ring: "w-4 h-4", thickness: "border-[1.5px]" },
  sm: { ring: "w-5 h-5", thickness: "border-2" },
  md: { ring: "w-8 h-8", thickness: "border-2" },
  lg: { ring: "w-12 h-12", thickness: "border-[2.5px]" },
  xl: { ring: "w-16 h-16", thickness: "border-3" },
};

export function LoadingSpinner({
  size = "md",
  label,
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const t = useThemeTokens();
  const { ring, thickness } = SIZE_MAP[size];

  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`${ring} ${thickness} rounded-full animate-spin ${t.accentBorder} border-t-transparent`}
      />
      {label && (
        <span className={`text-[0.78rem] ${t.textSecondary}`}>{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center size-full min-h-[200px]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
