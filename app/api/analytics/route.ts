import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/engine';
import { dashboardManager } from '@/lib/analytics/dashboard';
import { TimeGranularity, AggregationType } from '@/lib/analytics/types';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const dashboardId = searchParams.get('dashboardId');

    switch (action) {
      case 'dashboard-data':
        if (!dashboardId) {
          return NextResponse.json(
            { success: false, error: 'dashboardId is required' },
            { status: 400 }
          );
        }

        const dashboardData = await dashboardManager.getDashboardData(dashboardId);
        return NextResponse.json({ success: true, data: dashboardData });

      case 'list-dashboards':
        const ownerId = searchParams.get('ownerId') || undefined;
        const dashboards = await dashboardManager.listDashboards({ ownerId });
        return NextResponse.json({ success: true, data: dashboards });

      default:
        return executeAnalyticsQuery(searchParams);
    }
  } catch (error) {
    logger.error('Analytics API error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'query':
        return handleQuery(params);

      case 'create-dashboard':
        return handleCreateDashboard(params);

      case 'add-widget':
        return handleAddWidget(params);

      case 'remove-widget':
        return handleRemoveWidget(params);

      case 'export':
        return handleExport(params);

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Analytics API POST error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function executeAnalyticsQuery(searchParams: URLSearchParams): Promise<NextResponse> {
  const type = searchParams.get('type') || 'call';
  const startDate = new Date(searchParams.get('start') || Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(searchParams.get('end') || Date.now());
  const granularity = (searchParams.get('granularity') || 'daily') as TimeGranularity;
  const groupBy = searchParams.get('groupBy')?.split(',').filter(Boolean);

  const query = {
    timeRange: {
      start: startDate,
      end: endDate,
      granularity,
    },
    ...(groupBy && { groupBy }),
  };

  let result;

  switch (type) {
    case 'call':
      result = await analyticsEngine.getCallAnalytics(query);
      break;
    case 'task':
      result = await analyticsEngine.getTaskAnalytics(query);
      break;
    case 'user-activity':
      result = await analyticsEngine.getUserActivityAnalytics(query);
      break;
    default:
      result = await analyticsEngine.executeQuery({
        metrics: [{
          field: 'count',
          label: 'Count',
          type: 'counter' as any,
          aggregation: AggregationType.COUNT,
        }],
        timeRange: query.timeRange,
        ...(groupBy && { groupBy }),
      });
  }

  // 趋势分析
  const trendAnalysis = await analyticsEngine.generateTrendAnalysis(
    type === 'call' ? 'call_count' : 'total_tasks',
    query.timeRange,
    granularity
  );

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      trend: trendAnalysis,
    },
  });
}

async function handleQuery(params: Record<string, unknown>): Promise<NextResponse> {
  const { metrics, timeRange, filters, groupBy, limit, offset } = params;

  if (!metrics || !timeRange) {
    return NextResponse.json(
      { success: false, error: 'metrics and timeRange are required' },
      { status: 400 }
    );
  }

  const result = await analyticsEngine.executeQuery({
    metrics: metrics as any,
    timeRange: timeRange as any,
    filters: filters as any,
    groupBy: groupBy as string[] | undefined,
    limit: limit as number | undefined,
    offset: offset as number | undefined,
  });

  return NextResponse.json({ success: true, data: result });
}

async function handleCreateDashboard(params: Record<string, unknown>): Promise<NextResponse> {
  const { name, description, ownerId, isPublic } = params;

  if (!name || !ownerId) {
    return NextResponse.json(
      { success: false, error: 'name and ownerId are required' },
      { status: 400 }
    );
  }

  const dashboard = await dashboardManager.createDashboard({
    name: name as string,
    description: description as string | undefined,
    ownerId: ownerId as string,
    isPublic: isPublic as boolean | undefined,
  });

  return NextResponse.json({ success: true, data: dashboard }, { status: 201 });
}

async function handleAddWidget(params: Record<string, unknown>): Promise<NextResponse> {
  const { dashboardId, widget } = params as {
    dashboardId?: string;
    widget?: Omit<import('@/lib/analytics/types').DashboardWidget, 'id'>;
  };

  if (!dashboardId || !widget) {
    return NextResponse.json(
      { success: false, error: 'dashboardId and widget are required' },
      { status: 400 }
    );
  }

  const newWidget = await dashboardManager.addWidget(dashboardId, widget);

  return NextResponse.json({ success: true, data: newWidget }, { status: 201 });
}

async function handleRemoveWidget(params: Record<string, unknown>): Promise<NextResponse> {
  const { dashboardId, widgetId } = params as {
    dashboardId?: string;
    widgetId?: string;
  };

  if (!dashboardId || !widgetId) {
    return NextResponse.json(
      { success: false, error: 'dashboardId and widgetId are required' },
      { status: 400 }
    );
  }

  const removed = await dashboardManager.removeWidget(dashboardId, widgetId);

  return NextResponse.json({
    success: removed,
    message: removed ? 'Widget removed successfully' : 'Widget not found',
  });
}

async function handleExport(params: Record<string, unknown>): Promise<NextResponse> {
  const { query, format } = params as {
    query?: import('@/lib/analytics/types').AnalyticsQuery;
    format?: 'csv' | 'json' | 'excel';
  };

  if (!query || !format) {
    return NextResponse.json(
      { success: false, error: 'query and format are required' },
      { status: 400 }
    );
  }

  try {
    const exportResult = await analyticsEngine.exportData(query, format);

    return new NextResponse(exportResult.data as string, {
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
