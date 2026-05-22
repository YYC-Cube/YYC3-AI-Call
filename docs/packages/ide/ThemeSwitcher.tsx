/**
 * @file ThemeSwitcher.tsx
 * @description 主题快速切换按钮组件，支持深海军蓝/赛博朋克切换及打开自定义主题编辑器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-06
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,switcher,ui,button,tokens
 */

import { useTheme } from "./ThemeStore";
import { useThemeTokens } from "./hooks/useThemeTokens";
import { Zap, Anchor, Palette } from "lucide-react";

interface ThemeSwitcherProps {
  compact?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export default function ThemeSwitcher({ compact = false, layout = 'horizontal' }: ThemeSwitcherProps) {
  const { theme, toggleTheme, isCyber, setShowThemeCustomizer } = useTheme();
  const t = useThemeTokens();
  const ts = t.themeSwitcher;

  if (compact) {
    return (
      <div className={`flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} items-center gap-1`}>
        <button
          onClick={toggleTheme}
          className={`relative w-7 h-7 rounded flex items-center justify-center transition-all ${ts.compactBtnHover}`}
          title={`切换主题: ${isCyber ? "深海军蓝" : "赛博朋克"}`}
        >
          {isCyber ? (
            <Zap className={`w-4 h-4 ${ts.iconGlow}`} />
          ) : (
            <Anchor className="w-4 h-4" />
          )}
          {ts.glowDot && (
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${ts.glowDot} animate-pulse`}
            />
          )}
        </button>
        <button
          onClick={() => setShowThemeCustomizer(true)}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all ${ts.compactPaletteBtnHover}`}
          title="自定义主题"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${ts.fullBtnStyle}`}
      title={`切换主题: ${isCyber ? "深海军蓝" : "赛博朋克"}`}
    >
      {isCyber ? (
        <>
          <Zap className={`w-4 h-4 ${ts.iconGlow}`} />
          <span className={`text-[0.82rem] ${ts.labelFont}`}>CYBER</span>
        </>
      ) : (
        <>
          <Anchor className="w-4 h-4" />
          <span className="text-[0.82rem]">Navy</span>
        </>
      )}
    </button>
  );
}
