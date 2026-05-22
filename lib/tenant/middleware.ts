import { type NextRequest, type NextResponse } from 'next/server';
import { TenantStatus, PlanType } from './types';
import { tenantManager } from './manager';
import { logger } from '../logger';

interface TenantResolutionResult {
  tenantId: string;
  tenantName: string;
  plan: PlanType;
  status: TenantStatus;
  resolvedBy: 'header' | 'subdomain' | 'custom_domain' | 'default';
}

class TenantMiddleware {
  async resolveTenant(request: NextRequest): Promise<TenantResolutionResult> {
    const host = request.headers.get('host') || '';
    const tenantIdHeader = request.headers.get('x-tenant-id');

    // 优先级1: 从请求头获取
    if (tenantIdHeader) {
      return this.resolveFromHeader(tenantIdHeader);
    }

    // 优先级2: 从子域名或自定义域名解析
    if (host) {
      const domainResult = await this.resolveFromDomain(host);
      if (domainResult) {
        return domainResult;
      }
    }

    // 默认租户（单租户模式）
    return this.resolveDefaultTenant();
  }

  private async resolveFromHeader(tenantId: string): Promise<TenantResolutionResult> {
    const tenant = await tenantManager.findById(tenantId);

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    if (tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.EXPIRED) {
      throw new Error(`Tenant is not active: ${tenant.status}`);
    }

    logger.debug('Tenant resolved from header', {
      tenantId,
      name: tenant.name,
    });

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      resolvedBy: 'header',
    };
  }

  private async resolveFromDomain(host: string): Promise<TenantResolutionResult | null> {
    // 移除端口号
    const hostname = host.split(':')[0];

    // 检查是否是自定义域名
    const customDomainTenant = await tenantManager.findByDomain(hostname);
    
    if (customDomainTenant && customDomainTenant.status !== TenantStatus.SUSPENDED) {
      logger.debug('Tenant resolved from custom domain', {
        tenantId: customDomainTenant.id,
        domain: hostname,
      });

      return {
        tenantId: customDomainTenant.id,
        tenantName: customDomainTenant.name,
        plan: customDomainTenant.plan,
        status: customDomainTenant.status,
        resolvedBy: 'custom_domain',
      };
    }

    // 检查子域名格式 (e.g., company.app.example.com)
    const parts = hostname.split('.');
    
    if (parts.length >= 3) {
      const slug = parts[0];
      const subdomainTenant = await tenantManager.findBySlug(slug);

      if (subdomainTenant && subdomainTenant.status !== TenantStatus.SUSPENDED) {
        logger.debug('Tenant resolved from subdomain', {
          tenantId: subdomainTenant.id,
          slug,
          hostname,
        });

        return {
          tenantId: subdomainTenant.id,
          tenantName: subdomainTenant.name,
          plan: subdomainTenant.plan,
          status: subdomainTenant.status,
          resolvedBy: 'subdomain',
        };
      }
    }

    return null;
  }

  private resolveDefaultTenant(): TenantResolutionResult {
    const defaultTenantId = process.env.DEFAULT_TENANT_ID;

    if (!defaultTenantId) {
      throw new Error('No default tenant configured and unable to resolve tenant from request');
    }

    logger.debug('Using default tenant', { tenantId: defaultTenantId });

    return {
      tenantId: defaultTenantId,
      tenantName: 'Default',
      plan: PlanType.ENTERPRISE,
      status: TenantStatus.ACTIVE,
      resolvedBy: 'default',
    };
  }

  createTenantHeaders(result: TenantResolutionResult): Record<string, string> {
    return {
      'x-tenant-id': result.tenantId,
      'x-tenant-name': result.tenantName,
      'x-tenant-plan': result.plan,
      'x-tenant-status': result.status,
    };
  }
}

export const tenantMiddleware = new TenantMiddleware();
export { TenantMiddleware };
