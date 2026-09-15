<?php
/**
 * URI de redirección OAuth de Instagram. Regístrala tal cual en la app de Meta:
 *   https://brandmeisteryv.net/api/instagram-callback.php
 *
 * Instagram vuelve aquí con ?code=...&state=... (o ?error=...) tras autorizar la cuenta.
 */

require_once __DIR__ . '/instagram-lib.php';

start_secure_session();

function ig_back_to_panel($result, $detail = '') {
    $query = ['instagram' => $result];
    if ($detail !== '') {
        $query['detalle'] = mb_substr($detail, 0, 200);
    }
    header('Location: /admin/?' . http_build_query($query) . '#gallery', true, 302);
    exit;
}

$user = current_user();
if (!$user || $user['role'] !== 'admin') {
    ig_back_to_panel('forbidden');
}

if (!empty($_GET['error'])) {
    // El usuario canceló o Instagram rechazó la autorización
    log_activity($user['id'], 'instagram_connect_denied', (string)($_GET['error_reason'] ?? $_GET['error']));
    ig_back_to_panel('denied', (string)($_GET['error_description'] ?? ''));
}

if (!ig_check_state($_GET['state'] ?? null)) {
    ig_back_to_panel('invalid_state');
}

try {
    $connection = ig_complete_connection((string)($_GET['code'] ?? ''));
    log_activity($user['id'], 'instagram_connected', ['username' => $connection['username']]);
} catch (Exception $e) {
    log_activity($user['id'], 'instagram_connect_failed', $e->getMessage());
    ig_back_to_panel('error', $e->getMessage());
}

// Primera sincronización inmediata para que la galería se llene sin esperar al cron
try {
    @set_time_limit(300);
    $result = ig_sync();
    log_activity($user['id'], 'instagram_sync', $result);
} catch (Exception $e) {
    log_activity($user['id'], 'instagram_sync_failed', $e->getMessage());
}

ig_back_to_panel('connected');
