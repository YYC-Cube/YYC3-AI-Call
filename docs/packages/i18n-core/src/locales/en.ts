/**
 * file en.ts
 * description @yyc3/i18n-core locales/en.ts 模块
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[i18n]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core locales/en.ts 模块
 */
export const en = {
  common: {
    health: "Health",
    online: "Online",
    offline: "Offline",
    welcome: "Welcome",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    version: "v2.0.0",
  },
  nav: {
    home: "Home",
    about: "About",
    contact: "Contact",
  },
  overview: {
    stats: {
      cronNext: "Next wake {time}",
    },
  },
  welcome: {
    message: "Hello {name}",
    title: "Welcome to YYC³ i18n Core",
  },
} as const;

export type TranslationMap = typeof en;
