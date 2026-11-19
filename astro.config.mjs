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

function bundleHoselineDock() {
  return {
    name: 'bundle-hoseline-dock',
    async buildStart() {
      try {
        const esbuild = await import('esbuild');
        await esbuild.build({
          entryPoints: ['src/scripts/hoseline-dock.ts'],
          outfile: 'public/assets/hoseline-dock.js',
          bundle: true,
          minify: true,
          format: 'esm',
          target: 'es2020'
        });
      } catch (err) {
        console.error('[bundle-hoseline-dock] Error:', err);
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://brandmeisteryv.net',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    // CSS incrustado en el HTML: la página se pinta con la primera respuesta, sin hojas que bloqueen
    inlineStylesheets: 'always'
  },
  vite: {
    plugins: [phpDevServer(), bundleHoselineDock()],
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
