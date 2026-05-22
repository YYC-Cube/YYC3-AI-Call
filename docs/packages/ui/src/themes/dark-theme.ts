/**
 * file dark-theme.ts
 * description 暗色主题配置
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
 * brief 暗色主题配置
 */
import type { Theme } from './theme-provider'

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
  },
}

export default darkTheme
