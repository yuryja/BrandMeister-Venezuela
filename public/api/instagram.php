<?php
/**
 * API Backend para Galería de Instagram (#experienciadmr) - BrandMeister Venezuela
 * Compatible con cPanel / Shared Hosting Apache + PHP y MySQL
 * Soporta consulta, sincronización vía Graph API y gestión manual desde el Backoffice
 */

require_once __DIR__ . '/db.php';

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$pdo = get_db_connection();

// Asegurar que la tabla bm_gallery_posts exista
if ($pdo) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `bm_gallery_posts` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `instagram_id` VARCHAR(100) NULL UNIQUE,
            `shortcode` VARCHAR(50) NULL,
            `permalink` VARCHAR(255) NOT NULL,
            `media_type` ENUM('IMAGE', 'CAROUSEL_ALBUM', 'VIDEO') NOT NULL DEFAULT 'IMAGE',
            `media_url` TEXT NOT NULL,
            `thumbnail_url` TEXT NULL,
            `carousel_json` LONGTEXT NULL,
            `video_url` TEXT NULL,
            `caption` TEXT NULL,
            `author` VARCHAR(80) NOT NULL DEFAULT '@brandmeister_yv',
            `likes_count` INT UNSIGNED NOT NULL DEFAULT 0,
            `comments_count` INT UNSIGNED NOT NULL DEFAULT 0,
            `published_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `status` ENUM('published', 'hidden') NOT NULL DEFAULT 'published',
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            INDEX `idx_ig_id` (`instagram_id`),
            INDEX `idx_media_type` (`media_type`),
            INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) {
        error_log("Error creando tabla bm_gallery_posts: " . $e->getMessage());
    }
}

// --------------------------------------------------------------------
// 1. GET: Listado de publicaciones de la galería
// --------------------------------------------------------------------
if ($method === 'GET') {
    $filterType = $_GET['type'] ?? 'all';
    $posts = [];

    if ($pdo) {
        try {
            $sql = "SELECT * FROM `bm_gallery_posts` WHERE `status` = 'published'";
            $params = [];

            if ($filterType !== 'all') {
                $sql .= " AND `media_type` = :type";
                $params[':type'] = strtoupper($filterType);
            }

            $sql .= " ORDER BY `published_at` DESC LIMIT 60";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            foreach ($rows as $r) {
                $carousel = !empty($r['carousel_json']) ? json_decode($r['carousel_json'], true) : [];
                $posts[] = [
                    'id' => (string)$r['id'],
                    'instagram_id' => $r['instagram_id'],
                    'shortcode' => $r['shortcode'],
                    'permalink' => $r['permalink'],
                    'media_type' => $r['media_type'],
                    'media_url' => $r['media_url'],
                    'thumbnail_url' => $r['thumbnail_url'] ?: $r['media_url'],
                    'carousel_media' => is_array($carousel) ? $carousel : [],
                    'video_url' => $r['video_url'],
                    'caption' => $r['caption'],
                    'author' => $r['author'],
                    'likes_count' => (int)$r['likes_count'],
                    'comments_count' => (int)$r['comments_count'],
                    'published_at' => $r['published_at']
                ];
            }
        } catch (Exception $e) {
            error_log("Error leyendo bm_gallery_posts: " . $e->getMessage());
        }
    }

    // Fallback a src/data/galeria.json si MySQL no tiene registros aún o no hay conexión
    if (empty($posts)) {
        $jsonPath = dirname(__DIR__, 2) . '/src/data/galeria.json';
        if (file_exists($jsonPath)) {
            $raw = file_get_contents($jsonPath);
            $fallback = json_decode($raw, true);
            if (is_array($fallback)) {
                if ($filterType !== 'all') {
                    $posts = array_values(array_filter($fallback, function($p) use ($filterType) {
                        return strtolower($p['media_type']) === strtolower($filterType);
                    }));
                } else {
                    $posts = $fallback;
                }
            }
        }
    }

    send_json([
        'success' => true,
        'count' => count($posts),
        'posts' => $posts,
        'source' => (!empty($rows) ? 'mysql' : 'json_seed')
    ]);
}

// --------------------------------------------------------------------
// 2. POST: Operaciones administrativas (Guardar manual, Eliminar, Sync)
// --------------------------------------------------------------------
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    // A. Sincronización automática con Instagram Graph API
    if ($action === 'sync') {
        $accessToken = '';
        $hashtag = 'experienciadmr';

        if ($pdo) {
            $stmt = $pdo->query("SELECT setting_key, setting_value FROM bm_site_settings WHERE setting_key IN ('instagram_access_token', 'instagram_hashtag')");
            while ($row = $stmt->fetch()) {
                if ($row['setting_key'] === 'instagram_access_token') $accessToken = trim($row['setting_value']);
                if ($row['setting_key'] === 'instagram_hashtag') $hashtag = trim($row['setting_value']) ?: 'experienciadmr';
            }
        }

        if (empty($accessToken)) {
            send_json([
                'success' => false,
                'error' => 'Aún no se ha configurado el Token de Acceso de Instagram en el Backoffice. Puedes agregar publicaciones manualmente o configurar tus credenciales de Meta for Developers.'
            ], 400);
        }

        // Consultar Instagram Graph API
        $url = "https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{id,media_type,media_url}&access_token=" . urlencode($accessToken);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($res === false) {
            send_json(['success' => false, 'error' => "Error de conexión con Instagram API: $err"], 500);
        }

        $apiData = json_decode($res, true);
        if (isset($apiData['error'])) {
            send_json(['success' => false, 'error' => $apiData['error']['message'] ?? 'Error desconocido de Instagram API'], 400);
        }

        $items = $apiData['data'] ?? [];
        $syncedCount = 0;
        $hashtagClean = ltrim(strtolower($hashtag), '#');

        if ($pdo && is_array($items)) {
            $stmtInsert = $pdo->prepare("INSERT INTO `bm_gallery_posts` 
                (`instagram_id`, `permalink`, `media_type`, `media_url`, `thumbnail_url`, `carousel_json`, `video_url`, `caption`, `published_at`, `status`)
                VALUES (:ig_id, :permalink, :mtype, :murl, :thumb, :carousel, :vurl, :caption, :pub_at, 'published')
                ON DUPLICATE KEY UPDATE 
                `media_url` = VALUES(`media_url`),
                `carousel_json` = VALUES(`carousel_json`),
                `caption` = VALUES(`caption`)");

            foreach ($items as $item) {
                $caption = $item['caption'] ?? '';
                // Filtrar por hashtag si se especificó
                if (!empty($hashtagClean) && stripos($caption, $hashtagClean) === false) {
                    continue;
                }

                $mediaType = $item['media_type'] ?? 'IMAGE';
                $carouselList = [];
                $videoUrl = null;

                if ($mediaType === 'CAROUSEL_ALBUM' && isset($item['children']['data'])) {
                    foreach ($item['children']['data'] as $child) {
                        $carouselList[] = [
                            'url' => $child['media_url'],
                            'caption' => ''
                        ];
                    }
                }

                if ($mediaType === 'VIDEO') {
                    $videoUrl = $item['media_url'] ?? null;
                }

                $stmtInsert->execute([
                    ':ig_id'     => $item['id'],
                    ':permalink' => $item['permalink'] ?? ('https://instagram.com/p/' . $item['id']),
                    ':mtype'     => $mediaType,
                    ':murl'      => $item['media_url'] ?? '',
                    ':thumb'     => $item['thumbnail_url'] ?? ($item['media_url'] ?? ''),
                    ':carousel'  => !empty($carouselList) ? json_encode($carouselList) : null,
                    ':vurl'      => $videoUrl,
                    ':caption'   => $caption,
                    ':pub_at'    => !empty($item['timestamp']) ? date('Y-m-d H:i:s', strtotime($item['timestamp'])) : date('Y-m-d H:i:s')
                ]);

                $syncedCount++;
            }

            // Actualizar fecha de última sincronización
            $pdo->exec("INSERT INTO bm_site_settings (setting_key, setting_value) VALUES ('instagram_last_sync', '" . date('d/m/Y H:i') . "') ON DUPLICATE KEY UPDATE setting_value = '" . date('d/m/Y H:i') . "'");
        }

        send_json([
            'success' => true,
            'message' => "Sincronización completada. Se procesaron $syncedCount publicaciones con el hashtag #$hashtagClean.",
            'synced_count' => $syncedCount,
            'sync_time' => date('d/m/Y H:i')
        ]);
    }

    // B. Guardar o editar publicación manualmente
    if ($action === 'save_post') {
        $id          = !empty($input['id']) ? (int)$input['id'] : null;
        $permalink   = trim($input['permalink'] ?? 'https://www.instagram.com/brandmeister_yv/');
        $mediaType   = in_array($input['media_type'] ?? '', ['IMAGE', 'CAROUSEL_ALBUM', 'VIDEO']) ? $input['media_type'] : 'IMAGE';
        $mediaUrl    = trim($input['media_url'] ?? '');
        $thumbnail   = trim($input['thumbnail_url'] ?? '') ?: $mediaUrl;
        $videoUrl    = trim($input['video_url'] ?? '');
        $caption     = trim($input['caption'] ?? '');
        $author      = trim($input['author'] ?? '@brandmeister_yv');
        $carouselRaw = $input['carousel_media'] ?? [];
        $carouselJson= is_array($carouselRaw) && !empty($carouselRaw) ? json_encode($carouselRaw, JSON_UNESCAPED_SLASHES) : null;

        if (empty($mediaUrl)) {
            send_json(['success' => false, 'error' => 'La URL de la imagen principal es requerida.'], 422);
        }

        if ($pdo) {
            if ($id) {
                $stmt = $pdo->prepare("UPDATE `bm_gallery_posts` SET 
                    `permalink` = :permalink,
                    `media_type` = :mtype,
                    `media_url` = :murl,
                    `thumbnail_url` = :thumb,
                    `carousel_json` = :carousel,
                    `video_url` = :vurl,
                    `caption` = :caption,
                    `author` = :author
                    WHERE `id` = :id");
                $stmt->execute([
                    ':permalink' => $permalink,
                    ':mtype'     => $mediaType,
                    ':murl'      => $mediaUrl,
                    ':thumb'     => $thumbnail,
                    ':carousel'  => $carouselJson,
                    ':vurl'      => $videoUrl ?: null,
                    ':caption'   => $caption,
                    ':author'    => $author,
                    ':id'        => $id
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO `bm_gallery_posts` 
                    (`instagram_id`, `permalink`, `media_type`, `media_url`, `thumbnail_url`, `carousel_json`, `video_url`, `caption`, `author`, `likes_count`, `comments_count`, `status`)
                    VALUES (:ig_id, :permalink, :mtype, :murl, :thumb, :carousel, :vurl, :caption, :author, :likes, :comments, 'published')");
                $stmt->execute([
                    ':ig_id'     => 'manual_' . time(),
                    ':permalink' => $permalink,
                    ':mtype'     => $mediaType,
                    ':murl'      => $mediaUrl,
                    ':thumb'     => $thumbnail,
                    ':carousel'  => $carouselJson,
                    ':vurl'      => $videoUrl ?: null,
                    ':caption'   => $caption,
                    ':author'    => $author,
                    ':likes'     => rand(80, 250),
                    ':comments'  => rand(10, 35)
                ]);
            }
            send_json(['success' => true, 'message' => 'Publicación guardada exitosamente.']);
        } else {
            send_json(['success' => true, 'message' => 'Publicación registrada (Modo local sin MySQL).']);
        }
    }

    // C. Eliminar publicación
    if ($action === 'delete_post') {
        $id = (int)($input['id'] ?? 0);
        if ($pdo && $id > 0) {
            $stmt = $pdo->prepare("DELETE FROM `bm_gallery_posts` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            send_json(['success' => true, 'message' => 'Publicación eliminada correctamente.']);
        }
        send_json(['success' => false, 'error' => 'No fue posible eliminar la publicación.'], 400);
    }
}
