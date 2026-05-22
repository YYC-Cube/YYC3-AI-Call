import * as react_jsx_runtime from 'react/jsx-runtime';
import React__default from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';
interface Theme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        border: string;
        error: string;
        success: string;
        warning: string;
    };
}
interface ThemeContextValue {
    theme: Theme;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}
interface ThemeProviderProps {
    children: React__default.ReactNode;
    defaultMode?: ThemeMode;
}
declare function ThemeProvider({ children, defaultMode }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
declare function useTheme(): ThemeContextValue;

/**
 * file theme-tokens.ts
 * description 主题 Token 定义
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
 * brief 主题 Token 定义
 */
declare const themeTokens: {
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
    };
    fontSize: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
    };
    fontWeight: {
        normal: string;
        medium: string;
        semibold: string;
        bold: string;
    };
    lineHeight: {
        tight: string;
        normal: string;
        relaxed: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    transitions: {
        fast: string;
        normal: string;
        slow: string;
    };
};
type ThemeTokens = typeof themeTokens;

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

declare const darkTheme: Theme;

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

declare const lightTheme: Theme;

export { type Theme, type ThemeMode, ThemeProvider, type ThemeProviderProps, type ThemeTokens, darkTheme, lightTheme, themeTokens, useTheme };
