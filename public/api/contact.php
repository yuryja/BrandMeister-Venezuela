<?php
/**
 * Endpoint de Recepción y Procesamiento de Contacto - BrandMeister Venezuela
 * Compatible con cPanel / Shared Hosting Apache + PHP y MySQL
 * Integrado con Google reCAPTCHA v3, protección Honeypot y generación de Ticket
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/recaptcha.php';
require_once __DIR__ . '/mailer.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    send_json(['status' => 'ok']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'error' => 'Método no permitido. Solo se acepta POST.'], 405);
}

// Leer datos JSON del cuerpo de la petición o de $_POST
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!is_array($input) || empty($input)) {
    $input = $_POST;
}

// 1. Detección de Bot mediante Honeypot (campo 'website' invisible para humanos)
if (!empty($input['website'])) {
    // Es un bot. Retornamos éxito falso/silencioso para despistarlo
    send_json([
        'success' => true,
        'message' => 'Tu mensaje ha sido recibido satisfactoriamente.',
        'ticket_id' => 'BM-734-' . strtoupper(substr(md5(time()), 0, 6))
    ]);
}

// 2. Extracción y saneamiento de campos
$name        = trim((string)($input['name'] ?? ''));
$callsign    = strtoupper(trim((string)($input['callsign'] ?? '')));
$dmr_id      = trim((string)($input['dmr_id'] ?? ''));
$email       = strtolower(trim((string)($input['email'] ?? '')));
$phone       = trim((string)($input['phone'] ?? ''));
$category    = trim((string)($input['category'] ?? 'Consulta General'));
$state_region= trim((string)($input['state_region'] ?? ''));
$subject     = trim((string)($input['subject'] ?? ''));
$message     = trim((string)($input['message'] ?? ''));
$recaptcha   = trim((string)($input['recaptcha_token'] ?? ($input['g-recaptcha-response'] ?? '')));

// 3. Validaciones de negocio estrictas
$errors = [];

if (mb_strlen($name) < 2) {
    $errors['name'] = 'Por favor ingresa tu nombre y apellido completo.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Por favor ingresa un correo electrónico válido.';
}

if (!empty($callsign) && !preg_match('/^[A-Z0-9\/\-]+$/', $callsign)) {
    $errors['callsign'] = 'El indicativo solo puede contener letras mayúsculas, números y guiones.';
}

if (!empty($dmr_id) && (!ctype_digit($dmr_id) || strlen($dmr_id) < 5 || strlen($dmr_id) > 8)) {
    $errors['dmr_id'] = 'El ID DMR debe ser numérico (típicamente 7 dígitos, ej. 7340001).';
}

if (mb_strlen($subject) < 3) {
    $errors['subject'] = 'Por favor indica un asunto para tu mensaje.';
}

if (mb_strlen($message) < 15) {
    $errors['message'] = 'El mensaje debe tener al menos 15 caracteres con el detalle de tu solicitud.';
}

if (!empty($errors)) {
    send_json([
        'success' => false,
        'error' => 'Por favor corrige los campos marcados.',
        'validation_errors' => $errors
    ], 422);
}

// 4. Verificación de Google reCAPTCHA v3 (invisible, por puntuación)
$captcha = bm_verify_recaptcha($recaptcha, 'contact');
if (!$captcha['ok']) {
    error_log('[BM-YV] Contacto rechazado por reCAPTCHA: ' . ($captcha['reason'] ?? '') . (isset($captcha['score']) ? ' score=' . $captcha['score'] : ''));
    send_json([
        'success' => false,
        'error' => 'No pudimos verificar que el envío lo hace una persona. Recarga la página e inténtalo de nuevo.'
    ], 400);
}

// 5. Generación de código único de Ticket
$ticketId = 'BM-734-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 6));
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250);

// 6. Almacenamiento en Base de Datos MySQL (si la conexión está activa)
$pdo = get_db_connection();
if ($pdo) {
    try {
        // Asegurar que la tabla exista
        $pdo->exec("CREATE TABLE IF NOT EXISTS `bm_contact_messages` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `ticket_id` VARCHAR(30) NOT NULL UNIQUE,
            `name` VARCHAR(120) NOT NULL,
            `callsign` VARCHAR(20) NULL,
            `dmr_id` VARCHAR(20) NULL,
            `email` VARCHAR(150) NOT NULL,
            `phone` VARCHAR(50) NULL,
            `category` VARCHAR(80) NOT NULL,
            `state_region` VARCHAR(80) NULL,
            `subject` VARCHAR(200) NOT NULL,
            `message` TEXT NOT NULL,
            `ip_address` VARCHAR(45) NULL,
            `user_agent` VARCHAR(255) NULL,
            `status` ENUM('unread', 'read', 'in_progress', 'resolved') NOT NULL DEFAULT 'unread',
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            INDEX `idx_ticket` (`ticket_id`),
            INDEX `idx_callsign` (`callsign`),
            INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $stmt = $pdo->prepare("INSERT INTO `bm_contact_messages` 
            (`ticket_id`, `name`, `callsign`, `dmr_id`, `email`, `phone`, `category`, `state_region`, `subject`, `message`, `ip_address`, `user_agent`, `status`)
            VALUES (:ticket, :name, :callsign, :dmr_id, :email, :phone, :category, :state_region, :subject, :message, :ip, :ua, 'unread')");

        $stmt->execute([
            ':ticket'       => $ticketId,
            ':name'         => $name,
            ':callsign'     => $callsign ?: null,
            ':dmr_id'       => $dmr_id ?: null,
            ':email'        => $email,
            ':phone'        => $phone ?: null,
            ':category'     => $category,
            ':state_region' => $state_region ?: null,
            ':subject'      => $subject,
            ':message'      => $message,
            ':ip'           => $ipAddress,
            ':ua'           => $userAgent
        ]);
    } catch (Exception $e) {
        error_log("Error al guardar mensaje de contacto: " . $e->getMessage());
        // Continuamos para enviar el correo y no frustrar al usuario
    }
}

// 7. Envío de notificación por correo electrónico a los Sysops
$sysopEmail = getenv('SYSOP_ALERT_EMAIL') ?: 'sysop@brandmeisteryv.net';
$mailSubject = "[$ticketId] $subject" . ($callsign ? " - $callsign" : "");

$mailBody = "=====================================================\n";
$mailBody .= "NUEVO MENSAJE DE CONTACTO - BRANDMEISTER VENEZUELA\n";
$mailBody .= "=====================================================\n\n";
$mailBody .= "Ticket ID:    $ticketId\n";
$mailBody .= "Fecha:        " . date('Y-m-d H:i:s') . " VET\n";
$mailBody .= "Remitente:    $name\n";
$mailBody .= "Indicativo:   " . ($callsign ?: 'No especificado') . "\n";
$mailBody .= "ID DMR:       " . ($dmr_id ?: 'No especificado') . "\n";
$mailBody .= "Correo:       $email\n";
$mailBody .= "Teléfono:     " . ($phone ?: 'No especificado') . "\n";
$mailBody .= "Categoría:    $category\n";
$mailBody .= "Ubicación:    " . ($state_region ?: 'No especificada') . "\n";
$mailBody .= "Asunto:       $subject\n\n";
$mailBody .= "-----------------------------------------------------\n";
$mailBody .= "MENSAJE:\n";
$mailBody .= "-----------------------------------------------------\n";
$mailBody .= "$message\n\n";
$mailBody .= "=====================================================\n";
$mailBody .= "IP de Origen: $ipAddress\n";
$mailBody .= "Navegador:    $userAgent\n";

$mailHtml = bm_mail_layout(
    "Nuevo mensaje de contacto · $ticketId",
    '<pre style="white-space:pre-wrap;font-family:Menlo,Consolas,monospace;font-size:13px;background:#F8FAFC;padding:14px;border-radius:8px">'
    . htmlspecialchars($mailBody, ENT_QUOTES, 'UTF-8') . '</pre>'
);

// Por SMTP si está configurado; responder al correo contesta directamente al remitente
$mailResult = bm_send_mail($sysopEmail, $mailSubject, $mailHtml, $mailBody, [
    'reply_to' => $email,
    'reply_to_name' => $name,
]);
if (!$mailResult['ok']) {
    error_log("[BM-YV] No se pudo notificar el ticket $ticketId por correo");
}

// 8. Respuesta de éxito al cliente
send_json([
    'success' => true,
    'message' => 'Tu mensaje ha sido recibido exitosamente por el equipo técnico y sysops de BrandMeister Venezuela.',
    'ticket_id' => $ticketId,
    'data' => [
        'name' => $name,
        'callsign' => $callsign,
        'email' => $email,
        'category' => $category,
        'created_at' => date('d/m/Y H:i')
    ]
]);
