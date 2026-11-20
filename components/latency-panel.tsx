'use client';

/**
 * @fileoverview 延迟观测面板（M2 观测闭环可视化）
 * @description 纯展示组件：接收 buildLatencySnapshot 快照，渲染各指标
 *              P50/P95 与 SLO 达标状态（达标/超标/暂无数据三态）。
 *              数据由调用方请求 /api/metrics 或服务端快照后传入。
 * @module components/latency-panel
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LatencySnapshot } from '@/lib/observability';

export default function LatencyPanel({ snapshot }: { snapshot: LatencySnapshot }) {
  return (
    <section aria-labelledby="latency-panel-title" className="space-y-2">
      <h2 id="latency-panel-title" className="text-xl font-semibold">
        延迟观测
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>指标</TableHead>
            <TableHead>样本数</TableHead>
            <TableHead>P50 (ms)</TableHead>
            <TableHead>P95 (ms)</TableHead>
            <TableHead>SLO 目标 (ms)</TableHead>
            <TableHead>状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {snapshot.metrics.map((m) => (
            <TableRow key={m.metric}>
              <TableCell>{m.label}</TableCell>
              <TableCell>{m.count}</TableCell>
              <TableCell>{m.p50 ?? '—'}</TableCell>
              <TableCell>{m.p95 ?? '—'}</TableCell>
              <TableCell>{m.sloTargetMs}</TableCell>
              <TableCell>
                {m.sloMet === null ? (
                  <Badge variant="secondary">暂无数据</Badge>
                ) : m.sloMet ? (
                  <Badge variant="default">达标</Badge>
                ) : (
                  <Badge variant="destructive">超标</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        采集时间：{snapshot.capturedAt}
      </p>
    </section>
  );
}
