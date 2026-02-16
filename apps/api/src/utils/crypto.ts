// apps/api/src/utils/crypto.ts
import { randomBytes } from "crypto";

/**
 * Generate a random subdomain (8 alphanumeric characters)
 */
export function generateSubdomain(): string {
  return randomBytes(6).toString("base64url").toLowerCase().slice(0, 8);
}

/**
 * Generate a secure callback token
 */
export function generateCallbackToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  return `oc_${randomBytes(32).toString("base64url")}`;
}

/**
 * Generate a secure password
 */
export function generatePassword(length: number = 24): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  const bytes = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  
  return password;
}

/**
 * Hash a string using SHA-256
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

import { createHash } from "crypto";
