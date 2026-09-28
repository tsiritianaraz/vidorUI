import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { categories, photos, products, shops } from "../db/schema";
import { saveProductPhoto } from "./storage";

async function requireOwnedProduct(sellerId: string, productId: string) {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.sellerId, sellerId),
  });
  if (!shop) {
    throw new Error("Aucune boutique associée à ce vendeur.");
  }

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.shopId, shop.id)),
  });
  if (!product) {
    throw new Error("Produit introuvable pour cette boutique.");
  }

  return { shop, product };
}

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

/** Tous les produits du vendeur, quel que soit leur statut (actif/inactif). */
export async function listProductsForSeller(sellerId: string) {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.sellerId, sellerId),
  });
  if (!shop) {
    throw new Error("Aucune boutique associée à ce vendeur.");
  }

  return db.query.products.findMany({
    where: eq(products.shopId, shop.id),
    with: {
      category: true,
      photos: {
        orderBy: (photos, { asc }) => asc(photos.position),
      },
    },
    orderBy: (products, { desc }) => desc(products.createdAt),
  });
}

/** Charge un produit avec ses relations, pour préremplir le formulaire d'édition. */
export async function getProductForEdit(sellerId: string, productId: string) {
  await requireOwnedProduct(sellerId, productId);

  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      category: true,
      photos: {
        orderBy: (photos, { asc }) => asc(photos.position),
      },
    },
  });
}

/** Bascule un produit entre actif et inactif (= le retire/remet sur la page vitrine). */
export async function toggleProductStatus(sellerId: string, productId: string) {
  const { product } = await requireOwnedProduct(sellerId, productId);
  const newStatus = product.status === "active" ? "inactive" : "active";

  await db.update(products).set({ status: newStatus }).where(eq(products.id, productId));

  return newStatus;
}

export interface UpdateProductInput {
  categoryId: string;
  name: string;
  price: number;
  size?: string;
  stockStatus: "in_stock" | "out_of_stock";
  /** Nouvelles photos à ajouter (en plus des existantes) */
  newPhotoFiles?: File[];
  /** IDs des photos existantes à supprimer */
  removePhotoIds?: string[];
}

export async function updateProduct(sellerId: string, productId: string, input: UpdateProductInput) {
  await requireOwnedProduct(sellerId, productId);

  if (!input.name.trim()) {
    throw new Error("Le nom du produit est requis.");
  }
  if (input.price <= 0) {
    throw new Error("Le prix doit être supérieur à zéro.");
  }

  await db
    .update(products)
    .set({
      categoryId: input.categoryId,
      name: input.name.trim(),
      price: input.price.toFixed(2),
      size: input.size?.trim() || null,
      stockStatus: input.stockStatus,
    })
    .where(eq(products.id, productId));

  if (input.removePhotoIds && input.removePhotoIds.length > 0) {
    for (const photoId of input.removePhotoIds) {
      // scope à ce produit pour éviter de supprimer la photo d'un autre produit
      await db.delete(photos).where(and(eq(photos.id, photoId), eq(photos.productId, productId)));
    }
  }

  if (input.newPhotoFiles && input.newPhotoFiles.length > 0) {
    const existingCount = await db.query.photos.findMany({
      where: eq(photos.productId, productId),
    });
    const savedPhotos = await Promise.all(input.newPhotoFiles.map((file) => saveProductPhoto(file)));
    await db.insert(photos).values(
      savedPhotos.map((photo, index) => ({
        productId,
        url: photo.url,
        position: existingCount.length + index,
      })),
    );
  }
}
