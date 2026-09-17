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

-- --------------------------------------------------------------------
-- Datos iniciales representativos para la visualización de analíticas
-- Múltiples puntos para probar el agrupamiento (clustering) en Leaflet
-- --------------------------------------------------------------------

INSERT INTO `bm_analytics_events` 
(`event_type`, `event_category`, `entity_id`, `entity_title`, `platform`, `ip_address`, `country_code`, `country_name`, `city`, `latitude`, `longitude`, `device_type`, `created_at`) 
VALUES
-- Reproductor de Audio (Venezuela - Caracas: varios en cluster)
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '190.202.14.82', 'VE', 'Venezuela', 'Caracas', 10.4806, -66.9036, 'desktop', NOW() - INTERVAL 1 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '190.202.14.82', 'VE', 'Venezuela', 'Caracas', 10.4820, -66.9050, 'desktop', NOW() - INTERVAL 2 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '201.243.32.11', 'VE', 'Venezuela', 'Caracas (El Hatillo)', 10.4264, -66.8256, 'mobile', NOW() - INTERVAL 4 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '186.92.204.55', 'VE', 'Venezuela', 'Caracas (Chacao)', 10.4925, -66.8569, 'desktop', NOW() - INTERVAL 6 HOUR),

-- Reproductor de Audio (Venezuela - Valencia y Maracay: cluster central)
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '200.84.18.90', 'VE', 'Venezuela', 'Valencia', 10.1620, -68.0077, 'mobile', NOW() - INTERVAL 3 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '200.84.18.90', 'VE', 'Venezuela', 'Valencia', 10.1630, -68.0060, 'mobile', NOW() - INTERVAL 5 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '190.73.44.120', 'VE', 'Venezuela', 'Maracay', 10.2469, -67.5958, 'desktop', NOW() - INTERVAL 7 HOUR),

-- Reproductor de Audio (Venezuela - Maracaibo y Barquisimeto: cluster occidente)
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '186.94.101.44', 'VE', 'Venezuela', 'Maracaibo', 10.6427, -71.6125, 'desktop', NOW() - INTERVAL 30 MINUTE),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '186.94.101.44', 'VE', 'Venezuela', 'Maracaibo', 10.6450, -71.6110, 'desktop', NOW() - INTERVAL 90 MINUTE),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '201.209.65.18', 'VE', 'Venezuela', 'Barquisimeto', 10.0678, -69.3474, 'mobile', NOW() - INTERVAL 8 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '190.207.12.8', 'VE', 'Venezuela', 'San Cristóbal', 7.7669, -72.2250, 'desktop', NOW() - INTERVAL 12 HOUR),

-- Reproductor de Audio (Internacional - Oyentes de la diáspora)
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '104.28.19.45', 'US', 'Estados Unidos', 'Miami, FL', 25.7617, -80.1918, 'desktop', NOW() - INTERVAL 20 MINUTE),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '104.28.19.45', 'US', 'Estados Unidos', 'Miami, FL', 25.7650, -80.1900, 'desktop', NOW() - INTERVAL 40 MINUTE),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '72.14.201.88', 'US', 'Estados Unidos', 'Orlando, FL', 28.5383, -81.3792, 'mobile', NOW() - INTERVAL 5 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '88.12.45.190', 'ES', 'España', 'Madrid', 40.4168, -3.7038, 'desktop', NOW() - INTERVAL 2 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '83.35.102.14', 'ES', 'España', 'Barcelona', 41.3874, 2.1686, 'desktop', NOW() - INTERVAL 10 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '181.143.20.9', 'CO', 'Colombia', 'Bogotá', 4.7110, -74.0721, 'mobile', NOW() - INTERVAL 14 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '190.161.80.32', 'CL', 'Chile', 'Santiago', -33.4489, -70.6693, 'mobile', NOW() - INTERVAL 18 HOUR),
('player_play', 'audio', 'tg-734', 'TG 734 Hoseline Audio', 'web', '181.44.150.77', 'AR', 'Argentina', 'Buenos Aires', -34.6037, -58.3816, 'desktop', NOW() - INTERVAL 1 DAY),

-- Clics en Enlaces Clave
('link_click', 'link', 'bm-master', 'BrandMeister Server Master 3341', 'web', '190.202.14.82', 'VE', 'Venezuela', 'Caracas', 10.4806, -66.9036, 'desktop', NOW() - INTERVAL 3 HOUR),
('link_click', 'link', 'radioid-net', 'RadioID.net Registro Oficial', 'web', '200.84.18.90', 'VE', 'Venezuela', 'Valencia', 10.1620, -68.0077, 'mobile', NOW() - INTERVAL 4 HOUR),
('link_click', 'link', 'telegram-group', 'Comunidad Telegram TG 734', 'web', '186.94.101.44', 'VE', 'Venezuela', 'Maracaibo', 10.6427, -71.6125, 'mobile', NOW() - INTERVAL 6 HOUR),
('link_click', 'link', 'hoseline-bm', 'BrandMeister Hoseline Web Global', 'web', '104.28.19.45', 'US', 'Estados Unidos', 'Miami, FL', 25.7617, -80.1918, 'desktop', NOW() - INTERVAL 9 HOUR),
('link_click', 'link', 'rep-yv5dmr', 'Ficha Repetidor YV5DMR Caracas', 'web', '201.243.32.11', 'VE', 'Venezuela', 'Caracas', 10.4264, -66.8256, 'mobile', NOW() - INTERVAL 11 HOUR),
('link_click', 'link', 'rep-yv4egg', 'Ficha Repetidor YV4EGG Carabobo', 'web', '200.84.18.90', 'VE', 'Venezuela', 'Valencia', 10.1620, -68.0077, 'desktop', NOW() - INTERVAL 13 HOUR),

-- Lecturas y Clics de Publicaciones del Blog
('post_view', 'blog', 'petra-telemetria-tg734', 'Evolución y estado del sistema Petra para el TG 734 en Venezuela', 'web', '190.202.14.82', 'VE', 'Venezuela', 'Caracas', 10.4806, -66.9036, 'desktop', NOW() - INTERVAL 2 HOUR),
('post_view', 'blog', 'configuracion-hotspots-dmr-venezuela', 'Guía esencial: Configuración de Hotspots DMR en BrandMeister Venezuela', 'web', '104.28.19.45', 'US', 'Estados Unidos', 'Miami, FL', 25.7617, -80.1918, 'desktop', NOW() - INTERVAL 5 HOUR),
('post_view', 'blog', 'red-emergencia-tg734911', 'Protocolo de operación en emergencias con el TG 734911', 'web', '88.12.45.190', 'ES', 'España', 'Madrid', 40.4168, -3.7038, 'desktop', NOW() - INTERVAL 8 HOUR),
('post_view', 'blog', 'verificacion-radioid-dmr', 'Actualización RadioID.net: Proceso anual de verificación', 'web', '186.94.101.44', 'VE', 'Venezuela', 'Maracaibo', 10.6427, -71.6125, 'mobile', NOW() - INTERVAL 12 HOUR),

-- Compartidos en Redes Sociales
('post_share', 'social', 'petra-telemetria-tg734', 'Evolución y estado del sistema Petra para el TG 734', 'whatsapp', '190.202.14.82', 'VE', 'Venezuela', 'Caracas', 10.4806, -66.9036, 'mobile', NOW() - INTERVAL 1 HOUR),
('post_share', 'social', 'configuracion-hotspots-dmr-venezuela', 'Guía esencial: Configuración de Hotspots DMR', 'whatsapp', '200.84.18.90', 'VE', 'Venezuela', 'Valencia', 10.1620, -68.0077, 'mobile', NOW() - INTERVAL 3 HOUR),
('post_share', 'social', 'petra-telemetria-tg734', 'Evolución y estado del sistema Petra para el TG 734', 'telegram', '186.94.101.44', 'VE', 'Venezuela', 'Maracaibo', 10.6427, -71.6125, 'desktop', NOW() - INTERVAL 4 HOUR),
('post_share', 'social', 'red-emergencia-tg734911', 'Protocolo de operación en emergencias con el TG 734911', 'telegram', '201.243.32.11', 'VE', 'Venezuela', 'Caracas', 10.4264, -66.8256, 'mobile', NOW() - INTERVAL 7 HOUR),
('post_share', 'social', 'verificacion-radioid-dmr', 'Actualización RadioID.net: Proceso anual de verificación', 'twitter', '104.28.19.45', 'US', 'Estados Unidos', 'Miami, FL', 25.7617, -80.1918, 'desktop', NOW() - INTERVAL 10 HOUR),
('post_share', 'social', 'configuracion-hotspots-dmr-venezuela', 'Guía esencial: Configuración de Hotspots DMR', 'copy_link', '88.12.45.190', 'ES', 'España', 'Madrid', 40.4168, -3.7038, 'desktop', NOW() - INTERVAL 16 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
