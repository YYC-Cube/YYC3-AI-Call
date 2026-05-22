/**
 * file rtl-utils.test.ts
 * description @yyc3/i18n-core rtl-utils.ts 单元测试
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
 * brief @yyc3/i18n-core rtl-utils.ts 单元测试
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RTL_LOCALES,
  createMirroredLayout,
  flipSpacing,
  getAlignment,
  getDirection,
  getOppositeAlignment,
  isRTL,
  mirrorPosition,
  setupDocumentDirection,
  transformClassForRTL,
} from "../lib/rtl-utils.js";

const mockDocument = {
  documentElement: {
    setAttribute: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
} as unknown as Document;

describe("RTL Utilities", () => {
  describe("isRTL", () => {
    it("should return true for Arabic locale", () => {
      expect(isRTL("ar")).toBe(true);
    });

    it("should return false for LTR locales", () => {
      expect(isRTL("en")).toBe(false);
      expect(isRTL("zh-CN")).toBe(false);
      expect(isRTL("ja")).toBe(false);
      expect(isRTL("ko")).toBe(false);
    });
  });

  describe("getDirection", () => {
    it("should return 'rtl' for RTL locales", () => {
      expect(getDirection("ar")).toBe("rtl");
    });

    it("should return 'ltr' for LTR locales", () => {
      expect(getDirection("en")).toBe("ltr");
      expect(getDirection("zh-CN")).toBe("ltr");
    });
  });

  describe("getAlignment", () => {
    it("should return 'right' for RTL locales", () => {
      expect(getAlignment("ar")).toBe("right");
    });

    it("should return 'left' for LTR locales", () => {
      expect(getAlignment("en")).toBe("left");
    });
  });

  describe("getOppositeAlignment", () => {
    it("should return opposite for RTL locales", () => {
      expect(getOppositeAlignment("ar")).toBe("left");
    });

    it("should return opposite for LTR locales", () => {
      expect(getOppositeAlignment("en")).toBe("right");
    });
  });

  describe("flipSpacing", () => {
    it("should flip marginLeft to marginRight for RTL", () => {
      const result = flipSpacing("ar", "marginLeft", "10px");
      expect(result).toEqual({ marginRight: "10px" });
    });

    it("should flip marginRight to marginLeft for RTL", () => {
      const result = flipSpacing("ar", "marginRight", "10px");
      expect(result).toEqual({ marginLeft: "10px" });
    });

    it("should flip paddingLeft to paddingRight for RTL", () => {
      const result = flipSpacing("ar", "paddingLeft", "16px");
      expect(result).toEqual({ paddingRight: "16px" });
    });

    it("should flip paddingRight to paddingLeft for RTL", () => {
      const result = flipSpacing("ar", "paddingRight", "16px");
      expect(result).toEqual({ paddingLeft: "16px" });
    });

    it("should keep original property for LTR", () => {
      const result = flipSpacing("en", "marginLeft", "10px");
      expect(result).toEqual({ marginLeft: "10px" });
    });
  });

  describe("mirrorPosition", () => {
    it("should swap left and right for RTL", () => {
      const position = { left: "10px", right: "20px" };
      const result = mirrorPosition("ar", position);
      expect(result).toEqual({ left: "20px", right: "10px" });
    });

    it("should handle partial positions for RTL", () => {
      expect(mirrorPosition("ar", { left: "10px" })).toEqual({
        left: undefined,
        right: "10px",
      });
    });

    it("should return original for LTR", () => {
      const position = { left: "10px" };
      expect(mirrorPosition("en", position)).toEqual(position);
    });

    it("should handle null/undefined position", () => {
      expect(mirrorPosition("ar", null as unknown as Parameters<typeof mirrorPosition>[1])).toBeNull();
      expect(mirrorPosition("ar", undefined as unknown as Parameters<typeof mirrorPosition>[1])).toBeUndefined();
    });
  });

  describe("transformClassForRTL", () => {
    it("should transform ml- to mr- for RTL", () => {
      expect(transformClassForRTL("ar", "ml-4")).toBe("mr-4");
    });

    it("should transform mr- to ml- for RTL", () => {
      expect(transformClassForRTL("ar", "mr-4")).toBe("ml-4");
    });

    it("should transform text-left to text-right for RTL", () => {
      expect(transformClassForRTL("ar", "text-left")).toBe("text-right");
    });

    it("should transform float-left to float-right for RTL", () => {
      expect(transformClassForRTL("ar", "float-left")).toBe("float-right");
    });

    it("should return original class for LTR", () => {
      expect(transformClassForRTL("en", "ml-4")).toBe("ml-4");
    });

    it("should return unchanged class if no mapping found", () => {
      expect(transformClassForRTL("ar", "bg-red")).toBe("bg-red");
      expect(transformClassForRTL("ar", "mt-4")).toBe("mt-4");
    });
  });

  describe("setupDocumentDirection", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should set dir and lang attributes for RTL", () => {
      setupDocumentDirection("ar", mockDocument);
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "dir",
        "rtl"
      );
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "lang",
        "ar"
      );
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "rtl"
      );
    });

    it("should set dir attribute for LTR without rtl class", () => {
      setupDocumentDirection("en", mockDocument);
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "dir",
        "ltr"
      );
      expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
        "rtl"
      );
    });
  });

  describe("createMirroredLayout", () => {
    it("should return same config for LTR locales", () => {
      const config = { marginLeft: "10px" };
      expect(createMirroredLayout("en", config)).toBe(config);
    });

    it("should handle empty config for RTL", () => {
      const result = createMirroredLayout("ar", {});
      expect(result).toEqual({});
    });

    it("should preserve non-mirrored properties for RTL", () => {
      const config = { padding: "5px", color: "red" };
      const result = createMirroredLayout("ar", config);
      expect(result.padding).toBe("5px");
      expect(result.color).toBe("red");
    });
  });

  describe("RTL_LOCALES constant", () => {
    it("should contain Arabic locale", () => {
      expect(RTL_LOCALES).toContain("ar");
    });
  });
});
