/**
 * @file TestGeneratorPanel.tsx
 * @description F2.5 智能测试用例生成面板，展示 TestGenerator 生成的测试用例，
 *              支持单文件/全项目生成、分类筛选、代码复制、测试覆盖率预估
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,generation,vitest,panel,coverage
 */

// ===================================================================
//  TestGeneratorPanel — F2.5 智能测试用例生成面板
// ===================================================================

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  FlaskConical,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Search,
  RefreshCw,
  X,
  Copy,
  Check,
  Sparkles,
  Plus,
  Filter,
  Code2,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";
import { useFileStore } from "./FileStore";
import { copyToClipboard } from "./utils/clipboard";
import {
  generateProjectTestPlan,
  type ProjectTestPlan,
  type TestSuite,
  type TestCase,
  type TestCategory,
  type TestPriority,
} from "./ai/TestGenerator";
import { RecentErrorsEntry } from "./RecentErrorsEntry";

// ── Config ──

const CATEGORY_LABEL: Record<TestCategory, string> = {
  unit: "单元",
  component: "组件",
  hook: "Hook",
  integration: "集成",
  "edge-case": "边界",
  error: "错误",
};

const CATEGORY_COLOR: Record<TestCategory, string> = {
  unit: "text-blue-400",
  component: "text-violet-400",
  hook: "text-cyan-400",
  integration: "text-emerald-400",
  "edge-case": "text-amber-400",
  error: "text-red-400",
};

const PRIORITY_CONFIG: Record<
  TestPriority,
  { label: string; color: string; bg: string }
> = {
  critical: { label: "关键", color: "text-red-400", bg: "bg-red-500/15" },
  high: { label: "高", color: "text-orange-400", bg: "bg-orange-500/12" },
  medium: { label: "中", color: "text-amber-400", bg: "bg-amber-500/10" },
  low: { label: "低", color: "text-slate-400", bg: "bg-slate-500/[0.08]" },
};

// ── Component ──

export default function TestGeneratorPanel({ nodeId }: { nodeId: string }) {
  const { fileContents, createFile, setActiveFile } = useFileStore();
  const [plan, setPlan] = useState<ProjectTestPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TestCategory | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate plan
  const generatePlan = useCallback(() => {
    setIsGenerating(true);
    queueMicrotask(() => {
      const result = generateProjectTestPlan(fileContents);
      setPlan(result);
      setIsGenerating(false);
      // Auto-expand first suite
      if (result.suites.length > 0) {
        setExpandedSuites(new Set([result.suites[0].targetFile]));
      }
    });
  }, [fileContents]);

  useEffect(() => {
    const t = setTimeout(generatePlan, 800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter
  const filteredSuites = useMemo(() => {
    if (!plan) return [];
    return plan.suites
      .map((suite) => {
        const filtered = suite.testCases.filter((tc) => {
          if (categoryFilter && tc.category !== categoryFilter) return false;
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (
              !tc.name.toLowerCase().includes(q) &&
              !tc.targetSymbol.toLowerCase().includes(q) &&
              !suite.targetFile.toLowerCase().includes(q)
            )
              return false;
          }
          return true;
        });
        return { ...suite, testCases: filtered };
      })
      .filter((s) => s.testCases.length > 0);
  }, [plan, categoryFilter, searchQuery]);

  const totalFilteredTests = useMemo(
    () => filteredSuites.reduce((s, su) => s + su.testCases.length, 0),
    [filteredSuites],
  );

  const toggleSuite = useCallback((fp: string) => {
    setExpandedSuites((prev) => {
      const next = new Set(prev);
      if (next.has(fp)) next.delete(fp);
      else next.add(fp);
      return next;
    });
  }, []);

  const toggleCase = useCallback((id: string) => {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    copyToClipboard(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const handleCreateTestFile = useCallback(
    (suite: TestSuite) => {
      createFile(suite.filepath, suite.fullCode);
      setActiveFile(suite.filepath);
    },
    [createFile, setActiveFile],
  );

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!plan) return {} as Record<TestCategory, number>;
    const counts: Partial<Record<TestCategory, number>> = {};
    for (const s of plan.suites) {
      for (const tc of s.testCases) {
        counts[tc.category] = (counts[tc.category] || 0) + 1;
      }
    }
    return counts;
  }, [plan]);

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="test-gen"
        title="测试生成"
        icon={<FlaskConical className="w-3 h-3 text-emerald-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={generatePlan}
            disabled={isGenerating}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 text-slate-600 disabled:opacity-30 transition-colors"
            title="重新生成"
          >
            <RefreshCw
              className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </PanelHeader>

      {/* Overview */}
      {plan && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-faint)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/10">
              <span className="text-[1rem] text-emerald-400">
                {plan.totalTests}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                测试用例
              </div>
              <div className="text-[0.6rem] text-[var(--ide-text-dim)] mt-0.5">
                {plan.suites.length} 个文件 ·{" "}
                {filteredSuites.reduce((s, su) => {
                  const syms = new Set(su.testCases.map((t) => t.targetSymbol));
                  return s + syms.size;
                }, 0)}{" "}
                个符号
              </div>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1 mt-2">
            {(Object.entries(categoryBreakdown) as [TestCategory, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() =>
                    setCategoryFilter(categoryFilter === cat ? null : cat)
                  }
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.55rem] transition-colors ${
                    categoryFilter === cat
                      ? `${CATEGORY_COLOR[cat]} bg-white/5`
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  <span>{CATEGORY_LABEL[cat]}</span>
                  <span className="text-[0.5rem] opacity-60">{count}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
        <div className="flex items-center gap-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded px-2 py-0.5">
          <Search className="w-3 h-3 text-slate-600 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索测试 / 符号..."
            className="flex-1 bg-transparent border-0 outline-none text-[0.68rem] text-slate-300 placeholder:text-slate-700"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-3 h-3 text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!plan ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              {isGenerating ? (
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
              ) : (
                <FlaskConical className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              )}
              <p className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                {isGenerating ? "正在分析..." : "等待分析"}
              </p>
            </div>
          </div>
        ) : filteredSuites.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FlaskConical className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-[0.72rem] text-[var(--ide-text-secondary)]">
                无匹配的测试用例
              </p>
            </div>
          </div>
        ) : (
          <div className="py-0.5">
            {filteredSuites.map((suite) => {
              const expanded = expandedSuites.has(suite.targetFile);
              const fileName =
                suite.targetFile.split("/").pop() || suite.targetFile;
              const symbols = new Set(
                suite.testCases.map((t) => t.targetSymbol),
              );
              const critCount = suite.testCases.filter(
                (t) => t.priority === "critical",
              ).length;

              return (
                <div
                  key={suite.targetFile}
                  className="border-b border-[var(--ide-border-faint)] last:border-b-0"
                >
                  {/* File header */}
                  <button
                    onClick={() => toggleSuite(suite.targetFile)}
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
                    <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
                      {symbols.size} 符号
                    </span>
                    {critCount > 0 && (
                      <span className="px-1 py-0.5 rounded text-[0.5rem] bg-red-500/15 text-red-400">
                        {critCount}关键
                      </span>
                    )}
                    <span className="px-1 py-0.5 rounded text-[0.5rem] bg-slate-500/10 text-slate-500">
                      {suite.testCases.length}
                    </span>
                  </button>

                  {expanded && (
                    <div className="bg-[var(--ide-bg-inset)]">
                      {/* Create test file button */}
                      <div className="px-3 py-1.5 border-b border-[var(--ide-border-faint)]">
                        <button
                          onClick={() => handleCreateTestFile(suite)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[0.62rem]"
                        >
                          <Plus className="w-3 h-3" />
                          创建测试文件
                          <span className="text-[0.55rem] opacity-60">
                            → {suite.filepath.split("/").pop()}
                          </span>
                        </button>
                      </div>

                      {/* Test cases */}
                      {suite.testCases.map((tc) => (
                        <TestCaseRow
                          key={tc.id}
                          testCase={tc}
                          expanded={expandedCases.has(tc.id)}
                          copiedId={copiedId}
                          onToggle={() => toggleCase(tc.id)}
                          onCopy={() => handleCopy(tc.testCode, tc.id)}
                        />
                      ))}

                      {/* Copy full suite */}
                      <div className="px-3 py-1 border-t border-[var(--ide-border-faint)]">
                        <button
                          onClick={() =>
                            handleCopy(
                              suite.fullCode,
                              `suite-${suite.targetFile}`,
                            )
                          }
                          className="flex items-center gap-1 text-[0.58rem] text-sky-400/60 hover:text-sky-400 transition-colors"
                        >
                          {copiedId === `suite-${suite.targetFile}` ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          复制完整测试文件
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {plan && (
        <div className="flex-shrink-0 border-t border-[var(--ide-border-faint)] bg-[var(--ide-bg-surface)]">
          <div className="h-6 px-3 flex items-center justify-between">
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              {totalFilteredTests} 测试 · {filteredSuites.length} 文件
            </span>
            <span className="text-[0.55rem] text-[var(--ide-text-dim)]">
              {new Date(plan.analyzedAt).toLocaleTimeString()} 生成
            </span>
          </div>
          <RecentErrorsEntry />
        </div>
      )}
    </div>
  );
}

// ── TestCase row ──

function TestCaseRow({
  testCase: tc,
  expanded,
  copiedId,
  onToggle,
  onCopy,
}: {
  testCase: TestCase;
  expanded: boolean;
  copiedId: string | null;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const priCfg = PRIORITY_CONFIG[tc.priority];

  return (
    <div className="border-b border-[var(--ide-border-faint)] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/[0.02] transition-colors group"
      >
        {expanded ? (
          <ChevronDown className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
        )}
        <Code2
          className={`w-3 h-3 flex-shrink-0 ${CATEGORY_COLOR[tc.category]}`}
        />
        <span className="text-[0.65rem] text-[var(--ide-text-secondary)] truncate flex-1 text-left">
          {tc.name}
        </span>
        <span
          className={`px-1 py-0.5 rounded text-[0.48rem] ${CATEGORY_COLOR[tc.category]} bg-white/[0.03]`}
        >
          {CATEGORY_LABEL[tc.category]}
        </span>
        <span
          className={`px-1 py-0.5 rounded text-[0.48rem] ${priCfg.bg} ${priCfg.color}`}
        >
          {priCfg.label}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-2">
          <p className="text-[0.58rem] text-[var(--ide-text-dim)] mb-1.5 pl-6">
            {tc.description}
          </p>
          <div className="ml-6 rounded border border-[var(--ide-border-dim)] overflow-hidden bg-[var(--ide-bg-elevated)]">
            <div className="flex items-center justify-between px-2 py-0.5 border-b border-[var(--ide-border-faint)]">
              <span className="text-[0.52rem] text-[var(--ide-text-dim)]">
                生成的测试代码
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="flex items-center gap-0.5 text-[0.52rem] text-sky-400/60 hover:text-sky-400 transition-colors"
              >
                {copiedId === tc.id ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
                {copiedId === tc.id ? "已复制" : "复制"}
              </button>
            </div>
            <pre className="p-2 text-[0.58rem] text-slate-400 overflow-x-auto whitespace-pre-wrap">
              {tc.testCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
