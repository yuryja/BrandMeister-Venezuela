<?php
require_once __DIR__ . '/db.php';

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db_connection();

if ($method === 'GET') {
    if ($pdo) {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM bm_site_settings");
        $rows = $stmt->fetchAll();
        $settings = [];
        foreach ($rows as $r) {
            $settings[$r['setting_key']] = $r['setting_value'];
        }
        send_json(['success' => true, 'settings' => $settings, 'source' => 'mysql']);
    }

    $defaultSettings = [
        'hero_title' => 'La voz digital que une a los radioaficionados de Venezuela y el mundo.',
        'hero_description' => 'Infraestructura abierta y 100% digital basada en el estándar DMR. Conectamos repetidores, puntos de acceso de alta potencia y operadores en todo el territorio nacional con acceso directo a la red global BrandMeister.',
        'emergency_alert' => 'Reservado exclusivamente para prevención, boletines por fenómenos meteorológicos, alertas sísmicas o contingencias mayores.',
        'freq_vhf' => '146.550 MHz (Alterna: 146.490 MHz)',
        'freq_uhf' => '436.550 MHz (Alterna: 436.490 MHz)'
    ];
    send_json(['success' => true, 'settings' => $defaultSettings, 'source' => 'memory']);
}

if ($method === 'POST') {
    $role = $_SESSION['role'] ?? 'admin';
    if ($role !== 'admin' && $role !== 'editor') {
        send_json(['success' => false, 'error' => 'Permiso denegado'], 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if ($pdo && is_array($input)) {
        $stmt = $pdo->prepare("INSERT INTO bm_site_settings (setting_key, setting_value) VALUES (:k, :v) ON DUPLICATE KEY UPDATE setting_value = :v2");
        foreach ($input as $k => $v) {
            $stmt->execute([':k' => $k, ':v' => $v, ':v2' => $v]);
        }
    }

    send_json(['success' => true, 'message' => 'Ajustes guardados correctamente']);
}
