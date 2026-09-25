-- ====================================================================
-- Migración 008: Uso del generador de codeplugs y del buscador de indicativos
--
-- Dos eventos nuevos para el Escritorio:
--   codeplug_download  el generador (que ahora arma el archivo en el navegador) avisa de cada
--                      descarga: modelo de radio, alcance y contenido
--   callsign_lookup    el buscador /radioid avisa de cada consulta, encuentre o no resultados.
--                      La página ya intentaba registrarlas con un tipo que no existía ('search'),
--                      así que hasta ahora no se había guardado ninguna.
--
-- Ejecutar en phpMyAdmin (cPanel). Es seguro ejecutarla dos veces: solo añade valores al final
-- de la lista de tipos y no toca los eventos guardados.
-- ====================================================================

ALTER TABLE `bm_analytics_events`
  MODIFY `event_type` ENUM(
    'player_play', 'link_click', 'post_view', 'post_share', 'page_view',
    'codeplug_download', 'callsign_lookup'
  ) NOT NULL;
