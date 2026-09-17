<?php
require_once __DIR__ . '/accounts.php';
require_once __DIR__ . '/recaptcha.php';

/** reCAPTCHA v3 para login y restablecimiento: corta la petición si Google no la da por humana */
function auth_require_recaptcha(array $input, $action) {
    $check = bm_verify_recaptcha((string)($input['recaptcha_token'] ?? ''), $action);
    if (!$check['ok']) {
        error_log("[BM-YV] $action rechazado por reCAPTCHA: " . ($check['reason'] ?? '') . (isset($check['score']) ? ' score=' . $check['score'] : ''));
        log_activity(null, 'recaptcha_blocked', ['action' => $action, 'reason' => $check['reason'] ?? '']);
        send_json(['success' => false, 'error' => 'No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.'], 400);
    }
}

start_secure_session();

$action = $_GET['action'] ?? 'status';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'login') {
    if ($method !== 'POST') {
        send_json(['success' => false, 'error' => 'Método no permitido'], 405);
    }

    $input = json_input();
    $username = trim((string)($input['username'] ?? ''));
    $password = (string)($input['password'] ?? '');

    if ($username === '' || $password === '') {
        send_json(['success' => false, 'error' => 'Ingresa tu usuario o indicativo y tu contraseña'], 400);
    }
    auth_require_recaptcha($input, 'login');

    // Freno contra fuerza bruta: 5 fallos por sesión y 20 por IP cada 15 minutos
    $attempts = $_SESSION['login_attempts'] ?? ['count' => 0, 'since' => time()];
    if (time() - $attempts['since'] > 900) {
        $attempts = ['count' => 0, 'since' => time()];
    }
    if ($attempts['count'] >= 5 || bm_recent_attempts_from_ip('login_failed', 900) >= 20) {
        send_json(['success' => false, 'error' => 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.'], 429);
    }

    $pdo = get_db_connection();
    if (!$pdo) {
        send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
    }

    $stmt = $pdo->prepare("SELECT * FROM bm_users WHERE (username = :u OR callsign = :c OR email = :e) AND status = 'active' LIMIT 1");
    $stmt->execute([':u' => strtolower($username), ':c' => strtoupper($username), ':e' => strtolower($username)]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $user['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE bm_users SET password_hash = :h WHERE id = :id")->execute([':h' => $user['password_hash'], ':id' => $user['id']]);
        }
        login_session($user);
        try {
            $pdo->prepare("UPDATE bm_users SET last_login_at = NOW() WHERE id = :id")->execute([':id' => $user['id']]);
        } catch (PDOException $e) {
            // Sin la migración 001 la columna no existe: el inicio de sesión no debe fallar por eso
            error_log('[BM-YV] last_login_at: ' . $e->getMessage());
        }
        log_activity($user['id'], 'login');

        send_json(['success' => true, 'user' => bm_user_payload($user), 'db_connected' => true]);
    }

    $attempts['count']++;
    $_SESSION['login_attempts'] = $attempts;
    log_activity($user['id'] ?? null, 'login_failed', mb_substr($username, 0, 60));
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
    $user = current_user();
    $pdo = get_db_connection();
    if ($user !== null) {
        send_json(['logged_in' => true, 'user' => bm_user_payload($user), 'db_connected' => true]);
    }
    send_json(['logged_in' => false, 'db_connected' => ($pdo !== null)]);
}

// "¿Olvidaste tu contraseña?": siempre responde lo mismo para no revelar qué cuentas existen
if ($action === 'forgot') {
    if ($method !== 'POST') {
        send_json(['success' => false, 'error' => 'Método no permitido'], 405);
    }
    $input = json_input();
    $identifier = trim((string)($input['identifier'] ?? ''));
    $generic = ['success' => true, 'message' => 'Si la cuenta existe y está activa, enviamos un enlace para restablecer la contraseña a su correo.'];

    if ($identifier === '' || mb_strlen($identifier) > 120) {
        send_json(['success' => false, 'error' => 'Ingresa tu usuario, indicativo o correo'], 400);
    }
    auth_require_recaptcha($input, 'forgot');
    if (bm_recent_attempts_from_ip('password_reset_requested', 3600) >= 5) {
        send_json(['success' => false, 'error' => 'Demasiadas solicitudes. Inténtalo más tarde.'], 429);
    }

    $pdo = get_db_connection();
    if (!$pdo) {
        send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
    }

    $stmt = $pdo->prepare("SELECT * FROM bm_users WHERE (username = :u OR callsign = :c OR email = :e) AND status = 'active' LIMIT 1");
    $stmt->execute([':u' => strtolower($identifier), ':c' => strtoupper($identifier), ':e' => strtolower($identifier)]);
    $user = $stmt->fetch();

    log_activity($user['id'] ?? null, 'password_reset_requested', mb_substr($identifier, 0, 60));
    if ($user) {
        $sent = bm_send_reset($user);
        if (!$sent['ok']) {
            error_log('[BM-YV] No se pudo enviar el correo de restablecimiento a ' . $user['email']);
        }
    }
    send_json($generic);
}

// Validar un enlace de invitación / restablecimiento antes de mostrar el formulario
if ($action === 'token') {
    $row = bm_find_token((string)($_GET['token'] ?? ''));
    if (!$row || $row['status'] !== 'active') {
        send_json(['success' => false, 'error' => 'El enlace no es válido o ya venció. Solicita uno nuevo.'], 404);
    }
    send_json([
        'success' => true,
        'type' => $row['type'],
        'user' => ['username' => $row['username'], 'callsign' => $row['callsign'], 'full_name' => $row['full_name']],
    ]);
}

// Crear / restablecer contraseña con un token de un solo uso
if ($action === 'set_password') {
    if ($method !== 'POST') {
        send_json(['success' => false, 'error' => 'Método no permitido'], 405);
    }
    $input = json_input();
    $row = bm_find_token((string)($input['token'] ?? ''));
    if (!$row || $row['status'] !== 'active') {
        send_json(['success' => false, 'error' => 'El enlace no es válido o ya venció. Solicita uno nuevo.'], 404);
    }
    $password = (string)($input['password'] ?? '');
    if ($problem = bm_password_problem($password)) {
        send_json(['success' => false, 'error' => $problem], 422);
    }

    $pdo = get_db_connection();
    $pdo->beginTransaction();
    $claim = $pdo->prepare("UPDATE bm_user_tokens SET used_at = NOW() WHERE id = :id AND used_at IS NULL");
    $claim->execute([':id' => $row['token_id']]);
    if ($claim->rowCount() !== 1) {
        $pdo->rollBack();
        send_json(['success' => false, 'error' => 'El enlace ya fue utilizado.'], 409);
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE bm_users SET password_hash = :h WHERE id = :id")->execute([':h' => $hash, ':id' => $row['id']]);
    // Cualquier otro enlace pendiente de la cuenta deja de servir
    $pdo->prepare("UPDATE bm_user_tokens SET used_at = NOW() WHERE user_id = :u AND used_at IS NULL")->execute([':u' => $row['id']]);
    $pdo->commit();

    log_activity($row['id'], $row['type'] === 'invite' ? 'invite_accepted' : 'password_reset');
    send_json(['success' => true, 'message' => 'Contraseña guardada. Ya puedes iniciar sesión.', 'username' => $row['username']]);
}

send_json(['success' => false, 'error' => 'Acción no válida'], 400);
