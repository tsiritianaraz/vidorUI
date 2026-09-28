import { db } from "../db/client";

/**
 * Charge une boutique publique avec tout ce qu'il faut pour la page
 * vitrine : moyens de paiement certifiés, zones de livraison, et
 * uniquement les produits actifs (avec leur catégorie et leurs photos).
 */
export async function getShopBySlug(slug: string) {
  return db.query.shops.findFirst({
    where: (shops, { eq }) => eq(shops.slug, slug),
    with: {
      paymentAccounts: true,
      deliveryZones: true,
      products: {
        where: (products, { eq }) => eq(products.status, "active"),
        with: {
          category: true,
          photos: {
            orderBy: (photos, { asc }) => asc(photos.position),
          },
        },
      },
    },
  });
}
