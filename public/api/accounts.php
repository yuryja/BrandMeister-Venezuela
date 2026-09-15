<?php
/**
 * Cuentas del Backoffice: tokens de invitación / restablecimiento, política de contraseñas
 * y correos de cuenta. Solo se incluye desde otros endpoints (bloqueado en .htaccess).
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

const BM_ROLES = ['admin', 'editor', 'author'];
const BM_ROLE_LABELS = ['admin' => 'Administrador', 'editor' => 'Editor', 'author' => 'Autor'];
const BM_PASSWORD_MIN = 10;
// Vigencia de los enlaces: invitación 7 días, restablecimiento 1 hora
const BM_TOKEN_TTL = ['invite' => 604800, 'reset' => 3600];

/** URL pública del sitio para construir enlaces en los correos */
function bm_site_url() {
    $configured = rtrim(trim((string)getenv('SITE_URL')), '/');
    if ($configured !== '') {
        return $configured;
    }
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = preg_replace('/[^a-z0-9.:-]/i', '', $_SERVER['HTTP_HOST'] ?? '') ?: 'brandmeisteryv.net';
    return ($isHttps ? 'https' : 'http') . '://' . $host;
}

/** Devuelve un mensaje de error si la contraseña no cumple la política, o null */
function bm_password_problem($password) {
    if (!is_string($password) || strlen($password) < BM_PASSWORD_MIN) {
        return 'La contraseña debe tener al menos ' . BM_PASSWORD_MIN . ' caracteres.';
    }
    if (strlen($password) > 200) {
        return 'La contraseña es demasiado larga.';
    }
    return null;
}

/**
 * Crea un token de un solo uso para el usuario y devuelve el valor en claro (solo viaja en el correo).
 * En la BD se guarda únicamente su SHA-256. Invalida los tokens anteriores del mismo tipo.
 */
function bm_create_token($userId, $type) {
    $pdo = get_db_connection();
    $pdo->prepare("UPDATE bm_user_tokens SET used_at = NOW() WHERE user_id = :u AND type = :t AND used_at IS NULL")
        ->execute([':u' => $userId, ':t' => $type]);

    $token = bin2hex(random_bytes(32));
    $pdo->prepare("INSERT INTO bm_user_tokens (user_id, type, token_hash, expires_at) VALUES (:u, :t, :h, DATE_ADD(NOW(), INTERVAL :ttl SECOND))")
        ->execute([':u' => $userId, ':t' => $type, ':h' => hash('sha256', $token), ':ttl' => BM_TOKEN_TTL[$type]]);
    return $token;
}

/** Busca un token vigente y no usado. Devuelve la fila del token + datos del usuario, o null */
function bm_find_token($token) {
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("SELECT t.id AS token_id, t.type, u.id, u.username, u.callsign, u.full_name, u.email, u.status
        FROM bm_user_tokens t JOIN bm_users u ON u.id = t.user_id
        WHERE t.token_hash = :h AND t.used_at IS NULL AND t.expires_at > NOW() LIMIT 1");
    $stmt->execute([':h' => hash('sha256', $token)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function bm_account_link($token) {
    return bm_site_url() . '/admin/?clave=' . $token;
}

/** Correo de invitación para que el nuevo usuario cree su contraseña */
function bm_send_invite(array $user, array $invitedBy) {
    $token = bm_create_token((int)$user['id'], 'invite');
    $link = bm_account_link($token);
    $e = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); };
    $role = BM_ROLE_LABELS[$user['role']] ?? $user['role'];

    $html = bm_mail_layout(
        'Te damos la bienvenida al Backoffice',
        '<p>Hola ' . $e($user['full_name']) . ' (' . $e($user['callsign']) . '),</p>'
        . '<p>' . $e($invitedBy['full_name']) . ' (' . $e($invitedBy['callsign']) . ') te ha dado acceso al Backoffice de BrandMeister Venezuela con el rol de <strong>' . $e($role) . '</strong>.</p>'
        . '<p>Tu usuario es <strong>' . $e($user['username']) . '</strong> (también puedes entrar con tu indicativo). Crea tu contraseña con el siguiente botón; el enlace vence en 7 días.</p>',
        ['label' => 'Crear mi contraseña', 'url' => $link]
    );
    $text = "Hola {$user['full_name']} ({$user['callsign']}),\n\n"
        . "{$invitedBy['full_name']} ({$invitedBy['callsign']}) te ha dado acceso al Backoffice de BrandMeister Venezuela con el rol de $role.\n\n"
        . "Usuario: {$user['username']}\n"
        . "Crea tu contraseña (el enlace vence en 7 días):\n$link\n";

    return bm_send_mail($user['email'], 'Tu acceso al Backoffice de BrandMeister Venezuela', $html, $text, [
        'reply_to' => $invitedBy['email'] ?? '',
        'reply_to_name' => $invitedBy['full_name'] ?? '',
    ]);
}

/** Correo de restablecimiento de contraseña */
function bm_send_reset(array $user) {
    $token = bm_create_token((int)$user['id'], 'reset');
    $link = bm_account_link($token);
    $e = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); };

    $html = bm_mail_layout(
        'Restablece tu contraseña',
        '<p>Hola ' . $e($user['full_name']) . ',</p>'
        . '<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>' . $e($user['username']) . '</strong>. El enlace vence en 1 hora y solo puede usarse una vez.</p>'
        . '<p>Si no fuiste tú, ignora este correo: tu contraseña actual sigue funcionando.</p>',
        ['label' => 'Elegir nueva contraseña', 'url' => $link]
    );
    $text = "Hola {$user['full_name']},\n\n"
        . "Recibimos una solicitud para restablecer la contraseña de tu cuenta {$user['username']}.\n"
        . "Elige una nueva (el enlace vence en 1 hora):\n$link\n\n"
        . "Si no fuiste tú, ignora este correo.\n";

    return bm_send_mail($user['email'], 'Restablecer contraseña · BrandMeister Venezuela', $html, $text);
}

/**
 * Freno por IP usando bm_activity_logs: cuántas veces se registró $action desde esta IP
 * en los últimos $seconds segundos.
 */
function bm_recent_attempts_from_ip($action, $seconds) {
    $pdo = get_db_connection();
    if (!$pdo) return 0;
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM bm_activity_logs WHERE action = :a AND ip_address = :ip AND created_at > DATE_SUB(NOW(), INTERVAL :s SECOND)");
    $stmt->execute([':a' => $action, ':ip' => $_SERVER['REMOTE_ADDR'] ?? '', ':s' => (int)$seconds]);
    return (int)$stmt->fetchColumn();
}

/** Datos públicos de un usuario para la API (nunca el hash) */
function bm_user_payload(array $user) {
    return [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'callsign' => $user['callsign'],
        'full_name' => $user['full_name'],
        'email' => $user['email'] ?? '',
        'role' => $user['role'],
        'role_label' => BM_ROLE_LABELS[$user['role']] ?? ucfirst($user['role']),
    ];
}
