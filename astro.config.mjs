import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shigoto.dev',
  server: {
    port: 4322,
    host: true,
  },
  preview: {
    port: 4323,
    host: true,
  },
});
