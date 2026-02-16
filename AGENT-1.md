# Agent 1 — WHMCS Provisioning Module Developer

> **Language:** PHP 8.1+  
> **Branch Prefix:** `feature/whmcs-*`  
> **Location:** `modules/whmcs/openclawhost/`  
> **Depends On:** Agent 2 (API endpoints must match API-CONTRACTS.md)  
> **Reference:** https://github.com/WHMCS/sample-provisioning-module

---

## Setup Commands

```bash
# Clone the WHMCS sample module for reference
git clone https://github.com/WHMCS/sample-provisioning-module.git /tmp/whmcs-sample

# Create module directory
mkdir -p modules/whmcs/openclawhost/{lib,templates,tests}

# Copy sample structure
cp /tmp/whmcs-sample/modules/servers/provisioningmodule/provisioningmodule.php \
  modules/whmcs/openclawhost/openclawhost.php

# Install PHP test dependencies
cd modules/whmcs/openclawhost
composer init --name="openclawhost/whmcs-module" --type="whmcs-module"
composer require --dev phpunit/phpunit:^10
```

---

## Task List (Ordered by Priority)

### Phase 1: Week 1-2 — Module Skeleton

#### Task 1.1: MetaData + ConfigOptions

**Branch:** `feature/whmcs-metadata`

Create `openclawhost.php` with:

```php
<?php
/**
 * OpenClaw Host — WHMCS Provisioning Module
 * Handles lifecycle management of OpenClaw VPS instances
 */

if (!defined("WHMCS")) die("This file cannot be accessed directly");

function openclawhost_MetaData() {
  return [
    'DisplayName' => 'OpenClaw Host',
    'APIVersion' => '1.1',
    'RequiresServer' => true,
    'DefaultNonSSLPort' => '2222',
    'DefaultSSLPort' => '2223',
    'ServiceSingleSignOnLabel' => 'Open Dashboard',
    'AdminSingleSignOnLabel' => 'Admin Dashboard',
  ];
}

function openclawhost_ConfigOptions() {
  return [
    'Plan' => [
      'Type' => 'dropdown',
      'Options' => 'starter|professional|enterprise',
      'Description' => 'Server plan tier',
      'Default' => 'starter',
    ],
    'Region' => [
      'Type' => 'dropdown',
      'Options' => 'us-east|us-west|eu-frankfurt|eu-helsinki|sg-singapore|jp-tokyo',
      'Description' => 'Server region',
      'Default' => 'us-east',
    ],
    'AI Preset' => [
      'Type' => 'dropdown',
      'Options' => 'anthropic|openai|ollama|multi',
      'Description' => 'Default AI model configuration',
      'Default' => 'anthropic',
    ],
    'Extra Storage GB' => [
      'Type' => 'text',
      'Size' => 5,
      'Description' => 'Additional NVMe storage in GB',
      'Default' => '0',
    ],
  ];
}
```

**Acceptance Criteria:**
- [ ] Module appears in WHMCS Admin → Setup → Products → Servers
- [ ] All config options render correctly in product setup
- [ ] TestConnection() calls GET /api/health and returns success/failure

#### Task 1.2: API Client Library

**Branch:** `feature/whmcs-api-client`

Create `lib/ApiClient.php`:

```php
<?php

namespace OpenClawHost;

class ApiClient {
  private string $baseUrl;
  private string $apiKey;
  private string $hmacSecret;

  public function __construct(string $baseUrl, string $apiKey, string $hmacSecret) {
    $this->baseUrl = rtrim($baseUrl, '/');
    $this->apiKey = $apiKey;
    $this->hmacSecret = $hmacSecret;
  }

  public function post(string $endpoint, array $data = []): array {
    return $this->request('POST', $endpoint, $data);
  }

  public function get(string $endpoint): array {
    return $this->request('GET', $endpoint);
  }

  public function delete(string $endpoint): array {
    return $this->request('DELETE', $endpoint);
  }

  private function request(string $method, string $endpoint, array $data = []): array {
    $url = $this->baseUrl . $endpoint;
    $timestamp = time();
    $body = !empty($data) ? json_encode($data) : '';
    $signature = hash_hmac('sha256', $body . $timestamp, $this->hmacSecret);

    $headers = [
      'Content-Type: application/json',
      'X-API-Key: ' . $this->apiKey,
      'X-Timestamp: ' . $timestamp,
      'X-Signature: ' . $signature,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_CUSTOMREQUEST => $method,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_TIMEOUT => 120,
      CURLOPT_POSTFIELDS => $body ?: null,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
      throw new \Exception("API request failed: $error");
    }

    $result = json_decode($response, true);
    if ($httpCode >= 400) {
      throw new \Exception($result['error'] ?? "API error: HTTP $httpCode");
    }

    return $result;
  }
}
```

**Acceptance Criteria:**
- [ ] HMAC signature generation matches Agent 2's verification
- [ ] Timeout handling works (120s for provisioning)
- [ ] Error responses properly formatted for WHMCS

---

### Phase 2: Week 3-4 — Core Lifecycle Functions

#### Task 1.3: CreateAccount

**Branch:** `feature/whmcs-create-account`

```php
function openclawhost_CreateAccount(array $params): string {
  try {
    $client = _openclawhost_getApiClient($params);
    
    $response = $client->post('/api/instances', [
      'whmcs_service_id' => $params['serviceid'],
      'whmcs_client_id' => $params['clientsdetails']['userid'],
      'plan' => $params['configoption1'], // Plan
      'region' => $params['configoption2'], // Region
      'email' => $params['clientsdetails']['email'],
      'ai_preset' => $params['configoption3'], // AI Preset
    ]);

    // Store instance ID in WHMCS custom field
    $serviceId = $params['serviceid'];
    localAPI('UpdateClientProduct', [
      'serviceid' => $serviceId,
      'customfields' => base64_encode(serialize([
        'Instance ID' => $response['id'],
        'Dashboard URL' => $response['url'],
      ])),
    ]);

    return 'success';
  } catch (\Exception $e) {
    return $e->getMessage();
  }
}
```

#### Task 1.4: Suspend / Unsuspend / Terminate

**Branch:** `feature/whmcs-lifecycle`

Implement all three functions following the same pattern as CreateAccount.

```php
function openclawhost_SuspendAccount(array $params): string {
  try {
    $client = _openclawhost_getApiClient($params);
    $instanceId = _openclawhost_getInstanceId($params);
    $client->post("/api/instances/{$instanceId}/suspend");
    return 'success';
  } catch (\Exception $e) {
    return $e->getMessage();
  }
}

function openclawhost_UnsuspendAccount(array $params): string {
  try {
    $client = _openclawhost_getApiClient($params);
    $instanceId = _openclawhost_getInstanceId($params);
    $client->post("/api/instances/{$instanceId}/unsuspend");
    return 'success';
  } catch (\Exception $e) {
    return $e->getMessage();
  }
}

function openclawhost_TerminateAccount(array $params): string {
  try {
    $client = _openclawhost_getApiClient($params);
    $instanceId = _openclawhost_getInstanceId($params);
    $client->delete("/api/instances/{$instanceId}");
    return 'success';
  } catch (\Exception $e) {
    return $e->getMessage();
  }
}
```

#### Task 1.5: ChangePackage (Upgrade/Downgrade)

**Branch:** `feature/whmcs-change-package`

```php
function openclawhost_ChangePackage(array $params): string {
  try {
    $client = _openclawhost_getApiClient($params);
    $instanceId = _openclawhost_getInstanceId($params);
    
    $client->post("/api/instances/{$instanceId}/resize", [
      'new_plan' => $params['configoption1'],
    ]);
    
    return 'success';
  } catch (\Exception $e) {
    return $e->getMessage();
  }
}
```

**Acceptance Criteria for Phase 2:**
- [ ] CreateAccount provisions a real instance on staging
- [ ] SuspendAccount stops the VPS
- [ ] UnsuspendAccount restarts the VPS
- [ ] TerminateAccount destroys VPS + DNS
- [ ] ChangePackage resizes the VPS
- [ ] All functions return 'success' or error message string
- [ ] Instance ID stored in WHMCS custom fields

---

### Phase 3: Week 5-6 — SSO + Client Area + Hooks

#### Task 1.6: SSO (Single Sign-On to Dashboard)

**Branch:** `feature/whmcs-sso`

```php
function openclawhost_ServiceSingleSignOn(array $params): array {
  try {
    $instanceId = _openclawhost_getInstanceId($params);
    $timestamp = time();
    
    $payload = json_encode([
      'client_id' => $params['clientsdetails']['userid'],
      'service_id' => $params['serviceid'],
      'email' => $params['clientsdetails']['email'],
      'timestamp' => $timestamp,
    ]);
    
    $signature = hash_hmac('sha256', $payload, $params['serveraccesshash']);
    $dashboardUrl = $params['serverhostname'];
    
    $ssoUrl = "{$dashboardUrl}/auth/sso?" . http_build_query([
      'token' => base64_encode($payload),
      'signature' => $signature,
      'ts' => $timestamp,
    ]);

    return [
      'success' => true,
      'redirectTo' => $ssoUrl,
    ];
  } catch (\Exception $e) {
    return ['success' => false, 'errorMsg' => $e->getMessage()];
  }
}
```

#### Task 1.7: Client Area Output

**Branch:** `feature/whmcs-client-area`

```php
function openclawhost_ClientArea(array $params): array {
  try {
    $client = _openclawhost_getApiClient($params);
    $instanceId = _openclawhost_getInstanceId($params);
    $instance = $client->get("/api/instances/{$instanceId}");

    return [
      'tabOverviewReplacementTemplate' => 'templates/clientarea.tpl',
      'templateVariables' => [
        'instance' => $instance,
        'dashboardUrl' => $instance['url'],
        'status' => $instance['status'],
        'ip' => $instance['ip_address'],
        'region' => $instance['region'],
        'plan' => $instance['plan'],
      ],
    ];
  } catch (\Exception $e) {
    return [
      'tabOverviewReplacementTemplate' => 'templates/error.tpl',
      'templateVariables' => ['error' => $e->getMessage()],
    ];
  }
}
```

#### Task 1.8: Admin Custom Buttons

**Branch:** `feature/whmcs-admin-buttons`

```php
function openclawhost_AdminCustomButtonArray(): array {
  return [
    'Reboot Server' => 'reboot',
    'Repair OpenClaw' => 'repair',
    'View Dashboard' => 'dashboard',
    'Force Sync Status' => 'syncstatus',
  ];
}

function openclawhost_reboot(array $params): string {
  try {
    $client = _openclawhost_getApiClient($params);
    $instanceId = _openclawhost_getInstanceId($params);
    $client->post("/api/instances/{$instanceId}/reboot");
    return 'success';
  } catch (\Exception $e) {
    return $e->getMessage();
  }
}
```

#### Task 1.9: WHMCS Hooks

**Branch:** `feature/whmcs-hooks`

Create `hooks.php`:

```php
<?php

use WHMCS\Database\Capsule;

// Auto-unsuspend on invoice payment
add_hook('InvoicePaid', 1, function($vars) {
  $invoiceId = $vars['invoiceid'];
  
  // Find related services and unsuspend if applicable
  $items = Capsule::table('tblinvoiceitems')
    ->where('invoiceid', $invoiceId)
    ->where('type', 'Hosting')
    ->get();
  
  foreach ($items as $item) {
    $service = Capsule::table('tblhosting')
      ->where('id', $item->relid)
      ->where('domainstatus', 'Suspended')
      ->first();
    
    if ($service && $service->server) {
      // Trigger unsuspend via module
      localAPI('ModuleUnsuspend', ['serviceid' => $service->id]);
    }
  }
});

// Welcome email after provisioning
add_hook('AfterModuleCreate', 1, function($vars) {
  if ($vars['params']['moduletype'] !== 'openclawhost') return;
  
  // Send custom welcome email template
  localAPI('SendEmail', [
    'id' => $vars['params']['serviceid'],
    'messagename' => 'OpenClaw Instance Provisioned',
    'customtype' => 'product',
  ]);
});

// Data export before termination
add_hook('CancellationRequest', 1, function($vars) {
  // Trigger data export job for the instance
  logActivity("OpenClaw cancellation requested for service #{$vars['relid']}");
});

// Daily health sync
add_hook('DailyCronJob', 1, function($vars) {
  // Sync health status for all active OpenClaw instances
  $services = Capsule::table('tblhosting')
    ->where('server', '>', 0)
    ->where('domainstatus', 'Active')
    ->get();
  
  foreach ($services as $service) {
    // Call API to get health status
    // Update WHMCS bandwidth usage fields
  }
});
```

**Acceptance Criteria for Phase 3:**
- [ ] SSO redirects to dashboard with valid JWT
- [ ] Client area shows instance status, IP, dashboard link
- [ ] Admin buttons (reboot, repair) execute correctly
- [ ] Invoice payment auto-unsuspends
- [ ] Welcome email fires after provisioning

---

### Phase 4: Week 7-8 — Testing + Smarty Templates

#### Task 1.10: Client Area Template

**Branch:** `feature/whmcs-templates`

Create `templates/clientarea.tpl`:

```smarty
<div class="openclaw-client-area">
  <div class="row">
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading"><h3>Instance Status</h3></div>
        <div class="panel-body">
          <p><strong>Status:</strong> 
            <span class="label label-{if $status eq 'active'}success{elseif $status eq 'suspended'}danger{else}warning{/if}">
              {$status|upper}
            </span>
          </p>
          <p><strong>IP Address:</strong> {$ip}</p>
          <p><strong>Region:</strong> {$region}</p>
          <p><strong>Plan:</strong> {$plan|upper}</p>
        </div>
      </div>
    </div>
    
    <div class="col-md-6">
      <div class="panel panel-primary">
        <div class="panel-heading"><h3>Quick Actions</h3></div>
        <div class="panel-body">
          <a href="{$dashboardUrl}" target="_blank" class="btn btn-primary btn-lg btn-block">
            Open Dashboard
          </a>
          
          <form method="post" action="clientarea.php?action=productdetails">
            <input type="hidden" name="id" value="{$serviceid}" />
            <input type="hidden" name="modop" value="custom" />
            <input type="hidden" name="a" value="reboot" />
            <button type="submit" class="btn btn-warning btn-block" style="margin-top:10px;">
              Reboot Server
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Task 1.11: Unit Tests

**Branch:** `feature/whmcs-tests`

```php
// tests/OpenClawHostTest.php
class OpenClawHostTest extends \PHPUnit\Framework\TestCase {
  public function testMetaDataReturnsRequiredFields(): void {
    $meta = openclawhost_MetaData();
    $this->assertArrayHasKey('DisplayName', $meta);
    $this->assertArrayHasKey('APIVersion', $meta);
    $this->assertEquals('1.1', $meta['APIVersion']);
  }

  public function testConfigOptionsHasAllPlans(): void {
    $config = openclawhost_ConfigOptions();
    $this->assertStringContainsString('starter', $config['Plan']['Options']);
    $this->assertStringContainsString('professional', $config['Plan']['Options']);
    $this->assertStringContainsString('enterprise', $config['Plan']['Options']);
  }

  public function testApiClientGeneratesValidHMAC(): void {
    $client = new \OpenClawHost\ApiClient('https://api.test.com', 'key', 'secret');
    // Test HMAC generation
  }
}
```

**Run tests:**
```bash
cd modules/whmcs/openclawhost
./vendor/bin/phpunit tests/
```

---

## Helper Functions

```php
// Add to bottom of openclawhost.php

function _openclawhost_getApiClient(array $params): \OpenClawHost\ApiClient {
  require_once __DIR__ . '/lib/ApiClient.php';
  
  return new \OpenClawHost\ApiClient(
    'https://' . $params['serverhostname'] . ':' . $params['serverport'],
    $params['serverpassword'], // API Key stored in server password field
    $params['serveraccesshash'] // HMAC secret in access hash field
  );
}

function _openclawhost_getInstanceId(array $params): string {
  $customFields = $params['customfields'];
  if (empty($customFields['Instance ID'])) {
    throw new \Exception('Instance ID not found. Was the service provisioned?');
  }
  return $customFields['Instance ID'];
}
```

## WHMCS Server Configuration

When adding a server in WHMCS Admin → Setup → Servers:

| Field | Value |
|-------|-------|
| Name | OpenClaw API |
| Hostname | api.yourdomain.com |
| Port | 2222 |
| Password | `<WHMCS_API_KEY>` |
| Access Hash | `<WHMCS_HMAC_SECRET>` |
| Module | openclawhost |

## Custom Fields Required

Create these custom fields for the product in WHMCS:

| Field Name | Type | Admin Only |
|-----------|------|-----------|
| Instance ID | Text | Yes |
| Dashboard URL | Text | Yes |
| Subdomain | Text | Yes |

---

## Deliverables Checklist

- [ ] `openclawhost.php` — All module functions
- [ ] `lib/ApiClient.php` — HTTP client with HMAC
- [ ] `lib/SSO.php` — SSO token generation
- [ ] `hooks.php` — All WHMCS hooks
- [ ] `templates/clientarea.tpl` — Client area view
- [ ] `templates/admin.tpl` — Admin status panel
- [ ] `tests/OpenClawHostTest.php` — Unit tests
- [ ] `logo.png` — Module branding (200x200px)
- [ ] Documentation: setup guide for WHMCS admins
