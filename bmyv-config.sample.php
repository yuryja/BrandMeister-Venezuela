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

    // Google reCAPTCHA v3 (clave secreta; la clave de sitio va en GitHub → Variables → PUBLIC_RECAPTCHA_SITE_KEY)
    'RECAPTCHA_SECRET_KEY' => '',
    // Puntuación mínima 0.0-1.0 para aceptar un envío (0.5 recomendado por Google)
    'RECAPTCHA_MIN_SCORE' => '0.5',
    // Solo si NO usas reCAPTCHA: '1' acepta envíos sin verificar (sin clave y sin esto, el formulario rechaza todo)
    'RECAPTCHA_DISABLED' => '0',

    // Correo que recibe los mensajes del formulario de contacto
    'SYSOP_ALERT_EMAIL' => 'sysop@brandmeisteryv.net',
];
