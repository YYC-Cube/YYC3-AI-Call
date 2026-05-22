/**
 * file logger.ts
 * description 日志系统
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 日志系统
 */
const DEBUG = typeof process !== 'undefined' && process.env?.['YYC3_DEBUG'] === 'true';

export const logger = {
  debug: (...args: unknown[]) => { if (DEBUG) console.debug('[YYC3:DEBUG]', ...args); },
  info: (...args: unknown[]) => { if (DEBUG) console.info('[YYC3]', ...args); },
  warn: (...args: unknown[]) => { if (DEBUG) console.warn('[YYC3]', ...args); },
  error: (...args: unknown[]) => console.error('[YYC3]', ...args),
  init: (msg: string) => { if (DEBUG) console.log(`🚀 ${msg}`); },
  step: (num: number, msg: string) => { if (DEBUG) console.log(`${num}️⃣ ${msg}`); },
  done: (msg: string) => { if (DEBUG) console.log(`✅ ${msg}`); },
  stat: (key: string, val: string) => { if (DEBUG) console.log(`   - ${key}: ${val}`); },
};
