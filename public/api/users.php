<?php
/**
 * Gestión de usuarios del panel (solo administradores).
 *
 * GET                      listado con recuento de noticias, último acceso e invitación pendiente
 * POST {action: create}    crear usuario (opcionalmente enviar invitación por correo)
 * POST {action: update}    editar datos, rol y estado
 * POST {action: delete}    eliminar reasignando sus noticias
 * POST {action: invite}    reenviar invitación / enviar enlace para restablecer contraseña
 * POST {action: email}     enviar un correo a uno o varios usuarios
 * POST {action: bulk}      activar / desactivar / cambiar rol en lote
 */

require_once __DIR__ . '/accounts.php';

start_secure_session();

$currentUser = require_role(['admin']);
$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db_connection();

if (!$pdo) {
    send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
}

function find_user(PDO $pdo, $id) {
    $stmt = $pdo->prepare("SELECT * FROM bm_users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => (int)$id]);
    return $stmt->fetch() ?: null;
}

/** ¿Quedaría al menos un administrador activo si se aplica el cambio a $userIds? */
function keeps_an_active_admin(PDO $pdo, array $userIds) {
    if (empty($userIds)) return true;
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM bm_users WHERE role = 'admin' AND status = 'active' AND id NOT IN ($placeholders)");
    $stmt->execute(array_map('intval', $userIds));
    return (int)$stmt->fetchColumn() > 0;
}

/** Valida y normaliza los campos editables. Devuelve [datos, errores] */
function validate_user_fields(PDO $pdo, array $input, $existingId = null) {
    $data = [
        'username' => strtolower(trim((string)($input['username'] ?? ''))),
        'callsign' => strtoupper(trim((string)($input['callsign'] ?? ''))),
        'full_name' => trim((string)($input['full_name'] ?? '')),
        'email' => strtolower(trim((string)($input['email'] ?? ''))),
        'role' => (string)($input['role'] ?? 'author'),
        'status' => (string)($input['status'] ?? 'active'),
    ];
    $errors = [];

    if (!preg_match('/^[a-z0-9_.-]{3,60}$/', $data['username'])) {
        $errors['username'] = 'Usa entre 3 y 60 caracteres: letras minúsculas, números, punto, guion o guion bajo.';
    }
    if (!preg_match('/^[A-Z0-9\/]{3,20}$/', $data['callsign'])) {
        $errors['callsign'] = 'Indicativo no válido (ej. YV5OF).';
    }
    if (mb_strlen($data['full_name']) < 2 || mb_strlen($data['full_name']) > 120) {
        $errors['full_name'] = 'Ingresa el nombre (2 a 120 caracteres).';
    }
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL) || strlen($data['email']) > 120) {
        $errors['email'] = 'Correo electrónico no válido.';
    }
    if (!in_array($data['role'], BM_ROLES, true)) {
        $errors['role'] = 'Rol no válido.';
    }
    if (!in_array($data['status'], ['active', 'inactive'], true)) {
        $errors['status'] = 'Estado no válido.';
    }

    foreach (['username' => 'Ese nombre de usuario ya existe.', 'email' => 'Ese correo ya está registrado.', 'callsign' => 'Ese indicativo ya tiene una cuenta.'] as $field => $message) {
        if (isset($errors[$field])) continue;
        $stmt = $pdo->prepare("SELECT id FROM bm_users WHERE $field = :v AND id <> :id LIMIT 1");
        $stmt->execute([':v' => $data[$field], ':id' => (int)$existingId]);
        if ($stmt->fetch()) {
            $errors[$field] = $message;
        }
    }

    return [$data, $errors];
}

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT u.id, u.username, u.callsign, u.full_name, u.email, u.role, u.status,
            UNIX_TIMESTAMP(u.created_at) AS created_ts, UNIX_TIMESTAMP(u.last_login_at) AS last_login_ts,
            (u.password_hash = '!') AS pending_invite,
            (SELECT COUNT(*) FROM bm_posts p WHERE p.author_id = u.id AND p.status <> 'trash') AS posts_count
        FROM bm_users u ORDER BY u.id ASC");
    $users = array_map(function ($u) {
        $u['id'] = (int)$u['id'];
        $u['posts_count'] = (int)$u['posts_count'];
        // Marcas de tiempo absolutas (segundos epoch): evitan desfases entre la zona horaria de MySQL y la del navegador
        $u['created_ts'] = (int)$u['created_ts'];
        $u['last_login_ts'] = $u['last_login_ts'] !== null ? (int)$u['last_login_ts'] : null;
        $u['pending_invite'] = (bool)$u['pending_invite'];
        $u['role_label'] = BM_ROLE_LABELS[$u['role']] ?? $u['role'];
        return $u;
    }, $stmt->fetchAll());

    send_json(['success' => true, 'users' => $users, 'current_user_id' => $currentUser['id'], 'mail_configured' => trim((string)getenv('SMTP_HOST')) !== '']);
}

if ($method !== 'POST') {
    send_json(['success' => false, 'error' => 'Método no permitido'], 405);
}

$input = json_input();
$action = (string)($input['action'] ?? '');

if ($action === 'create') {
    [$data, $errors] = validate_user_fields($pdo, $input);
    if ($errors) {
        send_json(['success' => false, 'error' => 'Revisa los campos marcados.', 'validation_errors' => $errors], 422);
    }

    $password = (string)($input['password'] ?? '');
    $sendInvite = !empty($input['send_invite']);
    if ($password === '' && !$sendInvite) {
        send_json(['success' => false, 'error' => 'Asigna una contraseña o marca "Enviar invitación por correo".', 'validation_errors' => ['password' => 'Requerida si no se envía invitación.']], 422);
    }
    if ($password !== '' && ($problem = bm_password_problem($password))) {
        send_json(['success' => false, 'error' => $problem, 'validation_errors' => ['password' => $problem]], 422);
    }

    // '!' nunca coincide con password_verify: la cuenta no puede entrar hasta aceptar la invitación
    $hash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : '!';
    $stmt = $pdo->prepare("INSERT INTO bm_users (username, callsign, full_name, email, password_hash, role, status) VALUES (:username, :callsign, :full_name, :email, :hash, :role, :status)");
    $stmt->execute([
        ':username' => $data['username'], ':callsign' => $data['callsign'], ':full_name' => $data['full_name'],
        ':email' => $data['email'], ':hash' => $hash, ':role' => $data['role'], ':status' => $data['status'],
    ]);
    $newUser = find_user($pdo, $pdo->lastInsertId());
    log_activity($currentUser['id'], 'user_created', ['user_id' => $newUser['id'], 'username' => $newUser['username'], 'role' => $newUser['role']]);

    $mail = null;
    if ($sendInvite) {
        $mail = bm_send_invite($newUser, $currentUser);
        log_activity($currentUser['id'], $mail['ok'] ? 'invite_sent' : 'invite_failed', ['user_id' => $newUser['id']]);
    }

    $message = 'Usuario creado.';
    if ($mail !== null) {
        $message .= $mail['ok'] ? ' Se envió la invitación a ' . $newUser['email'] . '.' : ' Pero no se pudo enviar la invitación: revisa la configuración de correo y reenvíala.';
    }
    send_json(['success' => true, 'message' => $message, 'user' => bm_user_payload($newUser), 'mail_sent' => $mail['ok'] ?? null]);
}

if ($action === 'update') {
    $target = find_user($pdo, $input['id'] ?? 0);
    if (!$target) {
        send_json(['success' => false, 'error' => 'Usuario no encontrado'], 404);
    }
    [$data, $errors] = validate_user_fields($pdo, $input + $target, $target['id']);
    if ($errors) {
        send_json(['success' => false, 'error' => 'Revisa los campos marcados.', 'validation_errors' => $errors], 422);
    }

    $isSelf = (int)$target['id'] === $currentUser['id'];
    if ($isSelf && ($data['role'] !== 'admin' || $data['status'] !== 'active')) {
        send_json(['success' => false, 'error' => 'No puedes quitarte el rol de Administrador ni desactivar tu propia cuenta.'], 400);
    }
    $losesAdmin = $target['role'] === 'admin' && $target['status'] === 'active' && ($data['role'] !== 'admin' || $data['status'] !== 'active');
    if ($losesAdmin && !keeps_an_active_admin($pdo, [$target['id']])) {
        send_json(['success' => false, 'error' => 'Debe quedar al menos un Administrador activo.'], 400);
    }

    $password = (string)($input['password'] ?? '');
    if ($password !== '' && ($problem = bm_password_problem($password))) {
        send_json(['success' => false, 'error' => $problem, 'validation_errors' => ['password' => $problem]], 422);
    }

    $sql = "UPDATE bm_users SET username = :username, callsign = :callsign, full_name = :full_name, email = :email, role = :role, status = :status";
    $params = [
        ':username' => $data['username'], ':callsign' => $data['callsign'], ':full_name' => $data['full_name'],
        ':email' => $data['email'], ':role' => $data['role'], ':status' => $data['status'], ':id' => $target['id'],
    ];
    if ($password !== '') {
        $sql .= ", password_hash = :hash";
        $params[':hash'] = password_hash($password, PASSWORD_DEFAULT);
    }
    $pdo->prepare($sql . " WHERE id = :id")->execute($params);

    // Si el admin cambió su propia contraseña, su sesión sigue válida
    if ($isSelf && $password !== '') {
        $_SESSION['pw_fp'] = password_fingerprint($params[':hash']);
    }

    $changes = array_keys(array_filter($data, function ($v, $k) use ($target) { return (string)$target[$k] !== (string)$v; }, ARRAY_FILTER_USE_BOTH));
    if ($password !== '') $changes[] = 'password';
    log_activity($currentUser['id'], 'user_updated', ['user_id' => (int)$target['id'], 'changes' => $changes]);

    send_json(['success' => true, 'message' => 'Usuario actualizado.', 'user' => bm_user_payload(find_user($pdo, $target['id']))]);
}

if ($action === 'delete') {
    $target = find_user($pdo, $input['id'] ?? 0);
    if (!$target) {
        send_json(['success' => false, 'error' => 'Usuario no encontrado'], 404);
    }
    if ((int)$target['id'] === $currentUser['id']) {
        send_json(['success' => false, 'error' => 'No puedes eliminar tu propia cuenta.'], 400);
    }
    if ($target['role'] === 'admin' && $target['status'] === 'active' && !keeps_an_active_admin($pdo, [$target['id']])) {
        send_json(['success' => false, 'error' => 'Debe quedar al menos un Administrador activo.'], 400);
    }

    // bm_posts tiene ON DELETE CASCADE: sin reasignar, borrar al usuario borraría sus noticias
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM bm_posts WHERE author_id = :id");
    $countStmt->execute([':id' => $target['id']]);
    $postsCount = (int)$countStmt->fetchColumn();

    $reassignTo = (int)($input['reassign_to'] ?? 0);
    if ($postsCount > 0) {
        $heir = $reassignTo ? find_user($pdo, $reassignTo) : null;
        if (!$heir || (int)$heir['id'] === (int)$target['id']) {
            send_json(['success' => false, 'error' => "Este usuario tiene $postsCount noticia(s). Elige a quién asignarlas antes de eliminarlo.", 'posts_count' => $postsCount], 422);
        }
    }

    $pdo->beginTransaction();
    if ($postsCount > 0) {
        $pdo->prepare("UPDATE bm_posts SET author_id = :heir WHERE author_id = :id")->execute([':heir' => $reassignTo, ':id' => $target['id']]);
    }
    $pdo->prepare("DELETE FROM bm_users WHERE id = :id")->execute([':id' => $target['id']]);
    $pdo->commit();

    log_activity($currentUser['id'], 'user_deleted', ['user_id' => (int)$target['id'], 'username' => $target['username'], 'posts_reassigned_to' => $postsCount ? $reassignTo : null]);
    send_json(['success' => true, 'message' => 'Usuario eliminado' . ($postsCount ? " y $postsCount noticia(s) reasignada(s)." : '.')]);
}

if ($action === 'invite') {
    $target = find_user($pdo, $input['id'] ?? 0);
    if (!$target) {
        send_json(['success' => false, 'error' => 'Usuario no encontrado'], 404);
    }
    if ($target['status'] !== 'active') {
        send_json(['success' => false, 'error' => 'Activa la cuenta antes de enviarle un enlace de acceso.'], 400);
    }

    // Sin contraseña todavía: invitación. Con contraseña: enlace de restablecimiento
    $isInvite = $target['password_hash'] === '!';
    $mail = $isInvite ? bm_send_invite($target, $currentUser) : bm_send_reset($target);
    log_activity($currentUser['id'], ($isInvite ? 'invite' : 'reset_link') . ($mail['ok'] ? '_sent' : '_failed'), ['user_id' => (int)$target['id']]);

    if (!$mail['ok']) {
        send_json(['success' => false, 'error' => 'No se pudo enviar el correo. Revisa la configuración SMTP en ~/bmyv-config.php.'], 502);
    }
    send_json(['success' => true, 'message' => ($isInvite ? 'Invitación reenviada' : 'Enlace para restablecer contraseña enviado') . ' a ' . $target['email'] . '.']);
}

if ($action === 'email') {
    $ids = array_values(array_unique(array_filter(array_map('intval', (array)($input['user_ids'] ?? [])))));
    $subject = trim((string)($input['subject'] ?? ''));
    $body = trim((string)($input['message'] ?? ''));

    if (empty($ids) || count($ids) > 100) {
        send_json(['success' => false, 'error' => 'Selecciona entre 1 y 100 destinatarios.'], 422);
    }
    if (mb_strlen($subject) < 3 || mb_strlen($subject) > 150) {
        send_json(['success' => false, 'error' => 'El asunto debe tener entre 3 y 150 caracteres.', 'validation_errors' => ['subject' => 'Entre 3 y 150 caracteres.']], 422);
    }
    if (mb_strlen($body) < 5 || mb_strlen($body) > 10000) {
        send_json(['success' => false, 'error' => 'El mensaje debe tener entre 5 y 10.000 caracteres.', 'validation_errors' => ['message' => 'Entre 5 y 10.000 caracteres.']], 422);
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT id, full_name, callsign, email FROM bm_users WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $recipients = $stmt->fetchAll();

    $sent = 0;
    $failed = [];
    foreach ($recipients as $r) {
        // Cada destinatario recibe su propio correo, con saludo personal y sin ver a los demás
        $greeting = 'Hola ' . $r['full_name'] . ' (' . $r['callsign'] . '),';
        $html = bm_mail_layout(
            $subject,
            '<p>' . htmlspecialchars($greeting, ENT_QUOTES, 'UTF-8') . '</p>'
            . '<p>' . nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8')) . '</p>'
            . '<p style="color:#64748B;font-size:13px">— ' . htmlspecialchars($currentUser['full_name'] . ' (' . $currentUser['callsign'] . ')', ENT_QUOTES, 'UTF-8') . '</p>'
        );
        $text = "$greeting\n\n$body\n\n— {$currentUser['full_name']} ({$currentUser['callsign']})\n";
        $result = bm_send_mail($r['email'], $subject, $html, $text, [
            'reply_to' => $currentUser['email'],
            'reply_to_name' => $currentUser['full_name'],
        ]);
        if ($result['ok']) {
            $sent++;
        } else {
            $failed[] = $r['callsign'];
        }
    }

    log_activity($currentUser['id'], 'email_sent', ['subject' => mb_substr($subject, 0, 150), 'sent' => $sent, 'failed' => $failed]);

    if ($sent === 0) {
        send_json(['success' => false, 'error' => 'No se pudo enviar ningún correo. Revisa la configuración SMTP en ~/bmyv-config.php.'], 502);
    }
    $message = "Correo enviado a $sent usuario(s).";
    if ($failed) {
        $message .= ' Falló el envío a: ' . implode(', ', $failed) . '.';
    }
    send_json(['success' => true, 'message' => $message, 'sent' => $sent, 'failed' => $failed]);
}

if ($action === 'bulk') {
    $ids = array_values(array_unique(array_filter(array_map('intval', (array)($input['user_ids'] ?? [])))));
    $operation = (string)($input['operation'] ?? '');
    if (empty($ids)) {
        send_json(['success' => false, 'error' => 'No seleccionaste usuarios.'], 422);
    }
    if (in_array($currentUser['id'], $ids, true)) {
        send_json(['success' => false, 'error' => 'Quita tu propia cuenta de la selección para aplicar acciones en lote.'], 400);
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    if ($operation === 'activate' || $operation === 'deactivate') {
        if ($operation === 'deactivate' && !keeps_an_active_admin($pdo, $ids)) {
            send_json(['success' => false, 'error' => 'Debe quedar al menos un Administrador activo.'], 400);
        }
        $stmt = $pdo->prepare("UPDATE bm_users SET status = ? WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$operation === 'activate' ? 'active' : 'inactive'], $ids));
    } elseif (preg_match('/^role:(admin|editor|author)$/', $operation, $m)) {
        if ($m[1] !== 'admin' && !keeps_an_active_admin($pdo, $ids)) {
            send_json(['success' => false, 'error' => 'Debe quedar al menos un Administrador activo.'], 400);
        }
        $stmt = $pdo->prepare("UPDATE bm_users SET role = ? WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$m[1]], $ids));
    } else {
        send_json(['success' => false, 'error' => 'Acción en lote no válida.'], 400);
    }

    log_activity($currentUser['id'], 'users_bulk', ['operation' => $operation, 'user_ids' => $ids]);
    send_json(['success' => true, 'message' => 'Cambios aplicados a ' . $stmt->rowCount() . ' usuario(s).']);
}

send_json(['success' => false, 'error' => 'Acción no válida'], 400);
