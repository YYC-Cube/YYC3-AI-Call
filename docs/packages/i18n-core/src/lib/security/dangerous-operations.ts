/**
 * file dangerous-operations.ts
 * description 注入检测
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[security]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 注入检测
 */
export const DANGEROUS_OPERATION_NAMES = [
  "exec",
  "spawn",
  "shell",
  "fs_write",
  "fs_delete",
  "fs_move",
  "apply_patch",
  "eval",
  "function_constructor",
] as const;

export type DangerousOperation = (typeof DANGEROUS_OPERATION_NAMES)[number];

export const DANGEROUS_OPERATIONS_SET = new Set<string>(DANGEROUS_OPERATION_NAMES);

export function isDangerousOperation(operationName: string): boolean {
  return DANGEROUS_OPERATIONS_SET.has(operationName.toLowerCase());
}

export function getDangerousOperations(): readonly string[] {
  return DANGEROUS_OPERATION_NAMES;
}
