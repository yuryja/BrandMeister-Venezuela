<?php
/**
 * API de Analíticas y Telemetría de Usuario para BrandMeister Venezuela
 * - POST ?action=track : Registra clics, reproducciones, lecturas y compartidos
 * - GET ?action=stats : Retorna métricas consolidadas, puntos Leaflet, oyentes del reproductor y enlaces
 */

require_once __DIR__ . '/db.php';

/**
 * IP real del visitante.
 *
 * Cabeceras como X-Forwarded-For las puede inventar cualquiera con un curl, y con ellas se
 * saltaría el freno por IP y se ensuciarían las estadísticas y el mapa. Por eso se usa siempre
 * REMOTE_ADDR, salvo que el sitio esté detrás de un proxy de confianza (Cloudflare u otro) y se
 * indique qué cabecera mira en ~/bmyv-config.php:
 *   'TRUSTED_PROXY_HEADER' => 'CF-Connecting-IP'
 */
function bm_trusted_proxy_header(): string {
    return trim((string)getenv('TRUSTED_PROXY_HEADER'));
}

function get_client_ip(): string {
    $header = bm_trusted_proxy_header();
    if ($header !== '') {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $header));
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', (string)$_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

/**
 * Canales de origen que sabemos reconocer, con el nombre que se ve en el panel.
 * El orden es el que se usa para mostrarlos cuando empatan.
 */
const BM_TRAFFIC_LABELS = [
    'buscador' => 'Buscadores',
    'whatsapp' => 'WhatsApp',
    'telegram' => 'Telegram',
    'facebook' => 'Facebook',
    'instagram' => 'Instagram',
    'x' => 'X (Twitter)',
    'youtube' => 'YouTube',
    'correo' => 'Correo electrónico',
    'compartido' => 'Enlace compartido',
    'enlace' => 'Otros sitios',
    'directo' => 'Directo',
];

/** Dominio de un enlace, en minúsculas y sin www. Cadena vacía si no es una URL usable. */
function bm_url_host(string $url): string {
    $url = trim($url);
    if ($url === '' || strlen($url) > 500) {
        return '';
    }
    $host = (string)parse_url($url, PHP_URL_HOST);
    if ($host === '') {
        // Enlaces de apps de Android: android-app://com.whatsapp
        if (preg_match('#^android-app://([a-z0-9._-]+)#i', $url, $m)) {
            return strtolower($m[1]);
        }
        return '';
    }
    return preg_replace('/^www\./', '', strtolower($host));
}

/**
 * De dónde llega la visita. Se miran tres señales, de más a menos fiable:
 *
 *   1. utm_source / ref en la dirección: lo que ponemos nosotros al compartir un enlace
 *      (p. ej. brandmeisteryv.net/?utm_source=whatsapp). Es lo único que funciona cuando
 *      WhatsApp abre el enlace sin decir de dónde viene, que es lo habitual en el móvil.
 *   2. El sitio de procedencia que informa el navegador.
 *   3. El navegador integrado de la app (WhatsApp, Instagram y Facebook se identifican
 *      en el user agent aunque no manden procedencia).
 *
 * Devuelve [canal, dominio de procedencia] ('interno' cuando solo es navegación por el sitio).
 */
function bm_traffic_source(string $referrer, string $hint, string $userAgent, string $ownHost): array {
    $host = bm_url_host($referrer);
    $isInternal = $host !== '' && ($host === $ownHost || substr($host, -strlen(".$ownHost")) === ".$ownHost");
    $externalHost = $isInternal ? '' : $host;

    // 1. Lo que indica la propia dirección del enlace compartido
    $hint = strtolower(preg_replace('/[^a-z0-9_-]/i', '', $hint));
    $hintMap = [
        'whatsapp' => 'whatsapp', 'wa' => 'whatsapp', 'wsp' => 'whatsapp',
        'telegram' => 'telegram', 'tg' => 'telegram',
        'facebook' => 'facebook', 'fb' => 'facebook',
        'instagram' => 'instagram', 'ig' => 'instagram',
        'twitter' => 'x', 'x' => 'x',
        'youtube' => 'youtube', 'yt' => 'youtube',
        'email' => 'correo', 'correo' => 'correo', 'mail' => 'correo', 'newsletter' => 'correo',
        'google' => 'buscador', 'bing' => 'buscador', 'buscador' => 'buscador',
        // Enlace copiado desde el botón "Copiar enlace" de una noticia
        'compartido' => 'compartido', 'copiado' => 'compartido', 'copiar' => 'compartido',
    ];
    if ($hint !== '' && isset($hintMap[$hint])) {
        return [$hintMap[$hint], $externalHost];
    }

    // 2. El sitio desde el que se hizo clic
    if ($host !== '' && !$isInternal) {
        $byHost = [
            'buscador' => ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'ecosia.', 'search.brave.', 'yandex.', 'baidu.', 'search.marginalia.', 'startpage.'],
            'whatsapp' => ['whatsapp.com', 'wa.me', 'com.whatsapp'],
            'telegram' => ['t.me', 'telegram.me', 'telegram.org', 'org.telegram'],
            'facebook' => ['facebook.com', 'fb.com', 'fb.me', 'com.facebook'],
            'instagram' => ['instagram.com', 'com.instagram'],
            'x' => ['twitter.com', 'x.com', 't.co'],
            'youtube' => ['youtube.com', 'youtu.be'],
            'correo' => ['mail.google.com', 'outlook.', 'mail.yahoo.', 'roundcube', 'webmail.', 'mail.proton'],
        ];
        foreach ($byHost as $key => $needles) {
            foreach ($needles as $needle) {
                if (strpos($host, $needle) !== false) {
                    return [$key, $externalHost];
                }
            }
        }
        return ['enlace', $externalHost];
    }

    // 3. Navegador integrado de la app, cuando no hay procedencia
    $ua = strtolower($userAgent);
    if (strpos($ua, 'whatsapp') !== false) return ['whatsapp', ''];
    if (strpos($ua, 'instagram') !== false) return ['instagram', ''];
    if (strpos($ua, 'telegram') !== false) return ['telegram', ''];
    if (strpos($ua, 'fban') !== false || strpos($ua, 'fbav') !== false || strpos($ua, 'fb_iab') !== false) return ['facebook', ''];

    return [$isInternal ? 'interno' : 'directo', ''];
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

/**
 * Ubicación ya conocida de esa IP en los últimos 30 días: evita salir a internet en cada visita
 * (una consulta externa por evento ralentiza el sitio y se puede usar para saturarlo).
 */
function cached_ip_location(?PDO $pdo, string $ip): ?array {
    if (!$pdo) return null;
    try {
        $stmt = $pdo->prepare("SELECT country_code, country_name, city, latitude, longitude
            FROM bm_analytics_events
            WHERE ip_address = :ip AND latitude IS NOT NULL AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY id DESC LIMIT 1");
        $stmt->execute([':ip' => $ip]);
        $row = $stmt->fetch();
        if (!$row) return null;
        return [
            'countryCode' => $row['country_code'],
            'country' => $row['country_name'],
            'city' => $row['city'],
            'lat' => $row['latitude'],
            'lon' => $row['longitude'],
        ];
    } catch (Exception $e) {
        return null;
    }
}

/** Retención: ni las analíticas ni el registro de actividad guardan IPs para siempre */
function purge_old_rows(PDO $pdo): void {
    try {
        $pdo->exec("DELETE FROM bm_analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 365 DAY) LIMIT 500");
        $pdo->exec("DELETE FROM bm_activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 365 DAY) LIMIT 500");
    } catch (Exception $e) {
        error_log('[BM-YV Analytics] purga: ' . $e->getMessage());
    }
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
            'petra_views' => 0,
            'petra_unique' => 0,
            'page_views' => 0,
            'unique_visitors' => 0,
            'active_countries' => 0,
        ],
        'traffic' => [
            'sources' => [],
            'sites' => [],
            'total_visits' => 0,
            'page_views' => 0,
            'unique_visitors' => 0,
        ],
        'audience' => [
            'devices' => [
                ['type' => 'mobile', 'name' => 'Móvil', 'color' => '#E8261C', 'visits' => 0, 'people' => 0, 'percent' => 0],
                ['type' => 'desktop', 'name' => 'Escritorio', 'color' => '#EE6C1F', 'visits' => 0, 'people' => 0, 'percent' => 0],
                ['type' => 'tablet', 'name' => 'Tablet', 'color' => '#F2A93B', 'visits' => 0, 'people' => 0, 'percent' => 0],
            ],
            'total_device_visits' => 0,
            'days' => [],
            'max_day_visits' => 0,
            'peak_day' => null,
            'hours' => [],
            'max_hour_visits' => 0,
            'peak_hour' => null,
        ],
        'map_points' => [],
        'player' => [
            'countries' => [],
            'listeners' => [],
            'total_plays' => 0,
        ],
        'petra' => [
            'total_views' => 0,
            'unique_visitors' => 0,
            'talkgroups' => [
                ['id' => '734', 'name' => 'TG 734 Venezuela', 'badge' => 'Nacional', 'sub' => 'Canal principal nacional', 'views' => 0, 'unique_users' => 0, 'percent' => 0],
                ['id' => '73452', 'name' => 'TG 73452 Emergencias y Eventos', 'badge' => 'Emergencias', 'sub' => 'Operaciones y contingencia', 'views' => 0, 'unique_users' => 0, 'percent' => 0],
                ['id' => '73473', 'name' => 'TG 73473 Radio Club Venezolano', 'badge' => 'RCV', 'sub' => 'Boletín e institucional', 'views' => 0, 'unique_users' => 0, 'percent' => 0],
                ['id' => '73411', 'name' => 'TG 73411 Red Venezolana de Radiodifusión', 'badge' => 'RVR', 'sub' => 'Difusión y ruedas temáticas', 'views' => 0, 'unique_users' => 0, 'percent' => 0],
            ],
        ],
        'countries_detail' => [],
        'live_audio' => [
            'is_active' => false,
            'total_listeners' => 0,
            'countries' => [],
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

    // Solo identificadores simples: nada de HTML ni texto arbitrario en estos campos
    $eventCategory = preg_replace('/[^a-z0-9_-]/i', '', (string)($data['event_category'] ?? 'general')) ?: 'general';
    $eventCategory = substr($eventCategory, 0, 50);
    $entityId = mb_substr(trim(strip_tags((string)($data['entity_id'] ?? ''))), 0, 100);
    $entityTitle = mb_substr(trim(preg_replace('/\s+/', ' ', strip_tags((string)($data['entity_title'] ?? '')))), 0, 255);
    $platform = strtolower(preg_replace('/[^a-z0-9_-]/i', '', (string)($data['platform'] ?? 'web')));
    $platform = substr($platform ?: 'web', 0, 50);

    $ipAddress = get_client_ip();
    $deviceType = detect_device_type();
    $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

    // La procedencia la manda el navegador en el propio evento (document.referrer): la cabecera
    // Referer de esta petición siempre apunta a nuestra propia página, así que no sirve de origen.
    $referrer = substr(trim((string)($data['referrer'] ?? '')), 0, 255);

    // Solo los avisos de visita informan de dónde viene la gente. Los demás (lecturas,
    // reproducciones, clics) se guardan sin origen en vez de inventarles uno.
    $informaOrigen = array_key_exists('referrer', $data) || array_key_exists('source_hint', $data);
    $trafficSource = null;
    $referrerHost = '';
    if ($informaOrigen) {
        $ownHost = preg_replace('/^www\./', '', strtolower((string)(parse_url((string)getenv('SITE_URL'), PHP_URL_HOST) ?: ($_SERVER['HTTP_HOST'] ?? ''))));
        $ownHost = preg_replace('/:\d+$/', '', $ownHost);
        [$trafficSource, $referrerHost] = bm_traffic_source(
            $referrer,
            (string)($data['source_hint'] ?? ''),
            $userAgent,
            $ownHost
        );
        if ($trafficSource === 'interno') {
            $referrer = '';
        }
    } else {
        $referrer = '';
    }

    // La ubicación nunca se toma del navegador (se podría falsear): solo de la IP.
    // Sin geolocalización se guarda sin coordenadas y no aparece en el mapa.
    // El país de Cloudflare solo vale si de verdad estamos detrás de Cloudflare (ver get_client_ip)
    $cfCountry = bm_trusted_proxy_header() !== '' ? (string)($_SERVER['HTTP_CF_IPCOUNTRY'] ?? '') : '';
    $countryCode = preg_replace('/[^A-Z]/', '', strtoupper($cfCountry));
    $countryCode = substr($countryCode, 0, 2) ?: null;
    $countryName = null;
    $city = null;
    $lat = null;
    $lng = null;

    $pdo = get_db_connection();

    // Freno contra abusos: máximo 120 eventos por IP cada 10 minutos
    if ($pdo) {
        try {
            $recent = $pdo->prepare("SELECT COUNT(*) FROM bm_analytics_events WHERE ip_address = :ip AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)");
            $recent->execute([':ip' => $ipAddress]);
            if ((int)$recent->fetchColumn() >= 120) {
                send_json(['success' => true, 'logged' => false]);
            }
        } catch (Exception $e) {
            error_log('[BM-YV Analytics] ' . $e->getMessage());
        }
    }

    if ($pdo && random_int(1, 200) === 1) {
        purge_old_rows($pdo);
    }

    $geo = cached_ip_location($pdo, $ipAddress) ?: resolve_ip_location($ipAddress);
    if ($geo) {
        $countryCode = substr(preg_replace('/[^A-Z]/', '', strtoupper((string)($geo['countryCode'] ?? ''))), 0, 2) ?: $countryCode;
        $countryName = mb_substr(strip_tags((string)($geo['country'] ?? '')), 0, 100) ?: null;
        $city = mb_substr(strip_tags((string)($geo['city'] ?? '')), 0, 100) ?: null;
        if (is_numeric($geo['lat'] ?? null) && is_numeric($geo['lon'] ?? null)) {
            $lat = max(-90, min(90, (float)$geo['lat']));
            $lng = max(-180, min(180, (float)$geo['lon']));
        }
    }

    // Metadatos acotados (no se guardan objetos arbitrariamente grandes)
    $metadataJson = null;
    if (isset($data['metadata']) && is_array($data['metadata'])) {
        $encoded = json_encode($data['metadata'], JSON_UNESCAPED_UNICODE);
        $metadataJson = ($encoded !== false && strlen($encoded) <= 2000) ? $encoded : null;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO bm_analytics_events
                (event_type, event_category, entity_id, entity_title, platform, ip_address, country_code, country_name, city, latitude, longitude, user_agent, device_type, referrer, traffic_source, referrer_host, metadata)
                VALUES
                (:event_type, :event_category, :entity_id, :entity_title, :platform, :ip_address, :country_code, :country_name, :city, :latitude, :longitude, :user_agent, :device_type, :referrer, :traffic_source, :referrer_host, :metadata)");
            
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
                ':traffic_source' => $trafficSource,
                ':referrer_host' => $referrerHost ?: null,
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
    // Contiene IP y ubicación de los visitantes: solo para el equipo del panel
    start_secure_session();
    require_role(['admin', 'editor']);

    $pdo = get_db_connection();
    if (!$pdo) {
        send_json(get_empty_stats());
    }

    // Rango: 7d, 30d o all (histórico). Se aplica a todas las consultas de eventos
    $ranges = ['7d' => 7, '30d' => 30, 'all' => 0];
    $rangeKey = isset($ranges[$_GET['range'] ?? '']) ? $_GET['range'] : '7d';
    $days = $ranges[$rangeKey];
    $since = $days ? " AND created_at >= DATE_SUB(NOW(), INTERVAL $days DAY)" : '';

    try {
        // Verificar si la tabla existe y tiene registros
        $check = $pdo->query("SELECT COUNT(*) FROM bm_analytics_events WHERE 1 = 1 $since");
        $totalEvents = (int)$check->fetchColumn();
        if ($totalEvents === 0) {
            send_json(get_empty_stats());
        }

        // KPIs
        $kpisStmt = $pdo->query("SELECT
            SUM(CASE WHEN event_type = 'player_play' AND event_category NOT IN ('audio_heartbeat', 'audio_stop') THEN 1 ELSE 0 END) AS player_plays,
            COUNT(DISTINCT CASE WHEN event_type = 'player_play' AND event_category NOT IN ('audio_heartbeat', 'audio_stop') THEN ip_address ELSE NULL END) AS unique_listeners,
            SUM(CASE WHEN event_type = 'link_click' THEN 1 ELSE 0 END) AS link_clicks,
            SUM(CASE WHEN event_type = 'post_view' THEN 1 ELSE 0 END) AS post_views,
            SUM(CASE WHEN event_type = 'post_share' THEN 1 ELSE 0 END) AS post_shares,
            SUM(CASE WHEN event_type = 'page_view' AND event_category = 'petra_view' THEN 1 ELSE 0 END) AS petra_views,
            COUNT(DISTINCT CASE WHEN event_type = 'page_view' AND event_category = 'petra_view' THEN ip_address ELSE NULL END) AS petra_unique,
            SUM(CASE WHEN event_type = 'page_view' AND event_category = 'pagina' THEN 1 ELSE 0 END) AS page_views,
            COUNT(DISTINCT CASE WHEN event_type = 'page_view' AND event_category = 'pagina' THEN ip_address ELSE NULL END) AS unique_visitors,
            COUNT(DISTINCT country_code) AS active_countries
            FROM bm_analytics_events
            WHERE 1 = 1 $since");
        $kpis = $kpisStmt->fetch() ?: [];

        // Puntos geográficos para Leaflet
        $mapStmt = $pdo->query("SELECT
            latitude AS lat,
            longitude AS lng,
            city,
            country_name AS country,
            country_code AS code,
            COUNT(*) AS count,
            SUM(CASE WHEN event_type = 'player_play' AND event_category NOT IN ('audio_heartbeat', 'audio_stop') THEN 1 ELSE 0 END) AS audio_count,
            SUM(CASE WHEN event_type = 'link_click' THEN 1 ELSE 0 END) AS link_count,
            SUM(CASE WHEN event_type = 'post_view' THEN 1 ELSE 0 END) AS post_count,
            SUM(CASE WHEN event_type = 'page_view' AND event_category = 'petra_view' THEN 1 ELSE 0 END) AS petra_count
            FROM bm_analytics_events
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL $since
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
                    'post_view' => (int)$row['post_count'],
                    'petra_view' => (int)($row['petra_count'] ?? 0),
                ]
            ];
        }

        // Reproductor: Países
        $countryStmt = $pdo->query("SELECT
            country_name AS country,
            country_code AS code,
            COUNT(*) AS plays
            FROM bm_analytics_events
            WHERE event_type = 'player_play' AND event_category NOT IN ('audio_heartbeat', 'audio_stop') AND country_name IS NOT NULL $since
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
            WHERE event_type = 'player_play' AND event_category NOT IN ('audio_heartbeat', 'audio_stop') $since
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
            WHERE event_type = 'link_click' $since
            GROUP BY title, url, category
            ORDER BY clicks DESC LIMIT 8");
        $linkClicks = $linksStmt->fetchAll() ?: [];

        // Lecturas de publicaciones: en el histórico se usa el contador total de la noticia;
        // en 7/30 días, las lecturas registradas en ese periodo
        $joinSince = $days ? " AND e.created_at >= DATE_SUB(NOW(), INTERVAL $days DAY)" : '';
        $postsStmt = $pdo->query("SELECT
            p.title,
            p.slug,
            p.category,
            p.views_count AS total_views,
            COALESCE(SUM(e.event_type = 'post_view'), 0) AS period_views,
            COALESCE(SUM(e.event_type = 'post_share'), 0) AS shares
            FROM bm_posts p
            LEFT JOIN bm_analytics_events e ON e.entity_id = p.slug $joinSince
            WHERE p.status = 'published'
            GROUP BY p.id, p.title, p.slug, p.category, p.views_count
            ORDER BY " . ($days ? 'period_views' : "GREATEST(p.views_count, COALESCE(SUM(e.event_type = 'post_view'), 0))") . " DESC, p.created_at DESC
            LIMIT 6");
        $postViews = array_map(function ($row) use ($days) {
            return [
                'title' => $row['title'],
                'slug' => $row['slug'],
                'category' => $row['category'],
                // Histórico: el contador de la noticia incluye lecturas anteriores al registro de eventos
                'views' => (int)($days ? $row['period_views'] : max((int)$row['total_views'], (int)$row['period_views'])),
                'total_views' => (int)$row['total_views'],
                'shares' => (int)$row['shares'],
            ];
        }, $postsStmt->fetchAll() ?: []);

        // Compartidos en redes
        $sharesStmt = $pdo->query("SELECT
            platform,
            COUNT(*) AS shares
            FROM bm_analytics_events
            WHERE event_type = 'post_share' $since
            GROUP BY platform
            ORDER BY shares DESC");
        $sharesRaw = $sharesStmt->fetchAll() ?: [];
        $totalShares = max(1, (int)($kpis['post_shares'] ?? 0));
        $platformMap = [
            'whatsapp' => ['name' => 'WhatsApp'],
            'telegram' => ['name' => 'Telegram'],
            'twitter' => ['name' => 'X (Twitter)'],
            'facebook' => ['name' => 'Facebook'],
            'copy_link' => ['name' => 'Copiar enlace'],
        ];
        $platforms = [];
        foreach ($sharesRaw as $row) {
            $key = strtolower($row['platform'] ?: 'copy_link');
            $meta = $platformMap[$key] ?? ['name' => ucfirst($key)];
            $cnt = (int)$row['shares'];
            $platforms[] = [
                'name' => $meta['name'],
                'shares' => $cnt,
                'key' => $key,
                'percent' => round(($cnt / $totalShares) * 100),
            ];
        }

        // Telemetría del Sistema Petra (interacciones y distribución de Talkgroups)
        $petraStmt = $pdo->query("SELECT
            entity_id AS tg,
            COUNT(*) AS views,
            COUNT(DISTINCT ip_address) AS unique_users
            FROM bm_analytics_events
            WHERE event_type = 'page_view' AND event_category = 'petra_view' $since
            GROUP BY entity_id");
        $petraRows = $petraStmt->fetchAll() ?: [];
        $petraMap = [];
        foreach ($petraRows as $r) {
            $tgKey = trim((string)($r['tg'] ?? ''));
            $petraMap[$tgKey] = [
                'views' => (int)$r['views'],
                'unique_users' => (int)$r['unique_users'],
            ];
        }

        $knownTgs = [
            '734' => ['name' => 'TG 734 Venezuela', 'badge' => 'Nacional', 'sub' => 'Canal principal nacional'],
            '73452' => ['name' => 'TG 73452 Emergencias y Eventos', 'badge' => 'Emergencias', 'sub' => 'Operaciones y contingencia'],
            '73473' => ['name' => 'TG 73473 Radio Club Venezolano', 'badge' => 'RCV', 'sub' => 'Boletín e institucional'],
            '73411' => ['name' => 'TG 73411 Red Venezolana de Radiodifusión', 'badge' => 'RVR', 'sub' => 'Difusión y ruedas temáticas'],
        ];

        $totalPetraViews = (int)($kpis['petra_views'] ?? 0);
        $totalPetraUnique = (int)($kpis['petra_unique'] ?? 0);
        $petraTalkgroups = [];

        foreach ($knownTgs as $tgId => $meta) {
            $views = $petraMap[$tgId]['views'] ?? 0;
            $uniqueUsers = $petraMap[$tgId]['unique_users'] ?? 0;
            $percent = $totalPetraViews > 0 ? round(($views / $totalPetraViews) * 100) : 0;
            $petraTalkgroups[] = [
                'id' => $tgId,
                'name' => $meta['name'],
                'badge' => $meta['badge'],
                'sub' => $meta['sub'],
                'views' => $views,
                'unique_users' => $uniqueUsers,
                'percent' => $percent,
            ];
        }

        if (!$days) {
            $kpis['post_views'] = max((int)($kpis['post_views'] ?? 0), (int)$pdo->query("SELECT COALESCE(SUM(views_count), 0) FROM bm_posts WHERE status = 'published'")->fetchColumn());
        }

        // Detalle extendido de Países Conectados y Actividad Global
        $globalCountriesStmt = $pdo->query("SELECT
            country_name AS country,
            country_code AS code,
            COUNT(*) AS total_interactions,
            COUNT(DISTINCT ip_address) AS unique_visitors,
            SUM(CASE WHEN event_type = 'player_play' AND event_category NOT IN ('audio_heartbeat', 'audio_stop') THEN 1 ELSE 0 END) AS audio_plays,
            SUM(CASE WHEN event_type = 'page_view' AND event_category = 'petra_view' THEN 1 ELSE 0 END) AS petra_views,
            SUM(CASE WHEN event_type = 'post_view' THEN 1 ELSE 0 END) AS post_views,
            SUM(CASE WHEN event_type = 'link_click' THEN 1 ELSE 0 END) AS link_clicks,
            MAX(created_at) AS last_active_ts
            FROM bm_analytics_events
            WHERE country_name IS NOT NULL AND country_code IS NOT NULL $since
            GROUP BY country_name, country_code
            ORDER BY total_interactions DESC
            LIMIT 12");
        $globalCountriesRaw = $globalCountriesStmt->fetchAll() ?: [];
        $totalGlobalInteractions = max(1, (int)$pdo->query("SELECT COUNT(*) FROM bm_analytics_events WHERE country_name IS NOT NULL $since")->fetchColumn());

        $countriesDetail = [];
        foreach ($globalCountriesRaw as $row) {
            $t = (int)$row['total_interactions'];
            $countriesDetail[] = [
                'country' => $row['country'],
                'code' => $row['code'],
                'total' => $t,
                'unique_visitors' => (int)$row['unique_visitors'],
                'percent' => round(($t / $totalGlobalInteractions) * 100, 1),
                'audio_plays' => (int)$row['audio_plays'],
                'petra_views' => (int)$row['petra_views'],
                'post_views' => (int)$row['post_views'],
                'link_clicks' => (int)$row['link_clicks'],
                'last_active' => date('d/m H:i', strtotime($row['last_active_ts'])),
            ];
        }

        // Origen de las visitas: por dónde llegó la gente al sitio.
        // Solo cuentan las entradas (la primera página de cada visita); la navegación de una
        // página a otra queda marcada como 'interno' y no se suma a ningún canal.
        $sourcesStmt = $pdo->query("SELECT traffic_source AS source, COUNT(*) AS visits, COUNT(DISTINCT ip_address) AS people
            FROM bm_analytics_events
            WHERE event_type = 'page_view' AND event_category = 'pagina'
              AND traffic_source IS NOT NULL AND traffic_source <> 'interno' $since
            GROUP BY traffic_source
            ORDER BY visits DESC");
        $sourceRows = $sourcesStmt->fetchAll();
        $totalEntries = array_sum(array_map(function ($r) { return (int)$r['visits']; }, $sourceRows));

        $trafficSources = [];
        foreach ($sourceRows as $row) {
            $key = (string)$row['source'];
            $visits = (int)$row['visits'];
            $trafficSources[] = [
                'key' => $key,
                'name' => BM_TRAFFIC_LABELS[$key] ?? $key,
                'visits' => $visits,
                'people' => (int)$row['people'],
                'percent' => $totalEntries > 0 ? round($visits * 100 / $totalEntries, 1) : 0,
            ];
        }

        // Sitios concretos que nos enlazan (buscadores, foros, redes…)
        $sitesStmt = $pdo->query("SELECT referrer_host AS host, traffic_source AS source, COUNT(*) AS visits, COUNT(DISTINCT ip_address) AS people
            FROM bm_analytics_events
            WHERE event_type = 'page_view' AND referrer_host IS NOT NULL AND referrer_host <> '' $since
            GROUP BY referrer_host, traffic_source
            ORDER BY visits DESC
            LIMIT 10");
        $trafficSites = array_map(function ($row) {
            return [
                'host' => (string)$row['host'],
                'source' => BM_TRAFFIC_LABELS[(string)$row['source']] ?? (string)$row['source'],
                'visits' => (int)$row['visits'],
                'people' => (int)$row['people'],
            ];
        }, $sitesStmt->fetchAll());

        $traffic = [
            'sources' => $trafficSources,
            'sites' => $trafficSites,
            'total_visits' => $totalEntries,
            'page_views' => (int)($kpis['page_views'] ?? 0),
            'unique_visitors' => (int)($kpis['unique_visitors'] ?? 0),
        ];

        // Audiencia: Dispositivos, Días de mayor concurrencia y Distribución horaria (24h)
        // 1. Dispositivos (desktop, mobile, tablet)
        $devicesStmt = $pdo->query("SELECT 
            COALESCE(device_type, 'desktop') AS device, 
            COUNT(*) AS visits, 
            COUNT(DISTINCT ip_address) AS people
            FROM bm_analytics_events
            WHERE event_type = 'page_view' AND event_category <> 'petra_view' $since
            GROUP BY device
            ORDER BY visits DESC");
        $deviceRows = $devicesStmt ? ($devicesStmt->fetchAll() ?: []) : [];
        $totalDeviceVisits = array_sum(array_map(function ($r) { return (int)$r['visits']; }, $deviceRows));

        $deviceMeta = [
            'mobile' => ['name' => 'Móvil', 'color' => '#E8261C'],
            'desktop' => ['name' => 'Escritorio', 'color' => '#EE6C1F'],
            'tablet' => ['name' => 'Tablet', 'color' => '#F2A93B'],
        ];

        $audienceDevices = [];
        foreach (['mobile', 'desktop', 'tablet'] as $dt) {
            $found = null;
            foreach ($deviceRows as $dr) {
                if (strtolower((string)$dr['device']) === $dt) {
                    $found = $dr;
                    break;
                }
            }
            $v = $found ? (int)$found['visits'] : 0;
            $p = $found ? (int)$found['people'] : 0;
            $audienceDevices[] = [
                'type' => $dt,
                'name' => $deviceMeta[$dt]['name'],
                'color' => $deviceMeta[$dt]['color'],
                'visits' => $v,
                'people' => $p,
                'percent' => $totalDeviceVisits > 0 ? round(($v * 100) / $totalDeviceVisits, 1) : 0,
            ];
        }

        // 2. Días de la semana (Lunes = 0 .. Domingo = 6)
        $daysStmt = $pdo->query("SELECT 
            WEEKDAY(created_at) AS day_idx, 
            COUNT(*) AS visits, 
            COUNT(DISTINCT ip_address) AS people
            FROM bm_analytics_events
            WHERE event_type = 'page_view' AND event_category <> 'petra_view' $since
            GROUP BY day_idx
            ORDER BY day_idx ASC");
        $dayRows = $daysStmt ? ($daysStmt->fetchAll() ?: []) : [];
        $dayMap = [];
        foreach ($dayRows as $dr) {
            $dayMap[(int)$dr['day_idx']] = [
                'visits' => (int)$dr['visits'],
                'people' => (int)$dr['people'],
            ];
        }

        $dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        $dayShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        $audienceDays = [];
        $maxDayVisits = 0;
        $peakDayIdx = 0;

        for ($i = 0; $i < 7; $i++) {
            $v = $dayMap[$i]['visits'] ?? 0;
            $p = $dayMap[$i]['people'] ?? 0;
            if ($v > $maxDayVisits) {
                $maxDayVisits = $v;
                $peakDayIdx = $i;
            }
            $audienceDays[] = [
                'day_idx' => $i,
                'name' => $dayNames[$i],
                'short' => $dayShort[$i],
                'visits' => $v,
                'people' => $p,
            ];
        }

        // 3. Horas del día (00 a 23)
        $hoursStmt = $pdo->query("SELECT 
            HOUR(created_at) AS hour_idx, 
            COUNT(*) AS visits, 
            COUNT(DISTINCT ip_address) AS people
            FROM bm_analytics_events
            WHERE event_type = 'page_view' AND event_category <> 'petra_view' $since
            GROUP BY hour_idx
            ORDER BY hour_idx ASC");
        $hourRows = $hoursStmt ? ($hoursStmt->fetchAll() ?: []) : [];
        $hourMap = [];
        foreach ($hourRows as $hr) {
            $hourMap[(int)$hr['hour_idx']] = [
                'visits' => (int)$hr['visits'],
                'people' => (int)$hr['people'],
            ];
        }

        $audienceHours = [];
        $maxHourVisits = 0;
        $peakHourIdx = 0;

        for ($h = 0; $h < 24; $h++) {
            $v = $hourMap[$h]['visits'] ?? 0;
            $p = $hourMap[$h]['people'] ?? 0;
            if ($v > $maxHourVisits) {
                $maxHourVisits = $v;
                $peakHourIdx = $h;
            }
            $audienceHours[] = [
                'hour' => $h,
                'label' => sprintf('%02d:00', $h),
                'short_label' => sprintf('%02dh', $h),
                'visits' => $v,
                'people' => $p,
            ];
        }

        $audience = [
            'devices' => $audienceDevices,
            'total_device_visits' => $totalDeviceVisits,
            'days' => $audienceDays,
            'max_day_visits' => $maxDayVisits,
            'peak_day' => $maxDayVisits > 0 ? [
                'day_idx' => $peakDayIdx,
                'name' => $dayNames[$peakDayIdx],
                'short' => $dayShort[$peakDayIdx],
                'visits' => $maxDayVisits,
            ] : null,
            'hours' => $audienceHours,
            'max_hour_visits' => $maxHourVisits,
            'peak_hour' => $maxHourVisits > 0 ? [
                'hour' => $peakHourIdx,
                'label' => sprintf('%02d:00 - %02d:59', $peakHourIdx, $peakHourIdx),
                'short_label' => sprintf('%02dh', $peakHourIdx),
                'visits' => $maxHourVisits,
            ] : null,
        ];

        // Telemetría en tiempo real: oyentes de audio en vivo activos en este momento (últimos 60 segundos)
        // Se toma el evento de audio más reciente por IP en la ventana de 60s.
        // Si el último evento fue 'audio_stop' o ya expiró el latido, ya no se considera activo.
        $liveStmt = $pdo->query("SELECT
            COALESCE(latest.country_name, 'Venezuela') AS country,
            COALESCE(latest.country_code, 'VE') AS code,
            COUNT(*) AS listeners
            FROM (
                SELECT 
                    e.ip_address,
                    e.country_name,
                    e.country_code,
                    e.event_category
                FROM bm_analytics_events e
                INNER JOIN (
                    SELECT ip_address, MAX(id) AS max_id
                    FROM bm_analytics_events
                    WHERE event_type = 'player_play'
                      AND created_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
                    GROUP BY ip_address
                ) m ON e.id = m.max_id
                WHERE e.event_category != 'audio_stop'
            ) latest
            GROUP BY country, code
            ORDER BY listeners DESC");
        $liveRows = $liveStmt ? ($liveStmt->fetchAll() ?: []) : [];
        $totalLive = 0;
        $liveCountriesList = [];
        foreach ($liveRows as $lr) {
            $cCount = (int)$lr['listeners'];
            $totalLive += $cCount;
            $liveCountriesList[] = [
                'country' => $lr['country'],
                'code' => $lr['code'],
                'count' => $cCount,
            ];
        }
        $liveAudio = [
            'is_active' => $totalLive > 0,
            'total_listeners' => $totalLive,
            'countries' => $liveCountriesList,
        ];

        send_json([
            'success' => true,
            'range' => $rangeKey,
            'kpis' => [
                'player_plays' => (int)($kpis['player_plays'] ?? 0),
                'unique_listeners' => (int)($kpis['unique_listeners'] ?? 0),
                'link_clicks' => (int)($kpis['link_clicks'] ?? 0),
                'post_views' => (int)($kpis['post_views'] ?? 0),
                'post_shares' => (int)($kpis['post_shares'] ?? 0),
                'petra_views' => $totalPetraViews,
                'petra_unique' => $totalPetraUnique,
                'page_views' => (int)($kpis['page_views'] ?? 0),
                'unique_visitors' => (int)($kpis['unique_visitors'] ?? 0),
                'active_countries' => (int)($kpis['active_countries'] ?? 0),
            ],
            'traffic' => $traffic,
            'audience' => $audience,
            'map_points' => $mapPoints,
            'player' => [
                'countries' => $playerCountries,
                'listeners' => $playerListeners,
                'total_plays' => (int)($kpis['player_plays'] ?? 0),
            ],
            'petra' => [
                'total_views' => $totalPetraViews,
                'unique_visitors' => $totalPetraUnique,
                'talkgroups' => $petraTalkgroups,
            ],
            'live_audio' => $liveAudio,
            'countries_detail' => $countriesDetail,
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
