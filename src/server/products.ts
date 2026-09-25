import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { categories, photos, products, shops } from "../db/schema";
import { saveProductPhoto } from "./storage";

export async function listCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export interface CreateProductInput {
  sellerId: string;
  categoryId: string;
  name: string;
  price: number;
  size?: string; // optionnel : certains produits n'ont pas de taille
  stockStatus: "in_stock" | "out_of_stock";
  photoFiles: File[];
}

/**
 * Un vendeur ne peut pas publier de produit tant que sa boutique n'a
 * pas le badge vérifié (décision produit).
 */
export async function createProduct(input: CreateProductInput) {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.sellerId, input.sellerId),
  });

  if (!shop) {
    throw new Error("Aucune boutique associée à ce vendeur.");
  }

  if (!shop.isVerified) {
    throw new Error("Votre boutique doit être vérifiée avant de pouvoir publier des produits.");
  }

  if (!input.name.trim()) {
    throw new Error("Le nom du produit est requis.");
  }

  if (input.price <= 0) {
    throw new Error("Le prix doit être supérieur à zéro.");
  }

  if (input.photoFiles.length === 0) {
    throw new Error("Au moins une photo est requise.");
  }

  // Compression + sauvegarde de chaque photo (voir storage.ts)
  const savedPhotos = await Promise.all(input.photoFiles.map((file) => saveProductPhoto(file)));

  const [product] = await db
    .insert(products)
    .values({
      shopId: shop.id,
      categoryId: input.categoryId,
      name: input.name.trim(),
      price: input.price.toFixed(2),
      size: input.size?.trim() || null,
      stockStatus: input.stockStatus,
    })
    .returning();

  await db.insert(photos).values(
    savedPhotos.map((photo, index) => ({
      productId: product.id,
      url: photo.url,
      position: index,
    })),
  );

  return product;
}
