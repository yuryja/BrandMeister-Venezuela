<?php
/**
 * Tarea programada: renueva el token de Instagram si está por vencer y sincroniza la galería.
 * Solo por línea de comandos. En cPanel → Trabajos de cron (cada hora, por ejemplo):
 *
 *   php /home/USUARIO/public_html/api/instagram-cron.php >/dev/null 2>&1
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/instagram-lib.php';

$lock = fopen(sys_get_temp_dir() . '/bmyv-instagram-sync.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    fwrite(STDOUT, "Otra sincronización está en curso.\n");
    exit(0);
}

if (!get_db_connection()) {
    fwrite(STDERR, "Sin conexión a la base de datos.\n");
    exit(1);
}

try {
    $token = ig_refresh_token_if_needed();
    if ($token === 'not_connected') {
        fwrite(STDOUT, "Instagram no está conectado.\n");
        exit(0);
    }
    if ($token === 'expired') {
        log_activity(null, 'instagram_token_expired');
        fwrite(STDERR, "El token de Instagram venció: vuelve a conectar la cuenta desde el panel.\n");
        exit(1);
    }
    if ($token === 'refreshed') {
        log_activity(null, 'instagram_token_refreshed');
    }

    $result = ig_sync();
    log_activity(null, 'instagram_sync_cron', $result);
    fwrite(STDOUT, sprintf("OK: %d con #%s, %d nuevas, %d actualizadas, %d ocultadas.\n",
        $result['matched'], $result['hashtag'], $result['added'], $result['updated'], $result['hidden']));
} catch (Exception $e) {
    log_activity(null, 'instagram_sync_failed', $e->getMessage());
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    exit(1);
}
