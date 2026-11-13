<?php
/**
 * Sitemap dinámico para artículos del blog (noticias).
 *
 * Devuelve un XML conforme a Sitemaps 0.9 + extensión de imágenes de Google.
 * Cabecera X-Robots-Tag: noindex para que el archivo mismo no se indexe.
 *
 * URL: https://brandmeisteryv.net/api/sitemap-blog.php
 *
 * Tabla:   bm_posts
 * Columnas usadas:
 *   slug          → segmento de URL del artículo
 *   title         → título (usado en <image:title>)
 *   image_url     → ruta relativa de la imagen destacada (p. ej. /media/noticias/xxx.webp)
 *   created_at    → fecha de publicación (DATETIME)
 *   status        → solo se incluyen las filas con status = 'published'
 */

require_once __DIR__ . '/db.php';   // get_db_connection(), env.php y config.php

const SITE_BASE = 'https://brandmeisteryv.net';

// ---------------------------------------------------------------------------
// Cabeceras HTTP
// ---------------------------------------------------------------------------
header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: public, max-age=3600');   // cacheable 1 h

// ---------------------------------------------------------------------------
// Función auxiliar: escapa caracteres especiales XML
// ---------------------------------------------------------------------------
function xml_e(string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

// ---------------------------------------------------------------------------
// Consulta a la base de datos
// ---------------------------------------------------------------------------
$pdo  = get_db_connection();
$rows = [];

if ($pdo) {
    try {
        $stmt = $pdo->prepare(
            "SELECT slug, title, image_url, DATE(created_at) AS lastmod
               FROM bm_posts
              WHERE status = 'published'
              ORDER BY created_at DESC
              LIMIT 1000"
        );
        $stmt->execute();
        $rows = $stmt->fetchAll();
    } catch (Exception $e) {
        // Si la consulta falla, devolvemos un sitemap vacío válido
        error_log('[BM-YV sitemap-blog] ' . $e->getMessage());
        $rows = [];
    }
} else {
    // BD no disponible → sitemap vacío válido (nunca un 500)
    error_log('[BM-YV sitemap-blog] No se pudo conectar a la base de datos.');
}

// ---------------------------------------------------------------------------
// Generación del XML
// ---------------------------------------------------------------------------
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
echo '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

foreach ($rows as $row) {
    $slug    = trim((string)($row['slug']      ?? ''));
    $title   = trim((string)($row['title']     ?? ''));
    $imgUrl  = trim((string)($row['image_url'] ?? ''));
    $lastmod = trim((string)($row['lastmod']   ?? ''));

    if ($slug === '') {
        continue;   // entrada inválida, omitir
    }

    // Normalizar lastmod a YYYY-MM-DD
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $lastmod)) {
        $lastmod = date('Y-m-d');
    }

    echo "  <url>\n";
    echo '    <loc>' . xml_e(SITE_BASE . '/blog/' . $slug) . "</loc>\n";
    echo '    <lastmod>' . xml_e($lastmod) . "</lastmod>\n";
    echo "    <changefreq>never</changefreq>\n";
    echo "    <priority>0.75</priority>\n";

    // Imagen destacada (solo si existe)
    if ($imgUrl !== '') {
        // image_url puede ser una ruta relativa (/media/…) o una URL completa
        $fullImg = str_starts_with($imgUrl, 'http') ? $imgUrl : SITE_BASE . $imgUrl;
        echo "    <image:image>\n";
        echo '      <image:loc>' . xml_e($fullImg) . "</image:loc>\n";
        if ($title !== '') {
            echo '      <image:title>' . xml_e($title) . "</image:title>\n";
        }
        echo "    </image:image>\n";
    }

    echo "  </url>\n";
}

echo "</urlset>\n";
