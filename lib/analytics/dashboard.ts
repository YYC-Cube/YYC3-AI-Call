import { 
  type Dashboard, 
  type DashboardWidget, 
  type ReportTemplate,
  type AnalyticsQuery
} from './types';
import { analyticsEngine } from './engine';
import { logger } from '../logger';

class DashboardManager {
  private dashboards: Map<string, Dashboard> = new Map();
  private reports: Map<string, ReportTemplate> = new Map();

  async createDashboard(config: {
    name: string;
    description?: string;
    ownerId: string;
    isPublic?: boolean;
  }): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: this.generateId(),
      name: config.name,
      description: config.description,
      widgets: [],
      layout: 'grid',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: config.ownerId,
      isPublic: config.isPublic || false,
    };

    this.dashboards.set(dashboard.id, dashboard);

    logger.info('Dashboard created', {
      dashboardId: dashboard.id,
      name: dashboard.name,
      ownerId: config.ownerId,
    });

    return dashboard;
  }

  async addWidget(
    dashboardId: string,
    widget: Omit<DashboardWidget, 'id'>
  ): Promise<DashboardWidget> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const newWidget: DashboardWidget = {
      ...widget,
      id: this.generateId(),
    };

    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = new Date();

    logger.info('Widget added to dashboard', {
      dashboardId,
      widgetId: newWidget.id,
      type: widget.type,
    });

    return newWidget;
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      return false;
    }

    const index = dashboard.widgets.findIndex(w => w.id === widgetId);
    
    if (index === -1) {
      return false;
    }

    dashboard.widgets.splice(index, 1);
    dashboard.updatedAt = new Date();

    logger.info('Widget removed from dashboard', {
      dashboardId,
      widgetId,
    });

    return true;
  }

  async getDashboardData(dashboardId: string): Promise<{
    dashboard: Dashboard;
    widgetData: Array<{ widgetId: string; data: unknown; error?: string }>;
  }> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    // 并行获取所有widget的数据
    const widgetDataPromises = dashboard.widgets.map(async (widget) => {
      try {
        const result = await analyticsEngine.executeQuery(widget.query);
        
        return {
          widgetId: widget.id,
          data: this.formatWidgetData(widget.type, result),
        };
      } catch (error) {
        logger.error('Failed to fetch widget data', error instanceof Error ? error : new Error(String(error)), {
          widgetId: widget.id,
        });
        
        return {
          widgetId: widget.id,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const widgetData = await Promise.all(widgetDataPromises);

    return {
      dashboard,
      widgetData,
    };
  }

  async listDashboards(filters?: {
    ownerId?: string;
    isPublic?: boolean;
    search?: string;
  }): Promise<Dashboard[]> {
    let dashboards = Array.from(this.dashboards.values());

    if (filters?.ownerId) {
      dashboards = dashboards.filter(d => d.ownerId === filters.ownerId! || d.isPublic);
    }

    if (filters?.isPublic !== undefined) {
      dashboards = dashboards.filter(d => d.isPublic === filters.isPublic);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      dashboards = dashboards.filter(d =>
        d.name.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower)
      );
    }

    return dashboards.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async deleteDashboard(dashboardId: string): Promise<boolean> {
    const deleted = this.dashboards.delete(dashboardId);
    
    if (deleted) {
      logger.info('Dashboard deleted', { dashboardId });
    }

    return deleted;
  }

  createDefaultDashboard(ownerId: string): Promise<Dashboard> {
    return this.createDashboard({
      name: '默认仪表盘',
      description: 'YYC³ AI Calling 核心指标概览',
      ownerId,
      isPublic: false,
    }).then(async (dashboard) => {
      // 添加默认widgets
      await this.addWidget(dashboard.id, {
        type: 'number_card',
        title: '今日通话数',
        query: {
          metrics: [{
            field: 'call_count_today',
            label: '通话次数',
            type: 'counter' as any,
            aggregation: 'count' as any,
          }],
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
            granularity: 'hourly' as any,
          },
        },
        config: {
          format: 'number',
          comparisonPeriod: 'previous_period',
          sparkline: true,
        },
        position: { x: 0, y: 0, width: 6, height: 4 },
      });

      await this.addWidget(dashboard.id, {
        type: 'line_chart',
        title: '7日通话趋势',
        query: {
          metrics: [{
            field: 'call_count',
            label: '通话次数',
            type: 'counter' as any,
            aggregation: 'sum' as any,
          }],
          timeRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(),
            granularity: 'daily' as any,
          },
        },
        config: {
          showLegend: true,
          showGrid: true,
        },
        position: { x: 6, y: 0, width: 6, height: 4 },
      });

      await this.addWidget(dashboard.id, {
        type: 'pie_chart',
        title: '通话状态分布',
        query: {
          metrics: [{
            field: 'call_count',
            label: '数量',
            type: 'counter' as any,
            aggregation: 'count' as any,
          }],
          groupBy: ['status'],
          timeRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
        config: {
          showLegend: true,
          colors: ['#10B981', '#EF4444', '#F59E0B', '#6366F1'],
        },
        position: { x: 0, y: 4, width: 4, height: 4 },
      });

      return dashboard;
    });
  }

  async createReportTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt'>): Promise<ReportTemplate> {
    const report: ReportTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
    };

    this.reports.set(report.id, report);

    logger.info('Report template created', {
      reportId: report.id,
      name: template.name,
      category: template.category,
    });

    return report;
  }

  async generateReport(reportId: string): Promise<{
    report: ReportTemplate;
    sections: Array<{
      title: string;
      data: unknown[];
    }>;
  }> {
    const report = this.reports.get(reportId);
    
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const sections = await Promise.all(
      report.layout.sections.map(async (section) => ({
        title: section.title,
        data: await Promise.all(
          section.widgets.map((widget) =>
            analyticsEngine.executeQuery(widget.query).catch(error => ({ error }))
          )
        ),
      }))
    );

    return { report, sections };
  }

  private formatWidgetData(type: DashboardWidget['type'], data: unknown): unknown {
    // 根据widget类型格式化数据（前端可能需要特定格式）
    switch (type) {
      case 'number_card':
        // 提取最新值用于数字卡片显示
        return data;

      case 'line_chart':
      case 'bar_chart':
        // 时间序列数据，直接返回
        return data;

      case 'pie_chart':
        // 饼图需要分类汇总
        return data;

      case 'table':
        // 表格数据
        return data;

      case 'gauge':
        // 仪表盘数据
        return data;

      default:
        return data;
    }
  }

  private generateId(): string {
    return `dash_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

export const dashboardManager = new DashboardManager();
export { DashboardManager };
