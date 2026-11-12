# Auditoría SEO — brandmeisteryv.net (Fase 1, sin cambios de código)

Fecha: 2026-11-12 · Rama `seo-audit` creada desde `main` (`13fe5f2`, igual a `origin/main`) · Medido sobre `astro build` local (16 páginas) y el sitio en vivo.
Hosting real: **Apache en cPanel**; GitHub Actions compila y publica en la rama `deploy`. `vercel.json` se ignora.

## Seguridad
- No hay credenciales en el árbol: `public/api/config.php` lee `DB_PASS` de variables de entorno. No hay `.env` ni `config.php` con secretos en el historial. La clave `6L…` que aparece en el HTML publicado es la clave **pública** de reCAPTCHA v3.

## Tabla por página (build local)
| Ruta | title | desc | canonical | robots | H1 | H2 | JSON-LD (además de Organization/WebSite) | img sin alt / sin w-h | Contenido sin JS |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 55 | 162 | `/` | index,follow | 1 | 5 | — | 0 / 0 | Sí, pero los **contadores salen en 0** (data-target 734/100/9) |
| `/talkgroups/` | 58 | 165 | ok | index | 1 | 7 | BreadcrumbList | 0 / 0 | Sí (~1380 palabras) |
| `/repetidores/` | 55 | 169 | ok | index | 1 | 1 | RadioStation | 0 / 0 | Parcial (756 palabras; tabla por verificar) |
| `/petra/` | 71 | 185 | ok | index | 1 "Conoce a Petra" | 1 | WebApplication | 0 / 0 | ~350 palabras; datos en vivo por JS |
| `/petra/{734,73411,73452,73473}/` | 63–76 | 150–163 | ok | index | 1 (mismo H1 en las 4) | 1 | sin BreadcrumbList ni WebApplication | 0 / 0 | ~350 palabras |
| `/radioid/` | 58 | 152 | ok | index | 1 | 4 | WebApplication | 0 / 0 | 468 palabras |
| `/generador-csv/` | 57 | **220** | ok | index | 1 | 3 | WebApplication | 0 / 0 | 781 palabras |
| `/comunidad/` | **82** | **191** | ok | index | 1 | 4 | — | 0 / 0 | Sí |
| `/contacto/` | 51 | **178** | ok | index | 1 | 1 | — | 0 / 0 | Sí |
| `/galeria/` | **32** | **120** | ok | index | 1 | 1 | — | 0 / **5** | 267 palabras |
| `/admin/` | 35 | 80 | ok | **index,follow** | **9 H1** | 5 | BreadcrumbList | 0 / 2 | Panel |
| `/plantillas/*` (3) | 15–60 | 20–126 | ok | **index,follow** | 1 (`@@TITULO@@` en una) | — | Organization/Person | 0 / 1 | Plantillas internas |
| `/blog`, `/blog/{slug}` | dinámico (`blog.php`, MySQL) | — | `blog_head()` lo reescribe | — | — | — | BreadcrumbList (en vivo) | — | HTML del servidor (no auditable offline) |

Todas con `lang="es"`, 1 imagen OG y `site` ya definido en `astro.config.mjs`.

## Revisión técnica
| Punto | Estado |
|---|---|
| Output Astro | `static`, `build.format: 'directory'`, CSS inline |
| `site` | Ya es `https://brandmeisteryv.net` ✔ |
| robots.txt | Existe; bloquea `/admin`, `/panel`, `/api/`, `/plantillas/`. **No apunta a `sitemap.xml`** (verificar) |
| sitemap.xml | Manual, **10 URLs**, `lastmod` fijo 2026-09-17, sin artículos del blog, sin `/petra/{tg}` |
| HTTP→HTTPS | 301 correcto ✔ |
| www→apex | **No hay redirección**: `https://www.brandmeisteryv.net/` responde 200 (contenido duplicado indexable) |
| Barra final | `.htaccess` quita la barra en archivos, pero las páginas Astro son directorios con barra; `/` y `/blog` canonical sin barra, el resto con barra |
| `/admin` | Responde 301 → `/admin/`; sin cabecera `X-Robots-Tag`; el HTML compilado dice `index,follow` y tiene 9 H1; solo lo protege el `Disallow` |
| `/plantillas/` | Bloqueado con 403 en `.htaccess` y `Disallow`, pero el HTML compilado dice `index,follow` |
| Compresión | Brotli activo en producción ✔ |
| Caché | HTML `no-cache` (intencional); `/_astro/*` inmutable 1 año ✔; el resto (`/assets/*`) 1 mes sin hash |
| Preload | Fuentes woff2 y hero LCP con `fetchpriority="high"` ✔ |
| HSTS | `max-age=604800` (7 días); el propio comentario pide subirlo a 1 año |
| Footer | Enlace "Login" a `/admin` sin `rel="nofollow"` |
| Enlace wiki | Ya está en el footer, con `noopener noreferrer` ✔ |
| Carrusel equipo | `AboutSection` con animación CSS `translateX(-100%/3)` → contenido triplicado en el DOM, sin `aria-hidden` en los clones |
| Contadores | `Hero`: `hero-counter` con `0` en el HTML; JS los anima |
| JSON-LD | Organization con tipo `AmateurRadioOrganization` en todas las páginas; falta BlogPosting estático (el blog es dinámico), falta Breadcrumb en `/`, home sin `Organization` separada de `WebSite` |
| Iframes | Solo reCAPTCHA (`frame-src google.com`); revisar títulos en el mapa/otros |
| Enlaces internos rotos | No detectados en el build (pendiente verificación curl con servidor local) |

## Lista priorizada
**Alta**
1. Contadores del home en 0 en el HTML inicial (`Hero.astro`).
2. Redirección 301 `www` → apex en `.htaccess`.
3. `/admin/` y `/plantillas/*` con `noindex,nofollow` (meta y `X-Robots-Tag`); un solo H1 en el panel; "Login" con `rel="nofollow"`.
4. Sitemap: incluir artículos del blog (desde BD) y `/petra/{tg}`, con `lastmod` reales; añadir `Sitemap:` a `robots.txt`.
5. Normalizar canonical/barra final (`/blog` vs resto).

**Media**
6. Metadatos fuera de rango: `/galeria` (title 32, desc 120), `/comunidad` (title 82, desc 191), `/generador-csv` (desc 220), `/contacto` (178), `/petra/*` (title 63–76; H1 repetido "Conoce a Petra" → H1 con el TG).
7. Carrusel triplicado: clonar por JS o `aria-hidden` + sin enlaces.
8. JSON-LD: BlogPosting en artículos (en `blog.php`), BreadcrumbList en las demás páginas internas, descripción JSON-LD = meta description.
9. Contenido estático 200–400 palabras y tablas renderizadas en build en `/repetidores` y `/petra/*`.
10. Imágenes de `/galeria` sin width/height (5).

**Baja**
11. Subir HSTS a 1 año, caché larga para `/assets/*` con hash, FAQPage solo con contenido real, borradores en `/drafts`, breadcrumbs visibles, Lighthouse antes/después.

## Pendiente / no verificable aquí
Lighthouse móvil y CWV reales, HTML dinámico del blog sin acceso a MySQL, y el estado de Search Console.
