/**
 * @file left-panel/ConnectivityIndicator.tsx
 * @description 模型连通性指示器子组件 — 实时 Ping 测试、延迟显示、
 *              连接详情面板、当前文件路径指示
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags left-panel,connectivity,ping,status
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { testModelConnectivity, type ProviderConfig } from "../LLMService";

// ── Types ──

export interface ConnectivityModel {
  id: string;
  name: string;
  status: string;
  provider: string;
  modelId: string;
}

export interface ConnectivityResult {
  status: "idle" | "testing" | "success" | "fail";
  latencyMs: number | null;
  error: string | null;
  timestamp: number;
}

export interface ConnectivityIndicatorProps {
  activeModel: ConnectivityModel | null;
  activeModelId: string | null;
  globalConn: ConnectivityResult | undefined;
  getActiveProvider: () => ProviderConfig | undefined;
  setConnectivityResult: (modelId: string, result: ConnectivityResult) => void;
}

export default function ConnectivityIndicator({
  activeModel,
  activeModelId,
  activeFile,
  globalConn,
  getActiveProvider,
  setConnectivityResult,
}: ConnectivityIndicatorProps) {
  const [connStatus, setConnStatus] = useState<
    "idle" | "testing" | "success" | "fail"
  >("idle");
  const [connLatency, setConnLatency] = useState<number | null>(null);
  const [connError, setConnError] = useState<string | null>(null);
  const [showConnDetail, setShowConnDetail] = useState(false);
  const connMountedRef = useRef(true);

  useEffect(() => {
    connMountedRef.current = true;
    return () => {
      connMountedRef.current = false;
    };
  }, []);

  // Sync from global connectivity state on model change
  useEffect(() => {
    if (globalConn) {
      setConnStatus(globalConn.status);
      setConnLatency(globalConn.latencyMs);
      setConnError(globalConn.error);
    } else {
      setConnStatus("idle");
      setConnLatency(null);
      setConnError(null);
    }
    setShowConnDetail(false);
  }, [activeModelId, globalConn]);

  // Handle connectivity test
  const handleConnTest = useCallback(async () => {
    if (connStatus === "testing" || !activeModel) return;
    const provider = getActiveProvider();
    if (!provider) {
      const result: ConnectivityResult = {
        status: "fail",
        latencyMs: null,
        error: "找不��提供商配置",
        timestamp: Date.now(),
      };
      setConnStatus("fail");
      setConnError("找不到提供商配置");
      setConnectivityResult(activeModel.id, result);
      return;
    }
    setConnStatus("testing");
    setConnError(null);
    setConnLatency(null);
    setConnectivityResult(activeModel.id, {
      status: "testing",
      latencyMs: null,
      error: null,
      timestamp: Date.now(),
    });
    try {
      const result = await testModelConnectivity(provider, activeModel.modelId);
      if (!connMountedRef.current) return;
      if (result.success) {
        setConnStatus("success");
        setConnLatency(result.latencyMs);
        setConnError(null);
        setConnectivityResult(activeModel.id, {
          status: "success",
          latencyMs: result.latencyMs,
          error: null,
          timestamp: Date.now(),
        });
      } else {
        setConnStatus("fail");
        setConnLatency(result.latencyMs);
        setConnError(result.error || "未知错误");
        setConnectivityResult(activeModel.id, {
          status: "fail",
          latencyMs: result.latencyMs,
          error: result.error || "未知错误",
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      if (!connMountedRef.current) return;
      setConnStatus("fail");
      setConnError(err.message || "测试异常");
      setConnectivityResult(activeModel.id, {
        status: "fail",
        latencyMs: null,
        error: err.message || "测试异常",
        timestamp: Date.now(),
      });
    }
  }, [connStatus, activeModel, getActiveProvider, setConnectivityResult]);

  return (
    <div className="flex items-center gap-1">
      {/* Connectivity status indicator - simplified to icon only */}
      {activeModel ? (
        <button
          onClick={handleConnTest}
          disabled={connStatus === "testing"}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
            connStatus === "testing"
              ? "cursor-wait"
              : "hover:bg-white/[0.08]"
          }`}
          title={connStatus === "testing"
            ? "测试中..."
            : connStatus === "success"
              ? "已连通"
              : connStatus === "fail"
                ? "连接失败"
                : "测试连通性"}
        >
          {connStatus === "testing" ? (
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
          ) : connStatus === "success" ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : connStatus === "fail" ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-slate-600" />
          )}
        </button>
      ) : (
        <WifiOff className="w-4 h-4 text-slate-600" />
      )}
    </div>
  );
}
