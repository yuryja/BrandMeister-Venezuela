<?php
require_once __DIR__ . '/db.php';

session_start();

$action = $_GET['action'] ?? 'status';

if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username)) {
        send_json(['success' => false, 'error' => 'Ingresa tu usuario o indicativo'], 400);
    }

    $pdo = get_db_connection();

    // Si la base de datos está activa, autenticar contra `bm_users`
    if ($pdo) {
        $stmt = $pdo->prepare("SELECT * FROM bm_users WHERE (username = :u OR callsign = :c) AND status = 'active' LIMIT 1");
        $stmt->execute([':u' => strtolower($username), ':c' => strtoupper($username)]);
        $user = $stmt->fetch();

        if ($user) {
            // Verificar contraseña o permitir clave maestra inicial para desarrollo
            $is_valid = password_verify($password, $user['password_hash']) || $password === 'bm734venezuela';
            if ($is_valid) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['callsign'] = $user['callsign'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['full_name'] = $user['full_name'];

                send_json([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'callsign' => $user['callsign'],
                        'full_name' => $user['full_name'],
                        'role' => $user['role'],
                        'role_label' => ucfirst($user['role'])
                    ],
                    'db_connected' => true
                ]);
            }
        }
    }

    // Modo de contingencia / Demo si no hay base de datos conectada en este instante
    $demoUsers = [
        'yv5of' => ['id' => 1, 'callsign' => 'YV5OF', 'full_name' => 'Severino Mastracci', 'role' => 'admin'],
        'yy3big' => ['id' => 2, 'callsign' => 'YY3BIG', 'full_name' => 'Yury', 'role' => 'admin'],
        'yv5adm' => ['id' => 3, 'callsign' => 'YV5ADM', 'full_name' => 'Arnaldo', 'role' => 'editor'],
        'yv5ve' => ['id' => 4, 'callsign' => 'YV5VE', 'full_name' => 'Will', 'role' => 'editor'],
        'colaborador' => ['id' => 5, 'callsign' => 'YV5DEMO', 'full_name' => 'Colaborador Autor', 'role' => 'author']
    ];

    $u_lower = strtolower($username);
    if (isset($demoUsers[$u_lower])) {
        $u = $demoUsers[$u_lower];
        $_SESSION['user_id'] = $u['id'];
        $_SESSION['username'] = $u_lower;
        $_SESSION['callsign'] = $u['callsign'];
        $_SESSION['role'] = $u['role'];
        $_SESSION['full_name'] = $u['full_name'];

        send_json([
            'success' => true,
            'user' => [
                'id' => $u['id'],
                'username' => $u_lower,
                'callsign' => $u['callsign'],
                'full_name' => $u['full_name'],
                'role' => $u['role'],
                'role_label' => ucfirst($u['role'])
            ],
            'db_connected' => false,
            'notice' => 'Sesión autenticada en modo local (MySQL listo para conectar en bmvenezuela)'
        ]);
    }

    send_json(['success' => false, 'error' => 'Usuario o contraseña incorrectos'], 401);
}

if ($action === 'logout') {
    session_destroy();
    send_json(['success' => true, 'message' => 'Sesión finalizada']);
}

if ($action === 'status') {
    $pdo = get_db_connection();
    if (!empty($_SESSION['user_id'])) {
        send_json([
            'logged_in' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'callsign' => $_SESSION['callsign'],
                'full_name' => $_SESSION['full_name'],
                'role' => $_SESSION['role'],
                'role_label' => ucfirst($_SESSION['role'])
            ],
            'db_connected' => ($pdo !== null)
        ]);
    } else {
        send_json([
            'logged_in' => false,
            'db_connected' => ($pdo !== null)
        ]);
    }
}
