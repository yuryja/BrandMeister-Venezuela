<?php
/**
 * Endpoint de guardado del panel de administración en Hosting Compartido cPanel / Apache
 * BrandMeister Venezuela
 */

require_once __DIR__ . '/db.php';

start_secure_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'error' => 'Método no permitido'], 405);
}

// Escribir archivos en el servidor solo está permitido a admin y editor
require_role(['admin', 'editor']);

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || empty($input['slug']) || empty($input['content']) || !is_string($input['content'])) {
    send_json(['success' => false, 'error' => 'Datos incompletos'], 400);
}

$slug = preg_replace('/[^a-z0-9\-_]/', '', strtolower((string)$input['slug']));
if ($slug === '' || strlen($slug) > 120) {
    send_json(['success' => false, 'error' => 'Slug no válido'], 400);
}
if (strlen($input['content']) > 512000) {
    send_json(['success' => false, 'error' => 'El contenido excede el tamaño máximo permitido (500 KB)'], 413);
}

$filename = __DIR__ . '/../../src/content/blog/' . $slug . '.md';

// Si el directorio no es escribible directamente, intentar en una carpeta local de uploads/content
$backupDir = __DIR__ . '/content_drafts/';
if (!is_dir($backupDir)) {
    @mkdir($backupDir, 0755, true);
}
// Evitar que Apache liste o sirva los borradores
if (is_dir($backupDir) && !file_exists($backupDir . '.htaccess')) {
    @file_put_contents($backupDir . '.htaccess', "Require all denied\n");
}

$targetFile = is_writable(dirname($filename)) ? $filename : ($backupDir . $slug . '.md');

if (@file_put_contents($targetFile, $input['content']) !== false) {
    send_json([
        'success' => true,
        'message' => 'Artículo guardado exitosamente en el servidor',
        'file' => basename($targetFile),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

send_json([
    'success' => false,
    'error' => 'No fue posible escribir el archivo en el servidor. Descarga el archivo .md para colocarlo en tu repositorio.',
    'slug' => $slug
], 500);
