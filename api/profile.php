<?php
/**
 * Perfil del usuario autenticado (cualquier rol).
 *
 * GET                               datos de la cuenta
 * POST {action: update}             nombre y correo
 * POST {action: password}           cambiar contraseña (pide la actual)
 */

require_once __DIR__ . '/accounts.php';

start_secure_session();

$user = require_role(BM_ROLES);
$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT UNIX_TIMESTAMP(created_at) AS created_ts, UNIX_TIMESTAMP(last_login_at) AS last_login_ts FROM bm_users WHERE id = :id");
    $stmt->execute([':id' => $user['id']]);
    send_json(['success' => true, 'user' => bm_user_payload($user) + $stmt->fetch()]);
}

if ($method !== 'POST') {
    send_json(['success' => false, 'error' => 'Método no permitido'], 405);
}

$input = json_input();
$action = (string)($input['action'] ?? '');

if ($action === 'update') {
    $fullName = trim((string)($input['full_name'] ?? ''));
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $errors = [];

    if (mb_strlen($fullName) < 2 || mb_strlen($fullName) > 120) {
        $errors['full_name'] = 'Ingresa tu nombre (2 a 120 caracteres).';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 120) {
        $errors['email'] = 'Correo electrónico no válido.';
    } else {
        $stmt = $pdo->prepare("SELECT id FROM bm_users WHERE email = :e AND id <> :id LIMIT 1");
        $stmt->execute([':e' => $email, ':id' => $user['id']]);
        if ($stmt->fetch()) {
            $errors['email'] = 'Ese correo ya está registrado en otra cuenta.';
        }
    }
    if ($errors) {
        send_json(['success' => false, 'error' => 'Revisa los campos marcados.', 'validation_errors' => $errors], 422);
    }

    $pdo->prepare("UPDATE bm_users SET full_name = :n, email = :e WHERE id = :id")
        ->execute([':n' => $fullName, ':e' => $email, ':id' => $user['id']]);
    log_activity($user['id'], 'profile_updated');
    send_json(['success' => true, 'message' => 'Perfil actualizado.', 'user' => bm_user_payload(['full_name' => $fullName, 'email' => $email] + $user)]);
}

if ($action === 'password') {
    $current = (string)($input['current_password'] ?? '');
    $new = (string)($input['new_password'] ?? '');

    $stmt = $pdo->prepare("SELECT password_hash FROM bm_users WHERE id = :id");
    $stmt->execute([':id' => $user['id']]);
    $hash = (string)$stmt->fetchColumn();

    if (!password_verify($current, $hash)) {
        usleep(400000);
        send_json(['success' => false, 'error' => 'La contraseña actual no es correcta.', 'validation_errors' => ['current_password' => 'No coincide.']], 422);
    }
    if ($problem = bm_password_problem($new)) {
        send_json(['success' => false, 'error' => $problem, 'validation_errors' => ['new_password' => $problem]], 422);
    }

    $newHash = password_hash($new, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE bm_users SET password_hash = :h WHERE id = :id")->execute([':h' => $newHash, ':id' => $user['id']]);
    // Esta sesión sigue abierta; las de otros dispositivos caducan (cambia la huella)
    $_SESSION['pw_fp'] = password_fingerprint($newHash);
    session_regenerate_id(true);
    log_activity($user['id'], 'password_changed');
    send_json(['success' => true, 'message' => 'Contraseña actualizada. Se cerraron las sesiones en otros dispositivos.']);
}

send_json(['success' => false, 'error' => 'Acción no válida'], 400);
