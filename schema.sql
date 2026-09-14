-- ====================================================================
-- BrandMeister Venezuela - Esquema de Base de Datos MySQL
-- Base de Datos: `bmvenezuela`
-- Compatible con MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+ y DBngin / DBng
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `bmvenezuela` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bmvenezuela`;

-- --------------------------------------------------------------------
-- 1. Tabla de Usuarios y Control de Acceso (ACL)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `bm_users`;
CREATE TABLE `bm_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `callsign` VARCHAR(20) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'editor', 'author') NOT NULL DEFAULT 'author',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `avatar_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_role` (`role`),
  INDEX `idx_callsign` (`callsign`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Tabla de Noticias (Posts)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `bm_posts`;
CREATE TABLE `bm_posts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `category` VARCHAR(60) NOT NULL DEFAULT 'General',
  `tags` VARCHAR(255) NOT NULL DEFAULT '',
  `read_time` VARCHAR(40) NOT NULL DEFAULT '4 min de lectura',
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('published', 'draft', 'trash') NOT NULL DEFAULT 'published',
  `author_id` INT UNSIGNED NOT NULL,
  `views_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`),
  INDEX `idx_author` (`author_id`),
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `bm_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Tabla de Parámetros y Ajustes del Sitio
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `bm_site_settings`;
CREATE TABLE `bm_site_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` LONGTEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Tabla de Registros de Auditoría y Actividad
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `bm_activity_logs`;
CREATE TABLE `bm_activity_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(80) NOT NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_log_user` (`user_id`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `bm_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Tabla de Mensajes de Contacto (Formulario Web con reCAPTCHA)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `bm_contact_messages`;
CREATE TABLE `bm_contact_messages` (
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
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Tabla de Publicaciones de Galería Instagram (#experienciadmr)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `bm_gallery_posts`;
CREATE TABLE `bm_gallery_posts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `instagram_id` VARCHAR(100) NULL UNIQUE,
  `shortcode` VARCHAR(50) NULL,
  `permalink` VARCHAR(255) NOT NULL,
  `media_type` ENUM('IMAGE', 'CAROUSEL_ALBUM', 'VIDEO') NOT NULL DEFAULT 'IMAGE',
  `media_url` TEXT NOT NULL,
  `thumbnail_url` TEXT NULL,
  `carousel_json` LONGTEXT NULL,
  `video_url` TEXT NULL,
  `caption` TEXT NULL,
  `author` VARCHAR(80) NOT NULL DEFAULT '@brandmeister_yv',
  `likes_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `comments_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `published_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('published', 'hidden') NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ig_id` (`instagram_id`),
  INDEX `idx_media_type` (`media_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- DATOS INICIALES (SEED DATA)
-- ====================================================================

-- 1. Usuarios Sysops y Administradores (Contraseña por defecto: bm734venezuela)
-- Hash generado con password_hash('bm734venezuela', PASSWORD_BCRYPT)
INSERT INTO `bm_users` (`id`, `username`, `callsign`, `full_name`, `email`, `password_hash`, `role`, `status`) VALUES
(1, 'yv5of', 'YV5OF', 'Severino Mastracci', 'yv5of@brandmeisteryv.net', '$2y$10$wN9v.l50j1rL8gC7N4tXq.3R7wG4J3VbN6qQ1gU7J8K9l0M1N2O3P', 'admin', 'active'),
(2, 'yy3big', 'YY3BIG', 'Yury', 'yy3big@brandmeisteryv.net', '$2y$10$wN9v.l50j1rL8gC7N4tXq.3R7wG4J3VbN6qQ1gU7J8K9l0M1N2O3P', 'admin', 'active'),
(3, 'yv5adm', 'YV5ADM', 'Arnaldo', 'yv5adm@brandmeisteryv.net', '$2y$10$wN9v.l50j1rL8gC7N4tXq.3R7wG4J3VbN6qQ1gU7J8K9l0M1N2O3P', 'editor', 'active'),
(4, 'yv5ve', 'YV5VE', 'Will', 'yv5ve@brandmeisteryv.net', '$2y$10$wN9v.l50j1rL8gC7N4tXq.3R7wG4J3VbN6qQ1gU7J8K9l0M1N2O3P', 'editor', 'active'),
(5, 'autor_demo', 'YV5DEMO', 'Colaborador Radioaficionado', 'colaborador@brandmeisteryv.net', '$2y$10$wN9v.l50j1rL8gC7N4tXq.3R7wG4J3VbN6qQ1gU7J8K9l0M1N2O3P', 'author', 'active');

-- 2. Noticias Iniciales
INSERT INTO `bm_posts` (`id`, `title`, `slug`, `description`, `content`, `category`, `tags`, `read_time`, `featured`, `status`, `author_id`) VALUES
(1, 'Evolución y estado del sistema Petra para el TG 734 en Venezuela', 'petra-telemetria-tg734', 'Descubre cómo funciona la plataforma comunitaria Petra, desarrollada por YY3BIG para medir la actividad, salud del anunciador y ocupación espectral en BrandMeister Venezuela.', 'El proyecto **Petra** nació como una iniciativa tecnológica comunitaria dentro de **BrandMeister Venezuela** con el firme propósito de ofrecer a los radioaficionados una ventana transparente, en tiempo real y visualmente intuitiva sobre el comportamiento del **Talkgroup Nacional 734**.\n\nDisponible públicamente en [petra.brandmeisteryv.net](https://petra.brandmeisteryv.net/), la herramienta ha evolucionado hasta convertirse en un punto de referencia diario para operadores en Venezuela y en el extranjero.\n\n### ¿Qué problemas resuelve Petra?\n\n1. **Mapa de Calor de Ocupación:** Representa gráficamente las horas pico y valles de transmisión a lo largo de cada semana.\n2. **Salud del Anunciador Automático:** Verifica el estado operativo de los avisos de voz que identifican periódicamente el canal nacional.\n3. **Registro de Últimas Transmisiones:** Proporciona un feed inmediato de los indicativos que han presionado PTT en el TG 734.', 'Innovación', 'Petra, Telemetría, TG734, Desarrollo', '5 min de lectura', 1, 'published', 2),

(2, 'Guía esencial: Configuración de Hotspots DMR en BrandMeister Venezuela', 'configuracion-hotspots-dmr-venezuela', 'Paso a paso para configurar tu hotspot MMDVM (Pi-Star / WPSD) conectado a los servidores máster 3341 y 7301 con los parámetros oficiales recomendados.', 'Los puntos de acceso personales (**Hotspots**) basados en placas MMDVM y sistemas como **Pi-Star** o **WPSD** han democratizado el acceso a la voz digital en Venezuela.\n\n### 1. Frecuencias de Operación\n- **VHF:** 146.550 MHz (Alterna: 146.490 MHz)\n- **UHF:** 436.550 MHz (Alterna: 436.490 MHz)\n- **Color Code:** CC1\n\n### 2. Servidores Máster\n- Primario: BM_3341_Mexico\n- Alterno: BM_7301_Chile', 'Guías Técnicas', 'Hotspots, Pi-Star, MMDVM, Configuración', '6 min de lectura', 0, 'published', 1),

(3, 'Protocolo de operación en emergencias con el TG 734911 y Radio Club Venezolano', 'red-emergencia-tg734911', 'Directrices para el uso del canal de emergencias de BrandMeister Venezuela, coordinación con YV5RNE y recomendaciones de escucha activa en repetidores.', 'El servicio de radioaficionados cumple su misión más noble cuando los sistemas comerciales de telecomunicaciones fallan ante fenómenos naturales o desastres de gran magnitud.\n\n### Canal Prioritario: TG 734911 (Slot 1)\nEstrictamente reservado para alertas tempranas y auxilio de la Red Nacional de Emergencia (YV5RNE).', 'Operación', 'Emergencias, EMCOM, YV5RNE, RCV, TG734911', '4 min de lectura', 0, 'published', 3),

(4, 'Actualización RadioID.net: Proceso anual de verificación y preservación de IDs DMR', 'verificacion-radioid-dmr', 'Todo lo que necesitas saber sobre el proceso anual de confirmación de RadioID.net y cómo mantener tu identificador DMR activo para operar en BrandMeister.', 'Los identificadores numéricos de 7 dígitos utilizados en DMR son un recurso finito administrado por RadioID.net.\n\nCada usuario debe confirmar anualmente su cuenta para mantener sus IDs activos.', 'Comunidad', 'RadioID, Normativa, DMR, Tutorial', '3 min de lectura', 0, 'published', 1);

-- 3. Parámetros del Sitio
INSERT INTO `bm_site_settings` (`setting_key`, `setting_value`) VALUES
('hero_title', 'La voz digital que une a los radioaficionados de Venezuela y el mundo.'),
('hero_description', 'Infraestructura abierta y 100% digital basada en el estándar DMR. Conectamos repetidores, puntos de acceso de alta potencia y operadores en todo el territorio nacional con acceso directo a la red global BrandMeister.'),
('emergency_alert', 'Reservado exclusivamente para prevención, boletines por fenómenos meteorológicos, alertas sísmicas o contingencias mayores. Se recomienda a todos los radioaficionados mantenerlo programado en su lista de recepción (RX List) bajo el Slot 1 en todos los repetidores del país.'),
('freq_vhf', '146.550 MHz (Alterna: 146.490 MHz)'),
('freq_uhf', '436.550 MHz (Alterna: 436.490 MHz)'),
('master_servers', '3341 México / 7301 Chile'),
('contact_email', 'sysop@brandmeisteryv.net'),
('instagram_app_id', ''),
('instagram_app_secret', ''),
('instagram_access_token', ''),
('instagram_hashtag', 'experienciadmr'),
('instagram_account', 'brandmeister_yv'),
('instagram_last_sync', '');
