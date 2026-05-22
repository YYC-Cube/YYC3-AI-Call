/**
 * @file ThemeStore.tsx
 * @description 全局主题 Context Provider，管理深海军蓝/赛博朋克/自定义主题切换，
 *              集成 CustomThemeStore 动态主题引擎
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,context,provider,dark-mode,customization
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  applyThemeToDOM,
  loadActiveThemeId,
  PRESET_THEMES,
  loadCustomThemes,
} from "./CustomThemeStore";
import { SK_THEME } from "./constants/storage-keys";

export type ThemeId = "navy" | "cyberpunk";

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  toggleTheme: () => void;
  isCyber: boolean;
  /** Open the full custom theme editor */
  showThemeCustomizer: boolean;
  setShowThemeCustomizer: (show: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn("useTheme must be used within a ThemeProvider, returning default values");
    return {
      theme: "navy",
      setTheme: () => {},
      toggleTheme: () => {},
      isCyber: false,
      showThemeCustomizer: false,
      setShowThemeCustomizer: () => {},
    };
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(SK_THEME);
      if (stored === "cyberpunk" || stored === "navy") return stored;
    } catch {}
    return "navy";
  });

  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    try {
      localStorage.setItem(SK_THEME, t);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "navy" ? "cyberpunk" : "navy");
  }, [theme, setTheme]);

  // Apply class to document body
  useEffect(() => {
    document.documentElement.classList.remove("navy", "cyberpunk");
    document.documentElement.classList.add(theme);
    document.body.classList.remove("navy", "cyberpunk");
    document.body.classList.add(theme);
  }, [theme]);

  // Restore custom theme CSS variables on mount and when active theme changes
  useEffect(() => {
    const customId = loadActiveThemeId();
    if (customId) {
      const allThemes = [...PRESET_THEMES, ...loadCustomThemes()];
      const found = allThemes.find((t) => t.id === customId);
      if (found) {
        applyThemeToDOM(found);
      }
    }
  }, [showThemeCustomizer]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isCyber: theme === "cyberpunk",
        showThemeCustomizer,
        setShowThemeCustomizer,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
