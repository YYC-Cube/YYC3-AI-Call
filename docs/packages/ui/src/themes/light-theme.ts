/**
 * file light-theme.ts
 * description 亮色主题配置
 * module @yyc3/ui
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.1
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[theme]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 亮色主题配置
 */
import type { Theme } from './theme-provider'

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
}

export default lightTheme
