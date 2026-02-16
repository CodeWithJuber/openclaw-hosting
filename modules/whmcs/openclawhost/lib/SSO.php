<?php
/**
 * OpenClaw Host SSO Handler
 * 
 * Handles Single Sign-On token generation and validation
 * 
 * @package OpenClawHost
 * @version 1.0.0
 */

namespace OpenClawHost;

class SSO
{
    /** @var string HMAC secret for signing tokens */
    private string $hmacSecret;

    /** @var int Token expiration time in seconds (default: 5 minutes) */
    private int $tokenExpiry;

    /**
     * Constructor
     * 
     * @param string $hmacSecret HMAC secret for signing
     * @param int $tokenExpiry Token expiration time in seconds
     */
    public function __construct(string $hmacSecret, int $tokenExpiry = 300)
    {
        $this->hmacSecret = $hmacSecret;
        $this->tokenExpiry = $tokenExpiry;
    }

    /**
     * Generate an SSO token for client login
     * 
     * @param int $clientId WHMCS client ID
     * @param int $serviceId WHMCS service ID
     * @param string $instanceId OpenClaw instance ID
     * @param string $email Client email address
     * @return array Token data including URL-safe parameters
     */
    public function generateClientToken(
        int $clientId,
        int $serviceId,
        string $instanceId,
        string $email
    ): array {
        $timestamp = time();

        $payload = [
            'client_id' => $clientId,
            'service_id' => $serviceId,
            'instance_id' => $instanceId,
            'email' => $email,
            'timestamp' => $timestamp,
            'is_admin' => false,
        ];

        $payloadJson = json_encode($payload);
        $token = base64_encode($payloadJson);
        $signature = hash_hmac('sha256', $payloadJson, $this->hmacSecret);

        return [
            'token' => $token,
            'signature' => $signature,
            'timestamp' => $timestamp,
            'payload' => $payload,
        ];
    }

    /**
     * Generate an SSO token for admin login
     * 
     * @param int $adminId WHMCS admin ID
     * @param int $serviceId WHMCS service ID
     * @param string $instanceId OpenClaw instance ID
     * @return array Token data including URL-safe parameters
     */
    public function generateAdminToken(
        int $adminId,
        int $serviceId,
        string $instanceId
    ): array {
        $timestamp = time();

        $payload = [
            'admin_id' => $adminId,
            'service_id' => $serviceId,
            'instance_id' => $instanceId,
            'timestamp' => $timestamp,
            'is_admin' => true,
        ];

        $payloadJson = json_encode($payload);
        $token = base64_encode($payloadJson);
        $signature = hash_hmac('sha256', $payloadJson, $this->hmacSecret);

        return [
            'token' => $token,
            'signature' => $signature,
            'timestamp' => $timestamp,
            'payload' => $payload,
        ];
    }

    /**
     * Validate and decode an SSO token
     * 
     * @param string $token Base64-encoded token
     * @param string $signature HMAC signature
     * @param int $timestamp Token timestamp
     * @return array Decoded payload
     * @throws \Exception If token is invalid or expired
     */
    public function validateToken(string $token, string $signature, int $timestamp): array
    {
        // Check if token has expired
        if (time() - $timestamp > $this->tokenExpiry) {
            throw new \Exception('SSO token has expired');
        }

        // Check for future timestamp (clock skew protection)
        if ($timestamp > time() + 60) {
            throw new \Exception('SSO token timestamp is in the future');
        }

        // Decode payload
        $payloadJson = base64_decode($token, true);
        if ($payloadJson === false) {
            throw new \Exception('Invalid SSO token encoding');
        }

        $payload = json_decode($payloadJson, true);
        if ($payload === null) {
            throw new \Exception('Invalid SSO token payload');
        }

        // Verify signature
        $expectedSignature = hash_hmac('sha256', $payloadJson, $this->hmacSecret);
        if (!hash_equals($expectedSignature, $signature)) {
            throw new \Exception('Invalid SSO token signature');
        }

        return $payload;
    }

    /**
     * Build an SSO URL for client redirect
     * 
     * @param string $baseUrl Dashboard base URL
     * @param array $tokenData Token data from generateClientToken
     * @param bool $useSsl Whether to use HTTPS
     * @return string Full SSO URL
     */
    public function buildClientUrl(string $baseUrl, array $tokenData, bool $useSsl = true): string
    {
        $protocol = $useSsl ? 'https' : 'http';
        $baseUrl = rtrim($baseUrl, '/');

        return "{$protocol}://{$baseUrl}/auth/sso?" . http_build_query([
            'token' => $tokenData['token'],
            'signature' => $tokenData['signature'],
            'ts' => $tokenData['timestamp'],
        ]);
    }

    /**
     * Build an SSO URL for admin redirect
     * 
     * @param string $baseUrl Dashboard base URL
     * @param array $tokenData Token data from generateAdminToken
     * @param bool $useSsl Whether to use HTTPS
     * @return string Full SSO URL
     */
    public function buildAdminUrl(string $baseUrl, array $tokenData, bool $useSsl = true): string
    {
        $protocol = $useSsl ? 'https' : 'http';
        $baseUrl = rtrim($baseUrl, '/');

        return "{$protocol}://{$baseUrl}/admin/sso?" . http_build_query([
            'token' => $tokenData['token'],
            'signature' => $tokenData['signature'],
            'ts' => $tokenData['timestamp'],
        ]);
    }

    /**
     * Get token expiration time
     * 
     * @return int Token expiration time in seconds
     */
    public function getTokenExpiry(): int
    {
        return $this->tokenExpiry;
    }

    /**
     * Set token expiration time
     * 
     * @param int $seconds Expiration time in seconds
     * @return self
     */
    public function setTokenExpiry(int $seconds): self
    {
        $this->tokenExpiry = $seconds;
        return $this;
    }
}
