/**
 * @file MonacoWorkerManager.ts
 * @description Monaco Editor Worker 按需加载管理器
 *              仅在需要时加载对应的语言Worker，减少首屏加载资源
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags monaco,worker,lazy-load,optimization
 */

import { createLogger } from "./utils/logger";
const log = createLogger("MonacoWorker");

/**
 * 语言Worker类型定义
 */
type WorkerLabel = 'json' | 'css' | 'scss' | 'less' | 'html' | 'handlebars' | 'razor' | 'typescript' | 'javascript' | 'default';

/**
 * Worker缓存
 */
const workerCache = new Map<string, Worker>();

/**
 * 已加载的Worker集合
 */
const loadedWorkers = new Set<string>();

/**
 * 语言Worker加载器映射
 */
const workerLoaders: Partial<Record<WorkerLabel, () => Promise<Worker>>> = {
  json: async () => {
    const worker = new Worker(
      new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerCache.set('json', worker);
    loadedWorkers.add('json');
    return worker;
  },

  css: async () => {
    const worker = new Worker(
      new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerCache.set('css', worker);
    workerCache.set('scss', worker);
    workerCache.set('less', worker);
    loadedWorkers.add('css');
    loadedWorkers.add('scss');
    loadedWorkers.add('less');
    return worker;
  },

  html: async () => {
    const worker = new Worker(
      new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerCache.set('html', worker);
    workerCache.set('handlebars', worker);
    workerCache.set('razor', worker);
    loadedWorkers.add('html');
    loadedWorkers.add('handlebars');
    loadedWorkers.add('razor');
    return worker;
  },

  typescript: async () => {
    const worker = new Worker(
      new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerCache.set('typescript', worker);
    workerCache.set('javascript', worker);
    loadedWorkers.add('typescript');
    loadedWorkers.add('javascript');
    return worker;
  },
};

/**
 * 默认Editor Worker
 */
let defaultWorker: Worker | null = null;

/**
 * 获取默认Editor Worker
 */
const getDefaultWorker = (): Worker => {
  if (!defaultWorker) {
    defaultWorker = new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
      { type: 'module' }
    );
  }
  return defaultWorker;
};

/**
 * 按需加载Worker
 * @param label 语言标签
 * @returns Promise<Worker>
 */
export async function getWorker(label: string): Promise<Worker> {
  // 检查缓存
  if (workerCache.has(label)) {
    return workerCache.get(label)!;
  }

  // 映射语言标签到Worker标签
  const workerLabel = mapToWorkerLabel(label);

  // 检查是否已加载
  if (loadedWorkers.has(label)) {
    return workerCache.get(label) || getDefaultWorker();
  }

  // 加载对应的Worker
  const loader = workerLoaders[workerLabel];
  if (loader) {
    log.info(`Loading worker for: ${label}`);
    return await loader();
  }

  // 返回默认Worker
  log.info(`Using default worker for: ${label}`);
  return getDefaultWorker();
}

/**
 * 语言标签映射到Worker标签
 */
function mapToWorkerLabel(label: string): WorkerLabel {
  const labelMap: Record<string, WorkerLabel> = {
    'json': 'json',
    'css': 'css',
    'scss': 'css',
    'less': 'css',
    'html': 'html',
    'handlebars': 'html',
    'razor': 'html',
    'typescript': 'typescript',
    'javascript': 'typescript',
    'jsx': 'typescript',
    'tsx': 'typescript',
  };

  return labelMap[label] || 'default';
}

/**
 * 预加载常用Worker
 * 用于预加载用户最可能使用的语言Worker
 */
export async function preloadCommonWorkers(): Promise<void> {
  // 预加载TypeScript/JavaScript Worker（最常用）
  await getWorker('typescript');
  log.info('[MonacoWorker] Preloaded TypeScript/JavaScript worker');
}

/**
 * 获取已加载的Worker统计信息
 */
export function getWorkerStats() {
  return {
    loaded: Array.from(loadedWorkers),
    cached: Array.from(workerCache.keys()),
    totalLoaded: loadedWorkers.size,
    totalCached: workerCache.size,
  };
}

/**
 * 清理所有Worker缓存
 */
export function cleanupWorkers(): void {
  workerCache.forEach((worker) => worker.terminate());
  workerCache.clear();
  loadedWorkers.clear();
  if (defaultWorker) {
    defaultWorker.terminate();
    defaultWorker = null;
  }
  log.info('[MonacoWorker] All workers cleaned up');
}

/**
 * 配置Monaco Environment使用按需加载
 */
export function configureMonacoEnvironment(): void {
  if (typeof window !== 'undefined') {
    (window as any).MonacoEnvironment = {
      getWorker: async function (_workerId: string, label: string) {
        return await getWorker(label);
      },
    };
    log.info('[MonacoWorker] Environment configured for lazy loading');
  }
}
