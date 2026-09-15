<?php
/**
 * Galería de Instagram (#ExperienciaDMR) - BrandMeister Venezuela
 *
 * Público
 *   GET                              publicaciones visibles (?type=IMAGE|VIDEO|CAROUSEL_ALBUM)
 * Admin / Editor
 *   GET  ?scope=admin                todas, incluidas las ocultas
 *   GET  ?action=status              estado de la conexión con Instagram
 *   GET  ?action=connect             redirige a Instagram para autorizar (solo Administrador)
 *   POST ?action=disconnect          olvida el token (solo Administrador)
 *   POST ?action=sync                sincroniza ahora
 *   POST ?action=visibility          {id, status: published|hidden}
 *   POST ?action=save_post           crear / editar una publicación manual
 *   POST ?action=delete_post         eliminar una publicación
 */

require_once __DIR__ . '/instagram-lib.php';

start_secure_session();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$pdo = get_db_connection();

function gallery_row_payload(array $r) {
    $carousel = !empty($r['carousel_json']) ? json_decode($r['carousel_json'], true) : [];
    return [
        'id' => (string)$r['id'],
        'instagram_id' => $r['instagram_id'],
        'source' => (strpos((string)$r['instagram_id'], 'manual_') === 0 || $r['instagram_id'] === null) ? 'manual' : 'instagram',
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
        'published_ts' => (int)$r['published_ts'],
        'status' => $r['status'],
    ];
}

// --------------------------------------------------------------------
// Conexión OAuth (navegación del navegador, no JSON)
// --------------------------------------------------------------------
if ($action === 'connect') {
    $user = current_user();
    if (!$user || $user['role'] !== 'admin') {
        header('Location: /admin/?instagram=forbidden', true, 302);
        exit;
    }
    $creds = ig_get_settings(['instagram_app_id', 'instagram_app_secret']);
    if ($creds['instagram_app_id'] === '' || $creds['instagram_app_secret'] === '') {
        header('Location: /admin/?instagram=missing_app#gallery', true, 302);
        exit;
    }
    header('Location: ' . ig_authorize_url($creds['instagram_app_id']), true, 302);
    exit;
}

if (!$pdo) {
    send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento.'], 503);
}

// --------------------------------------------------------------------
// GET
// --------------------------------------------------------------------
if ($method === 'GET' && $action === 'status') {
    require_role(['admin', 'editor']);
    $status = ig_status();
    $counts = $pdo->query("SELECT status, COUNT(*) AS n FROM bm_gallery_posts GROUP BY status")->fetchAll(PDO::FETCH_KEY_PAIR);
    $status['posts_published'] = (int)($counts['published'] ?? 0);
    $status['posts_hidden'] = (int)($counts['hidden'] ?? 0);
    $status['cron_command'] = 'php ' . __DIR__ . '/instagram-cron.php';
    send_json(['success' => true, 'instagram' => $status]);
}

if ($method === 'GET') {
    $adminScope = ($_GET['scope'] ?? '') === 'admin';
    if ($adminScope) {
        require_role(['admin', 'editor']);
    }
    $filterType = strtoupper((string)($_GET['type'] ?? 'all'));

    $sql = "SELECT *, UNIX_TIMESTAMP(published_at) AS published_ts FROM bm_gallery_posts";
    $where = [];
    $params = [];
    if (!$adminScope) {
        $where[] = "status = 'published'";
    }
    if (in_array($filterType, ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'], true)) {
        $where[] = 'media_type = :type';
        $params[':type'] = $filterType;
    }
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY published_at DESC LIMIT ' . ($adminScope ? 300 : 120);

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = array_map('gallery_row_payload', $stmt->fetchAll());

    if (!$adminScope) {
        // Solo lo necesario para la galería pública
        $posts = array_map(function ($p) {
            unset($p['status'], $p['instagram_id'], $p['source']);
            return $p;
        }, $posts);
        header('Cache-Control: public, max-age=120');
    }
    $s = ig_get_settings(['instagram_hashtag', 'instagram_username']);
    send_json([
        'success' => true,
        'count' => count($posts),
        'posts' => $posts,
        'hashtag' => ig_display_hashtag($s['instagram_hashtag']),
        'account' => $s['instagram_username'] ?: 'brandmeister_yv',
    ]);
}

if ($method !== 'POST') {
    send_json(['success' => false, 'error' => 'Método no permitido'], 405);
}

// --------------------------------------------------------------------
// POST (panel)
// --------------------------------------------------------------------
$user = require_role(['admin', 'editor']);
$input = json_input();

if ($action === 'disconnect') {
    if ($user['role'] !== 'admin') {
        send_json(['success' => false, 'error' => 'Solo un Administrador puede desconectar Instagram.'], 403);
    }
    ig_disconnect();
    log_activity($user['id'], 'instagram_disconnected');
    send_json(['success' => true, 'message' => 'Instagram desconectado. Las publicaciones ya sincronizadas se conservan.']);
}

if ($action === 'sync') {
    // Evita dos sincronizaciones simultáneas (botón + cron)
    $lock = fopen(sys_get_temp_dir() . '/bmyv-instagram-sync.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        send_json(['success' => false, 'error' => 'Ya hay una sincronización en curso. Espera un momento.'], 409);
    }
    @set_time_limit(300);
    try {
        ig_refresh_token_if_needed();
        $result = ig_sync();
    } catch (Exception $e) {
        log_activity($user['id'], 'instagram_sync_failed', $e->getMessage());
        send_json(['success' => false, 'error' => $e->getMessage()], 502);
    } finally {
        flock($lock, LOCK_UN);
    }
    log_activity($user['id'], 'instagram_sync', $result);

    $parts = ["{$result['matched']} publicaciones con #{$result['hashtag']}"];
    if ($result['added']) $parts[] = "{$result['added']} nuevas";
    if ($result['updated']) $parts[] = "{$result['updated']} actualizadas";
    if ($result['hidden']) $parts[] = "{$result['hidden']} ocultadas (ya no están en Instagram o sin hashtag)";
    if ($result['failed_media']) $parts[] = "{$result['failed_media']} medios no se pudieron descargar";
    send_json(['success' => true, 'message' => 'Sincronización completada: ' . implode(', ', $parts) . '.', 'result' => $result]);
}

if ($action === 'visibility') {
    $id = (int)($input['id'] ?? 0);
    $status = ($input['status'] ?? '') === 'hidden' ? 'hidden' : 'published';
    $stmt = $pdo->prepare("UPDATE bm_gallery_posts SET status = :s WHERE id = :id");
    $stmt->execute([':s' => $status, ':id' => $id]);
    if ($stmt->rowCount() === 0) {
        send_json(['success' => false, 'error' => 'Publicación no encontrada o sin cambios.'], 404);
    }
    send_json(['success' => true, 'message' => $status === 'hidden' ? 'Publicación oculta en la galería.' : 'Publicación visible en la galería.']);
}

if ($action === 'save_post') {
    $id = !empty($input['id']) ? (int)$input['id'] : null;
    $isHttpUrl = function ($url) {
        return is_string($url) && $url !== '' && filter_var($url, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $url);
    };

    if ($id) {
        $existing = $pdo->prepare("SELECT instagram_id FROM bm_gallery_posts WHERE id = :id");
        $existing->execute([':id' => $id]);
        $row = $existing->fetch();
        if (!$row) {
            send_json(['success' => false, 'error' => 'Publicación no encontrada.'], 404);
        }
        if ($row['instagram_id'] !== null && strpos($row['instagram_id'], 'manual_') !== 0) {
            send_json(['success' => false, 'error' => 'Las publicaciones sincronizadas se editan en Instagram; aquí solo puedes ocultarlas.'], 400);
        }
    }

    $permalink = trim((string)($input['permalink'] ?? '')) ?: 'https://www.instagram.com/brandmeister_yv/';
    $mediaType = in_array($input['media_type'] ?? '', ['IMAGE', 'CAROUSEL_ALBUM', 'VIDEO'], true) ? $input['media_type'] : 'IMAGE';
    $mediaUrl = trim((string)($input['media_url'] ?? ''));
    $thumbnail = trim((string)($input['thumbnail_url'] ?? '')) ?: $mediaUrl;
    $videoUrl = trim((string)($input['video_url'] ?? ''));
    $caption = trim((string)($input['caption'] ?? ''));
    $author = trim((string)($input['author'] ?? '')) ?: '@brandmeister_yv';

    if ($mediaUrl === '') {
        send_json(['success' => false, 'error' => 'La URL de la imagen principal es requerida.'], 422);
    }
    foreach (['media_url' => $mediaUrl, 'thumbnail_url' => $thumbnail, 'permalink' => $permalink] as $field => $url) {
        if (!$isHttpUrl($url)) {
            send_json(['success' => false, 'error' => "La URL de $field no es válida (debe comenzar por http:// o https://)."], 422);
        }
    }
    if ($videoUrl !== '' && !$isHttpUrl($videoUrl)) {
        send_json(['success' => false, 'error' => 'La URL del video no es válida.'], 422);
    }
    $carousel = [];
    foreach ((array)($input['carousel_media'] ?? []) as $item) {
        $url = is_array($item) ? trim((string)($item['url'] ?? '')) : '';
        if ($isHttpUrl($url)) {
            $carousel[] = ['url' => $url, 'caption' => trim((string)($item['caption'] ?? ''))];
        }
    }

    $values = [
        ':permalink' => $permalink, ':mtype' => $mediaType, ':murl' => $mediaUrl, ':thumb' => $thumbnail,
        ':carousel' => $carousel ? json_encode($carousel, JSON_UNESCAPED_SLASHES) : null,
        ':vurl' => $videoUrl ?: null, ':caption' => $caption, ':author' => $author,
    ];
    if ($id) {
        $pdo->prepare("UPDATE bm_gallery_posts SET permalink = :permalink, media_type = :mtype, media_url = :murl, thumbnail_url = :thumb,
            carousel_json = :carousel, video_url = :vurl, caption = :caption, author = :author WHERE id = :id")->execute($values + [':id' => $id]);
    } else {
        $pdo->prepare("INSERT INTO bm_gallery_posts (instagram_id, permalink, media_type, media_url, thumbnail_url, carousel_json, video_url, caption, author, status)
            VALUES (:ig_id, :permalink, :mtype, :murl, :thumb, :carousel, :vurl, :caption, :author, 'published')")
            ->execute($values + [':ig_id' => 'manual_' . bin2hex(random_bytes(6))]);
    }
    send_json(['success' => true, 'message' => 'Publicación guardada.']);
}

if ($action === 'delete_post') {
    $id = (int)($input['id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM bm_gallery_posts WHERE id = :id");
    $stmt->execute([':id' => $id]);
    if ($stmt->rowCount() === 0) {
        send_json(['success' => false, 'error' => 'No fue posible eliminar la publicación.'], 404);
    }
    send_json(['success' => true, 'message' => 'Publicación eliminada. Si sigue en Instagram con el hashtag, volverá en la próxima sincronización (mejor ocúltala).']);
}

send_json(['success' => false, 'error' => 'Acción no válida'], 400);
