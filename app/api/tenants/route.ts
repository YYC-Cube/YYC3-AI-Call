import { NextRequest, NextResponse } from 'next/server';
import { tenantManager } from '@/lib/tenant/manager';
import { tenantMiddleware } from '@/lib/tenant/middleware';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const tenantContext = await tenantMiddleware.resolveTenant(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const search = searchParams.get('search');

    // 只有管理员可以查看所有租户列表
    // 这里简化处理，实际应检查用户权限

    const result = await tenantManager.listTenants({
      page,
      limit,
      status: status as any,
      plan: plan as any,
      search: search || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result.tenants,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to list tenants', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to list tenants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, ownerId, ownerEmail, plan, isolationStrategy, settings } = body;

    if (!name || !slug || !ownerId || !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'name, slug, ownerId, and ownerEmail are required' },
        { status: 400 }
      );
    }

    // 验证slug格式
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid slug format. Must be 3-50 lowercase alphanumeric characters with hyphens' },
        { status: 400 }
      );
    }

    const tenant = await tenantManager.createTenant({
      name,
      slug,
      ownerId,
      ownerEmail,
      plan,
      isolationStrategy,
      settings,
    });

    logger.info('Tenant created via API', {
      tenantId: tenant.id,
      name: tenant.name,
      createdBy: ownerId,
    });

    return NextResponse.json({
      success: true,
      data: tenant,
    }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create tenant';
    
    logger.error('Failed to create tenant', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: errorMessage.includes('already exists') ? 409 : 500 }
    );
  }
}
