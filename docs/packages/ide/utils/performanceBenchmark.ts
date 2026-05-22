import { createLogger } from "./utils/logger";
const log = createLogger("performanceBenchmark");
/**
 * @file performanceBenchmark.ts
 * @description 性能基准测试工具 - 测试渲染性能、内存使用、加载时间等指标
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,benchmark,testing,metrics
 */

export interface BenchmarkResult {
  name: string;
  duration: number;
  timestamp: number;
  metrics: Record<string, number>;
}

export interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  tti: number;
  tbt: number;
}

/**
 * 性能基准测试服务
 */
class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private observer: PerformanceObserver | null = null;

  /**
   * 开始测试
   */
  async start(): Promise<PerformanceMetrics> {
    log.info("Starting performance test...");

    // 收集 Web Vitals
    const metrics = await this.collectWebVitals();

    // 运行自定义测试
    await this.runCustomTests();

    return metrics;
  }

  /**
   * 收集 Web Vitals
   */
  private async collectWebVitals(): Promise<PerformanceMetrics> {
    return new Promise((resolve) => {
      const metrics: PerformanceMetrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        tti: 0,
        tbt: 0,
      };

      // FCP
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
        if (fcpEntry) {
          metrics.fcp = Math.round(fcpEntry.startTime);
        }
      });
      fcpObserver.observe({ type: "paint", buffered: true });

      // LCP
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcpEntry = entries[entries.length - 1];
        if (lcpEntry) {
          metrics.lcp = Math.round(lcpEntry.startTime);
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      // CLS
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value || 0;
          }
        });
        metrics.cls = Math.round(clsValue * 1000) / 1000;
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      // 延迟解析
      setTimeout(() => {
        resolve(metrics);
      }, 5000);
    });
  }

  /**
   * 运行自定义测试
   */
  private async runCustomTests(): Promise<void> {
    // 渲染性能测试
    await this.testRenderPerformance();

    // 内存使用测试
    await this.testMemoryUsage();

    // 事件响应测试
    await this.testEventResponse();
  }

  /**
   * 渲染性能测试
   */
  private async testRenderPerformance(): Promise<void> {
    const start = performance.now();

    // 强制重排
    const element = document.createElement("div");
    document.body.appendChild(element);
    element.offsetHeight; // 强制重排
    document.body.removeChild(element);

    const duration = performance.now() - start;

    this.results.push({
      name: "render-performance",
      duration,
      timestamp: Date.now(),
      metrics: { duration },
    });

    log.info(`Render performance: ${duration.toFixed(2)}ms`);
  }

  /**
   * 内存使用测试
   */
  private async testMemoryUsage(): Promise<void> {
    if ("memory" in performance) {
      const mem = (performance as any).memory;
      const usage = mem.usedJSHeapSize / mem.jsHeapSizeLimit;

      this.results.push({
        name: "memory-usage",
        duration: 0,
        timestamp: Date.now(),
        metrics: {
          used: mem.usedJSHeapSize,
          total: mem.totalJSHeapSize,
          limit: mem.jsHeapSizeLimit,
          usage: Math.round(usage * 100),
        },
      });

      log.info(`Memory usage: ${Math.round(usage * 100)}%`);
    }
  }

  /**
   * 事件响应测试
   */
  private async testEventResponse(): Promise<void> {
    const start = performance.now();

    // 模拟事件处理
    await new Promise((resolve) => setTimeout(resolve, 0));

    const duration = performance.now() - start;

    this.results.push({
      name: "event-response",
      duration,
      timestamp: Date.now(),
      metrics: { duration },
    });

    log.info(`Event response: ${duration.toFixed(2)}ms`);
  }

  /**
   * 获取测试结果
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * 导出结果
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * 清理
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.results = [];
  }
}

// 导出单例
export const performanceBenchmark = new PerformanceBenchmark();

// 导出工具函数
export const startBenchmark = performanceBenchmark.start.bind(performanceBenchmark);
export const getBenchmarkResults = performanceBenchmark.getResults.bind(performanceBenchmark);

export default performanceBenchmark;
