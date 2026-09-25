import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { sellers, shops } from "../db/schema";
import { getManagedPages, getPageMetrics } from "./facebook";
import { MIN_FOLLOWERS_COUNT } from "./verification-config";

/** Renvoyé quand l'utilisateur gère plusieurs Pages : le front doit lui
 * demander laquelle utiliser comme boutique avant de continuer. */
export class MultiplePagesFoundError extends Error {
  constructor(public pages: { id: string; name: string }[]) {
    super("Plusieurs Pages Facebook trouvées, une sélection est requise");
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface VerifySellerParams {
  /** ID Facebook de la personne connectée (issu du flow OAuth existant) */
  facebookUserId: string;
  /** Jeton d'accès utilisateur obtenu après le login OAuth */
  userAccessToken: string;
  /** ID de la Page choisie, si l'utilisateur en gère plusieurs */
  selectedPageId?: string;
}

/**
 * Point d'entrée appelé juste après le login OAuth Facebook du vendeur.
 * - Vérifie qu'il administre bien une Page (preuve = l'appel /me/accounts)
 * - Applique le critère automatique (followers)
 * - Crée/à jour les lignes `sellers` et `shops`
 *
 * L'ancienneté de la Page n'est pas vérifiable automatiquement (voir
 * verification-config.ts) : un vendeur qui ne passe pas le seuil de
 * followers reste en statut "pending", à traiter dans le back-office admin.
 */
export async function verifySellerFromFacebook({
  facebookUserId,
  userAccessToken,
  selectedPageId,
}: VerifySellerParams) {
  const managedPages = await getManagedPages(userAccessToken);

  if (managedPages.length === 0) {
    throw new Error(
      "Aucune Page Facebook administrée trouvée pour ce compte."
    );
  }

  let page = managedPages[0];
  if (managedPages.length > 1) {
    if (!selectedPageId) {
      throw new MultiplePagesFoundError(
        managedPages.map((p) => ({ id: p.id, name: p.name }))
      );
    }
    const found = managedPages.find((p) => p.id === selectedPageId);
    if (!found) {
      throw new Error(
        "La Page sélectionnée ne fait pas partie des Pages administrées."
      );
    }
    page = found;
  }

  const metrics = await getPageMetrics(page.id, page.accessToken);
  const passesAutoCheck = metrics.followersCount >= MIN_FOLLOWERS_COUNT;

  const now = new Date();

  // 1. upsert du vendeur
  const [seller] = await db
    .insert(sellers)
    .values({
      facebookUserId,
      verificationStatus: passesAutoCheck ? "verified" : "pending",
      lastVerifiedAt: now,
    })
    .onConflictDoUpdate({
      target: sellers.facebookUserId,
      set: {
        verificationStatus: passesAutoCheck ? "verified" : "pending",
        lastVerifiedAt: now,
      },
    })
    .returning();

  // 2. upsert de la boutique liée
  const [shop] = await db
    .insert(shops)
    .values({
      sellerId: seller.id,
      facebookPageId: page.id,
      slug: slugify(page.name),
      displayName: page.name,
      isVerified: passesAutoCheck,
      followersCount: metrics.followersCount,
    })
    .onConflictDoUpdate({
      target: shops.sellerId,
      set: {
        facebookPageId: page.id,
        displayName: page.name,
        isVerified: passesAutoCheck,
        followersCount: metrics.followersCount,
      },
    })
    .returning();

  return { seller, shop, passesAutoCheck };
}

/**
 * A appeler à chaque reconnexion du vendeur (re-check périodique évoqué
 * dans le flow) : reconfirme qu'il administre toujours la Page, sinon
 * rétrograde son statut.
 */
export async function recheckSellerVerification(sellerId: string) {
  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.id, sellerId),
    with: { shop: true },
  });

  if (!seller || !seller.shop) {
    throw new Error("Vendeur ou boutique introuvable pour ce re-check.");
  }

  // NOTE: nécessite de conserver un moyen de ré-obtenir un userAccessToken
  // valide (session active ou refresh) — à brancher sur ta gestion de
  // session existante avant d'appeler getManagedPages ici.
}
