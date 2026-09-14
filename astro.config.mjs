import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://brandmeisteryv.net',
  output: 'static',
  build: {
    format: 'directory'
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
