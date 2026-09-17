<?php
/**
 * Conector Singleton PDO para MySQL `bmvenezuela`
 */

require_once __DIR__ . '/env.php';

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

/**
 * CORS solo para el propio sitio y sus subdominios: la web y el panel se sirven desde el mismo
 * dominio, así que ninguna página ajena necesita leer estas respuestas.
 */
function bm_cors_headers() {
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') {
        return;
    }
    header('Vary: Origin');

    $host = strtolower((string)parse_url($origin, PHP_URL_HOST));
    $siteHost = strtolower((string)(parse_url((string)getenv('SITE_URL'), PHP_URL_HOST) ?: ($_SERVER['HTTP_HOST'] ?? '')));
    $base = preg_replace(['/:\d+$/', '/^www\./'], '', $siteHost);
    if ($host === '' || $base === '') {
        return;
    }
    if ($host !== $base && substr($host, -strlen(".$base")) !== ".$base") {
        return;
    }

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
}

function send_json($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    bm_cors_headers();
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
    static $cached = false;
    if ($cached !== false) {
        return $cached;
    }
    if (empty($_SESSION['user_id'])) {
        return $cached = null;
    }

    // Se valida contra la BD en cada petición: un usuario desactivado, borrado, con otro rol
    // o que cambió su contraseña pierde (o actualiza) la sesión al instante
    $pdo = get_db_connection();
    if (!$pdo) {
        return $cached = null;
    }
    $stmt = $pdo->prepare("SELECT id, username, callsign, full_name, email, role, status, password_hash FROM bm_users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => (int)$_SESSION['user_id']]);
    $row = $stmt->fetch();

    if (!$row || $row['status'] !== 'active' || !hash_equals($_SESSION['pw_fp'] ?? '', password_fingerprint($row['password_hash']))) {
        $_SESSION = [];
        return $cached = null;
    }

    return $cached = [
        'id' => (int)$row['id'],
        'username' => $row['username'],
        'callsign' => $row['callsign'],
        'full_name' => $row['full_name'],
        'email' => $row['email'],
        'role' => $row['role'],
    ];
}

/** Huella corta del hash de contraseña: si la contraseña cambia, las demás sesiones caducan */
function password_fingerprint($passwordHash) {
    return substr(hash('sha256', 'bmyv-session|' . $passwordHash), 0, 32);
}

/** Guarda en la sesión al usuario recién autenticado */
function login_session(array $userRow) {
    session_regenerate_id(true);
    unset($_SESSION['login_attempts']);
    $_SESSION['user_id'] = (int)$userRow['id'];
    $_SESSION['pw_fp'] = password_fingerprint($userRow['password_hash']);
}

/** Registra una acción en bm_activity_logs (nunca interrumpe la petición si falla) */
function log_activity($userId, $action, $details = '') {
    $pdo = get_db_connection();
    if (!$pdo) return;
    try {
        $stmt = $pdo->prepare("INSERT INTO bm_activity_logs (user_id, action, details, ip_address) VALUES (:u, :a, :d, :ip)");
        $stmt->execute([
            ':u' => $userId ?: null,
            ':a' => substr((string)$action, 0, 80),
            ':d' => is_string($details) ? $details : json_encode($details, JSON_UNESCAPED_UNICODE),
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    } catch (Exception $e) {
        error_log('[BM-YV] log_activity: ' . $e->getMessage());
    }
}

/** Lee el cuerpo JSON de la petición como array */
function json_input() {
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
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
