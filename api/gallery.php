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

require_once __DIR__ . '/db.php';

const GALLERY_MAX_IMAGE_SIDE = 1500;
const GALLERY_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const GALLERY_MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const GALLERY_MAX_CHUNK_BYTES = 6 * 1024 * 1024;
const GALLERY_MAX_IMAGES = 20;

start_secure_session();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$pdo = get_db_connection();

if (!$pdo) {
    send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento.'], 503);
}

function gallery_root() {
    return rtrim(getenv('GALLERY_MEDIA_DIR') ?: dirname(__DIR__) . '/media', '/');
}

function gallery_tmp_dir() {
    $dir = gallery_root() . '/gallery/.tmp';
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        throw new Exception('No se pudo crear la carpeta temporal de subidas.');
    }
    gallery_protect_dir(gallery_root() . '/gallery', true);
    // La carpeta temporal nunca se sirve
    if (!file_exists("$dir/.htaccess")) {
        @file_put_contents("$dir/.htaccess", "Require all denied\n");
    }
    return $dir;
}

/** Sin listados ni ejecución de scripts dentro de las carpetas de medios */
function gallery_protect_dir($dir, $create = false) {
    if ($create && !is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (is_dir($dir) && !file_exists("$dir/.htaccess")) {
        @file_put_contents("$dir/.htaccess", "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh|html?|svg)$\">\n  Require all denied\n</FilesMatch>\n");
    }
}

/** Borra subidas temporales abandonadas (más de 24 h) */
function gallery_purge_tmp() {
    foreach (glob(gallery_tmp_dir() . '/*') ?: [] as $file) {
        if (is_file($file) && basename($file) !== '.htaccess' && filemtime($file) < time() - 86400) {
            @unlink($file);
        }
    }
}

function gallery_valid_upload_id($id) {
    return is_string($id) && preg_match('/^[a-f0-9]{32}$/', $id);
}

/** Busca una subida temporal ya completa y validada: devuelve [ruta, kind, ext] o null */
function gallery_find_upload($uploadId) {
    if (!gallery_valid_upload_id($uploadId)) return null;
    foreach (['image' => ['webp'], 'poster' => ['webp'], 'video' => ['mp4', 'webm']] as $kind => $exts) {
        foreach ($exts as $ext) {
            $path = gallery_tmp_dir() . "/$uploadId.$kind.$ext";
            if (is_file($path)) return [$path, $kind, $ext];
        }
    }
    return null;
}

/** Valida un archivo ensamblado. Devuelve la extensión final o lanza Exception */
function gallery_validate_file($path, $kind) {
    $size = filesize($path);
    if ($kind === 'video') {
        if ($size > GALLERY_MAX_VIDEO_BYTES) {
            throw new Exception('El video supera el tamaño máximo (250 MB).');
        }
        $head = file_get_contents($path, false, null, 0, 12);
        if (strlen($head) >= 8 && substr($head, 4, 4) === 'ftyp') return 'mp4';
        if (strncmp($head, "\x1A\x45\xDF\xA3", 4) === 0) return 'webm';
        throw new Exception('El video debe ser MP4 o WebM.');
    }

    if ($size > GALLERY_MAX_IMAGE_BYTES) {
        throw new Exception('La imagen es demasiado pesada.');
    }
    $info = @getimagesize($path);
    if (!$info || $info[2] !== IMAGETYPE_WEBP) {
        throw new Exception('Las imágenes deben llegar en formato WebP.');
    }
    if ($info[0] > GALLERY_MAX_IMAGE_SIDE || $info[1] > GALLERY_MAX_IMAGE_SIDE) {
        throw new Exception('La imagen supera 1500×1500 píxeles.');
    }
    return 'webp';
}

/** Mueve una subida temporal a su carpeta definitiva y devuelve la URL pública */
function gallery_commit_upload($uploadId, array $allowedKinds) {
    $found = gallery_find_upload($uploadId);
    if (!$found || !in_array($found[1], $allowedKinds, true)) {
        throw new Exception('Un archivo subido no se encontró o expiró. Vuelve a añadirlo.');
    }
    [$path, , $ext] = $found;
    $subdir = 'gallery/' . gmdate('Y/m');
    $dir = gallery_root() . '/' . $subdir;
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        throw new Exception('No se pudo crear la carpeta de la galería.');
    }
    $name = bin2hex(random_bytes(12)) . '.' . $ext;
    if (!rename($path, "$dir/$name")) {
        throw new Exception('No se pudo guardar el archivo.');
    }
    @chmod("$dir/$name", 0644);
    return '/media/' . $subdir . '/' . $name;
}

/** Borra del disco los archivos locales de una publicación (solo dentro de /media/) */
function gallery_delete_files(array $row) {
    $urls = [$row['media_url'], $row['thumbnail_url'], $row['video_url']];
    foreach (json_decode($row['carousel_json'] ?: '[]', true) ?: [] as $item) {
        $urls[] = $item['url'] ?? null;
    }
    $root = realpath(gallery_root());
    foreach (array_unique(array_filter($urls)) as $url) {
        if (strpos($url, '/media/') !== 0) continue;
        $file = realpath(gallery_root() . substr($url, strlen('/media')));
        if ($file && $root && strpos($file, $root . DIRECTORY_SEPARATOR) === 0 && is_file($file)) {
            @unlink($file);
        }
    }
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
    $uploadId = (string)($_POST['upload_id'] ?? '');
    $index = (int)($_POST['index'] ?? -1);
    $total = (int)($_POST['total'] ?? 0);
    $kind = (string)($_POST['kind'] ?? '');
    $chunk = $_FILES['chunk'] ?? null;

    if (!gallery_valid_upload_id($uploadId) || !in_array($kind, ['image', 'poster', 'video'], true)) {
        send_json(['success' => false, 'error' => 'Subida no válida.'], 400);
    }
    if ($total < 1 || $total > 100 || $index < 0 || $index >= $total) {
        send_json(['success' => false, 'error' => 'Parte de la subida no válida.'], 400);
    }
    if (!$chunk || ($chunk['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($chunk['tmp_name'])) {
        $code = $chunk['error'] ?? UPLOAD_ERR_NO_FILE;
        $msg = in_array($code, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? 'El servidor rechazó la parte por tamaño (upload_max_filesize).'
            : 'No se recibió el archivo.';
        send_json(['success' => false, 'error' => $msg], 400);
    }
    if ($chunk['size'] > GALLERY_MAX_CHUNK_BYTES) {
        send_json(['success' => false, 'error' => 'Parte demasiado grande.'], 413);
    }

    if ($index === 0) {
        gallery_purge_tmp();
    }
    $partPath = gallery_tmp_dir() . "/$uploadId.$kind.part";
    if ($index === 0) {
        @unlink($partPath);
    } elseif (!is_file($partPath)) {
        send_json(['success' => false, 'error' => 'La subida se interrumpió. Vuelve a intentarlo.'], 409);
    }

    // Las partes llegan en orden: se añaden al final del archivo
    $maxBytes = $kind === 'video' ? GALLERY_MAX_VIDEO_BYTES : GALLERY_MAX_IMAGE_BYTES;
    if ((is_file($partPath) ? filesize($partPath) : 0) + $chunk['size'] > $maxBytes) {
        @unlink($partPath);
        send_json(['success' => false, 'error' => 'El archivo supera el tamaño máximo permitido.'], 413);
    }
    $out = fopen($partPath, 'ab');
    $in = fopen($chunk['tmp_name'], 'rb');
    stream_copy_to_stream($in, $out);
    fclose($in);
    fclose($out);

    if ($index < $total - 1) {
        send_json(['success' => true, 'received' => $index + 1]);
    }

    try {
        $ext = gallery_validate_file($partPath, $kind);
    } catch (Exception $e) {
        @unlink($partPath);
        send_json(['success' => false, 'error' => $e->getMessage()], 422);
    }
    rename($partPath, gallery_tmp_dir() . "/$uploadId.$kind.$ext");
    send_json(['success' => true, 'upload_id' => $uploadId, 'complete' => true]);
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
                $videoUrl = gallery_commit_upload($video, ['video']);
                $posterUrl = gallery_commit_upload($poster, ['poster', 'image']);
                $columns += ['media_type' => 'VIDEO', 'media_url' => $posterUrl, 'thumbnail_url' => $posterUrl, 'video_url' => $videoUrl, 'carousel_json' => null];
            } else {
                $urls = array_map(function ($uploadId) { return gallery_commit_upload($uploadId, ['image']); }, $images);
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
