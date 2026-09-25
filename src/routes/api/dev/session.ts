import { useSession } from "@solidjs/start/http";

interface SessionData {
  sellerId?: string;
}

/**
 * Session chiffrée par cookie, fournie nativement par SolidStart
 * (pas de librairie tierce nécessaire pour ce besoin).
 *
 * Nécessite la variable d'environnement SESSION_SECRET (32+ caractères).
 * Génère-en une avec : openssl rand -base64 32
 */
export function useAppSession() {
  "use server";
  return useSession<SessionData>({
    name: "vidor-session",
    password: process.env.SESSION_SECRET as string,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });
}

/**
 * A appeler à la fin du callback OAuth Facebook, une fois
 * `verifySellerFromFacebook()` terminé avec succès.
 */
export async function setSellerSession(sellerId: string) {
  "use server";
  const session = await useAppSession();
  await session.update({ sellerId });
}

/**
 * Utilisée par les server functions/actions qui doivent savoir
 * quel vendeur est connecté (ex: createProduct).
 * Lève une erreur si personne n'est connecté.
 */
export async function getSellerIdFromSession(): Promise<string> {
  "use server";
  const session = await useAppSession();
  if (!session.data.sellerId) {
    throw new Error("Vous devez être connecté pour effectuer cette action.");
  }
  return session.data.sellerId;
}

export async function logout() {
  "use server";
  const session = await useAppSession();
  await session.clear();
}
