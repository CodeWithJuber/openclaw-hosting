# 🔴 CRITICAL SECURITY ISSUES - NEED YOUR GUIDANCE

## Overview
Agent 6 found **7 critical security vulnerabilities** in our codebase. These must be fixed before production deployment.

---

## Issue #1: JWT Signature Validation Weakness

### Problem
Current JWT implementation may not properly validate algorithm (alg) header, allowing "alg: none" attacks or algorithm switching.

### Current Code (Vulnerable)
```typescript
// Current implementation may accept "alg: none"
const decoded = jwt.verify(token, secret);
```

### Fix Needed
```typescript
// Must explicitly specify algorithm
const decoded = jwt.verify(token, secret, { algorithms: ['RS256'] });
// OR for HMAC
const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
```

### Your Decision Needed:
- [ ] Use RS256 (asymmetric - requires public/private key pair)
- [ ] Use HS256 (symmetric - single secret)

---

## Issue #2: HMAC Timing Attack Vulnerability

### Problem
Current HMAC comparison uses standard string comparison, vulnerable to timing attacks.

### Current Code (Vulnerable)
```typescript
// Vulnerable to timing attacks
if (computedSignature !== providedSignature) {
  throw new Error('Invalid signature');
}
```

### Fix Needed
```typescript
import { timingSafeEqual } from 'crypto';

// Constant-time comparison
const computed = Buffer.from(computedSignature);
const provided = Buffer.from(providedSignature);

if (computed.length !== provided.length || 
    !timingSafeEqual(computed, provided)) {
  throw new Error('Invalid signature');
}
```

---

## Issue #3: Secrets in Code/Logs

### Problem
API keys and secrets may be logged or hardcoded in error messages.

### Current Code (Vulnerable)
```typescript
// May leak secrets in error logs
catch (error) {
  console.error('API call failed:', error); // May contain API key
}
```

### Fix Needed
```typescript
// Sanitize logs
function sanitizeError(error: any): string {
  const message = error.message || String(error);
  return message
    .replace(/sk-[a-zA-Z0-9]{48}/g, '[REDACTED_API_KEY]')
    .replace(/[a-f0-9]{64}/g, '[REDACTED_SECRET]');
}

catch (error) {
  console.error('API call failed:', sanitizeError(error));
}
```

---

## Issue #4: Cloud-init Input Validation Missing

### Problem
cloud-init.yaml uses template variables without validation, allowing command injection.

### Current Code (Vulnerable)
```yaml
runcmd:
  - echo "{{customer_email}}" > /tmp/email.txt
  # If customer_email contains "; rm -rf /", it's executed!
```

### Fix Needed
```typescript
// Validate all inputs before templating
const emailSchema = z.string().email().max(255);
const validatedEmail = emailSchema.parse(customerEmail);

// Sanitize for shell
function sanitizeShell(input: string): string {
  return input.replace(/[;&|`$]/g, '');
}
```

---

## Issue #5: Rate Limiting Not Persistent

### Problem
Current rate limiting is in-memory only, resets on server restart.

### Current Code (Vulnerable)
```typescript
// In-memory - lost on restart
const requests = new Map(); // This resets!
```

### Fix Needed
```typescript
// Use Redis for persistent rate limiting
import { rateLimiters } from './rate-limiter';

// Already implemented in rate-limiter.ts
// Uses Redis + Token bucket algorithm
```

---

## Issue #6: API Keys Stored in Plain Text

### Problem
Customer API keys (Anthropic, OpenAI) stored in database without encryption.

### Current Code (Vulnerable)
```typescript
// Storing plain text!
await db.insert(apiKeys).values({
  customerId,
  openaiKey: 'sk-...', // PLAIN TEXT!
});
```

### Fix Needed
```typescript
import { encrypt, decrypt } from './crypto';

// Encrypt before storing
const encryptedKey = encrypt(openaiKey);
await db.insert(apiKeys).values({
  customerId,
  openaiKey: encryptedKey, // Encrypted!
});

// Decrypt when using
const key = decrypt(encryptedKey);
```

### Your Decision Needed:
- [ ] Use AES-256-GCM (authenticated encryption)
- [ ] Use AES-256-CBC (older, no authentication)
- [ ] Where to store ENCRYPTION_KEY?
  - [ ] Environment variable
  - [ ] AWS KMS / HashiCorp Vault
  - [ ] Separate key management service

---

## Issue #7: CORS Origin Validation Missing

### Problem
CORS allows all origins or doesn't validate properly.

### Current Code (Vulnerable)
```typescript
// Allows any origin!
app.use('*', cors({
  origin: '*'
}));
```

### Fix Needed
```typescript
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      process.env.DASHBOARD_URL,
      'https://admin.yourdomain.com'
    ];
    return allowedOrigins.includes(origin) ? origin : null;
  },
  credentials: true
}));
```

---

## Summary Table

| # | Issue | Severity | Fix Complexity | Your Input Needed |
|---|-------|----------|----------------|-------------------|
| 1 | JWT Algorithm | 🔴 Critical | Low | RS256 vs HS256 |
| 2 | HMAC Timing | 🔴 Critical | Low | None - just implement |
| 3 | Secrets in Logs | 🔴 Critical | Medium | None - just implement |
| 4 | Cloud-init Injection | 🔴 Critical | Medium | None - just implement |
| 5 | Rate Limit Persistence | 🟡 High | Low | Already implemented |
| 6 | API Key Encryption | 🔴 Critical | Medium | Encryption method |
| 7 | CORS Validation | 🟡 High | Low | None - just implement |

---

## What I Need From You:

1. **JWT Algorithm**: RS256 or HS256?
2. **Encryption Method**: AES-256-GCM or other?
3. **Key Storage**: Env var, KMS, or Vault?
4. **Priority Order**: Which issues to fix first?
5. **Testing**: Should I deploy to staging first?

Please reply with your decisions and I'll implement the fixes immediately!
