<?php
/**
 * Carga la configuración privada del servidor como variables de entorno.
 *
 * En hosting compartido (cPanel) no hay variables de entorno, así que las claves
 * viven en un archivo PHP FUERA de public_html, que nunca se versiona ni se sirve:
 *   /home/<usuario>/bmyv-config.php   (plantilla: bmyv-config.sample.php)
 *
 * Las variables de entorno reales (si existen) tienen prioridad.
 */

if (!function_exists('bm_load_private_config')) {
    function bm_load_private_config() {
        static $loaded = false;
        if ($loaded) {
            return;
        }
        $loaded = true;

        $candidates = array_filter([
            getenv('BMYV_CONFIG') ?: null,
            // public_html/api/env.php -> /home/<usuario>/bmyv-config.php
            dirname(__DIR__, 2) . '/bmyv-config.php',
        ]);

        foreach ($candidates as $file) {
            if (!is_file($file) || !is_readable($file)) {
                continue;
            }
            $values = require $file;
            if (!is_array($values)) {
                return;
            }
            foreach ($values as $key => $value) {
                if (is_string($key) && is_scalar($value) && getenv($key) === false) {
                    putenv($key . '=' . $value);
                }
            }
            return;
        }
    }
}

bm_load_private_config();
