/**
 * @file CustomThemeStore.ts
 * @description YYC3 自定义主题引擎，支持 OKLch 颜色、6 种预设、品牌定制、
 *              导入/导出、版本控制、CSS 变量生成
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,engine,oklch,presets,css-variables,persistence
 */

// ================================================================
// CustomThemeStore — YYC3 自定义主题引擎
// 支持 OKLch 颜色、6 种预设、品牌定制、导入/导出、版本控制
// ================================================================

// ===== Theme Config Types =====

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemeChartColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  chart6: string;
}

export interface ThemeSidebarColors {
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
}

export interface ThemeFonts {
  sans: { primary: string; secondary: string; tertiary: string };
  serif: { primary: string; secondary: string };
  mono: { primary: string; secondary: string };
}

export interface ThemeLayout {
  radius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadow: { xs: string; sm: string; md: string; lg: string; xl: string };
  spacing: Record<string, string>;
}

export interface ThemeBranding {
  logo: {
    dataUrl: string | null;
    size: string;
    radius: string;
    opacity: number;
  };
  slogan: { primary: string; secondary: string };
  title: { appName: string; template: string };
  footer: string;
  background: {
    type: "color" | "image";
    value: string;
    opacity: number;
    blur: string;
  };
}

export interface ThemeConfig {
  version: string;
  id: string;
  name: string;
  type: "light" | "dark";
  created: string;
  modified: string;
  colors: ThemeColors;
  chartColors: ThemeChartColors;
  sidebarColors: ThemeSidebarColors;
  fonts: ThemeFonts;
  layout: ThemeLayout;
  branding: ThemeBranding;
  isPreset: boolean;
  isCustom: boolean;
}

export interface ThemeVersion {
  id: string;
  themeId: string;
  config: ThemeConfig;
  timestamp: number;
  label: string;
}

// ===== Default Values =====

const DEFAULT_FONTS: ThemeFonts = {
  sans: {
    primary:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    secondary: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    tertiary: "system-ui, -apple-system, sans-serif",
  },
  serif: {
    primary: "Georgia, 'Times New Roman', Times, serif",
    secondary: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  },
  mono: {
    primary: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
    secondary: "'Consolas', 'Monaco', 'Lucida Console', monospace",
  },
};

const DEFAULT_LAYOUT: ThemeLayout = {
  radius: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    full: "9999px",
  },
  shadow: {
    xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
    sm: "0 1px 3px 0 rgba(0,0,0,0.10)",
    md: "0 4px 6px -1px rgba(0,0,0,0.10)",
    lg: "0 10px 15px -3px rgba(0,0,0,0.10)",
    xl: "0 20px 25px -5px rgba(0,0,0,0.10)",
  },
  spacing: {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
  },
};

const DEFAULT_BRANDING: ThemeBranding = {
  logo: { dataUrl: null, size: "40px", radius: "8px", opacity: 100 },
  slogan: {
    primary: "言启象限 | 语枢未来",
    secondary: "Words Initiate Quadrants, Language Serves as Core for Future",
  },
  title: {
    appName: "YYC³ Family AI",
    template: "{pageName} - {appName}",
  },
  footer: "YanYuCloudCube · 万象归元于云枢 | 深栈智启新纪元",
  background: { type: "color", value: "#F3F4F6", opacity: 100, blur: "0px" },
};

// ===== 6 Preset Themes =====

function makeId(): string {
  return `theme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const PRESET_BASE_LIGHT: ThemeConfig = {
  version: "2.0.0",
  id: "preset-base-light",
  name: "基础色调",
  type: "light",
  created: "2026-01-01T00:00:00Z",
  modified: "2026-01-01T00:00:00Z",
  colors: {
    primary: "oklch(0.55 0.22 264)",
    primaryForeground: "oklch(0.98 0.01 264)",
    secondary: "oklch(0.95 0.006 264)",
    secondaryForeground: "oklch(0.20 0.02 264)",
    accent: "oklch(0.93 0.02 264)",
    accentForeground: "oklch(0.20 0.02 264)",
    background: "oklch(0.98 0.01 264)",
    foreground: "oklch(0.15 0.02 264)",
    card: "oklch(1.00 0.00 0)",
    cardForeground: "oklch(0.15 0.02 264)",
    popover: "oklch(1.00 0.00 0)",
    popoverForeground: "oklch(0.15 0.02 264)",
    muted: "oklch(0.95 0.02 264)",
    mutedForeground: "oklch(0.45 0.02 264)",
    destructive: "oklch(0.55 0.22 25)",
    destructiveForeground: "oklch(0.98 0.01 25)",
    border: "oklch(0.85 0.02 264)",
    input: "oklch(0.85 0.02 264)",
    ring: "oklch(0.55 0.22 264)",
  },
  chartColors: {
    chart1: "oklch(0.55 0.22 264)",
    chart2: "oklch(0.60 0.25 30)",
    chart3: "oklch(0.65 0.15 200)",
    chart4: "oklch(0.70 0.18 150)",
    chart5: "oklch(0.75 0.20 280)",
    chart6: "oklch(0.80 0.12 100)",
  },
  sidebarColors: {
    sidebar: "oklch(0.95 0.02 264)",
    sidebarForeground: "oklch(0.15 0.02 264)",
    sidebarPrimary: "oklch(0.55 0.22 264)",
    sidebarPrimaryForeground: "oklch(0.98 0.01 264)",
    sidebarAccent: "oklch(0.93 0.02 264)",
    sidebarAccentForeground: "oklch(0.20 0.02 264)",
    sidebarBorder: "oklch(0.85 0.02 264)",
  },
  fonts: { ...DEFAULT_FONTS },
  layout: { ...DEFAULT_LAYOUT },
  branding: { ...DEFAULT_BRANDING },
  isPreset: true,
  isCustom: false,
};

const PRESET_COSMIC_DARK: ThemeConfig = {
  ...PRESET_BASE_LIGHT,
  id: "preset-cosmic-dark",
  name: "宇宙之夜",
  type: "dark",
  colors: {
    primary: "oklch(0.65 0.22 264)",
    primaryForeground: "oklch(0.98 0.01 264)",
    secondary: "oklch(0.27 0.02 264)",
    secondaryForeground: "oklch(0.98 0.01 264)",
    accent: "oklch(0.27 0.02 264)",
    accentForeground: "oklch(0.98 0.01 264)",
    background: "oklch(0.15 0.02 264)",
    foreground: "oklch(0.98 0.01 264)",
    card: "oklch(0.20 0.02 264)",
    cardForeground: "oklch(0.98 0.01 264)",
    popover: "oklch(0.20 0.02 264)",
    popoverForeground: "oklch(0.98 0.01 264)",
    muted: "oklch(0.27 0.02 264)",
    mutedForeground: "oklch(0.70 0.02 264)",
    destructive: "oklch(0.55 0.22 25)",
    destructiveForeground: "oklch(0.98 0.01 25)",
    border: "oklch(0.30 0.02 264)",
    input: "oklch(0.27 0.02 264)",
    ring: "oklch(0.55 0.22 264)",
  },
  chartColors: {
    chart1: "oklch(0.65 0.22 264)",
    chart2: "oklch(0.68 0.25 30)",
    chart3: "oklch(0.70 0.15 200)",
    chart4: "oklch(0.72 0.18 150)",
    chart5: "oklch(0.75 0.20 280)",
    chart6: "oklch(0.80 0.12 100)",
  },
  sidebarColors: {
    sidebar: "oklch(0.20 0.02 264)",
    sidebarForeground: "oklch(0.98 0.01 264)",
    sidebarPrimary: "oklch(0.65 0.22 264)",
    sidebarPrimaryForeground: "oklch(0.98 0.01 264)",
    sidebarAccent: "oklch(0.27 0.02 264)",
    sidebarAccentForeground: "oklch(0.98 0.01 264)",
    sidebarBorder: "oklch(0.30 0.02 264)",
  },
};

const PRESET_SOFT_POP: ThemeConfig = {
  ...PRESET_BASE_LIGHT,
  id: "preset-soft-pop",
  name: "柔和流行",
  type: "light",
  colors: {
    ...PRESET_BASE_LIGHT.colors,
    primary: "oklch(0.70 0.18 320)",
    primaryForeground: "oklch(0.98 0.01 320)",
    secondary: "oklch(0.95 0.01 320)",
    secondaryForeground: "oklch(0.20 0.02 320)",
    accent: "oklch(0.93 0.01 320)",
    accentForeground: "oklch(0.20 0.02 320)",
    background: "oklch(0.97 0.01 320)",
    border: "oklch(0.88 0.01 320)",
    ring: "oklch(0.70 0.18 320)",
  },
};

const PRESET_CYBERPUNK: ThemeConfig = {
  ...PRESET_BASE_LIGHT,
  id: "preset-cyberpunk",
  name: "赛博朋克",
  type: "dark",
  colors: {
    primary: "oklch(0.60 0.25 300)",
    primaryForeground: "oklch(0.98 0.01 300)",
    secondary: "oklch(0.20 0.02 300)",
    secondaryForeground: "oklch(0.98 0.01 300)",
    accent: "oklch(0.20 0.03 300)",
    accentForeground: "oklch(0.98 0.01 300)",
    background: "oklch(0.10 0.02 300)",
    foreground: "oklch(0.95 0.01 300)",
    card: "oklch(0.15 0.02 300)",
    cardForeground: "oklch(0.95 0.01 300)",
    popover: "oklch(0.15 0.02 300)",
    popoverForeground: "oklch(0.95 0.01 300)",
    muted: "oklch(0.20 0.02 300)",
    mutedForeground: "oklch(0.65 0.02 300)",
    destructive: "oklch(0.55 0.22 25)",
    destructiveForeground: "oklch(0.98 0.01 25)",
    border: "oklch(0.25 0.02 300)",
    input: "oklch(0.20 0.02 300)",
    ring: "oklch(0.60 0.25 300)",
  },
};

const PRESET_MINIMAL: ThemeConfig = {
  ...PRESET_BASE_LIGHT,
  id: "preset-minimal",
  name: "现代极简",
  type: "light",
  colors: {
    ...PRESET_BASE_LIGHT.colors,
    primary: "oklch(0.30 0.00 0)",
    primaryForeground: "oklch(0.98 0.00 0)",
    secondary: "oklch(0.95 0.00 0)",
    secondaryForeground: "oklch(0.20 0.00 0)",
    accent: "oklch(0.93 0.00 0)",
    accentForeground: "oklch(0.20 0.00 0)",
    background: "oklch(0.98 0.00 0)",
    foreground: "oklch(0.15 0.00 0)",
    muted: "oklch(0.95 0.00 0)",
    mutedForeground: "oklch(0.50 0.00 0)",
    border: "oklch(0.90 0.00 0)",
    ring: "oklch(0.30 0.00 0)",
  },
};

const PRESET_FUTURE_TECH: ThemeConfig = {
  ...PRESET_BASE_LIGHT,
  id: "preset-future-tech",
  name: "未来科技",
  type: "dark",
  colors: {
    primary: "oklch(0.55 0.25 200)",
    primaryForeground: "oklch(0.98 0.01 200)",
    secondary: "oklch(0.22 0.02 200)",
    secondaryForeground: "oklch(0.98 0.01 200)",
    accent: "oklch(0.22 0.03 200)",
    accentForeground: "oklch(0.98 0.01 200)",
    background: "oklch(0.12 0.02 200)",
    foreground: "oklch(0.95 0.01 200)",
    card: "oklch(0.18 0.02 200)",
    cardForeground: "oklch(0.95 0.01 200)",
    popover: "oklch(0.18 0.02 200)",
    popoverForeground: "oklch(0.95 0.01 200)",
    muted: "oklch(0.22 0.02 200)",
    mutedForeground: "oklch(0.60 0.02 200)",
    destructive: "oklch(0.55 0.22 25)",
    destructiveForeground: "oklch(0.98 0.01 25)",
    border: "oklch(0.28 0.02 200)",
    input: "oklch(0.22 0.02 200)",
    ring: "oklch(0.55 0.25 200)",
  },
};

export const PRESET_THEMES: ThemeConfig[] = [
  PRESET_BASE_LIGHT,
  PRESET_COSMIC_DARK,
  PRESET_SOFT_POP,
  PRESET_CYBERPUNK,
  PRESET_MINIMAL,
  PRESET_FUTURE_TECH,
];

// ===== WCAG Contrast Utilities =====

/** Approximate sRGB luminance from oklch string for contrast checking */
function oklchToApproxLuminance(oklch: string): number {
  const m = oklch.match(/oklch\(\s*([\d.]+)\s/);
  if (m) return parseFloat(m[1]);
  // Fallback for hex
  if (oklch.startsWith("#")) {
    const hex = oklch.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return 0.5;
}

export function calculateContrast(fg: string, bg: string): number {
  const l1 = oklchToApproxLuminance(fg);
  const l2 = oklchToApproxLuminance(bg);
  const lighter = Math.max(l1, l2) + 0.05;
  const darker = Math.min(l1, l2) + 0.05;
  return lighter / darker;
}

export type WCAGLevel = "AAA" | "AA" | "fail";

export function getContrastLevel(ratio: number): WCAGLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}

// ===== CSS Variable Application =====

const COLOR_VAR_MAP: Record<keyof ThemeColors, string> = {
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
};

const CHART_VAR_MAP: Record<keyof ThemeChartColors, string> = {
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  chart6: "--chart-6",
};

const SIDEBAR_VAR_MAP: Record<keyof ThemeSidebarColors, string> = {
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
};

/** Apply a ThemeConfig to CSS variables on :root */
export function applyThemeToDOM(config: ThemeConfig): void {
  const root = document.documentElement;

  // Colors
  for (const [key, varName] of Object.entries(COLOR_VAR_MAP)) {
    const val = config.colors[key as keyof ThemeColors];
    if (val) root.style.setProperty(varName, val);
  }

  // Chart colors
  for (const [key, varName] of Object.entries(CHART_VAR_MAP)) {
    const val = config.chartColors[key as keyof ThemeChartColors];
    if (val) root.style.setProperty(varName, val);
  }

  // Sidebar
  for (const [key, varName] of Object.entries(SIDEBAR_VAR_MAP)) {
    const val = config.sidebarColors[key as keyof ThemeSidebarColors];
    if (val) root.style.setProperty(varName, val);
  }

  // Layout
  root.style.setProperty("--radius", config.layout.radius.lg);

  // Fonts
  root.style.setProperty("--font-sans", config.fonts.sans.primary);
  root.style.setProperty("--font-mono", config.fonts.mono.primary);
}

/** Remove all inline custom theme styles from :root */
export function clearThemeFromDOM(): void {
  const root = document.documentElement;
  const allVars = [
    ...Object.values(COLOR_VAR_MAP),
    ...Object.values(CHART_VAR_MAP),
    ...Object.values(SIDEBAR_VAR_MAP),
    "--radius",
    "--font-sans",
    "--font-mono",
  ];
  for (const v of allVars) {
    root.style.removeProperty(v);
  }
}

// ===== Storage =====

const STORAGE_KEY = "yyc3_custom_themes";
const ACTIVE_KEY = "yyc3_active_theme_id";
const VERSION_KEY = "yyc3_theme_versions";
const MAX_VERSIONS = 50;

export function saveThemes(themes: ThemeConfig[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(themes.filter((t) => t.isCustom)),
    );
  } catch {}
}

export function loadCustomThemes(): ThemeConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveActiveThemeId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {}
}

export function loadActiveThemeId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function getActiveTheme(): ThemeConfig | null {
  try {
    const activeId = loadActiveThemeId();
    if (!activeId) return null;
    
    const allThemes = [...PRESET_THEMES, ...loadCustomThemes()];
    return allThemes.find((t) => t.id === activeId) || null;
  } catch {
    return null;
  }
}

export function saveVersions(versions: ThemeVersion[]): void {
  try {
    const trimmed = versions.slice(-MAX_VERSIONS);
    localStorage.setItem(VERSION_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function loadVersions(): ThemeVersion[] {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// ===== Export / Import =====

export function exportTheme(config: ThemeConfig): string {
  const exportData = {
    version: config.version,
    name: config.name,
    type: config.type,
    created: config.created,
    colors: config.colors,
    chartColors: config.chartColors,
    sidebarColors: config.sidebarColors,
    fonts: {
      sans: {
        primary: config.fonts.sans.primary
          .split(",")[0]
          .trim()
          .replace(/'/g, ""),
      },
      serif: {
        primary: config.fonts.serif.primary
          .split(",")[0]
          .trim()
          .replace(/'/g, ""),
      },
      mono: {
        primary: config.fonts.mono.primary
          .split(",")[0]
          .trim()
          .replace(/'/g, ""),
      },
    },
    layout: {
      radius: config.layout.radius,
      shadow: config.layout.shadow,
    },
    branding: config.branding,
  };
  return JSON.stringify(exportData, null, 2);
}

export function importTheme(json: string): ThemeConfig | null {
  try {
    const data = JSON.parse(json);
    if (!data.name || !data.type || !data.colors) return null;

    const now = new Date().toISOString();
    return {
      version: data.version || "2.0.0",
      id: makeId(),
      name: data.name,
      type: data.type,
      created: data.created || now,
      modified: now,
      colors: { ...PRESET_BASE_LIGHT.colors, ...data.colors },
      chartColors: { ...PRESET_BASE_LIGHT.chartColors, ...data.chartColors },
      sidebarColors: {
        ...PRESET_BASE_LIGHT.sidebarColors,
        ...data.sidebarColors,
      },
      fonts: data.fonts
        ? { ...DEFAULT_FONTS, ...data.fonts }
        : { ...DEFAULT_FONTS },
      layout: data.layout
        ? { ...DEFAULT_LAYOUT, ...data.layout }
        : { ...DEFAULT_LAYOUT },
      branding: data.branding
        ? { ...DEFAULT_BRANDING, ...data.branding }
        : { ...DEFAULT_BRANDING },
      isPreset: false,
      isCustom: true,
    };
  } catch {
    return null;
  }
}

// ===== Color Harmony Suggestions =====

export type HarmonyType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "tetradic";

function parseOklchHue(oklch: string): number {
  const m = oklch.match(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 264;
}

function setOklchHue(oklch: string, hue: number): string {
  return oklch.replace(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+[\d.]+\s*\)/,
    (_, l, c) => {
      return `oklch(${l} ${c} ${((hue % 360) + 360) % 360})`;
    },
  );
}

export function suggestHarmony(primary: string, type: HarmonyType): string[] {
  const h = parseOklchHue(primary);
  switch (type) {
    case "complementary":
      return [setOklchHue(primary, h + 180)];
    case "analogous":
      return [setOklchHue(primary, h + 30), setOklchHue(primary, h - 30)];
    case "triadic":
      return [setOklchHue(primary, h + 120), setOklchHue(primary, h + 240)];
    case "tetradic":
      return [
        setOklchHue(primary, h + 90),
        setOklchHue(primary, h + 180),
        setOklchHue(primary, h + 270),
      ];
  }
}

// ===== Create blank custom theme =====

export function createCustomTheme(basedOn?: ThemeConfig): ThemeConfig {
  const base = basedOn || PRESET_BASE_LIGHT;
  const now = new Date().toISOString();
  return {
    ...structuredClone(base),
    id: makeId(),
    name: basedOn ? `${base.name} 副本` : "自定义主题",
    created: now,
    modified: now,
    isPreset: false,
    isCustom: true,
  };
}
