-- ====================================================================
-- Migración 002: la galería deja de conectarse a Instagram
-- Borra las credenciales y el token de Instagram guardados y permite publicaciones sin enlace.
-- Ejecutar una vez en phpMyAdmin. Es segura de repetir.
-- ====================================================================

DELETE FROM `bm_site_settings` WHERE `setting_key` LIKE 'instagram\_%';

ALTER TABLE `bm_gallery_posts` MODIFY `permalink` VARCHAR(255) NOT NULL DEFAULT '';
