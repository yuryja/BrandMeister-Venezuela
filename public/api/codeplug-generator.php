<?php
/**
 * Generador de codeplugs: retirado del servidor.
 *
 * Ahora el archivo se genera en el navegador del visitante (src/scripts/codeplug.ts), con los
 * contactos de RadioID que publica cada semana la tarea "Datos de RadioID" y que se descargan
 * desde jsDelivr. El hosting ya no descarga RadioID, no guarda megas de contactos en cada
 * despliegue y nadie puede forzar sincronizaciones pesadas desde fuera.
 *
 * Este archivo sigue existiendo solo para sustituir a la versión anterior en el servidor
 * (el despliegue de cPanel copia archivos, pero nunca borra los que ya están) y para
 * orientar a quien tenga guardado un enlace antiguo.
 */

http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
echo json_encode([
    'success' => false,
    'error' => 'El generador de codeplugs ahora funciona en tu navegador.',
    'url' => '/generador-csv',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
