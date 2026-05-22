import { createContext, useState, useEffect, useContext } from 'react';
import { jsx } from 'react/jsx-runtime';

// src/themes/theme-provider.tsx

// src/themes/light-theme.ts
var lightTheme = {
  name: "light",
  colors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    error: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b"
  }
};

// src/themes/dark-theme.ts
var darkTheme = {
  name: "dark",
  colors: {
    primary: "#60a5fa",
    secondary: "#a78bfa",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f1f5f9",
    textSecondary: "#94a3b8",
    border: "#334155",
    error: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24"
  }
};
var ThemeContext = createContext(null);
function ThemeProvider({ children, defaultMode = "auto" }) {
  const [mode, setMode] = useState(defaultMode);
  const [theme, setTheme] = useState(lightTheme);
  useEffect(() => {
    const updateTheme = () => {
      if (mode === "auto") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(isDark ? darkTheme : lightTheme);
      } else {
        setTheme(mode === "dark" ? darkTheme : lightTheme);
      }
    };
    updateTheme();
    if (mode === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [mode]);
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--family-color-${key}`, value);
    });
  }, [theme]);
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { theme, mode, setMode }, children });
}
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// src/themes/theme-tokens.ts
var themeTokens = {
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem"
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px"
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem"
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700"
  },
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75"
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
  },
  transitions: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms"
  }
};

export { ThemeProvider, darkTheme, lightTheme, themeTokens, useTheme };
//# sourceMappingURL=themes.js.map
//# sourceMappingURL=themes.js.map