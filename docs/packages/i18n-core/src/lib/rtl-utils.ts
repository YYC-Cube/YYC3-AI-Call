/**
 * file rtl-utils.ts
 * description RTL 语言工具
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief RTL 语言工具
 */
import type { HorizontalAlignment, RTLLocale, SpacingProperty, TextDirection } from './types.js';

export const RTL_LOCALES: RTLLocale[] = ['ar'];

/**
 * Check if a locale is RTL (Right-to-Left)
 */
export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale as RTLLocale);
}

/**
 * Get text direction for a locale
 */
export function getDirection(locale: string): TextDirection {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get appropriate alignment for a locale
 */
export function getAlignment(locale: string): HorizontalAlignment {
  return isRTL(locale) ? 'right' : 'left';
}

/**
 * Get opposite alignment (for flexbox)
 */
export function getOppositeAlignment(locale: string): HorizontalAlignment {
  return isRTL(locale) ? 'left' : 'right';
}

/**
 * Flip margin/padding properties for RTL
 */
export function flipSpacing(
  locale: string,
  property: SpacingProperty,
  value: string
): Record<string, string> {
  if (!isRTL(locale)) {
    return { [property]: value };
  }

  const propertyMap: Record<SpacingProperty, string> = {
    marginLeft: 'marginRight',
    marginRight: 'marginLeft',
    paddingLeft: 'paddingRight',
    paddingRight: 'paddingLeft'
  };

  return { [propertyMap[property]]: value };
}

/**
 * Mirror horizontal position values
 */
export function mirrorPosition(
  locale: string,
  position: { left?: string; right?: string } | null | undefined
): { left?: string; right?: string } | null | undefined {
  if (!isRTL(locale) || !position) {
    return position;
  }

  return {
    left: position.right,
    right: position.left
  };
}

/**
 * Transform CSS class names for RTL context
 */
export function transformClassForRTL(
  locale: string,
  className: string
): string {
  if (!isRTL(locale)) {
    return className;
  }

  // Common LTR to RTL class mappings
  const classMappings: Record<string, string> = {
    'ml-': 'mr-',
    'mr-': 'ml-',
    'pl-': 'pr-',
    'pr-': 'pl-',
    'rounded-l': 'rounded-r',
    'rounded-r': 'rounded-l',
    'text-left': 'text-right',
    'text-right': 'text-left',
    'float-left': 'float-right',
    'float-right': 'float-left'
  };

  let transformed = className;

  for (const [ltr, rtl] of Object.entries(classMappings)) {
    if (className.startsWith(ltr)) {
      transformed = className.replace(ltr, rtl);
      break;
    }
  }

  return transformed;
}

/**
 * Set up document direction and language attributes
 */
export function setupDocumentDirection(
  locale: string,
  doc: Document = document
): void {
  const dir = getDirection(locale);
  doc.documentElement.setAttribute('dir', dir);
  doc.documentElement.setAttribute('lang', locale);

  // Add RTL-specific class if needed
  if (isRTL(locale)) {
    doc.documentElement.classList.add('rtl');
  } else {
    doc.documentElement.classList.remove('rtl');
  }
}

/**
 * Create a mirrored layout configuration
 */
export function createMirroredLayout<T extends Record<string, string>>(
  locale: string,
  ltrConfig: T
): T {
  if (!isRTL(locale)) {
    return ltrConfig;
  }

  const mirrorKeys = [
    'marginLeft', 'marginRight',
    'paddingLeft', 'paddingRight',
    'borderLeft', 'borderRight',
    'borderTopLeftRadius', 'borderTopRightRadius',
    'borderBottomLeftRadius', 'borderBottomRightRadius'
  ];

  const mirrored = { ...ltrConfig };

  for (const key of mirrorKeys) {
    if (key in mirrored) {
      const oppositeKey = key.replace(/Left|Right/, (match) =>
        match === 'Left' ? 'Right' : 'Left'
      );

      const record = mirrored as Record<string, string>;
      record[oppositeKey] = record[key]!;
      delete record[key];
    }
  }

  return mirrored;
}
