# Top 8 Claude Skills for DevOps 2026

**Source**: Pulumi Blog  
**Author**: Pulumi Team  
**Focus**: DevOps and infrastructure automation skills

---

## Overview

Skills package engineering expertise into reusable AI instructions. Unlike MCPs (which give tools), skills teach Claude **how to think** about specific problems.

### Skills vs MCPs Analogy

| Component | Analogy | Purpose |
|-----------|---------|---------|
| **Claude** | Mechanic | Does the work |
| **MCPs** | Tools (wrenches, lifts) | Access to external systems |
| **Skills** | User manuals, SOPs | Expertise and procedures |

---

## The 8 Essential DevOps Skills

### 1. Pulumi TypeScript Skill

**Repository**: `dirien/claude-skills`  
**Install**:
```bash
npx skills add https://github.com/dirien/claude-skills --skill pulumi-typescript
```

**Teaches Claude**:
- Pulumi with TypeScript
- ESC secrets management
- Component patterns
- Multi-cloud deployment
- OIDC instead of hardcoded keys

---

### 2. Pulumi ESC Skill

**Repository**: `pulumi/agent-skills`  
**Install**:
```bash
npx skills add https://github.com/pulumi/agent-skills --skill pulumi-esc
```

**Teaches Claude**:
- Environment, secrets, and configuration management
- OIDC for dynamic credentials
- External secret stores (AWS Secrets Manager, Vault)
- Layered environment composition (dev/staging/prod)

---

### 3. Pulumi Best Practices Skill

**Repository**: `pulumi/agent-skills`  
**Install**:
```bash
npx skills add https://github.com/pulumi/agent-skills --skill pulumi-best-practices
```

**Teaches Claude**:
- Resource dependencies
- ComponentResource patterns
- Secret encryption from day one
- Never create resources inside apply() callbacks
- Always run pulumi preview before deploy

---

### 4. Monitoring Expert Skill

**Repository**: `jeffallan/claude-skills`  
**Install**:
```bash
npx skills add https://github.com/jeffallan/claude-skills --skill monitoring-expert
```

**Teaches Claude**:
- Structured logging
- Metrics (Prometheus, DataDog)
- Distributed tracing
- Alerting
- Performance testing
- Golden signals

---

### 5. Kubernetes Specialist Skill

**Repository**: `jeffallan/claude-skills`  
**Install**:
```bash
npx skills add https://github.com/jeffallan/claude-skills --skill kubernetes-specialist
```

**Teaches Claude**:
- Production cluster management
- Security hardening (runAsNonRoot, resource limits)
- Liveness/readiness probes
- Pod disruption budgets
- RollingUpdate vs Recreate strategies

---

### 6. Systematic Debugging Skill

**Repository**: `obra/superpowers`  
**Install**:
```bash
npx skills add https://github.com/obra/superpowers --skill systematic-debugging
```

**Teaches Claude**:
- Four-phase framework:
  1. Root cause investigation
  2. Pattern analysis
  3. Hypothesis testing
  4. Verified implementation
- Asks clarifying questions before suggesting fixes
- Investigates before prescribing

---

### 7. Security Review Skill

**Repository**: `sickn33/antigravity-awesome-skills`  
**Install**:
```bash
npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill security-review
```

**Teaches Claude**:
- Secrets management
- Input validation
- SQL injection prevention
- XSS/CSRF prevention
- Dependency auditing
- Infrastructure security (S3 encryption, bucket policies)

---

### 8. DevOps Engineer Skill

**Repository**: `jeffallan/claude-skills`  
**Install**:
```bash
npx skills add https://github.com/jeffallan/claude-skills --skill devops-engineer
```

**Teaches Claude**:
- CI/CD pipelines
- Container management
- Deployment strategies (blue-green, canary)
- Infrastructure as code (AWS, GCP, Azure)
- Constraints: no prod deploys without approval, no secrets in code

---

## Additional Recommended Skills

### GitOps Workflow
```bash
npx skills add https://github.com/wshobson/agents --skill gitops-workflow
```
ArgoCD and Flux CD for automated Kubernetes deployments

### GitHub Actions Templates
```bash
npx skills add https://github.com/wshobson/agents --skill github-actions-templates
```
CI/CD workflows, Docker builds, security scanning

### Cost Optimization
```bash
npx skills add https://github.com/wshobson/agents --skill cost-optimization
```
Cloud cost reduction across AWS, Azure, GCP

### Incident Runbook Templates
```bash
npx skills add https://github.com/wshobson/agents --skill incident-runbook-templates
```
SEV1-4 severity model, escalation procedures, communication templates

### SRE Engineer
```bash
npx skills add https://github.com/jeffallan/claude-skills --skill sre-engineer
```
SLI/SLO management, error budgets, reliability assessments

### K8s Security Policies
```bash
npx skills add https://github.com/wshobson/agents --skill k8s-security-policies
```
NetworkPolicies, Pod Security Standards, RBAC, OPA Gatekeeper

---

## Complete Setup

### Install All Skills
```bash
mkdir -p my-project && cd my-project

# Pulumi skills
npx skills add https://github.com/dirien/claude-skills --skill pulumi-typescript
npx skills add https://github.com/pulumi/agent-skills --skill pulumi-esc
npx skills add https://github.com/pulumi/agent-skills --skill pulumi-best-practices

# Debugging & Security
npx skills add https://github.com/obra/superpowers --skill systematic-debugging
npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill security-review

# Operations
npx skills add https://github.com/jeffallan/claude-skills --skill monitoring-expert
npx skills add https://github.com/jeffallan/claude-skills --skill kubernetes-specialist
npx skills add https://github.com/jeffallan/claude-skills --skill devops-engineer
npx skills add https://github.com/jeffallan/claude-skills --skill sre-engineer

# Workflows
npx skills add https://github.com/wshobson/agents --skill gitops-workflow
npx skills add https://github.com/wshobson/agents --skill github-actions-templates
npx skills add https://github.com/wshobson/agents --skill cost-optimization
npx skills add https://github.com/wshobson/agents --skill incident-runbook-templates
npx skills add https://github.com/wshobson/agents --skill k8s-security-policies
```

---

## Security Warning

⚠️ **13.4% of skills have critical vulnerabilities** (Snyk research, Feb 2026)

**Safety checklist**:
- [ ] Read skill source before installing (markdown/YAML files)
- [ ] Check repository (stars, contributors, commit history)
- [ ] Run `uvx mcp-scan@latest --skills` to scan for malicious patterns
- [ ] Avoid skills that fetch external content at runtime
- [ ] Stick to known repositories with visible maintainers

---

## For OpenClaw Hosting

### Skills to Add

We should create custom skills for:

1. **OpenClaw Deployment**
   - Multi-agent orchestration
   - VPS provisioning
   - Docker deployment

2. **OpenClaw Security**
   - JWT RS256 implementation
   - AES-256-GCM encryption
   - Rate limiting patterns

3. **OpenClaw Monitoring**
   - Agent health checks
   - Resource monitoring
   - Alert configuration

4. **OpenClaw Best Practices**
   - Agent design patterns
   - RAG implementation
   - Workflow automation

---

## Conclusion

### Key Takeaways

1. **Skills teach expertise**, MCPs give tools
2. **Progressive disclosure** - skills load only when needed
3. **Portable** - works across Claude, Cursor, Copilot
4. **Stackable** - combine multiple skills for complex tasks
5. **Security matters** - vet all skills before installing

### Recommended for Our Platform

**Essential**:
- pulumi-typescript
- pulumi-best-practices
- systematic-debugging
- security-review
- monitoring-expert

**Optional**:
- kubernetes-specialist
- devops-engineer
- sre-engineer

---

**Source**: Pulumi Blog - Top 8 Claude Skills for DevOps 2026  
**Skills Count**: 8 core + 5 additional  
**Security**: 13.4% vulnerability rate in community skills
