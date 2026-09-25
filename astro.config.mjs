import { defineConfig } from 'astro/config';
import { spawn } from 'node:child_process';

function phpDevServer() {
  let phpProcess = null;
  return {
    name: 'php-dev-server',
    apply: 'serve',
    configureServer(server) {
      try {
        phpProcess = spawn('php', ['-S', '127.0.0.1:8088', '-t', 'public'], {
          stdio: 'ignore'
        });
        phpProcess.on('error', () => {});
      } catch (_) {}

      const cleanUp = () => {
        if (phpProcess) {
          try { phpProcess.kill(); } catch (_) {}
          phpProcess = null;
        }
      };

      server.httpServer?.on('close', cleanUp);
      process.on('SIGINT', cleanUp);
      process.on('SIGTERM', cleanUp);
      process.on('exit', cleanUp);
    }
  };
}

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
    plugins: [phpDevServer()],
    server: {
      proxy: {
        '/api/petra': {
          target: 'https://petra.brandmeisteryv.net/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/petra/, '')
        },
        '/api/radioid': {
          target: 'https://database.radioid.net/api/dmr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/radioid/, '')
        },
        '/api': {
          target: 'http://127.0.0.1:8088',
          changeOrigin: true
        }
      }
    }
  }
});
