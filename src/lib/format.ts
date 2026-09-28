/** Formate un prix en Ariary avec séparateur de milliers : "45 000 Ar" */
export function formatPrice(price: string | number): string {
  const value = typeof price === "string" ? Number(price) : price;
  return `${new Intl.NumberFormat("fr-FR").format(value)} Ar`;
}
