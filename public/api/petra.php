<?php
/**
 * Petra API Proxy for BrandMeister Venezuela
 * Solves CORS and allows server-to-server data fetching from shared hosting.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

// Sanitize endpoint to avoid path traversal
$endpoint = ltrim($endpoint, '/');
if (empty($endpoint)) {
    echo json_encode(['error' => 'Missing endpoint']);
    exit;
}

// Re-append query parameters from original request
$queryString = $_SERVER['QUERY_STRING'] ?? '';
// Remove 'endpoint=...' from query string if present
parse_str($queryString, $params);
unset($params['endpoint']);
$extraQuery = !empty($params) ? '?' . http_build_query($params) : '';

$targetUrl = 'https://petra.brandmeisteryv.net/api/' . $endpoint . $extraQuery;

// Fetch data using cURL or file_get_contents
$response = false;
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'User-Agent: BrandMeister-Venezuela-Proxy/1.0'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response !== false && $httpCode >= 200 && $httpCode < 300) {
        echo $response;
        exit;
    }
}

// Fallback to file_get_contents
if ($response === false) {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Accept: application/json\r\nUser-Agent: BrandMeister-Venezuela-Proxy/1.0\r\n",
            'timeout' => 6
        ]
    ]);
    $response = @file_get_contents($targetUrl, false, $context);
    if ($response !== false) {
        echo $response;
        exit;
    }
}

http_response_code(502);
echo json_encode(['error' => 'Failed to reach Petra API']);
