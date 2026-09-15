<?php
require_once __DIR__ . '/db.php';

start_secure_session();

// ACL: Solo administradores pueden ver y gestionar usuarios
$currentUser = require_role(['admin']);

$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db_connection();

if (!$pdo) {
    send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
}

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, username, callsign, full_name, email, role, status, created_at FROM bm_users ORDER BY id ASC");
    send_json(['success' => true, 'users' => $stmt->fetchAll(), 'source' => 'mysql']);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? 'update_role';

    if ($action === 'update_role') {
        $userId = (int)($input['user_id'] ?? 0);
        $newRole = trim((string)($input['role'] ?? ''));

        if (!in_array($newRole, ['admin', 'editor', 'author'], true)) {
            send_json(['success' => false, 'error' => 'Rol no válido'], 400);
        }
        if ($userId <= 0) {
            send_json(['success' => false, 'error' => 'Usuario no válido'], 400);
        }
        if ($userId === $currentUser['id'] && $newRole !== 'admin') {
            send_json(['success' => false, 'error' => 'No puedes quitarte a ti mismo el rol de Administrador'], 400);
        }

        $stmt = $pdo->prepare("UPDATE bm_users SET role = :r WHERE id = :id");
        $stmt->execute([':r' => $newRole, ':id' => $userId]);

        if ($stmt->rowCount() === 0) {
            send_json(['success' => false, 'error' => 'Usuario no encontrado o sin cambios'], 404);
        }

        send_json(['success' => true, 'message' => 'Rol de usuario actualizado correctamente', 'user_id' => $userId, 'role' => $newRole]);
    }

    send_json(['success' => false, 'error' => 'Acción no válida'], 400);
}

send_json(['success' => false, 'error' => 'Método no permitido'], 405);
