<?php
/**
 * Petra API Proxy for BrandMeister Venezuela
 * Solves CORS and allows server-to-server data fetching from shared hosting.
 */
require_once __DIR__ . '/db.php';

// Solo el propio sitio consume este proxy (misma política que el resto del API)
bm_cors_headers();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Las peticiones OPTIONS ya las responde db.php

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$endpoint = isset($_GET['endpoint']) ? (string)$_GET['endpoint'] : '';
$endpoint = trim($endpoint, '/');

if ($endpoint === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing endpoint']);
    exit;
}

// Solo nombres simples de endpoint (live, summary, rne-stats...): sin barras, puntos ni codificaciones
if (!preg_match('/^[a-z0-9][a-z0-9_-]{0,39}$/i', $endpoint)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid endpoint']);
    exit;
}

// Re-append query parameters from original request (only simple scalar values)
parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
unset($params['endpoint']);
$params = array_filter($params, function ($v, $k) {
    return is_string($v) && preg_match('/^[a-z0-9_]{1,20}$/i', (string)$k) && strlen($v) <= 40;
}, ARRAY_FILTER_USE_BOTH);
$extraQuery = !empty($params) ? '?' . http_build_query($params) : '';

$targetUrl = 'https://petra.brandmeisteryv.net/api/' . $endpoint . $extraQuery;

// Fetch data using cURL or file_get_contents
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
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
} else {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Accept: application/json\r\nUser-Agent: BrandMeister-Venezuela-Proxy/1.0\r\n",
            'timeout' => 6,
            'follow_location' => 0
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
