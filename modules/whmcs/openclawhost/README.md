# OpenClaw Host - WHMCS Provisioning Module

A WHMCS provisioning module for managing OpenClaw VPS instances with AI capabilities.

## Features

- **Automated Provisioning**: Create, suspend, unsuspend, and terminate VPS instances
- **HMAC Authentication**: Secure API communication with HMAC-SHA256 signing
- **Single Sign-On (SSO)**: One-click access to instance dashboards
- **Client Area**: Beautiful Smarty templates for client management
- **Admin Controls**: Custom buttons for reboot, repair, and sync operations
- **WHMCS Hooks**: Auto-unsuspend on payment, welcome emails, daily health sync

## Requirements

- WHMCS 8.0 or higher
- PHP 8.1 or higher
- cURL extension enabled
- JSON extension enabled

## Installation

1. Upload the module files to your WHMCS installation:
   ```
   /modules/servers/openclawhost/
   ```

2. Install dependencies:
   ```bash
   cd /modules/servers/openclawhost
   composer install --no-dev
   ```

3. Create custom fields for your product in WHMCS Admin:
   - Go to **Setup** → **Products/Services** → **Products**
   - Edit your OpenClaw product
   - Under **Custom Fields**, add:
     | Field Name | Type | Admin Only |
     |------------|------|------------|
     | Instance ID | Text Box | Yes |
     | Dashboard URL | Text Box | Yes |
     | Subdomain | Text Box | Yes |

4. Configure the server in WHMCS:
   - Go to **Setup** → **Products/Services** → **Servers**
   - Click **Add New Server**
   - Fill in the details:
     | Field | Value |
     |-------|-------|
     | Name | OpenClaw API |
     | Hostname | api.yourdomain.com |
     | IP Address | (optional) |
     | Assigned IP Addresses | (optional) |
     | Status Address | (optional) |
     | Enabled | ✓ |
     | Name Servers | (optional) |
   - Under **Server Details**:
     | Field | Value |
     |-------|-------|
     | Type | OpenClaw Host |
     | Username | (leave blank) |
     | Password | Your API Key |
     | Access Hash | Your HMAC Secret |
   - Click **Test Connection** to verify

## Configuration Options

When setting up your product, configure these options:

| Option | Description | Default |
|--------|-------------|---------|
| Plan | Server tier (starter/professional/enterprise) | starter |
| Region | Server location | us-east |
| AI Preset | Default AI configuration | anthropic |
| Extra Storage GB | Additional NVMe storage | 0 |

## Available Regions

- `us-east` - US East Coast
- `us-west` - US West Coast
- `eu-frankfurt` - Frankfurt, Germany
- `eu-helsinki` - Helsinki, Finland
- `sg-singapore` - Singapore
- `jp-tokyo` - Tokyo, Japan

## AI Presets

- `anthropic` - Claude models
- `openai` - GPT models
- `ollama` - Local Ollama instance
- `multi` - Multi-model setup

## Module Functions

### Core Lifecycle
- `CreateAccount` - Provisions a new VPS instance
- `SuspendAccount` - Suspends an instance
- `UnsuspendAccount` - Unsuspends an instance
- `TerminateAccount` - Destroys an instance
- `ChangePackage` - Upgrades/downgrades instance plan

### SSO
- `ServiceSingleSignOn` - Client dashboard access
- `AdminSingleSignOn` - Admin dashboard access

### Admin Actions
- **Reboot Server** - Restarts the instance
- **Repair OpenClaw** - Runs repair procedures
- **View Dashboard** - Opens admin SSO to dashboard
- **Force Sync Status** - Syncs instance status with API

## Hooks

The module includes several WHMCS hooks:

- **InvoicePaid** - Auto-unsuspends services when invoice is paid
- **AfterModuleCreate** - Sends welcome email after provisioning
- **CancellationRequest** - Logs cancellation for data export
- **DailyCronJob** - Syncs health status for all instances
- **AfterModuleSuspend/Unsuspend/Terminate** - Logging and cleanup
- **PreModuleCreate** - Validates configuration before creation

## Testing

Run the test suite:

```bash
cd /modules/servers/openclawhost
composer install
./vendor/bin/phpunit
```

Run with coverage:

```bash
./vendor/bin/phpunit --coverage-html coverage
```

## API Client Usage

```php
use OpenClawHost\ApiClient;

$client = new ApiClient(
    'https://api.openclaw.com:2223',
    'your_api_key',
    'your_hmac_secret'
);

// Create instance
$response = $client->post('/api/instances', [
    'plan' => 'professional',
    'region' => 'eu-frankfurt',
    'ai_preset' => 'anthropic',
]);

// Get instance
$instance = $client->get("/api/instances/{$instanceId}");

// Delete instance
$client->delete("/api/instances/{$instanceId}");
```

## SSO Usage

```php
use OpenClawHost\SSO;

$sso = new SSO('your_hmac_secret');

// Generate client token
$tokenData = $sso->generateClientToken(
    clientId: 123,
    serviceId: 456,
    instanceId: 'inst_abc123',
    email: 'client@example.com'
);

// Build SSO URL
$url = $sso->buildClientUrl('dashboard.openclaw.com', $tokenData);

// Validate incoming token
$payload = $sso->validateToken(
    $_GET['token'],
    $_GET['signature'],
    (int)$_GET['ts']
);
```

## Troubleshooting

### Test Connection Fails
1. Verify API Key and HMAC Secret are correct
2. Check that the API server hostname is reachable
3. Ensure firewall allows connections on port 2222/2223
4. Verify SSL certificate is valid (if using HTTPS)

### Instance Not Found Errors
1. Check that the "Instance ID" custom field is populated
2. Verify the service was successfully provisioned
3. Check WHMCS activity log for API errors

### SSO Not Working
1. Verify HMAC Secret matches between WHMCS and dashboard
2. Check that token hasn't expired (5 minute default)
3. Ensure clock synchronization between servers

## File Structure

```
modules/servers/openclawhost/
├── openclawhost.php          # Main module file
├── hooks.php                 # WHMCS hooks
├── composer.json             # Composer dependencies
├── phpunit.xml              # PHPUnit configuration
├── lib/
│   ├── ApiClient.php        # HTTP client with HMAC auth
│   └── SSO.php              # SSO token handling
├── templates/
│   ├── clientarea.tpl       # Client area template
│   ├── admin.tpl            # Admin status panel
│   └── error.tpl            # Error display template
└── tests/
    └── OpenClawHostTest.php # Unit tests
```

## License

MIT License - See LICENSE file for details

## Support

For support, contact support@openclaw.host or visit https://openclaw.host/support
