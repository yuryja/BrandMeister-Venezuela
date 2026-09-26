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

// Catálogo oficial de frecuencias verificadas de repetidores BrandMeister Venezuela
$knownRepeaters = [
    '734013' => [
        'callsign' => 'YV4EGG',
        'city' => 'Valencia',
        'state' => 'Carabobo',
        'tx' => '146.7000',
        'rx' => '146.1000',
        'frequency' => '146.7000',
        'offset' => '-0.600 MHz',
        'color_code' => 1,
        'trustee' => ['YV4EGG', 'YV5VE'],
        'coverage' => 'BrandMeister DMR (Master 7301)',
        'description' => "Repetidor DMR, Red Brandmeister VHF 146.700 -600 cc1 (TS 1: TG 734, TS 2: TG 73452). Cerro El Café, Valencia."
    ],
    '734014' => [
        'callsign' => 'YV5VE',
        'city' => 'Caracas',
        'state' => 'Distrito Capital',
        'tx' => '439.6000',
        'rx' => '434.6000',
        'frequency' => '439.6000',
        'offset' => '-5.000 MHz',
        'color_code' => 1,
        'trustee' => ['YV5VE', 'YY5EHT'],
        'coverage' => 'BrandMeister DMR (Master 7301)',
        'description' => "Repetidor DMR BrandMeister UHF Caracas 439.600 -5000 CC1."
    ],
    '734009' => [
        'callsign' => 'YV5VE',
        'city' => 'Altagracia de Orituco',
        'state' => 'Guárico',
        'tx' => '147.3900',
        'rx' => '147.9900',
        'frequency' => '147.3900',
        'offset' => '+0.600 MHz',
        'color_code' => 1,
        'trustee' => ['YV5VE'],
        'coverage' => 'BrandMeister DMR (Master 7301)',
        'description' => "Altagracia de Orituco, Guárico frecuencia 147.390 +600 CC1."
    ],
    '734016' => [
        'callsign' => 'YV5CBO',
        'city' => 'La Guaira',
        'state' => 'La Guaira',
        'tx' => '147.1500',
        'rx' => '147.7500',
        'frequency' => '147.1500',
        'offset' => '+0.600 MHz',
        'color_code' => 1,
        'trustee' => ['YV5CBO', 'YV5VE'],
        'coverage' => 'BrandMeister DMR (Master 7301)',
        'description' => "Repetidor Ubicado en el Waraira Repano (El Ávila), La Guaira."
    ],
    '734015' => [
        'callsign' => 'YV1GDQ',
        'city' => 'Ciudad Ojeda',
        'state' => 'Zulia',
        'tx' => '439.6000',
        'rx' => '434.6000',
        'frequency' => '439.6000',
        'offset' => '-5.000 MHz',
        'color_code' => 1,
        'trustee' => ['YV1GDQ'],
        'coverage' => 'BrandMeister DMR (Master 7301)',
        'description' => "Frecuencia 439.600 -5000 CC1. Ciudad Ojeda, Edo. Zulia."
    ]
];

// Caché local en archivo temporal con prefijo de versión para evitar datos obsoletos
$cacheDir = sys_get_temp_dir() . '/bm_radioid_cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}
$cacheKey = md5('bm_v3_' . $type . '_' . $cleanQuery);
$cacheFile = $cacheDir . '/' . $cacheKey . '.json';
$cacheTtl = 1800; // 30 minutos

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    $cachedData = @file_get_contents($cacheFile);
    if ($cachedData !== false) {
        $chk = json_decode($cachedData, true);
        // Descartar caché corrupto o antiguo con frecuencia errónea de 734013
        $isCorrupted = false;
        if (!empty($chk['results'])) {
            foreach ($chk['results'] as $r) {
                if (($r['locator'] ?? $r['id'] ?? '') == 734013 && ($r['tx'] ?? $r['frequency'] ?? '') === '439.70000') {
                    $isCorrupted = true;
                    break;
                }
            }
        }
        if (!$isCorrupted) {
            header('X-Cache: HIT');
            echo $cachedData;
            exit;
        }
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

/**
 * Consulta la API oficial de BrandMeister Network (v2) para un repetidor/dispositivo
 */
function fetchBrandMeisterDevice(string|int $deviceId): ?array {
    $cleanId = preg_replace('/[^0-9]/', '', (string)$deviceId);
    if (!$cleanId) return null;

    $url = "https://api.brandmeister.network/v2/device/{$cleanId}";
    $response = false;

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'User-Agent: BrandMeister-Venezuela/1.0'
        ]);
        $response = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($response !== false && $code === 200) {
            $data = json_decode($response, true);
            return (is_array($data) && isset($data['id'])) ? $data : null;
        }
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 4,
                'header' => "Accept: application/json\r\nUser-Agent: BrandMeister-Venezuela/1.0\r\n"
            ]
        ]);
        $response = @file_get_contents($url, false, $ctx);
        if ($response !== false) {
            $data = json_decode($response, true);
            return (is_array($data) && isset($data['id'])) ? $data : null;
        }
    }
    return null;
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
                $decoded = $repDecoded;
            }
        }
    }
}

// 3. Si no hubo resultados en RadioID.net y es un ID numérico, buscar directamente en BrandMeister Devices
if ((!isset($decoded) || empty($decoded['results'])) && $isNumeric) {
    $bmDevice = fetchBrandMeisterDevice($cleanQuery);
    if ($bmDevice) {
        $tx = isset($bmDevice['tx']) ? (float)$bmDevice['tx'] : 0.0;
        $rx = isset($bmDevice['rx']) ? (float)$bmDevice['rx'] : 0.0;
        $shift = ($tx > 0 && $rx > 0) ? ($rx - $tx) : 0.0;
        $offsetStr = abs($shift) < 0.0001 ? 'Simplex' : sprintf('%+0.3f MHz', $shift);

        $sysops = [];
        if (!empty($bmDevice['permissions']) && is_array($bmDevice['permissions'])) {
            foreach ($bmDevice['permissions'] as $p) {
                if (!empty($p['username']) && !in_array($p['username'], $sysops, true)) {
                    $sysops[] = $p['username'];
                }
            }
        }

        $decoded = [
            'count' => 1,
            'page' => 1,
            'pages' => 1,
            'per_page' => 200,
            'results' => [
                [
                    'id' => (string)$bmDevice['id'],
                    'locator' => (string)$bmDevice['id'],
                    'callsign' => $bmDevice['callsign'] ?? '',
                    'city' => $bmDevice['city'] ?? '',
                    'state' => '',
                    'country' => 'Venezuela',
                    'frequency' => (string)($bmDevice['tx'] ?? ''),
                    'tx' => (string)($bmDevice['tx'] ?? ''),
                    'rx' => (string)($bmDevice['rx'] ?? ''),
                    'offset' => $offsetStr,
                    'color_code' => $bmDevice['colorcode'] ?? 1,
                    'status' => $bmDevice['statusText'] ?? 'Activo',
                    'coverage' => 'BrandMeister DMR' . (!empty($bmDevice['lastKnownMaster']) ? " (Master {$bmDevice['lastKnownMaster']})" : ''),
                    'trustee' => !empty($sysops) ? $sysops : [$bmDevice['callsign'] ?? ''],
                    'hardware' => $bmDevice['hardware'] ?? ($bmDevice['linkname'] ?? null),
                    'linkname' => $bmDevice['linkname'] ?? null,
                    'description' => $bmDevice['description'] ?? '',
                    '_entity_type' => 'repeater',
                    'bm_device' => $bmDevice
                ]
            ]
        ];
    }
}

// 4. Si hay repetidores en los resultados, sincronizar Frequency Details con la API oficial de BrandMeister y catálogo verificado
if (isset($decoded) && is_array($decoded) && !empty($decoded['results'])) {
    foreach ($decoded['results'] as &$item) {
        $isRep = ($item['_entity_type'] ?? '') === 'repeater' || isset($item['locator']) || $type === 'repeater';
        if ($isRep) {
            $item['_entity_type'] = 'repeater';
            $repId = (string)($item['locator'] ?? $item['id'] ?? '');

            // Fallback inmediato con catálogo verificado para evitar datos desactualizados de RadioID
            if ($repId !== '' && isset($knownRepeaters[$repId])) {
                $k = $knownRepeaters[$repId];
                $item['tx'] = $k['tx'];
                $item['rx'] = $k['rx'];
                $item['frequency'] = $k['frequency'];
                $item['offset'] = $k['offset'];
                $item['color_code'] = $k['color_code'];
                if (!empty($k['trustee'])) $item['trustee'] = $k['trustee'];
                if (!empty($k['description'])) $item['description'] = $k['description'];
                if (!empty($k['coverage'])) $item['coverage'] = $k['coverage'];
                if (!empty($k['city'])) $item['city'] = $k['city'];
            }

            if ($repId !== '') {
                $bmDevice = fetchBrandMeisterDevice($repId);
                if ($bmDevice) {
                    $tx = isset($bmDevice['tx']) ? (float)$bmDevice['tx'] : 0.0;
                    $rx = isset($bmDevice['rx']) ? (float)$bmDevice['rx'] : 0.0;
                    $shift = ($tx > 0 && $rx > 0) ? ($rx - $tx) : 0.0;
                    $offsetStr = abs($shift) < 0.0001 ? 'Simplex' : sprintf('%+0.3f MHz', $shift);

                    if (!empty($bmDevice['tx'])) {
                        $item['tx'] = (string)$bmDevice['tx'];
                        $item['frequency'] = (string)$bmDevice['tx'];
                    }
                    if (!empty($bmDevice['rx'])) {
                        $item['rx'] = (string)$bmDevice['rx'];
                    }
                    $item['offset'] = $offsetStr;
                    $item['color_code'] = $bmDevice['colorcode'] ?? $item['color_code'] ?? 1;
                    $item['status'] = $bmDevice['statusText'] ?? $item['status'] ?? 'Activo';
                    $item['coverage'] = 'BrandMeister DMR' . (!empty($bmDevice['lastKnownMaster']) ? " (Master {$bmDevice['lastKnownMaster']})" : '');
                    $item['hardware'] = $bmDevice['hardware'] ?? ($bmDevice['linkname'] ?? null);
                    $item['linkname'] = $bmDevice['linkname'] ?? null;
                    if (!empty($bmDevice['city'])) {
                        $item['city'] = $bmDevice['city'];
                    }
                    if (!empty($bmDevice['description'])) {
                        $item['description'] = $bmDevice['description'];
                    }

                    if (!empty($bmDevice['permissions']) && is_array($bmDevice['permissions'])) {
                        $sysops = [];
                        foreach ($bmDevice['permissions'] as $p) {
                            if (!empty($p['username']) && !in_array($p['username'], $sysops, true)) {
                                $sysops[] = $p['username'];
                            }
                        }
                        if (!empty($sysops)) {
                            $item['trustee'] = $sysops;
                        }
                    }

                    $item['bm_device'] = $bmDevice;
                }
            }
        }
    }
    unset($item);
    $rawResponse = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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
