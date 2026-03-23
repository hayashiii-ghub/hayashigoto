import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    dirName: z.string(),
    year: z.number(),
    role: z.string(),
    stack: z.array(z.string()),
    description: z.string(),
    url: z.string().optional(),
    images: z.array(z.string()).optional(),
    order: z.number(),
  }),
});

export const collections = { works };
