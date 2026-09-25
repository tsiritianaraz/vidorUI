/**
 * Seuils utilisés pour la vérification automatique d'un vendeur.
 * A ajuster une fois qu'on aura du recul sur les vraies Pages des vendeurs.
 */
export const MIN_FOLLOWERS_COUNT = Number(
  process.env.MIN_FOLLOWERS_COUNT ?? 50
);

/**
 * NOTE : l'ancienneté de la Page n'est PAS vérifiable automatiquement
 * (l'API Graph ne fournit pas de date de création pour une Page).
 * Ce critère est donc laissé à l'appréciation de l'admin lors de la
 * revue manuelle, pas encodé ici.
 */
