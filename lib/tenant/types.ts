export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

export enum IsolationStrategy {
  SCHEMA = 'schema',           // Schema隔离（PostgreSQL schema per tenant）
  ROW_LEVEL = 'row_level',     // 行级隔离（tenant_id列）
  DATABASE = 'database',       // 数据库隔离（独立数据库）
}

export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: PlanType;
  isolationStrategy: IsolationStrategy;
  
  // 配额限制
  quotas: TenantQuotas;
  
  // 域名配置
  domains: string[];
  customDomain?: string;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  
  // 管理信息
  ownerId: string;
  adminEmails: string[];
  settings: TenantSettings;
}

export interface TenantQuotas {
  maxUsers: number;
  maxTasksPerMonth: number;
  maxCallsPerMonth: number;
  maxStorageGB: number;
  maxAPIRequestsPerDay: number;
  maxConcurrentCalls: number;
  features: string[];           // 启用的功能列表
}

export type QuotaKey = Exclude<keyof TenantQuotas, 'features'>;

export interface TenantSettings {
  timezone: string;
  locale: string;
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    webhookUrl?: string;
  };
  ai: {
    defaultModel: string;
    maxTokensPerCall: number;
    allowedLanguages: string[];
  };
  security: {
    ipWhitelist: string[];
    sessionTimeoutMinutes: number;
    mfaRequired: boolean;
  };
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  userId: string;
  userRole: string;
  plan: PlanType;
  permissions: string[];
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail: string;
  plan?: PlanType;
  isolationStrategy?: IsolationStrategy;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantInput {
  name?: string;
  status?: TenantStatus;
  plan?: PlanType;
  settings?: Partial<TenantSettings>;
  domains?: string[];
  customDomain?: string;
  subscriptionEndsAt?: Date;
}
