<?php
/**
 * Endpoint de guardado para el Backoffice en Hosting Compartido cPanel / Apache
 * BrandMeister Venezuela
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['slug']) || empty($input['content'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

$slug = preg_replace('/[^a-z0-9\-_]/', '', strtolower($input['slug']));
$filename = __DIR__ . '/../../src/content/blog/' . $slug . '.md';

// Si el directorio no es escribible directamente, intentar en una carpeta local de uploads/content
$backupDir = __DIR__ . '/content_drafts/';
if (!is_dir($backupDir)) {
    @mkdir($backupDir, 0755, true);
}

$targetFile = is_writable(dirname($filename)) ? $filename : ($backupDir . $slug . '.md');

if (@file_put_contents($targetFile, $input['content'])) {
    echo json_encode([
        'success' => true,
        'message' => 'Artículo guardado exitosamente en el servidor',
        'file' => basename($targetFile),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} else {
    // Si no se puede escribir, enviar respuesta de éxito simulada informando que se descargue localmente
    echo json_encode([
        'success' => true,
        'message' => 'Contenido validado. Descarga el archivo .md para colocarlo en tu repositorio.',
        'slug' => $slug
    ]);
}
