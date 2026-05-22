/**
 * @file constants/brand.ts
 * @description 品牌标识常量 — 对齐 YYC3-变量-品牌标识.md，集中管理品牌名称、标语、颜色、联系方式等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags constants,brand,identity,design-prompt
 */

// ================================================================
// Brand Identity — 品牌标识变量 (对齐 YYC3-Design-Prompt/变量词库/YYC3-变量-品牌标识.md)
// ================================================================

// ── 品牌基本信息 ──
export const BRAND_NAME = "YYC³ Family AI";
export const BRAND_NAME_CN = "言宇云枢";
export const BRAND_NAME_SHORT = "YYC³";
export const BRAND_SLOGAN = "言传千行代码 | 语枢万物智能";
export const BRAND_SLOGAN_CN = "言启象限 | 语枢未来";
export const BRAND_SLOGAN_EN =
  "Words Initiate Quadrants, Language Serves as Core for Future";
export const BRAND_DESCRIPTION =
  "YYC³ Family AI 智能编程助手 — 多联式低码编程平台";
export const BRAND_FOOTER = "YanYuCloudCube · 万象归元于云枢 | 深栈智启新纪元";

// ── 品牌视觉标识 ──
export const BRAND_COLOR_PRIMARY = "#667eea";
export const BRAND_COLOR_SECONDARY = "#764ba2";
export const BRAND_COLOR_ACCENT = "#00d4ff";
export const BRAND_COLOR_SUCCESS = "#22c55e";
export const BRAND_COLOR_WARNING = "#f59e0b";
export const BRAND_COLOR_ERROR = "#ef4444";

export const BRAND_GRADIENT_PRIMARY =
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
export const BRAND_GRADIENT_ACCENT =
  "linear-gradient(135deg, #00d4ff 0%, #667eea 100%)";

// ── 品牌联系方式 ──
export const BRAND_EMAIL = "admin@0379.email";
export const BRAND_GITHUB = "https://github.com/YYC-Cube";
export const BRAND_GITHUB_REPO = "https://github.com/YYC-Cube/YanYuCloud";

// ── 品牌法律信息 ──
export const BRAND_LICENSE = "MIT";
export const BRAND_COPYRIGHT_YEAR = 2026;
export const BRAND_COPYRIGHT = `Copyright (c) ${BRAND_COPYRIGHT_YEAR} YanYuCloudCube Team`;
export const BRAND_TEAM = "YanYuCloudCube Team";

// ── 品牌设计规范 ──
export const BRAND_FONT_FAMILY_SANS = [
  "Inter",
  "system-ui",
  "-apple-system",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Noto Sans SC",
  "sans-serif",
];
export const BRAND_FONT_FAMILY_MONO = [
  "JetBrains Mono",
  "Fira Code",
  "Cascadia Code",
  "Menlo",
  "Monaco",
  "monospace",
];

// ── 品牌断点规范 ──
export const BRAND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// ── 品牌动画规范 ──
export const BRAND_TRANSITION_FAST = "150ms";
export const BRAND_TRANSITION_NORMAL = "300ms";
export const BRAND_TRANSITION_SLOW = "500ms";

// ── 品牌 Z-Index 分层体系 ──
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  sidebar: 35,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  commandPalette: 90,
  maximized: 100,
} as const;
