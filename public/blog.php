<?php
/**
 * Blog público servido desde MySQL.
 *
 * El diseño lo genera Astro en dos plantillas (plantillas/blog-lista y plantillas/blog-articulo);
 * aquí solo se sustituyen los marcadores @@…@@ por los datos de la noticia. Así el sitio sigue
 * siendo estático y rápido, pero las noticias se publican desde el panel sin recompilar.
 *
 * .htaccess envía aquí  /blog  y  /blog/<slug>
 */

require_once __DIR__ . '/api/db.php';
require_once __DIR__ . '/api/markdown.php';

const BLOG_SITE_NAME = 'BrandMeister Venezuela';

function blog_site_url() {
    $configured = rtrim(trim((string)getenv('SITE_URL')), '/');
    if ($configured !== '') return $configured;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = preg_replace('/[^a-z0-9.:-]/i', '', $_SERVER['HTTP_HOST'] ?? '') ?: 'brandmeisteryv.net';
    return ($https ? 'https' : 'http') . '://' . $host;
}

function blog_template($name) {
    $file = __DIR__ . "/plantillas/blog-$name/index.html";
    if (!is_file($file)) {
        $dist = dirname(__DIR__) . "/dist/plantillas/blog-$name/index.html";
        if (is_file($dist)) {
            return file_get_contents($dist);
        }
        error_log("[BM-YV] Falta la plantilla del blog: $file");
        http_response_code(500);
        exit('El blog no está disponible en este momento.');
    }
    return file_get_contents($file);
}

/** Devuelve el HTML interno de <template data-bm-plantilla="x"> y lo quita de la página */
function blog_extract_template(&$html, $name) {
    $pattern = '#<template data-bm-plantilla="' . preg_quote($name, '#') . '"\s*>(.*?)</template>#s';
    if (!preg_match($pattern, $html, $m)) {
        return '';
    }
    $html = preg_replace($pattern, '', $html, 1);
    return $m[1];
}

/** Quita los bloques marcados con data-bm-opcional cuando no hay dato (p. ej. sin imagen) */
function blog_drop_optional($html, $name) {
    return preg_replace('#<(figure|a|div)[^>]*data-bm-opcional="' . preg_quote($name, '#') . '"[^>]*>.*?</\1>#s', '', $html);
}

function blog_fill($template, array $values) {
    return str_replace(
        array_map(function ($k) { return "@@$k@@"; }, array_keys($values)),
        array_values($values),
        $template
    );
}

function e($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

/** Sustituye título y descripción también en las etiquetas de redes sociales del <head> */
function blog_head(&$html, $title, $description, $canonical, $image = null) {
    $html = str_replace(
        ['@@META_TITULO@@', '@@META_DESCRIPCION@@'],
        [e($title), e($description)],
        $html
    );
    $html = preg_replace('#<title>.*?</title>#s', '<title>' . e($title) . '</title>', $html, 1);
    $html = preg_replace('#(<meta name="description" content=")[^"]*(")#', '${1}' . e($description) . '${2}', $html, 1);
    $html = preg_replace('#(<link rel="canonical" href=")[^"]*(")#', '${1}' . e($canonical) . '${2}', $html, 1);
    $html = preg_replace('#(<meta property="og:url" content=")[^"]*(")#', '${1}' . e($canonical) . '${2}', $html, 1);
    foreach ([['og:title', $title], ['twitter:title', $title], ['og:description', $description], ['twitter:description', $description]] as [$prop, $value]) {
        $html = preg_replace('#(<meta (?:property|name)="' . $prop . '" content=")[^"]*(")#', '${1}' . e($value) . '${2}', $html, 1);
    }
    if ($image) {
        foreach (['og:image', 'twitter:image', 'og:image:secure_url'] as $prop) {
            $html = preg_replace('#(<meta (?:property|name)="' . $prop . '" content=")[^"]*(")#', '${1}' . e($image) . '${2}', $html, 1);
        }
    }
    $html = preg_replace('#(<meta property="og:type" content=")[^"]*(")#', '${1}article${2}', $html, 1);
}

function blog_fecha_larga($ts) {
    $meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return (int)date('j', $ts) . ' de ' . $meses[(int)date('n', $ts) - 1] . ' de ' . date('Y', $ts);
}

$pdo = get_db_connection();
if (!$pdo) {
    http_response_code(503);
    exit('El blog no está disponible en este momento.');
}

$slug = isset($_GET['slug']) ? preg_replace('/[^a-z0-9_-]/i', '', (string)$_GET['slug']) : '';
$siteUrl = blog_site_url();

// --------------------------------------------------------------------
// Detalle de la noticia
// --------------------------------------------------------------------
if ($slug !== '') {
    $stmt = $pdo->prepare("SELECT p.*, UNIX_TIMESTAMP(p.created_at) AS ts, u.full_name AS author_name, u.callsign AS author_callsign
        FROM bm_posts p JOIN bm_users u ON u.id = p.author_id
        WHERE p.slug = :slug AND p.status = 'published' LIMIT 1");
    $stmt->execute([':slug' => $slug]);
    $post = $stmt->fetch();

    if (!$post) {
        http_response_code(404);
        $html = blog_template('lista');
        blog_extract_template($html, 'articulo');
        blog_extract_template($html, 'categoria');
        blog_extract_template($html, 'etiqueta');
        blog_head($html, 'Noticia no encontrada · ' . BLOG_SITE_NAME, 'La noticia que buscas no existe o fue retirada.', "$siteUrl/blog");
        $html = blog_fill($html, [
            'TOTAL' => '0',
            'CATEGORIAS' => '',
            'ARTICULOS' => '<p class="archive-empty">La noticia que buscas no existe o fue retirada. <a href="/blog">Ver todas las noticias</a>.</p>',
        ]);
        echo $html;
        exit;
    }

    // Contador de lecturas (no interrumpe la página si falla)
    try {
        $pdo->prepare('UPDATE bm_posts SET views_count = views_count + 1 WHERE id = :id')->execute([':id' => $post['id']]);
    } catch (Exception $e) {
        error_log('[BM-YV] views_count: ' . $e->getMessage());
    }

    $html = blog_template('articulo');
    $tagTemplate = blog_extract_template($html, 'etiqueta');

    $url = "$siteUrl/blog/" . $post['slug'];
    $tags = array_values(array_filter(array_map('trim', explode(',', (string)$post['tags']))));
    $tagsHtml = implode("\n", array_map(function ($tag) use ($tagTemplate) {
        return blog_fill($tagTemplate, ['ETIQUETA' => e($tag)]);
    }, $tags));

    $imagen = (string)($post['image_url'] ?? '');
    if ($imagen === '') {
        $html = blog_drop_optional($html, 'imagen');
    }
    blog_head($html, $post['title'] . ' · ' . BLOG_SITE_NAME, $post['description'], $url, $imagen ? $siteUrl . $imagen : null);
    $html = blog_fill($html, [
        'TITULO' => e($post['title']),
        'DESCRIPCION' => e($post['description']),
        'CATEGORIA' => e($post['category']),
        'TIEMPO_LECTURA' => e($post['read_time']),
        'AUTOR' => e($post['author_name']),
        'INDICATIVO' => e($post['author_callsign']),
        'FECHA_ISO' => date('c', (int)$post['ts']),
        'FECHA_LARGA' => blog_fecha_larga((int)$post['ts']),
        'CONTENIDO' => bm_markdown($post['content']),
        'IMAGEN' => e($imagen),
        'ETIQUETAS' => $tagsHtml,
        'URL' => e($url),
        'URL_CODIFICADA' => rawurlencode($url),
        'TITULO_URL' => rawurlencode($post['title']),
        'COMPARTIR_TEXTO_URL' => rawurlencode($post['title'] . ' - ' . $url),
    ]);

    // La etiqueta del indicativo se oculta si el autor no tiene
    if (trim((string)$post['author_callsign']) === '') {
        $html = preg_replace('#<span class="callsign-chip">\s*</span>#', '', $html, 1);
    }
    if (!$tags) {
        $html = preg_replace('#<div class="article-tags-row">.*?</div>\s*</div>#s', '', $html, 1);
    }

    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo $html;
    exit;
}

// --------------------------------------------------------------------
// Listado
// --------------------------------------------------------------------
$stmt = $pdo->query("SELECT p.*, UNIX_TIMESTAMP(p.created_at) AS ts, u.full_name AS author_name, u.callsign AS author_callsign
    FROM bm_posts p JOIN bm_users u ON u.id = p.author_id
    WHERE p.status = 'published' ORDER BY p.created_at DESC LIMIT 60");
$posts = $stmt->fetchAll();

$html = blog_template('lista');
$itemTemplate = blog_extract_template($html, 'articulo');
$categoryTemplate = blog_extract_template($html, 'categoria');
$tagTemplate = blog_extract_template($html, 'etiqueta');

$categories = [];
$items = [];
foreach ($posts as $post) {
    $categories[$post['category']] = true;
    $tags = array_values(array_filter(array_map('trim', explode(',', (string)$post['tags']))));
    $item = (string)($post['image_url'] ?? '') === '' ? blog_drop_optional($itemTemplate, 'imagen') : $itemTemplate;
    $items[] = blog_fill($item, [
        'IMAGEN' => e((string)($post['image_url'] ?? '')),
        'CATEGORIA' => e($post['category']),
        'FECHA_ISO' => date('c', (int)$post['ts']),
        'FECHA' => blog_fecha_larga((int)$post['ts']),
        'TIEMPO_LECTURA' => e($post['read_time']),
        'SLUG' => e($post['slug']),
        'TITULO' => e($post['title']),
        'DESCRIPCION' => e($post['description']),
        'AUTOR' => e($post['author_name']),
        'INDICATIVO' => e($post['author_callsign']),
        'ETIQUETAS' => implode('', array_map(function ($tag) use ($tagTemplate) {
            return blog_fill($tagTemplate, ['ETIQUETA' => e($tag)]);
        }, $tags)),
    ]);
}

$categoryButtons = implode("\n", array_map(function ($category) use ($categoryTemplate) {
    return blog_fill($categoryTemplate, ['CATEGORIA' => e($category)]);
}, array_keys($categories)));

blog_head(
    $html,
    'Noticias & Comunicados Técnicos · ' . BLOG_SITE_NAME,
    'Noticias, guías de configuración de hotspots, protocolos de emergencia y novedades de la comunidad BrandMeister Venezuela DMR.',
    "$siteUrl/blog"
);
$html = blog_fill($html, [
    'TOTAL' => (string)count($posts),
    'CATEGORIAS' => $categoryButtons,
    'ARTICULOS' => $items ? implode("\n", $items) : '<p class="archive-empty">Todavía no hay noticias publicadas.</p>',
]);

header('Cache-Control: no-cache, no-store, must-revalidate');
echo $html;
