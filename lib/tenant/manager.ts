import { Tenant, TenantStatus, PlanType, IsolationStrategy, type CreateTenantInput, type UpdateTenantInput, type TenantContext, type TenantQuotas, type QuotaKey } from './types';
import { logger } from '../logger';

const DEFAULT_QUOTAS: Record<PlanType, TenantQuotas> = {
  [PlanType.FREE]: {
    maxUsers: 2,
    maxTasksPerMonth: 100,
    maxCallsPerMonth: 50,
    maxStorageGB: 1,
    maxAPIRequestsPerDay: 1000,
    maxConcurrentCalls: 2,
    features: ['basic_calling', 'basic_analytics'],
  },
  [PlanType.STARTER]: {
    maxUsers: 10,
    maxTasksPerMonth: 1000,
    maxCallsPerMonth: 500,
    maxStorageGB: 10,
    maxAPIRequestsPerDay: 10000,
    maxConcurrentCalls: 10,
    features: ['basic_calling', 'basic_analytics', 'api_access', 'webhooks'],
  },
  [PlanType.PROFESSIONAL]: {
    maxUsers: 50,
    maxTasksPerMonth: 10000,
    maxCallsPerMonth: 5000,
    maxStorageGB: 50,
    maxAPIRequestsPerDay: 50000,
    maxConcurrentCalls: 25,
    features: ['basic_calling', 'advanced_analytics', 'api_access', 'webhooks', 'custom_agents', 'ssO_integration'],
  },
  [PlanType.ENTERPRISE]: {
    maxUsers: -1, // unlimited
    maxTasksPerMonth: -1,
    maxCallsPerMonth: -1,
    maxStorageGB: -1,
    maxAPIRequestsPerDay: -1,
    maxConcurrentCalls: -1,
    features: ['*'], // all features
  },
};

class TenantManager {
  private tenantCache: Map<string, Tenant> = new Map();
  private slugCache: Map<string, string> = new Map(); // slug -> tenantId

  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const existingBySlug = await this.findBySlug(input.slug);
    if (existingBySlug) {
      throw new Error(`Tenant with slug "${input.slug}" already exists`);
    }

    const plan = input.plan || PlanType.FREE;
    const isolationStrategy = input.isolationStrategy || IsolationStrategy.ROW_LEVEL;

    const tenant: Tenant = {
      id: this.generateTenantId(),
      name: input.name,
      slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      status: plan === PlanType.FREE ? TenantStatus.TRIAL : TenantStatus.ACTIVE,
      plan,
      isolationStrategy,
      
      quotas: { ...DEFAULT_QUOTAS[plan] },
      
      domains: [],
      settings: this.getDefaultSettings(input.settings),
      
      createdAt: new Date(),
      updatedAt: new Date(),
      trialEndsAt: plan === PlanType.FREE 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14天试用
        : undefined,
      
      ownerId: input.ownerId,
      adminEmails: [input.ownerEmail],
    };

    // TODO: 实际实现中应保存到数据库
    // await prisma.tenant.create({ data: tenant });
    
    this.cacheTenant(tenant);

    logger.info('Tenant created', {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      ownerEmail: input.ownerEmail,
    });

    return tenant;
  }

  async updateTenant(tenantId: string, input: UpdateTenantInput): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const updatedTenant: Tenant = {
      ...tenant,
      ...input,
      updatedAt: new Date(),
      
      // 如果更新了plan，需要更新配额
      quotas: input.plan 
        ? { ...DEFAULT_QUOTAS[input.plan] }
        : tenant.quotas,
        
      // 合并settings
      settings: input.settings
        ? { ...tenant.settings, ...input.settings }
        : tenant.settings,
    };

    // TODO: 更新数据库
    // await prisma.tenant.update({ where: { id: tenantId }, data: updatedTenant });

    this.cacheTenant(updatedTenant);

    logger.info('Tenant updated', {
      tenantId,
      changes: Object.keys(input),
    });

    return updatedTenant;
  }

  async findById(tenantId: string): Promise<Tenant | null> {
    // 先查缓存
    let tenant = this.tenantCache.get(tenantId);
    
    if (tenant) {
      return tenant;
    }

    // TODO: 从数据库查询
    // tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    
    if (tenant) {
      this.cacheTenant(tenant);
    }

    return tenant || null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const cachedTenantId = this.slugCache.get(slug);
    
    if (cachedTenantId) {
      return this.tenantCache.get(cachedTenantId) || null;
    }

    // TODO: 从数据库查询
    // const tenant = await prisma.tenant.findUnique({ where: { slug } });
    
    // 模拟返回null（实际应从DB获取）
    return null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    // TODO: 实现域名查找逻辑
    // 支持自定义域名和子域名两种模式
    
    for (const [, tenant] of this.tenantCache) {
      if (tenant.domains.includes(domain) || tenant.customDomain === domain) {
        return tenant;
      }
    }

    // TODO: 数据库查询
    return null;
  }

  async listTenants(filters?: {
    status?: TenantStatus;
    plan?: PlanType;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tenants: Tenant[]; total: number }> {
    // TODO: 实现带过滤和分页的列表查询
    
    const allTenants = Array.from(this.tenantCache.values());
    
    let filtered = allTenants;

    if (filters?.status) {
      filtered = filtered.filter(t => t.status === filters.status!);
    }

    if (filters?.plan) {
      filtered = filtered.filter(t => t.plan === filters.plan!);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.slug.includes(searchLower)
      );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;
    const paginatedTenants = filtered.slice(start, start + limit);

    return {
      tenants: paginatedTenants,
      total: filtered.length,
    };
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    
    if (!tenant) {
      return false;
    }

    // TODO: 删除所有关联数据（级联删除或软删除）
    // await prisma.tenant.delete({ where: { id: tenantId } });
    
    this.tenantCache.delete(tenantId);
    this.slugCache.delete(tenant.slug);

    logger.warn('Tenant deleted', { tenantId, name: tenant.name });

    return true;
  }

  async suspendTenant(tenantId: string, reason?: string): Promise<Tenant> {
    return this.updateTenant(tenantId, {
      status: TenantStatus.SUSPENDED,
    });
  }

  async activateTenant(tenantId: string): Promise<Tenant> {
    return this.updateTenant(tenantId, {
      status: TenantStatus.ACTIVE,
    });
  }

  checkQuotaUsage(
    tenant: Tenant,
    quotaKey: QuotaKey,
    currentValue: number
  ): { allowed: boolean; remaining: number; limit: number } {
    const limit = tenant.quotas[quotaKey];
    
    if (limit === -1) {
      // 无限制
      return { allowed: true, remaining: Infinity, limit: -1 };
    }

    const remaining = Math.max(0, limit - currentValue);
    const allowed = currentValue < limit;

    return { allowed, remaining, limit };
  }

  async upgradePlan(tenantId: string, newPlan: PlanType): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    if (this.getPlanPriority(newPlan) <= this.getPlanPriority(tenant.plan)) {
      throw new Error(`Cannot downgrade from ${tenant.plan} to ${newPlan}`);
    }

    return this.updateTenant(tenantId, {
      plan: newPlan,
      status: TenantStatus.ACTIVE,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后到期
    });
  }

  createTenantContext(tenant: Tenant, userId: string, userRole: string): TenantContext {
    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      userId,
      userRole,
      plan: tenant.plan,
      permissions: tenant.quotas.features,
    };
  }

  private getDefaultSettings(overrides?: Partial<Tenant['settings']>): Tenant['settings'] {
    return {
      timezone: 'Asia/Shanghai',
      locale: 'zh-CN',
      branding: {},
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
      },
      ai: {
        defaultModel: 'gpt-4',
        maxTokensPerCall: 4096,
        allowedLanguages: ['zh-CN', 'en-US'],
      },
      security: {
        ipWhitelist: [],
        sessionTimeoutMinutes: 30,
        mfaRequired: false,
      },
      ...overrides,
    };
  }

  private cacheTenant(tenant: Tenant): void {
    this.tenantCache.set(tenant.id, tenant);
    this.slugCache.set(tenant.slug, tenant.id);
  }

  private generateTenantId(): string {
    return `tenant_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private getPlanPriority(plan: PlanType): number {
    const priorities = {
      [PlanType.FREE]: 0,
      [PlanType.STARTER]: 1,
      [PlanType.PROFESSIONAL]: 2,
      [PlanType.ENTERPRISE]: 3,
    };
    return priorities[plan];
  }
}

export const tenantManager = new TenantManager();
export { TenantManager };
