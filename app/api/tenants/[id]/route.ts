import { NextRequest, NextResponse } from 'next/server';
import { tenantManager } from '@/lib/tenant/manager';
import { logger } from '@/lib/logger';

export function generateStaticParams() {
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await tenantManager.findById(id);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // 检查配额使用情况（示例）
    const quotaStatus = {
      users: tenantManager.checkQuotaUsage(tenant, 'maxUsers', 5),
      tasks: tenantManager.checkQuotaUsage(tenant, 'maxTasksPerMonth', 150),
      calls: tenantManager.checkQuotaUsage(tenant, 'maxCallsPerMonth', 30),
      storage: tenantManager.checkQuotaUsage(tenant, 'maxStorageGB', 2.5),
    };

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        quotaUsage: quotaStatus,
      },
    });
  } catch (error) {
    logger.error('Failed to get tenant', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to get tenant' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedTenant = await tenantManager.updateTenant(id, body);

    logger.info('Tenant updated via API', {
      tenantId: id,
      changes: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      data: updatedTenant,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant';
    
    logger.error('Failed to update tenant', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: errorMessage.includes('not found') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await tenantManager.deleteTenant(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    logger.warn('Tenant deleted via API', { tenantId: id });

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete tenant', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
