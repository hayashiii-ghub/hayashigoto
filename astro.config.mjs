import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shigoto.dev',
  trailingSlash: 'never',
  server: {
    port: 4322,
    host: true,
  },
  preview: {
    port: 4323,
    host: true,
  },
});
