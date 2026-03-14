import { getCollection } from 'astro:content';

const siteUrl = 'https://shigoto.dev';

function createUrl(path) {
  return new URL(path, siteUrl).toString();
}

export async function GET() {
  const works = await getCollection('works');
  const staticPages = ['/', '/card/', '/works/'];
  const workPages = works.map((work) => `/works/${work.id}/`);
  const urls = [...staticPages, ...workPages];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${createUrl(url)}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
