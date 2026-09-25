const GRAPH_API_VERSION = process.env.FACEBOOK_GRAPH_API_VERSION ?? "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface ManagedPage {
  id: string;
  name: string;
  /** Jeton d'accès propre à la Page (différent du jeton utilisateur) */
  accessToken: string;
}

export interface PageMetrics {
  followersCount: number;
}

/**
 * Liste les Pages que l'utilisateur administre (ou gère avec les droits
 * suffisants). Facebook ne renvoie ici que les Pages sur lesquelles
 * l'utilisateur a un rôle — c'est cet appel qui sert de "preuve" qu'il
 * gère bien la Page, pas un simple champ déclaratif.
 *
 * Nécessite la permission `pages_show_list` accordée lors du login OAuth.
 */
export async function getManagedPages(
  userAccessToken: string
): Promise<ManagedPage[]> {
  const url = new URL(`${GRAPH_API_BASE}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token");
  url.searchParams.set("access_token", userAccessToken);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Échec de récupération des Pages gérées (HTTP ${response.status})`
    );
  }

  const body = (await response.json()) as {
    data: { id: string; name: string; access_token: string }[];
  };

  return body.data.map((page) => ({
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
  }));
}

/**
 * Récupère les métriques publiques d'une Page nécessaires à la
 * vérification automatique (nombre de followers).
 *
 * Nécessite la permission `pages_read_engagement`.
 */
export async function getPageMetrics(
  pageId: string,
  pageAccessToken: string
): Promise<PageMetrics> {
  const url = new URL(`${GRAPH_API_BASE}/${pageId}`);
  url.searchParams.set("fields", "followers_count");
  url.searchParams.set("access_token", pageAccessToken);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Échec de récupération des métriques de la Page (HTTP ${response.status})`
    );
  }

  const body = (await response.json()) as { followers_count?: number };

  return {
    followersCount: body.followers_count ?? 0,
  };
}
