<?php
/**
 * RadioID.net API Proxy for BrandMeister Venezuela
 * Solves CORS, caches responses safely, and queries database.radioid.net.
 */
require_once __DIR__ . '/db.php';

// Cabeceras CORS oficiales
bm_cors_headers();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido', 'count' => 0, 'results' => []]);
    exit;
}

$rawQuery = trim($_GET['q'] ?? $_GET['callsign'] ?? $_GET['id'] ?? '');
$type = strtolower(trim($_GET['type'] ?? 'user'));
if (!in_array($type, ['user', 'repeater'], true)) {
    $type = 'user';
}

if ($rawQuery === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Debe ingresar un indicativo o DMR ID para consultar', 'count' => 0, 'results' => []]);
    exit;
}

// Limpiar y normalizar el parámetro (solo alfanumérico, guiones y barras)
$cleanQuery = strtoupper(trim(preg_replace('/[^a-zA-Z0-9\-\/]/', '', $rawQuery)));
if (strlen($cleanQuery) < 2 || strlen($cleanQuery) > 30) {
    http_response_code(400);
    echo json_encode(['error' => 'Término de búsqueda inválido', 'count' => 0, 'results' => []]);
    exit;
}

$isNumeric = ctype_digit($cleanQuery);

// Caché local en archivo temporal para evitar sobrecargar database.radioid.net
$cacheDir = sys_get_temp_dir() . '/bm_radioid_cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}
$cacheKey = md5($type . '_' . $cleanQuery);
$cacheFile = $cacheDir . '/' . $cacheKey . '.json';
$cacheTtl = 3600; // 1 hora de vigencia

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    $cachedData = @file_get_contents($cacheFile);
    if ($cachedData !== false) {
        header('X-Cache: HIT');
        echo $cachedData;
        exit;
    }
}

/**
 * Consulta la API de RadioID mediante cURL o file_get_contents
 */
function fetchRadioId(string $url): string|false {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'User-Agent: BrandMeister-Venezuela-RadioID/1.0'
        ]);
        $response = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($response !== false && $code >= 200 && $code < 300) {
            return $response;
        }
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 6,
                'header' => "Accept: application/json\r\nUser-Agent: BrandMeister-Venezuela-RadioID/1.0\r\n"
            ]
        ]);
        $response = @file_get_contents($url, false, $ctx);
        if ($response !== false) {
            return $response;
        }
    }
    return false;
}

// 1. Intentar consulta principal (por ID o indicativo)
$paramName = $isNumeric ? 'id' : 'callsign';
$apiUrl = "https://database.radioid.net/api/dmr/{$type}/?{$paramName}=" . urlencode($cleanQuery);
$rawResponse = fetchRadioId($apiUrl);

// 2. Si no hay resultados y la consulta original fue 'user', intentar en repetidores automáticamente
if ($rawResponse !== false) {
    $decoded = json_decode($rawResponse, true);
    if (is_array($decoded) && empty($decoded['results']) && $type === 'user') {
        $repeaterUrl = "https://database.radioid.net/api/dmr/repeater/?{$paramName}=" . urlencode($cleanQuery);
        $repRaw = fetchRadioId($repeaterUrl);
        if ($repRaw !== false) {
            $repDecoded = json_decode($repRaw, true);
            if (is_array($repDecoded) && !empty($repDecoded['results'])) {
                foreach ($repDecoded['results'] as &$item) {
                    $item['_entity_type'] = 'repeater';
                }
                unset($item);
                $rawResponse = json_encode($repDecoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
        }
    }
}

if ($rawResponse !== false) {
    @file_put_contents($cacheFile, $rawResponse);
    header('X-Cache: MISS');
    echo $rawResponse;
    exit;
}

// Error si falla la conexión
http_response_code(502);
echo json_encode([
    'error' => 'No fue posible contactar a los servidores de RadioID.net en este momento.',
    'count' => 0,
    'results' => []
], JSON_UNESCAPED_UNICODE);
