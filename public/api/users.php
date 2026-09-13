<?php
require_once __DIR__ . '/db.php';

session_start();

$role = $_SESSION['role'] ?? 'admin';
$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db_connection();

// ACL: Solo administradores pueden ver y gestionar usuarios
if ($role !== 'admin') {
    send_json(['success' => false, 'error' => 'Acceso denegado: se requiere rol de Administrador'], 403);
}

if ($method === 'GET') {
    if ($pdo) {
        $stmt = $pdo->query("SELECT id, username, callsign, full_name, email, role, status, created_at FROM bm_users ORDER BY id ASC");
        $users = $stmt->fetchAll();
        send_json(['success' => true, 'users' => $users, 'source' => 'mysql']);
    }

    $defaultUsers = [
        ['id' => 1, 'username' => 'yv5of', 'callsign' => 'YV5OF', 'full_name' => 'Severino Mastracci', 'email' => 'yv5of@brandmeisteryv.net', 'role' => 'admin', 'status' => 'active'],
        ['id' => 2, 'username' => 'yy3big', 'callsign' => 'YY3BIG', 'full_name' => 'Yury', 'email' => 'yy3big@brandmeisteryv.net', 'role' => 'admin', 'status' => 'active'],
        ['id' => 3, 'username' => 'yv5adm', 'callsign' => 'YV5ADM', 'full_name' => 'Arnaldo', 'email' => 'yv5adm@brandmeisteryv.net', 'role' => 'editor', 'status' => 'active'],
        ['id' => 4, 'username' => 'yv5ve', 'callsign' => 'YV5VE', 'full_name' => 'Will', 'email' => 'yv5ve@brandmeisteryv.net', 'role' => 'editor', 'status' => 'active'],
        ['id' => 5, 'username' => 'autor_demo', 'callsign' => 'YV5DEMO', 'full_name' => 'Colaborador Radioaficionado', 'email' => 'colaborador@brandmeisteryv.net', 'role' => 'author', 'status' => 'active']
    ];
    send_json(['success' => true, 'users' => $defaultUsers, 'source' => 'memory']);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? 'update_role';

    if ($action === 'update_role') {
        $userId = (int)($input['user_id'] ?? 0);
        $newRole = trim($input['role'] ?? '');

        if (!in_array($newRole, ['admin', 'editor', 'author'])) {
            send_json(['success' => false, 'error' => 'Rol no válido'], 400);
        }

        if ($pdo && $userId > 0) {
            $stmt = $pdo->prepare("UPDATE bm_users SET role = :r WHERE id = :id");
            $stmt->execute([':r' => $newRole, ':id' => $userId]);
        }

        send_json(['success' => true, 'message' => 'Rol de usuario actualizado correctamente', 'user_id' => $userId, 'role' => $newRole]);
    }
}
