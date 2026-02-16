import { createPublicKey, createPrivateKey, verify, sign } from 'crypto';
import { timingSafeEqual } from 'crypto';

// RS256 JWT Implementation with dual-validation window for migration

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

class JWTManager {
  private privateKey: string;
  private publicKey: string;
  private legacySecret?: string; // For migration window
  
  constructor(privateKey: string, publicKey: string, legacySecret?: string) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.legacySecret = legacySecret;
  }
  
  // Sign with RS256 (asymmetric)
  sign(payload: Omit<JWTPayload, 'iat'>, expiresIn: number = 3600): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };
    
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signingInput = `${header}.${payloadB64}`;
    
    const signature = sign('RSA-SHA256', Buffer.from(signingInput), this.privateKey);
    
    return `${signingInput}.${signature.toString('base64url')}`;
  }
  
  // Verify with dual-validation support for migration
  verify(token: string): JWTPayload {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    
    // SECURITY: Explicitly check algorithm - prevent alg:none attacks
    if (header.alg === 'RS256') {
      // New RS256 validation
      const signingInput = `${headerB64}.${payloadB64}`;
      const signature = Buffer.from(signatureB64, 'base64url');
      
      const valid = verify('RSA-SHA256', Buffer.from(signingInput), this.publicKey, signature);
      
      if (!valid) {
        throw new Error('Invalid signature');
      }
    } else if (header.alg === 'HS256' && this.legacySecret) {
      // MIGRATION: Accept legacy HS256 tokens during transition
      const { createHmac } = require('crypto');
      const signingInput = `${headerB64}.${payloadB64}`;
      const expectedSig = createHmac('SHA256', this.legacySecret)
        .update(signingInput)
        .digest('base64url');
      
      const actualSig = signatureB64;
      
      if (!timingSafeEqual(Buffer.from(expectedSig), Buffer.from(actualSig))) {
        throw new Error('Invalid legacy signature');
      }
      
      console.warn('[JWT] Legacy HS256 token accepted - migrate to RS256');
    } else {
      throw new Error(`Unsupported algorithm: ${header.alg}`);
    }
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  }
  
  // Generate key pair for new installations
  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const { generateKeyPairSync } = require('crypto');
    
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    return { privateKey, publicKey };
  }
}

export { JWTManager, JWTPayload };
