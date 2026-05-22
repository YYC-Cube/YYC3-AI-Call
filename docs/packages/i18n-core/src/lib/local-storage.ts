/**
 * file local-storage.ts
 * description 本地存储持久化
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
 * brief 本地存储持久化
 */
export function getSafeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const testKey = '__yyc3_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (e) {
    return null;
  }
}
