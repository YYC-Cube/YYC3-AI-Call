/**
 * @file APIKeySettingsUI.tsx
 * @description API Key 管理设置 UI，支持多 Provider API Key 配置、
 *              安全存储、可视化显隐、连通性测试、使用统计
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags api-key,settings,security,providers
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  Server,
  Cloud,
  Bot,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  XCircle,
  BarChart3,
  Activity,
  TrendingUp,
  Zap,
  Clock,
  Award,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { useModelRegistry, type AIModel } from "./ModelRegistry";
import {
  testModelConnectivity,
  type ConnectivityTestResult,
} from "./LLMService";

interface OllamaDetectedModel {
  name: string;
  size: string;
  status: "online" | "offline";
  quantization: string;
}
const SIM_MODELS: OllamaDetectedModel[] = [
  {
    name: "llama3.1:8b",
    size: "4.7 GB",
    status: "online",
    quantization: "Q4_K_M",
  },
  {
    name: "codellama:13b",
    size: "7.4 GB",
    status: "online",
    quantization: "Q4_0",
  },
  {
    name: "qwen2.5:7b",
    size: "4.4 GB",
    status: "online",
    quantization: "Q4_K_M",
  },
  {
    name: "deepseek-coder:6.7b",
    size: "3.8 GB",
    status: "offline",
    quantization: "Q5_K_M",
  },
  {
    name: "mistral:7b",
    size: "4.1 GB",
    status: "online",
    quantization: "Q4_0",
  },
];
const pColors: Record<string, string> = {
  openai: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  ollama: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  custom: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  zhipu: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  dashscope: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  deepseek: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};
const pIcons: Record<string, React.ElementType> = {
  openai: Cloud,
  ollama: Server,
  custom: Bot,
  zhipu: Cloud,
  dashscope: Cloud,
  deepseek: Cloud,
};
const OC_PRE = "yyc3_ollama_cache_",
  OC_TTL = 30 * 60 * 1000;
function readOC(h: string) {
  try {
    const k = OC_PRE + h.replace(/[^a-zA-Z0-9]/g, "_"),
      r = localStorage.getItem(k);
    if (!r) return null;
    const e = JSON.parse(r);
    return Date.now() - e.timestamp > OC_TTL
      ? (localStorage.removeItem(k), null)
      : e;
  } catch {
    return null;
  }
}
function writeOC(h: string, m: OllamaDetectedModel[]) {
  try {
    localStorage.setItem(
      OC_PRE + h.replace(/[^a-zA-Z0-9]/g, "_"),
      JSON.stringify({ models: m, host: h, timestamp: Date.now() }),
    );
  } catch {}
}
function fmtAge(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "刚刚";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m  } 分钟前`;
  return `${Math.floor(m / 60)  } 小时前`;
}
const PK = "yyc3_model_perf_data",
  UK = "yyc3_model_usage_data";
interface PR {
  modelId: string;
  modelName: string;
  providerId: string;
  latencyMs: number;
  success: boolean;
  timestamp: number;
}
interface UR {
  modelId: string;
  modelName: string;
  providerId: string;
  messageCount: number;
  estimatedTokens: number;
  lastUsed: number;
}
function ldPerf(): PR[] {
  try {
    return JSON.parse(localStorage.getItem(PK) || "[]");
  } catch {
    return [];
  }
}
function svPerf(r: PR) {
  try {
    const d = ldPerf();
    d.push(r);
    localStorage.setItem(PK, JSON.stringify(d.slice(-200)));
  } catch {}
}
function ldUsage(): Record<string, UR> {
  try {
    return JSON.parse(localStorage.getItem(UK) || "{}");
  } catch {
    return {};
  }
}

export default function APIKeySettings() {
  const {
    showSettings,
    setShowSettings,
    models,
    addCustomModel,
    removeModel,
    updateModel,
    updateCustomModel,
    setActiveModelId,
    activeModelId,
    providers,
    getProviderApiKey,
    setProviderApiKey,
  } = useModelRegistry();
  
  console.log('[APIKeySettingsUI] Component render, showSettings:', showSettings);
  const [tab, setTab] = useState<"models" | "ollama" | "perf" | "usage">(
    "models",
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIModel>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [nm, setNm] = useState({
    name: "",
    provider: "custom",
    endpoint: "",
    apiKey: "",
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testId, setTestId] = useState<string | null>(null);
  const [testRes, setTestRes] = useState<
    Record<string, ConnectivityTestResult>
  >({});
  const [perf, setPerf] = useState<PR[]>(() => ldPerf());
  const usage = useMemo(() => ldUsage(), []);
  const [olScan, setOlScan] = useState(false);
  const [olModels, setOlModels] = useState<OllamaDetectedModel[]>([]);
  const [olHost, setOlHost] = useState("http://localhost:11434");
  const [olConn, setOlConn] = useState(false);
  const [cache, setCache] = useState(false);
  const [cacheTs, setCacheTs] = useState<number | null>(null);
  const mRef = useRef(true),
    abRef = useRef(false),
    tmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const agg = useMemo(() => {
    const m: Record<
      string,
      {
        mn: string;
        pi: string;
        t: number;
        s: number;
        tl: number;
        mn2: number;
        mx: number;
        al: number;
        sr: number;
      }
    > = {};
    for (const r of perf) {
      if (!m[r.modelId])
        m[r.modelId] = {
          mn: r.modelName,
          pi: r.providerId,
          t: 0,
          s: 0,
          tl: 0,
          mn2: Infinity,
          mx: 0,
          al: 0,
          sr: 0,
        };
      const a = m[r.modelId];
      a.t++;
      if (r.success) {
        a.s++;
        a.tl += r.latencyMs;
        a.mn2 = Math.min(a.mn2, r.latencyMs);
        a.mx = Math.max(a.mx, r.latencyMs);
      }
    }
    for (const k of Object.keys(m)) {
      const a = m[k];
      a.sr = a.t > 0 ? Math.round((a.s / a.t) * 100) : 0;
      a.al = a.s > 0 ? Math.round(a.tl / a.s) : 0;
      if (a.mn2 === Infinity) a.mn2 = 0;
    }
    return m;
  }, [perf]);
  const recId = useMemo(() => {
    let b: string | null = null,
      bs = -1;
    for (const [id, a] of Object.entries(agg)) {
      if (!a.sr) continue;
      const s = a.sr * 10 - a.al * 0.01;
      if (s > bs) {
        bs = s;
        b = id;
      }
    }
    return b;
  }, [agg]);

  useEffect(() => {
    mRef.current = true;
    return () => {
      mRef.current = false;
      abRef.current = true;
      if (tmRef.current) clearTimeout(tmRef.current);
    };
  }, []);
  useEffect(() => {
    if (!showSettings) {
      abRef.current = true;
      if (tmRef.current) clearTimeout(tmRef.current);
    }
  }, [showSettings]);
  // Refresh perf data when switching to perf tab (picks up heartbeat records)
  useEffect(() => {
    if (tab === "perf") {
      setPerf(ldPerf());
    }
  }, [tab]);
  useEffect(() => {
    for (const [mid, r] of Object.entries(testRes)) {
      const m = models.find((x) => x.id === mid);
      if (!m || !r.timestamp) continue;
      if (!perf.find((p) => p.timestamp === r.timestamp && p.modelId === mid)) {
        svPerf({
          modelId: mid,
          modelName: m.name,
          providerId: m.providerId,
          latencyMs: r.latencyMs,
          success: r.success,
          timestamp: r.timestamp,
        });
        setPerf(ldPerf());
      }
    }
  }, [testRes, models]);

  const doTest = async (model: AIModel) => {
    if (testId) return;
    setTestId(model.id);
    let tp: import("./LLMService").ProviderConfig | undefined;
    if (model.providerId === "custom" && model.endpoint) {
      const ep = model.endpoint,
        isOl =
          /\/api\/(chat|generate)\/?$/i.test(ep) || /localhost:11434/i.test(ep);
      const base = ep
        .replace(/\/api\/(chat|generate)\/?$/i, "")
        .replace(/\/chat\/completions\/?$/i, "")
        .replace(/\/v1\/?$/, "");
      tp = {
        id: isOl ? "ollama" : "custom",
        name: model.provider || "Custom",
        nameEn: "Custom",
        baseUrl: base,
        authType: model.apiKey ? "bearer" : isOl ? "none" : "bearer",
        isLocal: isOl,
        detected: true,
        description: "",
        docsUrl: "",
        models: [],
      };
    } else {
      tp = providers.find((p) => p.id === model.providerId);
      if (tp && model.providerId === "ollama" && model.endpoint) {
        const b = model.endpoint.replace(/\/api\/(chat|generate)\/?$/i, "");
        if (b && b !== tp.baseUrl) tp = { ...tp, baseUrl: b };
      }
    }
    if (!tp) {
      setTestRes((p) => ({
        ...p,
        [model.id]: {
          success: false,
          latencyMs: 0,
          modelId: model.modelId,
          providerId: model.providerId,
          error: "No provider",
          errorCode: "NO_PROVIDER",
          timestamp: Date.now(),
        },
      }));
      setTestId(null);
      return;
    }
    try {
      const r = await testModelConnectivity(tp, model.modelId);
      if (mRef.current) setTestRes((p) => ({ ...p, [model.id]: r }));
    } catch (e: any) {
      if (mRef.current)
        setTestRes((p) => ({
          ...p,
          [model.id]: {
            success: false,
            latencyMs: 0,
            modelId: model.modelId,
            providerId: model.providerId,
            error: e.message || "Error",
            errorCode: "UNKNOWN",
            timestamp: Date.now(),
          },
        }));
    } finally {
      if (mRef.current) setTestId(null);
    }
  };

  const drip = (
    list: OllamaDetectedModel[],
    conn: boolean,
    dl: number,
    ch: boolean,
  ) => {
    let i = 0;
    const nx = () => {
      if (!mRef.current || abRef.current) return;
      if (i < list.length) {
        if (list[i]) setOlModels((p) => [...p, list[i]]);
        i++;
        tmRef.current = setTimeout(nx, dl);
      } else {
        tmRef.current = null;
        if (mRef.current) {
          setOlScan(false);
          setOlConn(conn);
          if (ch && conn && list.length > 0) writeOC(olHost, list);
        }
      }
    };
    list.length === 0
      ? mRef.current && (setOlScan(false), setOlConn(conn))
      : nx();
  };
  const doScan = (force = false) => {
    abRef.current = true;
    if (tmRef.current) clearTimeout(tmRef.current);
    setTimeout(() => {
      if (!mRef.current) return;
      abRef.current = false;
      setCache(false);
      setCacheTs(null);
      setOlScan(true);
      setOlModels([]);
      setOlConn(false);
      if (!force) {
        const c = readOC(olHost);
        if (c?.models?.length) {
          setCache(true);
          setCacheTs(c.timestamp);
          drip(c.models, true, 80, false);
          return;
        }
      }
      fetch(`${olHost.replace(/\/+$/, "")  }/api/tags`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((d) => {
          if (!mRef.current || abRef.current) return;
          drip(
            (d.models || []).map((m: any) => ({
              name: m.name || m.model,
              size: m.size ? `${(m.size / 1e9).toFixed(1)  } GB` : "N/A",
              status: "online" as const,
              quantization: m.details?.quantization_level || "N/A",
            })),
            true,
            200,
            true,
          );
        })
        .catch(() => {
          if (mRef.current && !abRef.current)
            drip([...SIM_MODELS], false, 400, false);
        });
    }, 30);
  };

  if (!showSettings) return null;
  const ac = models.filter((m) => m.status === "active").length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => setShowSettings(false)}
      />
      <div
        className="relative w-[720px] h-[85vh] bg-[#13141c] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06), 0 25px 60px -12px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90">AI 模型管理</div>
            <div className="text-[11px] text-white/30">
              配置模型 · 性能对比 · 使用统计
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0">
          {[
            { k: "models" as const, l: "模型列表", i: Bot },
            { k: "ollama" as const, l: "Ollama", i: Server },
            { k: "perf" as const, l: "性能对比", i: Activity },
            { k: "usage" as const, l: "使用统计", i: BarChart3 },
          ].map(({ k, l, i: Ic }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[12px] border-b-2 ${tab === k ? "text-indigo-400 border-indigo-400 bg-indigo-500/[0.05]" : "text-white/30 border-transparent hover:text-white/50"}`}
            >
              <Ic className="w-3.5 h-3.5" />
              {l}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {tab === "models" && (
            <ModelsTab
              models={models}
              activeModelId={activeModelId}
              editId={editId}
              setEditId={setEditId}
              editForm={editForm}
              setEditForm={setEditForm}
              showAdd={showAdd}
              setShowAdd={setShowAdd}
              nm={nm}
              setNm={setNm}
              showKeys={showKeys}
              setShowKeys={setShowKeys}
              testId={testId}
              testRes={testRes}
              doTest={doTest}
              setActiveModelId={setActiveModelId}
              handleStartEdit={(m: AIModel) => {
                setEditId(m.id);
                setEditForm({ ...m });
              }}
              handleSaveEdit={() => {
                if (editId && editForm) {
                  editId.startsWith("custom::")
                    ? updateCustomModel(editId, editForm)
                    : updateModel(editId, editForm);
                  if (
                    editForm.apiKey !== undefined &&
                    !editId.startsWith("custom::") &&
                    editForm.providerId
                  )
                    setProviderApiKey(
                      editForm.providerId,
                      editForm.apiKey || "",
                    );
                  setEditId(null);
                  setEditForm({});
                }
              }}
              handleAddModel={() => {
                if (nm.name && nm.endpoint) {
                  addCustomModel(
                    nm.name,
                    nm.provider,
                    nm.endpoint,
                    nm.apiKey || undefined,
                  );
                  setNm({
                    name: "",
                    provider: "custom",
                    endpoint: "",
                    apiKey: "",
                  });
                  setShowAdd(false);
                }
              }}
              removeModel={removeModel}
              getProviderApiKey={getProviderApiKey}
            />
          )}
          {tab === "ollama" && (
            <OllamaTab
              olScan={olScan}
              olModels={olModels}
              olHost={olHost}
              setOlHost={setOlHost}
              olConn={olConn}
              doScan={doScan}
              models={models}
              addCustomModel={addCustomModel}
              cache={cache}
              cacheTs={cacheTs}
            />
          )}
          {tab === "perf" && (
            <PerfTab
              perf={perf}
              setPerf={setPerf}
              agg={agg}
              recId={recId}
              activeModelId={activeModelId}
              setActiveModelId={setActiveModelId}
            />
          )}
          {tab === "usage" && <UsageTab usage={usage} />}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <span className="text-[10px] text-white/20">
            共 {models.length} 个模型 · {ac} 激活
            {perf.length > 0 && ` · ${perf.length} 条性能记录`}
          </span>
          <button
            onClick={() => setShowSettings(false)}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1]"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function ModelsTab({
  models,
  activeModelId,
  editId,
  setEditId,
  editForm,
  setEditForm,
  showAdd,
  setShowAdd,
  nm,
  setNm,
  showKeys,
  setShowKeys,
  testId,
  testRes,
  doTest,
  setActiveModelId,
  handleStartEdit,
  handleSaveEdit,
  handleAddModel,
  removeModel,
  getProviderApiKey,
}: any) {
  return (
    <div className="space-y-3">
      {activeModelId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/[0.06] border border-indigo-500/15 mb-4">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-indigo-300">
            当前: {models.find((m: any) => m.id === activeModelId)?.name || "?"}
          </span>
        </div>
      )}
      {models.map((model: any) => {
        const pId = model.providerId || "custom",
          PI = pIcons[pId] || Bot,
          cc = pColors[pId] || pColors.custom,
          isEd = editId === model.id,
          isAct = model.id === activeModelId,
          mak = model.apiKey || getProviderApiKey(model.providerId);
        return (
          <div
            key={model.id}
            className={`rounded-xl border ${isAct ? "border-indigo-500/30 bg-[#1a1b2e]/80" : "border-white/[0.06] bg-white/[0.02]"}`}
          >
            <div className="p-4">
              {isEd ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/30 mb-1 block">
                        名称
                      </label>
                      <input
                        value={editForm.name || ""}
                        onChange={(e: any) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 mb-1 block">
                        端点
                      </label>
                      <input
                        value={editForm.endpoint || ""}
                        onChange={(e: any) =>
                          setEditForm({ ...editForm, endpoint: e.target.value })
                        }
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[11px]"
                    >
                      <Check className="w-3 h-3 inline mr-1" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditId(null);
                        setEditForm({});
                      }}
                      className="px-3 py-1.5 text-white/40 text-[11px]"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center ${cc}`}
                    >
                      <PI className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-white/85">
                          {model.name}
                        </span>
                        {isAct && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
                            激活
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/25 font-mono truncate mt-0.5">
                        {model.endpoint}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isAct && (
                        <button
                          onClick={() => setActiveModelId(model.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] text-white/40 hover:text-indigo-400"
                        >
                          激活
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(model)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-white/60"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeModel(model.id)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pl-11">
                    <span className="text-[10px] text-white/20">Key:</span>
                    {mak ? (
                      <span className="text-[10px] text-white/30 font-mono">
                        {showKeys[model.id] ? mak : "••••••"}
                        <button
                          onClick={() =>
                            setShowKeys((p: any) => ({
                              ...p,
                              [model.id]: !p[model.id],
                            }))
                          }
                          className="p-0.5 ml-1 text-white/15"
                        >
                          {showKeys[model.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </span>
                    ) : model.providerId === "ollama" ||
                      /localhost:11434/i.test(model.endpoint || "") ? (
                      <span className="text-[10px] text-emerald-400/50">
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        无需
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/50">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        未配置
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 pl-11">
                    <span className="text-[10px] text-white/20">连接:</span>
                    {testId === model.id ? (
                      <span className="text-[10px] text-white/30">
                        <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                        测试中
                      </span>
                    ) : (
                      <button
                        onClick={() => doTest(model)}
                        className="px-2 py-0.5 rounded text-[9px] text-cyan-400/60 hover:text-cyan-400 border border-cyan-500/10"
                      >
                        <RefreshCw className="w-3 h-3 inline mr-1" />
                        测试
                      </button>
                    )}
                    {testRes[model.id] && (
                      <span className="text-[10px] text-white/30">
                        {testRes[model.id].success ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400/60 inline mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-400/60 inline mr-1" />
                        )}
                        {testRes[model.id].success ? "OK" : "Fail"}
                        {testRes[model.id].latencyMs > 0 &&
                          ` ${testRes[model.id].latencyMs}ms`}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
      {showAdd ? (
        <div className="rounded-xl border border-dashed border-indigo-500/20 bg-indigo-500/[0.03] p-4 space-y-2">
          <input
            value={nm.name}
            onChange={(e: any) => setNm({ ...nm, name: e.target.value })}
            placeholder="模型名"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder:text-white/15 focus:outline-none"
          />
          <input
            value={nm.endpoint}
            onChange={(e: any) => setNm({ ...nm, endpoint: e.target.value })}
            placeholder="端点 URL"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder:text-white/15 focus:outline-none font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddModel}
              disabled={!nm.name || !nm.endpoint}
              className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-[11px] disabled:opacity-30"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              添加
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-white/40 text-[11px]"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/[0.08] text-white/25 hover:text-white/50 text-[12px]"
        >
          <Plus className="w-4 h-4" />
          添加自定义模型
        </button>
      )}
    </div>
  );
}

function OllamaTab({
  olScan,
  olModels,
  olHost,
  setOlHost,
  olConn,
  doScan,
  models,
  addCustomModel,
  cache,
  cacheTs,
}: any) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-orange-400" />
          <span className="text-[12px] text-white/70">Ollama 端点</span>
          <div
            className={`ml-auto text-[10px] ${olConn ? "text-emerald-400" : "text-white/25"}`}
          >
            {olConn ? "已连接" : "未连接"}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={olHost}
            onChange={(e: any) => setOlHost(e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 font-mono focus:outline-none"
          />
          <button
            onClick={() => doScan()}
            disabled={olScan}
            className="px-4 py-2 rounded-lg bg-orange-500/15 text-orange-400 text-[11px] disabled:opacity-50 border border-orange-500/20"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 inline mr-1 ${olScan ? "animate-spin" : ""}`}
            />
            {olScan ? "扫描中" : "检测"}
          </button>
        </div>
      </div>
      {olModels.length > 0 && (
        <div className="space-y-2">
          {olModels.map((m: any) => {
            const imp = models.some(
              (x: any) => x.name === m.name && x.providerId === "ollama",
            );
            return (
              <div
                key={m.name}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div
                  className={`w-2 h-2 rounded-full ${m.status === "online" ? "bg-emerald-400" : "bg-white/15"}`}
                />
                <div className="flex-1">
                  <div className="text-[12px] text-white/70">{m.name}</div>
                  <div className="text-[10px] text-white/25">{m.size}</div>
                </div>
                {imp ? (
                  <span className="text-[10px] text-white/20">
                    <Check className="w-3 h-3 inline" />
                    已导入
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      addCustomModel(m.name, "ollama", `${olHost  }/api/chat`, "")
                    }
                    disabled={m.status === "offline"}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] disabled:opacity-30 border border-orange-500/20"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    导入
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {olModels.length === 0 && !olScan && (
        <div className="text-center py-12">
          <Server className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-[12px] text-white/25">尚未检测</p>
        </div>
      )}
      {cache && cacheTs !== null && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/10">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400/60" />
          <span className="text-[10px] text-cyan-400/50 flex-1">
            缓存 · {fmtAge(cacheTs)}
          </span>
          <button
            onClick={() => doScan(true)}
            className="text-[9px] text-cyan-400/60 px-2 py-0.5 rounded border border-cyan-500/10"
          >
            刷新
          </button>
        </div>
      )}
    </div>
  );
}

function PerfTab({
  perf,
  setPerf,
  agg,
  recId,
  activeModelId,
  setActiveModelId,
}: any) {
  // 构建趋势折线图数据: 按时间排序, 每个时间点一行, 各模型延迟为列
  const chartData = useMemo(() => {
    const successRecords = (perf as PR[]).filter(
      (r) => r.success && r.latencyMs > 0,
    );
    if (successRecords.length === 0) return [];
    const sorted = [...successRecords].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    return sorted.map((r, idx) => ({
      idx: idx + 1,
      time: new Date(r.timestamp).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      [r.modelName]: r.latencyMs,
      _model: r.modelName,
      _ms: r.latencyMs,
    }));
  }, [perf]);

  // 提取所有模型名(用于渲染多条线)
  const modelNames = useMemo(() => {
    const names = new Set<string>();
    for (const r of perf as PR[]) {
      if (r.success && r.latencyMs > 0) names.add(r.modelName);
    }
    return Array.from(names);
  }, [perf]);

  // 为多模型合并数据点
  const mergedChartData = useMemo(() => {
    if (chartData.length === 0) return [];
    const allPoints: Record<string, any>[] = [];
    for (const pt of chartData) {
      const entry: Record<string, any> = { idx: pt.idx, time: pt.time };
      entry[pt._model as string] = pt._ms;
      allPoints.push(entry);
    }
    return allPoints;
  }, [chartData]);

  // Recharts 颜色池
  const CHART_COLORS = [
    "#818cf8",
    "#34d399",
    "#f59e0b",
    "#38bdf8",
    "#f472b6",
    "#a78bfa",
    "#fb923c",
    "#22d3ee",
  ];

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-[#1a1b2e] border border-white/[0.1] rounded-lg px-3 py-2 shadow-xl">
        <div className="text-[10px] text-white/40 mb-1">#{label}</div>
        {payload.map(
          (p: any, i: number) =>
            p.value != null && (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-white/60">{p.dataKey}</span>
                <span className="text-white/90 ml-auto font-mono">
                  {p.value}ms
                </span>
              </div>
            ),
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {recId && agg[recId] && (
        <div className="rounded-xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.06] to-cyan-500/[0.03] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-[12px] text-emerald-400/80">AI 推荐</span>
          </div>
          <div className="flex items-center gap-3 pl-6 flex-wrap">
            <span className="text-[13px] text-white/70">{agg[recId].mn}</span>
            <span className="text-[10px] text-emerald-400/50">
              {agg[recId].al}ms · {agg[recId].sr}%
            </span>
            {recId !== activeModelId && (
              <button
                onClick={() => setActiveModelId(recId)}
                className="ml-auto px-2.5 py-1 rounded-lg text-[10px] text-emerald-400 border border-emerald-500/15"
              >
                <ArrowRight className="w-3 h-3 inline mr-1" />
                切换
              </button>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            l: "总测试",
            v: String(perf.length),
            i: Activity,
            c: "text-cyan-400",
          },
          {
            l: "成功",
            v: String(perf.filter((r: PR) => r.success).length),
            i: CheckCircle2,
            c: "text-emerald-400",
          },
          {
            l: "失败",
            v: String(perf.filter((r: PR) => !r.success).length),
            i: XCircle,
            c: "text-red-400",
          },
          {
            l: "平均延迟",
            v: (() => {
              const s = perf.filter((r: PR) => r.success);
              return s.length
                ? `${Math.round(
                    s.reduce((a: number, b: PR) => a + b.latencyMs, 0) /
                      s.length,
                  )  }ms`
                : "-";
            })(),
            i: Clock,
            c: "text-amber-400",
          },
        ].map((c: any) => (
          <div
            key={c.l}
            className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center"
          >
            <c.i className={`w-4 h-4 ${c.c} mx-auto mb-1`} />
            <div className={`text-[16px] ${c.c}`}>{c.v}</div>
            <div className="text-[9px] text-white/20 mt-0.5">{c.l}</div>
          </div>
        ))}
      </div>

      {/* ── Recharts 延迟趋势折线图 ── */}
      {mergedChartData.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-white/30 uppercase tracking-wider">
              延迟趋势
            </span>
            <span className="text-[9px] text-white/15 ml-auto">
              {mergedChartData.length} 个数据点
            </span>
          </div>
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mergedChartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <defs>
                  {modelNames.map((mn, i) => (
                    <linearGradient
                      key={mn}
                      id={`grad_${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="idx"
                  tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)  }s` : `${v  }ms`
                  }
                />
                <RTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                    paddingTop: 4,
                  }}
                  iconType="circle"
                  iconSize={6}
                />
                {modelNames.map((mn, i) => (
                  <Area
                    key={mn}
                    type="monotone"
                    dataKey={mn}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    fill={`url(#grad_${i})`}
                    strokeWidth={1.5}
                    dot={{
                      r: 2,
                      fill: CHART_COLORS[i % CHART_COLORS.length],
                      strokeWidth: 0,
                    }}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#1a1b2e" }}
                    connectNulls={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[10px] text-white/30 uppercase tracking-wider">
          性能排行
        </div>
        {Object.entries(agg)
          .sort(([, a]: any, [, b]: any) => b.sr - a.sr || a.al - b.al)
          .map(([mid, a]: any) => {
            const ia = mid === activeModelId,
              ir = mid === recId,
              PI = pIcons[a.pi] || Bot,
              pc = pColors[a.pi] || pColors.custom;
            return (
              <div
                key={mid}
                className={`flex items-center gap-3 p-3 rounded-xl border ${ir ? "border-emerald-500/20 bg-emerald-500/[0.04]" : ia ? "border-indigo-500/20 bg-indigo-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center ${pc}`}
                >
                  <PI className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-white/70">{a.mn}</span>
                    {ir && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        推荐
                      </span>
                    )}
                    {ia && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
                        使用中
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-white/20">
                    {a.t} 次 · 最小 {a.mn2}ms · 最大 {a.mx}ms
                  </div>
                </div>
                <div className="w-24 space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400/60"
                        style={{ width: `${a.sr  }%` }}
                      />
                    </div>
                    <span className="text-[9px] text-emerald-400/50 w-8 text-right">
                      {a.sr}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400/50"
                        style={{
                          width: `${Math.min(100, (a.al / 5000) * 100)  }%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-amber-400/40 w-8 text-right">
                      {a.al}ms
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        {Object.keys(agg).length === 0 && (
          <div className="py-12 text-center">
            <Activity className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-[12px] text-white/25">暂无数据</p>
            <p className="text-[10px] text-white/15">测试连接后自动记录</p>
          </div>
        )}
      </div>
      {perf.length > 0 && (
        <button
          onClick={() => {
            localStorage.removeItem(PK);
            setPerf([]);
          }}
          className="px-3 py-1.5 rounded-lg text-[10px] text-white/20 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.04]"
        >
          <Trash2 className="w-3 h-3 inline mr-1" />
          清除 ({perf.length})
        </button>
      )}
    </div>
  );
}

function UsageTab({ usage }: any) {
  const td = Object.values(usage) as UR[],
    tm = td.reduce((s, u) => s + u.messageCount, 0),
    tt = td.reduce((s, u) => s + u.estimatedTokens, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "总消息", v: String(tm), i: BarChart3, c: "text-indigo-400" },
          {
            l: "Tokens",
            v: tt > 1000 ? `${(tt / 1000).toFixed(1)  }K` : String(tt),
            i: Zap,
            c: "text-amber-400",
          },
          {
            l: "模型数",
            v: String(Object.keys(usage).length),
            i: Bot,
            c: "text-cyan-400",
          },
        ].map((c: any) => (
          <div
            key={c.l}
            className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center"
          >
            <c.i className={`w-4 h-4 ${c.c} mx-auto mb-1`} />
            <div className={`text-[14px] ${c.c}`}>{c.v}</div>
            <div className="text-[9px] text-white/20 mt-0.5">{c.l}</div>
          </div>
        ))}
      </div>
      {Object.entries(usage).length === 0 ? (
        <div className="py-12 text-center">
          <BarChart3 className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-[12px] text-white/25">暂无使用统计</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">
            使用详情
          </div>
          {Object.entries(usage)
            .sort(([, a]: any, [, b]: any) => b.messageCount - a.messageCount)
            .map(([mid, u]: any) => {
              const PI = pIcons[u.providerId] || Bot,
                pc = pColors[u.providerId] || pColors.custom,
                mx = Math.max(
                  ...(Object.values(usage) as UR[]).map((x) => x.messageCount),
                  1,
                );
              return (
                <div
                  key={mid}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center ${pc}`}
                  >
                    <PI className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[12px] text-white/70">
                      {u.modelName}
                    </span>
                    <div className="mt-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400/50"
                        style={{ width: `${(u.messageCount / mx) * 100  }%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-white/50">
                      {u.messageCount} 条
                    </div>
                    <div className="text-[9px] text-white/20">
                      ~
                      {u.estimatedTokens > 1000
                        ? `${(u.estimatedTokens / 1000).toFixed(1)  }K`
                        : u.estimatedTokens}{" "}
                      tokens
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
