<?php
/**
 * Asigna o restablece la contraseña de un usuario del Backoffice.
 * Solo se ejecuta por línea de comandos (no está dentro de public/).
 *
 * Uso:
 *   DB_HOST=127.0.0.1 DB_NAME=bmvenezuela DB_USER=... DB_PASS=... php scripts/set-password.php yv5of
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$username = $argv[1] ?? '';
if ($username === '') {
    fwrite(STDERR, "Uso: php scripts/set-password.php <usuario o indicativo>\n");
    exit(1);
}

require_once __DIR__ . '/../public/api/db.php';

$pdo = get_db_connection();
if (!$pdo) {
    fwrite(STDERR, "No fue posible conectar a MySQL. Revisa DB_HOST, DB_NAME, DB_USER y DB_PASS.\n");
    exit(1);
}

$stmt = $pdo->prepare("SELECT id, username, callsign FROM bm_users WHERE username = :u OR callsign = :c LIMIT 1");
$stmt->execute([':u' => strtolower($username), ':c' => strtoupper($username)]);
$user = $stmt->fetch();
if (!$user) {
    fwrite(STDERR, "Usuario '$username' no encontrado.\n");
    exit(1);
}

function prompt_hidden($label) {
    fwrite(STDOUT, $label);
    $isTty = function_exists('posix_isatty') ? posix_isatty(STDIN) : true;
    if ($isTty) shell_exec('stty -echo');
    $value = rtrim((string)fgets(STDIN), "\r\n");
    if ($isTty) shell_exec('stty echo');
    fwrite(STDOUT, "\n");
    return $value;
}

$password = prompt_hidden("Nueva contraseña para {$user['callsign']} ({$user['username']}): ");
if (strlen($password) < 10) {
    fwrite(STDERR, "La contraseña debe tener al menos 10 caracteres.\n");
    exit(1);
}
if (prompt_hidden("Repite la contraseña: ") !== $password) {
    fwrite(STDERR, "Las contraseñas no coinciden.\n");
    exit(1);
}

$update = $pdo->prepare("UPDATE bm_users SET password_hash = :h WHERE id = :id");
$update->execute([':h' => password_hash($password, PASSWORD_DEFAULT), ':id' => $user['id']]);

fwrite(STDOUT, "Contraseña actualizada para {$user['callsign']}.\n");
