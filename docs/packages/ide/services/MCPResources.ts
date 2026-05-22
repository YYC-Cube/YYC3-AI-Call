/**
 * @file MCPResources.ts
 * @description MCP 资源管理 - 管理 MCP 资源读取和缓存
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags mcp,resources,cache
 */

import type { MCPClient, MCPResource, MCPResourceContent } from "./MCPClient";
import { createLogger } from "../utils/logger";
const log = createLogger("MCPResources");

export interface CachedResource {
  uri: string;
  content: MCPResourceContent;
  cachedAt: number;
  expiresAt: number;
}

export interface ResourceSubscription {
  uri: string;
  callback: (content: MCPResourceContent) => void;
}

/**
 * MCP 资源管理器
 */
export class MCPResourceManager {
  private cache: Map<string, CachedResource> = new Map();
  private subscriptions: Map<string, ResourceSubscription[]> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 分钟

  constructor(private client: MCPClient) {}

  /**
   * 读取资源 (带缓存)
   */
  async readResource(uri: string, forceRefresh: boolean = false): Promise<MCPResourceContent> {
    // 检查缓存
    if (!forceRefresh) {
      const cached = this.cache.get(uri);
      if (cached && cached.expiresAt > Date.now()) {
        log.info(`Cache hit: ${uri}`);
        return cached.content;
      }
    }

    // 从服务器读取
    log.info(`Reading: ${uri}`);
    const content = await this.client.readResource(uri);

    // 更新缓存
    this.cache.set(uri, {
      uri,
      content,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.DEFAULT_TTL,
    });

    // 通知订阅者
    this.notifySubscribers(uri, content);

    return content;
  }

  /**
   * 列出所有资源
   */
  listResources(): MCPResource[] {
    return this.client.listResources();
  }

  /**
   * 获取资源 by URI
   */
  getResource(uri: string): MCPResource | undefined {
    return this.client.getResource(uri);
  }

  /**
   * 订阅资源变化
   */
  subscribe(uri: string, callback: (content: MCPResourceContent) => void): () => void {
    const subs = this.subscriptions.get(uri) || [];
    subs.push({ uri, callback });
    this.subscriptions.set(uri, subs);

    log.info(`Subscribed to: ${uri}`);

    // 返回取消订阅函数
    return () => {
      const currentSubs = this.subscriptions.get(uri) || [];
      const index = currentSubs.findIndex((s) => s.callback === callback);
      if (index !== -1) {
        currentSubs.splice(index, 1);
        this.subscriptions.set(uri, currentSubs);
        log.info(`Unsubscribed from: ${uri}`);
      }
    };
  }

  /**
   * 清除缓存
   */
  clearCache(uri?: string): void {
    if (uri) {
      this.cache.delete(uri);
      log.info(`Cache cleared: ${uri}`);
    } else {
      this.cache.clear();
      log.info("All cache cleared");
    }
  }

  /**
   * 预加载资源
   */
  async preloadResources(uris: string[]): Promise<void> {
    await Promise.all(
      uris.map((uri) => this.readResource(uri).catch(console.error))
    );
    log.info(`Preloaded ${uris.length} resources`);
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    totalItems: number;
    hitRate: number;
    size: number;
  } {
    const now = Date.now();
    let hits = 0;
    let total = 0;

    for (const [uri, cached] of this.cache.entries()) {
      total++;
      if (cached.expiresAt > now) {
        hits++;
      }
    }

    return {
      totalItems: this.cache.size,
      hitRate: total > 0 ? hits / total : 0,
      size: this.cache.size,
    };
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(uri: string, content: MCPResourceContent): void {
    const subs = this.subscriptions.get(uri) || [];
    for (const sub of subs) {
      try {
        sub.callback(content);
      } catch (error) {
        log.error(`Subscription callback error:`, error);
      }
    }
  }

  /**
   * 导出资源为文本
   */
  async exportResourceAsText(uri: string): Promise<string> {
    const content = await this.readResource(uri);
    return content.text || "";
  }

  /**
   * 导出资源为 Blob
   */
  async exportResourceAsBlob(uri: string): Promise<Blob> {
    const content = await this.readResource(uri);
    if (content.blob) {
      const binary = atob(content.blob);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      return new Blob([array], { type: content.mimeType });
    }
    if (content.text) {
      return new Blob([content.text], { type: content.mimeType || "text/plain" });
    }
    throw new Error("Resource has no content");
  }

  /**
   * 批量读取资源
   */
  async readResources(uris: string[]): Promise<Map<string, MCPResourceContent>> {
    const results = new Map<string, MCPResourceContent>();
    await Promise.all(
      uris.map(async (uri) => {
        try {
          const content = await this.readResource(uri);
          results.set(uri, content);
        } catch (error) {
          log.error(`Failed to read ${uri}:`, error);
        }
      })
    );
    return results;
  }

  /**
   * 设置缓存 TTL
   */
  setCacheTTL(ttl: number): void {
    (this as any).DEFAULT_TTL = ttl;
    log.info(`Cache TTL set to ${ttl}ms`);
  }

  /**
   * 获取资源元数据
   */
  async getResourceMetadata(uri: string): Promise<{
    uri: string;
    name: string;
    description: string;
    mimeType?: string;
    size?: number;
  }> {
    const resource = this.getResource(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    const content = await this.readResource(uri);
    const size = content.text?.length || content.blob?.length || 0;

    return {
      uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
      size,
    };
  }
}

export default MCPResourceManager;
