/**
 * file index.ts
 * description @yyc3/ai-hub 模块入口
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub 模块入口
 */
import { YYC3ErrorCode } from './codes.js';
import { ERROR_MESSAGES } from './messages.js';
import type { YYC3ErrorContext } from './messages.js';

export { YYC3ErrorCode } from './codes.js';
export { YYC3_ERROR_DOMAINS, YYC3_ERROR_DOMAINS_EN } from './codes.js';

export type Locale = 'zh' | 'en';

let currentLocale: Locale = 'zh';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export class YYC3Error extends Error {
  public readonly code: YYC3ErrorCode;
  public readonly context: YYC3ErrorContext;
  public readonly domain: string;
  public readonly cause?: Error;

  constructor(
    code: YYC3ErrorCode,
    context: YYC3ErrorContext = {},
    cause?: Error
  ) {
    const template = ERROR_MESSAGES[code];
    const msg = template ? renderMessage(template[currentLocale], context) : String(code);
    super(msg);

    this.name = 'YYC3Error';
    this.code = code;
    this.context = context;
    this.domain = code.split('_')[0];
    this.cause = cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YYC3Error);
    }
  }

  get messageZh(): string {
    return renderMessage(ERROR_MESSAGES[this.code]?.zh || '', this.context);
  }

  get messageEn(): string {
    return renderMessage(ERROR_MESSAGES[this.code]?.en || '', this.context);
  }

  toJSON(): {
    name: string;
    code: string;
    domain: string;
    message: string;
    messageZh: string;
    messageEn: string;
    context: YYC3ErrorContext;
  } {
    return {
      name: this.name,
      code: this.code,
      domain: this.domain,
      message: this.message,
      messageZh: this.messageZh,
      messageEn: this.messageEn,
      context: this.context,
    };
  }

  static isYYC3Error(error: unknown): error is YYC3Error {
    return error instanceof YYC3Error;
  }

  static fromError(error: unknown, fallbackCode?: YYC3ErrorCode): YYC3Error {
    if (error instanceof YYC3Error) return error;

    const code = fallbackCode ?? YYC3ErrorCode.HUB_EXECUTE_FAILED;
    const cause = error instanceof Error ? error : new Error(String(error));

    return new YYC3Error(code, { originalMessage: cause.message }, cause);
  }
}

function renderMessage(template: string, context: YYC3ErrorContext): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = context[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}
