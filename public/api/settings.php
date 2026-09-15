<?php
require_once __DIR__ . '/db.php';

start_secure_session();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db_connection();

// Ajustes del portal: los ve cualquier visitante y los editan admin/editor
const PUBLIC_SETTINGS = [
    'hero_title', 'hero_description', 'emergency_alert', 'freq_vhf', 'freq_uhf',
    'master_servers', 'contact_email'
];

if ($method === 'GET') {
    if ($pdo) {
        $rows = $pdo->query("SELECT setting_key, setting_value FROM bm_site_settings")->fetchAll();
        $settings = [];
        foreach ($rows as $r) {
            $key = $r['setting_key'];
            if (in_array($key, PUBLIC_SETTINGS, true)) {
                $settings[$key] = $r['setting_value'];
            }
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
    $user = require_role(['admin', 'editor']);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        send_json(['success' => false, 'error' => 'Datos no válidos'], 400);
    }
    if (!$pdo) {
        send_json(['success' => false, 'error' => 'La base de datos no está disponible en este momento'], 503);
    }

    $toSave = [];
    $rejected = [];

    foreach ($input as $k => $v) {
        if (!is_string($k) || (!is_scalar($v) && $v !== null)) {
            $rejected[] = (string)$k;
            continue;
        }
        $value = trim((string)$v);

        if (in_array($k, PUBLIC_SETTINGS, true)) {
            $toSave[$k] = $value;
        } else {
            $rejected[] = $k;
        }
    }

    $stmt = $pdo->prepare("INSERT INTO bm_site_settings (setting_key, setting_value) VALUES (:k, :v) ON DUPLICATE KEY UPDATE setting_value = :v2");
    foreach ($toSave as $k => $v) {
        $stmt->execute([':k' => $k, ':v' => $v, ':v2' => $v]);
    }

    send_json([
        'success' => true,
        'message' => 'Ajustes guardados correctamente',
        'saved' => array_keys($toSave),
        'rejected' => $rejected
    ]);
}

send_json(['success' => false, 'error' => 'Método no permitido'], 405);
