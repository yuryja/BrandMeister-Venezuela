-- ====================================================================
-- Migración 004: imagen destacada en las noticias
-- Ejecutar una vez en phpMyAdmin. Es segura de repetir.
-- ====================================================================

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bm_posts' AND COLUMN_NAME = 'image_url');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `bm_posts` ADD COLUMN `image_url` VARCHAR(255) NOT NULL DEFAULT '''' AFTER `content`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
