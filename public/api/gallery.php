<?php
/**
 * Galería multimedia - BrandMeister Venezuela
 *
 * Las fotos y videos se suben desde el panel. El navegador ya los entrega optimizados:
 * fotos WebP que caben en 1500×1500 y videos comprimidos (MP4/WebM). Aquí se validan y se guardan.
 *
 * Público
 *   GET                              publicaciones visibles
 * Admin / Editor
 *   GET  ?scope=admin                todas, incluidas las ocultas
 *   POST ?action=upload_chunk        subida por partes (multipart: upload_id, index, total, kind, chunk)
 *   POST ?action=save                crear / editar {id?, caption, author, permalink, published_date, status, images[], video?, poster?}
 *   POST ?action=visibility          {id, status: published|hidden}
 *   POST ?action=delete              {id}
 */

require_once __DIR__ . '/uploads.php';

const GALLERY_MAX_IMAGES = 20;

start_secure_session();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$pdo = get_db_connection();

if (!$pdo) {
    send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento.'], 503);
}

/** Borra del disco los archivos de una publicación */
function gallery_delete_files(array $row) {
    $urls = [$row['media_url'], $row['thumbnail_url'], $row['video_url']];
    foreach (json_decode($row['carousel_json'] ?: '[]', true) ?: [] as $item) {
        $urls[] = $item['url'] ?? null;
    }
    upload_delete_files($urls);
}

function gallery_row_payload(array $r) {
    $carousel = json_decode($r['carousel_json'] ?: '[]', true);
    return [
        'id' => (string)$r['id'],
        'media_type' => $r['media_type'],
        'media_url' => $r['media_url'],
        'thumbnail_url' => $r['thumbnail_url'] ?: $r['media_url'],
        'carousel_media' => is_array($carousel) ? array_values($carousel) : [],
        'video_url' => $r['video_url'],
        'caption' => (string)$r['caption'],
        'author' => $r['author'],
        'permalink' => $r['permalink'] ?: null,
        'published_ts' => (int)$r['published_ts'],
        'status' => $r['status'],
    ];
}

// --------------------------------------------------------------------
// GET
// --------------------------------------------------------------------
if ($method === 'GET') {
    $adminScope = ($_GET['scope'] ?? '') === 'admin';
    if ($adminScope) {
        require_role(['admin', 'editor']);
    }
    $sql = "SELECT *, UNIX_TIMESTAMP(published_at) AS published_ts FROM bm_gallery_posts"
        . ($adminScope ? '' : " WHERE status = 'published'")
        . " ORDER BY published_at DESC, id DESC LIMIT " . ($adminScope ? 500 : 200);
    $posts = array_map('gallery_row_payload', $pdo->query($sql)->fetchAll());

    if (!$adminScope) {
        $posts = array_map(function ($p) { unset($p['status']); return $p; }, $posts);
        header('Cache-Control: public, max-age=60');
    }
    send_json(['success' => true, 'count' => count($posts), 'posts' => $posts]);
}

if ($method !== 'POST') {
    send_json(['success' => false, 'error' => 'Método no permitido'], 405);
}

$user = require_role(['admin', 'editor']);

// --------------------------------------------------------------------
// Subida por partes: evita los límites de upload_max_filesize del hosting
// --------------------------------------------------------------------
if ($action === 'upload_chunk') {
    upload_handle_chunk();
}

// --------------------------------------------------------------------
// Crear / editar publicación
// --------------------------------------------------------------------
if ($action === 'save') {
    $input = json_input();
    $id = (int)($input['id'] ?? 0);
    $existing = null;
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM bm_gallery_posts WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            send_json(['success' => false, 'error' => 'Publicación no encontrada.'], 404);
        }
    }

    $caption = trim((string)($input['caption'] ?? ''));
    $author = trim((string)($input['author'] ?? '')) ?: '@brandmeister_yv';
    $permalink = trim((string)($input['permalink'] ?? ''));
    // Al editar sin enviar estado se conserva el que tenía
    $status = isset($input['status'])
        ? ($input['status'] === 'hidden' ? 'hidden' : 'published')
        : ($existing['status'] ?? 'published');
    $date = (string)($input['published_date'] ?? '');

    $errors = [];
    if (mb_strlen($caption) > 2200) $errors['caption'] = 'Máximo 2.200 caracteres.';
    if (mb_strlen($author) > 80) $errors['author'] = 'Máximo 80 caracteres.';
    if ($permalink !== '' && (!filter_var($permalink, FILTER_VALIDATE_URL) || !preg_match('#^https://#i', $permalink) || strlen($permalink) > 255)) {
        $errors['permalink'] = 'Debe ser un enlace https:// válido.';
    }
    if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        $errors['published_date'] = 'Fecha no válida.';
    }
    if ($errors) {
        send_json(['success' => false, 'error' => 'Revisa los campos marcados.', 'validation_errors' => $errors], 422);
    }

    $images = array_values(array_filter((array)($input['images'] ?? []), 'is_string'));
    $video = is_string($input['video'] ?? null) ? $input['video'] : null;
    $poster = is_string($input['poster'] ?? null) ? $input['poster'] : null;
    // En edición los medios solo cambian si se envían nuevos
    $replaceMedia = !$existing || !empty($images) || $video !== null;

    $columns = [
        'caption' => $caption,
        'author' => $author,
        'permalink' => $permalink,
        'status' => $status,
    ];

    if ($replaceMedia) {
        if ($video !== null && $images) {
            send_json(['success' => false, 'error' => 'Una publicación lleva fotos o un video, no ambos.'], 422);
        }
        if ($video === null && !$images) {
            send_json(['success' => false, 'error' => 'Añade al menos una foto o un video.'], 422);
        }
        if (count($images) > GALLERY_MAX_IMAGES) {
            send_json(['success' => false, 'error' => 'Máximo ' . GALLERY_MAX_IMAGES . ' fotos por publicación.'], 422);
        }
        try {
            if ($video !== null) {
                if ($poster === null) {
                    throw new Exception('Falta la portada del video.');
                }
                $videoUrl = upload_commit($video, ['video'], 'gallery');
                $posterUrl = upload_commit($poster, ['poster', 'image'], 'gallery');
                $columns += ['media_type' => 'VIDEO', 'media_url' => $posterUrl, 'thumbnail_url' => $posterUrl, 'video_url' => $videoUrl, 'carousel_json' => null];
            } else {
                $urls = array_map(function ($uploadId) { return upload_commit($uploadId, ['image'], 'gallery'); }, $images);
                $columns += [
                    'media_type' => count($urls) > 1 ? 'CAROUSEL_ALBUM' : 'IMAGE',
                    'media_url' => $urls[0],
                    'thumbnail_url' => $urls[0],
                    'video_url' => null,
                    'carousel_json' => count($urls) > 1
                        ? json_encode(array_map(function ($u) { return ['url' => $u, 'caption' => '']; }, $urls), JSON_UNESCAPED_SLASHES)
                        : null,
                ];
            }
        } catch (Exception $e) {
            send_json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    $params = [];
    $sets = [];
    foreach ($columns as $col => $value) {
        $sets[] = "`$col` = :$col";
        $params[":$col"] = $value;
    }
    if ($date !== '') {
        // Mediodía para que la fecha no cambie de día por zona horaria
        $sets[] = '`published_at` = :published_at';
        $params[':published_at'] = $date . ' 12:00:00';
    }

    if ($existing) {
        $params[':id'] = $id;
        $pdo->prepare('UPDATE bm_gallery_posts SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
        if ($replaceMedia) {
            gallery_delete_files($existing);
        }
        log_activity($user['id'], 'gallery_updated', ['id' => $id, 'media_replaced' => $replaceMedia]);
    } else {
        $pdo->prepare('INSERT INTO bm_gallery_posts SET ' . implode(', ', $sets))->execute($params);
        $id = (int)$pdo->lastInsertId();
        log_activity($user['id'], 'gallery_created', ['id' => $id, 'type' => $columns['media_type']]);
    }

    $stmt = $pdo->prepare("SELECT *, UNIX_TIMESTAMP(published_at) AS published_ts FROM bm_gallery_posts WHERE id = :id");
    $stmt->execute([':id' => $id]);
    send_json(['success' => true, 'message' => $existing ? 'Publicación actualizada.' : 'Publicación creada.', 'post' => gallery_row_payload($stmt->fetch())]);
}

if ($action === 'visibility') {
    $input = json_input();
    $status = ($input['status'] ?? '') === 'hidden' ? 'hidden' : 'published';
    $id = (int)($input['id'] ?? 0);
    $exists = $pdo->prepare("SELECT id FROM bm_gallery_posts WHERE id = :id");
    $exists->execute([':id' => $id]);
    if (!$exists->fetch()) {
        send_json(['success' => false, 'error' => 'Publicación no encontrada.'], 404);
    }
    $pdo->prepare("UPDATE bm_gallery_posts SET status = :s WHERE id = :id")->execute([':s' => $status, ':id' => $id]);
    send_json(['success' => true, 'message' => $status === 'hidden' ? 'Publicación oculta.' : 'Publicación visible en la galería.']);
}

if ($action === 'delete') {
    $input = json_input();
    $stmt = $pdo->prepare("SELECT * FROM bm_gallery_posts WHERE id = :id");
    $stmt->execute([':id' => (int)($input['id'] ?? 0)]);
    $row = $stmt->fetch();
    if (!$row) {
        send_json(['success' => false, 'error' => 'Publicación no encontrada.'], 404);
    }
    $pdo->prepare("DELETE FROM bm_gallery_posts WHERE id = :id")->execute([':id' => $row['id']]);
    gallery_delete_files($row);
    log_activity($user['id'], 'gallery_deleted', ['id' => (int)$row['id']]);
    send_json(['success' => true, 'message' => 'Publicación eliminada con sus archivos.']);
}

send_json(['success' => false, 'error' => 'Acción no válida'], 400);
