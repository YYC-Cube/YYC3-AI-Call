/**
 * file engine.ts
 * description i18n 核心引擎实现
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief i18n 核心引擎实现
 */
import { en } from "../locales/en.js";
import { LRUCache } from "./cache.js";
import { ICUCompiler } from "./icu/compiler.js";
import { ICUParser } from "./icu/parser.js";
import { logger } from "./infra/logger.js";
import { getSafeLocalStorage } from "./local-storage.js";
import { PluginManager } from "./plugins.js";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  loadLazyLocaleTranslation,
  resolveNavigatorLocale,
} from "./registry.js";
import type { Locale, TranslationMap } from "./types.js";

type Subscriber = (locale: Locale) => void;

export interface I18nEngineConfig {
  locale?: Locale;
  fallbackLocale?: Locale;
  cache?: {
    enabled?: boolean;
    maxSize?: number;
    ttl?: number;
  };
  debug?: boolean;
  onError?: (error: Error, context: { key: string; locale: Locale }) => void;
  missingKeyHandler?: (key: string, locale: Locale) => string;
}

interface I18nEngineState {
  locale: Locale;
  translations: Partial<Record<Locale, TranslationMap>>;
}

export class I18nEngine {
  private state: I18nEngineState;
  private subscribers: Set<Subscriber> = new Set();

  // New v2.0 features
  public readonly cache: LRUCache<string>;
  public readonly plugins: PluginManager;
  private debugMode = false;
  private errorHandler?: I18nEngineConfig["onError"];
  private missingKeyHandler?: I18nEngineConfig["missingKeyHandler"];

  constructor(config: I18nEngineConfig = {}) {
    // Initialize state
    this.state = {
      locale: config.locale ?? DEFAULT_LOCALE,
      translations: { [DEFAULT_LOCALE]: en },
    };

    // Initialize cache
    this.cache = new LRUCache({
      enabled: config.cache?.enabled ?? true,
      maxSize: config.cache?.maxSize ?? 1000,
      defaultTTL: config.cache?.ttl ?? 5 * 60 * 1000, // 5 minutes
    });

    // Initialize plugin system
    this.plugins = new PluginManager();

    // Store handlers
    this.errorHandler = config.onError;
    this.missingKeyHandler = config.missingKeyHandler;
    this.debugMode = config.debug ?? false;

    // Load initial locale
    this.loadInitialLocale();

    if (this.debugMode) {
      logger.info("🌐 I18n Engine v2.0 Initialized");
      logger.info(`   Locale: ${this.state.locale}`);
      logger.info(`   Cache: ${this.cache.config.enabled ? "✅ Enabled" : "❌ Disabled"}`);
      logger.info(`   Plugins: ${this.plugins.getRegisteredPlugins().length} registered`);
    }
  }

  private readStoredLocale(): string | null {
    const storage = getSafeLocalStorage();
    if (!storage) return null;

    try {
      return storage.getItem("yyc3.i18n.locale");
    } catch {
      return null;
    }
  }

  private persistLocale(locale: Locale): void {
    const storage = getSafeLocalStorage();
    if (!storage) return;

    try {
      storage.setItem("yyc3.i18n.locale", locale);
    } catch {
      // Ignore storage failures in private/blocked contexts
    }
  }

  private resolveInitialLocale(): Locale {
    const saved = this.readStoredLocale();
    if (saved && isSupportedLocale(saved)) {
      return saved;
    }

    const detected = resolveNavigatorLocale();

    return detected ?? DEFAULT_LOCALE;
  }

  private loadInitialLocale(): void {
    const initialLocale = this.resolveInitialLocale();
    if (initialLocale === DEFAULT_LOCALE) {
      this.state.locale = DEFAULT_LOCALE;
      return;
    }

    void this.setLocale(initialLocale);
  }

  public getLocale(): Locale {
    return this.state.locale;
  }

  public async setLocale(locale: Locale): Promise<void> {
    const needsTranslationLoad =
      locale !== DEFAULT_LOCALE && !this.state.translations[locale];

    if (this.state.locale === locale && !needsTranslationLoad) {
      return;
    }

    const oldLocale = this.state.locale;

    if (needsTranslationLoad) {
      try {
        const translation = await loadLazyLocaleTranslation(locale as Exclude<Locale, "en">);
        if (!translation) {
          const error = new Error(`Failed to load translation for locale: ${locale}`);
          this.handleError(error, { key: "", locale });
          return;
        }
        this.state.translations[locale] = translation;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        this.handleError(error, { key: "", locale });
        return;
      }
    }

    this.state.locale = locale;
    this.persistLocale(locale);

    // Invalidate cache on locale change
    this.cache.clear();

    // Notify plugins
    this.plugins.notifyLocaleChange(locale, oldLocale);

    // Notify subscribers
    this.notify();

    if (this.debugMode) {
      logger.debug(`🌍 Locale changed: ${oldLocale} → ${locale}`);
    }
  }

  public registerTranslation(locale: Locale, map: TranslationMap): void {
    this.state.translations[locale] = map;
    this.cache.clear();

    if (this.debugMode) {
      logger.debug(`📦 Translation registered for locale: ${locale}`);
    }
  }

  public subscribe(sub: Subscriber): () => void {
    this.subscribers.add(sub);
    return () => this.subscribers.delete(sub);
  }

  public getTranslations(locale: Locale): TranslationMap | undefined {
    return this.state.translations[locale];
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      sub(this.state.locale);
    }
  }

  /**
   * Main translation method with caching and plugin support
   */
  public t(key: string, params?: Record<string, string>): string {
    try {
      // Check cache first (cache stores un-interpolated template)
      const cached = this.cache.get(`${this.state.locale}:${key}`);
      if (cached !== null) {
        return params ? this.interpolate(cached, params) : cached;
      }

      // Execute beforeTranslate plugins
      const { key: modifiedKey, params: modifiedParams } =
        this.plugins.executeBeforeTranslate(key, params);

      // Resolve translation value
      let value = this.resolveTranslation(modifiedKey);

      // Handle missing keys
      if (value === undefined || value === modifiedKey) {
        const fallback = this.plugins.handleMissingKey(modifiedKey, this.state.locale)
          ?? this.missingKeyHandler?.(modifiedKey, this.state.locale)
          ?? modifiedKey;

        if (this.debugMode && fallback === modifiedKey) {
          logger.warn(`Missing translation key: "${modifiedKey}"`);
        }

        value = fallback;
      }

      // Cache the raw template before interpolation
      this.cache.set(`${this.state.locale}:${key}`, value);

      // Execute afterTranslate plugins on raw value
      const afterPluginValue = this.plugins.executeAfterTranslate(value, modifiedKey, params);

      // Interpolate parameters
      if (params || modifiedParams) {
        const mergedParams = { ...params, ...modifiedParams };
        if (this.isICUMessage(afterPluginValue)) {
          return this.compileICU(afterPluginValue, mergedParams);
        }
        return this.interpolate(afterPluginValue, mergedParams);
      }

      return afterPluginValue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err, { key, locale: this.state.locale });
      return key;
    }
  }

  private isICUMessage(value: string): boolean {
    return value.includes("{") && (value.includes(", plural") || value.includes(", select") || value.includes(", selectOrdinal"));
  }

  private compileICU(template: string, params: Record<string, string>): string {
    try {
      const parser = new ICUParser();
      const { nodes, errors } = parser.parse(template);
      if (errors.length > 0) {
        logger.warn(`ICU parse errors: ${JSON.stringify(errors)}`);
        return this.interpolate(template, params);
      }
      const compiler = new ICUCompiler();
      return compiler.compile(nodes, { locale: this.state.locale, params });
    } catch {
      return this.interpolate(template, params);
    }
  }

  /**
   * Batch translate multiple keys at once
   */
  public batchTranslate(
    keys: string[],
    params?: Record<string, Record<string, string>>
  ): Record<string, string> {
    const results: Record<string, string> = {};

    for (const key of keys) {
      results[key] = this.t(key, params?.[key]);
    }

    return results;
  }

  /**
   * Create a namespaced translator
   */
  public createNamespace(prefix: string): {
    t: (key: string, params?: Record<string, string>) => string;
    batchTranslate: (keys: string[]) => Record<string, string>;
    getLocale: () => Locale;
  } {
    return {
      t: (key, params) => this.t(`${prefix}.${key}`, params),
      batchTranslate: (keys) =>
        Object.fromEntries(keys.map((k) => [k, this.t(`${prefix}.${k}`)])),
      getLocale: () => this.getLocale(),
    };
  }

  private resolveTranslation(key: string): string | undefined {
    const keys = key.split(".");
    let value: unknown =
      this.state.translations[this.state.locale] ??
      this.state.translations[DEFAULT_LOCALE];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to English if not found in current locale
    if (
      value === undefined &&
      this.state.locale !== DEFAULT_LOCALE
    ) {
      value = this.state.translations[DEFAULT_LOCALE];
      for (const k of keys) {
        if (value && typeof value === "object") {
          value = (value as Record<string, unknown>)[k];
        } else {
          value = undefined;
          break;
        }
      }
    }

    return typeof value === "string" ? value : undefined;
  }

  private interpolate(
    template: string,
    params: Record<string, string>
  ): string {
    return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  }

  private handleError(
    error: Error,
    context: { key: string; locale: Locale }
  ): void {
    // Call custom error handler if provided
    this.errorHandler?.(error, context);

    // Notify plugins
    this.plugins.handleError(error, context);

    // Log in debug mode
    if (this.debugMode) {
      logger.error("Error:", error.message, context);
    }
  }

  /**
   * Enable/disable debug mode
   */
  public setDebug(enabled: boolean): void {
    this.debugMode = enabled;

    if (enabled) {
      logger.info("🔧 i18n Debug Mode ENABLED");

      // Attach debug utilities to window
      (globalThis as Record<string, unknown>).__i18n_debug__ = {
        engine: this,
        getStats: () => this.getStats(),
        clearCache: () => this.cache.clear(),
        getPlugins: () => this.plugins.getRegisteredPlugins(),
        testTranslation: (key: string) => this.t(key),
      };
    } else {
      delete (globalThis as Record<string, unknown>).__i18n_debug__;
    }
  }

  /**
   * Get comprehensive statistics
   */
  public getStats(): {
    locale: Locale;
    cache: ReturnType<LRUCache<string>["getStats"]>;
    plugins: string[];
    subscriberCount: number;
    loadedLocales: string[];
  } {
    return {
      locale: this.state.locale,
      cache: this.cache.getStats(),
      plugins: this.plugins.getRegisteredPlugins(),
      subscriberCount: this.subscribers.size,
      loadedLocales: Object.keys(this.state.translations),
    };
  }

  /**
   * Destroy the engine instance (cleanup)
   */
  public async destroy(): Promise<void> {
    await this.plugins.destroyAll();
    this.cache.clear();
    this.subscribers.clear();

    if (this.debugMode) {
      logger.debug("🗑️ I18n Engine destroyed");
    }
  }
}

// Singleton instance for backward compatibility
export const i18n = new I18nEngine();

// Convenience export
export const t = (key: string, params?: Record<string, string>) =>
  i18n.t(key, params);

export { SUPPORTED_LOCALES, isSupportedLocale };
