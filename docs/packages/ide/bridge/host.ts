import { createLogger } from "./utils/logger";
const log = createLogger("host");
/**
 * @file host.ts
 * @description 宿主机桥接层 - 统一的文件系统接口，内部自行决定是 IndexedDB 还是原生文件系统
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags bridge,host,filesystem,tauri,indexeddb
 */

// Tauri API (如果可用)
let tauriApi: any = null;
let fsApi: any = null;
let dialogApi: any = null;

try {
  tauriApi = require("@tauri-apps/api/tauri");
  fsApi = require("@tauri-apps/api/fs");
  dialogApi = require("@tauri-apps/api/dialog");
} catch (e) {
  log.info("Tauri API not available, using IndexedDB fallback");
}

// IndexedDB Adapter
import {
  saveFile as saveFileToIndexedDB,
  readFile as readFileFromIndexedDB,
  deleteFile as deleteFileFromIndexedDB,
} from "./adapters/IndexedDBAdapter";

export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  modified: number;
  isFile: boolean;
  isDir: boolean;
}

export interface FileWatcherEvent {
  path: string;
  type: "created" | "modified" | "deleted";
  timestamp: number;
}

export interface FileWatcherCallback {
  (event: FileWatcherEvent): void;
}

export interface FileWatcherHandle {
  unwatch: () => Promise<void>;
}

export interface DialogResult {
  path: string | null;
  paths: string[] | null;
}

export interface DialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  multiple?: boolean;
  directory?: boolean;
}

/**
 * 统一的宿主机桥接层
 * 自动检测环境并选择合适的存储后端
 */
export const HostBridge = {
  /** 检测是否在 Tauri 环境中 */
  isTauri(): boolean {
    return !!window.__TAURI__ && tauriApi && fsApi && dialogApi;
  },

  /** 读取用户选定的文件 */
  async pickAndReadFile(): Promise<{ path: string; content: string }> {
    if (this.isTauri()) {
      // 使用 Tauri 原生文件选择
      const path = await dialogApi.open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: "Text Files",
            extensions: ["txt", "md", "json", "ts", "tsx", "js", "jsx"],
          },
          {
            name: "All Files",
            extensions: ["*"],
          },
        ],
      });

      if (!path) {
        throw new Error("User cancelled file picking");
      }

      const content = await fsApi.readTextFile(path as string);
      return { path: path as string, content };
    } else {
      // Web 环境：使用文件输入
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt,.md,.json,.ts,.tsx,.js,.jsx";

        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error("No file selected"));
            return;
          }

          const content = await file.text();
          resolve({ path: file.name, content });
        };

        input.click();
      });
    }
  },

  /** 读取文件内容 (优先 IndexedDB，可选原生) */
  async readFile(path: string, useNative: boolean = false): Promise<string> {
    if (useNative && this.isTauri()) {
      // 使用 Tauri 原生读取
      return await fsApi.readTextFile(path);
    } else {
      // 使用 IndexedDB
      const projectId = "default";
      return await readFileFromIndexedDB(projectId, path);
    }
  },

  /** 写入文件到用户指定目录 */
  async writeFile(
    filename: string,
    data: Uint8Array | string
  ): Promise<string> {
    if (this.isTauri()) {
      // 使用 Tauri 原生保存
      const savePath = await dialogApi.save({
        defaultPath: filename,
        filters: [
          {
            name: "Text Files",
            extensions: ["txt", "md", "json", "ts", "tsx"],
          },
        ],
      });

      if (!savePath) {
        throw new Error("User cancelled save dialog");
      }

      await fsApi.writeFile(savePath as string, data);
      return savePath as string;
    } else {
      // Web 环境：下载到本地
      const blob =
        typeof data === "string"
          ? new Blob([data], { type: "text/plain" })
          : new Blob([data], { type: "application/octet-stream" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return filename;
    }
  },

  /** 读取目录内容 */
  async readDir(path: string): Promise<FileMetadata[]> {
    if (this.isTauri()) {
      const entries = await fsApi.readDir(path);
      return entries.map((entry: any) => ({
        path: `${path}/${entry.name}`,
        name: entry.name,
        size: entry.children ? 0 : entry.size || 0,
        modified: 0,
        isFile: !entry.children,
        isDir: !!entry.children,
      }));
    } else {
      // Web 环境：返回空数组 (不支持目录读取)
      log.warn("readDir not supported in web environment");
      return [];
    }
  },

  /** 创建目录 */
  async createDir(path: string): Promise<void> {
    if (this.isTauri()) {
      await fsApi.createDir(path, { recursive: true });
    } else {
      log.warn("createDir not supported in web environment");
    }
  },

  /** 删除目录 */
  async removeDir(path: string): Promise<void> {
    if (this.isTauri()) {
      await fsApi.removeDir(path, { recursive: true });
    } else {
      log.warn("removeDir not supported in web environment");
    }
  },

  /** 删除文件 */
  async removeFile(path: string): Promise<void> {
    if (this.isTauri()) {
      await fsApi.removeFile(path);
    } else {
      // Web 环境：从 IndexedDB 删除
      const projectId = "default";
      await deleteFileFromIndexedDB(projectId, path);
    }
  },

  /** 重命名文件 */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (this.isTauri()) {
      await fsApi.renameFile(oldPath, newPath);
    } else {
      log.warn("renameFile not supported in web environment");
    }
  },

  /** 检查文件是否存在 */
  async fileExists(path: string): Promise<boolean> {
    if (this.isTauri()) {
      return await fsApi.exists(path);
    } else {
      // Web 环境：检查 IndexedDB
      try {
        const content = await this.readFile(path);
        return content !== undefined;
      } catch {
        return false;
      }
    }
  },

  /** 监控文件变化 */
  async watchFile(
    path: string,
    callback: FileWatcherCallback
  ): Promise<FileWatcherHandle> {
    if (this.isTauri()) {
      // Tauri 原生文件监控
      const unwatch = await tauriApi.invoke("watch_file", { path });

      const handle = (event: CustomEvent<FileWatcherEvent>) => {
        callback(event.detail);
      };

      window.addEventListener("file-watch-event", handle as EventListener);

      return {
        unwatch: async () => {
          await unwatch;
          window.removeEventListener("file-watch-event", handle as EventListener);
        },
      };
    } else {
      // Web 环境：轮询检查
      log.warn("watchFile using polling in web environment");

      const interval = setInterval(async () => {
        const exists = await this.fileExists(path);
        if (exists) {
          callback({
            path,
            type: "modified",
            timestamp: Date.now(),
          });
        }
      }, 5000); // 每 5 秒检查一次

      return {
        unwatch: async () => {
          clearInterval(interval);
        },
      };
    }
  },

  /** 批量读取文件 */
  async readFiles(paths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const path of paths) {
      try {
        const content = await this.readFile(path);
        results.set(path, content);
      } catch (error) {
        log.error(`Failed to read file ${path}:`, error);
      }
    }

    return results;
  },

  /** 批量写入文件 */
  async writeFiles(files: Map<string, Uint8Array | string>): Promise<void> {
    for (const [path, data] of files.entries()) {
      try {
        await this.writeFile(path, data);
      } catch (error) {
        log.error(`Failed to write file ${path}:`, error);
      }
    }
  },

  /** 获取文件元数据 */
  async getFileMetadata(path: string): Promise<FileMetadata> {
    const exists = await this.fileExists(path);

    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }

    try {
      const content = await this.readFile(path);
      return {
        path,
        name: path.split("/").pop() || "",
        size: content.length,
        modified: Date.now(),
        isFile: true,
        isDir: false,
      };
    } catch (error) {
      // 如果读取失败，可能是目录
      const entries = await this.readDir(path);
      return {
        path,
        name: path.split("/").pop() || "",
        size: 0,
        modified: Date.now(),
        isFile: false,
        isDir: true,
      };
    }
  },
} as const;

/**
 * 对话框桥接层
 */
export const DialogBridge = {
  /** 打开文件对话框 */
  async openFile(options: DialogOptions = {}): Promise<DialogResult> {
    if (HostBridge.isTauri()) {
      const path = await dialogApi.open({
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters,
        multiple: options.multiple || false,
        directory: options.directory || false,
      });

      return {
        path: (path as string) || null,
        paths: Array.isArray(path) ? path : null,
      };
    } else {
      // Web 环境：使用文件输入
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = options.multiple || false;

        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (!files) {
            resolve({ path: null, paths: null });
            return;
          }

          const paths = Array.from(files).map((f) => f.name);
          resolve({
            path: paths[0] || null,
            paths: options.multiple ? paths : null,
          });
        };

        input.click();
      });
    }
  },

  /** 保存文件对话框 */
  async saveFile(options: DialogOptions = {}): Promise<string | null> {
    if (HostBridge.isTauri()) {
      const path = await dialogApi.save({
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters,
      });

      return (path as string) || null;
    } else {
      // Web 环境：返回默认路径
      return options.defaultPath || null;
    }
  },

  /** 选择目录对话框 */
  async selectDirectory(options: DialogOptions = {}): Promise<string | null> {
    if (HostBridge.isTauri()) {
      const path = await dialogApi.open({
        title: options.title,
        defaultPath: options.defaultPath,
        directory: true,
      });

      return (path as string) || null;
    } else {
      log.warn("selectDirectory not supported in web");
      return null;
    }
  },
} as const;

export default HostBridge;
