import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'corporate-renewal': resolve(__dirname, 'works/corporate-renewal.html'),
        'ec-spa': resolve(__dirname, 'works/ec-spa.html'),
        'brand-site': resolve(__dirname, 'works/brand-site.html'),
        'dashboard': resolve(__dirname, 'works/dashboard.html'),
      },
    },
  },
});
