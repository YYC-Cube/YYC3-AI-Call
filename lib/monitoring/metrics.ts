interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface CounterData {
  [key: string]: number;
}

interface HistogramData {
  count: number;
  sum: number;
  buckets: { [bound: string]: number };
}

interface GaugeData {
  value: number;
  labels?: Record<string, string>;
}

class MetricsCollector {
  private static instance: MetricsCollector;
  
  private counters: Map<string, CounterData> = new Map();
  private histograms: Map<string, HistogramData[]> = new Map();
  private gauges: Map<string, GaugeData> = new Map();

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
    
    if (!this.counters.has(key)) {
      this.counters.set(key, { total: 0 });
    }
    
    const counter = this.counters.get(key)!;
    counter.total += value;
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    
    const histogram = this.histograms.get(key)!;
    histogram.push({
      count: 1,
      sum: value,
      buckets: {},
    });

    if (histogram.length > 1000) {
      this.aggregateHistogram(histogram);
    }
  }

  private aggregateHistogram(data: HistogramData[]): HistogramData {
    const aggregated: HistogramData = {
      count: data.reduce((sum, d) => sum + d.count, 0),
      sum: data.reduce((sum, d) => sum + d.sum, 0),
      buckets: {},
    };

    return aggregated;
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
    
    this.gauges.set(key, {
      value,
      labels,
    });
  }

  getCounter(name: string, labels?: Record<string, string>): number | null {
    const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
    const counter = this.counters.get(key);
    return counter?.total ?? null;
  }

  getGauge(name: string, labels?: Record<string, string>): number | null {
    const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
    const gauge = this.gauges.get(key);
    return gauge?.value ?? null;
  }

  getHistogramStats(name: string, labels?: Record<string, string>): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
    const data = this.histograms.get(key);
    
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.sum).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count,
      avg: sum / count,
      min: values[0],
      max: values[count - 1],
      p50: values[Math.floor(count * 0.5)],
      p95: values[Math.floor(count * 0.95)],
      p99: values[Math.floor(count * 0.99)],
    };
  }

  async getPrometheusFormat(): Promise<string> {
    let output = '';

    output += '# HELP http_requests_total Total HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [key, data] of this.counters.entries()) {
      output += `http_requests_total{key="${key}"} ${data.total}\n`;
    }

    output += '\n# HELP active_tasks_count Number of active tasks\n';
    output += '# TYPE active_tasks_count gauge\n';
    for (const [key, data] of this.gauges.entries()) {
      output += `active_tasks_count{key="${key}"} ${data.value}\n`;
    }

    output += '\n# HELP ai_call_duration_seconds AI call duration in seconds\n';
    output += '# TYPE ai_call_duration_seconds summary\n';
    for (const [key, data] of this.histograms.entries()) {
      const stats = this.getHistogramStatsFromData(data);
      if (stats) {
        output += `ai_call_duration_seconds{key="${key}",quantile="0.5"} ${stats.p50}\n`;
        output += `ai_call_duration_seconds{key="${key}",quantile="0.95"} ${stats.p95}\n`;
        output += `ai_call_duration_seconds{key="${key}",quantile="0.99"} ${stats.p99}\n`;
        output += `ai_call_duration_seconds_sum{key="${key}"} ${stats.sum}\n`;
        output += `ai_call_duration_seconds_count{key="${key}"} ${stats.count}\n`;
      }
    }

    return output;
  }

  private getHistogramStatsFromData(data: HistogramData[]): {
    count: number;
    sum: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.sum).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count,
      sum,
      p50: values[Math.floor(count * 0.5)],
      p95: values[Math.floor(count * 0.95)],
      p99: values[Math.floor(count * 0.99)],
    };
  }

  resetAll(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }

  trackHttpRequest(method: string, route: string, statusCode: number, durationMs: number): void {
    this.incrementCounter('http_requests_total', 1, { method, route, status: String(statusCode) });
    this.observeHistogram('http_request_duration_ms', durationMs, { method, route });
  }

  trackAiCall(type: string, status: string, durationSeconds: number): void {
    this.incrementCounter('ai_calls_total', 1, { type, status });
    this.observeHistogram('ai_call_duration_seconds', durationSeconds, { type });
  }

  trackError(type: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.incrementCounter('errors_total', 1, { type, severity });
  }

  updateActiveTasks(state: string, count: number): void {
    this.setGauge('active_tasks', count, { state });
  }

  updateDatabaseConnections(count: number): void {
    this.setGauge('db_connections', count);
  }

  updateRedisConnections(count: number): void {
    this.setGauge('redis_connections', count);
  }

  getAllMetrics(): {
    counters: Map<string, CounterData>;
    gauges: Map<string, GaugeData>;
    histograms: Map<string, HistogramData[]>;
  } {
    return {
      counters: this.counters,
      gauges: this.gauges,
      histograms: this.histograms,
    };
  }
}

export const metrics = MetricsCollector.getInstance();
export { MetricsCollector };
