<?php
/**
 * OpenClaw Host — WHMCS Provisioning Module
 * Handles lifecycle management of OpenClaw VPS instances
 * 
 * @package OpenClaw Host
 * @version 1.0.0
 * @author OpenClaw Team
 */

if (!defined("WHMCS")) {
    die("This file cannot be accessed directly");
}

require_once __DIR__ . '/lib/ApiClient.php';

/**
 * Module metadata for WHMCS
 * 
 * @return array Module metadata
 */
function openclawhost_MetaData(): array
{
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

/**
 * Configuration options displayed in product setup
 * 
 * @return array Configuration options
 */
function openclawhost_ConfigOptions(): array
{
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

/**
 * Test connection to the OpenClaw API server
 * 
 * @param array $params WHMCS module parameters
 * @return array Test result with success flag and error message
 */
function openclawhost_TestConnection(array $params): array
{
    try {
        $client = _openclawhost_getApiClient($params);
        $response = $client->get('/api/health');

        return [
            'success' => true,
            'error' => '',
        ];
    } catch (\Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
        ];
    }
}

/**
 * Create a new OpenClaw instance
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_CreateAccount(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);

        $response = $client->post('/api/instances', [
            'whmcs_service_id' => $params['serviceid'],
            'whmcs_client_id' => $params['clientsdetails']['userid'],
            'plan' => $params['configoption1'], // Plan
            'region' => $params['configoption2'], // Region
            'email' => $params['clientsdetails']['email'],
            'ai_preset' => $params['configoption3'], // AI Preset
            'extra_storage_gb' => (int) ($params['configoption4'] ?? 0),
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

        // Log successful creation
        logActivity("OpenClaw instance created: {$response['id']} for service {$serviceId}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw CreateAccount failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Suspend an OpenClaw instance
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_SuspendAccount(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);

        $client->post("/api/instances/{$instanceId}/suspend");

        logActivity("OpenClaw instance suspended: {$instanceId} for service {$params['serviceid']}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw SuspendAccount failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Unsuspend an OpenClaw instance
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_UnsuspendAccount(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);

        $client->post("/api/instances/{$instanceId}/unsuspend");

        logActivity("OpenClaw instance unsuspended: {$instanceId} for service {$params['serviceid']}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw UnsuspendAccount failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Terminate an OpenClaw instance
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_TerminateAccount(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);

        $client->delete("/api/instances/{$instanceId}");

        // Clear custom fields
        localAPI('UpdateClientProduct', [
            'serviceid' => $params['serviceid'],
            'customfields' => base64_encode(serialize([
                'Instance ID' => '',
                'Dashboard URL' => '',
            ])),
        ]);

        logActivity("OpenClaw instance terminated: {$instanceId} for service {$params['serviceid']}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw TerminateAccount failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Change package (upgrade/downgrade) for an OpenClaw instance
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_ChangePackage(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);

        $client->post("/api/instances/{$instanceId}/resize", [
            'new_plan' => $params['configoption1'],
            'extra_storage_gb' => (int) ($params['configoption4'] ?? 0),
        ]);

        logActivity("OpenClaw instance resized: {$instanceId} to plan {$params['configoption1']}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw ChangePackage failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Single Sign-On for client area
 * 
 * @param array $params WHMCS module parameters
 * @return array SSO result with redirect URL
 */
function openclawhost_ServiceSingleSignOn(array $params): array
{
    try {
        $instanceId = _openclawhost_getInstanceId($params);
        $timestamp = time();

        $payload = json_encode([
            'client_id' => $params['clientsdetails']['userid'],
            'service_id' => $params['serviceid'],
            'instance_id' => $instanceId,
            'email' => $params['clientsdetails']['email'],
            'timestamp' => $timestamp,
        ]);

        $signature = hash_hmac('sha256', $payload, $params['serveraccesshash']);
        $dashboardUrl = $params['serverhostname'];
        $protocol = $params['serversecure'] ? 'https' : 'http';

        $ssoUrl = "{$protocol}://{$dashboardUrl}/auth/sso?" . http_build_query([
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

/**
 * Single Sign-On for admin area
 * 
 * @param array $params WHMCS module parameters
 * @return array SSO result with redirect URL
 */
function openclawhost_AdminSingleSignOn(array $params): array
{
    try {
        $instanceId = _openclawhost_getInstanceId($params);
        $timestamp = time();

        $payload = json_encode([
            'admin_id' => $_SESSION['adminid'] ?? 0,
            'service_id' => $params['serviceid'],
            'instance_id' => $instanceId,
            'timestamp' => $timestamp,
            'is_admin' => true,
        ]);

        $signature = hash_hmac('sha256', $payload, $params['serveraccesshash']);
        $dashboardUrl = $params['serverhostname'];
        $protocol = $params['serversecure'] ? 'https' : 'http';

        $ssoUrl = "{$protocol}://{$dashboardUrl}/admin/sso?" . http_build_query([
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

/**
 * Client area output for the service
 * 
 * @param array $params WHMCS module parameters
 * @return array Template and variables for client area
 */
function openclawhost_ClientArea(array $params): array
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);
        $instance = $client->get("/api/instances/{$instanceId}");

        return [
            'tabOverviewReplacementTemplate' => 'templates/clientarea.tpl',
            'templateVariables' => [
                'instance' => $instance,
                'dashboardUrl' => $instance['url'] ?? '',
                'status' => $instance['status'] ?? 'unknown',
                'ip' => $instance['ip_address'] ?? 'N/A',
                'region' => $instance['region'] ?? 'N/A',
                'plan' => $instance['plan'] ?? 'N/A',
                'serviceid' => $params['serviceid'],
            ],
        ];
    } catch (\Exception $e) {
        return [
            'tabOverviewReplacementTemplate' => 'templates/error.tpl',
            'templateVariables' => [
                'error' => $e->getMessage(),
                'serviceid' => $params['serviceid'],
            ],
        ];
    }
}

/**
 * Admin custom buttons for additional actions
 * 
 * @return array Button labels and action names
 */
function openclawhost_AdminCustomButtonArray(): array
{
    return [
        'Reboot Server' => 'reboot',
        'Repair OpenClaw' => 'repair',
        'View Dashboard' => 'dashboard',
        'Force Sync Status' => 'syncstatus',
    ];
}

/**
 * Client custom buttons for additional actions
 * 
 * @return array Button labels and action names
 */
function openclawhost_ClientAreaCustomButtonArray(): array
{
    return [
        'Reboot Server' => 'reboot',
    ];
}

/**
 * Reboot the OpenClaw instance
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_reboot(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);

        $client->post("/api/instances/{$instanceId}/reboot");

        logActivity("OpenClaw instance rebooted: {$instanceId} for service {$params['serviceid']}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw reboot failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Repair the OpenClaw instance
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_repair(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);

        $client->post("/api/instances/{$instanceId}/repair");

        logActivity("OpenClaw instance repair initiated: {$instanceId} for service {$params['serviceid']}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw repair failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Open dashboard for admin
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_dashboard(array $params): string
{
    try {
        $ssoResult = openclawhost_AdminSingleSignOn($params);

        if ($ssoResult['success']) {
            header("Location: {$ssoResult['redirectTo']}");
            exit;
        }

        return $ssoResult['errorMsg'] ?? 'SSO failed';
    } catch (\Exception $e) {
        return $e->getMessage();
    }
}

/**
 * Force sync status with OpenClaw API
 * 
 * @param array $params WHMCS module parameters
 * @return string 'success' on success, error message on failure
 */
function openclawhost_syncstatus(array $params): string
{
    try {
        $client = _openclawhost_getApiClient($params);
        $instanceId = _openclawhost_getInstanceId($params);

        $instance = $client->get("/api/instances/{$instanceId}");

        // Update custom fields with latest info
        localAPI('UpdateClientProduct', [
            'serviceid' => $params['serviceid'],
            'customfields' => base64_encode(serialize([
                'Instance ID' => $instance['id'],
                'Dashboard URL' => $instance['url'],
            ])),
        ]);

        logActivity("OpenClaw instance status synced: {$instanceId}");

        return 'success';
    } catch (\Exception $e) {
        logActivity("OpenClaw syncstatus failed for service {$params['serviceid']}: " . $e->getMessage());
        return $e->getMessage();
    }
}

/**
 * Get the API client instance
 * 
 * @param array $params WHMCS module parameters
 * @return \OpenClawHost\ApiClient
 */
function _openclawhost_getApiClient(array $params): \OpenClawHost\ApiClient
{
    $protocol = $params['serversecure'] ? 'https' : 'http';
    $port = $params['serverport'] ?? ($params['serversecure'] ? '2223' : '2222');
    $baseUrl = "{$protocol}://{$params['serverhostname']}:{$port}";

    return new \OpenClawHost\ApiClient(
        $baseUrl,
        $params['serverpassword'], // API Key stored in server password field
        $params['serveraccesshash'] // HMAC secret in access hash field
    );
}

/**
 * Get the instance ID from custom fields
 * 
 * @param array $params WHMCS module parameters
 * @return string Instance ID
 * @throws \Exception If instance ID not found
 */
function _openclawhost_getInstanceId(array $params): string
{
    $customFields = $params['customfields'] ?? [];

    if (empty($customFields['Instance ID'])) {
        throw new \Exception('Instance ID not found. Was the service provisioned?');
    }

    return $customFields['Instance ID'];
}
