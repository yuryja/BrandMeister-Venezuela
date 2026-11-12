<?php
/**
 * sitemap.xml dinámico: las páginas fijas salen de public/sitemap.xml (base estática)
 * y se añaden las noticias publicadas del blog con su fecha real de modificación.
 * Si la base de datos no responde, se sirve la base estática tal cual.
 *
 * .htaccess envía aquí  /sitemap.xml
 */

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

$base = @file_get_contents(__DIR__ . '/sitemap.xml');
if ($base === false || strpos($base, '</urlset>') === false) {
    http_response_code(503);
    exit;
}

$extra = '';
try {
    require_once __DIR__ . '/api/db.php';
    $pdo = get_db_connection();
    if ($pdo) {
        $rows = $pdo->query("SELECT slug, updated_at, created_at FROM bm_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 1000");
        foreach ($rows as $row) {
            $slug = preg_replace('/[^a-z0-9_-]/i', '', (string)$row['slug']);
            if ($slug === '') continue;
            $ts = strtotime((string)($row['updated_at'] ?: $row['created_at']));
            $extra .= "  <url>\n"
                . '    <loc>https://brandmeisteryv.net/blog/' . $slug . "</loc>\n"
                . ($ts ? '    <lastmod>' . gmdate('Y-m-d', $ts) . "</lastmod>\n" : '')
                . "    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n";
        }
    }
} catch (Throwable $e) {
    $extra = '';
}

echo str_replace('</urlset>', $extra . '</urlset>', $base);
