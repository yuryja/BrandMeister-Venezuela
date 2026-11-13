<?php
/**
 * sitemap.xml dinámico de BrandMeister Venezuela.
 *
 * Fusiona las páginas institucionales fijas (definidas en public/sitemap.xml)
 * con todos los artículos publicados en la base de datos MySQL (bm_posts):
 * - Extracción en tiempo real: cada nuevo post publicado en el panel aparece al instante.
 * - Fecha exacta de modificación (lastmod en formato YYYY-MM-DD).
 * - Extensión de imágenes de Google (<image:image>) con título e imagen destacada
 *   para indexación en Google Discover y Google Imágenes.
 * - Si la base de datos no estuviera disponible, se devuelve la base estática sin fallar (cero 500).
 *
 * Enrutado transparente vía .htaccess:
 *   GET /sitemap.xml → /sitemap.php
 */

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=1800, s-maxage=3600');
header('X-Robots-Tag: noindex');

$base = @file_get_contents(__DIR__ . '/sitemap.xml');
if ($base === false || strpos($base, '</urlset>') === false) {
    http_response_code(503);
    exit;
}

const SITE_URL = 'https://brandmeisteryv.net';

/**
 * Escapado seguro para contenido XML conforme al estándar W3C.
 */
function sitemap_xml_e(string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

$extra = '';

try {
    require_once __DIR__ . '/api/db.php';
    $pdo = get_db_connection();

    if ($pdo) {
        $stmt = $pdo->prepare(
            "SELECT slug, title, image_url, updated_at, created_at
               FROM bm_posts
              WHERE status = 'published'
              ORDER BY created_at DESC
              LIMIT 1000"
        );
        $stmt->execute();
        $posts = $stmt->fetchAll();

        if (!empty($posts)) {
            $extra .= "\n  <!-- ================================================================== -->\n";
            $extra .= "  <!-- Artículos y Noticias del Blog generados dinámicamente desde MySQL -->\n";
            $extra .= "  <!-- ================================================================== -->\n";

            foreach ($posts as $post) {
                $slug = trim((string)($post['slug'] ?? ''));
                if ($slug === '') continue;

                $title   = trim((string)($post['title'] ?? ''));
                $imgUrl  = trim((string)($post['image_url'] ?? ''));
                $dateRaw = $post['updated_at'] ?: $post['created_at'];
                $ts      = strtotime((string)$dateRaw);
                $lastmod = $ts ? gmdate('Y-m-d', $ts) : date('Y-m-d');

                $extra .= "  <url>\n";
                $extra .= "    <loc>" . sitemap_xml_e(SITE_URL . '/blog/' . $slug) . "</loc>\n";
                $extra .= "    <lastmod>" . $lastmod . "</lastmod>\n";
                $extra .= "    <changefreq>weekly</changefreq>\n";
                $extra .= "    <priority>0.75</priority>\n";

                if ($imgUrl !== '') {
                    $fullImg = str_starts_with($imgUrl, 'http') ? $imgUrl : SITE_URL . $imgUrl;
                    $extra .= "    <image:image>\n";
                    $extra .= "      <image:loc>" . sitemap_xml_e($fullImg) . "</image:loc>\n";
                    if ($title !== '') {
                        $extra .= "      <image:title>" . sitemap_xml_e($title) . "</image:title>\n";
                    }
                    $extra .= "    </image:image>\n";
                }

                $extra .= "  </url>\n";
            }
        }
    }
} catch (Throwable $e) {
    error_log('[BM-YV sitemap.php] Error al consultar bm_posts: ' . $e->getMessage());
    $extra = '';
}

echo str_replace('</urlset>', $extra . '</urlset>', $base);
