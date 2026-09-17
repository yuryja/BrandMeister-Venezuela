-- 006 · Tabla de mensajes de contacto e índices de retención
--
-- Antes, contact.php creaba la tabla en cada envío, lo que obligaba a que el usuario de MySQL
-- pudiera modificar la estructura de la base de datos. Ahora la tabla se crea aquí, una sola vez.
--
-- Ejecutar en phpMyAdmin (cPanel) sobre la base de datos del sitio.
-- Es seguro ejecutarla aunque la tabla ya exista: no borra ni cambia los mensajes guardados.

CREATE TABLE IF NOT EXISTS `bm_contact_messages` (
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
    INDEX `idx_status` (`status`),
    -- Para el freno de 5 mensajes por hora desde la misma conexión
    INDEX `idx_ip_fecha` (`ip_address`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si la tabla ya existía (creada por el contact.php anterior), le falta el índice del freno
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_contact_messages' AND INDEX_NAME = 'idx_ip_fecha');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `bm_contact_messages` ADD INDEX `idx_ip_fecha` (`ip_address`, `created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Retención: analytics.php borra por su cuenta lo que pasa de un año.
-- Estos índices hacen que esa limpieza sea rápida.
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_analytics_events' AND INDEX_NAME = 'idx_creado');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `bm_analytics_events` ADD INDEX `idx_creado` (`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_activity_logs' AND INDEX_NAME = 'idx_creado');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `bm_activity_logs` ADD INDEX `idx_creado` (`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
