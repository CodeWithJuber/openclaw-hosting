<?php
/**
 * OpenClaw Host WHMCS Hooks
 * 
 * Hooks for integrating with WHMCS events
 * 
 * @package OpenClawHost
 * @version 1.0.0
 */

use WHMCS\Database\Capsule;

if (!defined("WHMCS")) {
    die("This file cannot be accessed directly");
}

/**
 * Auto-unsuspend service when invoice is paid
 * 
 * This hook automatically unsuspends OpenClaw instances when the
 * associated invoice is marked as paid.
 */
add_hook('InvoicePaid', 1, function ($vars) {
    $invoiceId = $vars['invoiceid'];

    try {
        // Find hosting items in this invoice
        $items = Capsule::table('tblinvoiceitems')
            ->where('invoiceid', $invoiceId)
            ->where('type', 'Hosting')
            ->get();

        foreach ($items as $item) {
            // Get service details
            $service = Capsule::table('tblhosting')
                ->where('id', $item->relid)
                ->first();

            if (!$service || $service->domainstatus !== 'Suspended') {
                continue;
            }

            // Check if this is an OpenClaw service
            $server = Capsule::table('tblservers')
                ->where('id', $service->server)
                ->first();

            if (!$server || $server->type !== 'openclawhost') {
                continue;
            }

            // Trigger unsuspend
            $result = localAPI('ModuleUnsuspend', [
                'serviceid' => $service->id,
            ]);

            if ($result['result'] === 'success') {
                logActivity("OpenClaw auto-unsuspended service {$service->id} after invoice payment");
            } else {
                logActivity("OpenClaw auto-unsuspend failed for service {$service->id}: " . ($result['message'] ?? 'Unknown error'));
            }
        }
    } catch (\Exception $e) {
        logActivity("OpenClaw InvoicePaid hook error: " . $e->getMessage());
    }
});

/**
 * Send welcome email after successful provisioning
 * 
 * This hook sends a custom welcome email when an OpenClaw instance
 * is successfully created.
 */
add_hook('AfterModuleCreate', 1, function ($vars) {
    if (($vars['params']['moduletype'] ?? '') !== 'openclawhost') {
        return;
    }

    try {
        $serviceId = $vars['params']['serviceid'];

        // Send custom welcome email
        $result = localAPI('SendEmail', [
            'id' => $serviceId,
            'messagename' => 'OpenClaw Instance Provisioned',
            'customtype' => 'product',
        ]);

        if ($result['result'] === 'success') {
            logActivity("OpenClaw welcome email sent for service {$serviceId}");
        } else {
            logActivity("OpenClaw welcome email failed for service {$serviceId}: " . ($result['message'] ?? 'Unknown error'));
        }
    } catch (\Exception $e) {
        logActivity("OpenClaw AfterModuleCreate hook error: " . $e->getMessage());
    }
});

/**
 * Log cancellation requests for data export
 * 
 * This hook logs when a cancellation is requested so that
 * data export can be triggered before termination.
 */
add_hook('CancellationRequest', 1, function ($vars) {
    try {
        $serviceId = $vars['relid'] ?? 0;

        if ($serviceId === 0) {
            return;
        }

        // Get service details
        $service = Capsule::table('tblhosting')
            ->where('id', $serviceId)
            ->first();

        if (!$service) {
            return;
        }

        // Check if this is an OpenClaw service
        $server = Capsule::table('tblservers')
            ->where('id', $service->server)
            ->first();

        if (!$server || $server->type !== 'openclawhost') {
            return;
        }

        // Log the cancellation request
        logActivity("OpenClaw cancellation requested for service #{$serviceId}");

        // Optionally trigger data export here
        // This could queue a job to export user data before termination
    } catch (\Exception $e) {
        logActivity("OpenClaw CancellationRequest hook error: " . $e->getMessage());
    }
});

/**
 * Daily health sync for all OpenClaw instances
 * 
 * This hook runs during the daily cron job to sync instance
 * status and usage data from the OpenClaw API.
 */
add_hook('DailyCronJob', 1, function ($vars) {
    try {
        // Get all OpenClaw servers
        $servers = Capsule::table('tblservers')
            ->where('type', 'openclawhost')
            ->where('disabled', 0)
            ->get();

        foreach ($servers as $server) {
            // Get active services on this server
            $services = Capsule::table('tblhosting')
                ->where('server', $server->id)
                ->where('domainstatus', 'Active')
                ->get();

            foreach ($services as $service) {
                // Get instance ID from custom fields
                $instanceIdField = Capsule::table('tblcustomfields')
                    ->join('tblcustomfieldsvalues', 'tblcustomfields.id', '=', 'tblcustomfieldsvalues.fieldid')
                    ->where('tblcustomfields.type', 'product')
                    ->where('tblcustomfields.fieldname', 'like', 'Instance ID%')
                    ->where('tblcustomfieldsvalues.relid', $service->id)
                    ->first();

                if (!$instanceIdField || empty($instanceIdField->value)) {
                    continue;
                }

                $instanceId = $instanceIdField->value;

                // Here you would call the API to get health status
                // and update WHMCS bandwidth/usage fields
                // This is a placeholder for the actual implementation

                logActivity("OpenClaw daily sync for instance {$instanceId} (service {$service->id})");
            }
        }
    } catch (\Exception $e) {
        logActivity("OpenClaw DailyCronJob hook error: " . $e->getMessage());
    }
});

/**
 * Handle module suspend event
 * 
 * Additional actions when an OpenClaw service is suspended
 */
add_hook('AfterModuleSuspend', 1, function ($vars) {
    if (($vars['params']['moduletype'] ?? '') !== 'openclawhost') {
        return;
    }

    $serviceId = $vars['params']['serviceid'];
    logActivity("OpenClaw service {$serviceId} suspended");
});

/**
 * Handle module unsuspend event
 * 
 * Additional actions when an OpenClaw service is unsuspended
 */
add_hook('AfterModuleUnsuspend', 1, function ($vars) {
    if (($vars['params']['moduletype'] ?? '') !== 'openclawhost') {
        return;
    }

    $serviceId = $vars['params']['serviceid'];
    logActivity("OpenClaw service {$serviceId} unsuspended");
});

/**
 * Handle module terminate event
 * 
 * Cleanup actions when an OpenClaw service is terminated
 */
add_hook('AfterModuleTerminate', 1, function ($vars) {
    if (($vars['params']['moduletype'] ?? '') !== 'openclawhost') {
        return;
    }

    try {
        $serviceId = $vars['params']['serviceid'];

        // Clear custom fields
        $customFields = Capsule::table('tblcustomfields')
            ->where('type', 'product')
            ->where('relid', $vars['params']['pid'])
            ->get();

        foreach ($customFields as $field) {
            if (in_array($field->fieldname, ['Instance ID', 'Dashboard URL', 'Subdomain'])) {
                Capsule::table('tblcustomfieldsvalues')
                    ->where('fieldid', $field->id)
                    ->where('relid', $serviceId)
                    ->update(['value' => '']);
            }
        }

        logActivity("OpenClaw service {$serviceId} terminated and custom fields cleared");
    } catch (\Exception $e) {
        logActivity("OpenClaw AfterModuleTerminate hook error: " . $e->getMessage());
    }
});

/**
 * Pre-module create validation
 * 
 * Validate configuration before attempting to create an instance
 */
add_hook('PreModuleCreate', 1, function ($vars) {
    if (($vars['params']['moduletype'] ?? '') !== 'openclawhost') {
        return;
    }

    // Validate required config options
    $requiredOptions = [
        'configoption1' => 'Plan',
        'configoption2' => 'Region',
    ];

    foreach ($requiredOptions as $option => $label) {
        if (empty($vars['params'][$option])) {
            return [
                'abortcmd' => true,
                'errormsg' => "Required configuration option '{$label}' is not set.",
            ];
        }
    }

    return true;
});
