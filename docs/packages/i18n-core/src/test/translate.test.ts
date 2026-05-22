/**
 * file translate.test.ts
 * description @yyc3/i18n-core translate.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core translate.ts 单元测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStorageMock } from "../../test-helpers/storage.ts";
import { pt_BR } from "../locales/pt-BR.ts";
import { zh_CN } from "../locales/zh-CN.ts";
import { zh_TW } from "../locales/zh-TW.ts";

type TranslateModule = typeof import("../lib/translate.ts");

describe("i18n (re-exported from engine)", () => {
  let translate: TranslateModule;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createStorageMock());
    vi.stubGlobal("navigator", { language: "en-US" } as Navigator);
    translate = await import("../lib/translate.ts");
    localStorage.clear();
    await translate.i18n.setLocale("en");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return the key if translation is missing", () => {
    expect(translate.t("non.existent.key")).toBe("non.existent.key");
  });

  it("should return the correct English translation", () => {
    expect(translate.t("common.health")).toBe("Health");
  });

  it("should replace parameters correctly", () => {
    expect(translate.t("overview.stats.cronNext", { time: "10:00" })).toBe("Next wake 10:00");
  });

  it("should fallback to English if key is missing in another locale", async () => {
    await translate.i18n.setLocale("zh-CN");
    expect(translate.t("common.health")).toBeDefined();
  });

  it("loads translations when setting a locale", async () => {
    await translate.i18n.setLocale("zh-CN");
    expect(translate.t("common.health")).toBe("健康状况");
  });

  it("loads saved non-English locale on startup", async () => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createStorageMock());
    vi.stubGlobal("navigator", { language: "en-US" } as Navigator);
    localStorage.setItem("yyc3.i18n.locale", "zh-CN");

    const fresh = await import("../lib/translate.ts");

    await fresh.i18n.setLocale("zh-CN");

    expect(fresh.i18n.getLocale()).toBe("zh-CN");
    expect(fresh.t("common.health")).toBe("健康状况");
  });

  it("skips node localStorage accessors that warn without a storage file", async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubGlobal("navigator", { language: "en-US" } as Navigator);
    const warningSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => {});

    const fresh = await import("../lib/translate.ts");

    expect(fresh.i18n.getLocale()).toBe("en");
    expect(warningSpy).not.toHaveBeenCalledWith(
      "`--localstorage-file` was provided without a valid path",
      expect.anything(),
      expect.anything(),
    );
  });

  it("keeps the version label available in shipped locales", () => {
    expect((pt_BR.common as { version?: string }).version).toBeTruthy();
    expect((zh_CN.common as { version?: string }).version).toBeTruthy();
    expect((zh_TW.common as { version?: string }).version).toBeTruthy();
  });
});
