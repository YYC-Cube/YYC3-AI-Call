/**
 * @file CryptoService.ts
 * @description 加密服务 — 对齐 P3-安全-数据加密.md，基于 Web Crypto API 的 AES-GCM 加解密，
 *              支持 PBKDF2 密钥派生、安全存储、数据脱敏
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags crypto,encryption,aes-gcm,pbkdf2,security
 */

// ================================================================
// Crypto Service — 加密服务
// ================================================================
//
// 对齐：YYC3-Design-Prompt/P3-优化完善/YYC3-P3-安全-数据加密.md
//
// 功能：
//   - AES-GCM-256 对称加密/解密
//   - PBKDF2 密码派生密钥
//   - 安全随机 IV/Salt 生成
//   - Base64 编码/解码
//   - API Key 脱敏显示
//   - 敏感数据安全存储/读取
//
// 安全规范：
//   - 使用 Web Crypto API (SubtleCrypto)，无自实现加密
//   - IV 每次加密随机生成 (12 bytes)
//   - Salt 每次密钥派生随机生成 (16 bytes)
//   - PBKDF2 迭代次数 ≥ 100,000
//   - 密钥不以明文存储
// ================================================================

import { createLogger } from "./utils/logger";
const log = createLogger("CryptoService");
import {
  SECURITY_ENCRYPTION_ALGORITHM,
  SECURITY_KEY_LENGTH,
  SECURITY_IV_LENGTH,
  SECURITY_SALT_LENGTH,
  SECURITY_PBKDF2_ITERATIONS,
} from "./constants/config";

import type { EncryptedData } from "./types";

// ── Helpers: ArrayBuffer <-> Base64 ──

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Helpers: Text <-> ArrayBuffer ──

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function textToBuffer(text: string): Uint8Array {
  return encoder.encode(text);
}

function bufferToText(buffer: ArrayBuffer): string {
  return decoder.decode(buffer);
}

// ── Core Crypto Functions ──

/** 生成加密安全的随机字节 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** 从密码派生 AES 密钥 (PBKDF2) */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = SECURITY_PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textToBuffer(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: SECURITY_ENCRYPTION_ALGORITHM,
      length: SECURITY_KEY_LENGTH,
    },
    false, // not extractable
    ["encrypt", "decrypt"],
  );
}

/** AES-GCM 加密 */
export async function encrypt(
  plaintext: string,
  password: string,
): Promise<EncryptedData> {
  const salt = generateRandomBytes(SECURITY_SALT_LENGTH);
  const iv = generateRandomBytes(SECURITY_IV_LENGTH);
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: SECURITY_ENCRYPTION_ALGORITHM, iv },
    key,
    textToBuffer(plaintext),
  );

  return {
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    ciphertext: arrayBufferToBase64(ciphertext),
    algorithm: SECURITY_ENCRYPTION_ALGORITHM,
    version: 1,
  };
}

/** AES-GCM 解密 */
export async function decrypt(
  data: EncryptedData,
  password: string,
): Promise<string> {
  const salt = new Uint8Array(base64ToArrayBuffer(data.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(data.iv));
  const ciphertext = base64ToArrayBuffer(data.ciphertext);

  const key = await deriveKey(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: SECURITY_ENCRYPTION_ALGORITHM, iv },
    key,
    ciphertext,
  );

  return bufferToText(plaintext);
}

// ── Secure Storage (localStorage + AES-GCM) ──

const SECURE_PREFIX = "yyc3_secure_";

/** 加密并安全存储到 localStorage */
export async function secureStore(
  key: string,
  value: string,
  password: string,
): Promise<void> {
  const encrypted = await encrypt(value, password);
  localStorage.setItem(`${SECURE_PREFIX}${key}`, JSON.stringify(encrypted));
}

/** 从 localStorage 读取并解密 */
export async function secureRetrieve(
  key: string,
  password: string,
): Promise<string | null> {
  const raw = localStorage.getItem(`${SECURE_PREFIX}${key}`);
  if (!raw) return null;

  try {
    const data: EncryptedData = JSON.parse(raw);
    return await decrypt(data, password);
  } catch (e) {
    log.error("Failed to decrypt:", e);
    return null;
  }
}

/** 删除安全存储的项 */
export function secureRemove(key: string): void {
  localStorage.removeItem(`${SECURE_PREFIX}${key}`);
}

/** 列出所有安全存储的键 */
export function secureListKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(SECURE_PREFIX)) {
      keys.push(k.slice(SECURE_PREFIX.length));
    }
  }
  return keys;
}

// ── Data Masking (脱敏) ──

/** API Key 脱敏显示: sk-proj-abc...xyz → sk-pr***xyz */
export function maskApiKey(
  key: string,
  visibleStart = 5,
  visibleEnd = 3,
): string {
  if (!key) return "";
  if (key.length <= visibleStart + visibleEnd) return "***";
  const start = key.slice(0, visibleStart);
  const end = key.slice(-visibleEnd);
  return `${start}***${end}`;
}

/** 邮箱脱敏: admin@example.com → ad***@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visibleLen = Math.min(2, local.length);
  return `${local.slice(0, visibleLen)}***@${domain}`;
}

/** 手机号脱敏: 13812345678 → 138****5678 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return "***";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

/** 通用字符串脱敏 */
export function maskString(
  str: string,
  options?: { visibleStart?: number; visibleEnd?: number; maskChar?: string },
): string {
  const { visibleStart = 3, visibleEnd = 3, maskChar = "*" } = options || {};
  if (str.length <= visibleStart + visibleEnd) return maskChar.repeat(3);
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const maskLen = Math.min(str.length - visibleStart - visibleEnd, 6);
  return `${start}${maskChar.repeat(maskLen)}${end}`;
}

// ── Hash Utilities ──

/** SHA-256 哈希 */
export async function sha256(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", textToBuffer(input));
  return arrayBufferToBase64(buffer);
}

/** 生成安全随机 token (hex) */
export function generateSecureToken(length: number = 32): string {
  const bytes = generateRandomBytes(length);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Validation ──

/** 检查当前环境是否支持 Web Crypto API */
export function isCryptoAvailable(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.encrypt === "function" &&
    typeof crypto.subtle.decrypt === "function" &&
    typeof crypto.subtle.deriveKey === "function"
  );
}

/** Crypto 能力检测报告 */
export function getCryptoCapabilities(): {
  available: boolean;
  algorithms: string[];
  features: string[];
} {
  const available = isCryptoAvailable();
  return {
    available,
    algorithms: available
      ? ["AES-GCM", "PBKDF2", "SHA-256", "SHA-384", "SHA-512"]
      : [],
    features: available
      ? [
          "encrypt",
          "decrypt",
          "deriveKey",
          "digest",
          "generateKey",
          "getRandomValues",
        ]
      : [],
  };
}
