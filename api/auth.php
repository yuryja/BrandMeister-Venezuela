<?php
require_once __DIR__ . '/db.php';

start_secure_session();

$action = $_GET['action'] ?? 'status';

function user_payload(array $user) {
    return [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'callsign' => $user['callsign'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
        'role_label' => ucfirst($user['role'])
    ];
}

if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        send_json(['success' => false, 'error' => 'Método no permitido'], 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim((string)($input['username'] ?? ''));
    $password = (string)($input['password'] ?? '');

    if ($username === '' || $password === '') {
        send_json(['success' => false, 'error' => 'Ingresa tu usuario o indicativo y tu contraseña'], 400);
    }

    // Freno básico contra fuerza bruta: máximo 5 intentos fallidos por sesión cada 15 minutos
    $attempts = $_SESSION['login_attempts'] ?? ['count' => 0, 'since' => time()];
    if (time() - $attempts['since'] > 900) {
        $attempts = ['count' => 0, 'since' => time()];
    }
    if ($attempts['count'] >= 5) {
        send_json(['success' => false, 'error' => 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.'], 429);
    }

    $pdo = get_db_connection();
    if (!$pdo) {
        send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
    }

    $stmt = $pdo->prepare("SELECT * FROM bm_users WHERE (username = :u OR callsign = :c) AND status = 'active' LIMIT 1");
    $stmt->execute([':u' => strtolower($username), ':c' => strtoupper($username)]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        session_regenerate_id(true);
        unset($_SESSION['login_attempts']);
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['callsign'] = $user['callsign'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];

        send_json([
            'success' => true,
            'user' => user_payload($user),
            'db_connected' => true
        ]);
    }

    $attempts['count']++;
    $_SESSION['login_attempts'] = $attempts;
    usleep(400000);
    send_json(['success' => false, 'error' => 'Usuario o contraseña incorrectos'], 401);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $p['path'],
            'secure' => $p['secure'],
            'httponly' => $p['httponly'],
            'samesite' => $p['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
    send_json(['success' => true, 'message' => 'Sesión finalizada']);
}

if ($action === 'status') {
    $pdo = get_db_connection();
    $user = current_user();
    if ($user !== null) {
        send_json([
            'logged_in' => true,
            'user' => user_payload($user),
            'db_connected' => ($pdo !== null)
        ]);
    }
    send_json([
        'logged_in' => false,
        'db_connected' => ($pdo !== null)
    ]);
}

send_json(['success' => false, 'error' => 'Acción no válida'], 400);
