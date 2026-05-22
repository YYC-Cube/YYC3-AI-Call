interface SanitizedError {
  message: string;
  code: string;
  requestId?: string;
  timestamp: string;
  isOperational: boolean;
}

interface ErrorSanitizationOptions {
  includeStack?: boolean;
  includeDetails?: boolean;
  maskSensitiveData?: boolean;
  customSanitizer?: (error: Error) => Partial<SanitizedError>;
}

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /token/i,
  /credential/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /private[_-]?key/i,
  /access[_-]?key/i,
];

const CONNECTION_STRING_PATTERNS = [
  /mongodb(?:\+srv)?:\/\/[^@]+@/,
  /postgresql?:\/\/[^@]+@/,
  /mysql:\/\/[^@]+@/,
  /redis:\/\/[^@]+@/,
];

const STACK_TRACE_PATTERNS_TO_REMOVE = [
  /\/node_modules\//g,
  /\/\.next\//g,
  /internal\//g,
];

export class ErrorSanitizer {
  private static instance: ErrorSanitizer;

  static getInstance(): ErrorSanitizer {
    if (!ErrorSanitizer.instance) {
      ErrorSanitizer.instance = new ErrorSanitizer();
    }
    return ErrorSanitizer.instance;
  }

  sanitize(
    error: unknown,
    options: ErrorSanitizationOptions = {}
  ): SanitizedError {
    const isProduction = process.env.NODE_ENV === 'production';

    const defaults: ErrorSanitizationOptions = {
      includeStack: !isProduction,
      includeDetails: !isProduction,
      maskSensitiveData: true,
      ...options,
    };

    const errorObj = this.normalizeError(error);

    const sanitized: SanitizedError = {
      message: this.sanitizeMessage(errorObj.message, defaults),
      code: this.categorizeError(errorObj),
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      isOperational: this.isOperationalError(errorObj),
    };

    if (defaults.customSanitizer) {
      Object.assign(sanitized, defaults.customSanitizer(errorObj));
    }

    if (errorObj.stack && defaults.includeStack) {
      (sanitized as any).stack = this.sanitizeStackTrace(errorObj.stack);
    }

    if (defaults.includeDetails && errorObj instanceof Error && errorObj.cause) {
      (sanitized as any).cause = this.sanitize(errorObj.cause, {
        ...defaults,
        includeStack: false,
      });
    }

    return sanitized;
  }

  sanitizeForLogging(error: unknown): object {
    const sanitized = this.sanitize(error, {
      includeStack: true,
      includeDetails: true,
      maskSensitiveData: false,
    });

    return {
      ...sanitized,
      environment: process.env.NODE_ENV,
      hostname: process.env.HOSTNAME || 'unknown',
      processId: process.pid,
    };
  }

  sanitizeForApiResponse(error: unknown, statusCode: number): object {
    const sanitized = this.sanitize(error, {
      includeStack: false,
      includeDetails: false,
      maskSensitiveData: true,
    });

    return {
      success: false,
      error: sanitized.message,
      code: sanitized.code,
      ...(sanitized.requestId && { requestId: sanitized.requestId }),
      ...(statusCode >= 500 &&
        !sanitized.isOperational && {
          message:
            'An unexpected error occurred. Please try again later or contact support.',
        }),
    };
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (typeof error === 'object' && error !== null) {
      const obj = error as Record<string, unknown>;
      return new Error(obj.message?.toString() || 'Unknown error');
    }

    return new Error('Unknown error occurred');
  }

  private sanitizeMessage(
    message: string,
    options: ErrorSanitizationOptions
  ): string {
    let sanitizedMessage = message;

    if (options.maskSensitiveData) {
      sanitizedMessage = this.maskSensitiveInfo(message);
      sanitizedMessage = this.maskConnectionStrings(sanitizedMessage);
    }

    return sanitizedMessage.substring(0, 500);
  }

  private maskSensitiveInfo(text: string): string {
    let masked = text;

    for (const pattern of SENSITIVE_PATTERNS) {
      masked = masked.replace(
        new RegExp(`(${pattern.source}[:=]\\s*['"]?)[^'"]*(['"]?)`, 'gi'),
        '$1***REDACTED***$2'
      );
    }

    return masked;
  }

  private maskConnectionStrings(text: string): string {
    let masked = text;

    for (const pattern of CONNECTION_STRING_PATTERNS) {
      masked = masked.replace(pattern, '$&'.replace(/[^@]+@/, '***:***@'));
    }

    return masked;
  }

  private categorizeError(error: Error): string {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('not found')) return 'E0004';
    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden'))
      return 'E0002';
    if (errorMessage.includes('validation') || errorMessage.includes('invalid'))
      return 'E0001';
    if (errorMessage.includes('duplicate') || errorMessage.includes('conflict'))
      return 'E0005';
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many'))
      return 'E0006';
    if (errorMessage.includes('connection') || errorMessage.includes('timeout'))
      return 'E0102';
    if (errorMessage.includes('network')) return 'E0103';

    return 'E0100';
  }

  private isOperationalError(error: Error): boolean {
    const operationalErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError',
      'ConflictError',
      'RateLimitError',
    ];

    return (
      operationalErrors.includes(error.name) ||
      (error as any).isOperational === true ||
      (error as any).statusCode < 500
    );
  }

  private sanitizeStackTrace(stack: string | undefined): string {
    if (!stack) return '';

    let sanitized = stack;

    for (const pattern of STACK_TRACE_PATTERNS_TO_REMOVE) {
      sanitized = sanitized.replace(pattern, '[filtered]');
    }

    return sanitized.split('\n').slice(0, 20).join('\n');
  }
}

export function createSafeErrorHandler(context: string) {
  const sanitizer = ErrorSanitizer.getInstance();

  return (error: unknown): object => {
    console.error(`[${context}] Error:`, sanitizer.sanitizeForLogging(error));

    const statusCode = getStatusCodeFromError(error);

    return sanitizer.sanitizeForApiResponse(error, statusCode);
  };
}

function getStatusCodeFromError(error: unknown): number {
  if (error instanceof Error) {
    const err = error as any;
    if (err.statusCode || err.status) {
      return err.statusCode || err.status;
    }

    const message = error.message.toLowerCase();
    if (message.includes('not found')) return 404;
    if (message.includes('unauthorized')) return 401;
    if (message.includes('forbidden')) return 403;
    if (message.includes('validation') || message.includes('invalid')) return 400;
    if (message.includes('conflict') || message.includes('duplicate')) return 409;
    if (message.includes('rate limit') || message.includes('too many')) return 429;
  }

  return 500;
}

export const globalErrorHandler = createSafeErrorHandler('Global');
