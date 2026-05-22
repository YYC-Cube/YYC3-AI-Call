/**
 * @file SecurityPanel.tsx
 * @description F2.4 智能安全扫描面板，可视化展示 SecurityScanner 的扫描结果，
 *              支持按严重度过滤、分类统计、OWASP/CWE 引用、修复建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,scanner,panel,owasp,cwe,vulnerabilities
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Search,
  RefreshCw,
  X,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Bug,
  Lock,
  Eye,
  Link2,
  Shield,
  Key,
  Settings2,
  GitBranch,
  Package,
  Filter,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import { useFileStore } from "./FileStore";
import {
  scanProject,
  applySecurityFix,
  type ProjectSecurityReport,
  type SecurityFinding,
  type SecurityCategory,
  type SecuritySeverity,
} from "./ai/SecurityScanner";
import { useAIFixStore } from "./stores/useAIFixStore";
import { buildSecurityFixPrompt } from "./ai/SecurityScanner";
import { RecentErrorsEntry } from "./RecentErrorsEntry";

// ── Category config ──

const CATEGORY_CONFIG: Record<
  SecurityCategory,
  { icon: typeof ShieldAlert; label: string; color: string }
> = {
  xss: { icon: Bug, label: "XSS", color: "text-red-400" },
  injection: { icon: AlertTriangle, label: "注入", color: "text-red-500" },
  auth: { icon: Key, label: "认证", color: "text-amber-400" },
  "sensitive-data": { icon: Eye, label: "敏感数据", color: "text-orange-400" },
  dependency: { icon: Package, label: "依赖", color: "text-violet-400" },
  csrf: { icon: Link2, label: "CSRF", color: "text-rose-400" },
  config: { icon: Settings2, label: "配置", color: "text-sky-400" },
  crypto: { icon: Lock, label: "加密", color: "text-cyan-400" },
  "access-control": { icon: Shield, label: "访问控制", color: "text-blue-400" },
  "supply-chain": {
    icon: GitBranch,
    label: "供应链",
    color: "text-emerald-400",
  },
};

const SEVERITY_CONFIG: Record<
  SecuritySeverity,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  critical: {
    label: "严重",
    color: "text-red-500",
    bgColor: "bg-red-500/15",
    borderColor: "border-red-500/20",
  },
  high: {
    label: "高危",
    color: "text-orange-400",
    bgColor: "bg-orange-500/12",
    borderColor: "border-orange-500/15",
  },
  medium: {
    label: "中危",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/12",
  },
  low: {
    label: "低危",
    color: "text-blue-400",
    bgColor: "bg-blue-500/[0.08]",
    borderColor: "border-blue-500/10",
  },
  info: {
    label: "信息",
    color: "text-slate-400",
    bgColor: "bg-slate-500/5",
    borderColor: "border-slate-500/[0.08]",
  },
};

// ── Component ──

export default function SecurityPanel({ nodeId }: { nodeId: string }) {
  const { fileContents, setActiveFile, updateFile } = useFileStore();
  const requestFix = useAIFixStore((s) => s.requestFix);

  const [report, setReport] = useState<ProjectSecurityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Set<SecuritySeverity>>(
    new Set(["critical", "high", "medium", "low", "info"]),
  );
  const [categoryFilter, setCategoryFilter] = useState<SecurityCategory | null>(
    null,
  );
  const scanTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Run scan
  const runScan = useCallback(() => {
    setIsScanning(true);
    queueMicrotask(() => {
      const result = scanProject(fileContents);
      setReport(result);
      setIsScanning(false);
    });
  }, [fileContents]);

  // Auto-scan on mount
  useEffect(() => {
    scanTimer.current = setTimeout(runScan, 800);
    return () => clearTimeout(scanTimer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered findings
  const filteredFindings = useMemo(() => {
    if (!report) return [];
    const all: SecurityFinding[] = [];
    for (const file of report.files) {
      for (const f of file.findings) {
        if (!severityFilter.has(f.severity)) continue;
        if (categoryFilter && f.category !== categoryFilter) continue;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !f.title.toLowerCase().includes(q) &&
            !f.filepath.toLowerCase().includes(q) &&
            !(f.cweId || "").toLowerCase().includes(q)
          )
            continue;
        }
        all.push(f);
      }
    }
    return all;
  }, [report, severityFilter, categoryFilter, searchQuery]);

  // By file
  const byFile = useMemo(() => {
    const map = new Map<string, SecurityFinding[]>();
    for (const f of filteredFindings) {
      if (!map.has(f.filepath)) map.set(f.filepath, []);
      map.get(f.filepath)!.push(f);
    }
    return map;
  }, [filteredFindings]);

  const toggleFile = useCallback((fp: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fp)) next.delete(fp);
      else next.add(fp);
      return next;
    });
  }, []);

  const toggleSeverity = useCallback((sev: SecuritySeverity) => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }, []);

  const handleApplyFix = useCallback(
    (finding: SecurityFinding) => {
      if (!finding.autoFix) return;
      const content = fileContents[finding.filepath];
      if (!content) return;
      const fixed = applySecurityFix(content, finding.autoFix);
      updateFile(finding.filepath, fixed);
      // Re-scan after fix
      setTimeout(runScan, 300);
    },
    [fileContents, updateFile, runScan],
  );

  const handleAIFix = useCallback(
    (finding: SecurityFinding) => {
      const content = fileContents[finding.filepath];
      if (!content) return;
      const prompt = buildSecurityFixPrompt(finding, content);
      requestFix(prompt, finding.filepath);
    },
    [fileContents, requestFix],
  );

  // Risk gauge color
  const riskColor = (score: number) =>
    score >= 60
      ? "text-red-500"
      : score >= 30
        ? "text-amber-400"
        : score >= 10
          ? "text-blue-400"
          : "text-emerald-400";
  const riskBg = (score: number) =>
    score >= 60
      ? "bg-red-500/10"
      : score >= 30
        ? "bg-amber-500/10"
        : score >= 10
          ? "bg-blue-500/10"
          : "bg-emerald-500/10";
  const riskLabel = (score: number) =>
    score >= 60
      ? "高风险"
      : score >= 30
        ? "中风险"
        : score >= 10
          ? "低风险"
          : "安全";

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="security"
        title="安全扫描"
        icon={<ShieldAlert className="w-3 h-3 text-red-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={runScan}
            disabled={isScanning}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 text-slate-600 disabled:opacity-30 transition-colors"
            title="重新扫描"
          >
            <RefreshCw
              className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </PanelHeader>

      {/* Risk Overview */}
      {report && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-faint)]">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${riskBg(report.overallRiskScore)} border border-current/10`}
            >
              {report.overallRiskScore === 0 ? (
                <ShieldCheck
                  className={`w-5 h-5 ${riskColor(report.overallRiskScore)}`}
                />
              ) : (
                <span
                  className={`text-[1rem] ${riskColor(report.overallRiskScore)}`}
                >
                  {report.overallRiskScore}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div
                className={`text-[0.72rem] ${riskColor(report.overallRiskScore)}`}
              >
                {riskLabel(report.overallRiskScore)}
              </div>
              <div className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5">
                {filteredFindings.length} 个发现 · {report.files.length} 个文件
              </div>
            </div>
          </div>

          {/* Severity badges */}
          <div className="flex items-center gap-1.5 mt-2">
            {report.criticalCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[0.55rem] bg-red-500/15 text-red-500">
                {report.criticalCount} 严重
              </span>
            )}
            {report.highCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[0.55rem] bg-orange-500/12 text-orange-400">
                {report.highCount} 高危
              </span>
            )}
            {report.mediumCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[0.55rem] bg-amber-500/10 text-amber-400">
                {report.mediumCount} 中危
              </span>
            )}
            {report.lowCount + report.infoCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[0.55rem] bg-slate-500/5 text-slate-400">
                {report.lowCount + report.infoCount} 低/信息
              </span>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1 mt-2">
            {(
              Object.entries(report.categoryBreakdown) as [
                SecurityCategory,
                number,
              ][]
            )
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                return (
                  <button
                    key={cat}
                    onClick={() =>
                      setCategoryFilter(categoryFilter === cat ? null : cat)
                    }
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.55rem] transition-colors ${
                      categoryFilter === cat
                        ? `${cfg.color} bg-white/5`
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{cfg.label}</span>
                    <span className="text-[0.5rem] opacity-60">{count}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Search & Severity Filter */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded px-2 py-0.5">
            <Search className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索漏洞 / CWE..."
              className="flex-1 bg-transparent border-0 outline-none text-[0.68rem] text-slate-300 placeholder:text-slate-700"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3 text-slate-600" />
              </button>
            )}
          </div>
          {(["critical", "high", "medium", "low"] as SecuritySeverity[]).map(
            (sev) => {
              const cfg = SEVERITY_CONFIG[sev];
              const active = severityFilter.has(sev);
              return (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  className={`px-1.5 py-0.5 rounded text-[0.58rem] transition-colors ${
                    active
                      ? `${cfg.bgColor} ${cfg.color}`
                      : "text-slate-700 hover:text-slate-500"
                  }`}
                  title={cfg.label}
                >
                  {cfg.label}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!report ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              {isScanning ? (
                <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              )}
              <p className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                {isScanning ? "正在扫描..." : "等待扫描"}
              </p>
            </div>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                未发现安全问题
              </p>
              <p className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5">
                代码通过了所有安全检查
              </p>
            </div>
          </div>
        ) : (
          <div className="py-0.5">
            {/* Critical/High banner */}
            {report.topFindings.length > 0 &&
              !categoryFilter &&
              !searchQuery && (
                <div className="mx-3 my-2 px-2.5 py-2 rounded-md bg-red-500/[0.04] border border-red-500/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldAlert className="w-3 h-3 text-red-400" />
                    <span className="text-[0.65rem] text-red-400">
                      严重/高危漏洞 ({report.criticalCount + report.highCount})
                    </span>
                  </div>
                  {report.topFindings.slice(0, 3).map((f) => (
                    <div
                      key={f.id}
                      className="text-[0.6rem] text-red-400/70 py-0.5 cursor-pointer hover:text-red-300 transition-colors flex items-center gap-1"
                      onClick={() => setActiveFile(f.filepath)}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${f.severity === "critical" ? "bg-red-500" : "bg-orange-400"}`}
                      />
                      {f.title}
                      {f.cweId && (
                        <span className="text-[0.5rem] opacity-50">
                          ({f.cweId})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {/* By file */}
            {[...byFile.entries()].map(([filepath, findings]) => {
              const expanded = expandedFiles.has(filepath);
              const fileName = filepath.split("/").pop() || filepath;
              const critCount = findings.filter(
                (f) => f.severity === "critical",
              ).length;
              const highCount = findings.filter(
                (f) => f.severity === "high",
              ).length;

              return (
                <div
                  key={filepath}
                  className="border-b border-[var(--ide-border-faint)] last:border-b-0"
                >
                  <button
                    onClick={() => toggleFile(filepath)}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/[0.02] transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    )}
                    <FileCode2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-[0.7rem] text-[var(--ide-text-secondary)] truncate flex-1 text-left">
                      {fileName}
                    </span>
                    {critCount > 0 && (
                      <span className="px-1 py-0.5 rounded text-[0.5rem] bg-red-500/15 text-red-500">
                        {critCount}严重
                      </span>
                    )}
                    {highCount > 0 && (
                      <span className="px-1 py-0.5 rounded text-[0.5rem] bg-orange-500/12 text-orange-400">
                        {highCount}高
                      </span>
                    )}
                    <span className="px-1 py-0.5 rounded text-[0.5rem] bg-slate-500/10 text-slate-500">
                      {findings.length}
                    </span>
                  </button>

                  {expanded && (
                    <div className="bg-[var(--ide-bg-inset)]">
                      {findings.map((f) => (
                        <FindingRow
                          key={f.id}
                          finding={f}
                          onClick={() => setActiveFile(f.filepath)}
                          onApplyFix={() => handleApplyFix(f)}
                          onAIFix={() => handleAIFix(f)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {report && (
        <div className="flex-shrink-0 border-t border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
          <div className="h-6 px-3 flex items-center justify-between">
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              {report.files.length} 个文件 · 风险 {report.overallRiskScore}/100
            </span>
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              {new Date(report.analyzedAt).toLocaleTimeString()} 更新
            </span>
          </div>
          <RecentErrorsEntry />
        </div>
      )}
    </div>
  );
}

// ── Finding row ──

function FindingRow({
  finding: f,
  onClick,
  onApplyFix,
  onAIFix,
}: {
  finding: SecurityFinding;
  onClick: () => void;
  onApplyFix: () => void;
  onAIFix: () => void;
}) {
  const [showCode, setShowCode] = useState(false);
  const catCfg = CATEGORY_CONFIG[f.category];
  const sevCfg = SEVERITY_CONFIG[f.severity];
  const CatIcon = catCfg.icon;

  return (
    <div
      className="px-3 py-2 hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-[var(--ide-border-faint)] last:border-b-0 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <CatIcon
          className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${catCfg.color}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[0.68rem] text-[var(--ide-text-secondary)] flex-1">
              {f.title}
            </p>
            <span
              className={`px-1 py-0.5 rounded text-[0.5rem] ${sevCfg.bgColor} ${sevCfg.color}`}
            >
              {sevCfg.label}
            </span>
          </div>

          <p className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5">
            {f.description}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              行 {f.line}
            </span>
            {f.cweId && (
              <span className="text-[0.55rem] text-sky-400/60">{f.cweId}</span>
            )}
            {f.owaspCategory && (
              <span className="text-[0.5rem] text-violet-400/50">
                {f.owaspCategory}
              </span>
            )}

            {f.codeExample && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCode(!showCode);
                }}
                className="text-[0.55rem] text-sky-400/60 hover:text-sky-400 transition-colors"
              >
                {showCode ? "隐藏示例" : "查看修复"}
              </button>
            )}

            {f.autoFixable && f.autoFix && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyFix();
                }}
                className="text-[0.55rem] text-emerald-400/70 hover:text-emerald-400 transition-colors"
              >
                自动修复
              </button>
            )}
          </div>

          {/* Remediation */}
          <div className="mt-1 text-[0.58rem] text-[var(--ide-text-dim)] bg-[var(--ide-bg-elevated)] rounded px-2 py-1">
            💡 {f.remediation}
          </div>

          {/* Code example */}
          {showCode && f.codeExample && (
            <div className="mt-2 rounded border border-[var(--ide-border-dim)] overflow-hidden text-[0.58rem]">
              <div className="px-2 py-1 bg-red-500/[0.04] border-b border-[var(--ide-border-faint)]">
                <span className="text-red-400/60">⚠️ 不安全:</span>
                <pre className="text-red-400/80 mt-0.5 whitespace-pre-wrap">
                  {f.codeExample.vulnerable}
                </pre>
              </div>
              <div className="px-2 py-1 bg-emerald-500/[0.04]">
                <span className="text-emerald-400/60">✅ 安全:</span>
                <pre className="text-emerald-400/80 mt-0.5 whitespace-pre-wrap">
                  {f.codeExample.secure}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* AI fix button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAIFix();
          }}
          className="w-5 h-5 rounded flex items-center justify-center bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
          title="AI 修复"
        >
          <Sparkles className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
