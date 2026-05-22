import { createLogger } from "./utils/logger";
const log = createLogger("selectors");
/**
 * @file stores/selectors.ts
 * @description Zustand 细粒度 Selector 工具，优化订阅性能，避免过度渲染
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,selectors,performance,optimization
 */

import { useStore, createSelectorHooks } from "zustand";
import type { StoreApi } from "zustand";
import { shallow } from "zustand/shallow";
import { useMemo, useCallback } from "react";

// ===== 通用 Selector 工具 =====

/**
 * 创建稳定的 selector hook，避免每次渲染创建新函数
 * @example
 * const useUserName = createStableSelector(
 *   useUserStore,
 *   (state) => state.user.name
 * );
 */
export function createStableSelector<T, U>(
  store: StoreApi<T>,
  selector: (state: T) => U,
) {
  return () => useStore(store, selector);
}

/**
 * 创建多个字段的 selector hook，使用 shallow 比较
 * @example
 * const useUserInfo = createShallowSelector(useUserStore, ['name', 'email']);
 */
export function createShallowSelector<T, K extends keyof T>(
  store: StoreApi<T>,
  keys: K[],
) {
  return () =>
    useStore(
      store,
      useCallback((state: T) => {
        const result = {} as Pick<T, K>;
        keys.forEach((key) => {
          result[key] = state[key];
        });
        return result;
      }, [keys]),
      shallow,
    );
}

// ===== 性能监控工具 =====

/**
 * 开发环境下的性能监控 hook
 * 记录组件订阅和重渲染次数
 */
export function useStorePerformanceMonitor(
  storeName: string,
  componentName: string,
  selectedKeys?: string[],
) {
  if (process.env.NODE_ENV === "development") {
    useMemo(() => {
      const timestamp = new Date().toISOString();
      const keysInfo = selectedKeys ? ` [${selectedKeys.join(", ")}]` : "";
      log.info(
        `${timestamp} ${componentName} subscribed to ${storeName}${keysInfo}`,
      );
    }, []);
  }
}

// ===== 常用 Selector 工厂函数 =====

/**
 * 创建数组字段的 selector，带过滤和排序
 */
export function createArraySelector<T, Item>(
  store: StoreApi<T>,
  arrayKey: keyof T,
  filterFn?: (item: Item) => boolean,
  sortFn?: (a: Item, b: Item) => number,
) {
  return () => {
    const selector = useCallback(
      (state: T) => {
        let items = state[arrayKey] as unknown as Item[];
        if (filterFn) {
          items = items.filter(filterFn);
        }
        if (sortFn) {
          items = [...items].sort(sortFn);
        }
        return items;
      },
      [filterFn, sortFn],
    );
    return useStore(store, selector, shallow);
  };
}

/**
 * 创建 Map/Object 字段的 selector，支持单个 key 访问
 */
export function createMapSelector<T, V>(
  store: StoreApi<T>,
  mapKey: keyof T,
  itemKey: string,
) {
  return () => {
    const selector = useCallback(
      (state: T) => {
        const map = state[mapKey] as Record<string, V>;
        return map[itemKey];
      },
      [itemKey],
    );
    return useStore(store, selector);
  };
}

// ===== 批量更新工具 =====

/**
 * 批量更新 hook，避免多次状态更新导致的重渲染
 */
export function useBatchUpdates<T>(
  store: StoreApi<T>,
  updates: Array<{ key: keyof T; value: unknown }>,
) {
  return useCallback(() => {
    store.setState((state) => {
      const newState = { ...state };
      updates.forEach(({ key, value }) => {
        newState[key] = value as T[keyof T];
      });
      return newState;
    });
  }, [store, updates]);
}

// ===== Diff 检测工具 =====

/**
 * 创建带 diff 检测的 selector，仅在值真正变化时触发重渲染
 */
export function createDiffSelector<T, U>(
  store: StoreApi<T>,
  selector: (state: T) => U,
  diffFn: (prev: U, next: U) => boolean = (prev, next) => prev !== next,
) {
  return () => {
    let prevValue: U | undefined;
    return useStore(store, (state) => {
      const nextValue = selector(state);
      if (prevValue === undefined || diffFn(prevValue, nextValue)) {
        prevValue = nextValue;
        return nextValue;
      }
      return prevValue;
    });
  };
}

// ===== 组合 Selector =====

/**
 * 组合多个 store 的 selector
 */
export function combineSelectors<T1, T2, R>(
  selector1: () => T1,
  selector2: () => T2,
  combiner: (v1: T1, v2: T2) => R,
) {
  return () => {
    const v1 = selector1();
    const v2 = selector2();
    return useMemo(() => combiner(v1, v2), [v1, v2]);
  };
}
