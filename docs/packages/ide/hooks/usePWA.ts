import { createLogger } from "./utils/logger";
const log = createLogger("usePWA");
/**
 * @file usePWA.ts
 * @description PWA 安装和使用 Hook - 支持安装提示、离线检测、更新通知
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags pwa,install,offline,hook
 */

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  promptEvent: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    updateAvailable: false,
    promptEvent: null,
  });

  // 监听安装提示
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      log.info('beforeinstallprompt event fired');
      
      setState((prev) => ({
        ...prev,
        isInstallable: true,
        promptEvent: e as BeforeInstallPromptEvent,
      }));
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // 监听安装成功
  useEffect(() => {
    const handleAppInstalled = () => {
      log.info('app installed');
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        promptEvent: null,
      }));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      log.info('online');
      setState((prev) => ({
        ...prev,
        isOnline: true,
        isOffline: false,
      }));
    };

    const handleOffline = () => {
      log.info('offline');
      setState((prev) => ({
        ...prev,
        isOnline: false,
        isOffline: true,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 监听 Service Worker 更新
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                log.info('new version available');
                setState((prev) => ({
                  ...prev,
                  updateAvailable: true,
                }));
              }
            });
          }
        });
      });
    }
  }, []);

  // 安装 PWA
  const install = useCallback(async () => {
    if (!state.promptEvent) {
      log.info('no install prompt available');
      return false;
    }

    try {
      await state.promptEvent.prompt();
      const { outcome } = await state.promptEvent.userChoice;
      log.info('install outcome:', outcome);
      
      setState((prev) => ({
        ...prev,
        promptEvent: null,
        isInstallable: false,
      }));
      
      return outcome === "accepted";
    } catch (err) {
      log.error('install error:', err);
      return false;
    }
  }, [state.promptEvent]);

  // 更新 Service Worker
  const update = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        return true;
      }
    }
    return false;
  }, []);

  // 注册 Service Worker
  const registerServiceWorker = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        log.info('Service Worker registered:', registration.scope);
        return true;
      } catch (err) {
        log.error('Service Worker registration failed:', err);
        return false;
      }
    }
    return false;
  }, []);

  // 取消安装提示
  const clearPrompt = useCallback(() => {
    setState((prev) => ({
      ...prev,
      promptEvent: null,
      isInstallable: false,
    }));
  }, []);

  return {
    ...state,
    install,
    update,
    registerServiceWorker,
    clearPrompt,
  };
}

export default usePWA;
