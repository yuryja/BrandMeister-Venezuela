<?php
/**
 * API de Analíticas y Telemetría de Usuario para BrandMeister Venezuela
 * - POST ?action=track : Registra clics, reproducciones, lecturas y compartidos
 * - GET ?action=stats : Retorna métricas consolidadas, puntos Leaflet, oyentes del reproductor y enlaces
 */

require_once __DIR__ . '/db.php';

// Detectar IP del cliente
function get_client_ip(): string {
    $keys = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'REMOTE_ADDR'
    ];
    foreach ($keys as $key) {
        if (!empty($_SERVER[$key])) {
            $ipList = explode(',', $_SERVER[$key]);
            $ip = trim($ipList[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

// Detectar tipo de dispositivo
function detect_device_type(): string {
    $ua = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
    if (strpos($ua, 'tablet') !== false || strpos($ua, 'ipad') !== false) {
        return 'tablet';
    }
    if (strpos($ua, 'mobile') !== false || strpos($ua, 'android') !== false || strpos($ua, 'iphone') !== false) {
        return 'mobile';
    }
    return 'desktop';
}

// Detección geográfica gratuita por IP sin necesidad de API key (ip-api.com)
function resolve_ip_location(string $ip): ?array {
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return null;
    }
    $ctx = stream_context_create([
        'http' => ['timeout' => 1.5, 'ignore_errors' => true]
    ]);
    $json = @file_get_contents("http://ip-api.com/json/{$ip}?fields=status,country,countryCode,city,lat,lon", false, $ctx);
    if ($json) {
        $res = json_decode($json, true);
        if (($res['status'] ?? '') === 'success') {
            return $res;
        }
    }
    return null;
}

// Estructura vacía cuando la base de datos no tiene eventos aún
function get_empty_stats(): array {
    return [
        'success' => true,
        'kpis' => [
            'player_plays' => 0,
            'unique_listeners' => 0,
            'link_clicks' => 0,
            'post_views' => 0,
            'post_shares' => 0,
            'active_countries' => 0,
        ],
        'map_points' => [],
        'player' => [
            'countries' => [],
            'listeners' => [],
            'total_plays' => 0,
        ],
        'links' => [],
        'posts' => [],
        'shares' => [
            'platforms' => [],
            'total' => 0
        ],
    ];
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// --------------------------------------------------------------------
// 1. RASTREO DE EVENTOS (POST)
// --------------------------------------------------------------------
if ($action === 'track' || $_SERVER['REQUEST_METHOD'] === 'POST' && empty($action)) {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $eventType = trim((string)($data['event_type'] ?? ''));
    $validTypes = ['player_play', 'link_click', 'post_view', 'post_share', 'page_view'];
    if (!in_array($eventType, $validTypes, true)) {
        send_json(['error' => 'Tipo de evento no válido'], 400);
    }

    $eventCategory = trim((string)($data['event_category'] ?? 'general'));
    $entityId = substr(trim((string)($data['entity_id'] ?? '')), 0, 100);
    $entityTitle = substr(trim((string)($data['entity_title'] ?? '')), 0, 255);
    $platform = substr(trim((string)($data['platform'] ?? 'web')), 0, 50);

    $ipAddress = get_client_ip();
    $deviceType = detect_device_type();
    $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
    $referrer = substr($_SERVER['HTTP_REFERER'] ?? '', 0, 255);

    // Detección de país y coordenadas iniciales
    $countryCode = strtoupper(substr(trim($_SERVER['HTTP_CF_IPCOUNTRY'] ?? ($data['country_code'] ?? 'VE')), 0, 3));
    $countryName = trim((string)($data['country_name'] ?? 'Venezuela'));
    $city = trim((string)($data['city'] ?? 'Caracas'));
    $lat = isset($data['latitude']) ? (float)$data['latitude'] : 10.4806;
    $lng = isset($data['longitude']) ? (float)$data['longitude'] : -66.9036;

    // Si es una IP pública de internet y no venían coordenadas del cliente, geolocalizar automáticamente sin API key
    if (empty($data['latitude'])) {
        $geo = resolve_ip_location($ipAddress);
        if ($geo) {
            $countryCode = strtoupper($geo['countryCode'] ?? $countryCode);
            $countryName = $geo['country'] ?? $countryName;
            $city = $geo['city'] ?? $city;
            $lat = (float)($geo['lat'] ?? $lat);
            $lng = (float)($geo['lon'] ?? $lng);
        }
    }

    $metadataJson = isset($data['metadata']) ? json_encode($data['metadata'], JSON_UNESCAPED_UNICODE) : null;

    $pdo = get_db_connection();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO bm_analytics_events 
                (event_type, event_category, entity_id, entity_title, platform, ip_address, country_code, country_name, city, latitude, longitude, user_agent, device_type, referrer, metadata)
                VALUES 
                (:event_type, :event_category, :entity_id, :entity_title, :platform, :ip_address, :country_code, :country_name, :city, :latitude, :longitude, :user_agent, :device_type, :referrer, :metadata)");
            
            $stmt->execute([
                ':event_type' => $eventType,
                ':event_category' => $eventCategory,
                ':entity_id' => $entityId ?: null,
                ':entity_title' => $entityTitle ?: null,
                ':platform' => $platform ?: null,
                ':ip_address' => $ipAddress,
                ':country_code' => $countryCode ?: null,
                ':country_name' => $countryName ?: null,
                ':city' => $city ?: null,
                ':latitude' => $lat,
                ':longitude' => $lng,
                ':user_agent' => $userAgent,
                ':device_type' => $deviceType,
                ':referrer' => $referrer ?: null,
                ':metadata' => $metadataJson,
            ]);

            send_json(['success' => true]);
        } catch (Exception $e) {
            // Silencioso para el cliente
            error_log('[BM-YV Analytics Track Error] ' . $e->getMessage());
        }
    }

    send_json(['success' => true, 'logged' => false]);
}

// --------------------------------------------------------------------
// 2. OBTENCIÓN DE ESTADÍSTICAS (GET)
// --------------------------------------------------------------------
if ($action === 'stats' || $action === 'summary') {
    $pdo = get_db_connection();
    if (!$pdo) {
        send_json(get_empty_stats());
    }

    try {
        // Verificar si la tabla existe y tiene registros
        $check = $pdo->query("SELECT COUNT(*) FROM bm_analytics_events");
        $totalEvents = (int)$check->fetchColumn();
        if ($totalEvents === 0) {
            send_json(get_empty_stats());
        }

        // KPIs
        $kpisStmt = $pdo->query("SELECT
            SUM(CASE WHEN event_type = 'player_play' THEN 1 ELSE 0 END) AS player_plays,
            COUNT(DISTINCT CASE WHEN event_type = 'player_play' THEN ip_address ELSE NULL END) AS unique_listeners,
            SUM(CASE WHEN event_type = 'link_click' THEN 1 ELSE 0 END) AS link_clicks,
            SUM(CASE WHEN event_type = 'post_view' THEN 1 ELSE 0 END) AS post_views,
            SUM(CASE WHEN event_type = 'post_share' THEN 1 ELSE 0 END) AS post_shares,
            COUNT(DISTINCT country_code) AS active_countries
            FROM bm_analytics_events");
        $kpis = $kpisStmt->fetch() ?: [];

        // Puntos geográficos para Leaflet
        $mapStmt = $pdo->query("SELECT
            latitude AS lat,
            longitude AS lng,
            city,
            country_name AS country,
            country_code AS code,
            COUNT(*) AS count,
            SUM(CASE WHEN event_type = 'player_play' THEN 1 ELSE 0 END) AS audio_count,
            SUM(CASE WHEN event_type = 'link_click' THEN 1 ELSE 0 END) AS link_count
            FROM bm_analytics_events
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            GROUP BY latitude, longitude, city, country_name, country_code
            ORDER BY count DESC");
        $mapPointsRaw = $mapStmt->fetchAll();
        $mapPoints = [];
        foreach ($mapPointsRaw as $row) {
            $mapPoints[] = [
                'lat' => (float)$row['lat'],
                'lng' => (float)$row['lng'],
                'city' => $row['city'] ?: 'Desconocida',
                'country' => $row['country'] ?: 'Global',
                'code' => $row['code'] ?: 'WW',
                'count' => (int)$row['count'],
                'events' => [
                    'player_play' => (int)$row['audio_count'],
                    'link_click' => (int)$row['link_count'],
                ]
            ];
        }

        // Reproductor: Países
        $countryStmt = $pdo->query("SELECT
            country_name AS country,
            country_code AS code,
            COUNT(*) AS plays
            FROM bm_analytics_events
            WHERE event_type = 'player_play' AND country_name IS NOT NULL
            GROUP BY country_name, country_code
            ORDER BY plays DESC LIMIT 6");
        $playerCountriesRaw = $countryStmt->fetchAll();
        $totalPlayerPlays = max(1, (int)($kpis['player_plays'] ?? 0));
        $playerCountries = [];
        foreach ($playerCountriesRaw as $row) {
            $p = (int)$row['plays'];
            $playerCountries[] = [
                'country' => $row['country'],
                'code' => $row['code'],
                'plays' => $p,
                'percent' => round(($p / $totalPlayerPlays) * 100),
            ];
        }

        // Reproductor: Oyentes por IP y conteo
        $listenersStmt = $pdo->query("SELECT
            ip_address AS ip,
            country_name AS country,
            country_code AS code,
            city,
            COUNT(*) AS plays,
            MAX(created_at) AS last_active_ts
            FROM bm_analytics_events
            WHERE event_type = 'player_play'
            GROUP BY ip_address, country_name, country_code, city
            ORDER BY plays DESC LIMIT 10");
        $listenersRaw = $listenersStmt->fetchAll();
        $playerListeners = [];
        foreach ($listenersRaw as $row) {
            $playerListeners[] = [
                'ip' => $row['ip'],
                'country' => $row['country'] ?: 'Desconocido',
                'code' => $row['code'] ?: 'VE',
                'city' => $row['city'] ?: 'Venezuela',
                'plays' => (int)$row['plays'],
                'last_active' => date('d/m H:i', strtotime($row['last_active_ts'])),
                'status' => 'Activo'
            ];
        }

        // Clics en enlaces
        $linksStmt = $pdo->query("SELECT
            COALESCE(entity_title, entity_id) AS title,
            entity_id AS url,
            event_category AS category,
            COUNT(*) AS clicks
            FROM bm_analytics_events
            WHERE event_type = 'link_click'
            GROUP BY title, url, category
            ORDER BY clicks DESC LIMIT 8");
        $linkClicks = $linksStmt->fetchAll() ?: [];

        // Lecturas de publicaciones
        $postsStmt = $pdo->query("SELECT
            p.title,
            p.category,
            COALESCE(p.views_count, COUNT(e.id)) AS views,
            SUM(CASE WHEN e.event_type = 'post_share' THEN 1 ELSE 0 END) AS shares
            FROM bm_posts p
            LEFT JOIN bm_analytics_events e ON e.entity_id = p.slug OR e.entity_id = CAST(p.id AS CHAR)
            WHERE p.status = 'published'
            GROUP BY p.id, p.title, p.category, p.views_count
            ORDER BY views DESC LIMIT 6");
        $postViews = $postsStmt->fetchAll() ?: [];

        // Compartidos en redes
        $sharesStmt = $pdo->query("SELECT
            platform,
            COUNT(*) AS shares
            FROM bm_analytics_events
            WHERE event_type = 'post_share'
            GROUP BY platform
            ORDER BY shares DESC");
        $sharesRaw = $sharesStmt->fetchAll() ?: [];
        $totalShares = max(1, (int)($kpis['post_shares'] ?? 0));
        $platformMap = [
            'whatsapp' => ['name' => 'WhatsApp', 'color' => '#25D366'],
            'telegram' => ['name' => 'Telegram', 'color' => '#229ED9'],
            'twitter' => ['name' => 'X (Twitter)', 'color' => '#0F172A'],
            'facebook' => ['name' => 'Facebook', 'color' => '#1877F2'],
            'copy_link' => ['name' => 'Copiar Enlace', 'color' => '#64748B'],
        ];
        $platforms = [];
        foreach ($sharesRaw as $row) {
            $key = strtolower($row['platform'] ?: 'copy_link');
            $meta = $platformMap[$key] ?? ['name' => ucfirst($key), 'color' => '#64748B'];
            $cnt = (int)$row['shares'];
            $platforms[] = [
                'name' => $meta['name'],
                'shares' => $cnt,
                'percent' => round(($cnt / $totalShares) * 100),
                'color' => $meta['color']
            ];
        }

        send_json([
            'success' => true,
            'kpis' => [
                'player_plays' => (int)($kpis['player_plays'] ?? 0),
                'unique_listeners' => (int)($kpis['unique_listeners'] ?? 0),
                'link_clicks' => (int)($kpis['link_clicks'] ?? 0),
                'post_views' => (int)($kpis['post_views'] ?? 0),
                'post_shares' => (int)($kpis['post_shares'] ?? 0),
                'active_countries' => (int)($kpis['active_countries'] ?? 0),
            ],
            'map_points' => $mapPoints,
            'player' => [
                'countries' => $playerCountries,
                'listeners' => $playerListeners,
                'total_plays' => (int)($kpis['player_plays'] ?? 0),
            ],
            'links' => $linkClicks,
            'posts' => $postViews,
            'shares' => [
                'platforms' => $platforms,
                'total' => (int)($kpis['post_shares'] ?? 0)
            ],
        ]);
    } catch (Exception $e) {
        error_log('[BM-YV Analytics Stats Error] ' . $e->getMessage());
        send_json(get_empty_stats());
    }
}

send_json(['error' => 'Acción no especificada'], 400);
