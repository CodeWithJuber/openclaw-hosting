<?php
/**
 * OpenClaw Host API Client
 * 
 * Handles HTTP communication with the OpenClaw API using HMAC authentication
 * 
 * @package OpenClawHost
 * @version 1.0.0
 */

namespace OpenClawHost;

class ApiClient
{
    /** @var string Base URL for the API */
    private string $baseUrl;

    /** @var string API Key for authentication */
    private string $apiKey;

    /** @var string HMAC secret for request signing */
    private string $hmacSecret;

    /** @var int Request timeout in seconds */
    private int $timeout;

    /**
     * Constructor
     * 
     * @param string $baseUrl Base URL for the API (e.g., https://api.openclaw.com:2223)
     * @param string $apiKey API Key for authentication
     * @param string $hmacSecret HMAC secret for request signing
     * @param int $timeout Request timeout in seconds (default: 120)
     */
    public function __construct(
        string $baseUrl,
        string $apiKey,
        string $hmacSecret,
        int $timeout = 120
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey = $apiKey;
        $this->hmacSecret = $hmacSecret;
        $this->timeout = $timeout;
    }

    /**
     * Send a POST request
     * 
     * @param string $endpoint API endpoint (e.g., /api/instances)
     * @param array $data Request body data
     * @return array Decoded JSON response
     * @throws \Exception On API error or network failure
     */
    public function post(string $endpoint, array $data = []): array
    {
        return $this->request('POST', $endpoint, $data);
    }

    /**
     * Send a GET request
     * 
     * @param string $endpoint API endpoint (e.g., /api/instances/123)
     * @return array Decoded JSON response
     * @throws \Exception On API error or network failure
     */
    public function get(string $endpoint): array
    {
        return $this->request('GET', $endpoint);
    }

    /**
     * Send a PUT request
     * 
     * @param string $endpoint API endpoint
     * @param array $data Request body data
     * @return array Decoded JSON response
     * @throws \Exception On API error or network failure
     */
    public function put(string $endpoint, array $data = []): array
    {
        return $this->request('PUT', $endpoint, $data);
    }

    /**
     * Send a PATCH request
     * 
     * @param string $endpoint API endpoint
     * @param array $data Request body data
     * @return array Decoded JSON response
     * @throws \Exception On API error or network failure
     */
    public function patch(string $endpoint, array $data = []): array
    {
        return $this->request('PATCH', $endpoint, $data);
    }

    /**
     * Send a DELETE request
     * 
     * @param string $endpoint API endpoint
     * @return array Decoded JSON response
     * @throws \Exception On API error or network failure
     */
    public function delete(string $endpoint): array
    {
        return $this->request('DELETE', $endpoint);
    }

    /**
     * Send an HTTP request with HMAC authentication
     * 
     * @param string $method HTTP method (GET, POST, PUT, PATCH, DELETE)
     * @param string $endpoint API endpoint
     * @param array $data Request body data (for POST/PUT/PATCH)
     * @return array Decoded JSON response
     * @throws \Exception On API error or network failure
     */
    private function request(string $method, string $endpoint, array $data = []): array
    {
        $url = $this->baseUrl . $endpoint;
        $timestamp = time();
        $body = !empty($data) ? json_encode($data) : '';

        // Generate HMAC signature
        $signature = $this->generateSignature($body, $timestamp);

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-API-Key: ' . $this->apiKey,
            'X-Timestamp: ' . $timestamp,
            'X-Signature: ' . $signature,
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        if (!empty($body)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception("API request failed: {$error}");
        }

        $result = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON response from API");
        }

        if ($httpCode >= 400) {
            $errorMessage = $result['error'] ?? $result['message'] ?? "API error: HTTP {$httpCode}";
            throw new \Exception($errorMessage);
        }

        return $result;
    }

    /**
     * Generate HMAC signature for request authentication
     * 
     * @param string $body Request body (empty string for GET/DELETE)
     * @param int $timestamp Unix timestamp
     * @return string Hex-encoded HMAC-SHA256 signature
     */
    public function generateSignature(string $body, int $timestamp): string
    {
        $dataToSign = $body . $timestamp;
        return hash_hmac('sha256', $dataToSign, $this->hmacSecret);
    }

    /**
     * Verify an HMAC signature (for incoming webhooks)
     * 
     * @param string $body Request body
     * @param int $timestamp Unix timestamp
     * @param string $signature Provided signature to verify
     * @return bool True if signature is valid
     */
    public function verifySignature(string $body, int $timestamp, string $signature): bool
    {
        $expectedSignature = $this->generateSignature($body, $timestamp);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Get the API key (for logging/debugging, truncated)
     * 
     * @return string Truncated API key
     */
    public function getApiKey(): string
    {
        $length = strlen($this->apiKey);
        if ($length <= 8) {
            return str_repeat('*', $length);
        }
        return substr($this->apiKey, 0, 4) . str_repeat('*', $length - 8) . substr($this->apiKey, -4);
    }

    /**
     * Get the base URL
     * 
     * @return string Base URL
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }
}
