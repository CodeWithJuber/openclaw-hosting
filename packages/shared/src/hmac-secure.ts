import { timingSafeEqual } from 'crypto';

/**
 * Constant-time HMAC comparison to prevent timing attacks
 * 
 * Security: Never use standard string comparison for HMAC verification
 * as it leaks timing information that can be exploited.
 */

export function secureHMACCompare(computed: string, provided: string): boolean {
  const computedBuf = Buffer.from(computed, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');
  
  // Constant-time comparison
  if (computedBuf.length !== providedBuf.length) {
    // Still do comparison to avoid leaking length info
    // Compare against empty buffer of same length
    return timingSafeEqual(
      computedBuf,
      Buffer.alloc(computedBuf.length)
    ) && false; // Always return false for length mismatch
  }
  
  return timingSafeEqual(computedBuf, providedBuf);
}

/**
 * Secure string comparison for general use
 */
export function secureStringCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * HMAC signature verification with full security checks
 */
export function verifyHMAC(
  payload: string,
  providedSignature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  const { createHmac } = require('crypto');
  
  // Compute expected signature
  const computed = createHmac(algorithm.toUpperCase(), secret)
    .update(payload)
    .digest('hex');
  
  // Constant-time comparison
  return secureHMACCompare(computed, providedSignature);
}

/**
 * Generate secure HMAC signature
 */
export function generateHMAC(
  payload: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  const { createHmac } = require('crypto');
  
  return createHmac(algorithm.toUpperCase(), secret)
    .update(payload)
    .digest('hex');
}
