<?php
/**
 * Configuración de Base de Datos MySQL - BrandMeister Venezuela
 * Compatible con DBngin / DBng / MySQL local y Hosting cPanel
 */

// Permite sobreescribir mediante variables de entorno o archivo .env
$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'bmvenezuela';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

return [
    'host' => $db_host,
    'port' => $db_port,
    'dbname' => $db_name,
    'user' => $db_user,
    'pass' => $db_pass,
    'charset' => 'utf8mb4'
];
