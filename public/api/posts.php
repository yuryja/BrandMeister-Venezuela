<?php
/**
 * Noticias del portal.
 *
 * Público
 *   GET                       listado de noticias publicadas (?limit=&category=)
 *   GET ?slug=                una noticia publicada
 * Admin / Editor / Autor
 *   GET  ?scope=admin         listado completo con filtros (?status=&category=&search=)
 *   GET  ?scope=admin&id=     una noticia para editar
 *   POST ?action=save         crear / editar
 *   POST ?action=status       {id, status: published|draft|trash}
 *   POST ?action=delete       {id} (borrado definitivo)
 *   POST ?action=bulk         {ids[], operation: publish|draft|trash|restore|delete}
 *   POST ?action=upload_chunk subida por partes (imagen destacada o dentro del texto)
 *   POST ?action=inline_image {upload_id} publica una imagen para insertarla en el texto
 *
 * Los autores solo ven y editan sus propias noticias y no pueden publicar.
 */

require_once __DIR__ . '/uploads.php';

const POST_STATUSES = ['published', 'draft', 'trash'];
const POST_CATEGORIES = ['Innovación', 'Guías Técnicas', 'Operación', 'Comunidad', 'General'];

start_secure_session();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$pdo = get_db_connection();

if (!$pdo) {
    send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento.'], 503);
}

function post_payload(array $r, $withContent = false) {
    $data = [
        'id' => (int)$r['id'],
        'title' => $r['title'],
        'slug' => $r['slug'],
        'description' => $r['description'],
        'category' => $r['category'],
        'tags' => array_values(array_filter(array_map('trim', explode(',', (string)$r['tags'])))),
        'read_time' => $r['read_time'],
        'featured' => (bool)$r['featured'],
        'status' => $r['status'],
        'author_id' => (int)$r['author_id'],
        'author_name' => $r['author_name'] ?? '',
        'author_callsign' => $r['author_callsign'] ?? '',
        'views_count' => (int)($r['views_count'] ?? 0),
        'image_url' => (string)($r['image_url'] ?? ''),
        'published_ts' => (int)$r['published_ts'],
        'url' => '/blog/' . $r['slug'],
    ];
    if ($withContent) {
        $data['content'] = $r['content'];
    }
    return $data;
}

/** Minutos de lectura a 200 palabras por minuto */
function post_read_time($content) {
    $words = str_word_count(strip_tags($content), 0, 'áéíóúüñÁÉÍÓÚÜÑ0123456789');
    return max(1, (int)round($words / 200)) . ' min de lectura';
}

/** Slug limpio y único (añade -2, -3… si ya existe) */
function post_unique_slug(PDO $pdo, $slug, $title, $ignoreId = 0) {
    $base = $slug !== '' ? $slug : $title;
    $base = strtolower(trim(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base) ?: $base));
    $base = trim(preg_replace('/[^a-z0-9]+/', '-', $base), '-');
    $base = substr($base ?: 'noticia', 0, 180);

    $candidate = $base;
    $stmt = $pdo->prepare("SELECT id FROM bm_posts WHERE slug = :s AND id <> :id LIMIT 1");
    for ($i = 2; $i < 50; $i++) {
        $stmt->execute([':s' => $candidate, ':id' => (int)$ignoreId]);
        if (!$stmt->fetch()) {
            return $candidate;
        }
        $candidate = "$base-$i";
    }
    return $base . '-' . substr(bin2hex(random_bytes(3)), 0, 4);
}

/** Imágenes subidas desde el editor que aparecen dentro del texto de una noticia */
function post_inline_images($content) {
    preg_match_all('#/media/noticias/[A-Za-z0-9/_-]+\.webp#', (string)$content, $m);
    return array_values(array_unique($m[0]));
}

/**
 * Borra del disco las imágenes que ya no usa ninguna noticia, ni como destacada ni dentro del
 * texto. Una misma imagen puede estar en varias noticias si alguien copió el texto de otra.
 */
function posts_delete_unused_images(PDO $pdo, array $urls) {
    $check = $pdo->prepare("SELECT COUNT(*) FROM bm_posts WHERE image_url = :u OR content LIKE :l ESCAPE '\\\\'");
    $unused = [];
    foreach (array_unique(array_filter($urls)) as $url) {
        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $url) . '%';
        $check->execute([':u' => $url, ':l' => $like]);
        if ((int)$check->fetchColumn() === 0) {
            $unused[] = $url;
        }
    }
    upload_delete_files($unused);
}

function post_can_edit(array $user, array $post) {
    return $user['role'] !== 'author' || (int)$post['author_id'] === $user['id'];
}

$select = "SELECT p.*, UNIX_TIMESTAMP(p.created_at) AS published_ts, u.full_name AS author_name, u.callsign AS author_callsign
           FROM bm_posts p JOIN bm_users u ON u.id = p.author_id";

// --------------------------------------------------------------------
// GET
// --------------------------------------------------------------------
if ($method === 'GET') {
    $adminScope = ($_GET['scope'] ?? '') === 'admin';

    if ($adminScope) {
        $user = require_role(['admin', 'editor', 'author']);

        if (!empty($_GET['id'])) {
            $stmt = $pdo->prepare("$select WHERE p.id = :id");
            $stmt->execute([':id' => (int)$_GET['id']]);
            $post = $stmt->fetch();
            if (!$post) {
                send_json(['success' => false, 'error' => 'Noticia no encontrada.'], 404);
            }
            if (!post_can_edit($user, $post)) {
                send_json(['success' => false, 'error' => 'Solo puedes editar tus propias noticias.'], 403);
            }
            send_json(['success' => true, 'post' => post_payload($post, true)]);
        }

        $where = [];
        $params = [];
        if ($user['role'] === 'author') {
            $where[] = 'p.author_id = :me';
            $params[':me'] = $user['id'];
        }
        $status = (string)($_GET['status'] ?? 'all');
        if (in_array($status, POST_STATUSES, true)) {
            $where[] = 'p.status = :status';
            $params[':status'] = $status;
        } elseif ($status === 'all') {
            $where[] = "p.status <> 'trash'";
        }
        $search = trim((string)($_GET['search'] ?? ''));
        if ($search !== '') {
            $where[] = '(p.title LIKE :q OR p.description LIKE :q2 OR p.tags LIKE :q3)';
            $like = '%' . $search . '%';
            $params += [':q' => $like, ':q2' => $like, ':q3' => $like];
        }
        $sql = $select . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY p.created_at DESC LIMIT 300';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $posts = array_map(function ($r) { return post_payload($r); }, $stmt->fetchAll());

        // Recuentos por estado (respetando el filtro de autor)
        $countSql = "SELECT status, COUNT(*) AS n FROM bm_posts" . ($user['role'] === 'author' ? ' WHERE author_id = :me' : '') . ' GROUP BY status';
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($user['role'] === 'author' ? [':me' => $user['id']] : []);
        $counts = $countStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        send_json([
            'success' => true,
            'posts' => $posts,
            'counts' => [
                'published' => (int)($counts['published'] ?? 0),
                'draft' => (int)($counts['draft'] ?? 0),
                'trash' => (int)($counts['trash'] ?? 0),
            ],
            'categories' => POST_CATEGORIES,
            'can_publish' => $user['role'] !== 'author',
            'current_user_id' => $user['id'],
        ]);
    }

    // Público
    if (!empty($_GET['slug'])) {
        $stmt = $pdo->prepare("$select WHERE p.slug = :slug AND p.status = 'published' LIMIT 1");
        $stmt->execute([':slug' => (string)$_GET['slug']]);
        $post = $stmt->fetch();
        if (!$post) {
            send_json(['success' => false, 'error' => 'Noticia no encontrada.'], 404);
        }
        send_json(['success' => true, 'post' => post_payload($post, true)]);
    }

    $limit = min(50, max(1, (int)($_GET['limit'] ?? 30)));
    $stmt = $pdo->prepare("$select WHERE p.status = 'published' ORDER BY p.created_at DESC LIMIT $limit");
    $stmt->execute();
    $posts = array_map(function ($r) { return post_payload($r); }, $stmt->fetchAll());
    header('Cache-Control: public, max-age=120');
    send_json(['success' => true, 'count' => count($posts), 'posts' => $posts]);
}

if ($method !== 'POST') {
    send_json(['success' => false, 'error' => 'Método no permitido'], 405);
}

$user = require_role(['admin', 'editor', 'author']);

if ($action === 'upload_chunk') {
    upload_handle_chunk();
}

$input = json_input();

// --------------------------------------------------------------------
// Imagen dentro del texto: se publica al momento para poder insertarla en el editor
// --------------------------------------------------------------------
if ($action === 'inline_image') {
    try {
        $url = upload_commit((string)($input['upload_id'] ?? ''), ['post-inline'], 'noticias');
    } catch (Exception $e) {
        send_json(['success' => false, 'error' => $e->getMessage()], 422);
    }
    $info = @getimagesize(media_root() . substr($url, strlen('/media')));
    log_activity($user['id'], 'post_inline_image', ['url' => $url]);
    send_json([
        'success' => true,
        'url' => $url,
        'width' => $info ? (int)$info[0] : null,
        'height' => $info ? (int)$info[1] : null,
    ]);
}

// --------------------------------------------------------------------
// Crear / editar
// --------------------------------------------------------------------
if ($action === 'save') {
    $id = (int)($input['id'] ?? 0);
    $existing = null;
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM bm_posts WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            send_json(['success' => false, 'error' => 'Noticia no encontrada.'], 404);
        }
        if (!post_can_edit($user, $existing)) {
            send_json(['success' => false, 'error' => 'Solo puedes editar tus propias noticias.'], 403);
        }
    }

    $title = trim((string)($input['title'] ?? ''));
    $description = trim((string)($input['description'] ?? ''));
    $content = trim((string)($input['content'] ?? ''));
    $category = (string)($input['category'] ?? 'General');
    $tagsInput = $input['tags'] ?? '';
    $tags = is_array($tagsInput) ? $tagsInput : explode(',', (string)$tagsInput);
    $tags = array_slice(array_values(array_filter(array_map(function ($t) {
        return trim(preg_replace('/[,#]/', '', (string)$t));
    }, $tags))), 0, 10);
    $featured = !empty($input['featured']) ? 1 : 0;
    $date = (string)($input['published_date'] ?? '');

    $errors = [];
    if (mb_strlen($title) < 5 || mb_strlen($title) > 255) $errors['title'] = 'Entre 5 y 255 caracteres.';
    if (mb_strlen($description) < 10 || mb_strlen($description) > 500) $errors['description'] = 'Entre 10 y 500 caracteres (es el resumen que se ve en el listado).';
    if (mb_strlen($content) < 20) $errors['content'] = 'Escribe el cuerpo de la noticia (mínimo 20 caracteres).';
    if (mb_strlen($content) > 200000) $errors['content'] = 'El contenido es demasiado largo.';
    if (!in_array($category, POST_CATEGORIES, true)) $errors['category'] = 'Categoría no válida.';
    if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) $errors['published_date'] = 'Fecha no válida.';
    if ($errors) {
        send_json(['success' => false, 'error' => 'Revisa los campos marcados.', 'validation_errors' => $errors], 422);
    }

    // ACL: un autor solo guarda borradores; el resto decide el estado
    $status = (string)($input['status'] ?? ($existing['status'] ?? 'draft'));
    if (!in_array($status, POST_STATUSES, true)) $status = 'draft';
    if ($user['role'] === 'author' && $status === 'published') {
        $status = 'draft';
    }

    $slug = post_unique_slug($pdo, (string)($input['slug'] ?? ''), $title, $id);
    $readTime = trim((string)($input['read_time'] ?? '')) ?: post_read_time($content);

    // Imagen destacada: se envía el identificador de una subida ya completada
    $imageUrl = $existing['image_url'] ?? '';
    $oldImage = $imageUrl;
    if (!empty($input['image'])) {
        try {
            $imageUrl = upload_commit((string)$input['image'], ['post-image'], 'noticias');
        } catch (Exception $e) {
            send_json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    } elseif (!empty($input['remove_image'])) {
        $imageUrl = '';
    }

    $columns = [
        'title' => $title,
        'image_url' => $imageUrl,
        'slug' => $slug,
        'description' => $description,
        'content' => $content,
        'category' => $category,
        'tags' => implode(', ', $tags),
        'read_time' => $readTime,
        'featured' => $featured,
        'status' => $status,
    ];
    $sets = [];
    $params = [];
    foreach ($columns as $col => $value) {
        $sets[] = "`$col` = :$col";
        $params[":$col"] = $value;
    }
    if ($date !== '') {
        $sets[] = '`created_at` = :created_at';
        $params[':created_at'] = $date . ' 12:00:00';
    }

    if ($existing) {
        $params[':id'] = $id;
        $pdo->prepare('UPDATE bm_posts SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
        if ($oldImage && $oldImage !== $imageUrl) {
            upload_delete_files([$oldImage]);
        }
        log_activity($user['id'], 'post_updated', ['id' => $id, 'status' => $status]);
    } else {
        $sets[] = '`author_id` = :author_id';
        $params[':author_id'] = $user['id'];
        $pdo->prepare('INSERT INTO bm_posts SET ' . implode(', ', $sets))->execute($params);
        $id = (int)$pdo->lastInsertId();
        log_activity($user['id'], 'post_created', ['id' => $id, 'status' => $status]);
    }

    $stmt = $pdo->prepare("$select WHERE p.id = :id");
    $stmt->execute([':id' => $id]);
    $saved = post_payload($stmt->fetch(), true);

    $message = $status === 'published' ? 'Noticia publicada.' : ($status === 'trash' ? 'Noticia movida a la papelera.' : 'Borrador guardado.');
    if ($user['role'] === 'author' && ($input['status'] ?? '') === 'published') {
        $message = 'Guardado como borrador: un Editor debe publicarlo.';
    }
    send_json(['success' => true, 'message' => $message, 'post' => $saved]);
}

// --------------------------------------------------------------------
// Estado / borrado
// --------------------------------------------------------------------
function posts_change_status(PDO $pdo, array $user, array $ids, $status) {
    $ids = array_values(array_filter(array_map('intval', $ids)));
    if (!$ids) return 0;
    if ($user['role'] === 'author' && $status === 'published') {
        return -1;
    }
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "UPDATE bm_posts SET status = ? WHERE id IN ($placeholders)";
    $params = array_merge([$status], $ids);
    if ($user['role'] === 'author') {
        $sql .= ' AND author_id = ?';
        $params[] = $user['id'];
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->rowCount();
}

if ($action === 'status') {
    $status = (string)($input['status'] ?? '');
    if (!in_array($status, POST_STATUSES, true)) {
        send_json(['success' => false, 'error' => 'Estado no válido.'], 400);
    }
    $changed = posts_change_status($pdo, $user, [$input['id'] ?? 0], $status);
    if ($changed === -1) {
        send_json(['success' => false, 'error' => 'Los autores no pueden publicar: guarda el borrador y avisa a un Editor.'], 403);
    }
    if ($changed === 0) {
        send_json(['success' => false, 'error' => 'Noticia no encontrada o sin permisos.'], 404);
    }
    log_activity($user['id'], 'post_status', ['id' => (int)($input['id'] ?? 0), 'status' => $status]);
    $labels = ['published' => 'Noticia publicada.', 'draft' => 'Noticia pasada a borrador.', 'trash' => 'Noticia movida a la papelera.'];
    send_json(['success' => true, 'message' => $labels[$status]]);
}

if ($action === 'delete' || ($action === 'bulk' && ($input['operation'] ?? '') === 'delete')) {
    $ids = $action === 'delete' ? [$input['id'] ?? 0] : (array)($input['ids'] ?? []);
    $ids = array_values(array_filter(array_map('intval', $ids)));
    if (!$ids) {
        send_json(['success' => false, 'error' => 'No seleccionaste noticias.'], 400);
    }
    if ($user['role'] === 'author') {
        send_json(['success' => false, 'error' => 'Los autores no pueden borrar definitivamente: usa la papelera.'], 403);
    }
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $images = $pdo->prepare("SELECT image_url, content FROM bm_posts WHERE id IN ($placeholders)");
    $images->execute($ids);
    $urls = [];
    foreach ($images->fetchAll() as $row) {
        $urls[] = $row['image_url'];
        $urls = array_merge($urls, post_inline_images($row['content']));
    }

    $stmt = $pdo->prepare("DELETE FROM bm_posts WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    // Después de borrar, para saber qué imágenes ya no usa ninguna otra noticia
    posts_delete_unused_images($pdo, $urls);
    log_activity($user['id'], 'post_deleted', ['ids' => $ids]);
    send_json(['success' => true, 'message' => $stmt->rowCount() . ' noticia(s) eliminada(s) definitivamente.']);
}

if ($action === 'bulk') {
    $operation = (string)($input['operation'] ?? '');
    $map = ['publish' => 'published', 'draft' => 'draft', 'trash' => 'trash', 'restore' => 'draft'];
    if (!isset($map[$operation])) {
        send_json(['success' => false, 'error' => 'Acción en lote no válida.'], 400);
    }
    $changed = posts_change_status($pdo, $user, (array)($input['ids'] ?? []), $map[$operation]);
    if ($changed === -1) {
        send_json(['success' => false, 'error' => 'Los autores no pueden publicar.'], 403);
    }
    log_activity($user['id'], 'posts_bulk', ['operation' => $operation, 'ids' => (array)($input['ids'] ?? [])]);
    send_json(['success' => true, 'message' => "Cambios aplicados a $changed noticia(s)."]);
}

send_json(['success' => false, 'error' => 'Acción no válida'], 400);
