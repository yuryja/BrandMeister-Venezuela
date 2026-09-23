<?php
/**
 * Entrada del panel de administración (/admin).
 *
 * El panel lo compila Astro como página estática (admin/index.html). Antes, esa página llegaba
 * siempre con el login visible y solo después, cuando el JavaScript preguntaba al API si había
 * sesión, se cambiaba al escritorio: por eso al refrescar se veía el login por un instante.
 *
 * Aquí se hace lo que haría un middleware: se comprueba la sesión en el servidor ANTES de enviar
 * la página y se marca en <html> qué pantalla debe verse desde el primer pintado:
 *   data-panel="app|login"   qué pantalla se muestra (lo aplica el CSS, sin esperar a JS)
 *   data-rol="admin|..."     qué menús corresponden al rol
 * Con sesión, además se incrusta el usuario como bloque de datos JSON para que el panel no tenga
 * que volver a preguntarlo.
 *
 * .htaccess envía aquí  /admin  y  /admin/
 */

require_once __DIR__ . '/api/accounts.php';

function admin_plantilla() {
    $archivo = __DIR__ . '/admin/index.html';
    if (!is_file($archivo)) {
        $dist = dirname(__DIR__) . '/dist/admin/index.html';
        $archivo = is_file($dist) ? $dist : '';
    }
    return $archivo !== '' ? file_get_contents($archivo) : false;
}

$html = admin_plantilla();
if ($html === false) {
    error_log('[BM-YV] Falta la plantilla del panel: admin/index.html');
    http_response_code(500);
    exit('El panel no está disponible en este momento.');
}

$usuario = null;
try {
    start_secure_session();
    $usuario = current_user();
} catch (Throwable $e) {
    // Sin base de datos o sin sesión se muestra el login; el panel lo volverá a intentar
    error_log('[BM-YV] admin.php: ' . $e->getMessage());
}

// Un enlace de invitación o restablecimiento (?clave=) siempre abre en la pantalla de cuenta
$conSesion = $usuario !== null && empty($_GET['clave']);

$atributos = ' data-panel="' . ($conSesion ? 'app' : 'login') . '"';
if ($conSesion) {
    $atributos .= ' data-rol="' . htmlspecialchars($usuario['role'], ENT_QUOTES, 'UTF-8') . '"';
}
$html = preg_replace('/<html\b/i', '<html' . $atributos, $html, 1);

if ($conSesion) {
    // Bloque de datos, no un script ejecutable: solo los datos públicos del propio usuario.
    // JSON_HEX_* impide que un nombre con "</script>" cierre la etiqueta antes de tiempo.
    $datos = json_encode(
        bm_user_payload($usuario),
        JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );
    $bloque = '<script type="application/json" id="bm-sesion-inicial">' . $datos . '</script>';
    $html = preg_replace('#</head>#i', $bloque . '</head>', $html, 1);

    // Saludo y rol de la barra superior ya rellenos en el primer pintado
    $payload = bm_user_payload($usuario);
    $e = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); };
    $html = str_replace(
        '<strong id="bar-user-name"></strong>',
        '<strong id="bar-user-name">' . $e($payload['callsign']) . '</strong>',
        $html
    );
    $html = str_replace(
        '<span id="bar-user-role" class="role-badge"></span>',
        '<span id="bar-user-role" class="role-badge role-' . $e($payload['role']) . '">' . $e($payload['role_label']) . '</span>',
        $html
    );
}

// La página lleva datos de la sesión: nunca se guarda en cachés compartidas
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
header('Vary: Cookie');
echo $html;
