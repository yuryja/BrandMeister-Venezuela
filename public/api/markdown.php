<?php
/**
 * Conversor de Markdown a HTML, reducido a lo que usa el editor de noticias.
 * Todo el texto se escapa primero: el HTML que venga en el contenido nunca se ejecuta.
 *
 * Soporta: encabezados (##, ###), negrita, cursiva, código, enlaces, imágenes,
 * listas con viñetas y numeradas, citas, líneas horizontales, bloques de código y párrafos.
 */

if (!function_exists('bm_markdown')) {

    function bm_markdown($markdown) {
        $text = str_replace(["\r\n", "\r"], "\n", (string)$markdown);
        $blocks = [];

        // Los bloques de código se apartan antes de escapar el resto
        $text = preg_replace_callback('/```[a-z]*\n(.*?)```/s', function ($m) use (&$blocks) {
            $blocks[] = '<pre><code>' . htmlspecialchars($m[1], ENT_QUOTES, 'UTF-8') . '</code></pre>';
            return "\n\x00BLOQUE" . (count($blocks) - 1) . "\x00\n";
        }, $text);

        $html = [];
        $listType = null;
        $paragraph = [];

        $flushParagraph = function () use (&$paragraph, &$html) {
            if ($paragraph) {
                $html[] = '<p>' . bm_markdown_inline(implode(' ', $paragraph)) . '</p>';
                $paragraph = [];
            }
        };
        $closeList = function () use (&$listType, &$html) {
            if ($listType) {
                $html[] = $listType === 'ul' ? '</ul>' : '</ol>';
                $listType = null;
            }
        };

        foreach (explode("\n", $text) as $line) {
            $trimmed = trim($line);

            if ($trimmed === '') {
                $flushParagraph();
                $closeList();
                continue;
            }
            if (preg_match('/^\x00BLOQUE(\d+)\x00$/', $trimmed, $m)) {
                $flushParagraph();
                $closeList();
                $html[] = $blocks[(int)$m[1]];
                continue;
            }
            if (preg_match('/^(#{1,6})\s+(.*)$/', $trimmed, $m)) {
                $flushParagraph();
                $closeList();
                // El h1 de la página es el titular: el contenido empieza en h2
                $level = min(6, max(2, strlen($m[1])));
                $html[] = "<h$level>" . bm_markdown_inline($m[2]) . "</h$level>";
                continue;
            }
            if (preg_match('/^(-{3,}|\*{3,}|_{3,})$/', $trimmed)) {
                $flushParagraph();
                $closeList();
                $html[] = '<hr />';
                continue;
            }
            if (preg_match('/^>\s?(.*)$/', $trimmed, $m)) {
                $flushParagraph();
                $closeList();
                $html[] = '<blockquote><p>' . bm_markdown_inline($m[1]) . '</p></blockquote>';
                continue;
            }
            if (preg_match('/^[-*+]\s+(.*)$/', $trimmed, $m)) {
                $flushParagraph();
                if ($listType !== 'ul') {
                    $closeList();
                    $html[] = '<ul>';
                    $listType = 'ul';
                }
                $html[] = '<li>' . bm_markdown_inline($m[1]) . '</li>';
                continue;
            }
            if (preg_match('/^\d+[.)]\s+(.*)$/', $trimmed, $m)) {
                $flushParagraph();
                if ($listType !== 'ol') {
                    $closeList();
                    $html[] = '<ol>';
                    $listType = 'ol';
                }
                $html[] = '<li>' . bm_markdown_inline($m[1]) . '</li>';
                continue;
            }

            $closeList();
            $paragraph[] = $trimmed;
        }
        $flushParagraph();
        $closeList();

        return implode("\n", $html);
    }

    /** Formato dentro de una línea. El texto se escapa antes de aplicar cualquier etiqueta. */
    function bm_markdown_inline($text) {
        $out = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');

        // Código en línea (se aparta para que no le afecte el resto del formato)
        $codes = [];
        $out = preg_replace_callback('/`([^`]+)`/', function ($m) use (&$codes) {
            $codes[] = '<code>' . $m[1] . '</code>';
            return "\x01" . (count($codes) - 1) . "\x01";
        }, $out);

        // Imágenes y enlaces: solo http(s), mailto y rutas del propio sitio
        $safeUrl = function ($url) {
            $url = html_entity_decode($url, ENT_QUOTES, 'UTF-8');
            $ok = preg_match('#^(https?://|mailto:|/|\#)#i', $url) && !preg_match('/^\s*javascript:/i', $url);
            return $ok ? htmlspecialchars($url, ENT_QUOTES, 'UTF-8') : '#';
        };
        $out = preg_replace_callback('/!\[([^\]]*)\]\(([^)\s]+)\)/', function ($m) use ($safeUrl) {
            return '<img src="' . $safeUrl($m[2]) . '" alt="' . $m[1] . '" loading="lazy" />';
        }, $out);
        $out = preg_replace_callback('/\[([^\]]+)\]\(([^)\s]+)\)/', function ($m) use ($safeUrl) {
            $url = $safeUrl($m[2]);
            $external = preg_match('#^https?://#i', html_entity_decode($url, ENT_QUOTES, 'UTF-8'))
                && strpos($url, 'brandmeisteryv.net') === false;
            return '<a href="' . $url . '"' . ($external ? ' target="_blank" rel="noopener noreferrer"' : '') . '>' . $m[1] . '</a>';
        }, $out);

        $out = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $out);
        $out = preg_replace('/(?<![\w*])\*([^*\n]+)\*(?![\w*])/', '<em>$1</em>', $out);
        $out = preg_replace('/(?<![\w_])_([^_\n]+)_(?![\w_])/', '<em>$1</em>', $out);

        return preg_replace_callback('/\x01(\d+)\x01/', function ($m) use ($codes) {
            return $codes[(int)$m[1]];
        }, $out);
    }

    /** Resumen en texto plano (para meta descripciones) */
    function bm_markdown_excerpt($markdown, $length = 160) {
        $text = trim(preg_replace('/\s+/', ' ', strip_tags(bm_markdown($markdown))));
        return mb_strlen($text) > $length ? mb_substr($text, 0, $length - 1) . '…' : $text;
    }
}
