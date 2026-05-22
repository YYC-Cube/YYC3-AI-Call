import { 
  AggregationType, 
  TimeGranularity, 
  type AnalyticsQuery, 
  type AnalyticsResult, 
  type DataPoint,
  type TimeSeriesData,
  type TabularData,
  type MetricConfig
} from './types';
import { logger } from '../logger';

class AnalyticsEngine {
  private queryCache: Map<string, { result: AnalyticsResult; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  async executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const queryId = this.generateQueryId(query);
    const startTime = Date.now();

    // 检查缓存
    const cached = this.queryCache.get(queryId);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Analytics query cache hit', { queryId });
      return {
        ...cached.result,
        metadata: {
          ...cached.result.metadata,
          cachedAt: new Date(cached.expiresAt - this.CACHE_TTL),
        },
      };
    }

    try {
      // 执行查询（这里模拟，实际应查询数据库/数据仓库）
      let data: TimeSeriesData[] | TabularData[];

      if (query.groupBy && query.groupBy.length > 0) {
        data = await this.executeGroupedQuery(query);
      } else {
        data = await this.executeTimeSeriesQuery(query);
      }

      const executionTimeMs = Date.now() - startTime;
      
      const result: AnalyticsResult = {
        queryId,
        executedAt: new Date(),
        executionTimeMs,
        totalRecords: this.calculateTotalRecords(data),
        data,
        metadata: {
          hasMore: false,
          nextOffset: undefined,
        },
      };

      // 缓存结果
      this.cacheResult(queryId, result);

      logger.info('Analytics query executed', {
        queryId,
        metricsCount: query.metrics.length,
        executionTimeMs,
        recordCount: result.totalRecords,
      });

      return result;
    } catch (error) {
      logger.error('Analytics query failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getCallAnalytics(query: Omit<AnalyticsQuery, 'metrics'>): Promise<AnalyticsResult> {
    const fullQuery: AnalyticsQuery = {
      ...query,
      metrics: [
        {
          field: 'call_count',
          label: '通话次数',
          type: 'counter' as any,
          aggregation: AggregationType.COUNT,
        },
        {
          field: 'avg_duration',
          label: '平均时长(秒)',
          type: 'histogram' as any,
          aggregation: AggregationType.AVERAGE,
          unit: 's',
        },
        {
          field: 'success_rate',
          label: '成功率(%)',
          type: 'gauge' as any,
          aggregation: AggregationType.AVERAGE,
          unit: '%',
          format: (v) => `${(v * 100).toFixed(1)}%`,
        },
        {
          field: 'total_duration',
          label: '总时长(分钟)',
          type: 'counter' as any,
          aggregation: AggregationType.SUM,
          unit: 'min',
        },
      ],
    };

    return this.executeQuery(fullQuery);
  }

  async getTaskAnalytics(query: Omit<AnalyticsQuery, 'metrics'>): Promise<AnalyticsResult> {
    const fullQuery: AnalyticsQuery = {
      ...query,
      metrics: [
        {
          field: 'total_tasks',
          label: '任务总数',
          type: 'counter' as any,
          aggregation: AggregationType.COUNT,
        },
        {
          field: 'completed_tasks',
          label: '已完成',
          type: 'counter' as any,
          aggregation: AggregationType.COUNT,
        },
        {
          field: 'completion_rate',
          label: '完成率(%)',
          type: 'gauge' as any,
          aggregation: AggregationType.AVERAGE,
          format: (v) => `${v.toFixed(1)}%`,
        },
        {
          field: 'avg_processing_time',
          label: '平均处理时间(分)',
          type: 'histogram' as any,
          aggregation: AggregationType.AVERAGE,
          unit: 'min',
        },
      ],
    };

    return this.executeQuery(fullQuery);
  }

  async getUserActivityAnalytics(query: Omit<AnalyticsQuery, 'metrics'>): Promise<AnalyticsResult> {
    const fullQuery: AnalyticsQuery = {
      ...query,
      metrics: [
        {
          field: 'active_users',
          label: '活跃用户数',
          type: 'gauge' as any,
          aggregation: AggregationType.DISTINCT_COUNT,
        },
        {
          field: 'api_calls',
          label: 'API调用次数',
          type: 'counter' as any,
          aggregation: AggregationType.SUM,
        },
        {
          field: 'avg_session_duration',
          label: '平均会话时长(分)',
          type: 'histogram' as any,
          aggregation: AggregationType.AVERAGE,
          unit: 'min',
        },
        {
          field: 'new_users',
          label: '新用户数',
          type: 'counter' as any,
          aggregation: AggregationType.COUNT,
        },
      ],
    };

    return this.executeQuery(fullQuery);
  }

  async generateTrendAnalysis(
    metricField: string,
    timeRange: { start: Date; end: Date },
    granularity: TimeGranularity = TimeGranularity.DAILY
  ): Promise<{
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    forecast?: DataPoint[];
    seasonality?: string;
  }> {
    // 模拟趋势分析（实际应使用统计模型）
    const mockChange = (Math.random() - 0.5) * 40; // -20% to +20%
    
    let trend: 'up' | 'down' | 'stable';
    
    if (mockChange > 5) {
      trend = 'up';
    } else if (mockChange < -5) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    // 简单的线性预测
    const forecastPoints: DataPoint[] = [];
    const daysToForecast = 7;
    
    for (let i = 1; i <= daysToForecast; i++) {
      const futureDate = new Date(timeRange.end.getTime() + i * 24 * 60 * 60 * 1000);
      forecastPoints.push({
        timestamp: futureDate.toISOString(),
        value: Math.random() * 100 + (trend === 'up' ? 10 : trend === 'down' ? -10 : 0),
      });
    }

    return {
      trend,
      changePercentage: parseFloat(mockChange.toFixed(2)),
      forecast: forecastPoints,
      seasonality: this.detectSeasonality(granularity),
    };
  }

  async exportData(
    query: AnalyticsQuery,
    format: 'csv' | 'json' | 'excel'
  ): Promise<{ filename: string; data: Buffer | string; mimeType: string }> {
    const result = await this.executeQuery(query);

    switch (format) {
      case 'csv':
        return this.exportAsCSV(result);
        
      case 'json':
        return this.exportAsJSON(result);
        
      case 'excel':
        // TODO: 实现Excel导出（需要exceljs库）
        throw new Error('Excel export not yet implemented');
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  clearCache(): void {
    this.queryCache.clear();
    logger.info('Analytics cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys()),
    };
  }

  private async executeTimeSeriesQuery(query: AnalyticsQuery): Promise<TimeSeriesData[]> {
    const granularity = query.timeRange.granularity || TimeGranularity.DAILY;
    const timeSlots = this.generateTimeSlots(
      query.timeRange.start,
      query.timeRange.end,
      granularity
    );

    // 为每个指标生成时间序列数据
    return query.metrics.map((metric: MetricConfig) => ({
      metric: metric.field,
      label: metric.label,
      dataPoints: timeSlots.map((slot) => ({
        timestamp: slot.toISOString(),
        value: this.generateMockValue(metric.type),
        metadata: {},
      })),
      aggregation: metric.aggregation,
      unit: metric.unit,
    }));
  }

  private async executeGroupedQuery(query: AnalyticsQuery): Promise<TabularData[]> {
    // 模拟分组查询结果
    const headers = [
      ...query.metrics.map((m: MetricConfig) => ({
        key: m.field,
        label: m.label,
        type: 'number',
      })),
      ...(query.groupBy?.map((g) => ({
        key: g,
        label: g,
        type: 'string',
      })) || []),
    ];

    const rows = Array.from({ length: Math.min(query.limit || 20, 50) }, (_, i) => {
      const row: Record<string, unknown> = {};
      
      query.metrics.forEach((metric: MetricConfig) => {
        row[metric.field] = this.generateMockValue(metric.type);
      });

      query.groupBy?.forEach((group) => {
        row[group] = `Group ${i + 1}`;
      });

      return row;
    });

    return [{
      headers,
      rows,
    }];
  }

  private generateTimeSlots(start: Date, end: Date, granularity: TimeGranularity): Date[] {
    const slots: Date[] = [];
    const current = new Date(start);

    while (current < end) {
      slots.push(new Date(current));

      switch (granularity) {
        case TimeGranularity.HOURLY:
          current.setHours(current.getHours() + 1);
          break;
        case TimeGranularity.DAILY:
          current.setDate(current.getDate() + 1);
          break;
        case TimeGranularity.WEEKLY:
          current.setDate(current.getDate() + 7);
          break;
        case TimeGranularity.MONTHLY:
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }

    return slots;
  }

  private generateMockValue(type: string): number {
    switch (type) {
      case 'counter':
        return Math.floor(Math.random() * 1000);
      case 'gauge':
        return parseFloat((Math.random() * 100).toFixed(2));
      case 'histogram':
        return parseFloat((Math.random() * 300).toFixed(2));
      default:
        return Math.floor(Math.random() * 500);
    }
  }

  private calculateTotalRecords(data: TimeSeriesData[] | TabularData[]): number {
    if (Array.isArray(data) && data.length > 0) {
      if ('dataPoints' in data[0]) {
        return (data as TimeSeriesData[]).reduce(
          (sum, series) => sum + series.dataPoints.length,
          0
        );
      } else if ('rows' in data[0]) {
        return (data as TabularData[]).reduce(
          (sum, table) => sum + table.rows.length,
          0
        );
      }
    }
    return 0;
  }

  private generateQueryId(query: AnalyticsQuery): string {
    const queryStr = JSON.stringify(query);
    const hash = this.simpleHash(queryStr);
    return `analytics_${hash}_${Date.now().toString(36)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  private cacheResult(queryId: string, result: AnalyticsResult): void {
    this.queryCache.set(queryId, {
      result,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  private exportAsCSV(result: AnalyticsResult): { filename: string; data: string; mimeType: string } {
    let csv = '';

    if ('dataPoints' in (result.data[0] || {})) {
      // 时间序列数据
      csv = 'timestamp,' + (result.data as TimeSeriesData[])
        .map(d => d.metric)
        .join(',') + '\n';

      const firstSeries = (result.data as TimeSeriesData[])[0];
      if (firstSeries) {
        firstSeries.dataPoints.forEach((point, idx) => {
          const values = (result.data as TimeSeriesData[])
            .map(series => series.dataPoints[idx]?.value ?? '')
            .join(',');
          csv += `${point.timestamp},${values}\n`;
        });
      }
    } else {
      // 表格数据
      const table = result.data as TabularData[];
      if (table[0]) {
        csv += table[0].headers.map(h => h.key).join(',') + '\n';
        table[0].rows.forEach(row => {
          csv += table[0].headers.map(h => row[h.key] ?? '').join(',') + '\n';
        });
      }
    }

    return {
      filename: `analytics_${Date.now()}.csv`,
      data: csv,
      mimeType: 'text/csv',
    };
  }

  private exportAsJSON(result: AnalyticsResult): { filename: string; data: string; mimeType: string } {
    return {
      filename: `analytics_${Date.now()}.json`,
      data: JSON.stringify(result, null, 2),
      mimeType: 'application/json',
    };
  }

  private detectSeasonality(granularity: TimeGranularity): string {
    // 简化的季节性检测（实际应使用更复杂的算法）
    switch (granularity) {
      case TimeGranularity.HOURLY:
        return 'daily_pattern';
      case TimeGranularity.DAILY:
        return 'weekly_pattern';
      case TimeGranularity.MONTHLY:
        return 'yearly_pattern';
      default:
        return 'no_clear_seasonality';
    }
  }
}

export const analyticsEngine = new AnalyticsEngine();
export { AnalyticsEngine };
