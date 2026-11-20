'use client';

/**
 * @fileoverview 合规台账（号码状态 / 禁拨名单 / 校验记录）
 * @description 三表只读台账 + RBAC 可见性：MANAGER/ADMIN 可见操作列
 *              （暂停/恢复），其余角色只读。数据经 props 注入（由调用方
 *              请求 /api/compliance/* 后传入），组件保持纯展示。
 * @module components/compliance-ledger
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface PhoneNumberRow {
  id: string;
  number: string;
  status: 'AVAILABLE' | 'SUSPENDED' | 'BLOCKED';
  carrier?: string | null;
  hasAuthorization: boolean;
  dailyLimit: number;
}

export interface DncRow {
  id: string;
  phone: string;
  reason: 'COMPLAINT' | 'OPT_OUT' | 'REGULATOR';
  expiresAt?: string | null;
}

export interface OutboundTaskRow {
  id: string;
  lineNumber: string;
  customerPhone: string;
  status: string;
  blockedGate?: string | null;
  checkedAt: string;
}

export interface ComplianceLedgerProps {
  /** 当前用户角色（RBAC：MANAGER/ADMIN 可见操作列） */
  role?: string;
  numbers?: PhoneNumberRow[];
  dncEntries?: DncRow[];
  tasks?: OutboundTaskRow[];
}

const NUMBER_STATUS_LABEL: Record<PhoneNumberRow['status'], string> = {
  AVAILABLE: '可用',
  SUSPENDED: '待审',
  BLOCKED: '禁用',
};

const DNC_REASON_LABEL: Record<DncRow['reason'], string> = {
  COMPLAINT: '投诉',
  OPT_OUT: '退订',
  REGULATOR: '监管下发',
};

const TASK_STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  COMPLIANCE_PASSED: '校验通过',
  DIALING: '拨号中',
  COMPLETED: '已完成',
  FAILED: '失败',
  BLOCKED: '已阻断',
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'AVAILABLE' || status === 'COMPLIANCE_PASSED' || status === 'COMPLETED') {
    return 'default';
  }
  if (status === 'BLOCKED' || status === 'FAILED') return 'destructive';
  if (status === 'DIALING') return 'default';
  return 'secondary';
}

export default function ComplianceLedger({
  role = 'AGENT',
  numbers = [],
  dncEntries = [],
  tasks = [],
}: ComplianceLedgerProps) {
  const canManage = ['MANAGER', 'ADMIN'].includes(role);

  return (
    <section aria-labelledby="compliance-ledger-title" className="space-y-4">
      <h2 id="compliance-ledger-title" className="text-xl font-semibold">
        合规台账
      </h2>
      <Tabs defaultValue="numbers">
        <TabsList aria-label="合规台账切换">
          <TabsTrigger value="numbers">号码状态</TabsTrigger>
          <TabsTrigger value="dnc">禁拨名单</TabsTrigger>
          <TabsTrigger value="tasks">校验记录</TabsTrigger>
        </TabsList>

        <TabsContent value="numbers">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>外呼号码</TableHead>
                <TableHead>运营商</TableHead>
                <TableHead>授权凭证</TableHead>
                <TableHead>日呼上限</TableHead>
                <TableHead>状态</TableHead>
                {canManage && <TableHead>操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5}>暂无号码记录</TableCell>
                </TableRow>
              )}
              {numbers.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.number}</TableCell>
                  <TableCell>{n.carrier || '—'}</TableCell>
                  <TableCell>{n.hasAuthorization ? '已备案' : '未备案'}</TableCell>
                  <TableCell>{n.dailyLimit}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(n.status)}>
                      {NUMBER_STATUS_LABEL[n.status]}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {n.status === 'AVAILABLE' ? (
                        <button
                          type="button"
                          aria-label={`暂停号码 ${n.number}`}
                          className="text-sm underline"
                        >
                          暂停
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`恢复号码 ${n.number}`}
                          className="text-sm underline"
                        >
                          恢复
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="dnc">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>被叫号码</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>到期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dncEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>禁拨名单为空</TableCell>
                </TableRow>
              )}
              {dncEntries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{DNC_REASON_LABEL[d.reason]}</Badge>
                  </TableCell>
                  <TableCell>{d.expiresAt ? d.expiresAt : '永久'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="tasks">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>线路</TableHead>
                <TableHead>被叫</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>阻断闸</TableHead>
                <TableHead>校验时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>暂无校验记录</TableCell>
                </TableRow>
              )}
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.lineNumber}</TableCell>
                  <TableCell>{t.customerPhone}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(t.status)}>
                      {TASK_STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.blockedGate || '—'}</TableCell>
                  <TableCell>{t.checkedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </section>
  );
}
