import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        card: resolve(__dirname, 'card.html'),
        'works-index': resolve(__dirname, 'works/index.html'),
        'corporate-renewal': resolve(__dirname, 'works/corporate-renewal.html'),
        'toban-maker': resolve(__dirname, 'works/toban-maker.html'),
        'brand-site': resolve(__dirname, 'works/brand-site.html'),
        'dashboard': resolve(__dirname, 'works/dashboard.html'),
      },
    },
  },
});
