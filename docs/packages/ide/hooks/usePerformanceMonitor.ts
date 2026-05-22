/**
 * @file usePerformanceMonitor.ts
 * @description 性能监控 Hook - 提供性能指标采集、报告、预警功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,monitoring,hook,web-vitals
 */

import { useEffect, useCallback, useRef } from "react"

export interface PerformanceReport {
  fcp: number | null
  lcp: number | null
  tti: number | null
  cls: number | null
  fid: number | null
  memory?: {
    used: number
    total: number
    limit: number
  }
  timestamp: number
  url: string
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean
  onReport?: (report: PerformanceReport) => void
  onError?: (error: string) => void
  thresholds?: {
    fcpGood: number
    fcpPoor: number
    lcpGood: number
    lcpPoor: number
  }
}

export function usePerformanceMonitor({
  enabled = true,
  onReport,
  onError,
  thresholds = {
    fcpGood: 1000,
    fcpPoor: 3000,
    lcpGood: 2500,
    lcpPoor: 4000,
  },
}: UsePerformanceMonitorOptions = {}) {
  const reportRef = useRef<PerformanceReport>({
    fcp: null,
    lcp: null,
    tti: null,
    cls: null,
    fid: null,
    timestamp: Date.now(),
    url: window.location.href,
  })

  // 报告性能数据
  const sendReport = useCallback(() => {
    if (onReport) {
      onReport({ ...reportRef.current, timestamp: Date.now() })
    }

    // 同时发送到浏览器 Performance API
    if (navigator.sendBeacon) {
      const data = JSON.stringify(reportRef.current)
      navigator.sendBeacon("/api/performance", data)
    }
  }, [onReport])

  useEffect(() => {
    if (!enabled) return

    // 监控 FCP
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const fcpEntry = entries.find((e) => e.name === "first-contentful-paint")
      if (fcpEntry) {
        reportRef.current.fcp = Math.round(fcpEntry.startTime)
        
        if (fcpEntry.startTime > thresholds.fcpPoor && onError) {
          onError(`FCP 过慢：${Math.round(fcpEntry.startTime)}ms`)
        }
      }
    })
    fcpObserver.observe({ type: "paint", buffered: true })

    // 监控 LCP
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lcpEntry = entries[entries.length - 1]
      if (lcpEntry) {
        reportRef.current.lcp = Math.round(lcpEntry.startTime)
        
        if (lcpEntry.startTime > thresholds.lcpPoor && onError) {
          onError(`LCP 过慢：${Math.round(lcpEntry.startTime)}ms`)
        }
      }
    })
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })

    // 监控 CLS (Cumulative Layout Shift)
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as any[]
      let clsValue = 0
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value || 0
        }
      })
      reportRef.current.cls = Math.round(clsValue * 1000) / 1000
      
      if (clsValue > 0.25 && onError) {
        onError(`CLS 过高：${clsValue.toFixed(3)}`)
      }
    })
    clsObserver.observe({ type: "layout-shift", buffered: true })

    // 监控 FID (First Input Delay)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as any[]
      const fidEntry = entries.find((e) => e.entryType === "first-input")
      if (fidEntry) {
        reportRef.current.fid = Math.round(fidEntry.processingStart - fidEntry.startTime)
        
        if (fidEntry.processingStart - fidEntry.startTime > 100 && onError) {
          onError(`FID 过长：${Math.round(fidEntry.processingStart - fidEntry.startTime)}ms`)
        }
      }
    })
    fidObserver.observe({ type: "first-input", buffered: true })

    // 页面卸载时发送报告
    const handleBeforeUnload = () => {
      sendReport()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    // 定时报告 (每 30 秒)
    const interval = setInterval(() => {
      sendReport()
    }, 30000)

    return () => {
      fcpObserver.disconnect()
      lcpObserver.disconnect()
      clsObserver.disconnect()
      fidObserver.disconnect()
      window.removeEventListener("beforeunload", handleBeforeUnload)
      clearInterval(interval)
    }
  }, [enabled, onError, onReport, sendReport, thresholds])

  // 手动触发报告
  const reportNow = useCallback(() => {
    sendReport()
  }, [sendReport])

  // 获取内存信息
  const getMemoryInfo = useCallback(() => {
    if ("memory" in performance) {
      const mem = (performance as any).memory
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
      }
    }
    return null
  }, [])

  return {
    report: reportRef.current,
    reportNow,
    getMemoryInfo,
  }
}

export default usePerformanceMonitor
