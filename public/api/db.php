<?php
/**
 * Conector Singleton PDO para MySQL `bmvenezuela`
 */

function get_db_connection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $dsn = sprintf(
        "mysql:host=%s;port=%s;dbname=%s;charset=%s",
        $config['host'],
        $config['port'],
        $config['dbname'],
        $config['charset']
    );

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

function send_json($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Inicia la sesión PHP con cookies endurecidas (HttpOnly, SameSite=Lax, Secure en HTTPS).
 */
function start_secure_session() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_name('BMYVSESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/**
 * Devuelve el usuario autenticado de la sesión o null.
 */
function current_user() {
    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        return null;
    }
    return [
        'id' => (int)$_SESSION['user_id'],
        'username' => $_SESSION['username'] ?? '',
        'callsign' => $_SESSION['callsign'] ?? '',
        'full_name' => $_SESSION['full_name'] ?? '',
        'role' => $_SESSION['role'],
    ];
}

/**
 * Exige una sesión válida con alguno de los roles indicados.
 * Responde 401 sin sesión y 403 si el rol no está permitido.
 */
function require_role(array $roles) {
    $user = current_user();
    if ($user === null) {
        send_json(['success' => false, 'error' => 'Debes iniciar sesión para realizar esta acción'], 401);
    }
    if (!in_array($user['role'], $roles, true)) {
        send_json(['success' => false, 'error' => 'Permiso denegado para tu rol'], 403);
    }
    return $user;
}

// Nunca exponer trazas ni detalles de SQL al cliente: se registran en el log del servidor
ini_set('display_errors', '0');
set_exception_handler(function ($e) {
    error_log('[BM-YV API] ' . get_class($e) . ': ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
    send_json(['success' => false, 'error' => 'Error interno del servidor'], 500);
});

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    send_json(['status' => 'ok']);
}
