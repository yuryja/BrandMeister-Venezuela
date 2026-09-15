<?php
require_once __DIR__ . '/db.php';

start_secure_session();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db_connection();
$sessionUser = current_user();
// Solo el equipo autenticado puede ver borradores y papelera
$canSeeDrafts = $sessionUser !== null;

// GET: Listar o consultar noticia
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if ($id && $pdo) {
        $sql = "SELECT p.*, u.full_name as author_name, u.callsign as author_callsign FROM bm_posts p JOIN bm_users u ON p.author_id = u.id WHERE p.id = :id";
        if (!$canSeeDrafts) {
            $sql .= " AND p.status = 'published'";
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $post = $stmt->fetch();
        if ($post) {
            send_json(['success' => true, 'post' => $post]);
        } else {
            send_json(['success' => false, 'error' => 'Noticia no encontrada'], 404);
        }
    }

    if ($pdo) {
        $status = $_GET['status'] ?? 'all';
        if (!in_array($status, ['all', 'published', 'draft', 'trash'], true)) {
            $status = 'all';
        }
        if (!$canSeeDrafts) {
            $status = 'published';
        }
        $sql = "SELECT p.id, p.title, p.slug, p.category, p.status, p.featured, p.read_time, p.created_at, u.full_name as author_name, u.callsign as author_callsign 
                FROM bm_posts p 
                JOIN bm_users u ON p.author_id = u.id";
        
        if ($status !== 'all') {
            $sql .= " WHERE p.status = :status";
        }
        $sql .= " ORDER BY p.created_at DESC";

        $stmt = $pdo->prepare($sql);
        if ($status !== 'all') {
            $stmt->execute([':status' => $status]);
        } else {
            $stmt->execute();
        }
        $posts = $stmt->fetchAll();
        send_json(['success' => true, 'posts' => $posts, 'source' => 'mysql']);
    }

    // Fallback con datos sembrados si aún no se conecta a MySQL
    $defaultPosts = [
        [
            'id' => 1,
            'title' => 'Evolución y estado del sistema Petra para el TG 734 en Venezuela',
            'slug' => 'petra-telemetria-tg734',
            'category' => 'Innovación',
            'status' => 'published',
            'featured' => 1,
            'read_time' => '5 min de lectura',
            'author_name' => 'Yury',
            'author_callsign' => 'YY3BIG',
            'created_at' => '2026-08-20 10:00:00'
        ],
        [
            'id' => 2,
            'title' => 'Guía esencial: Configuración de Hotspots DMR en BrandMeister Venezuela',
            'slug' => 'configuracion-hotspots-dmr-venezuela',
            'category' => 'Guías Técnicas',
            'status' => 'published',
            'featured' => 0,
            'read_time' => '6 min de lectura',
            'author_name' => 'Severino Mastracci',
            'author_callsign' => 'YV5OF',
            'created_at' => '2026-08-05 14:30:00'
        ],
        [
            'id' => 3,
            'title' => 'Protocolo de operación en emergencias con el TG 734911 y Radio Club Venezolano',
            'slug' => 'red-emergencia-tg734911',
            'category' => 'Operación',
            'status' => 'published',
            'featured' => 0,
            'read_time' => '4 min de lectura',
            'author_name' => 'Arnaldo',
            'author_callsign' => 'YV5ADM',
            'created_at' => '2026-07-18 09:15:00'
        ],
        [
            'id' => 4,
            'title' => 'Actualización RadioID.net: Proceso anual de verificación y preservación de IDs DMR',
            'slug' => 'verificacion-radioid-dmr',
            'category' => 'Comunidad',
            'status' => 'published',
            'featured' => 0,
            'read_time' => '3 min de lectura',
            'author_name' => 'Severino Mastracci',
            'author_callsign' => 'YV5OF',
            'created_at' => '2026-06-25 16:45:00'
        ]
    ];
    send_json(['success' => true, 'posts' => $defaultPosts, 'source' => 'memory']);
}

// POST: Crear Noticia (Requiere estar autenticado)
if ($method === 'POST') {
    $sessionUser = require_role(['admin', 'editor', 'author']);
    $role = $sessionUser['role'];
    $userId = $sessionUser['id'];

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['title']) || empty($input['content'])) {
        send_json(['success' => false, 'error' => 'Título y contenido requeridos'], 400);
    }

    $title = trim($input['title']);
    $slug = preg_replace('/[^a-z0-9\-_]/', '', strtolower((string)($input['slug'] ?? ''))) ?: 'noticia-' . time();
    $description = trim($input['description'] ?? '');
    $content = trim($input['content']);
    $category = trim($input['category'] ?? 'General');
    $tags = trim($input['tags'] ?? '');
    $readTime = trim($input['read_time'] ?? '4 min de lectura');
    $featured = !empty($input['featured']) ? 1 : 0;
    
    // ACL: Los autores solo pueden guardar como borrador o someter a revisión
    $status = trim((string)($input['status'] ?? 'published'));
    if (!in_array($status, ['published', 'draft', 'trash'], true)) {
        $status = 'draft';
    }
    if ($role === 'author' && $status === 'published') {
        $status = 'draft';
    }

    if ($pdo) {
        $stmt = $pdo->prepare("INSERT INTO bm_posts (title, slug, description, content, category, tags, read_time, featured, status, author_id) 
                               VALUES (:title, :slug, :description, :content, :category, :tags, :read_time, :featured, :status, :author_id)");
        $stmt->execute([
            ':title' => $title,
            ':slug' => $slug,
            ':description' => $description,
            ':content' => $content,
            ':category' => $category,
            ':tags' => $tags,
            ':read_time' => $readTime,
            ':featured' => $featured,
            ':status' => $status,
            ':author_id' => $userId
        ]);
        $postId = $pdo->lastInsertId();

        send_json(['success' => true, 'message' => 'Noticia guardada en base de datos bmvenezuela', 'id' => $postId]);
    }

    send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
}

// DELETE: Eliminar Noticia (Solo admin o editor)
if ($method === 'DELETE') {
    require_role(['admin', 'editor']);

    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        send_json(['success' => false, 'error' => 'Noticia no válida'], 400);
    }
    if (!$pdo) {
        send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
    }

    $stmt = $pdo->prepare("DELETE FROM bm_posts WHERE id = :id");
    $stmt->execute([':id' => $id]);
    if ($stmt->rowCount() === 0) {
        send_json(['success' => false, 'error' => 'Noticia no encontrada'], 404);
    }
    send_json(['success' => true, 'message' => 'Noticia eliminada']);
}

send_json(['success' => false, 'error' => 'Método no permitido'], 405);
