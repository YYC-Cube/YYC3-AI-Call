export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  meta?: ResponseMeta;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: Date;
  duration: number;
  rateLimitRemaining?: number;
  cacheStatus?: CacheStatus;
}

export enum CacheStatus {
  HIT = 'hit',
  MISS = 'miss',
  STALE = 'stale',
  BYPASS = 'bypass'
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetail[];
  statusCode: number;
  traceId?: string;
  suggestion?: string;
  documentationUrl?: string;
}

export interface ErrorDetail {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  BAD_REQUEST = 'BAD_REQUEST'
}

export interface QueryOptions {
  filter?: Record<string, unknown>;
  sort?: SortOption[];
  pagination?: PaginationOptions;
  include?: string[];
  fields?: string[];
  search?: string;
  cache?: CacheOptions;
}

export interface SortOption {
  field: string;
  direction: SortDirection;
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
  strategy?: CacheStrategy;
  tags?: string[];
}

export enum CacheStrategy {
  CACHE_FIRST = 'cache_first',
  NETWORK_FIRST = 'network_first',
  CACHE_ONLY = 'cache_only',
  NETWORK_ONLY = 'network_only',
  STALE_WHILE_REVALIDATE = 'stale_while_revalidate'
}

export interface EventPayload<T = unknown> {
  eventType: string;
  payload: T;
  timestamp: Date;
  source: string;
  version: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface EventHandler<T = unknown> {
  (event: EventPayload<T>): Promise<void>;
}

export interface EventBusConfig {
  maxListeners?: number;
  enablePersistence?: boolean;
  enableDeadLetterQueue?: boolean;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  initialDelay: number;
  maxDelay: number;
}

export enum BackoffStrategy {
  FIXED = 'fixed',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  EXPONENTIAL_WITH_JITTER = 'exponential_with_jitter'
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  outcome: AuditOutcome;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  CONFIG_CHANGE = 'config_change',
  PERMISSION_CHANGE = 'permission_change',
  BULK_OPERATION = 'bulk_operation',
  CUSTOM = 'custom'
}

export enum ResourceType {
  USER = 'user',
  ORGANIZATION = 'organization',
  EMPLOYEE = 'employee',
  DEPARTMENT = 'department',
  GOAL = 'goal',
  KPI = 'kpi',
  APPROVAL = 'approval',
  TICKET = 'ticket',
  DOCUMENT = 'document',
  REPORT = 'report',
  CONFIGURATION = 'configuration',
  INTEGRATION = 'integration',
  API_KEY = 'api_key',
  WEBHOOK = 'webhook',
  OTHER = 'other'
}

export enum AuditOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL_SUCCESS = 'partial_success',
  DENIED = 'denied',
  ERROR = 'error'
}

export interface NotificationMessage {
  id: string;
  recipientId: string;
  recipientType: RecipientType;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: NotificationPriority;
  status: NotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  expireAt?: Date;
  metadata?: Record<string, unknown>;
}

export enum RecipientType {
  USER = 'user',
  ROLE = 'role',
  DEPARTMENT = 'department',
  ORGANIZATION = 'organization',
  CHANNEL = 'channel',
  WEBHOOK = 'webhook'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WECHAT = 'wechat',
  SLACK = 'slack',
  WEBHOOK = 'webhook'
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ACTION_REQUIRED = 'action_required',
  REMINDER = 'reminder',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  configuration: Record<string, unknown>;
  credentials?: EncryptedCredentials;
  capabilities: IntegrationCapability[];
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  syncFrequency: SyncFrequency;
  errorCount: number;
  lastError?: string;
  healthCheckStatus: HealthStatus;
  metadata?: Record<string, unknown>;
}

export enum IntegrationType {
  CRM = 'crm',
  ERP = 'erp',
  HRMS = 'hrms',
  ACCOUNTING = 'accounting',
  EMAIL = 'email',
  CALENDAR = 'calendar',
  STORAGE = 'storage',
  COMMUNICATION = 'communication',
  ANALYTICS = 'analytics',
  AI_ML = 'ai_ml',
  PAYMENT = 'payment',
  ECOMMERCE = 'ecommerce',
  CUSTOM = 'custom'
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CONFIGURING = 'configuring',
  PAUSED = 'paused',
  DEPRECATED = 'deprecated'
}

export interface EncryptedCredentials {
  encryptedData: string;
  algorithm: string;
  keyId: string;
  iv: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface IntegrationCapability {
  name: string;
  description: string;
  supportedActions: string[];
  rateLimits?: RateLimit;
  authenticationMethod: AuthMethod;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerDay: number;
  requestsPerMonth: number;
  burstAllowed: boolean;
}

export enum AuthMethod {
  OAUTH_2 = 'oauth_2',
  API_KEY = 'api_key',
  BASIC_AUTH = 'basic_auth',
  BEARER_TOKEN = 'bearer_token',
  JWT = 'jwt',
  CUSTOM = 'custom'
}

export enum SyncFrequency {
  REALTIME = 'realtime',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MANUAL = 'manual'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
  MAINTENANCE = 'maintenance'
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryConfig: RetryPolicy;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  attemptNumber: number;
  status: WebhookEventStatus;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  nextRetryAt?: Date;
  createdAt: Date;
}

export enum WebhookEventStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
  TIMEOUT = 'timeout'
}
