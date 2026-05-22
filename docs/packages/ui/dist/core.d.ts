import * as react_jsx_runtime from 'react/jsx-runtime';
import React__default from 'react';

interface FamilyUIConfig {
    auth?: Record<string, unknown>;
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
}
interface FamilyProviderProps {
    config: FamilyUIConfig;
    children: React__default.ReactNode;
}
declare function FamilyProvider({ config, children }: FamilyProviderProps): react_jsx_runtime.JSX.Element;
declare function useFamilyConfig(): FamilyUIConfig;

declare function useLocalStorage<T>(key: string, initialValue: T): readonly [T, (value: T | ((val: T) => T)) => void];
declare function useMediaQuery(query: string): boolean;
declare function useDebounce<T>(value: T, delay: number): T;
declare function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void): void;

/**
 * file utils.ts
 * description 工具函数集
 * module @yyc3/ui
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.1
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 工具函数集
 */
declare function classNames(...classes: (string | undefined | null | false | 0 | '')[]): string;
declare function formatBytes(bytes: number, decimals?: number): string;
declare function formatDate(date: Date | string | number): string;
declare function sleep(ms: number): Promise<void>;
declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;

export { FamilyProvider, type FamilyProviderProps, type FamilyUIConfig, classNames, debounce, formatBytes, formatDate, sleep, throttle, useClickOutside, useDebounce, useFamilyConfig, useLocalStorage, useMediaQuery };
