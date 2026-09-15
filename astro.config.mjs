import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://brandmeisteryv.net',
  output: 'static',
  // Precarga la página de destino al pasar el ratón o tocar un enlace: navegación casi instantánea
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  build: {
    format: 'directory',
    // CSS incrustado en el HTML: la página se pinta con la primera respuesta, sin hojas que bloqueen
    inlineStylesheets: 'always'
  },
  experimental: {
    // Prerenderiza la página de destino (Speculation Rules) para abrirla al instante en Chrome/Edge
    clientPrerender: true
  },
  vite: {
    server: {
      proxy: {
        '/api/petra': {
          target: 'https://petra.brandmeisteryv.net/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/petra/, '')
        }
      }
    }
  }
});
