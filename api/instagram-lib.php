<?php
/**
 * Integración con la API de Instagram (Instagram API with Instagram Login).
 * Solo se incluye desde otros archivos (bloqueado en .htaccess).
 *
 * Flujo:
 *   1. Admin pulsa "Conectar con Instagram"  → instagram.php?action=connect redirige a instagram.com
 *   2. Instagram vuelve a instagram-callback.php con ?code  → se canjea por un token de 1 hora
 *   3. Se cambia por un token de larga duración (60 días) y se guarda en bm_site_settings
 *   4. La sincronización (manual o por cron) descarga al servidor las publicaciones con el hashtag
 *   5. El cron renueva el token antes de que venza
 */

require_once __DIR__ . '/db.php';

const IG_GRAPH_VERSION = 'v23.0';
const IG_SCOPES = 'instagram_business_basic';
// Renovar el token cuando le queden menos de 15 días
const IG_REFRESH_BEFORE = 15 * 86400;
const IG_MAX_PAGES = 6;
const IG_MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IG_MAX_VIDEO_BYTES = 80 * 1024 * 1024;

/** Bases de la API (configurables solo para pruebas locales) */
function ig_base($which) {
    $defaults = [
        'oauth' => 'https://www.instagram.com',
        'api' => 'https://api.instagram.com',
        'graph' => 'https://graph.instagram.com',
    ];
    $env = getenv('IG_' . strtoupper($which) . '_BASE');
    return rtrim($env ?: $defaults[$which], '/');
}

function ig_site_url() {
    $configured = rtrim(trim((string)getenv('SITE_URL')), '/');
    return $configured !== '' ? $configured : 'https://brandmeisteryv.net';
}

/** URI de redirección que hay que registrar en la app de Meta (debe coincidir exactamente) */
function ig_redirect_uri() {
    return ig_site_url() . '/api/instagram-callback.php';
}

function ig_get_settings(array $keys) {
    $pdo = get_db_connection();
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM bm_site_settings WHERE setting_key IN ($placeholders)");
    $stmt->execute($keys);
    $values = array_fill_keys($keys, '');
    foreach ($stmt->fetchAll() as $row) {
        $values[$row['setting_key']] = (string)$row['setting_value'];
    }
    return $values;
}

function ig_set_settings(array $values) {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("INSERT INTO bm_site_settings (setting_key, setting_value) VALUES (:k, :v) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    foreach ($values as $k => $v) {
        $stmt->execute([':k' => $k, ':v' => (string)$v]);
    }
}

/**
 * Petición HTTP a Instagram. Devuelve el JSON decodificado o lanza Exception con el mensaje de la API.
 * Los tokens nunca se escriben en los logs.
 */
function ig_request($method, $url, array $params = []) {
    $ch = curl_init();
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    } elseif ($params) {
        $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($params);
    }
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_USERAGENT => 'BrandMeister-Venezuela/1.0',
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        throw new Exception("No se pudo conectar con Instagram ($error)");
    }
    $data = json_decode($body, true);
    if (!is_array($data)) {
        throw new Exception("Respuesta no válida de Instagram (HTTP $status)");
    }
    if ($status >= 400 || isset($data['error']) || isset($data['error_message'])) {
        $message = $data['error']['message'] ?? $data['error_message'] ?? ('HTTP ' . $status);
        throw new Exception('Instagram: ' . $message);
    }
    return $data;
}

/** URL de autorización de Instagram con un "state" anti-CSRF guardado en la sesión */
function ig_authorize_url($appId) {
    $state = bin2hex(random_bytes(16));
    $_SESSION['ig_oauth_state'] = ['value' => $state, 'at' => time()];
    return ig_base('oauth') . '/oauth/authorize?' . http_build_query([
        'enable_fb_login' => '0',
        'force_authentication' => '1',
        'client_id' => $appId,
        'redirect_uri' => ig_redirect_uri(),
        'response_type' => 'code',
        'scope' => IG_SCOPES,
        'state' => $state,
    ]);
}

/** Verifica el "state" devuelto por Instagram (un solo uso, 15 minutos) */
function ig_check_state($state) {
    $saved = $_SESSION['ig_oauth_state'] ?? null;
    unset($_SESSION['ig_oauth_state']);
    return is_array($saved)
        && is_string($state)
        && time() - (int)$saved['at'] < 900
        && hash_equals((string)$saved['value'], $state);
}

/**
 * Canjea el código de autorización por un token de larga duración y guarda la conexión.
 * @return array{username: string, user_id: string, expires_at: int}
 */
function ig_complete_connection($code) {
    $creds = ig_get_settings(['instagram_app_id', 'instagram_app_secret']);
    if ($creds['instagram_app_id'] === '' || $creds['instagram_app_secret'] === '') {
        throw new Exception('Faltan el ID y la clave secreta de la app de Instagram.');
    }

    // Instagram añade "#_" al código en algunos navegadores
    $code = preg_replace('/#_$/', '', (string)$code);

    $short = ig_request('POST', ig_base('api') . '/oauth/access_token', [
        'client_id' => $creds['instagram_app_id'],
        'client_secret' => $creds['instagram_app_secret'],
        'grant_type' => 'authorization_code',
        'redirect_uri' => ig_redirect_uri(),
        'code' => $code,
    ]);
    // Según la versión la respuesta viene plana o dentro de "data"
    $short = isset($short['data'][0]) ? $short['data'][0] : $short;
    if (empty($short['access_token'])) {
        throw new Exception('Instagram no devolvió un token de acceso.');
    }

    $long = ig_request('GET', ig_base('graph') . '/access_token', [
        'grant_type' => 'ig_exchange_token',
        'client_secret' => $creds['instagram_app_secret'],
        'access_token' => $short['access_token'],
    ]);
    if (empty($long['access_token'])) {
        throw new Exception('No se pudo obtener el token de larga duración.');
    }

    $profile = ig_request('GET', ig_base('graph') . '/' . IG_GRAPH_VERSION . '/me', [
        'fields' => 'user_id,username,account_type',
        'access_token' => $long['access_token'],
    ]);

    $expiresAt = time() + (int)($long['expires_in'] ?? 5184000);
    ig_set_settings([
        'instagram_access_token' => $long['access_token'],
        'instagram_token_expires_at' => $expiresAt,
        'instagram_user_id' => $profile['user_id'] ?? ($short['user_id'] ?? ''),
        'instagram_username' => $profile['username'] ?? '',
        'instagram_account' => $profile['username'] ?? '',
        'instagram_connected_at' => time(),
    ]);

    return ['username' => $profile['username'] ?? '', 'user_id' => (string)($profile['user_id'] ?? ''), 'expires_at' => $expiresAt];
}

function ig_disconnect() {
    ig_set_settings([
        'instagram_access_token' => '',
        'instagram_token_expires_at' => '',
        'instagram_user_id' => '',
        'instagram_username' => '',
        'instagram_connected_at' => '',
    ]);
}

/**
 * Renueva el token de larga duración si le quedan menos de IG_REFRESH_BEFORE segundos.
 * Instagram solo permite renovar tokens con más de 24 h de antigüedad y aún vigentes.
 * @return string estado: 'not_connected' | 'fresh' | 'refreshed' | 'expired'
 */
function ig_refresh_token_if_needed($force = false) {
    $s = ig_get_settings(['instagram_access_token', 'instagram_token_expires_at']);
    if ($s['instagram_access_token'] === '') {
        return 'not_connected';
    }
    $expiresAt = (int)$s['instagram_token_expires_at'];
    if ($expiresAt && $expiresAt < time()) {
        return 'expired';
    }
    if (!$force && $expiresAt - time() > IG_REFRESH_BEFORE) {
        return 'fresh';
    }

    $data = ig_request('GET', ig_base('graph') . '/refresh_access_token', [
        'grant_type' => 'ig_refresh_token',
        'access_token' => $s['instagram_access_token'],
    ]);
    if (empty($data['access_token'])) {
        throw new Exception('Instagram no devolvió el token renovado.');
    }
    ig_set_settings([
        'instagram_access_token' => $data['access_token'],
        'instagram_token_expires_at' => time() + (int)($data['expires_in'] ?? 5184000),
    ]);
    return 'refreshed';
}

/** Estado de la conexión para mostrar en el panel (sin exponer el token) */
function ig_status() {
    $s = ig_get_settings([
        'instagram_app_id', 'instagram_app_secret', 'instagram_access_token', 'instagram_token_expires_at',
        'instagram_username', 'instagram_connected_at', 'instagram_hashtag', 'instagram_last_sync', 'instagram_last_sync_result',
    ]);
    $expiresAt = (int)$s['instagram_token_expires_at'];
    return [
        'app_configured' => $s['instagram_app_id'] !== '' && $s['instagram_app_secret'] !== '',
        'app_id' => $s['instagram_app_id'],
        'connected' => $s['instagram_access_token'] !== '' && (!$expiresAt || $expiresAt > time()),
        'expired' => $s['instagram_access_token'] !== '' && $expiresAt && $expiresAt <= time(),
        'username' => $s['instagram_username'],
        'connected_at' => (int)$s['instagram_connected_at'] ?: null,
        'token_expires_at' => $expiresAt ?: null,
        'hashtag' => ig_display_hashtag($s['instagram_hashtag']),
        'last_sync' => (int)$s['instagram_last_sync'] ?: null,
        'last_sync_result' => json_decode($s['instagram_last_sync_result'] ?: 'null', true),
        'redirect_uri' => ig_redirect_uri(),
    ];
}

/** Hashtag tal como lo escribió el admin (para mostrar), sin "#" */
function ig_display_hashtag($value) {
    $tag = ltrim(trim((string)$value), '#');
    return preg_match('/^[\p{L}\p{N}_]{1,100}$/u', $tag) ? $tag : 'ExperienciaDMR';
}

function ig_normalize_hashtag($value) {
    $tag = strtolower(ltrim(trim((string)$value), '#'));
    return preg_match('/^[\p{L}\p{N}_]{1,100}$/u', $tag) ? $tag : 'experienciadmr';
}

/** ¿El texto contiene el hashtag como etiqueta completa? (#ExperienciaDMR sí, #ExperienciaDMR2025 no) */
function ig_caption_has_hashtag($caption, $tag) {
    return (bool)preg_match('/#' . preg_quote($tag, '/') . '(?![\p{L}\p{N}_])/iu', (string)$caption);
}

// ---------------------------------------------------------------------------
// Descarga de medios: las URLs del CDN de Instagram caducan en pocos días,
// por eso las imágenes y videos se guardan en el propio servidor.
// ---------------------------------------------------------------------------

function ig_media_dir() {
    return rtrim(getenv('IG_MEDIA_DIR') ?: dirname(__DIR__) . '/media/instagram', '/');
}

function ig_media_public_url($filename) {
    return '/media/instagram/' . $filename;
}

function ig_prepare_media_dir() {
    $dir = ig_media_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        throw new Exception('No se pudo crear la carpeta de medios ' . $dir);
    }
    // Nunca ejecutar scripts ni listar esta carpeta
    $htaccess = $dir . '/.htaccess';
    if (!file_exists($htaccess)) {
        @file_put_contents($htaccess, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh)$\">\n  Require all denied\n</FilesMatch>\n");
    }
    return $dir;
}

/** Solo se descargan URLs https de los CDN de Instagram/Facebook */
function ig_is_allowed_cdn_url($url) {
    $parts = parse_url((string)$url);
    if (!$parts || empty($parts['host'])) return false;
    $host = strtolower($parts['host']);

    $extra = array_filter(array_map('trim', explode(',', (string)getenv('IG_CDN_HOSTS'))));
    foreach ($extra as $allowed) {
        if ($host === strtolower($allowed)) return true;
    }
    return ($parts['scheme'] ?? '') === 'https'
        && (bool)preg_match('/(^|\.)(cdninstagram\.com|fbcdn\.net)$/', $host);
}

/**
 * Descarga un medio y devuelve la URL pública local, o null si falla.
 * Si el archivo ya existe no se vuelve a descargar.
 */
function ig_download_media($url, $baseName, $kind) {
    if (!ig_is_allowed_cdn_url($url)) {
        error_log('[BM-YV] Instagram: URL de medio no permitida');
        return null;
    }
    $dir = ig_prepare_media_dir();
    $baseName = preg_replace('/[^A-Za-z0-9_-]/', '', $baseName);
    $extensions = $kind === 'video' ? ['mp4'] : ['jpg', 'png', 'webp'];
    foreach ($extensions as $ext) {
        if (is_file("$dir/$baseName.$ext") && filesize("$dir/$baseName.$ext") > 0) {
            return ig_media_public_url("$baseName.$ext");
        }
    }

    $tmp = "$dir/.$baseName." . bin2hex(random_bytes(4)) . '.part';
    $fh = fopen($tmp, 'wb');
    $maxBytes = $kind === 'video' ? IG_MAX_VIDEO_BYTES : IG_MAX_IMAGE_BYTES;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_FILE => $fh,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT => $kind === 'video' ? 120 : 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'BrandMeister-Venezuela/1.0',
        CURLOPT_NOPROGRESS => false,
        // Abortar si supera el tamaño máximo
        CURLOPT_PROGRESSFUNCTION => function ($ch, $dlTotal, $dlNow) use ($maxBytes) {
            return ($dlTotal > $maxBytes || $dlNow > $maxBytes) ? 1 : 0;
        },
    ]);
    $ok = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = strtolower((string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE));
    curl_close($ch);
    fclose($fh);

    $types = $kind === 'video'
        ? ['video/mp4' => 'mp4']
        : ['image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = trim(explode(';', $contentType)[0]);

    if (!$ok || $status !== 200 || !isset($types[$mime]) || filesize($tmp) === 0) {
        @unlink($tmp);
        error_log("[BM-YV] Instagram: no se pudo descargar $kind (HTTP $status, $mime)");
        return null;
    }
    // Comprobación adicional del contenido real de las imágenes
    if ($kind !== 'video' && @getimagesize($tmp) === false) {
        @unlink($tmp);
        return null;
    }

    $final = "$dir/$baseName." . $types[$mime];
    rename($tmp, $final);
    @chmod($final, 0644);
    return ig_media_public_url(basename($final));
}

/**
 * Sincroniza las publicaciones de la cuenta conectada que tengan el hashtag.
 * - Inserta nuevas y actualiza texto, likes y comentarios de las existentes
 * - No vuelve a publicar las que el admin ocultó
 * - Oculta las que ya no tienen el hashtag o se borraron de Instagram (si se recorrió todo el perfil)
 *
 * @return array resumen para mostrar en el panel
 */
function ig_sync() {
    $pdo = get_db_connection();
    if (!$pdo) {
        throw new Exception('La base de datos no está disponible.');
    }
    $s = ig_get_settings(['instagram_access_token', 'instagram_token_expires_at', 'instagram_hashtag', 'instagram_username']);
    if ($s['instagram_access_token'] === '') {
        throw new Exception('Instagram no está conectado. Pulsa "Conectar con Instagram".');
    }
    if ((int)$s['instagram_token_expires_at'] && (int)$s['instagram_token_expires_at'] < time()) {
        throw new Exception('La conexión con Instagram venció. Vuelve a conectar la cuenta.');
    }

    $tag = ig_normalize_hashtag($s['instagram_hashtag']);
    $author = '@' . ($s['instagram_username'] ?: 'brandmeister_yv');
    $fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,shortcode,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}';

    $url = ig_base('graph') . '/' . IG_GRAPH_VERSION . '/me/media';
    $params = ['fields' => $fields, 'limit' => 50, 'access_token' => $s['instagram_access_token']];
    $pages = 0;
    $scanned = 0;
    $complete = false;
    $matched = [];

    while ($url && $pages < IG_MAX_PAGES) {
        $data = ig_request('GET', $url, $params);
        $pages++;
        foreach ($data['data'] ?? [] as $item) {
            $scanned++;
            if (ig_caption_has_hashtag($item['caption'] ?? '', $tag)) {
                $matched[] = $item;
            }
        }
        // "next" ya incluye todos los parámetros
        $url = $data['paging']['next'] ?? null;
        $params = [];
        if (!$url) {
            $complete = true;
        }
    }

    $existingStmt = $pdo->prepare("SELECT id, status FROM bm_gallery_posts WHERE instagram_id = :ig LIMIT 1");
    $insert = $pdo->prepare("INSERT INTO bm_gallery_posts
        (instagram_id, shortcode, permalink, media_type, media_url, thumbnail_url, carousel_json, video_url, caption, author, likes_count, comments_count, published_at, status)
        VALUES (:ig, :shortcode, :permalink, :type, :media, :thumb, :carousel, :video, :caption, :author, :likes, :comments, FROM_UNIXTIME(:published), 'published')");
    $update = $pdo->prepare("UPDATE bm_gallery_posts SET caption = :caption, likes_count = :likes, comments_count = :comments, permalink = :permalink, author = :author,
        media_url = :media, thumbnail_url = :thumb, carousel_json = :carousel, video_url = :video WHERE id = :id");

    $added = 0;
    $updated = 0;
    $failedMedia = 0;
    $seenIds = [];

    foreach ($matched as $item) {
        $igId = preg_replace('/[^0-9A-Za-z_]/', '', (string)$item['id']);
        if ($igId === '') continue;
        $seenIds[] = $igId;
        $type = in_array($item['media_type'] ?? '', ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'], true) ? $item['media_type'] : 'IMAGE';

        // Medios: se descargan una sola vez (si el archivo existe se reutiliza)
        $media = null;
        $thumb = null;
        $video = null;
        $carousel = [];
        if ($type === 'VIDEO') {
            $thumb = !empty($item['thumbnail_url']) ? ig_download_media($item['thumbnail_url'], "ig_{$igId}_thumb", 'image') : null;
            $video = !empty($item['media_url']) ? ig_download_media($item['media_url'], "ig_{$igId}", 'video') : null;
            $media = $thumb;
        } else {
            $media = !empty($item['media_url']) ? ig_download_media($item['media_url'], "ig_{$igId}", 'image') : null;
            $thumb = $media;
        }
        if ($type === 'CAROUSEL_ALBUM') {
            foreach ($item['children']['data'] ?? [] as $i => $child) {
                $childId = preg_replace('/[^0-9A-Za-z_]/', '', (string)($child['id'] ?? $i));
                $isVideo = ($child['media_type'] ?? '') === 'VIDEO';
                $childUrl = $isVideo ? ($child['thumbnail_url'] ?? '') : ($child['media_url'] ?? '');
                $local = $childUrl ? ig_download_media($childUrl, "ig_{$igId}_{$childId}", 'image') : null;
                if ($local) {
                    $carousel[] = ['url' => $local, 'caption' => ''];
                } else {
                    $failedMedia++;
                }
            }
            if (!$media && $carousel) {
                $media = $thumb = $carousel[0]['url'];
            }
        }
        if (!$media) {
            // Sin imagen no se puede mostrar: se reintentará en la próxima sincronización
            $failedMedia++;
            continue;
        }

        $values = [
            ':caption' => (string)($item['caption'] ?? ''),
            ':likes' => (int)($item['like_count'] ?? 0),
            ':comments' => (int)($item['comments_count'] ?? 0),
            ':permalink' => (string)($item['permalink'] ?? ''),
            ':author' => $author,
            ':media' => $media,
            ':thumb' => $thumb ?: $media,
            ':carousel' => $carousel ? json_encode($carousel, JSON_UNESCAPED_SLASHES) : null,
            ':video' => $video,
        ];

        $existingStmt->execute([':ig' => $igId]);
        $existing = $existingStmt->fetch();
        if ($existing) {
            $update->execute($values + [':id' => $existing['id']]);
            $updated++;
        } else {
            // Epoch: FROM_UNIXTIME respeta la zona horaria de la sesión MySQL
            $published = !empty($item['timestamp']) ? (int)strtotime($item['timestamp']) : time();
            $insert->execute($values + [
                ':ig' => $igId,
                ':shortcode' => preg_replace('/[^A-Za-z0-9_-]/', '', (string)($item['shortcode'] ?? '')) ?: null,
                ':type' => $type,
                ':published' => $published,
            ]);
            $added++;
        }
    }

    // Si se recorrió el perfil completo, ocultar lo sincronizado que ya no está (borrado o sin hashtag)
    $hidden = 0;
    if ($complete) {
        $params = [];
        $sql = "UPDATE bm_gallery_posts SET status = 'hidden' WHERE status = 'published' AND instagram_id IS NOT NULL AND instagram_id NOT LIKE 'manual\\_%'";
        if ($seenIds) {
            $sql .= ' AND instagram_id NOT IN (' . implode(',', array_fill(0, count($seenIds), '?')) . ')';
            $params = $seenIds;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $hidden = $stmt->rowCount();
    }

    $result = [
        'at' => time(),
        'hashtag' => ig_display_hashtag($s['instagram_hashtag']),
        'scanned' => $scanned,
        'matched' => count($matched),
        'added' => $added,
        'updated' => $updated,
        'hidden' => $hidden,
        'failed_media' => $failedMedia,
        'complete' => $complete,
    ];
    ig_set_settings([
        'instagram_last_sync' => time(),
        'instagram_last_sync_result' => json_encode($result),
    ]);
    return $result;
}
