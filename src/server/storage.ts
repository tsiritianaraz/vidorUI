import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * IMPORTANT : implémentation locale, pour développer sans dépendre d'un
 * choix d'hébergement définitif. Le jour où tu passes sur Cloudflare R2
 * (ou un autre stockage objet), c'est CE fichier qu'il faut remplacer —
 * `products.ts` ne connaît que la fonction `saveProductPhoto`, pas les
 * détails d'implémentation.
 */

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_WIDTH_PX = 1200; // largeur suffisante pour une fiche produit, pas plus

export async function saveProductPhoto(file: File): Promise<{ url: string }> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Compression + conversion en WebP : critique pour le contexte malgache
  // (connexions lentes, data chère).
  const compressed = await sharp(buffer)
    .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(UPLOADS_DIR, filename), compressed);

  return { url: `/uploads/products/${filename}` };
}
