/**
 * @file PerformanceMonitor.tsx
 * @description 性能监控组件 - 监控 FCP、TTI、内存使用、渲染性能等指标
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,monitoring,metrics,web-vitals
 */

import { useEffect, useState, useCallback } from "react"
import { Gauge, Activity, MemoryStick, Clock, AlertTriangle } from "lucide-react"

interface PerformanceMetrics {
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  tti: number | null // Time to Interactive
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  fps: number
  renderTime: number
}

interface PerformanceMonitorProps {
  open?: boolean
  onClose?: () => void
}

export function PerformanceMonitor({ open = false, onClose }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    tti: null,
    fps: 60,
    renderTime: 0,
  })
  const [alerts, setAlerts] = useState<string[]>([])

  // 监控 Web Vitals
  useEffect(() => {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const fcpEntry = entries.find((e) => e.name === "first-contentful-paint")
      if (fcpEntry) {
        setMetrics((prev) => ({ ...prev, fcp: Math.round(fcpEntry.startTime) }))
        
        // FCP > 3s 警告
        if (fcpEntry.startTime > 3000) {
          setAlerts((prev) => [...prev, `FCP 过慢：${Math.round(fcpEntry.startTime)}ms`])
        }
      }
    })
    fcpObserver.observe({ type: "paint", buffered: true })

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lcpEntry = entries[entries.length - 1]
      if (lcpEntry) {
        setMetrics((prev) => ({ ...prev, lcp: Math.round(lcpEntry.startTime) }))
        
        // LCP > 2.5s 警告
        if (lcpEntry.startTime > 2500) {
          setAlerts((prev) => [...prev, `LCP 过慢：${Math.round(lcpEntry.startTime)}ms`])
        }
      }
    })
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })

    // Time to Interactive (估算)
    const ttiObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const longTask = entries.find((e) => e.duration > 50)
      if (longTask) {
        setMetrics((prev) => ({ ...prev, tti: Math.round(longTask.startTime + longTask.duration) }))
      }
    })
    ttiObserver.observe({ type: "longtask", buffered: true })

    return () => {
      fcpObserver.disconnect()
      lcpObserver.disconnect()
      ttiObserver.disconnect()
    }
  }, [])

  // 监控内存使用
  useEffect(() => {
    const checkMemory = () => {
      if ("memory" in performance) {
        const mem = (performance as any).memory
        setMetrics((prev) => ({
          ...prev,
          memory: {
            usedJSHeapSize: mem.usedJSHeapSize,
            totalJSHeapSize: mem.totalJSHeapSize,
            jsHeapSizeLimit: mem.jsHeapSizeLimit,
          },
        }))

        // 内存使用 > 80% 警告
        const usage = mem.usedJSHeapSize / mem.jsHeapSizeLimit
        if (usage > 0.8) {
          setAlerts((prev) => [...prev, `内存使用过高：${Math.round(usage * 100)}%`])
        }
      }
    }

    checkMemory()
    const interval = setInterval(checkMemory, 5000)
    return () => clearInterval(interval)
  }, [])

  // 监控 FPS
  useEffect(() => {
    let lastTime = performance.now()
    let frames = 0
    let fps = 60

    const countFPS = () => {
      const now = performance.now()
      frames++
      
      if (now - lastTime >= 1000) {
        fps = frames
        frames = 0
        lastTime = now
        setMetrics((prev) => ({ ...prev, fps }))
        
        // FPS < 30 警告
        if (fps < 30) {
          setAlerts((prev) => [...prev, `FPS 过低：${fps}`])
        }
      }
      
      requestAnimationFrame(countFPS)
    }
    
    requestAnimationFrame(countFPS)
    return () => {}
  }, [])

  // 监控渲染时间
  useEffect(() => {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const layoutEntry = entries.find((e) => e.entryType === "layout-shift")
      if (layoutEntry) {
        setMetrics((prev) => ({
          ...prev,
          renderTime: Math.round((layoutEntry as any).duration || 0),
        }))
      }
    })
    observer.observe({ type: "layout-shift", buffered: true })

    return () => observer.disconnect()
  }, [])

  // 清除警告
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  // 格式化内存大小
  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // 获取性能评级
  const getRating = (value: number, good: number, poor: number) => {
    if (value <= good) return "good"
    if (value <= poor) return "needs-improvement"
    return "poor"
  }

  if (!open) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--ide-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-[var(--ide-text)]">性能监控</span>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
          title="关闭"
        >
          <Activity className="w-3 h-3 text-[var(--ide-text-muted)]" />
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>{alerts.length} 个性能警告</span>
            <button onClick={clearAlerts} className="ml-auto text-amber-300 hover:text-amber-200">
              清除
            </button>
          </div>
          <ul className="mt-1 text-xs text-amber-300 space-y-0.5">
            {alerts.slice(0, 3).map((alert, i) => (
              <li key={i}>• {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metrics */}
      <div className="p-4 space-y-3">
        {/* FCP */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-[var(--ide-text-secondary)]">FCP</span>
          </div>
          <span className={`text-sm font-mono ${
            metrics.fcp ? getRating(metrics.fcp, 1000, 3000) === "good" ? "text-emerald-400" : "text-amber-400" : "text-[var(--ide-text-dim)]"
          }`}>
            {metrics.fcp ? `${metrics.fcp}ms` : "-"}
          </span>
        </div>

        {/* LCP */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-[var(--ide-text-secondary)]">LCP</span>
          </div>
          <span className={`text-sm font-mono ${
            metrics.lcp ? getRating(metrics.lcp, 2500, 4000) === "good" ? "text-emerald-400" : "text-amber-400" : "text-[var(--ide-text-dim)]"
          }`}>
            {metrics.lcp ? `${metrics.lcp}ms` : "-"}
          </span>
        </div>

        {/* TTI */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-[var(--ide-text-secondary)]">TTI</span>
          </div>
          <span className={`text-sm font-mono ${
            metrics.tti ? getRating(metrics.tti, 3800, 7300) === "good" ? "text-emerald-400" : "text-amber-400" : "text-[var(--ide-text-dim)]"
          }`}>
            {metrics.tti ? `${metrics.tti}ms` : "-"}
          </span>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-[var(--ide-text-secondary)]">FPS</span>
          </div>
          <span className={`text-sm font-mono ${
            metrics.fps >= 50 ? "text-emerald-400" : metrics.fps >= 30 ? "text-amber-400" : "text-red-400"
          }`}>
            {metrics.fps}
          </span>
        </div>

        {/* Memory */}
        {metrics.memory && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-[var(--ide-text-secondary)]">内存</span>
            </div>
            <span className={`text-sm font-mono ${
              metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit > 0.8 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {formatMemory(metrics.memory.usedJSHeapSize)} / {formatMemory(metrics.memory.jsHeapSizeLimit)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--ide-border)] bg-[var(--ide-bg-inset)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--ide-text-dim)]">渲染时间</span>
          <span className="font-mono text-[var(--ide-text-secondary)]">{metrics.renderTime}ms</span>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMonitor
