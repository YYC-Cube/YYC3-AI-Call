import { z } from 'zod';
import type { NextRequest } from 'next/server';

export const SecuritySchemas = {
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
    .transform(val => val.trim()),

  email: z
    .string()
    .email('邮箱格式不正确')
    .max(254, '邮箱长度不能超过254字符')
    .toLowerCase(),

  id: z
    .string()
    .cuid()
    .or(z.string().uuid())
    .or(z.coerce.number().int().positive()),

  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date().refine(
      (date) => date >= new Date('2020-01-01'),
      { message: '开始日期不能早于2020年' }
    ),
  }).refine(
    (data) => data.endDate >= data.startDate,
    { message: '结束日期必须大于等于开始日期' }
  ),

  searchQuery: z
    .string()
    .max(200, '搜索关键词不能超过200字符')
    .transform(val => val.trim())
    .refine(
      val => !/<script|javascript:|on\w+=/i.test(val),
      { message: '包含非法字符' }
    ),

  taskId: z.string().cuid({ message: '任务ID格式不正确' }),

  callRecordId: z.string().cuid({ message: '通话记录ID格式不正确' }),

  agentConfig: z.object({
    name: z.string().min(1).max(50),
    role: z.string().min(1).max(100),
    personality: z.string().max(500).optional(),
    voiceType: z.enum(['male', 'female', 'child']).default('male'),
    language: z.string().length(2).default('zh'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().min(50).max(4096).default(500),
  }),

  batchOperation: z.object({
    ids: z.array(z.string().cuid()).min(1).max(100, '批量操作不能超过100条'),
    operation: z.enum(['delete', 'archive', 'export']),
  }),

  fileUpload: z.object({
    filename: z
      .string()
      .max(255)
      .regex(/^[a-zA-Z0-9_\-.\u4e00-\u9fa5]+$/, '文件名包含非法字符'),
    size: z.number().max(10 * 1024 * 1024, '文件大小不能超过10MB'),
    mimetype: z.enum([
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]),
  }),
};

export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];
  
  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ValidationError(
      `${context || '输入验证失败'}: ${result.error.issues[0]?.message || '未知错误'}`,
      result.error.issues
    );
  }
  
  return result.data;
}

export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  request: NextRequest
): Promise<T> {
  return request.json().then(data => validateInput(schema, data));
}

export function validateSearchParams<T>(
  schema: z.ZodSchema<T>,
  request: NextRequest
): T {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  return validateInput(schema, params);
}

export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function escapeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return input.replace(/[&<>"']/g, char => htmlEntities[char]);
}

export function preventXSS(input: string): string {
  let sanitized = input;
  
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/data:\s*text\/html/gi, '');
  
  return sanitized.trim();
}

export function validatePhoneNumber(phone: string): boolean {
  return SecuritySchemas.phone.safeParse(phone).success;
}

export function validateEmail(email: string): boolean {
  return SecuritySchemas.email.safeParse(email).success;
}

export type SecurityValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

export async function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<SecurityValidationResult<T>> {
  try {
    const result = await schema.parseAsync(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: new ValidationError('验证失败', error.issues),
      };
    }
    throw error;
  }
}
