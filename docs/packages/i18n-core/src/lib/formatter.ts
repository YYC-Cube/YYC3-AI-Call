/**
 * file formatter.ts
 * description 翻译格式化器
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
 * brief 翻译格式化器
 */
export interface TranslateParams {
  [key: string]: unknown;
}

export function interpolate(template: string, params?: TranslateParams): string {
  if (!params || Object.keys(params).length === 0) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];

    if (value === undefined || value === null) {
      return match;
    }

    return String(value);
  });
}

export function pluralize(template: string, count: number): string {
  return template
    .replace(/\(s\)/g, count === 1 ? "" : "s")
    .replace(/\{count\}/g, String(count));
}

const RELATIVE_TIME_MESSAGES: Record<string, {
  justNow: string;
  minutes: (n: number) => string;
  hours: (n: number) => string;
  days: (n: number) => string;
  dateFormat: string;
}> = {
  zh: {
    justNow: "刚刚",
    minutes: (n) => `${n}分钟前`,
    hours: (n) => `${n}小时前`,
    days: (n) => `${n}天前`,
    dateFormat: "zh-CN",
  },
  ja: {
    justNow: "たった今",
    minutes: (n) => `${n}分前`,
    hours: (n) => `${n}時間前`,
    days: (n) => `${n}日前`,
    dateFormat: "ja-JP",
  },
  ko: {
    justNow: "방금",
    minutes: (n) => `${n}분 전`,
    hours: (n) => `${n}시간 전`,
    days: (n) => `${n}일 전`,
    dateFormat: "ko-KR",
  },
  pt: {
    justNow: "agora mesmo",
    minutes: (n) => `${n}min atrás`,
    hours: (n) => `${n}h atrás`,
    days: (n) => `${n}d atrás`,
    dateFormat: "pt-BR",
  },
  fr: {
    justNow: "à l'instant",
    minutes: (n) => `il y a ${n} min`,
    hours: (n) => `il y a ${n} h`,
    days: (n) => `il y a ${n} j`,
    dateFormat: "fr-FR",
  },
  de: {
    justNow: "gerade eben",
    minutes: (n) => `vor ${n} Min.`,
    hours: (n) => `vor ${n} Std.`,
    days: (n) => `vor ${n} Tag${n > 1 ? "en" : ""}`,
    dateFormat: "de-DE",
  },
  es: {
    justNow: "ahora mismo",
    minutes: (n) => `hace ${n} min`,
    hours: (n) => `hace ${n} h`,
    days: (n) => `hace ${n} d`,
    dateFormat: "es-ES",
  },
  ar: {
    justNow: "الآن",
    minutes: (n) => `منذ ${n} دقيقة`,
    hours: (n) => `منذ ${n} ساعة`,
    days: (n) => `منذ ${n} يوم`,
    dateFormat: "ar-SA",
  },
  en: {
    justNow: "just now",
    minutes: (n) => `${n}m ago`,
    hours: (n) => `${n}h ago`,
    days: (n) => `${n}d ago`,
    dateFormat: "en-US",
  },
};

type LocaleFamily = keyof typeof RELATIVE_TIME_MESSAGES;

const LOCALE_FAMILIES = Object.keys(RELATIVE_TIME_MESSAGES) as LocaleFamily[];

function resolveLocaleFamily(locale: string): LocaleFamily {
  const prefix = locale.split("-")[0]?.toLowerCase() ?? "en";
  if ((LOCALE_FAMILIES as readonly string[]).includes(prefix)) return prefix as LocaleFamily;
  return "en";
}

export function formatRelativeTime(timestamp: number, locale: string): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const family = resolveLocaleFamily(locale);
  const msgs = RELATIVE_TIME_MESSAGES[family]!;

  if (seconds < 60) return msgs.justNow;
  if (minutes < 60) return msgs.minutes(minutes);
  if (hours < 24) return msgs.hours(hours);
  if (days < 7) return msgs.days(days);
  return new Date(timestamp).toLocaleDateString(msgs.dateFormat);
}
