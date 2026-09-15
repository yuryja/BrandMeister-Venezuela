<?php
/**
 * Plantilla de configuración privada de BrandMeister Venezuela.
 *
 * Copiar en el servidor FUERA de public_html:
 *   cp bmyv-config.sample.php ~/bmyv-config.php && chmod 600 ~/bmyv-config.php
 *
 * Nunca subir el archivo real al repositorio.
 */

return [
    // MySQL (cPanel → Bases de datos MySQL)
    'DB_HOST' => 'localhost',
    'DB_PORT' => '3306',
    'DB_NAME' => 'usuario_bmvenezuela',
    'DB_USER' => 'usuario_bmyv',
    'DB_PASS' => '',

    // Google reCAPTCHA v2 (clave secreta; la clave de sitio va en GitHub → Variables)
    'RECAPTCHA_SECRET_KEY' => '',

    // Correo que recibe los mensajes del formulario de contacto
    'SYSOP_ALERT_EMAIL' => 'sysop@brandmeisteryv.net',
];
