<?php
/**
 * Sincronización desacoplada del Directorio Mundial de RadioID.net
 * Descarga y almacena en archivo local plano/JSON en disco temporal
 * SIN TOCAR la base de datos MySQL, garantizando backups y migraciones limpias.
 *
 * Puede ejecutarse por Cron en cPanel:
 * php /ruta/public/api/cron-radioid-sync.php
 * O por web con clave de seguridad:
 * /api/cron-radioid-sync.php?key=bm_yv_radioid_sync_2026
 */

// Aumentar límites para procesar el dump mundial (~30MB)
@ini_set('memory_limit', '512M');
@set_time_limit(300);

require_once __DIR__ . '/db.php';
bm_cors_headers();
header('Content-Type: application/json; charset=utf-8');

// Seguridad: Solo permitir ejecución por CLI o con clave secreta
$isCli = (php_sapi_name() === 'cli');
$authKey = $_GET['key'] ?? '';
$expectedKey = getenv('RADIOID_SYNC_KEY') ?: 'bm_yv_radioid_sync_2026';

if (!$isCli && $authKey !== $expectedKey) {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado. Clave de sincronización no válida.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheDir = sys_get_temp_dir() . '/bm_radioid_cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$dumpFile = $cacheDir . '/users_dump.json';
$veFile = $cacheDir . '/users_ve.json';
$latamFile = $cacheDir . '/users_latam.json';
$metaFile = $cacheDir . '/sync_meta.json';

// URLs de dump oficial de RadioID.net
$primaryUrl = 'https://database.radioid.net/static/users.json';
$fallbackCsvUrl = 'https://database.radioid.net/static/users.csv';

$startTime = microtime(true);
$downloadSuccess = false;
$rawContent = false;

// 1. Descargar dump oficial
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $primaryUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 180);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'User-Agent: BrandMeister-Venezuela-CodeplugSync/1.0'
    ]);
    $rawContent = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($rawContent !== false && $httpCode >= 200 && $httpCode < 300 && strlen($rawContent) > 1000) {
        $downloadSuccess = true;
    }
}

if (!$downloadSuccess) {
    // Si curl falla, intentar stream
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 180,
            'header' => "User-Agent: BrandMeister-Venezuela-CodeplugSync/1.0\r\nAccept: application/json\r\n"
        ]
    ]);
    $rawContent = @file_get_contents($primaryUrl, false, $ctx);
    if ($rawContent !== false && strlen($rawContent) > 1000) {
        $downloadSuccess = true;
    }
}

if (!$downloadSuccess || empty($rawContent)) {
    // Si falla el dump completo, verificar si tenemos una versión en caché reciente
    if (file_exists($dumpFile)) {
        echo json_encode([
            'status' => 'warning',
            'message' => 'No se pudo descargar el dump fresco de RadioID.net; se mantiene la versión en caché anterior.',
            'cache_time' => date('Y-m-d H:i:s', filemtime($dumpFile))
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    http_response_code(502);
    echo json_encode([
        'error' => 'Error al contactar con el repositorio oficial de RadioID.net.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Guardar archivo global principal
@file_put_contents($dumpFile, $rawContent);

// 2. Procesar e indexar subconjuntos rápidos (Venezuela e Iberoamérica)
$decoded = json_decode($rawContent, true);
$users = [];
if (isset($decoded['users']) && is_array($decoded['users'])) {
    $users = $decoded['users'];
} elseif (isset($decoded['results']) && is_array($decoded['results'])) {
    $users = $decoded['results'];
} elseif (is_array($decoded)) {
    $users = $decoded;
}

$latamCountries = [
    'venezuela' => true, 'colombia' => true, 'mexico' => true, 'spain' => true, 'españa' => true,
    'chile' => true, 'argentina' => true, 'peru' => true, 'perú' => true, 'ecuador' => true,
    'panama' => true, 'panamá' => true, 'costa rica' => true, 'guatemala' => true, 'honduras' => true,
    'el salvador' => true, 'nicaragua' => true, 'uruguay' => true, 'paraguay' => true, 'bolivia' => true,
    'dominican republic' => true, 'república dominicana' => true, 'puerto rico' => true, 'cuba' => true,
    'brazil' => true, 'brasil' => true, 'portugal' => true
];

$veList = [];
$latamList = [];
$totalUsers = count($users);

foreach ($users as $u) {
    $country = strtolower(trim($u['country'] ?? ''));
    $radioId = (string)($u['id'] ?? $u['radio_id'] ?? '');

    // Venezuela: Por país o por prefijo de ID 734
    if ($country === 'venezuela' || str_starts_with($radioId, '734')) {
        $veList[] = $u;
        $latamList[] = $u;
    } elseif (isset($latamCountries[$country])) {
        $latamList[] = $u;
    }
}

// Guardar particiones optimizadas
@file_put_contents($veFile, json_encode($veList, JSON_UNESCAPED_UNICODE));
@file_put_contents($latamFile, json_encode($latamList, JSON_UNESCAPED_UNICODE));

$meta = [
    'updated_at' => date('Y-m-d H:i:s'),
    'timestamp' => time(),
    'duration_seconds' => round(microtime(true) - $startTime, 2),
    'total_global_users' => $totalUsers,
    'venezuela_users' => count($veList),
    'latam_users' => count($latamList),
    'dump_size_bytes' => strlen($rawContent)
];
@file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'status' => 'success',
    'message' => 'Sincronización completada exitosamente sin afectar la base de datos MySQL.',
    'meta' => $meta
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
