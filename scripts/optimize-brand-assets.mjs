import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');
const publicDir = join(__dirname, '..', 'public');
const masterPath = join(assetsDir, 'brand', 'logo-master.png');
const faviconMasterPath = join(assetsDir, 'brand', 'favicon-master.png');
const HERO_WIDTH = 800;

async function main() {
  if (!existsSync(masterPath) || !existsSync(faviconMasterPath)) {
    console.warn('optimize-brand-assets: brand master images missing — skipping (this is fine for fresh clones).');
    return;
  }
  const masterBuffer = readFileSync(masterPath);
  const pngBuffer = await sharp(masterBuffer).png().toBuffer();
  const heroPngBuffer = await sharp(pngBuffer)
    .resize({ width: HERO_WIDTH, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(join(publicDir, 'logo.png'), heroPngBuffer);
  await sharp(heroPngBuffer).webp({ quality: 82 }).toFile(join(publicDir, 'logo.webp'));

  // ファビコン用マスターは透明パディングをトリムしてから contain で正方形化
  const faviconBuffer = readFileSync(faviconMasterPath);
  const trimmedFavicon = await sharp(faviconBuffer).trim().png().toBuffer();
  const iconResize = { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } };

  const fav32 = await sharp(trimmedFavicon).resize(32, 32, iconResize).png().toBuffer();
  writeFileSync(join(publicDir, 'favicon-32x32.png'), fav32);

  const fav16 = await sharp(trimmedFavicon).resize(16, 16, iconResize).png().toBuffer();
  const icoBuffer = await toIco([fav16, fav32]);
  writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);

  await sharp(trimmedFavicon)
    .resize(180, 180, iconResize)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));

  const [masterMeta, heroMeta, trimmedMeta] = await Promise.all([
    sharp(pngBuffer).metadata(),
    sharp(heroPngBuffer).metadata(),
    sharp(trimmedFavicon).metadata(),
  ]);
  console.log('optimize-brand-assets:', {
    master: { width: masterMeta.width, height: masterMeta.height },
    hero: { width: heroMeta.width, height: heroMeta.height },
    faviconTrimmed: { width: trimmedMeta.width, height: trimmedMeta.height },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
