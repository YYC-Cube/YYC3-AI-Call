export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  PERCENTILE = 'percentile',
  DISTINCT_COUNT = 'distinct_count',
}

export enum TimeGranularity {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface DataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  metric: string;
  label: string;
  dataPoints: DataPoint[];
  aggregation: AggregationType;
  unit?: string;
}

export interface Dimension {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface AnalyticsQuery {
  metrics: MetricConfig[];
  dimensions?: Dimension[];
  filters?: FilterCondition[];
  timeRange: {
    start: Date;
    end: Date;
    granularity?: TimeGranularity;
  };
  groupBy?: string[];
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface MetricConfig {
  field: string;
  label: string;
  type: MetricType;
  aggregation: AggregationType;
  unit?: string;
  format?: (value: number) => string;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with';
  value: unknown;
}

export interface AnalyticsResult {
  queryId: string;
  executedAt: Date;
  executionTimeMs: number;
  totalRecords: number;
  data: TimeSeriesData[] | TabularData[];
  metadata: {
    hasMore: boolean;
    nextOffset?: number;
    cachedAt?: Date;
  };
}

export interface TabularData {
  headers: { key: string; label: string; type: string }[];
  rows: Record<string, unknown>[];
}

export interface DashboardWidget {
  id: string;
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'number_card' | 'table' | 'gauge' | 'heatmap';
  title: string;
  description?: string;
  query: AnalyticsQuery;
  config: WidgetConfig;
  refreshInterval?: number; // seconds
  position: { x: number; y: number; width: number; height: number };
}

export interface WidgetConfig {
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  thresholds?: {
    value: number;
    color: string;
    label?: string;
  }[];
  comparisonPeriod?: 'previous_period' | 'same_period_last_year' | 'custom';
  sparkline?: boolean;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  decimalPlaces?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'flex';
  refreshInterval?: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isPublic: boolean;
  sharedWith?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'performance' | 'usage' | 'financial' | 'quality' | 'custom';
  queries: AnalyticsQuery[];
  layout: ReportLayout;
  schedule?: ReportSchedule;
  exportFormats: ('pdf' | 'excel' | 'csv')[];
  createdAt: Date;
}

export interface ReportLayout {
  sections: {
    title: string;
    widgets: Omit<DashboardWidget, 'position'>[];
  }[];
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:mm
  timezone: string;
  recipients: string[];
  includeChartImages: boolean;
}
