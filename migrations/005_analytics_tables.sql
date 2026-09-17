-- ====================================================================
-- Migración 005: Tablas de Analíticas y Telemetría de Usuario
-- Rastreo de oyentes del reproductor, clics a enlaces, lecturas y compartidos
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `bm_analytics_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_type` ENUM('player_play', 'link_click', 'post_view', 'post_share', 'page_view') NOT NULL,
  `event_category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `entity_id` VARCHAR(100) NULL,
  `entity_title` VARCHAR(255) NULL,
  `platform` VARCHAR(50) NULL,
  `ip_address` VARCHAR(45) NULL,
  `country_code` VARCHAR(3) NULL,
  `country_name` VARCHAR(100) NULL,
  `city` VARCHAR(100) NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `user_agent` VARCHAR(255) NULL,
  `device_type` ENUM('desktop', 'mobile', 'tablet') NOT NULL DEFAULT 'desktop',
  `referrer` VARCHAR(255) NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_event_type_created` (`event_type`, `created_at`),
  INDEX `idx_country` (`country_code`),
  INDEX `idx_ip` (`ip_address`),
  INDEX `idx_entity` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
