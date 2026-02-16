<?php
/**
 * OpenClaw Host Module Tests
 * 
 * PHPUnit test suite for the WHMCS provisioning module
 * 
 * @package OpenClawHost
 * @version 1.0.0
 */

namespace OpenClawHost\Tests;

use PHPUnit\Framework\TestCase;
use OpenClawHost\ApiClient;
use OpenClawHost\SSO;

require_once __DIR__ . '/../lib/ApiClient.php';
require_once __DIR__ . '/../lib/SSO.php';

/**
 * Main test class for OpenClaw Host module
 */
class OpenClawHostTest extends TestCase
{
    /**
     * Test that MetaData returns all required fields
     */
    public function testMetaDataReturnsRequiredFields(): void
    {
        // Include the main module file to access functions
        require_once __DIR__ . '/../openclawhost.php';

        $meta = openclawhost_MetaData();

        $this->assertIsArray($meta);
        $this->assertArrayHasKey('DisplayName', $meta);
        $this->assertArrayHasKey('APIVersion', $meta);
        $this->assertArrayHasKey('RequiresServer', $meta);
        $this->assertArrayHasKey('DefaultNonSSLPort', $meta);
        $this->assertArrayHasKey('DefaultSSLPort', $meta);
        $this->assertArrayHasKey('ServiceSingleSignOnLabel', $meta);
        $this->assertArrayHasKey('AdminSingleSignOnLabel', $meta);

        $this->assertEquals('OpenClaw Host', $meta['DisplayName']);
        $this->assertEquals('1.1', $meta['APIVersion']);
        $this->assertTrue($meta['RequiresServer']);
    }

    /**
     * Test that ConfigOptions returns all required options
     */
    public function testConfigOptionsHasAllOptions(): void
    {
        require_once __DIR__ . '/../openclawhost.php';

        $config = openclawhost_ConfigOptions();

        $this->assertIsArray($config);
        $this->assertArrayHasKey('Plan', $config);
        $this->assertArrayHasKey('Region', $config);
        $this->assertArrayHasKey('AI Preset', $config);
        $this->assertArrayHasKey('Extra Storage GB', $config);

        // Test Plan options
        $this->assertEquals('dropdown', $config['Plan']['Type']);
        $this->assertStringContainsString('starter', $config['Plan']['Options']);
        $this->assertStringContainsString('professional', $config['Plan']['Options']);
        $this->assertStringContainsString('enterprise', $config['Plan']['Options']);

        // Test Region options
        $this->assertEquals('dropdown', $config['Region']['Type']);
        $this->assertStringContainsString('us-east', $config['Region']['Options']);
        $this->assertStringContainsString('eu-frankfurt', $config['Region']['Options']);

        // Test AI Preset options
        $this->assertEquals('dropdown', $config['AI Preset']['Type']);
        $this->assertStringContainsString('anthropic', $config['AI Preset']['Options']);
        $this->assertStringContainsString('openai', $config['AI Preset']['Options']);
    }

    /**
     * Test API client instantiation
     */
    public function testApiClientCanBeInstantiated(): void
    {
        $client = new ApiClient(
            'https://api.test.com:2223',
            'test_api_key',
            'test_hmac_secret'
        );

        $this->assertInstanceOf(ApiClient::class, $client);
        $this->assertEquals('https://api.test.com:2223', $client->getBaseUrl());
    }

    /**
     * Test API client HMAC signature generation
     */
    public function testApiClientGeneratesValidHMAC(): void
    {
        $client = new ApiClient(
            'https://api.test.com:2223',
            'test_api_key',
            'test_hmac_secret'
        );

        $body = json_encode(['test' => 'data']);
        $timestamp = 1234567890;

        $signature = $client->generateSignature($body, $timestamp);

        // Verify signature format (64 character hex string)
        $this->assertEquals(64, strlen($signature));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $signature);

        // Verify signature is deterministic
        $signature2 = $client->generateSignature($body, $timestamp);
        $this->assertEquals($signature, $signature2);
    }

    /**
     * Test API client signature verification
     */
    public function testApiClientVerifiesSignatures(): void
    {
        $client = new ApiClient(
            'https://api.test.com:2223',
            'test_api_key',
            'test_hmac_secret'
        );

        $body = json_encode(['test' => 'data']);
        $timestamp = 1234567890;

        $signature = $client->generateSignature($body, $timestamp);

        $this->assertTrue($client->verifySignature($body, $timestamp, $signature));
        $this->assertFalse($client->verifySignature($body, $timestamp, 'invalid_signature'));
    }

    /**
     * Test SSO token generation
     */
    public function testSSOGeneratesValidClientToken(): void
    {
        $sso = new SSO('test_hmac_secret');

        $tokenData = $sso->generateClientToken(
            clientId: 123,
            serviceId: 456,
            instanceId: 'inst_abc123',
            email: 'test@example.com'
        );

        $this->assertIsArray($tokenData);
        $this->assertArrayHasKey('token', $tokenData);
        $this->assertArrayHasKey('signature', $tokenData);
        $this->assertArrayHasKey('timestamp', $tokenData);
        $this->assertArrayHasKey('payload', $tokenData);

        // Verify payload contents
        $this->assertEquals(123, $tokenData['payload']['client_id']);
        $this->assertEquals(456, $tokenData['payload']['service_id']);
        $this->assertEquals('inst_abc123', $tokenData['payload']['instance_id']);
        $this->assertEquals('test@example.com', $tokenData['payload']['email']);
        $this->assertFalse($tokenData['payload']['is_admin']);
    }

    /**
     * Test SSO admin token generation
     */
    public function testSSOGeneratesValidAdminToken(): void
    {
        $sso = new SSO('test_hmac_secret');

        $tokenData = $sso->generateAdminToken(
            adminId: 789,
            serviceId: 456,
            instanceId: 'inst_abc123'
        );

        $this->assertIsArray($tokenData);
        $this->assertEquals(789, $tokenData['payload']['admin_id']);
        $this->assertEquals(456, $tokenData['payload']['service_id']);
        $this->assertTrue($tokenData['payload']['is_admin']);
    }

    /**
     * Test SSO token validation
     */
    public function testSSOValidatesTokens(): void
    {
        $sso = new SSO('test_hmac_secret');

        $tokenData = $sso->generateClientToken(
            clientId: 123,
            serviceId: 456,
            instanceId: 'inst_abc123',
            email: 'test@example.com'
        );

        // Valid token should decode correctly
        $payload = $sso->validateToken(
            $tokenData['token'],
            $tokenData['signature'],
            $tokenData['timestamp']
        );

        $this->assertEquals(123, $payload['client_id']);
        $this->assertEquals('test@example.com', $payload['email']);
    }

    /**
     * Test SSO rejects expired tokens
     */
    public function testSSORejectsExpiredTokens(): void
    {
        $sso = new SSO('test_hmac_secret', 60); // 60 second expiry

        $tokenData = $sso->generateClientToken(
            clientId: 123,
            serviceId: 456,
            instanceId: 'inst_abc123',
            email: 'test@example.com'
        );

        // Try to validate with old timestamp
        $oldTimestamp = time() - 120; // 2 minutes ago

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('expired');

        $sso->validateToken($tokenData['token'], $tokenData['signature'], $oldTimestamp);
    }

    /**
     * Test SSO rejects invalid signatures
     */
    public function testSSORejectsInvalidSignatures(): void
    {
        $sso = new SSO('test_hmac_secret');

        $tokenData = $sso->generateClientToken(
            clientId: 123,
            serviceId: 456,
            instanceId: 'inst_abc123',
            email: 'test@example.com'
        );

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('signature');

        $sso->validateToken($tokenData['token'], 'invalid_signature', $tokenData['timestamp']);
    }

    /**
     * Test SSO URL building for clients
     */
    public function testSSOBuildsClientUrl(): void
    {
        $sso = new SSO('test_hmac_secret');

        $tokenData = $sso->generateClientToken(
            clientId: 123,
            serviceId: 456,
            instanceId: 'inst_abc123',
            email: 'test@example.com'
        );

        $url = $sso->buildClientUrl('dashboard.openclaw.com', $tokenData, true);

        $this->assertStringStartsWith('https://dashboard.openclaw.com/auth/sso?', $url);
        $this->assertStringContainsString('token=', $url);
        $this->assertStringContainsString('signature=', $url);
        $this->assertStringContainsString('ts=', $url);
    }

    /**
     * Test SSO URL building for admins
     */
    public function testSSOBuildsAdminUrl(): void
    {
        $sso = new SSO('test_hmac_secret');

        $tokenData = $sso->generateAdminToken(
            adminId: 789,
            serviceId: 456,
            instanceId: 'inst_abc123'
        );

        $url = $sso->buildAdminUrl('dashboard.openclaw.com', $tokenData, false);

        $this->assertStringStartsWith('http://dashboard.openclaw.com/admin/sso?', $url);
    }

    /**
     * Test API client truncates API key for display
     */
    public function testApiClientTruncatesApiKey(): void
    {
        $client = new ApiClient(
            'https://api.test.com:2223',
            'my_secret_api_key_12345',
            'test_hmac_secret'
        );

        $displayKey = $client->getApiKey();

        $this->assertStringContainsString('****', $displayKey);
        $this->assertStringStartsWith('my_s', $displayKey);
        $this->assertStringEndsWith('2345', $displayKey);
    }

    /**
     * Test AdminCustomButtonArray returns expected buttons
     */
    public function testAdminCustomButtonArray(): void
    {
        require_once __DIR__ . '/../openclawhost.php';

        $buttons = openclawhost_AdminCustomButtonArray();

        $this->assertIsArray($buttons);
        $this->assertArrayHasKey('Reboot Server', $buttons);
        $this->assertArrayHasKey('Repair OpenClaw', $buttons);
        $this->assertArrayHasKey('View Dashboard', $buttons);
        $this->assertArrayHasKey('Force Sync Status', $buttons);

        $this->assertEquals('reboot', $buttons['Reboot Server']);
        $this->assertEquals('repair', $buttons['Repair OpenClaw']);
    }

    /**
     * Test ClientAreaCustomButtonArray returns expected buttons
     */
    public function testClientAreaCustomButtonArray(): void
    {
        require_once __DIR__ . '/../openclawhost.php';

        $buttons = openclawhost_ClientAreaCustomButtonArray();

        $this->assertIsArray($buttons);
        $this->assertArrayHasKey('Reboot Server', $buttons);
        $this->assertEquals('reboot', $buttons['Reboot Server']);
    }
}
