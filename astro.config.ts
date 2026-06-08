import { defineConfig } from 'astro/config';
import { rehypeBudoux } from './src/integrations/rehype-budoux';

export default defineConfig({
  site: 'https://shigoto.dev',
  trailingSlash: 'never',
  markdown: {
    rehypePlugins: [rehypeBudoux],
  },
  server: {
    port: 4322,
    host: true,
  },
  preview: {
    port: 4323,
    host: true,
  },
});
