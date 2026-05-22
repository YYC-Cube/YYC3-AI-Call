/**
 * file secure-random.ts
 * description 安全随机数
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[infra]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 安全随机数
 */
import { randomBytes, randomInt, randomUUID } from "node:crypto";

export function generateSecureUuid(): string {
  return randomUUID();
}

export function generateSecureToken(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateSecureHex(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

export function generateSecureFraction(): number {
  return randomBytes(4).readUInt32BE(0) / 0x1_0000_0000;
}

export function generateSecureInt(maxExclusive: number): number;
export function generateSecureInt(minInclusive: number, maxExclusive: number): number;
export function generateSecureInt(a: number, b?: number): number {
  return typeof b === "number" ? randomInt(a, b) : randomInt(a);
}
