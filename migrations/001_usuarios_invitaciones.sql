-- ====================================================================
-- Migración 001: invitaciones, restablecimiento de contraseña y último acceso
-- Ejecutar una vez en phpMyAdmin (cPanel) sobre la base de datos del sitio.
-- Es segura de repetir.
-- ====================================================================

CREATE TABLE IF NOT EXISTS `bm_user_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type` ENUM('invite', 'reset') NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_token_hash` (`token_hash`),
  INDEX `idx_token_user` (`user_id`, `type`),
  CONSTRAINT `fk_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `bm_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Último acceso (MySQL 5.7 no admite ADD COLUMN IF NOT EXISTS: se consulta information_schema)
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_users' AND COLUMN_NAME = 'last_login_at');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `bm_users` ADD COLUMN `last_login_at` DATETIME NULL AFTER `avatar_url`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para el freno de intentos por IP (login y "olvidé mi contraseña")
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_activity_logs' AND INDEX_NAME = 'idx_log_action_ip');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `bm_activity_logs` ADD INDEX `idx_log_action_ip` (`action`, `ip_address`, `created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
