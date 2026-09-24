<?php
/**
 * Subida de archivos por partes, compartida por la galería y las noticias.
 * Solo se incluye desde otros endpoints (bloqueado en .htaccess).
 *
 * El navegador manda los archivos ya optimizados (WebP o video comprimido) en trozos,
 * así no chocan con el límite de upload_max_filesize del hosting compartido.
 */

require_once __DIR__ . '/db.php';

const UPLOAD_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const UPLOAD_MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const UPLOAD_MAX_CHUNK_BYTES = 6 * 1024 * 1024;

/**
 * Tipos de archivo admitidos: límites de tamaño en píxeles por cada uno.
 * 'poster' es la portada de un video; 'post-image' la imagen destacada de una noticia;
 * 'post-inline' una imagen insertada dentro del texto de una noticia.
 */
const UPLOAD_KINDS = [
    'image' => ['max_width' => 1500, 'max_height' => 1500],
    'poster' => ['max_width' => 1500, 'max_height' => 1500],
    'post-image' => ['max_width' => 1920, 'max_height' => 1280],
    // Imagen dentro del texto de una noticia: cabe en 1600×1600, horizontal o vertical
    'post-inline' => ['max_width' => 1600, 'max_height' => 1600],
    'video' => [],
];

function media_root() {
    return rtrim(getenv('GALLERY_MEDIA_DIR') ?: dirname(__DIR__) . '/media', '/');
}

/** Sin listados ni ejecución de scripts dentro de las carpetas de medios */
function media_protect_dir($dir, $create = false) {
    if ($create && !is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (is_dir($dir) && !file_exists("$dir/.htaccess")) {
        @file_put_contents("$dir/.htaccess", "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh|html?|svg)$\">\n  Require all denied\n</FilesMatch>\n");
    }
}

function upload_tmp_dir() {
    $dir = media_root() . '/subidas';
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        throw new Exception('No se pudo crear la carpeta temporal de subidas.');
    }
    if (!file_exists("$dir/.htaccess")) {
        @file_put_contents("$dir/.htaccess", "Require all denied\n");
    }
    return $dir;
}

/** Borra subidas temporales abandonadas (más de 24 h) */
function upload_purge_tmp() {
    foreach (glob(upload_tmp_dir() . '/*') ?: [] as $file) {
        if (is_file($file) && basename($file) !== '.htaccess' && filemtime($file) < time() - 86400) {
            @unlink($file);
        }
    }
}

function upload_valid_id($id) {
    return is_string($id) && preg_match('/^[a-f0-9]{32}$/', $id);
}

/** Busca una subida temporal ya completa y validada: devuelve [ruta, kind, ext] o null */
function upload_find($uploadId) {
    if (!upload_valid_id($uploadId)) return null;
    foreach (UPLOAD_KINDS as $kind => $limits) {
        foreach ($kind === 'video' ? ['mp4', 'webm'] : ['webp'] as $ext) {
            $path = upload_tmp_dir() . "/$uploadId.$kind.$ext";
            if (is_file($path)) return [$path, $kind, $ext];
        }
    }
    return null;
}

/** Valida un archivo ya ensamblado. Devuelve la extensión final o lanza Exception */
function upload_validate_file($path, $kind) {
    $size = filesize($path);
    if ($kind === 'video') {
        if ($size > UPLOAD_MAX_VIDEO_BYTES) {
            throw new Exception('El video supera el tamaño máximo (250 MB).');
        }
        $head = file_get_contents($path, false, null, 0, 12);
        if (strlen($head) >= 8 && substr($head, 4, 4) === 'ftyp') return 'mp4';
        if (strncmp($head, "\x1A\x45\xDF\xA3", 4) === 0) return 'webm';
        throw new Exception('El video debe ser MP4 o WebM.');
    }

    if ($size > UPLOAD_MAX_IMAGE_BYTES) {
        throw new Exception('La imagen es demasiado pesada.');
    }
    $info = @getimagesize($path);
    if (!$info || $info[2] !== IMAGETYPE_WEBP) {
        throw new Exception('Las imágenes deben llegar en formato WebP.');
    }
    $limits = UPLOAD_KINDS[$kind];
    if ($info[0] > $limits['max_width'] || $info[1] > $limits['max_height']) {
        throw new Exception("La imagen supera {$limits['max_width']}×{$limits['max_height']} píxeles.");
    }
    return 'webp';
}

/**
 * Recibe una parte del archivo (multipart: upload_id, index, total, kind, chunk).
 * Responde JSON y termina la petición.
 */
function upload_handle_chunk() {
    $uploadId = (string)($_POST['upload_id'] ?? '');
    $index = (int)($_POST['index'] ?? -1);
    $total = (int)($_POST['total'] ?? 0);
    $kind = (string)($_POST['kind'] ?? '');
    $chunk = $_FILES['chunk'] ?? null;

    if (!upload_valid_id($uploadId) || !isset(UPLOAD_KINDS[$kind])) {
        send_json(['success' => false, 'error' => 'Subida no válida.'], 400);
    }
    if ($total < 1 || $total > 100 || $index < 0 || $index >= $total) {
        send_json(['success' => false, 'error' => 'Parte de la subida no válida.'], 400);
    }
    if (!$chunk || ($chunk['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($chunk['tmp_name'])) {
        $code = $chunk['error'] ?? UPLOAD_ERR_NO_FILE;
        $message = in_array($code, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? 'El servidor rechazó la parte por tamaño (upload_max_filesize).'
            : 'No se recibió el archivo.';
        send_json(['success' => false, 'error' => $message], 400);
    }
    if ($chunk['size'] > UPLOAD_MAX_CHUNK_BYTES) {
        send_json(['success' => false, 'error' => 'Parte demasiado grande.'], 413);
    }

    if ($index === 0) {
        upload_purge_tmp();
    }
    $partPath = upload_tmp_dir() . "/$uploadId.$kind.part";
    if ($index === 0) {
        @unlink($partPath);
    } elseif (!is_file($partPath)) {
        send_json(['success' => false, 'error' => 'La subida se interrumpió. Vuelve a intentarlo.'], 409);
    }

    // Las partes llegan en orden: se añaden al final del archivo
    $maxBytes = $kind === 'video' ? UPLOAD_MAX_VIDEO_BYTES : UPLOAD_MAX_IMAGE_BYTES;
    if ((is_file($partPath) ? filesize($partPath) : 0) + $chunk['size'] > $maxBytes) {
        @unlink($partPath);
        send_json(['success' => false, 'error' => 'El archivo supera el tamaño máximo permitido.'], 413);
    }
    $out = fopen($partPath, 'ab');
    $in = fopen($chunk['tmp_name'], 'rb');
    stream_copy_to_stream($in, $out);
    fclose($in);
    fclose($out);

    if ($index < $total - 1) {
        send_json(['success' => true, 'received' => $index + 1]);
    }

    try {
        $ext = upload_validate_file($partPath, $kind);
    } catch (Exception $e) {
        @unlink($partPath);
        send_json(['success' => false, 'error' => $e->getMessage()], 422);
    }
    rename($partPath, upload_tmp_dir() . "/$uploadId.$kind.$ext");
    send_json(['success' => true, 'upload_id' => $uploadId, 'complete' => true]);
}

/**
 * Mueve una subida temporal a su carpeta definitiva ($folder) y devuelve la URL pública.
 * @throws Exception
 */
function upload_commit($uploadId, array $allowedKinds, $folder) {
    $found = upload_find($uploadId);
    if (!$found || !in_array($found[1], $allowedKinds, true)) {
        throw new Exception('Un archivo subido no se encontró o expiró. Vuelve a añadirlo.');
    }
    [$path, , $ext] = $found;
    $subdir = $folder . '/' . gmdate('Y/m');
    $dir = media_root() . '/' . $subdir;
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        throw new Exception('No se pudo crear la carpeta de destino.');
    }
    media_protect_dir(media_root() . '/' . $folder);
    $name = bin2hex(random_bytes(12)) . '.' . $ext;
    if (!rename($path, "$dir/$name")) {
        throw new Exception('No se pudo guardar el archivo.');
    }
    @chmod("$dir/$name", 0644);
    return '/media/' . $subdir . '/' . $name;
}

/** Borra del disco archivos locales (solo dentro de /media/) */
function upload_delete_files(array $urls) {
    $root = realpath(media_root());
    foreach (array_unique(array_filter($urls)) as $url) {
        if (strpos($url, '/media/') !== 0) continue;
        $file = realpath(media_root() . substr($url, strlen('/media')));
        if ($file && $root && strpos($file, $root . DIRECTORY_SEPARATOR) === 0 && is_file($file)) {
            @unlink($file);
        }
    }
}
