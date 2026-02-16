# OpenClaw Security Hardening Guide

## ⚠️ Critical Security Warnings

OpenClaw gives AI agents real autonomy — and raises new security risks.

**References:**
- Fortune: https://fortune.com/2026/02/12/openclaw-ai-agents-security-risks-beware/
- Security Boulevard: https://securityboulevard.com/2026/02/openclaw-open-source-ai-agent-application-attack-surface-and-security-risk-system-analysis/

---

## Attack Vectors & Mitigations

### 1. Malicious AgentSkills

**Risk:** Cisco found malicious skills performing data exfiltration

**Mitigation:**
```typescript
// packages/shared/src/skill-auditor.ts
class SkillAuditor {
  async auditSkill(skillPath: string): Promise<AuditResult> {
    const risks = [];
    
    // Check for suspicious imports
    const code = await fs.readFile(skillPath, 'utf-8');
    
    const dangerousPatterns = [
      /fetch\(['"]https?:\/\/(?!localhost|127\.0\.0\.1)/, // External calls
      /fs\.writeFile.*\/(etc|root|\.ssh)/,              // System file writes
      /child_process\.exec/,                             // Shell execution
      /process\.env\.[A-Z_]+/,                           // Environment access
      /require\(['"]http['"]\)/,                         // HTTP servers
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        risks.push({
          severity: 'HIGH',
          pattern: pattern.toString(),
          line: this.findLineNumber(code, pattern)
        });
      }
    }
    
    // Check network permissions
    const manifest = await this.readManifest(skillPath);
    if (manifest.permissions?.includes('network')) {
      risks.push({
        severity: 'MEDIUM',
        issue: 'Network access requested',
        recommendation: 'Verify all external domains'
      });
    }
    
    return {
      approved: risks.length === 0,
      risks,
      requiresManualReview: risks.some(r => r.severity === 'HIGH')
    };
  }
  
  // Only allow skills from trusted sources
  private trustedSources = [
    'github.com/openclaw/',
    'github.com/codewithjuber/',
    'local/verified/'
  ];
}
```

---

### 2. Unrestricted Shell Access

**Risk:** Never give unrestricted root access

**Mitigation:**
```typescript
// packages/shared/src/sandboxed-shell.ts
import { spawn } from 'child_process';

class SandboxedShell {
  private allowedCommands = [
    'ls', 'cat', 'grep', 'find', 'head', 'tail',
    'git', 'npm', 'pnpm', 'yarn',
    'docker', 'docker-compose',
    'curl', 'wget'
  ];
  
  private blockedPatterns = [
    /rm\s+-rf\s+\//,                    // Delete root
    /mkfs\./,                           // Format drives
    /dd\s+if=.*of=\/dev/,               // Direct disk writes
    /\|\s*sh/,                          // Pipe to shell
    /\|\s*bash/,                        // Pipe to bash
    /eval\s*\(/,                        // Eval
    /sudo/,                             // Sudo (unless whitelisted)
    /su\s+-/,                           // Switch user
  ];
  
  async execute(command: string, options: ShellOptions): Promise<ShellResult> {
    // 1. Parse command
    const parsed = this.parseCommand(command);
    
    // 2. Check against blocklist
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(command)) {
        throw new SecurityError(`Blocked dangerous command: ${pattern}`);
      }
    }
    
    // 3. Check command whitelist
    if (!this.allowedCommands.includes(parsed.command)) {
      throw new SecurityError(`Command not allowed: ${parsed.command}`);
    }
    
    // 4. Apply resource limits
    const limitedCommand = this.applyLimits(command, options);
    
    // 5. Execute in sandbox (Docker/container)
    return await this.executeInSandbox(limitedCommand, options);
  }
  
  private applyLimits(command: string, options: ShellOptions): string {
    const limits = [
      'timeout 30',           // Max 30 seconds
      'ulimit -v 1048576',    // Max 1GB memory
      'ulimit -f 102400',     // Max 100MB file size
    ];
    
    if (options.readOnly) {
      limits.push('ro'); // Read-only filesystem
    }
    
    return `${limits.join(' ')} ${command}`;
  }
  
  private async executeInSandbox(command: string, options: ShellOptions): Promise<ShellResult> {
    // Use Docker for isolation
    const dockerCommand = `
      docker run --rm \\
        --network=none \\
        --read-only \\
        --memory=1g \\
        --cpus=1 \\
        -v ${options.workDir}:/work:ro \\
        alpine:latest \\
        sh -c '${command}'
    `;
    
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', dockerCommand]);
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => stdout += data);
      child.stderr.on('data', (data) => stderr += data);
      
      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code || 0 });
      });
      
      // Timeout
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, 30000);
    });
  }
}
```

---

### 3. Default Config Exploits

**Risk:** Default configs have been exploited for full takeover

**Mitigation:**
```typescript
// packages/shared/src/secure-config.ts
const secureConfig = {
  // Authentication (REQUIRED)
  auth: {
    enabled: true,                    // Never false in production
    method: 'jwt',
    jwtSecret: process.env.JWT_SECRET, // Must be set
    jwtExpiresIn: '1h',
    requireMFA: true,                 // For admin access
    passwordMinLength: 12,
    passwordRequireComplexity: true,
  },
  
  // Rate Limiting
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000,         // 15 minutes
    maxRequests: 100,                 // Per window
    skipSuccessfulRequests: false,
  },
  
  // Autonomous Action Limits
  actionLimits: {
    emailsPerHour: 10,
    filesDeletedPerHour: 50,
    apiCallsPerMinute: 60,
    moneySpentPerDay: 100,            // In USD
    maxTransactionAmount: 50,
  },
  
  // Human-in-the-Loop
  hitl: {
    enabled: true,
    requireApprovalFor: [
      'financial_transactions',
      'external_communications',
      'data_deletion',
      'system_changes',
      'new_skill_installation',
    ],
    autoApproveRoutine: false,
  },
  
  // Network Security
  network: {
    allowedDomains: [
      'api.openai.com',
      'api.anthropic.com',
      'generativelanguage.googleapis.com',
      'github.com',
    ],
    blockPrivateIPs: true,
    blockLocalhost: true,
  },
  
  // Logging & Audit
  audit: {
    enabled: true,
    logAllActions: true,
    logLevel: 'info',
    retentionDays: 90,
    sensitiveFields: ['password', 'token', 'key', 'secret'],
  },
  
  // Skill Security
  skills: {
    allowUnsigned: false,
    requireVerification: true,
    sandboxExecution: true,
    maxSkillPermissions: 5,
  }
};

// Validate config on startup
export function validateConfig(config: any): void {
  const required = ['auth.enabled', 'auth.jwtSecret', 'rateLimit.enabled'];
  
  for (const path of required) {
    const value = path.split('.').reduce((o, p) => o?.[p], config);
    if (!value) {
      throw new Error(`Security config missing: ${path}`);
    }
  }
  
  if (config.auth.jwtSecret === 'default' || config.auth.jwtSecret?.length < 32) {
    throw new Error('JWT secret must be at least 32 characters');
  }
}
```

---

### 4. Rate Limiting Autonomous Actions

**Risk:** Cap emails sent, money spent, files deleted per hour

**Implementation:**
```typescript
// packages/shared/src/action-limiter.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';

class ActionLimiter {
  private limiters = {
    emails: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'email_limit',
      points: 10,           // 10 emails
      duration: 3600,       // per hour
    }),
    
    fileDeletions: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'delete_limit',
      points: 50,           // 50 files
      duration: 3600,       // per hour
    }),
    
    apiCalls: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'api_limit',
      points: 60,           // 60 calls
      duration: 60,         // per minute
    }),
    
    spending: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'spend_limit',
      points: 10000,        // $100.00 (in cents)
      duration: 86400,      // per day
    }),
  };
  
  async checkLimit(action: string, userId: string, cost?: number): Promise<boolean> {
    const limiter = this.limiters[action];
    if (!limiter) return true;
    
    try {
      const points = cost ? Math.ceil(cost * 100) : 1;
      await limiter.consume(userId, points);
      return true;
    } catch (rejRes) {
      logger.warn(`Rate limit exceeded for ${action} by ${userId}`);
      return false;
    }
  }
  
  async trackSpending(userId: string, amount: number): Promise<boolean> {
    return this.checkLimit('spending', userId, amount);
  }
  
  async checkBeforeAction(action: Action): Promise<ActionDecision> {
    const limitType = this.getLimitType(action);
    const allowed = await this.checkLimit(limitType, action.userId, action.cost);
    
    if (!allowed) {
      return {
        allowed: false,
        reason: `Rate limit exceeded for ${limitType}`,
        requiresApproval: true,
      };
    }
    
    // Check if this action type requires HITL
    if (this.requiresHumanApproval(action)) {
      return {
        allowed: false,
        reason: 'Human approval required',
        requiresApproval: true,
      };
    }
    
    return { allowed: true };
  }
}
```

---

### 5. Human-in-the-Loop (HITL)

**Risk:** Keep humans in the loop for irreversible actions

**Implementation:**
```typescript
// packages/shared/src/hitl-system.ts
enum ActionCategory {
  ROUTINE = 'routine',           // Auto-approve
  SENSITIVE = 'sensitive',       // Notify after
  CRITICAL = 'critical',         // Approve before
}

const actionCategories: Record<string, ActionCategory> = {
  'read_file': ActionCategory.ROUTINE,
  'search_web': ActionCategory.ROUTINE,
  'write_file': ActionCategory.SENSITIVE,
  'send_email': ActionCategory.CRITICAL,
  'delete_file': ActionCategory.CRITICAL,
  'make_payment': ActionCategory.CRITICAL,
  'deploy_code': ActionCategory.CRITICAL,
  'install_skill': ActionCategory.CRITICAL,
  'share_data': ActionCategory.CRITICAL,
};

class HumanInTheLoop {
  async evaluateAction(action: Action): Promise<ActionDecision> {
    const category = actionCategories[action.type] || ActionCategory.CRITICAL;
    
    switch (category) {
      case ActionCategory.ROUTINE:
        return { allowed: true };
        
      case ActionCategory.SENSITIVE:
        // Execute but notify
        const result = await action.execute();
        await this.notifyUser(action, result);
        return { allowed: true, result };
        
      case ActionCategory.CRITICAL:
        // Require approval
        const approval = await this.requestApproval(action);
        if (approval.granted) {
          const result = await action.execute();
          await this.logApproval(action, approval, result);
          return { allowed: true, result };
        }
        return { allowed: false, reason: 'User denied' };
    }
  }
  
  private async requestApproval(action: Action): Promise<Approval> {
    const request = {
      id: generateUUID(),
      action: action.type,
      description: action.description,
      impact: this.assessImpact(action),
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    };
    
    // Send to user via WhatsApp/Slack/Email
    await this.sendApprovalRequest(request);
    
    // Wait for response
    return await this.waitForApproval(request.id, 30 * 60 * 1000);
  }
  
  private assessImpact(action: Action): ImpactAssessment {
    return {
      financial: action.cost > 0 ? 'HIGH' : 'NONE',
      legal: action.legalImplications ? 'HIGH' : 'NONE',
      data: action.involvesPersonalData ? 'HIGH' : 'NONE',
      reversible: action.isReversible,
    };
  }
}
```

---

## Security Checklist

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Set strong JWT secret (32+ chars)
- [ ] Enable authentication (never disable)
- [ ] Configure rate limiting
- [ ] Set action limits (emails, spending, deletions)
- [ ] Enable audit logging
- [ ] Audit all installed skills
- [ ] Configure HITL for critical actions
- [ ] Set up sandboxed shell
- [ ] Restrict network access
- [ ] Enable MFA for admin
- [ ] Configure backup/restore
- [ ] Set up monitoring/alerts
- [ ] Document incident response

### Ongoing Security

- [ ] Weekly skill audits
- [ ] Monthly access reviews
- [ ] Quarterly penetration testing
- [ ] Keep dependencies updated
- [ ] Monitor for suspicious activity
- [ ] Review audit logs
- [ ] Test incident response

---

## Incident Response

```typescript
// packages/shared/src/incident-response.ts
class IncidentResponse {
  async handleSecurityIncident(incident: SecurityIncident) {
    // 1. Immediate containment
    await this.suspendAgent(incident.agentId);
    await this.revokeTokens(incident.userId);
    
    // 2. Preserve evidence
    await this.captureLogs(incident.timeRange);
    await this.snapshotSystemState();
    
    // 3. Assess impact
    const impact = await this.assessImpact(incident);
    
    // 4. Notify stakeholders
    if (impact.severity === 'CRITICAL') {
      await this.notifyOnCall(incident);
      await this.notifySecurityTeam(incident);
    }
    
    // 5. Document
    await this.createIncidentReport(incident, impact);
    
    // 6. Recovery (after investigation)
    if (impact.dataExfiltrated) {
      await this.rotateCredentials();
      await this.notifyAffectedUsers();
    }
  }
}
```

---

## References

- Fortune: https://fortune.com/2026/02/12/openclaw-ai-agents-security-risks-beware/
- Security Boulevard: https://securityboulevard.com/2026/02/openclaw-open-source-ai-agent-application-attack-surface-and-security-risk-system-analysis/
- OpenClaw Security: https://docs.openclaw.ai/security
