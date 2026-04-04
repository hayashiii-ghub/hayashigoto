import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');
const publicDir = join(__dirname, '..', 'public');
const masterPath = join(assetsDir, 'brand', 'logo-master.png');
const HERO_WIDTH = 1200;

async function main() {
  const masterBuffer = readFileSync(masterPath);
  const pngBuffer = await sharp(masterBuffer).png().toBuffer();
  const heroPngBuffer = await sharp(pngBuffer)
    .resize({ width: HERO_WIDTH, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(join(publicDir, 'logo.png'), heroPngBuffer);
  await sharp(heroPngBuffer).webp({ quality: 82 }).toFile(join(publicDir, 'logo.webp'));

  const fav32 = await sharp(pngBuffer).resize(32, 32).png().toBuffer();
  writeFileSync(join(publicDir, 'favicon-32x32.png'), fav32);

  const fav16 = await sharp(pngBuffer).resize(16, 16).png().toBuffer();
  const icoBuffer = await toIco([fav16, fav32]);
  writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);

  await sharp(pngBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));

  const [masterMeta, heroMeta] = await Promise.all([
    sharp(pngBuffer).metadata(),
    sharp(heroPngBuffer).metadata(),
  ]);
  console.log('optimize-brand-assets:', {
    master: { width: masterMeta.width, height: masterMeta.height },
    hero: { width: heroMeta.width, height: heroMeta.height },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
