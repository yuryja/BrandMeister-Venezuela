-- ====================================================================
-- Migración 007: De dónde llegan las visitas
--
-- Dos columnas nuevas en bm_analytics_events:
--   traffic_source  canal ya clasificado (buscador, whatsapp, telegram, directo…)
--   referrer_host   sitio concreto desde el que llegó la visita (solo si es externo)
--
-- Ejecutar en phpMyAdmin (cPanel). Es seguro ejecutarla dos veces:
-- si las columnas o los índices ya existen, no hace nada.
-- ====================================================================

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_analytics_events' AND COLUMN_NAME = 'traffic_source');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `bm_analytics_events` ADD COLUMN `traffic_source` VARCHAR(24) NULL AFTER `referrer`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_analytics_events' AND COLUMN_NAME = 'referrer_host');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `bm_analytics_events` ADD COLUMN `referrer_host` VARCHAR(120) NULL AFTER `traffic_source`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Para agrupar por canal dentro de un rango de fechas
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_analytics_events' AND INDEX_NAME = 'idx_origen');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `bm_analytics_events` ADD INDEX `idx_origen` (`traffic_source`, `created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Para la lista de sitios que nos enlazan
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_analytics_events' AND INDEX_NAME = 'idx_referrer_host');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `bm_analytics_events` ADD INDEX `idx_referrer_host` (`referrer_host`, `created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
