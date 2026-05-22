/**
 * @fileoverview 统一输入验证 Schema
 * @description 使用 Zod 定义所有 API 的输入验证规则
 * @module lib/validations
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { z } from 'zod';

// 基础类型定义
export const BaseSchemas = {
  // ID 验证（CUID 或 UUID）
  id: z.string().cuid('无效的ID格式'),

  // 分页参数
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // 排序参数
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  // 时间范围
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).refine(
    (data) => data.startDate <= data.endDate,
    { message: '开始时间不能晚于结束时间' }
  ),
};

// 用户相关 Schema
export const UserSchemas = {
  register: z.object({
    email: z.string()
      .email('请输入有效的邮箱地址')
      .max(255, '邮箱地址过长'),
    password: z.string()
      .min(8, '密码长度至少8个字符')
      .max(100, '密码长度不能超过100个字符')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
    name: z.string()
      .min(2, '姓名长度至少2个字符')
      .max(100, '姓名长度不能超过100个字符'),
    phone: z.string()
      .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
      .optional(),
  }),

  login: z.object({
    email: z.string()
      .email('请输入有效的邮箱地址'),
    password: z.string()
      .min(1, '请输入密码'),
  }),

  updateProfile: z.object({
    name: z.string()
      .min(2, '姓名长度至少2个字符')
      .max(100)
      .optional(),
    phone: z.string()
      .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
      .optional(),
    avatar: z.string()
      .url('请输入有效的头像URL')
      .optional(),
  }),
};

const customerCreateSchema = z.object({
  name: z.string()
    .min(1, '客户名称不能为空')
    .max(100, '客户名称长度不能超过100个字符'),
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  email: z.string()
    .email('请输入有效的邮箱地址')
    .nullable()
    .optional(),
  company: z.string()
    .max(200, '公司名称长度不能超过200个字符')
    .optional(),
  position: z.string()
    .max(100, '职位长度不能超过100个字符')
    .optional(),
  industry: z.string()
    .max(50, '行业长度不能超过50个字符')
    .optional(),
  source: z.string()
    .max(50)
    .optional(),
  status: z.enum([
    'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL',
    'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED'
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  notes: z.string()
    .max(5000, '备注长度不能超过5000个字符')
    .optional(),
});

const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.enum([
    'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL',
    'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED'
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: '开始时间不能晚于结束时间' }
);

export const CustomerSchemas = {
  create: customerCreateSchema,
  update: customerCreateSchema.partial(),
  query: customerQuerySchema,
};

export const CallSchemas = {
  create: z.object({
    customerId: z.string().cuid('无效的客户ID'),
    type: z.enum(['INBOUND', 'OUTBOUND']).default('OUTBOUND'),
  }),

  update: z.object({
    status: z.enum([
      'PENDING', 'IN_PROGRESS', 'COMPLETED',
      'FAILED', 'CANCELLED', 'NO_ANSWER', 'BUSY'
    ]).optional(),
    duration: z.number().int().nonnegative().optional(),
    recordingUrl: z.string().url().optional(),
    transcript: z.string().max(10000).optional(),
    intent: z.string().max(50).optional(),
    sentiment: z.string().max(50).optional(),
    score: z.number().min(-1).max(1).optional(),
    notes: z.string().max(5000).optional(),
  }),

  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    customerId: z.string().cuid().optional(),
    userId: z.string().cuid().optional(),
    status: z.enum([
      'PENDING', 'IN_PROGRESS', 'COMPLETED',
      'FAILED', 'CANCELLED', 'NO_ANSWER', 'BUSY'
    ]).optional(),
    type: z.enum(['INBOUND', 'OUTBOUND']).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }).refine(
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: '开始时间不能晚于结束时间' }
  ),
};

export const AISchemas = {
  transcribe: z.object({
    audioData: z.any(),
    language: z.string().length(2).optional(),
    model: z.enum(['base', 'small', 'medium', 'large']).optional(),
  }),

  synthesize: z.object({
    text: z.string()
      .min(1, '文本内容不能为空')
      .max(5000, '文本长度不能超过5000个字符'),
    voiceId: z.string().optional(),
    speed: z.number().min(0.5).max(2.0).optional(),
    emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'surprised']).optional(),
  }),

  analyzeIntent: z.object({
    text: z.string()
      .min(1, '文本内容不能为空')
      .max(1000, '文本长度不能超过1000个字符'),
  }),

  analyzeSentiment: z.object({
    text: z.string()
      .min(1, '文本内容不能为空')
      .max(1000),
  }),
};

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(err => err.message);
    return { success: false, error: errors.join('; ') };
  }

  return { success: true, data: result.data };
}

export function formatValidationError(error: string) {
  return {
    error: '输入验证失败',
    code: 'VALIDATION_ERROR',
    details: error,
  };
}
