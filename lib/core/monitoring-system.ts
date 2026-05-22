import { NextRequest } from 'next/server';

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  durationMs: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notificationChannels?: string[];
  lastTriggered?: Date;
  cooldownMs?: number;
}

interface AlertInstance {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  value: number;
  message: string;
  status: 'active' | 'resolved' | 'acknowledged';
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  details?: Record<string, unknown>;
}

class MonitoringSystem {
  private static instance: MonitoringSystem;

  private metricsBuffer: MetricData[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private flushInterval?: NodeJS.Timeout;
  private checkInterval?: NodeJS.Timeout;

  private readonly MAX_BUFFER_SIZE = 10000;
  private readonly FLUSH_INTERVAL_MS = 10000; // 10秒
  private readonly HEALTH_CHECK_INTERVAL_MS = 30000; // 30秒

  private constructor() {
    this.initializeDefaultAlertRules();
    this.startMonitoring();
  }

  static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  recordMetric(metric: Omit<MetricData, 'timestamp'>): void {
    const metricWithTimestamp: MetricData = {
      ...metric,
      timestamp: new Date(),
    };

    this.metricsBuffer.push(metricWithTimestamp);

    if (this.metricsBuffer.length > this.MAX_BUFFER_SIZE) {
      this.metricsBuffer = this.metricsBuffer.slice(-Math.floor(this.MAX_BUFFER_SIZE * 0.7));
    }

    this.evaluateAlertRules(metricWithTimestamp);
  }

  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number
  ): void {
    this.recordMetric({
      name: 'http_requests_total',
      value: 1,
      tags: { method, path, status: String(statusCode) },
    });

    this.recordMetric({
      name: 'http_request_duration_ms',
      value: responseTime,
      tags: { method, path },
    });

    if (statusCode >= 400) {
      this.recordMetric({
        name: 'http_errors_total',
        value: 1,
        tags: { method, path, status: String(statusCode) },
      });
    }
  }

  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.recordMetric({
      name: 'db_query_duration_ms',
      value: duration,
      tags: { operation, table },
    });
  }

  recordAICall(provider: string, model: string, tokens: number, duration: number): void {
    this.recordMetric({
      name: 'ai_calls_total',
      value: 1,
      tags: { provider, model },
    });

    this.recordMetric({
      name: 'ai_tokens_used',
      value: tokens,
      tags: { provider, model },
    });

    this.recordMetric({
      name: 'ai_call_duration_ms',
      value: duration,
      tags: { provider, model },
    });
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values()).filter((a) => a.status === 'active');
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
    }
  }

  async registerHealthCheck(
    service: string,
    checkFn: () => Promise<HealthCheckResult>
  ): Promise<void> {
    try {
      const result = await checkFn();
      this.healthChecks.set(service, result);
    } catch (error) {
      this.healthChecks.set(service, {
        service,
        status: 'unhealthy',
        responseTime: -1,
        lastChecked: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      this.recordMetric({
        name: 'health_check_failures_total',
        value: 1,
        tags: { service },
      });
    }
  }

  getAllHealthChecks(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values());
  }

  getSystemHealth(): {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheckResult[];
    uptime: number;
  } {
    const services = this.getAllHealthChecks();
    const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;
    const degradedCount = services.filter((s) => s.status === 'degraded').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) overallStatus = 'unhealthy';
    else if (degradedCount > 0) overallStatus = 'degraded';

    return {
      overallStatus,
      services,
      uptime: process.uptime(),
    };
  }

  getMetricsSummary(timeRangeMs: number = 3600000): {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    p50ResponseTime: number;
    p99ResponseTime: number;
    activeAlerts: number;
  } {
    const cutoff = Date.now() - timeRangeMs;
    const recentMetrics = this.metricsBuffer.filter((m) => m.timestamp.getTime() > cutoff);

    const requests = recentMetrics.filter((m) => m.name === 'http_requests_total');
    const errors = recentMetrics.filter((m) => m.name === 'http_errors_total');
    const durations = recentMetrics
      .filter((m) => m.name === 'http_request_duration_ms')
      .map((m) => m.value)
      .sort((a, b) => a - b);

    return {
      totalRequests: requests.length,
      errorRate: requests.length > 0 ? (errors.length / requests.length) * 100 : 0,
      avgResponseTime:
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0,
      p50ResponseTime: durations[Math.floor(durations.length * 0.5)] || 0,
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
      activeAlerts: this.getActiveAlerts().length,
    };
  }

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        metricName: 'error_rate',
        condition: 'gt',
        threshold: 5,
        durationMs: 300000,
        severity: 'warning',
        enabled: true,
        cooldownMs: 600000,
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time (P99)',
        metricName: 'p99_response_time',
        condition: 'gt',
        threshold: 2000,
        durationMs: 300000,
        severity: 'warning',
        enabled: true,
        cooldownMs: 600000,
      },
      {
        id: 'critical-error-rate',
        name: 'Critical Error Rate',
        metricName: 'error_rate',
        condition: 'gt',
        threshold: 20,
        durationMs: 60000,
        severity: 'critical',
        enabled: true,
        cooldownMs: 120000,
      },
      {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        metricName: 'memory_usage_percent',
        condition: 'gt',
        threshold: 85,
        durationMs: 300000,
        severity: 'warning',
        enabled: true,
        cooldownMs: 600000,
      },
      {
        id: 'health-check-failure',
        name: 'Service Health Check Failure',
        metricName: 'health_check_status',
        condition: 'eq',
        threshold: 0,
        durationMs: 60000,
        severity: 'critical',
        enabled: true,
        cooldownMs: 120000,
      },
    ];

    defaultRules.forEach((rule) => this.alertRules.set(rule.id, rule));
  }

  private evaluateAlertRules(metric: MetricData): void {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled || rule.metricName !== metric.name) continue;

      const shouldAlert = this.checkCondition(metric.value, rule.condition, rule.threshold);

      if (shouldAlert) {
        const existingAlert = Array.from(this.activeAlerts.values()).find(
          (a) => a.ruleId === ruleId && a.status === 'active'
        );

        if (
          !existingAlert &&
          (!rule.lastTriggered ||
            Date.now() - rule.lastTriggered.getTime() > (rule.cooldownMs || 0))
        ) {
          this.triggerAlert(rule, metric);
        }
      }
    }
  }

  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, metric: MetricData): void {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alert: AlertInstance = {
      id: alertId,
      ruleId: rule.id,
      triggeredAt: new Date(),
      value: metric.value,
      message: `${rule.name}: ${metric.name} = ${metric.value} (threshold: ${rule.threshold})`,
      status: 'active',
    };

    this.activeAlerts.set(alertId, alert);
    rule.lastTriggered = new Date();

    console.warn(`[ALERT] ${alert.message}`);

    this.sendNotification(alert, rule);
  }

  private sendNotification(alert: AlertInstance, rule: AlertRule): void {
    if (process.env.NODE_ENV === 'production') {
      console.log(`[NOTIFICATION] Alert ${alert.id} would be sent to channels:`, rule.notificationChannels);
    }
  }

  private startMonitoring(): void {
    this.flushInterval = setInterval(() => this.flushMetrics(), this.FLUSH_INTERVAL_MS);

    this.checkInterval = setInterval(() => {
      this.recordSystemMetrics();
      this.cleanupOldAlerts();
    }, this.HEALTH_CHECK_INTERVAL_MS);

    console.log('📊 Monitoring system started');
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return;

    console.log(`[MONITORING] Flushing ${this.metricsBuffer.length} metrics`);

    this.metricsBuffer = [];
  }

  private recordSystemMetrics(): void {
    const memUsage = process.memoryUsage();

    this.recordMetric({
      name: 'memory_usage_bytes',
      value: memUsage.heapUsed,
      tags: { type: 'heap' },
    });

    this.recordMetric({
      name: 'memory_usage_bytes',
      value: memUsage.external,
      tags: { type: 'external' },
    });

    this.recordMetric({
      name: 'event_loop_lag_ms',
      value: 0,
    });
  }

  private cleanupOldAlerts(): void {
    const oneHourAgo = Date.now() - 3600000;

    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (alert.triggeredAt.getTime() < oneHourAgo && alert.status !== 'active') {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  stop(): void {
    if (this.flushInterval) clearInterval(this.flushInterval);
    if (this.checkInterval) clearInterval(this.checkInterval);
    console.log('📊 Monitoring system stopped');
  }
}

export const monitoringSystem = MonitoringSystem.getInstance();

export function createPerformanceMiddleware() {
  return (request: NextRequest): (() => void) => {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      const url = new URL(request.url);

      monitoringSystem.recordHttpRequest(
        request.method,
        url.pathname,
        200, // Will be updated by the actual response handler
        duration
      );
    };
  };
}
