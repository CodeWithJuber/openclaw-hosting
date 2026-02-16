# Agent 5 — Testing & QA

> **Tools:** Vitest, Playwright, k6, PHPUnit  
> **Branch Prefix:** `feature/test-*`  
> **Location:** `tests/`, inline `__tests__/` dirs  
> **Starts Active:** Week 3 (parallel with Agents 1-4)  
> **Peak Activity:** Weeks 9-12

---

## Setup Commands

```bash
# Install test frameworks
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test
pnpm add -D msw supertest

# Install load testing
brew install k6

# Setup Playwright browsers
npx playwright install

# PHP testing (for WHMCS module)
cd modules/whmcs/openclawhost
composer require --dev phpunit/phpunit:^10 mockery/mockery:^1.6
```

---

## Test Strategy Overview

| Layer | Tool | Location | Run When | Target Coverage |
|-------|------|----------|----------|----------------|
| **Unit** | Vitest + PHPUnit | `*/__tests__/` | Every PR | 80%+ |
| **Integration** | Vitest + Supertest | `tests/integration/` | Every PR | Critical paths |
| **E2E** | Playwright | `tests/e2e/` | Merge to develop | Happy paths |
| **Load** | k6 | `tests/load/` | Weekly + pre-release | Capacity |
| **Security** | OWASP ZAP + manual | `tests/security/` | Pre-release | OWASP Top 10 |

---

## Task List

### Phase 1: Week 3-4 — Unit Test Foundation

#### Task 5.1: API Unit Tests

**Branch:** `feature/test-api-unit`

```typescript
// apps/api/src/__tests__/services/provisioner.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Provisioner } from "../../services/provisioner";

describe("Provisioner", () => {
  let provisioner: Provisioner;
  let mockHetzner: any;
  let mockCloudflare: any;
  let mockDb: any;

  beforeEach(() => {
    mockHetzner = {
      createServer: vi.fn().mockResolvedValue({ id: 123, ip: "1.2.3.4" }),
      deleteServer: vi.fn().mockResolvedValue(undefined),
      powerOff: vi.fn().mockResolvedValue(undefined),
      powerOn: vi.fn().mockResolvedValue(undefined),
    };
    mockCloudflare = {
      createARecord: vi.fn().mockResolvedValue("cf-record-123"),
      deleteRecord: vi.fn().mockResolvedValue(undefined),
    };
    provisioner = new Provisioner(mockHetzner, mockCloudflare, mockDb);
  });

  describe("provisionInstance", () => {
    it("creates VPS, DNS record, and DB entry", async () => {
      const result = await provisioner.provisionInstance({
        whmcs_service_id: 1,
        whmcs_client_id: 1,
        plan: "starter",
        region: "us-east",
        email: "test@test.com",
      });
      expect(mockHetzner.createServer).toHaveBeenCalledOnce();
      expect(mockCloudflare.createARecord).toHaveBeenCalledOnce();
      expect(result.status).toBe("provisioning");
      expect(result.subdomain).toBeDefined();
    });

    it("rolls back Hetzner server on Cloudflare failure", async () => {
      mockCloudflare.createARecord.mockRejectedValue(new Error("DNS failed"));
      await expect(provisioner.provisionInstance({
        whmcs_service_id: 1,
        whmcs_client_id: 1,
        plan: "starter",
        region: "us-east",
        email: "test@test.com",
      })).rejects.toThrow("DNS failed");
      expect(mockHetzner.deleteServer).toHaveBeenCalledWith(123);
    });

    it("rejects invalid plan", async () => {
      await expect(provisioner.provisionInstance({
        whmcs_service_id: 1,
        whmcs_client_id: 1,
        plan: "invalid" as any,
        region: "us-east",
        email: "test@test.com",
      })).rejects.toThrow();
    });

    it("rejects invalid region", async () => {
      await expect(provisioner.provisionInstance({
        whmcs_service_id: 1,
        whmcs_client_id: 1,
        plan: "starter",
        region: "moon-base" as any,
        email: "test@test.com",
      })).rejects.toThrow();
    });
  });

  describe("suspendInstance", () => {
    it("powers off VPS and updates DB", async () => {
      await provisioner.suspendInstance("instance-uuid");
      expect(mockHetzner.powerOff).toHaveBeenCalled();
    });

    it("throws for non-existent instance", async () => {
      mockDb.findInstance = vi.fn().mockResolvedValue(null);
      await expect(provisioner.suspendInstance("bad-id")).rejects.toThrow();
    });
  });

  describe("terminateInstance", () => {
    it("deletes VPS, DNS, and marks terminated", async () => {
      await provisioner.terminateInstance("instance-uuid");
      expect(mockHetzner.deleteServer).toHaveBeenCalled();
      expect(mockCloudflare.deleteRecord).toHaveBeenCalled();
    });
  });
});
```

**Additional unit test files to create:**

```
apps/api/src/__tests__/
  services/
    provisioner.test.ts     # Provisioning logic
    hetzner.test.ts         # Hetzner API client (mock HTTP)
    cloudflare.test.ts      # Cloudflare DNS client (mock HTTP)
    email.test.ts           # Email service
  middleware/
    apiKey.test.ts          # HMAC signature validation
    auth.test.ts            # JWT verification
    rateLimit.test.ts       # Rate limiting
  routes/
    instances.test.ts       # Instance CRUD routes
    auth.test.ts            # Auth routes
    webhooks.test.ts        # Webhook handler
    health.test.ts          # Health check
  utils/
    crypto.test.ts          # HMAC + encryption helpers
    validators.test.ts      # Zod schema validation
```

#### Task 5.2: HMAC Signature Tests (Critical Security)

**Branch:** `feature/test-hmac`

```typescript
// apps/api/src/__tests__/middleware/apiKey.test.ts

describe("API Key Middleware", () => {
  it("accepts valid HMAC signature", async () => {
    const body = JSON.stringify({ plan: "starter" });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", HMAC_SECRET)
      .update(body + timestamp).digest("hex");

    const res = await app.request("/api/instances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "X-Timestamp": String(timestamp),
        "X-Signature": signature,
      },
      body,
    });
    expect(res.status).not.toBe(401);
  });

  it("rejects invalid signature", async () => {
    const res = await app.request("/api/instances", {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "X-Timestamp": String(Math.floor(Date.now() / 1000)),
        "X-Signature": "invalid-signature",
      },
    });
    expect(res.status).toBe(401);
  });

  it("rejects expired timestamp (>5 min old)", async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const signature = createHmac("sha256", HMAC_SECRET)
      .update("" + oldTimestamp).digest("hex");

    const res = await app.request("/api/health", {
      headers: {
        "X-API-Key": API_KEY,
        "X-Timestamp": String(oldTimestamp),
        "X-Signature": signature,
      },
    });
    expect(res.status).toBe(401);
  });

  it("rejects missing API key header", async () => {
    const res = await app.request("/api/instances", { method: "POST" });
    expect(res.status).toBe(401);
  });
});
```

#### Task 5.3: WHMCS Module Unit Tests

**Branch:** `feature/test-whmcs-unit`

```php
// modules/whmcs/openclawhost/tests/ApiClientTest.php
<?php
use PHPUnit\Framework\TestCase;
use OpenClawHost\ApiClient;

class ApiClientTest extends TestCase {
  public function testHmacSignatureGeneration(): void {
    $client = new ApiClient("https://api.test.com", "test-key", "test-secret");
    // Use reflection to test private method
    $reflection = new ReflectionClass($client);
    $method = $reflection->getMethod('request');
    // Verify HMAC is correctly computed
  }

  public function testTimeoutHandling(): void {
    // Mock a slow server, verify 120s timeout
  }

  public function testErrorResponseParsing(): void {
    // Mock 400/500 responses, verify exception messages
  }
}

// modules/whmcs/openclawhost/tests/ModuleFunctionsTest.php
class ModuleFunctionsTest extends TestCase {
  public function testMetaDataReturnsRequiredFields(): void {
    $meta = openclawhost_MetaData();
    $this->assertArrayHasKey('DisplayName', $meta);
    $this->assertArrayHasKey('APIVersion', $meta);
    $this->assertEquals('1.1', $meta['APIVersion']);
    $this->assertTrue($meta['RequiresServer']);
  }

  public function testConfigOptionsHasAllPlans(): void {
    $config = openclawhost_ConfigOptions();
    $this->assertArrayHasKey('Plan', $config);
    $this->assertStringContainsString('starter', $config['Plan']['Options']);
    $this->assertStringContainsString('professional', $config['Plan']['Options']);
    $this->assertStringContainsString('enterprise', $config['Plan']['Options']);
  }

  public function testConfigOptionsHasAllRegions(): void {
    $config = openclawhost_ConfigOptions();
    $this->assertArrayHasKey('Region', $config);
    $this->assertStringContainsString('us-east', $config['Region']['Options']);
    $this->assertStringContainsString('eu-frankfurt', $config['Region']['Options']);
  }

  public function testAdminCustomButtonArray(): void {
    $buttons = openclawhost_AdminCustomButtonArray();
    $this->assertArrayHasKey('Reboot Server', $buttons);
    $this->assertEquals('reboot', $buttons['Reboot Server']);
  }
}
```

#### Task 5.4: Dashboard Component Tests

**Branch:** `feature/test-dashboard-unit`

```typescript
// apps/web/src/__tests__/components/StatusCard.test.tsx
import { render, screen } from "@testing-library/react";
import { StatusCard } from "../../components/instance/StatusCard";

describe("StatusCard", () => {
  it("shows green indicator for active status", () => {
    render(<StatusCard status="active" uptime={99.97} />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByTestId("status-indicator")).toHaveClass("bg-green-500");
  });

  it("shows red indicator for suspended status", () => {
    render(<StatusCard status="suspended" uptime={0} />);
    expect(screen.getByText("SUSPENDED")).toBeInTheDocument();
    expect(screen.getByTestId("status-indicator")).toHaveClass("bg-red-500");
  });

  it("shows spinner for provisioning status", () => {
    render(<StatusCard status="provisioning" uptime={0} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });
});

// apps/web/src/__tests__/components/ResourceGauges.test.tsx
describe("ResourceGauges", () => {
  it("renders CPU, RAM, Disk, Bandwidth gauges", () => {
    render(<ResourceGauges
      cpu={67}
      ram_used={4096}
      ram_total={8192}
      disk_used={30}
      disk_total={80}
      bandwidth_used={5}
      bandwidth_total={20}
    />);
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("RAM")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows warning color at 80%+ usage", () => {
    render(<ResourceGauges
      cpu={85}
      ram_used={7000}
      ram_total={8192}
      disk_used={70}
      disk_total={80}
      bandwidth_used={5}
      bandwidth_total={20}
    />);
    expect(screen.getByTestId("cpu-bar")).toHaveClass("bg-amber-500");
  });

  it("shows danger color at 90%+ usage", () => {
    render(<ResourceGauges
      cpu={95}
      ram_used={7700}
      ram_total={8192}
      disk_used={75}
      disk_total={80}
      bandwidth_used={5}
      bandwidth_total={20}
    />);
    expect(screen.getByTestId("cpu-bar")).toHaveClass("bg-red-500");
  });
});
```

---

### Phase 2: Week 5-8 — Integration Tests

#### Task 5.5: API Integration Tests

**Branch:** `feature/test-api-integration`

```typescript
// tests/integration/api/provisioning.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../../apps/api/src/index";
// Uses real test database, mocked cloud providers

describe("Provisioning Integration", () => {
  let instanceId: string;

  it("POST /api/instances creates instance", async () => {
    const res = await app.request("/api/instances", {
      method: "POST",
      headers: validWHMCSHeaders(),
      body: JSON.stringify({
        whmcs_service_id: 9999,
        whmcs_client_id: 9999,
        plan: "starter",
        region: "us-east",
        email: "integration@test.com",
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe("provisioning");
    expect(data.subdomain).toMatch(/^[a-z0-9]{7}$/);
    instanceId = data.id;
  });

  it("GET /api/instances/:id returns instance", async () => {
    const res = await app.request(`/api/instances/${instanceId}`, {
      headers: validJWTHeaders(),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(instanceId);
    expect(data.plan).toBe("starter");
  });

  it("POST /api/instances/:id/ready marks active", async () => {
    const res = await app.request(`/api/instances/${instanceId}/ready`, {
      method: "POST",
      headers: { "X-Callback-Token": callbackToken },
      body: JSON.stringify({
        openclaw_version: "2026.2.1",
        gateway_port: 18789
      }),
    });
    expect(res.status).toBe(200);

    // Verify status changed
    const check = await app.request(`/api/instances/${instanceId}`, {
      headers: validJWTHeaders(),
    });
    const data = await check.json();
    expect(data.status).toBe("active");
  });

  it("POST /api/instances/:id/suspend suspends", async () => {
    const res = await app.request(`/api/instances/${instanceId}/suspend`, {
      method: "POST",
      headers: validWHMCSHeaders(),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("suspended");
  });

  it("POST /api/instances/:id/unsuspend reactivates", async () => {
    const res = await app.request(`/api/instances/${instanceId}/unsuspend`, {
      method: "POST",
      headers: validWHMCSHeaders(),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("active");
  });

  it("DELETE /api/instances/:id terminates", async () => {
    const res = await app.request(`/api/instances/${instanceId}`, {
      method: "DELETE",
      headers: validWHMCSHeaders(),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("terminated");
  });

  it("GET terminated instance returns terminated status", async () => {
    const res = await app.request(`/api/instances/${instanceId}`, {
      headers: validWHMCSHeaders(),
    });
    const data = await res.json();
    expect(data.status).toBe("terminated");
  });
});

// tests/integration/api/auth.test.ts
describe("Authentication Integration", () => {
  it("SSO with valid HMAC returns JWT", async () => {
    const payload = { client_id: 1, service_id: 1, email: "test@test.com", timestamp: now() };
    const signature = hmac(JSON.stringify(payload), HMAC_SECRET);

    const res = await app.request("/api/auth/sso", {
      method: "POST",
      body: JSON.stringify({ ...payload, signature }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.redirect_url).toContain("/");
  });

  it("SSO with invalid HMAC returns 401", async () => {
    const res = await app.request("/api/auth/sso", {
      method: "POST",
      body: JSON.stringify({
        client_id: 1,
        service_id: 1,
        email: "test@test.com",
        timestamp: now(),
        signature: "bad-sig",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("SSO with expired timestamp returns 401", async () => {
    const oldTime = now() - 600;
    const payload = { client_id: 1, service_id: 1, email: "test@test.com", timestamp: oldTime };
    const signature = hmac(JSON.stringify(payload), HMAC_SECRET);

    const res = await app.request("/api/auth/sso", {
      method: "POST",
      body: JSON.stringify({ ...payload, signature }),
    });
    expect(res.status).toBe(401);
  });
});
```

#### Task 5.6: Webhook Integration Tests

**Branch:** `feature/test-webhooks`

```typescript
// tests/integration/api/webhooks.test.ts
describe("WHMCS Webhook Integration", () => {
  it("processes invoice.paid event", async () => { /* ... */ });
  it("processes service.cancelled event", async () => { /* ... */ });
  it("rejects unsigned webhook", async () => { /* ... */ });
  it("logs all received webhooks", async () => { /* ... */ });
  it("handles duplicate webhook idempotently", async () => { /* ... */ });
});
```

---

### Phase 3: Week 9-10 — E2E Tests

#### Task 5.7: Playwright E2E Tests

**Branch:** `feature/test-e2e`

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Login via SSO mock
    await page.goto("/auth/sso?token=test-token&signature=valid&ts=" + Date.now());
    await page.waitForURL("/");
  });

  test("overview page loads with instance data", async ({ page }) => {
    await expect(page.getByTestId("status-card")).toBeVisible();
    await expect(page.getByText("ACTIVE")).toBeVisible();
    await expect(page.getByTestId("cpu-gauge")).toBeVisible();
    await expect(page.getByTestId("ram-gauge")).toBeVisible();
  });

  test("reboot button shows confirmation dialog", async ({ page }) => {
    await page.getByRole("button", { name: "Reboot" }).click();
    await expect(page.getByText("Are you sure")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Are you sure")).not.toBeVisible();
  });

  test("navigate to all client pages", async ({ page }) => {
    const pages = [
      { nav: "Instance", heading: "Instance Management" },
      { nav: "Channels", heading: "Channel Manager" },
      { nav: "AI Settings", heading: "AI Model" },
      { nav: "Skills", heading: "Skills" },
      { nav: "Analytics", heading: "Analytics" },
    ];

    for (const p of pages) {
      await page.getByRole("link", { name: p.nav }).click();
      await expect(page.getByRole("heading", { name: new RegExp(p.heading, "i") })).toBeVisible();
    }
  });

  test("dark mode toggle persists", async ({ page }) => {
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveClass(/light/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/light/);
  });

  test("command palette opens with Cmd+K", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("Search")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Search")).not.toBeVisible();
  });

  test("channel wizard completes telegram setup", async ({ page }) => {
    await page.getByRole("link", { name: "Channels" }).click();
    await page.getByRole("button", { name: "Connect Telegram" }).click();
    await page.getByPlaceholder("Bot Token").fill("123456:ABC-DEF");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("Connected")).toBeVisible({ timeout: 10000 });
  });
});

// tests/e2e/admin.spec.ts
test.describe("Admin Dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/auth/sso?token=admin-token&signature=valid&ts=" + Date.now());
  });

  test("admin sees all instances table", async ({ page }) => {
    await page.getByRole("link", { name: "Admin" }).click();
    await page.getByRole("link", { name: "Instances" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("142 instances")).toBeVisible();
  });

  test("admin can filter by status", async ({ page }) => {
    await page.getByRole("link", { name: "Admin" }).click();
    await page.getByRole("link", { name: "Instances" }).click();
    await page.getByRole("combobox", { name: "Status" }).selectOption("suspended");
    await expect(page.getByText("8 instances")).toBeVisible();
  });
});
```

**Run E2E:**
```bash
npx playwright test
npx playwright test --headed    # Watch in browser
npx playwright show-report      # View HTML report
```

---

### Phase 4: Week 11-12 — Load + Security Tests

#### Task 5.8: Load Testing with k6

**Branch:** `feature/test-load`

```javascript
// tests/load/provisioning-load.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const provisionTime = new Trend("provision_time");
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    // Simulate 50 concurrent provisioning requests
    burst_provisioning: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 10 },
        { duration: "3m", target: 50 },
        { duration: "1m", target: 50 },
        { duration: "1m", target: 0 },
      ],
    },
    // Sustained API load
    steady_api: {
      executor: "constant-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 50,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"],      // 95th percentile < 3s
    http_req_failed: ["rate<0.01"],          // Error rate < 1%
    provision_time: ["p(95)<180000"],       // 95th provisioning < 3min
  },
};

const API_URL = __ENV.API_URL || "https://api.staging.yourdomain.com";
const API_KEY = __ENV.API_KEY;
const HMAC_SECRET = __ENV.HMAC_SECRET;

export default function () {
  // Health check
  const healthRes = http.get(`${API_URL}/api/health`);
  check(healthRes, { "health OK": (r) => r.status === 200 });

  // Simulate instance status check
  const statusRes = http.get(`${API_URL}/api/instances/test-id`, {
    headers: { Authorization: "Bearer test-jwt" },
  });
  check(statusRes, { "status OK": (r) => r.status === 200 || r.status === 404 });

  // Simulate metrics fetch
  const metricsRes = http.get(`${API_URL}/api/instances/test-id/metrics?period=1h`, {
    headers: { Authorization: "Bearer test-jwt" },
  });

  sleep(1);
}
```

**Run load tests:**
```bash
# Against staging
k6 run --env API_URL=https://api.staging.yourdomain.com tests/load/provisioning-load.js

# Generate HTML report
k6 run --out json=results.json tests/load/provisioning-load.js
# Then visualize with k6 dashboard or Grafana
```

#### Task 5.9: Security Test Checklist

**Branch:** `feature/test-security`

```markdown
## Security Test Cases

### Authentication
- [ ] API rejects requests without API key
- [ ] API rejects requests with wrong API key
- [ ] API rejects expired HMAC timestamps (>5 min)
- [ ] API rejects tampered HMAC signatures
- [ ] JWT tokens expire correctly
- [ ] JWT tokens cannot be forged
- [ ] SSO tokens are single-use
- [ ] Magic link tokens expire after 15 minutes
- [ ] Rate limiting blocks brute force (100/min authenticated, 20/min unauth)

### Authorization
- [ ] Client cannot access other client's instances
- [ ] Client cannot access admin endpoints
- [ ] WHMCS API key cannot access client-only endpoints
- [ ] Terminated instances cannot be reactivated by client

### Input Validation
- [ ] SQL injection attempts in search/filter params
- [ ] XSS in instance names, custom domains
- [ ] Path traversal in file manager endpoints
- [ ] Oversized request bodies rejected (>1MB)
- [ ] Invalid JSON bodies return 400 (not 500)

### Infrastructure
- [ ] OpenClaw gateway bound to 127.0.0.1 (not 0.0.0.0)
- [ ] UFW blocks all ports except 22, 80, 443, 9100
- [ ] SSH password auth disabled
- [ ] SSL/TLS certificate valid and grade A+
- [ ] CORS only allows dashboard origin
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)

### Data Protection
- [ ] API keys encrypted at rest (AES-256-GCM)
- [ ] Database connection uses SSL
- [ ] Logs do not contain passwords or API keys
- [ ] Customer data deleted within 30 days of termination
- [ ] Audit log records all admin actions
```

---

### Run All Tests

```bash
# Run everything
pnpm turbo test                    # All unit tests
pnpm turbo test:integration        # Integration tests
npx playwright test                # E2E tests
k6 run tests/load/provisioning-load.js  # Load tests

# Coverage report
pnpm vitest run --coverage
# Open coverage/index.html

# WHMCS tests
cd modules/whmcs/openclawhost && ./vendor/bin/phpunit tests/
```

---

## Deliverables Checklist

- [ ] API unit tests (20+ test files, 80%+ coverage)
- [ ] WHMCS module unit tests (5+ test files)
- [ ] Dashboard component tests (15+ test files)
- [ ] API integration tests (full lifecycle coverage)
- [ ] Webhook integration tests
- [ ] Playwright E2E tests (10+ scenarios)
- [ ] k6 load test scripts (3 scenarios)
- [ ] Security test checklist (40+ items verified)
- [ ] CI pipeline runs all tests on every PR
- [ ] Coverage reports generated automatically
- [ ] Test documentation with run instructions
