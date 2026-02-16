# Domain-Driven Frontend Architecture

**Source**: James Code Lab  
**Framework**: Angular (applicable to React/Vue/Svelte)  
**Focus**: Scalable folder structure for large applications

---

## The Problem

### Traditional Technical-Layer Structure
```
src/
├── components/     ← Hundreds of files
├── services/       ← Hundreds of files  
├── pages/          ← Hundreds of files
├── utils/          ← Hundreds of files
└── store/          ← Hundreds of files
```

**Issues**:
- ❌ Unclear ownership
- ❌ Painful refactoring
- ❌ Folder bottlenecks
- ❌ Hard to navigate
- ❌ Team conflicts

---

## The Solution: Domain-First Architecture

### Core Principle
> "Organize by business domain first, not by technical layers"

### Structure
```
src/
├── domains/
│   ├── auth/
│   │   ├── components/     ← Login, Register, ForgotPassword
│   │   ├── services/       ← AuthService, TokenService
│   │   ├── store/          ← AuthState, AuthActions
│   │   ├── models/         ← User, Credentials
│   │   ├── guards/         ← AuthGuard
│   │   └── interceptors/   ← AuthInterceptor
│   │
│   ├── billing/
│   │   ├── components/     ← InvoiceList, PaymentForm
│   │   ├── services/       ← BillingService
│   │   ├── store/          ← BillingState
│   │   └── models/         ← Invoice, Payment
│   │
│   ├── dashboard/
│   │   ├── components/     ← Metrics, Charts, Alerts
│   │   ├── services/       ─ DashboardService
│   │   └── store/          ← DashboardState
│   │
│   └── instances/
│       ├── components/     ← InstanceList, InstanceDetail
│       ├── services/       ─ InstanceService
│       └── store/          ─ InstanceState
│
├── shared/
│   ├── components/         ← Button, Input, Modal
│   ├── services/           ─ Logger, HttpClient
│   └── utils/              ─ DateFormat, Validators
│
└── core/
    ├── config/             ← AppConfig, Environment
    ├── interceptors/       ← ErrorInterceptor
    └── guards/             ─ RootGuard
```

---

## Why This Scales

### 1. Clear Ownership ✅

**Each domain owns**:
- UI components
- API services
- State management
- Business logic

**Benefit**: Teams work independently without conflicts

**Example**:
```
Billing Team owns: src/domains/billing/*
Auth Team owns:    src/domains/auth/*
```

---

### 2. No Folder Bottlenecks ✅

**Before**:
```
components/
├── Button.tsx
├── Modal.tsx
├── LoginForm.tsx      ← Auth
├── RegisterForm.tsx   ← Auth
├── InvoiceList.tsx    ← Billing
├── PaymentForm.tsx    ← Billing
├── InstanceCard.tsx   ← Instances
├── ... (200+ files)
```

**After**:
```
domains/
├── auth/components/      ← 5 files
├── billing/components/   ← 8 files
├── instances/components/ ← 12 files
```

**Benefit**: Files distributed logically, easy to find

---

### 3. Easy Lazy Loading ✅

**Angular Example**:
```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./domains/auth/auth.module')
      .then(m => m.AuthModule)
  },
  {
    path: 'billing',
    loadChildren: () => import('./domains/billing/billing.module')
      .then(m => m.BillingModule)
  }
];
```

**Benefit**: Each domain loads on demand, better performance

---

### 4. Microfrontend Ready ✅

**Future Migration**:
```
Current:  src/domains/billing/*
          ↓
Future:   packages/billing-microfrontend/*
```

**Why it works**:
- Dependencies are local to domain
- Boundaries already enforced
- Minimal refactoring needed

---

### 5. Better Maintainability ✅

**Read the app like a business problem**:

```
"I need to fix the billing invoice calculation"

Before: Search 500 files in components/ + services/
After:  Go to src/domains/billing/ → find invoice logic
```

---

## Application to OpenClaw Hosting Dashboard

### Our Current Structure (Monorepo)
```
apps/
├── web/                    ← React Dashboard
│   ├── src/
│   │   ├── components/     ← Generic components
│   │   ├── pages/          ← Page components
│   │   ├── hooks/          ← Custom hooks
│   │   └── services/       ← API calls
│   └── package.json
│
└── api/                    ← Hono API
    └── src/
        ├── routes/         ← API routes
        ├── services/       ← Business logic
        └── middleware/     ← Auth, validation
```

### Proposed Domain-Driven Structure
```
apps/
├── web/
│   └── src/
│       ├── domains/
│       │   ├── auth/
│       │   │   ├── components/     ← Login, Register, MFA
│       │   │   ├── hooks/          ← useAuth, useLogin
│       │   │   ├── services/       ← authApi.ts
│       │   │   └── types/          ← AuthTypes.ts
│       │   │
│       │   ├── instances/
│       │   │   ├── components/     ← InstanceList, InstanceCard, InstanceDetail
│       │   │   ├── hooks/          ← useInstances, useCreateInstance
│       │   │   ├── services/       ← instancesApi.ts
│       │   │   └── types/          ← InstanceTypes.ts
│       │   │
│       │   ├── billing/
│       │   │   ├── components/     ← InvoiceList, PaymentMethod, UsageChart
│       │   │   ├── hooks/          ← useBilling, useInvoices
│       │   │   ├── services/       ─ billingApi.ts
│       │   │   └── types/          ─ BillingTypes.ts
│       │   │
│       │   ├── agents/
│       │   │   ├── components/     ← AgentList, AgentConfig, AgentLogs
│       │   │   ├── hooks/          ─ useAgents, useAgentStatus
│       │   │   ├── services/       ─ agentsApi.ts
│       │   │   └── types/          ─ AgentTypes.ts
│       │   │
│       │   └── monitoring/
│       │       ├── components/     ← Metrics, Alerts, Logs
│       │       ├── hooks/          ─ useMetrics, useAlerts
│       │       ├── services/       ─ monitoringApi.ts
│       │       └── types/          ─ MonitoringTypes.ts
│       │
│       ├── shared/
│       │   ├── components/         ← Button, Input, Modal, Card
│       │   ├── hooks/              ─ useDebounce, useLocalStorage
│       │   └── utils/              ─ formatDate, validateEmail
│       │
│       └── core/
│           ├── config/             ─ apiConfig, themeConfig
│           ├── providers/          ─ QueryProvider, ThemeProvider
│           └── router/             ─ AppRouter.tsx
│
└── api/
    └── src/
        ├── domains/
        │   ├── auth/
        │   │   ├── routes.ts
        │   │   ├── service.ts
        │   │   └── types.ts
        │   ├── instances/
        │   ├── billing/
        │   ├── agents/
        │   └── monitoring/
        │
        └── shared/
            ├── middleware/
            ├── utils/
            └── types/
```

---

## Benefits for OpenClaw

### 1. Team Scaling
```
Team A: Owns domains/instances/*
Team B: Owns domains/billing/*
Team C: Owns domains/agents/*
```

### 2. Feature Development
```
"Add new agent type"
→ Create src/domains/agents/components/NewAgentType.tsx
→ Add to src/domains/agents/services/agentsApi.ts
→ Update src/domains/agents/types/AgentTypes.ts
```

All changes in one folder!

### 3. Code Reviews
```
PR: "Add billing invoice export"
Files changed: 5 files in domains/billing/*
Reviewers: Billing team
```

Clear scope, clear ownership.

---

## Implementation Steps

### Phase 1: Identify Domains
```
OpenClaw Domains:
1. Auth (login, register, MFA, API keys)
2. Instances (VPS management, deployment)
3. Billing (invoices, payments, usage)
4. Agents (configuration, monitoring, logs)
5. Monitoring (metrics, alerts, dashboards)
6. Settings (profile, preferences, notifications)
```

### Phase 2: Create Domain Folders
```bash
mkdir -p apps/web/src/domains/{auth,instances,billing,agents,monitoring,settings}
mkdir -p apps/api/src/domains/{auth,instances,billing,agents,monitoring,settings}
```

### Phase 3: Migrate Gradually
```
Week 1: Move auth components
Week 2: Move instances components
Week 3: Move billing components
...
```

### Phase 4: Enforce Boundaries
```typescript
// domains/billing/services/billingApi.ts
// Only import from billing domain or shared/
import { apiClient } from '@/shared/api/client';
import { Invoice } from '../types/BillingTypes';

// ❌ DON'T: Import from other domains
// import { Instance } from '@/domains/instances/types';

// ✅ DO: Use shared types if needed
import { PaginationParams } from '@/shared/types/common';
```

---

## Code Examples

### Domain Component
```typescript
// domains/instances/components/InstanceCard.tsx
import { useInstance } from '../hooks/useInstance';
import { InstanceStatus } from '../types/InstanceTypes';
import { Card, Button } from '@/shared/components';

export function InstanceCard({ instanceId }: { instanceId: string }) {
  const { instance, start, stop } = useInstance(instanceId);
  
  return (
    <Card>
      <h3>{instance.name}</h3>
      <InstanceStatus status={instance.status} />
      <Button onClick={start}>Start</Button>
      <Button onClick={stop}>Stop</Button>
    </Card>
  );
}
```

### Domain Hook
```typescript
// domains/instances/hooks/useInstance.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { instancesApi } from '../services/instancesApi';

export function useInstance(id: string) {
  const { data: instance } = useQuery({
    queryKey: ['instance', id],
    queryFn: () => instancesApi.getById(id)
  });
  
  const start = useMutation({
    mutationFn: () => instancesApi.start(id)
  });
  
  const stop = useMutation({
    mutationFn: () => instancesApi.stop(id)
  });
  
  return { instance, start, stop };
}
```

### Domain API Service
```typescript
// domains/instances/services/instancesApi.ts
import { apiClient } from '@/shared/api/client';
import { Instance, CreateInstanceRequest } from '../types/InstanceTypes';

export const instancesApi = {
  getAll: () => 
    apiClient.get<Instance[]>('/instances'),
  
  getById: (id: string) => 
    apiClient.get<Instance>(`/instances/${id}`),
  
  create: (data: CreateInstanceRequest) => 
    apiClient.post<Instance>('/instances', data),
  
  start: (id: string) => 
    apiClient.post(`/instances/${id}/start`),
  
  stop: (id: string) => 
    apiClient.post(`/instances/${id}/stop`)
};
```

---

## Summary

### Key Takeaways

1. **Organize by domain, not by layer**
2. **Each domain is self-contained**
3. **Shared code goes in shared/**
4. **Core config goes in core/**
5. **Enforce domain boundaries**

### For OpenClaw Hosting

**Current**: Technical-layer organization  
**Proposed**: Domain-driven architecture

**Benefits**:
- ✅ Clear team ownership
- ✅ Easier onboarding
- ✅ Better scalability
- ✅ Microfrontend-ready
- ✅ Faster development

---

**Source**: James Code Lab  
**Pattern**: Domain-Driven Frontend Architecture  
**Applies to**: Angular, React, Vue, Svelte  
**Best for**: Large applications, team scaling
