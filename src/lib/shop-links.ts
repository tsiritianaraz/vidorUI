import { formatPrice } from "./format";

interface ProductForMessage {
  name: string;
  size?: string | null;
  price: string | number;
}

/** "Bonjour, je souhaite commander la Robe Bleue, Taille M, au prix de 45 000 Ar" */
export function buildInquiryMessage(product: ProductForMessage): string {
  const sizePart = product.size ? `, Taille ${product.size}` : "";
  return `Bonjour, je souhaite commander ${product.name}${sizePart}, au prix de ${formatPrice(product.price)}`;
}

/** Nécessite un numéro au format international, ex: 261340000000 (sans le +) */
export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

/**
 * NOTE : le paramètre `text` de m.me n'est officiellement garanti que
 * pour les Pages classées "Entreprise" par Meta. Si le message n'apparaît
 * pas pré-rempli pour un vendeur donné, le lien fonctionne quand même
 * (juste sans le texte pré-rempli).
 */
export function buildMessengerLink(facebookPageId: string, message: string): string {
  return `https://m.me/${facebookPageId}?text=${encodeURIComponent(message)}`;
}
